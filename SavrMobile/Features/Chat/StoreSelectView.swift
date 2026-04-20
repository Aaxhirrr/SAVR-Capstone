import SwiftUI
import MapKit
import CoreLocation

// MARK: - Known Canadian grocery chains
// Logo images: add to Assets.xcassets with names matching each `brand` string below.
// Expected asset names: nofrills, loblaws, walmart, metro, sobeys, freshco, foodbasics, superstore

struct KnownStore: Identifiable {
    let id = UUID()
    let name: String
    let brand: String
    let address: String
    let postalCode: String
    let latitude: Double
    let longitude: Double
    let color: Color
    let initial: String
}

let knownStores: [KnownStore] = [
    KnownStore(name: "No Frills",    brand: "nofrills",    address: "No Frills Canada",           postalCode: "M5V 3A8", latitude: 43.6426, longitude: -79.3871, color: Color(red: 0.98, green: 0.75, blue: 0.05), initial: "NF"),
    KnownStore(name: "Loblaws",      brand: "loblaws",     address: "Loblaws Canada",              postalCode: "M5V 3A8", latitude: 43.6532, longitude: -79.3832, color: Color(red: 0.85, green: 0.10, blue: 0.10), initial: "L"),
    KnownStore(name: "Walmart",      brand: "walmart",     address: "Walmart Canada",              postalCode: "M5V 3A8", latitude: 43.6480, longitude: -79.3920, color: Color(red: 0.07, green: 0.40, blue: 0.75), initial: "W"),
    KnownStore(name: "Metro",        brand: "metro",       address: "Metro Canada",                postalCode: "M5V 3A8", latitude: 43.6510, longitude: -79.3795, color: Color(red: 0.10, green: 0.60, blue: 0.20), initial: "M"),
    KnownStore(name: "Sobeys",       brand: "sobeys",      address: "Sobeys Canada",               postalCode: "M5V 3A8", latitude: 43.6495, longitude: -79.3850, color: Color(red: 0.92, green: 0.35, blue: 0.10), initial: "S"),
    KnownStore(name: "FreshCo",      brand: "freshco",     address: "FreshCo Canada",              postalCode: "M5V 3A8", latitude: 43.6460, longitude: -79.3910, color: Color(red: 0.10, green: 0.55, blue: 0.35), initial: "FC"),
    KnownStore(name: "Food Basics",  brand: "foodbasics",  address: "Food Basics Canada",          postalCode: "M5V 3A8", latitude: 43.6445, longitude: -79.3880, color: Color(red: 0.55, green: 0.10, blue: 0.75), initial: "FB"),
    KnownStore(name: "Superstore",   brand: "superstore",  address: "Real Canadian Superstore",    postalCode: "M5V 3A8", latitude: 43.6520, longitude: -79.3940, color: Color(red: 0.80, green: 0.15, blue: 0.15), initial: "SS"),
]

// MARK: - Location Manager

final class LocationManager: NSObject, ObservableObject, CLLocationManagerDelegate {
    @Published var userLocation: CLLocationCoordinate2D?
    @Published var authStatus: CLAuthorizationStatus = .notDetermined

    private let manager = CLLocationManager()

    override init() {
        super.init()
        manager.delegate = self
        manager.desiredAccuracy = kCLLocationAccuracyHundredMeters
    }

    func requestLocation() {
        let status = manager.authorizationStatus
        authStatus = status
        switch status {
        case .notDetermined:
            manager.requestWhenInUseAuthorization()
        case .authorizedWhenInUse, .authorizedAlways:
            manager.requestLocation()
        default:
            break
        }
    }

    func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        userLocation = locations.last?.coordinate
    }

    func locationManager(_ manager: CLLocationManager, didFailWithError error: Error) {}

    func locationManagerDidChangeAuthorization(_ manager: CLLocationManager) {
        authStatus = manager.authorizationStatus
        if manager.authorizationStatus == .authorizedWhenInUse ||
           manager.authorizationStatus == .authorizedAlways {
            manager.requestLocation()
        }
    }
}

// MARK: - ViewModel

@MainActor
final class StoreSelectViewModel: ObservableObject {
    @Published var savedStores: [UserSavedStore] = []
    @Published var savedStoreIds: [String: Int] = [:]
    @Published var isSaving = false
    @Published var isLoading = false
    @Published var errorMessage: String?
    @Published var highlightedStore: KnownStore?

    private let tokenStore = AuthTokenStore()

    var atLimit: Bool { savedStores.count >= 3 }

    func load() async {
        isLoading = true
        errorMessage = nil
        guard let session = tokenStore.loadSession() else { isLoading = false; return }

        guard let url = URL(string: "https://savr.app/api/user/selected_stores") else { isLoading = false; return }
        var req = URLRequest(url: url)
        req.setValue("Bearer \(session.accessToken)", forHTTPHeaderField: "Authorization")
        req.setValue("application/json", forHTTPHeaderField: "Accept")

        if let (data, _) = try? await URLSession.shared.data(for: req),
           let arr = try? JSONSerialization.jsonObject(with: data) as? [[String: Any]] {
            savedStores = arr.compactMap { d in
                guard let name = d["store_name"] as? String,
                      let addr = d["address"] as? String,
                      let postal = d["postal_code"] as? String else { return nil }
                return UserSavedStore(storeName: name, address: addr, postalCode: postal)
            }
            savedStoreIds = [:]
            for d in arr {
                if let name = d["store_name"] as? String,
                   let id = d["id"] as? Int {
                    let brand = knownStores.first { name.lowercased().contains($0.brand) }?.brand ?? name.lowercased()
                    savedStoreIds[brand] = id
                }
            }
        }
        isLoading = false
    }

    func isSelected(_ store: KnownStore) -> Bool {
        savedStores.contains { $0.storeName.lowercased().contains(store.brand) || $0.storeName.lowercased().contains(store.name.lowercased()) }
    }

    func toggle(_ store: KnownStore) async {
        if isSelected(store) {
            await remove(store)
        } else {
            if atLimit {
                errorMessage = "You can only have 3 stores. Remove one first."
                return
            }
            await add(store)
        }
    }

    private func add(_ store: KnownStore) async {
        guard let session = tokenStore.loadSession() else { return }
        isSaving = true
        errorMessage = nil

        let body: [String: Any] = [
            "store_name": store.name,
            "address": store.address,
            "postal_code": store.postalCode,
            "latitude": store.latitude,
            "longitude": store.longitude,
            "brand": store.brand
        ]

        guard let data = try? JSONSerialization.data(withJSONObject: body),
              let url = URL(string: "https://savr.app/api/user/selected_stores") else {
            isSaving = false; return
        }

        var req = URLRequest(url: url)
        req.httpMethod = "POST"
        req.httpBody = data
        req.timeoutInterval = 10
        req.setValue("Bearer \(session.accessToken)", forHTTPHeaderField: "Authorization")
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        req.setValue("application/json", forHTTPHeaderField: "Accept")

        if let (respData, resp) = try? await URLSession.shared.data(for: req),
           let http = resp as? HTTPURLResponse {
            if http.statusCode < 300 {
                await load()
            } else {
                let msg = (try? JSONSerialization.jsonObject(with: respData) as? [String: Any])?["detail"] as? String
                errorMessage = msg ?? "Failed to add \(store.name)"
            }
        } else {
            errorMessage = "Network error. Try again."
        }
        isSaving = false
    }

    private func remove(_ store: KnownStore) async {
        guard let session = tokenStore.loadSession() else { return }
        isSaving = true
        errorMessage = nil

        guard let storeId = savedStoreIds[store.brand] ?? savedStoreIds.first(where: { $0.key.contains(store.name.lowercased()) })?.value else {
            await load()
            isSaving = false
            return
        }

        guard let url = URL(string: "https://savr.app/api/user/selected_stores/\(storeId)") else {
            isSaving = false; return
        }

        var req = URLRequest(url: url)
        req.httpMethod = "DELETE"
        req.timeoutInterval = 10
        req.setValue("Bearer \(session.accessToken)", forHTTPHeaderField: "Authorization")

        _ = try? await URLSession.shared.data(for: req)
        await load()
        isSaving = false
    }
}

// MARK: - View

struct StoreSelectView: View {
    @StateObject private var viewModel = StoreSelectViewModel()
    @StateObject private var locationManager = LocationManager()

    // Map camera — starts over Canada, moves to user location when available
    @State private var mapPosition: MapCameraPosition = .region(
        MKCoordinateRegion(
            center: CLLocationCoordinate2D(latitude: 56.0, longitude: -96.0),
            span: MKCoordinateSpan(latitudeDelta: 40, longitudeDelta: 40)
        )
    )

    var body: some View {
        ZStack {
            Color(red: 0.97, green: 0.98, blue: 0.97).ignoresSafeArea()

            VStack(spacing: 0) {
                // Header
                headerSection

                // Map
                mapSection
                    .frame(height: 230)

                // Store count bar
                limitBar
                    .padding(.horizontal, 20)
                    .padding(.vertical, 10)

                // Error
                if let error = viewModel.errorMessage {
                    errorBanner(error)
                        .padding(.horizontal, 16)
                        .padding(.bottom, 8)
                }

                // Horizontal store cards
                if viewModel.isLoading {
                    Spacer()
                    ProgressView()
                    Spacer()
                } else {
                    horizontalStoreList
                        .padding(.bottom, 16)
                    Spacer()
                }
            }
        }
        .task {
            await viewModel.load()
            locationManager.requestLocation()
        }
        .onChange(of: locationManager.userLocation) { _, location in
            if let loc = location {
                withAnimation {
                    mapPosition = .region(MKCoordinateRegion(
                        center: loc,
                        span: MKCoordinateSpan(latitudeDelta: 0.15, longitudeDelta: 0.15)
                    ))
                }
            }
        }
    }

    // MARK: - Header

    private var headerSection: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text("My Stores")
                .font(.system(size: 28, weight: .black, design: .rounded))
            Text(viewModel.atLimit
                 ? "You have 3 stores. Remove one to swap."
                 : "Pick up to 3 stores. Prices are compared across them in Flyers.")
                .font(.system(size: 13, weight: .medium))
                .foregroundStyle(.secondary)
                .fixedSize(horizontal: false, vertical: true)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(.horizontal, 20)
        .padding(.top, 16)
        .padding(.bottom, 10)
    }

    // MARK: - Map

    private var mapSection: some View {
        Map(position: $mapPosition) {
            // User location dot
            UserAnnotation()

            // Store pins
            ForEach(knownStores) { store in
                let isSelected = viewModel.isSelected(store)
                let isHighlighted = viewModel.highlightedStore?.id == store.id
                Annotation(store.name, coordinate: CLLocationCoordinate2D(latitude: store.latitude, longitude: store.longitude)) {
                    storePinView(store: store, isSelected: isSelected, isHighlighted: isHighlighted)
                        .onTapGesture {
                            withAnimation(.spring(response: 0.3)) {
                                viewModel.highlightedStore = store
                            }
                            // Fly to pin
                            withAnimation {
                                mapPosition = .region(MKCoordinateRegion(
                                    center: CLLocationCoordinate2D(latitude: store.latitude, longitude: store.longitude),
                                    span: MKCoordinateSpan(latitudeDelta: 0.05, longitudeDelta: 0.05)
                                ))
                            }
                        }
                }
            }
        }
        .mapStyle(.standard(elevation: .flat, pointsOfInterest: .excludingAll))
        .mapControls {
            MapUserLocationButton()
            MapZoomStepper()
        }
        .clipShape(Rectangle())
        .overlay(alignment: .bottomLeading) {
            // Tap hint
            Text("Tap a pin to highlight · Tap a card to select")
                .font(.system(size: 10, weight: .medium))
                .foregroundStyle(.white)
                .padding(.horizontal, 8)
                .padding(.vertical, 4)
                .background(Color.black.opacity(0.45))
                .clipShape(Capsule())
                .padding(10)
        }
    }

    @ViewBuilder
    private func storePinView(store: KnownStore, isSelected: Bool, isHighlighted: Bool) -> some View {
        ZStack {
            Circle()
                .fill(isSelected ? store.color : Color.white)
                .frame(width: isHighlighted ? 40 : 32, height: isHighlighted ? 40 : 32)
                .shadow(color: store.color.opacity(0.5), radius: isHighlighted ? 8 : 4, x: 0, y: 2)
                .overlay(
                    Circle().stroke(isSelected ? Color.white : store.color, lineWidth: 2)
                )

            if UIImage(named: store.brand) != nil {
                Image(store.brand)
                    .resizable()
                    .scaledToFit()
                    .frame(width: isHighlighted ? 24 : 18, height: isHighlighted ? 24 : 18)
            } else {
                Text(store.initial)
                    .font(.system(size: isHighlighted ? 12 : 9, weight: .black, design: .rounded))
                    .foregroundStyle(isSelected ? .white : store.color)
            }
        }
        .animation(.spring(response: 0.3), value: isHighlighted)
        .animation(.spring(response: 0.3), value: isSelected)
    }

    // MARK: - Limit Bar

    private var limitBar: some View {
        HStack(spacing: 8) {
            HStack(spacing: 5) {
                ForEach(0..<3, id: \.self) { i in
                    RoundedRectangle(cornerRadius: 4)
                        .fill(i < viewModel.savedStores.count ? SavrColors.brandGreen : Color(red: 0.88, green: 0.92, blue: 0.88))
                        .frame(height: 5)
                }
            }
            Text("\(viewModel.savedStores.count)/3 selected")
                .font(.system(size: 12, weight: .semibold))
                .foregroundStyle(.secondary)
        }
    }

    // MARK: - Horizontal Store Cards

    private var horizontalStoreList: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 12) {
                ForEach(knownStores) { store in
                    StoreCard(
                        store: store,
                        isSelected: viewModel.isSelected(store),
                        isHighlighted: viewModel.highlightedStore?.id == store.id,
                        isSaving: viewModel.isSaving,
                        atLimit: viewModel.atLimit
                    ) {
                        Task { await viewModel.toggle(store) }
                    }
                    .onTapGesture {
                        // Highlight on map when card tapped
                        withAnimation(.spring(response: 0.3)) {
                            viewModel.highlightedStore = store
                        }
                        withAnimation {
                            mapPosition = .region(MKCoordinateRegion(
                                center: CLLocationCoordinate2D(latitude: store.latitude, longitude: store.longitude),
                                span: MKCoordinateSpan(latitudeDelta: 0.05, longitudeDelta: 0.05)
                            ))
                        }
                    }
                }
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 4)
        }
    }

    // MARK: - Error Banner

    private func errorBanner(_ text: String) -> some View {
        HStack(spacing: 8) {
            Image(systemName: "exclamationmark.circle.fill")
                .foregroundStyle(.orange)
            Text(text)
                .font(.system(size: 13, weight: .medium))
                .foregroundStyle(Color(red: 0.55, green: 0.30, blue: 0.05))
        }
        .padding(12)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color(red: 1.0, green: 0.95, blue: 0.85))
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }
}

// MARK: - Store Card (horizontal)

private struct StoreCard: View {
    let store: KnownStore
    let isSelected: Bool
    let isHighlighted: Bool
    let isSaving: Bool
    let atLimit: Bool
    let onToggle: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            // Logo / initial
            ZStack {
                RoundedRectangle(cornerRadius: 12, style: .continuous)
                    .fill(Color.white)
                    .frame(width: 50, height: 50)
                    .shadow(color: .black.opacity(0.07), radius: 4, x: 0, y: 2)
                if UIImage(named: store.brand) != nil {
                    Image(store.brand)
                        .resizable()
                        .scaledToFit()
                        .frame(width: 36, height: 36)
                } else {
                    ZStack {
                        RoundedRectangle(cornerRadius: 12, style: .continuous)
                            .fill(store.color)
                            .frame(width: 50, height: 50)
                        Text(store.initial)
                            .font(.system(size: store.initial.count > 1 ? 13 : 17, weight: .black, design: .rounded))
                            .foregroundStyle(.white)
                    }
                }
            }

            // Name + status
            VStack(alignment: .leading, spacing: 2) {
                Text(store.name)
                    .font(.system(size: 13, weight: .bold, design: .rounded))
                    .foregroundStyle(Color(red: 0.12, green: 0.20, blue: 0.12))
                    .lineLimit(2)
                    .fixedSize(horizontal: false, vertical: true)
                Text(isSelected ? "Selected" : (atLimit ? "At limit" : "Tap to add"))
                    .font(.system(size: 10))
                    .foregroundStyle(isSelected ? SavrColors.brandGreen : .secondary)
            }

            Spacer()

            // Toggle button
            Button(action: onToggle) {
                if isSaving {
                    ProgressView().scaleEffect(0.75)
                        .frame(maxWidth: .infinity)
                } else {
                    Image(systemName: isSelected ? "checkmark.circle.fill" : "plus.circle.fill")
                        .font(.system(size: 22))
                        .foregroundStyle(isSelected ? SavrColors.brandGreen : (atLimit ? Color(red: 0.80, green: 0.82, blue: 0.80) : store.color))
                        .frame(maxWidth: .infinity)
                }
            }
            .buttonStyle(.plain)
            .disabled(isSaving || (!isSelected && atLimit))
        }
        .padding(12)
        .frame(width: 110, height: 160)
        .background(isSelected ? store.color.opacity(0.07) : Color.white)
        .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: 18, style: .continuous)
                .stroke(
                    isHighlighted ? store.color : (isSelected ? store.color.opacity(0.4) : Color(red: 0.88, green: 0.92, blue: 0.88)),
                    lineWidth: isHighlighted ? 2.5 : 1.5
                )
        )
        .shadow(color: isHighlighted ? store.color.opacity(0.25) : .black.opacity(0.04), radius: isHighlighted ? 10 : 5, x: 0, y: 2)
        .opacity(!isSelected && atLimit ? 0.5 : 1.0)
        .animation(.spring(response: 0.3), value: isHighlighted)
        .animation(.spring(response: 0.3), value: isSelected)
    }
}

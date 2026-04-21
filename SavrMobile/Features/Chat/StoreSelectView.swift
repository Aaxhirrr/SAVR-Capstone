import SwiftUI
import MapKit
import CoreLocation

// MARK: - Known Canadian grocery chains

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

// Real representative HQ/flagship coordinates for each chain
let knownStores: [KnownStore] = [
    KnownStore(name: "No Frills",           brand: "nofrills",           address: "900 Dufferin St",              postalCode: "M6H 4B1", latitude: 43.6607, longitude: -79.4344, color: Color(red: 0.98, green: 0.75, blue: 0.05), initial: "NF"),
    KnownStore(name: "Loblaws",             brand: "loblaws",            address: "500 Lake Shore Blvd W",        postalCode: "M5V 2V9", latitude: 43.6370, longitude: -79.4056, color: Color(red: 0.85, green: 0.10, blue: 0.10), initial: "L"),
    KnownStore(name: "Walmart",             brand: "walmart",            address: "900 Sheppard Ave W",           postalCode: "M3H 2T4", latitude: 43.7518, longitude: -79.4519, color: Color(red: 0.07, green: 0.40, blue: 0.75), initial: "W"),
    KnownStore(name: "Metro",               brand: "metro",              address: "777 Lawrence Ave E",           postalCode: "M3C 1P2", latitude: 43.7257, longitude: -79.3361, color: Color(red: 0.10, green: 0.60, blue: 0.20), initial: "M"),
    KnownStore(name: "Sobeys",              brand: "sobeys",             address: "2600 John St",                 postalCode: "L3R 3W4", latitude: 43.8408, longitude: -79.3377, color: Color(red: 0.92, green: 0.35, blue: 0.10), initial: "S"),
    KnownStore(name: "FreshCo",             brand: "freshco",            address: "1677 Wilson Ave",              postalCode: "M3L 1A5", latitude: 43.7337, longitude: -79.4861, color: Color(red: 0.10, green: 0.55, blue: 0.35), initial: "FC"),
    KnownStore(name: "Food Basics",         brand: "foodbasics",         address: "2150 Dundas St W",             postalCode: "M6R 1X3", latitude: 43.6573, longitude: -79.4533, color: Color(red: 0.55, green: 0.10, blue: 0.75), initial: "FB"),
    KnownStore(name: "Superstore",          brand: "superstore",         address: "3221 Derry Rd W",              postalCode: "L5N 7L7", latitude: 43.6235, longitude: -79.7616, color: Color(red: 0.80, green: 0.15, blue: 0.15), initial: "SS"),
    KnownStore(name: "T&T Supermarket",     brand: "tandt",              address: "222 Cherry St",                postalCode: "M5A 3L2", latitude: 43.6471, longitude: -79.3568, color: Color(red: 0.88, green: 0.10, blue: 0.18), initial: "T&T"),
    KnownStore(name: "Independent Grocer",  brand: "independent",        address: "2881 Bayview Ave",             postalCode: "M2K 1E6", latitude: 43.7717, longitude: -79.3867, color: Color(red: 0.20, green: 0.50, blue: 0.20), initial: "IG"),
    KnownStore(name: "Atlantic Superstore", brand: "atlanticsuperstore",  address: "6169 Lady Hammond Rd",         postalCode: "B3K 2R9", latitude: 44.6680, longitude: -63.6282, color: Color(red: 0.80, green: 0.15, blue: 0.15), initial: "AS"),
    KnownStore(name: "Foodland",            brand: "foodland",           address: "46 Main St S",                 postalCode: "N0B 1M0", latitude: 43.6761, longitude: -80.3786, color: Color(red: 0.10, green: 0.45, blue: 0.80), initial: "FL"),
    KnownStore(name: "Maxi",               brand: "maxi",               address: "7373 Boul Newman",             postalCode: "H8N 1X1", latitude: 45.4571, longitude: -73.6368, color: Color(red: 0.95, green: 0.20, blue: 0.25), initial: "MX"),
]

// MARK: - Location Manager

final class LocationManager: NSObject, ObservableObject, CLLocationManagerDelegate {
    @Published var userLocation: CLLocationCoordinate2D?
    @Published var authStatus: CLAuthorizationStatus = .notDetermined
    @Published var locationVersion: Int = 0

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
        locationVersion += 1
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

    @State private var mapRegion = MKCoordinateRegion(
        center: CLLocationCoordinate2D(latitude: 43.70, longitude: -79.42),
        span: MKCoordinateSpan(latitudeDelta: 0.35, longitudeDelta: 0.35)
    )

    // Track which store card to scroll to
    @State private var scrollToStoreId: UUID?

    var body: some View {
        GeometryReader { geo in
            ZStack(alignment: .top) {
                // Full-screen map as base layer
                mapLayer
                    .ignoresSafeArea()

                // Bottom sheet overlay
                VStack(spacing: 0) {
                    Spacer()
                    bottomSheet
                        .frame(height: geo.size.height * 0.38)
                }
                .ignoresSafeArea(edges: .bottom)

                // Header overlaid on top of map
                headerOverlay
            }
        }
        .task {
            await viewModel.load()
            locationManager.requestLocation()
        }
        .onChange(of: locationManager.locationVersion) { _ in
            if let loc = locationManager.userLocation {
                withAnimation {
                    mapRegion = MKCoordinateRegion(
                        center: loc,
                        span: MKCoordinateSpan(latitudeDelta: 0.12, longitudeDelta: 0.12)
                    )
                }
            }
        }
    }

    // MARK: - Map Layer

    private var mapLayer: some View {
        ZStack(alignment: .bottomTrailing) {
            Map(
                coordinateRegion: $mapRegion,
                showsUserLocation: true,
                annotationItems: knownStores
            ) { store in
                MapAnnotation(coordinate: CLLocationCoordinate2D(latitude: store.latitude, longitude: store.longitude)) {
                    let isSelected = viewModel.isSelected(store)
                    let isHighlighted = viewModel.highlightedStore?.id == store.id
                    storePinView(store: store, isSelected: isSelected, isHighlighted: isHighlighted)
                        .onTapGesture {
                            withAnimation(.spring(response: 0.3)) {
                                viewModel.highlightedStore = store
                            }
                            withAnimation {
                                mapRegion = MKCoordinateRegion(
                                    center: CLLocationCoordinate2D(latitude: store.latitude, longitude: store.longitude),
                                    span: MKCoordinateSpan(latitudeDelta: 0.04, longitudeDelta: 0.04)
                                )
                            }
                            scrollToStoreId = store.id
                        }
                }
            }

            // Zoom controls
            zoomControls
                .padding(.trailing, 12)
                .padding(.bottom, 200) // sit above bottom sheet
        }
    }

    // MARK: - Zoom Controls

    private var zoomControls: some View {
        VStack(spacing: 0) {
            Button {
                withAnimation {
                    mapRegion = MKCoordinateRegion(
                        center: mapRegion.center,
                        span: MKCoordinateSpan(
                            latitudeDelta: max(mapRegion.span.latitudeDelta / 2, 0.005),
                            longitudeDelta: max(mapRegion.span.longitudeDelta / 2, 0.005)
                        )
                    )
                }
            } label: {
                Image(systemName: "plus")
                    .font(.system(size: 16, weight: .semibold))
                    .frame(width: 40, height: 40)
                    .background(.regularMaterial)
                    .foregroundStyle(.primary)
            }

            Divider().frame(width: 40)

            Button {
                withAnimation {
                    mapRegion = MKCoordinateRegion(
                        center: mapRegion.center,
                        span: MKCoordinateSpan(
                            latitudeDelta: min(mapRegion.span.latitudeDelta * 2, 60),
                            longitudeDelta: min(mapRegion.span.longitudeDelta * 2, 60)
                        )
                    )
                }
            } label: {
                Image(systemName: "minus")
                    .font(.system(size: 16, weight: .semibold))
                    .frame(width: 40, height: 40)
                    .background(.regularMaterial)
                    .foregroundStyle(.primary)
            }
        }
        .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
        .shadow(color: .black.opacity(0.15), radius: 6, x: 0, y: 3)
    }

    // MARK: - Store Pin

    @ViewBuilder
    private func storePinView(store: KnownStore, isSelected: Bool, isHighlighted: Bool) -> some View {
        let size: CGFloat = isHighlighted ? 42 : 32
        ZStack {
            Circle()
                .fill(isSelected ? store.color : Color.white)
                .frame(width: size, height: size)
                .shadow(color: store.color.opacity(0.5), radius: isHighlighted ? 8 : 4, x: 0, y: 2)
                .overlay(Circle().stroke(isSelected ? Color.white : store.color, lineWidth: 2))

            if UIImage(named: store.brand) != nil {
                Image(store.brand)
                    .resizable()
                    .scaledToFit()
                    .frame(width: isHighlighted ? 26 : 18, height: isHighlighted ? 26 : 18)
            } else {
                Text(store.initial)
                    .font(.system(size: isHighlighted ? 12 : 9, weight: .black, design: .rounded))
                    .foregroundStyle(isSelected ? .white : store.color)
            }
        }
        .animation(.spring(response: 0.3), value: isHighlighted)
        .animation(.spring(response: 0.3), value: isSelected)
    }

    // MARK: - Header Overlay (floats on top of map)

    private var headerOverlay: some View {
        VStack(spacing: 0) {
            // Glass pill header
            HStack(spacing: 12) {
                VStack(alignment: .leading, spacing: 2) {
                    Text("My Stores")
                        .font(.system(size: 20, weight: .black, design: .rounded))
                        .foregroundStyle(.primary)
                    Text(viewModel.atLimit
                         ? "3/3 selected — remove one to swap"
                         : "Pick up to 3 stores · \(viewModel.savedStores.count)/3 selected")
                        .font(.system(size: 12, weight: .medium))
                        .foregroundStyle(.secondary)
                }
                Spacer()
                // Mini slot indicators
                HStack(spacing: 5) {
                    ForEach(0..<3, id: \.self) { i in
                        Circle()
                            .fill(i < viewModel.savedStores.count ? SavrColors.brandGreen : Color.secondary.opacity(0.3))
                            .frame(width: 8, height: 8)
                    }
                }
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 12)
            .background(.regularMaterial)
            .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
            .shadow(color: .black.opacity(0.1), radius: 8, x: 0, y: 4)
            .padding(.horizontal, 16)
            .padding(.top, 8)

            Spacer()
        }
    }

    // MARK: - Bottom Sheet

    private var bottomSheet: some View {
        VStack(spacing: 0) {
            // Drag handle
            Capsule()
                .fill(Color.secondary.opacity(0.3))
                .frame(width: 36, height: 4)
                .padding(.top, 10)
                .padding(.bottom, 8)

            // Error banner
            if let error = viewModel.errorMessage {
                HStack(spacing: 8) {
                    Image(systemName: "exclamationmark.circle.fill")
                        .foregroundStyle(.orange)
                    Text(error)
                        .font(.system(size: 12, weight: .medium))
                        .foregroundStyle(Color(red: 0.55, green: 0.30, blue: 0.05))
                    Spacer()
                    Button {
                        viewModel.errorMessage = nil
                    } label: {
                        Image(systemName: "xmark")
                            .font(.system(size: 11, weight: .semibold))
                            .foregroundStyle(.secondary)
                    }
                }
                .padding(.horizontal, 14)
                .padding(.vertical, 8)
                .background(Color(red: 1.0, green: 0.95, blue: 0.85))
                .clipShape(RoundedRectangle(cornerRadius: 10))
                .padding(.horizontal, 16)
                .padding(.bottom, 6)
            }

            // Store cards scroll
            if viewModel.isLoading {
                Spacer()
                ProgressView()
                Spacer()
            } else {
                ScrollViewReader { proxy in
                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: 10) {
                            ForEach(knownStores) { store in
                                CompactStoreCard(
                                    store: store,
                                    isSelected: viewModel.isSelected(store),
                                    isHighlighted: viewModel.highlightedStore?.id == store.id,
                                    isSaving: viewModel.isSaving,
                                    atLimit: viewModel.atLimit
                                ) {
                                    Task { await viewModel.toggle(store) }
                                }
                                .id(store.id)
                                .onTapGesture {
                                    withAnimation(.spring(response: 0.3)) {
                                        viewModel.highlightedStore = store
                                    }
                                    withAnimation {
                                        mapRegion = MKCoordinateRegion(
                                            center: CLLocationCoordinate2D(latitude: store.latitude, longitude: store.longitude),
                                            span: MKCoordinateSpan(latitudeDelta: 0.04, longitudeDelta: 0.04)
                                        )
                                    }
                                }
                            }
                        }
                        .padding(.horizontal, 16)
                        .padding(.vertical, 4)
                    }
                    .onChange(of: scrollToStoreId) { id in
                        if let id {
                            withAnimation {
                                proxy.scrollTo(id, anchor: .center)
                            }
                            scrollToStoreId = nil
                        }
                    }
                }
            }

            Spacer(minLength: 0)
        }
        .background(.regularMaterial)
        .clipShape(RoundedRectangle(cornerRadius: 24, style: .continuous))
        .shadow(color: .black.opacity(0.12), radius: 20, x: 0, y: -4)
    }
}

// MARK: - Compact Store Card

private struct CompactStoreCard: View {
    let store: KnownStore
    let isSelected: Bool
    let isHighlighted: Bool
    let isSaving: Bool
    let atLimit: Bool
    let onToggle: () -> Void

    var body: some View {
        HStack(spacing: 10) {
            // Logo / initial badge
            ZStack {
                RoundedRectangle(cornerRadius: 10, style: .continuous)
                    .fill(Color.white)
                    .frame(width: 44, height: 44)
                    .shadow(color: .black.opacity(0.06), radius: 3, x: 0, y: 1)
                if UIImage(named: store.brand) != nil {
                    Image(store.brand)
                        .resizable()
                        .scaledToFit()
                        .frame(width: 32, height: 32)
                } else {
                    ZStack {
                        RoundedRectangle(cornerRadius: 10, style: .continuous)
                            .fill(store.color)
                            .frame(width: 44, height: 44)
                        Text(store.initial)
                            .font(.system(size: store.initial.count > 2 ? 11 : 13, weight: .black, design: .rounded))
                            .foregroundStyle(.white)
                    }
                }
            }

            // Name
            VStack(alignment: .leading, spacing: 2) {
                Text(store.name)
                    .font(.system(size: 13, weight: .bold, design: .rounded))
                    .foregroundStyle(.primary)
                    .lineLimit(1)
                Text(isSelected ? "Selected" : (atLimit ? "At limit" : "Tap to add"))
                    .font(.system(size: 10, weight: .medium))
                    .foregroundStyle(isSelected ? SavrColors.brandGreen : .secondary)
            }

            Spacer(minLength: 4)

            // Toggle button
            Button(action: onToggle) {
                if isSaving {
                    ProgressView()
                        .frame(width: 28, height: 28)
                } else {
                    Image(systemName: isSelected ? "checkmark.circle.fill" : "plus.circle.fill")
                        .font(.system(size: 26))
                        .foregroundStyle(
                            isSelected
                                ? SavrColors.brandGreen
                                : (!isSelected && atLimit ? Color.secondary.opacity(0.4) : store.color)
                        )
                }
            }
            .buttonStyle(.plain)
            .disabled(isSaving || (!isSelected && atLimit))
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 10)
        .frame(width: 220)
        .background(
            RoundedRectangle(cornerRadius: 16, style: .continuous)
                .fill(isSelected ? store.color.opacity(0.08) : Color(UIColor.secondarySystemGroupedBackground))
        )
        .overlay(
            RoundedRectangle(cornerRadius: 16, style: .continuous)
                .stroke(
                    isHighlighted ? store.color : (isSelected ? store.color.opacity(0.35) : Color.clear),
                    lineWidth: isHighlighted ? 2 : 1.5
                )
        )
        .shadow(color: isHighlighted ? store.color.opacity(0.2) : .black.opacity(0.04), radius: isHighlighted ? 8 : 3, x: 0, y: 2)
        .opacity(!isSelected && atLimit ? 0.55 : 1.0)
        .animation(.spring(response: 0.3), value: isHighlighted)
        .animation(.spring(response: 0.3), value: isSelected)
    }
}

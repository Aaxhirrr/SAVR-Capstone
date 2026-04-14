import SwiftUI

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

let knownStores: [KnownStore] = [
    KnownStore(name: "No Frills", brand: "nofrills", address: "No Frills Canada", postalCode: "M5V 3A8", latitude: 43.6426, longitude: -79.3871, color: Color(red: 0.98, green: 0.75, blue: 0.05), initial: "NF"),
    KnownStore(name: "Loblaws", brand: "loblaws", address: "Loblaws Canada", postalCode: "M5V 3A8", latitude: 43.6532, longitude: -79.3832, color: Color(red: 0.85, green: 0.10, blue: 0.10), initial: "L"),
    KnownStore(name: "Walmart", brand: "walmart", address: "Walmart Canada", postalCode: "M5V 3A8", latitude: 43.6480, longitude: -79.3920, color: Color(red: 0.07, green: 0.40, blue: 0.75), initial: "W"),
    KnownStore(name: "Metro", brand: "metro", address: "Metro Canada", postalCode: "M5V 3A8", latitude: 43.6510, longitude: -79.3795, color: Color(red: 0.10, green: 0.60, blue: 0.20), initial: "M"),
    KnownStore(name: "Sobeys", brand: "sobeys", address: "Sobeys Canada", postalCode: "M5V 3A8", latitude: 43.6495, longitude: -79.3850, color: Color(red: 0.92, green: 0.35, blue: 0.10), initial: "S"),
    KnownStore(name: "FreshCo", brand: "freshco", address: "FreshCo Canada", postalCode: "M5V 3A8", latitude: 43.6460, longitude: -79.3910, color: Color(red: 0.10, green: 0.55, blue: 0.35), initial: "FC"),
    KnownStore(name: "Food Basics", brand: "foodbasics", address: "Food Basics Canada", postalCode: "M5V 3A8", latitude: 43.6445, longitude: -79.3880, color: Color(red: 0.55, green: 0.10, blue: 0.75), initial: "FB"),
    KnownStore(name: "Superstore", brand: "superstore", address: "Real Canadian Superstore", postalCode: "M5V 3A8", latitude: 43.6520, longitude: -79.3940, color: Color(red: 0.80, green: 0.15, blue: 0.15), initial: "SS"),
]

// MARK: - ViewModel

@MainActor
final class StoreSelectViewModel: ObservableObject {
    @Published var savedStores: [UserSavedStore] = []
    @Published var savedStoreIds: [String: Int] = [:] // brand -> backend ID
    @Published var isSaving = false
    @Published var isLoading = false
    @Published var errorMessage: String?

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

        // Find the backend ID
        guard let storeId = savedStoreIds[store.brand] ?? savedStoreIds.first(where: { $0.key.contains(store.name.lowercased()) })?.value else {
            // Refetch to get IDs
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

    var body: some View {
        ZStack {
            Color(red: 0.97, green: 0.98, blue: 0.97).ignoresSafeArea()

            ScrollView {
                VStack(alignment: .leading, spacing: 0) {
                    // Header
                    VStack(alignment: .leading, spacing: 6) {
                        Text("My Stores")
                            .font(.system(size: 28, weight: .black, design: .rounded))
                        Text(viewModel.atLimit
                             ? "You have 3 stores. Remove one to swap."
                             : "Pick up to 3 stores. Prices are compared across them in Flyers.")
                            .font(.system(size: 14, weight: .medium))
                            .foregroundStyle(.secondary)
                            .fixedSize(horizontal: false, vertical: true)
                    }
                    .padding(.horizontal, 20)
                    .padding(.top, 20)
                    .padding(.bottom, 16)

                    // Error
                    if let error = viewModel.errorMessage {
                        HStack(spacing: 8) {
                            Image(systemName: "exclamationmark.circle.fill")
                                .foregroundStyle(.orange)
                            Text(error)
                                .font(.system(size: 13, weight: .medium))
                                .foregroundStyle(Color(red: 0.55, green: 0.30, blue: 0.05))
                        }
                        .padding(12)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .background(Color(red: 1.0, green: 0.95, blue: 0.85))
                        .clipShape(RoundedRectangle(cornerRadius: 12))
                        .padding(.horizontal, 16)
                        .padding(.bottom, 12)
                    }

                    if viewModel.isLoading {
                        HStack { Spacer(); ProgressView(); Spacer() }.padding(.top, 40)
                    } else {
                        // Limit bar
                        limitBar
                            .padding(.horizontal, 20)
                            .padding(.bottom, 20)

                        LazyVStack(spacing: 10) {
                            ForEach(knownStores) { store in
                                StoreRow(
                                    store: store,
                                    isSelected: viewModel.isSelected(store),
                                    isSaving: viewModel.isSaving,
                                    atLimit: viewModel.atLimit
                                ) {
                                    Task { await viewModel.toggle(store) }
                                }
                                .padding(.horizontal, 16)
                            }
                        }
                        .padding(.bottom, 30)
                    }
                }
            }
        }
        .task { await viewModel.load() }
        .refreshable { await viewModel.load() }
    }

    private var limitBar: some View {
        HStack(spacing: 6) {
            ForEach(0..<3, id: \.self) { i in
                RoundedRectangle(cornerRadius: 4)
                    .fill(i < viewModel.savedStores.count ? SavrColors.brandGreen : Color(red: 0.88, green: 0.92, blue: 0.88))
                    .frame(height: 6)
            }
        }
    }
}

// MARK: - Store Row

private struct StoreRow: View {
    let store: KnownStore
    let isSelected: Bool
    let isSaving: Bool
    let atLimit: Bool
    let onTap: () -> Void

    var body: some View {
        Button(action: onTap) {
            HStack(spacing: 14) {
                // Store logo
                ZStack {
                    RoundedRectangle(cornerRadius: 12, style: .continuous)
                        .fill(Color.white)
                        .frame(width: 46, height: 46)
                        .shadow(color: .black.opacity(0.08), radius: 4, x: 0, y: 2)
                    if UIImage(named: store.brand) != nil {
                        Image(store.brand)
                            .resizable()
                            .scaledToFit()
                            .frame(width: 34, height: 34)
                    } else {
                        ZStack {
                            RoundedRectangle(cornerRadius: 12, style: .continuous)
                                .fill(store.color)
                                .frame(width: 46, height: 46)
                            Text(store.initial)
                                .font(.system(size: store.initial.count > 1 ? 13 : 17, weight: .black, design: .rounded))
                                .foregroundStyle(.white)
                        }
                    }
                }

                VStack(alignment: .leading, spacing: 2) {
                    Text(store.name)
                        .font(.system(size: 16, weight: .bold, design: .rounded))
                        .foregroundStyle(Color(red: 0.12, green: 0.20, blue: 0.12))
                    Text(isSelected ? "Tap to remove" : (atLimit ? "Remove a store first" : "Tap to add"))
                        .font(.system(size: 12))
                        .foregroundStyle(.secondary)
                }

                Spacer()

                if isSaving {
                    ProgressView().scaleEffect(0.8)
                } else if isSelected {
                    Image(systemName: "checkmark.circle.fill")
                        .font(.system(size: 26))
                        .foregroundStyle(SavrColors.brandGreen)
                } else {
                    Image(systemName: "plus.circle.fill")
                        .font(.system(size: 26))
                        .foregroundStyle(atLimit ? Color(red: 0.80, green: 0.82, blue: 0.80) : store.color)
                }
            }
            .padding(14)
            .background(isSelected ? store.color.opacity(0.07) : Color.white)
            .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: 16, style: .continuous)
                    .stroke(isSelected ? store.color.opacity(0.4) : Color(red: 0.88, green: 0.92, blue: 0.88), lineWidth: 1.5)
            )
            .shadow(color: .black.opacity(0.03), radius: 5, x: 0, y: 2)
            .opacity(!isSelected && atLimit ? 0.5 : 1.0)
        }
        .buttonStyle(.plain)
        .disabled(isSaving)
    }
}

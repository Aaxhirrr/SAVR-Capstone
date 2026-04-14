import SwiftUI

// MARK: - Models

struct NoFrillsProduct: Decodable, Identifiable {
    var id: String { "\(name)-\(price ?? "")-\(store ?? "")" }
    let brand: String?
    let name: String
    let price: String?
    let size: String?
    let pricePerUnit: String?
    let store: String?

    init(brand: String?, name: String, price: String?, size: String?, pricePerUnit: String?, store: String? = nil) {
        self.brand = brand; self.name = name; self.price = price
        self.size = size; self.pricePerUnit = pricePerUnit; self.store = store
    }

    private enum CodingKeys: String, CodingKey {
        case brand, name, price, size, store
        case pricePerUnit
    }
}

// Cross-store comparison for a single item
struct ItemComparison: Identifiable {
    let id = UUID()
    let itemName: String
    let storeResults: [StoreResult]

    struct StoreResult: Identifiable {
        let id = UUID()
        let storeName: String
        let product: NoFrillsProduct?
    }

    var cheapestStore: StoreResult? {
        storeResults
            .filter { $0.product?.price != nil }
            .min {
                priceValue($0.product?.price) < priceValue($1.product?.price)
            }
    }

    var hasPrices: Bool { storeResults.contains { $0.product != nil } }
}

private func priceValue(_ str: String?) -> Double {
    guard let s = str else { return Double.infinity }
    let cleaned = s.replacingOccurrences(of: "$", with: "")
                   .replacingOccurrences(of: ",", with: "")
                   .trimmingCharacters(in: .whitespaces)
    return Double(cleaned) ?? Double.infinity
}

// Latest search response
struct LatestSearchResponse: Decodable {
    let results: [String: [String: [NoFrillsProduct]]]? // item -> store -> products
    let status: String?

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        status = try container.decodeIfPresent(String.self, forKey: .status)
        // results is a dict of item_name -> { store_name -> [products] }
        results = try container.decodeIfPresent([String: [String: [NoFrillsProduct]]].self, forKey: .results)
    }

    private enum CodingKeys: String, CodingKey {
        case results, status
    }
}

// User's saved store
struct UserSavedStore: Decodable {
    let storeName: String
    let address: String
    let postalCode: String

    private enum CodingKeys: String, CodingKey {
        case storeName = "store_name"
        case address
        case postalCode = "postal_code"
    }
}

// Price check response
struct PriceCheckResponse: Decodable {
    let sessionId: String?
    let message: String?

    private enum CodingKeys: String, CodingKey {
        case sessionId = "session_id"
        case message
    }
}

// MARK: - ViewModel

@MainActor
final class FlyersViewModel: ObservableObject {
    @Published var comparisons: [ItemComparison] = []
    @Published var isLoading = false
    @Published var isSearching = false
    @Published var errorMessage: String?
    @Published var listName: String = ""
    @Published var savedStores: [UserSavedStore] = []
    @Published var selectedList: GroceryList?

    private let tokenStore = AuthTokenStore()
    private let listService = GroceryListService()

    var allStoreNames: [String] {
        Array(Set(comparisons.flatMap { $0.storeResults.map { $0.storeName } })).sorted()
    }

    func load() async {
        isLoading = true
        errorMessage = nil
        comparisons = []

        guard let session = tokenStore.loadSession() else {
            errorMessage = "Not signed in."
            isLoading = false
            return
        }

        let headers = ["Authorization": "Bearer \(session.accessToken)", "Accept": "application/json"]

        // 1. Get saved stores
        if let stores = try? await fetchSavedStores(headers: headers) {
            savedStores = stores
        }

        // 2. Get grocery lists
        guard let lists = try? await listService.fetchAllLists(), let list = lists.first(where: { !$0.items.isEmpty }) else {
            errorMessage = "No grocery lists found. Build one in the chat first."
            isLoading = false
            return
        }
        selectedList = list
        listName = list.name

        // 3. Check if we already have search results
        if let existing = await fetchLatestSearch(listId: list.id, headers: headers) {
            comparisons = existing
            isLoading = false
            return
        }

        // 4. No results yet — trigger a price search
        if savedStores.isEmpty {
            errorMessage = "No stores saved. Go to Preferences to pick your stores."
            isLoading = false
            return
        }

        isLoading = false
        await triggerSearch(list: list, headers: headers)
    }

    func triggerSearch(list: GroceryList, headers: [String: String]) async {
        isSearching = true
        errorMessage = nil

        guard let session = tokenStore.loadSession() else { return }
        let authHeaders = ["Authorization": "Bearer \(session.accessToken)", "Content-Type": "application/json", "Accept": "application/json"]

        let storePayload = savedStores.map { s in
            ["store_name": s.storeName, "postal_code": s.postalCode, "address": s.address]
        }
        let products = list.items.prefix(10).map { $0.name }
        let body: [String: Any] = ["stores": storePayload, "products": Array(products), "list_id": list.id]

        guard let data = try? JSONSerialization.data(withJSONObject: body),
              let url = URL(string: "https://savr.app/api/check_prices") else {
            isSearching = false
            return
        }

        var req = URLRequest(url: url)
        req.httpMethod = "POST"
        req.httpBody = data
        req.timeoutInterval = 30
        for (k, v) in authHeaders { req.setValue(v, forHTTPHeaderField: k) }

        guard let (_, resp) = try? await URLSession.shared.data(for: req),
              let http = resp as? HTTPURLResponse, http.statusCode < 300 else {
            errorMessage = "Price search failed. Try again later."
            isSearching = false
            return
        }

        // Poll for results up to 30 seconds
        let pollHeaders = ["Authorization": "Bearer \(session.accessToken)", "Accept": "application/json"]
        for _ in 0..<10 {
            try? await Task.sleep(nanoseconds: 3_000_000_000)
            if let results = await fetchLatestSearch(listId: list.id, headers: pollHeaders) {
                comparisons = results
                isSearching = false
                return
            }
        }

        errorMessage = "Search timed out. Pull to refresh in a moment."
        isSearching = false
    }

    private func fetchSavedStores(headers: [String: String]) async throws -> [UserSavedStore] {
        return try await APIClient.shared.send(path: "user/selected_stores", method: "GET", headers: headers)
    }

    private func fetchLatestSearch(listId: String, headers: [String: String]) async -> [ItemComparison]? {
        guard let url = URL(string: "https://savr.app/api/lists/\(listId)/latest-search") else { return nil }
        var req = URLRequest(url: url)
        req.timeoutInterval = 10
        for (k, v) in headers { req.setValue(v, forHTTPHeaderField: k) }
        guard let (data, _) = try? await URLSession.shared.data(for: req) else { return nil }

        // The results field is: { "item_name": { "store_name": [products] } }
        guard let raw = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
              let resultsRaw = raw["results"] as? [String: Any], !resultsRaw.isEmpty else { return nil }

        let storeNames = Array(Set(resultsRaw.values.compactMap { $0 as? [String: Any] }.flatMap { $0.keys })).sorted()

        var comps: [ItemComparison] = []
        for (itemName, storeDict) in resultsRaw {
            guard let storeMap = storeDict as? [String: Any] else { continue }
            var storeResults: [ItemComparison.StoreResult] = []
            for storeName in storeNames {
                if let productsRaw = storeMap[storeName] as? [[String: Any]], let first = productsRaw.first {
                    let product = NoFrillsProduct(
                        brand: first["brand"] as? String,
                        name: first["name"] as? String ?? itemName,
                        price: first["price"] as? String,
                        size: first["size"] as? String,
                        pricePerUnit: first["pricePerUnit"] as? String,
                        store: storeName
                    )
                    storeResults.append(.init(storeName: storeName, product: product))
                } else {
                    storeResults.append(.init(storeName: storeName, product: nil))
                }
            }
            if storeResults.contains(where: { $0.product != nil }) {
                comps.append(ItemComparison(itemName: itemName, storeResults: storeResults))
            }
        }
        return comps.isEmpty ? nil : comps.sorted { $0.itemName < $1.itemName }
    }
}

// MARK: - View

struct FlyersView: View {
    @StateObject private var viewModel = FlyersViewModel()

    var body: some View {
        ZStack {
            Color(red: 0.97, green: 0.98, blue: 0.97).ignoresSafeArea()

            if viewModel.isLoading {
                loadingView
            } else if viewModel.isSearching {
                searchingView
            } else if !viewModel.comparisons.isEmpty {
                resultsView
            } else {
                emptyState
            }
        }
        .task { await viewModel.load() }
        .refreshable { await viewModel.load() }
    }

    // MARK: - States

    private var loadingView: some View {
        VStack(spacing: 16) {
            ProgressView().scaleEffect(1.3)
            Text("Loading prices...").foregroundStyle(.secondary)
        }
    }

    private var searchingView: some View {
        VStack(spacing: 20) {
            ProgressView().scaleEffect(1.5)
            Text("Searching prices across your stores...")
                .font(.system(size: 16, weight: .semibold, design: .rounded))
                .foregroundStyle(Color(red: 0.10, green: 0.30, blue: 0.16))
                .multilineTextAlignment(.center)
                .padding(.horizontal, 40)
            Text("This takes about 20-30 seconds")
                .font(.caption)
                .foregroundStyle(.secondary)
        }
    }

    private var emptyState: some View {
        VStack(spacing: 16) {
            Image(systemName: "tag.slash")
                .font(.system(size: 48, weight: .bold))
                .foregroundStyle(Color(red: 0.60, green: 0.65, blue: 0.60))

            Text("Price Comparison")
                .font(.system(size: 26, weight: .black, design: .rounded))

            if let error = viewModel.errorMessage {
                Text(error)
                    .foregroundStyle(.secondary)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 36)
            }

            if let list = viewModel.selectedList, !viewModel.savedStores.isEmpty {
                Button {
                    Task { await viewModel.load() }
                } label: {
                    Text("Search Prices Now")
                        .font(.system(size: 16, weight: .bold, design: .rounded))
                        .foregroundStyle(.white)
                        .padding(.horizontal, 28)
                        .padding(.vertical, 14)
                        .background(SavrColors.brandGreen)
                        .clipShape(Capsule())
                }
            }
        }
    }

    // MARK: - Results

    private var resultsView: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 0) {
                // Header
                VStack(alignment: .leading, spacing: 4) {
                    Text("Price Comparison")
                        .font(.system(size: 26, weight: .black, design: .rounded))
                    Text("Best deals for \"\(viewModel.listName)\"")
                        .font(.system(size: 14, weight: .medium))
                        .foregroundStyle(.secondary)
                }
                .padding(.horizontal, 20)
                .padding(.top, 20)
                .padding(.bottom, 4)

                // Store legend
                storeLegend
                    .padding(.horizontal, 20)
                    .padding(.bottom, 16)

                // Item comparison rows
                LazyVStack(spacing: 12) {
                    ForEach(viewModel.comparisons) { item in
                        ItemComparisonRow(comparison: item, allStores: viewModel.allStoreNames)
                            .padding(.horizontal, 16)
                    }
                }
                .padding(.bottom, 30)
            }
        }
    }

    private var storeLegend: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
                ForEach(Array(viewModel.allStoreNames.enumerated()), id: \.offset) { idx, store in
                    HStack(spacing: 5) {
                        Circle()
                            .fill(storeColor(idx))
                            .frame(width: 8, height: 8)
                        Text(store)
                            .font(.system(size: 12, weight: .semibold))
                            .foregroundStyle(Color(red: 0.25, green: 0.30, blue: 0.25))
                    }
                    .padding(.horizontal, 10)
                    .padding(.vertical, 6)
                    .background(.white)
                    .clipShape(Capsule())
                    .overlay(Capsule().stroke(storeColor(idx).opacity(0.4), lineWidth: 1))
                }
            }
        }
    }
}

// MARK: - Item Row

private struct ItemComparisonRow: View {
    let comparison: ItemComparison
    let allStores: [String]

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            // Item name + cheapest badge
            HStack {
                Text(comparison.itemName)
                    .font(.system(size: 16, weight: .bold, design: .rounded))
                    .foregroundStyle(Color(red: 0.10, green: 0.20, blue: 0.10))

                Spacer()

                if let cheapest = comparison.cheapestStore {
                    HStack(spacing: 4) {
                        Image(systemName: "tag.fill")
                            .font(.system(size: 10))
                        Text("Best: \(cheapest.storeName.components(separatedBy: " ").first ?? cheapest.storeName)")
                            .font(.system(size: 11, weight: .bold))
                    }
                    .foregroundStyle(.white)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 4)
                    .background(SavrColors.brandGreen)
                    .clipShape(Capsule())
                }
            }

            // Store price columns
            HStack(spacing: 8) {
                ForEach(Array(allStores.enumerated()), id: \.offset) { idx, storeName in
                    let result = comparison.storeResults.first { $0.storeName == storeName }
                    StorePriceCell(
                        storeName: storeName,
                        product: result?.product,
                        color: storeColor(idx),
                        isCheapest: comparison.cheapestStore?.storeName == storeName
                    )
                }
            }
        }
        .padding(14)
        .background(.white)
        .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: 16, style: .continuous)
                .stroke(Color(red: 0.88, green: 0.92, blue: 0.88), lineWidth: 1)
        )
        .shadow(color: .black.opacity(0.04), radius: 6, x: 0, y: 2)
    }
}

// MARK: - Store Price Cell

private struct StorePriceCell: View {
    let storeName: String
    let product: NoFrillsProduct?
    let color: Color
    let isCheapest: Bool

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            // Store name
            Text(storeName.components(separatedBy: " ").first ?? storeName)
                .font(.system(size: 10, weight: .bold))
                .foregroundStyle(color)
                .lineLimit(1)

            if let p = product {
                // Price
                Text(p.price ?? "—")
                    .font(.system(size: 15, weight: .black, design: .rounded))
                    .foregroundStyle(isCheapest ? SavrColors.brandGreen : Color(red: 0.15, green: 0.20, blue: 0.15))

                // Size
                if let size = p.size, !size.isEmpty {
                    Text(size)
                        .font(.system(size: 10))
                        .foregroundStyle(.secondary)
                        .lineLimit(1)
                }
            } else {
                Text("—")
                    .font(.system(size: 14, weight: .medium))
                    .foregroundStyle(Color(red: 0.75, green: 0.75, blue: 0.75))
                Text("Not found")
                    .font(.system(size: 9))
                    .foregroundStyle(.secondary)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(10)
        .background(isCheapest ? SavrColors.brandGreen.opacity(0.08) : Color(red: 0.97, green: 0.98, blue: 0.97))
        .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: 10, style: .continuous)
                .stroke(isCheapest ? SavrColors.brandGreen.opacity(0.3) : Color.clear, lineWidth: 1.5)
        )
    }
}

// MARK: - Helpers

private func storeColor(_ index: Int) -> Color {
    let colors: [Color] = [
        Color(red: 0.12, green: 0.67, blue: 0.28),
        Color(red: 0.20, green: 0.40, blue: 0.85),
        Color(red: 0.90, green: 0.45, blue: 0.10),
    ]
    return colors[index % colors.count]
}

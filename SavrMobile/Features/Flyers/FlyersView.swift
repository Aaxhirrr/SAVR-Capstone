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
    let results: [String: [String: [NoFrillsProduct]]]?
    let status: String?

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        status = try container.decodeIfPresent(String.self, forKey: .status)
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
    @Published var selectedStoreName: String = ""   // which store tab is active
    @Published var searchText: String = ""

    private let tokenStore = AuthTokenStore()
    private let listService = GroceryListService()

    /// All unique chain names from comparisons
    var allStoreNames: [String] {
        if !savedStores.isEmpty {
            return Array(Set(savedStores.map { cleanStoreName($0.storeName) })).sorted()
        }
        let raw = comparisons.flatMap { $0.storeResults.map { $0.storeName } }
        return Array(Set(raw.map { cleanStoreName($0) })).sorted()
    }

    /// Items for the active store tab, filtered by search
    var displayedItems: [FlyerItem] {
        var items: [FlyerItem] = []
        for comp in comparisons {
            guard let result = comp.storeResults.first(where: { $0.storeName == selectedStoreName }),
                  let product = result.product else { continue }
            let isCheapest = comp.cheapestStore?.storeName == selectedStoreName
            items.append(FlyerItem(
                itemName: comp.itemName,
                product: product,
                isCheapest: isCheapest,
                storeName: selectedStoreName
            ))
        }
        if searchText.isEmpty { return items.sorted { $0.itemName < $1.itemName } }
        return items
            .filter { $0.itemName.localizedCaseInsensitiveContains(searchText) || ($0.product.brand ?? "").localizedCaseInsensitiveContains(searchText) }
            .sorted { $0.itemName < $1.itemName }
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

        if let stores = try? await fetchSavedStores(headers: headers) {
            savedStores = stores
            if selectedStoreName.isEmpty, let first = allStoreNames.first {
                selectedStoreName = first
            }
        }

        guard let lists = try? await listService.fetchAllLists(), let list = lists.first(where: { !$0.items.isEmpty }) else {
            errorMessage = "No grocery lists found. Build one in the chat first."
            isLoading = false
            return
        }
        selectedList = list
        listName = list.name

        if let existing = await fetchLatestSearch(listId: list.id, headers: headers) {
            comparisons = existing
            if selectedStoreName.isEmpty, let first = allStoreNames.first {
                selectedStoreName = first
            }
            isLoading = false
            return
        }

        if savedStores.isEmpty {
            errorMessage = "No stores saved. Go to Stores to pick your stores."
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

        let pollHeaders = ["Authorization": "Bearer \(session.accessToken)", "Accept": "application/json"]
        for _ in 0..<10 {
            try? await Task.sleep(nanoseconds: 3_000_000_000)
            if let results = await fetchLatestSearch(listId: list.id, headers: pollHeaders) {
                comparisons = results
                if selectedStoreName.isEmpty, let first = allStoreNames.first {
                    selectedStoreName = first
                }
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

        #if DEBUG
        if let raw = String(data: data, encoding: .utf8) {
            print("[FlyersDebug] latest-search raw response:\n\(raw)")
        }
        #endif

        guard let raw = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
              let resultsRaw = raw["results"] as? [String: Any], !resultsRaw.isEmpty else { return nil }

        let rawStoreNames = Array(Set(resultsRaw.values.compactMap { $0 as? [String: Any] }.flatMap { $0.keys }))
        let chainNames = Array(Set(rawStoreNames.map { cleanStoreName($0) })).sorted()

        var comps: [ItemComparison] = []
        for (itemName, storeDict) in resultsRaw {
            guard let storeMap = storeDict as? [String: Any] else { continue }
            var storeResults: [ItemComparison.StoreResult] = []

            for chainName in chainNames {
                let matchingKeys = rawStoreNames.filter { cleanStoreName($0) == chainName }
                var bestProduct: NoFrillsProduct? = nil
                var bestPrice = Double.infinity

                for key in matchingKeys {
                    guard let productsRaw = storeMap[key] as? [[String: Any]],
                          let first = productsRaw.first else { continue }
                    let price = priceValue(first["price"] as? String)
                    if price < bestPrice {
                        bestPrice = price
                        bestProduct = NoFrillsProduct(
                            brand: first["brand"] as? String,
                            name: first["name"] as? String ?? itemName,
                            price: first["price"] as? String,
                            size: first["size"] as? String,
                            pricePerUnit: first["pricePerUnit"] as? String,
                            store: chainName
                        )
                    }
                }

                storeResults.append(.init(storeName: chainName, product: bestProduct))
            }

            if storeResults.contains(where: { $0.product != nil }) {
                comps.append(ItemComparison(itemName: itemName, storeResults: storeResults))
            }
        }
        return comps.isEmpty ? nil : comps.sorted { $0.itemName < $1.itemName }
    }
}

// MARK: - Flyer Item model

struct FlyerItem: Identifiable {
    let id = UUID()
    let itemName: String
    let product: NoFrillsProduct
    let isCheapest: Bool
    let storeName: String
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

    // MARK: - Loading / Searching

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
            Text("This takes about 20–30 seconds")
                .font(.caption)
                .foregroundStyle(.secondary)
        }
    }

    // MARK: - Empty State

    private var emptyState: some View {
        VStack(spacing: 20) {
            Image(systemName: "tag.slash")
                .font(.system(size: 52, weight: .bold))
                .foregroundStyle(Color(red: 0.60, green: 0.65, blue: 0.60))

            VStack(spacing: 6) {
                Text("No Deals Yet")
                    .font(.system(size: 24, weight: .black, design: .rounded))
                if let error = viewModel.errorMessage {
                    Text(error)
                        .foregroundStyle(.secondary)
                        .multilineTextAlignment(.center)
                        .padding(.horizontal, 36)
                        .font(.system(size: 14))
                }
            }

            if viewModel.selectedList != nil, !viewModel.savedStores.isEmpty {
                Button {
                    Task { await viewModel.load() }
                } label: {
                    Text("Search Prices Now")
                        .font(.system(size: 15, weight: .bold, design: .rounded))
                        .foregroundStyle(.white)
                        .padding(.horizontal, 28)
                        .padding(.vertical, 13)
                        .background(SavrColors.brandGreen)
                        .clipShape(Capsule())
                }
            }
        }
    }

    // MARK: - Results

    private var resultsView: some View {
        VStack(spacing: 0) {
            // Header
            headerSection

            // Store selector tabs
            storeTabs
                .padding(.top, 4)
                .padding(.bottom, 8)

            // Search bar
            searchBar
                .padding(.horizontal, 16)
                .padding(.bottom, 8)

            Divider()

            // Deal count
            HStack {
                Text("\(viewModel.displayedItems.count) deals")
                    .font(.system(size: 13, weight: .semibold))
                    .foregroundStyle(.secondary)
                Spacer()
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 8)

            // Item list
            ScrollView {
                LazyVStack(spacing: 0) {
                    ForEach(viewModel.displayedItems) { item in
                        FlyerItemRow(item: item)
                        Divider()
                            .padding(.leading, 76)
                    }
                }
                .background(Color.white)
                .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
                .padding(.horizontal, 16)
                .padding(.bottom, 24)
            }
        }
        .background(Color(red: 0.97, green: 0.98, blue: 0.97))
    }

    // MARK: - Header

    private var headerSection: some View {
        HStack {
            VStack(alignment: .leading, spacing: 2) {
                Text("Flyers")
                    .font(.system(size: 26, weight: .black, design: .rounded))
                Text("From \"\(viewModel.listName)\"")
                    .font(.system(size: 13, weight: .medium))
                    .foregroundStyle(.secondary)
                    .lineLimit(1)
            }
            Spacer()
            // Refresh button
            Button {
                Task { await viewModel.load() }
            } label: {
                Image(systemName: "arrow.clockwise")
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundStyle(SavrColors.brandGreen)
                    .padding(8)
                    .background(SavrColors.brandGreen.opacity(0.10))
                    .clipShape(Circle())
            }
        }
        .padding(.horizontal, 20)
        .padding(.top, 20)
        .padding(.bottom, 6)
    }

    // MARK: - Store Tabs

    private var storeTabs: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 0) {
                ForEach(viewModel.allStoreNames, id: \.self) { store in
                    let isActive = viewModel.selectedStoreName == store
                    let assetName = brandAssetName(for: store)

                    Button {
                        withAnimation(.easeInOut(duration: 0.15)) {
                            viewModel.selectedStoreName = store
                        }
                    } label: {
                        VStack(spacing: 0) {
                            HStack(spacing: 8) {
                                // Store logo
                                if UIImage(named: assetName) != nil {
                                    Image(assetName)
                                        .resizable()
                                        .scaledToFit()
                                        .frame(width: 32, height: 32)
                                } else {
                                    ZStack {
                                        RoundedRectangle(cornerRadius: 8)
                                            .fill(storeColor(for: store))
                                            .frame(width: 32, height: 32)
                                        Text(String(store.prefix(2)).uppercased())
                                            .font(.system(size: 10, weight: .black, design: .rounded))
                                            .foregroundStyle(.white)
                                    }
                                }

                                VStack(alignment: .leading, spacing: 1) {
                                    Text(store)
                                        .font(.system(size: 13, weight: isActive ? .bold : .medium))
                                        .foregroundStyle(isActive ? Color(red: 0.10, green: 0.20, blue: 0.10) : .secondary)
                                    Text("Canada")
                                        .font(.system(size: 10))
                                        .foregroundStyle(.secondary)
                                }
                            }
                            .padding(.horizontal, 16)
                            .padding(.vertical, 10)
                            .background(isActive ? Color.white : Color.clear)

                            // Active underline
                            Rectangle()
                                .fill(isActive ? SavrColors.brandGreen : Color.clear)
                                .frame(height: 2)
                        }
                    }
                    .buttonStyle(.plain)
                }
            }
            .padding(.leading, 8)
        }
        .background(Color(red: 0.95, green: 0.96, blue: 0.95))
    }

    // MARK: - Search Bar

    private var searchBar: some View {
        HStack(spacing: 10) {
            Image(systemName: "magnifyingglass")
                .foregroundStyle(.secondary)
                .font(.system(size: 15))
            TextField("Search deals...", text: $viewModel.searchText)
                .font(.system(size: 15))
            if !viewModel.searchText.isEmpty {
                Button {
                    viewModel.searchText = ""
                } label: {
                    Image(systemName: "xmark.circle.fill")
                        .foregroundStyle(Color(red: 0.70, green: 0.70, blue: 0.70))
                }
                .buttonStyle(.plain)
            }
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 10)
        .background(Color.white)
        .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: 12, style: .continuous)
                .stroke(Color(red: 0.88, green: 0.90, blue: 0.88), lineWidth: 1)
        )
    }
}

// MARK: - Flyer Item Row

private struct FlyerItemRow: View {
    let item: FlyerItem

    var body: some View {
        HStack(spacing: 14) {
            // Product image placeholder — colored square with first letter
            ZStack {
                RoundedRectangle(cornerRadius: 10, style: .continuous)
                    .fill(storeColor(for: item.storeName).opacity(0.12))
                    .frame(width: 56, height: 56)
                Image(systemName: productIcon(for: item.itemName))
                    .font(.system(size: 22))
                    .foregroundStyle(storeColor(for: item.storeName).opacity(0.7))
            }

            // Name + brand + date
            VStack(alignment: .leading, spacing: 3) {
                Text(item.product.name.isEmpty ? item.itemName : item.product.name)
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundStyle(Color(red: 0.10, green: 0.15, blue: 0.10))
                    .lineLimit(2)
                    .fixedSize(horizontal: false, vertical: true)

                if let brand = item.product.brand, !brand.isEmpty {
                    Text(brand)
                        .font(.system(size: 12))
                        .foregroundStyle(.secondary)
                }

                if let size = item.product.size, !size.isEmpty {
                    Text(size)
                        .font(.system(size: 11))
                        .foregroundStyle(Color(red: 0.50, green: 0.55, blue: 0.50))
                }

                HStack(spacing: 4) {
                    Image(systemName: "calendar")
                        .font(.system(size: 10))
                        .foregroundStyle(.secondary)
                    Text("Valid now")
                        .font(.system(size: 11))
                        .foregroundStyle(.secondary)
                }
            }

            Spacer()

            // Price + cheapest badge
            VStack(alignment: .trailing, spacing: 4) {
                if let price = item.product.price {
                    Text(price)
                        .font(.system(size: 18, weight: .black, design: .rounded))
                        .foregroundStyle(item.isCheapest ? SavrColors.brandGreen : Color(red: 0.10, green: 0.15, blue: 0.10))
                } else {
                    Text("—")
                        .font(.system(size: 18, weight: .black))
                        .foregroundStyle(.secondary)
                }

                if item.isCheapest {
                    Text("Best price")
                        .font(.system(size: 10, weight: .bold))
                        .foregroundStyle(.white)
                        .padding(.horizontal, 7)
                        .padding(.vertical, 3)
                        .background(SavrColors.brandGreen)
                        .clipShape(Capsule())
                }

                // Checkbox
                Image(systemName: "square")
                    .font(.system(size: 18))
                    .foregroundStyle(Color(red: 0.75, green: 0.80, blue: 0.75))
            }
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 12)
        .background(Color.white)
    }

    /// Pick a SF symbol based on item name keywords
    private func productIcon(for name: String) -> String {
        let lower = name.lowercased()
        if lower.contains("milk") || lower.contains("dairy") || lower.contains("cheese") || lower.contains("yogurt") { return "cup.and.saucer.fill" }
        if lower.contains("bread") || lower.contains("bagel") || lower.contains("bun") { return "takeoutbag.and.cup.and.straw.fill" }
        if lower.contains("chicken") || lower.contains("beef") || lower.contains("pork") || lower.contains("meat") || lower.contains("fish") || lower.contains("salmon") { return "fork.knife" }
        if lower.contains("apple") || lower.contains("banana") || lower.contains("fruit") || lower.contains("berry") || lower.contains("orange") { return "leaf.fill" }
        if lower.contains("vegetable") || lower.contains("carrot") || lower.contains("lettuce") || lower.contains("salad") || lower.contains("broccoli") { return "leaf.fill" }
        if lower.contains("juice") || lower.contains("drink") || lower.contains("water") || lower.contains("pop") || lower.contains("soda") { return "cup.and.saucer.fill" }
        if lower.contains("coffee") || lower.contains("tea") { return "cup.and.saucer.fill" }
        if lower.contains("chip") || lower.contains("snack") || lower.contains("cracker") { return "circle.grid.2x2.fill" }
        if lower.contains("cereal") || lower.contains("oat") { return "square.grid.2x2.fill" }
        if lower.contains("egg") { return "oval.fill" }
        if lower.contains("pasta") || lower.contains("noodle") || lower.contains("rice") { return "square.3.layers.3d" }
        if lower.contains("soap") || lower.contains("shampoo") || lower.contains("detergent") || lower.contains("cleaning") { return "bubbles.and.sparkles.fill" }
        if lower.contains("diaper") || lower.contains("baby") { return "figure.2.and.child.holdinghands" }
        return "cart.fill"
    }
}

// MARK: - Helpers

/// Maps a clean chain name to the image asset name in Assets.xcassets
func brandAssetName(for name: String) -> String {
    let lower = name.lowercased()
    if lower.contains("sobeys")                                      { return "sobeys" }
    if lower.contains("walmart")                                     { return "walmart" }
    if lower.contains("freshco")                                     { return "freshco" }
    if lower.contains("no frills") || lower.contains("nofrills")    { return "nofrills" }
    if lower.contains("loblaws")                                     { return "loblaws" }
    if lower.contains("metro")                                       { return "metro" }
    if lower.contains("food basics") || lower.contains("foodbasics") { return "foodbasics" }
    if lower.contains("atlantic superstore") || lower.contains("atlanticsuperstore") { return "atlanticsuperstore" }
    if lower.contains("superstore")                                  { return "superstore" }
    if lower.contains("t&t") || lower.contains("tandt")             { return "tandt" }
    if lower.contains("independent")                                 { return "independent" }
    if lower.contains("foodland")                                    { return "foodland" }
    if lower.contains("maxi")                                        { return "maxi" }
    return lower.replacingOccurrences(of: " ", with: "")
}

/// Cleans up internal store IDs like "sobeys::10 Elizabeth Ave" -> "Sobeys"
func cleanStoreName(_ raw: String) -> String {
    let base = raw.components(separatedBy: "::").first ?? raw
    let trimmed = base.trimmingCharacters(in: .whitespacesAndNewlines)
    return trimmed
        .replacingOccurrences(of: "_", with: " ")
        .replacingOccurrences(of: "-", with: " ")
        .split(separator: " ")
        .map { $0.prefix(1).uppercased() + $0.dropFirst().lowercased() }
        .joined(separator: " ")
}

/// Returns a brand-appropriate color for known store names, falls back to indexed colors
func storeColor(for name: String) -> Color {
    let lower = name.lowercased()
    if lower.contains("sobeys")     { return Color(red: 0.82, green: 0.09, blue: 0.13) }
    if lower.contains("nofrills") || lower.contains("no frills") { return Color(red: 0.98, green: 0.75, blue: 0.02) }
    if lower.contains("loblaws")    { return Color(red: 0.20, green: 0.53, blue: 0.20) }
    if lower.contains("metro")      { return Color(red: 0.00, green: 0.39, blue: 0.73) }
    if lower.contains("foodbasics") || lower.contains("food basics") { return Color(red: 0.95, green: 0.35, blue: 0.10) }
    if lower.contains("walmart")    { return Color(red: 0.00, green: 0.47, blue: 0.87) }
    if lower.contains("costco")     { return Color(red: 0.80, green: 0.10, blue: 0.10) }
    if lower.contains("freshco")    { return Color(red: 0.07, green: 0.53, blue: 0.25) }
    if lower.contains("superstore") { return Color(red: 0.80, green: 0.15, blue: 0.15) }
    if lower.contains("maxi")       { return Color(red: 0.95, green: 0.20, blue: 0.25) }
    if lower.contains("independent"){ return Color(red: 0.20, green: 0.50, blue: 0.20) }
    if lower.contains("foodland")   { return Color(red: 0.10, green: 0.45, blue: 0.80) }
    if lower.contains("t&t") || lower.contains("tandt") { return Color(red: 0.88, green: 0.10, blue: 0.18) }
    let colors: [Color] = [
        Color(red: 0.12, green: 0.67, blue: 0.28),
        Color(red: 0.20, green: 0.40, blue: 0.85),
        Color(red: 0.90, green: 0.45, blue: 0.10),
        Color(red: 0.60, green: 0.20, blue: 0.80),
    ]
    let idx = abs(name.hashValue) % colors.count
    return colors[idx]
}

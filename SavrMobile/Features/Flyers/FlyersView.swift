import SwiftUI

// MARK: - Models

struct FlyerDeal: Decodable, Identifiable {
    let id: String
    let storeBrand: String
    let productName: String
    let brand: String?
    let price: String
    let priceFloat: Double?
    let imageUrl: String?
    let validFrom: String
    let validTo: String
    let saleStory: String?
    let prePriceText: String?
    let postPriceText: String?
    let originalPrice: Double?

    private enum CodingKeys: String, CodingKey {
        case id
        case storeBrand = "store_brand"
        case productName = "product_name"
        case brand, price
        case priceFloat = "price_float"
        case imageUrl = "image_url"
        case validFrom = "valid_from"
        case validTo = "valid_to"
        case saleStory = "sale_story"
        case prePriceText = "pre_price_text"
        case postPriceText = "post_price_text"
        case originalPrice = "original_price"
    }
}

struct FlyerDealsPage: Decodable {
    let deals: [FlyerDeal]
    let total: Int
    let page: Int
    let pageSize: Int

    private enum CodingKeys: String, CodingKey {
        case deals, total, page
        case pageSize = "page_size"
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

// MARK: - Service

final class FlyerService {
    private let apiClient: APIClient
    private let tokenStore: AuthTokenStore

    init(apiClient: APIClient = .shared, tokenStore: AuthTokenStore = AuthTokenStore()) {
        self.apiClient = apiClient
        self.tokenStore = tokenStore
    }

    func fetchDeals(storeBrand: String, search: String = "", page: Int = 1, pageSize: Int = 50) async throws -> FlyerDealsPage {
        guard let session = tokenStore.loadSession() else {
            throw APIError.requestFailed(statusCode: 401, message: "Not signed in.", responseBody: nil, requestURL: nil, method: "GET")
        }
        var queryItems: [URLQueryItem] = [
            URLQueryItem(name: "store_brand", value: storeBrand),
            URLQueryItem(name: "page", value: "\(page)"),
            URLQueryItem(name: "page_size", value: "\(pageSize)")
        ]
        if !search.isEmpty {
            queryItems.append(URLQueryItem(name: "search", value: search))
        }
        return try await apiClient.send(
            path: "flyers",
            method: "GET",
            headers: [
                "Authorization": "Bearer \(session.accessToken)",
                "Accept": "application/json"
            ],
            queryItems: queryItems
        )
    }

    func addToList(dealIds: [String], listId: String) async throws {
        guard let session = tokenStore.loadSession() else { return }
        let body = try JSONSerialization.data(withJSONObject: ["deal_ids": dealIds, "list_id": listId])
        let _: EmptyResponse = try await apiClient.send(
            path: "flyers/add-to-list",
            method: "POST",
            headers: [
                "Authorization": "Bearer \(session.accessToken)",
                "Content-Type": "application/json",
                "Accept": "application/json"
            ],
            body: body
        )
    }

    func fetchSavedStores() async throws -> [UserSavedStore] {
        guard let session = tokenStore.loadSession() else {
            throw APIError.requestFailed(statusCode: 401, message: "Not signed in.", responseBody: nil, requestURL: nil, method: "GET")
        }
        return try await apiClient.send(
            path: "user/selected_stores",
            method: "GET",
            headers: [
                "Authorization": "Bearer \(session.accessToken)",
                "Accept": "application/json"
            ]
        )
    }
}

// Minimal decodable for endpoints that return an empty/simple body
private struct EmptyResponse: Decodable {}

// MARK: - ViewModel

@MainActor
final class FlyersViewModel: ObservableObject {
    @Published var dealsByStore: [String: [FlyerDeal]] = [:]   // keyed by clean store name
    @Published var isLoading = false
    @Published var errorMessage: String?
    @Published var selectedStoreName: String = ""
    @Published var searchText: String = ""
    @Published var checkedDealIds: Set<String> = []
    @Published var isAddingToList = false
    @Published var addToListSuccess = false
    @Published var savedStores: [UserSavedStore] = []

    private let flyerService = FlyerService()
    private let listService = GroceryListService()

    var allStoreNames: [String] {
        dealsByStore.keys.sorted()
    }

    var displayedDeals: [FlyerDeal] {
        let deals = dealsByStore[selectedStoreName] ?? []
        guard !searchText.isEmpty else { return deals }
        return deals.filter {
            $0.productName.localizedCaseInsensitiveContains(searchText) ||
            ($0.brand ?? "").localizedCaseInsensitiveContains(searchText) ||
            ($0.saleStory ?? "").localizedCaseInsensitiveContains(searchText)
        }
    }

    func load() async {
        isLoading = true
        errorMessage = nil
        dealsByStore = [:]

        // Fetch saved stores
        do {
            savedStores = try await flyerService.fetchSavedStores()
        } catch {
            // Non-fatal — continue
        }

        guard !savedStores.isEmpty else {
            errorMessage = "No stores saved. Go to Stores to pick your stores."
            isLoading = false
            return
        }

        // Fetch flyer deals for each unique chain
        let chains = Array(Set(savedStores.map { canonicalBrandName($0.storeName) }))
        var fetchedAny = false

        await withTaskGroup(of: (String, [FlyerDeal])?.self) { group in
            for chain in chains {
                group.addTask {
                    guard let page = try? await self.flyerService.fetchDeals(storeBrand: chain) else {
                        return nil
                    }
                    return (chain, page.deals)
                }
            }
            for await result in group {
                if let (chain, deals) = result, !deals.isEmpty {
                    let displayName = displayStoreName(chain)
                    dealsByStore[displayName] = deals
                    fetchedAny = true
                }
            }
        }

        if !fetchedAny {
            errorMessage = "No flyer deals found for your stores right now. Try refreshing later."
        }

        // Select first store
        if selectedStoreName.isEmpty || dealsByStore[selectedStoreName] == nil {
            selectedStoreName = allStoreNames.first ?? ""
        }

        isLoading = false
    }

    func toggleCheck(_ dealId: String) {
        if checkedDealIds.contains(dealId) {
            checkedDealIds.remove(dealId)
        } else {
            checkedDealIds.insert(dealId)
        }
    }

    func addCheckedToList() async {
        guard !checkedDealIds.isEmpty else { return }
        isAddingToList = true
        do {
            // Use first available list, or skip
            let lists = (try? await listService.fetchAllLists()) ?? []
            let listId = lists.first?.id ?? ""
            try await flyerService.addToList(dealIds: Array(checkedDealIds), listId: listId)
            checkedDealIds = []
            addToListSuccess = true
            // Auto-hide success banner
            try? await Task.sleep(nanoseconds: 2_000_000_000)
            addToListSuccess = false
        } catch {
            // Non-fatal
        }
        isAddingToList = false
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
            } else if !viewModel.dealsByStore.isEmpty {
                resultsView
            } else {
                emptyState
            }
        }
        .task { await viewModel.load() }
        .refreshable { await viewModel.load() }
    }

    // MARK: - Loading

    private var loadingView: some View {
        VStack(spacing: 16) {
            ProgressView().scaleEffect(1.3)
            Text("Loading flyers...")
                .foregroundStyle(.secondary)
                .font(.system(size: 15))
        }
    }

    // MARK: - Empty State

    private var emptyState: some View {
        VStack(spacing: 20) {
            Image(systemName: "tag.slash")
                .font(.system(size: 52, weight: .bold))
                .foregroundStyle(Color(red: 0.60, green: 0.65, blue: 0.60))

            VStack(spacing: 6) {
                Text("No Flyers Yet")
                    .font(.system(size: 24, weight: .black, design: .rounded))
                if let error = viewModel.errorMessage {
                    Text(error)
                        .foregroundStyle(.secondary)
                        .multilineTextAlignment(.center)
                        .padding(.horizontal, 36)
                        .font(.system(size: 14))
                }
            }

            Button {
                Task { await viewModel.load() }
            } label: {
                Text("Refresh")
                    .font(.system(size: 15, weight: .bold, design: .rounded))
                    .foregroundStyle(.white)
                    .padding(.horizontal, 28)
                    .padding(.vertical, 13)
                    .background(SavrColors.brandGreen)
                    .clipShape(Capsule())
            }
        }
    }

    // MARK: - Results

    private var resultsView: some View {
        VStack(spacing: 0) {
            headerSection

            storeTabs
                .padding(.top, 4)
                .padding(.bottom, 8)

            searchBar
                .padding(.horizontal, 16)
                .padding(.bottom, 8)

            Divider()

            // Deal count + add-to-list button
            HStack {
                Text("\(viewModel.displayedDeals.count) deals")
                    .font(.system(size: 13, weight: .semibold))
                    .foregroundStyle(.secondary)
                Spacer()
                if !viewModel.checkedDealIds.isEmpty {
                    Button {
                        Task { await viewModel.addCheckedToList() }
                    } label: {
                        if viewModel.isAddingToList {
                            ProgressView()
                                .scaleEffect(0.8)
                                .padding(.horizontal, 12)
                                .padding(.vertical, 6)
                        } else {
                            Label("Add \(viewModel.checkedDealIds.count) to List", systemImage: "plus.circle.fill")
                                .font(.system(size: 13, weight: .bold))
                                .foregroundStyle(.white)
                                .padding(.horizontal, 12)
                                .padding(.vertical, 6)
                                .background(SavrColors.brandGreen)
                                .clipShape(Capsule())
                        }
                    }
                }
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 8)

            // Success banner
            if viewModel.addToListSuccess {
                HStack(spacing: 8) {
                    Image(systemName: "checkmark.circle.fill")
                        .foregroundStyle(SavrColors.brandGreen)
                    Text("Added to your grocery list!")
                        .font(.system(size: 13, weight: .semibold))
                        .foregroundStyle(Color(red: 0.10, green: 0.30, blue: 0.16))
                }
                .padding(.horizontal, 16)
                .padding(.vertical, 8)
                .background(SavrColors.brandGreen.opacity(0.12))
                .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
                .padding(.horizontal, 16)
                .padding(.bottom, 4)
                .transition(.opacity.combined(with: .move(edge: .top)))
                .animation(.easeInOut(duration: 0.3), value: viewModel.addToListSuccess)
            }

            ScrollView {
                LazyVStack(spacing: 0) {
                    ForEach(viewModel.displayedDeals) { deal in
                        FlyerDealRow(
                            deal: deal,
                            isChecked: viewModel.checkedDealIds.contains(deal.id)
                        ) {
                            viewModel.toggleCheck(deal.id)
                        }
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
                Text("Weekly deals from your stores")
                    .font(.system(size: 13, weight: .medium))
                    .foregroundStyle(.secondary)
            }
            Spacer()
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
                                    let count = viewModel.dealsByStore[store]?.count ?? 0
                                    Text("\(count) deals")
                                        .font(.system(size: 10))
                                        .foregroundStyle(.secondary)
                                }
                            }
                            .padding(.horizontal, 16)
                            .padding(.vertical, 10)
                            .background(isActive ? Color.white : Color.clear)

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

// MARK: - Flyer Deal Row

private struct FlyerDealRow: View {
    let deal: FlyerDeal
    let isChecked: Bool
    let onToggle: () -> Void

    var body: some View {
        HStack(spacing: 14) {
            // Product image — real image from backend, fallback to icon
            productImage

            // Name + brand + sale story + date
            VStack(alignment: .leading, spacing: 3) {
                Text(deal.productName)
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundStyle(Color(red: 0.10, green: 0.15, blue: 0.10))
                    .lineLimit(2)
                    .fixedSize(horizontal: false, vertical: true)

                if let brand = deal.brand, !brand.isEmpty {
                    Text(brand)
                        .font(.system(size: 12))
                        .foregroundStyle(.secondary)
                }

                if let saleStory = deal.saleStory, !saleStory.isEmpty {
                    Text(saleStory)
                        .font(.system(size: 11))
                        .foregroundStyle(SavrColors.brandGreen)
                        .lineLimit(1)
                }

                HStack(spacing: 4) {
                    Image(systemName: "calendar")
                        .font(.system(size: 10))
                        .foregroundStyle(.secondary)
                    Text(dateRangeLabel(from: deal.validFrom, to: deal.validTo))
                        .font(.system(size: 11))
                        .foregroundStyle(.secondary)
                }
            }

            Spacer()

            // Price + savings + checkbox
            VStack(alignment: .trailing, spacing: 4) {
                // Original price (strikethrough) if discounted
                if let orig = deal.originalPrice, let current = deal.priceFloat, orig > current {
                    Text(formatPrice(orig))
                        .font(.system(size: 11))
                        .foregroundStyle(.secondary)
                        .strikethrough(true, color: .secondary)
                }

                // Formatted price with pre/post text
                priceLabel

                // Check button
                Button(action: onToggle) {
                    Image(systemName: isChecked ? "checkmark.square.fill" : "square")
                        .font(.system(size: 20))
                        .foregroundStyle(isChecked ? SavrColors.brandGreen : Color(red: 0.75, green: 0.80, blue: 0.75))
                }
                .buttonStyle(.plain)
            }
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 12)
        .background(Color.white)
    }

    @ViewBuilder
    private var productImage: some View {
        if let urlString = deal.imageUrl, let url = URL(string: urlString) {
            AsyncImage(url: url) { phase in
                switch phase {
                case .success(let image):
                    image
                        .resizable()
                        .scaledToFit()
                        .frame(width: 56, height: 56)
                        .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
                case .failure, .empty:
                    fallbackIcon
                @unknown default:
                    fallbackIcon
                }
            }
            .frame(width: 56, height: 56)
        } else {
            fallbackIcon
        }
    }

    private var fallbackIcon: some View {
        ZStack {
            RoundedRectangle(cornerRadius: 10, style: .continuous)
                .fill(storeColor(for: deal.storeBrand).opacity(0.12))
                .frame(width: 56, height: 56)
            Image(systemName: productIcon(for: deal.productName))
                .font(.system(size: 22))
                .foregroundStyle(storeColor(for: deal.storeBrand).opacity(0.7))
        }
    }

    @ViewBuilder
    private var priceLabel: some View {
        let pre = deal.prePriceText.map { $0 + " " } ?? ""
        let post = deal.postPriceText.map { " " + $0 } ?? ""
        let fullPrice = "\(pre)\(deal.price)\(post)"
        Text(fullPrice)
            .font(.system(size: 16, weight: .black, design: .rounded))
            .foregroundStyle(deal.originalPrice != nil ? SavrColors.brandGreen : Color(red: 0.10, green: 0.15, blue: 0.10))
            .lineLimit(1)
    }

    private func dateRangeLabel(from validFrom: String, to validTo: String) -> String {
        let formatter = ISO8601DateFormatter()
        let display = DateFormatter()
        display.dateFormat = "MMM d"
        let fromDate = formatter.date(from: validFrom)
        let toDate = formatter.date(from: validTo)
        if let f = fromDate, let t = toDate {
            return "\(display.string(from: f)) – \(display.string(from: t))"
        }
        return "Valid now"
    }

    private func formatPrice(_ value: Double) -> String {
        String(format: "$%.2f", value)
    }

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

/// Maps a raw store name or brand string to the asset catalog name
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

/// Maps a backend brand ID (e.g. "no_frills", "freshco") to a human-readable display name
func displayStoreName(_ brand: String) -> String {
    let lower = brand.lowercased()
    if lower == "no_frills" || lower == "nofrills"   { return "No Frills" }
    if lower == "food_basics" || lower == "foodbasics" { return "Food Basics" }
    if lower == "atlantic_superstore"                 { return "Atlantic Superstore" }
    if lower == "real_canadian_superstore" || lower == "superstore" { return "Real Canadian Superstore" }
    if lower == "tandt" || lower == "t&t"            { return "T&T" }
    // Title-case everything else
    return brand
        .replacingOccurrences(of: "_", with: " ")
        .replacingOccurrences(of: "-", with: " ")
        .split(separator: " ")
        .map { $0.prefix(1).uppercased() + $0.dropFirst().lowercased() }
        .joined(separator: " ")
}

/// Maps a store name to its backend brand ID for the /flyers API
func canonicalBrandName(_ storeName: String) -> String {
    let lower = storeName.lowercased()
    if lower.contains("no frills") || lower.contains("nofrills")    { return "nofrills" }
    if lower.contains("food basics") || lower.contains("foodbasics") { return "foodbasics" }
    if lower.contains("atlantic superstore")                         { return "atlanticsuperstore" }
    if lower.contains("real canadian superstore") || (lower.contains("superstore") && !lower.contains("atlantic")) { return "superstore" }
    if lower.contains("loblaws")                                     { return "loblaws" }
    if lower.contains("sobeys")                                      { return "sobeys" }
    if lower.contains("freshco")                                     { return "freshco" }
    if lower.contains("metro")                                       { return "metro" }
    if lower.contains("walmart")                                     { return "walmart" }
    if lower.contains("maxi")                                        { return "maxi" }
    if lower.contains("independent")                                 { return "independent" }
    if lower.contains("foodland")                                    { return "foodland" }
    if lower.contains("t&t") || lower.contains("tandt")             { return "tandt" }
    // Strip spaces and lowercase as a best effort
    return lower.replacingOccurrences(of: " ", with: "").replacingOccurrences(of: "'", with: "")
}

/// Returns a brand-appropriate color for known store names
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

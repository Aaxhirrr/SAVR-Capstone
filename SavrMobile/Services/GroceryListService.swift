import Foundation

// MARK: - Models

struct GroceryListItem: Decodable, Identifiable, Hashable {
    var id: String { "\(name)-\(meal ?? "")-\(quantity ?? "")" }
    let name: String
    let category: String?
    let meal: String?
    let quantity: String?  // backend sends "2 lbs", "1 bunch" etc.
    let unit: String?
}

struct GroceryList: Decodable, Identifiable, Hashable {
    let id: String
    let name: String
    let items: [GroceryListItem]
    let createdAt: String
    let isActive: Bool
    let savingsAmount: Double?
    let leastExpensiveStoreName: String?
    let leastExpensiveStorePrice: Double?
    let mostExpensiveStoreName: String?
    let mostExpensiveStorePrice: Double?
    /// The chat session that generated this list (may be nil for older lists)
    let sessionId: String?

    private enum CodingKeys: String, CodingKey {
        case id, name, items, createdAt
        case createdAtSnake = "created_at"
        case isActive = "is_active"
        case savingsAmount = "savings_amount"
        case leastExpensiveStoreName = "least_expensive_store_name"
        case leastExpensiveStorePrice = "least_expensive_store_price"
        case mostExpensiveStoreName = "most_expensive_store_name"
        case mostExpensiveStorePrice = "most_expensive_store_price"
        case sessionId = "chat_session_id"
        case legacySessionId = "session_id"
    }

}

extension GroceryList {
    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        id = try c.decode(String.self, forKey: .id)
        name = try c.decode(String.self, forKey: .name)
        items = try c.decode([GroceryListItem].self, forKey: .items)
        createdAt = try c.decodeIfPresent(String.self, forKey: .createdAt) ?? c.decode(String.self, forKey: .createdAtSnake)
        isActive = try c.decodeIfPresent(Bool.self, forKey: .isActive) ?? true
        savingsAmount = try c.decodeIfPresent(Double.self, forKey: .savingsAmount)
        leastExpensiveStoreName = try c.decodeIfPresent(String.self, forKey: .leastExpensiveStoreName)
        leastExpensiveStorePrice = try c.decodeIfPresent(Double.self, forKey: .leastExpensiveStorePrice)
        mostExpensiveStoreName = try c.decodeIfPresent(String.self, forKey: .mostExpensiveStoreName)
        mostExpensiveStorePrice = try c.decodeIfPresent(Double.self, forKey: .mostExpensiveStorePrice)
        sessionId = try c.decodeIfPresent(String.self, forKey: .sessionId) ?? c.decodeIfPresent(String.self, forKey: .legacySessionId)
    }
}

// MARK: - Service

final class GroceryListService {
    private let apiClient: APIClient
    private let tokenStore: AuthTokenStore

    init(apiClient: APIClient = .shared, tokenStore: AuthTokenStore = AuthTokenStore()) {
        self.apiClient = apiClient
        self.tokenStore = tokenStore
    }

    func fetchAllLists() async throws -> [GroceryList] {
        guard let session = tokenStore.loadSession() else {
            throw APIError.requestFailed(statusCode: 401, message: "Not signed in.", responseBody: nil, requestURL: nil, method: "GET")
        }
        return try await apiClient.send(
            path: "grocery-lists/all",
            method: "GET",
            headers: [
                "Authorization": "Bearer \(session.accessToken)",
                "Accept": "application/json"
            ]
        )
    }

    func fetchList(id: String) async throws -> GroceryList {
        guard let session = tokenStore.loadSession() else {
            throw APIError.requestFailed(statusCode: 401, message: "Not signed in.", responseBody: nil, requestURL: nil, method: "GET")
        }
        return try await apiClient.send(
            path: "grocery-lists/\(id)",
            method: "GET",
            headers: [
                "Authorization": "Bearer \(session.accessToken)",
                "Accept": "application/json"
            ]
        )
    }

    func linkSession(listId: String, sessionId: String) async throws {
        guard let session = tokenStore.loadSession() else { throw APIError.notSignedIn }
        let _: GroceryList = try await apiClient.send(path: "grocery-lists/\(listId)", method: "PUT", headers: ["Authorization": "Bearer \(session.accessToken)", "Content-Type": "application/json"], body: JSONSerialization.data(withJSONObject: ["chat_session_id": sessionId]))
    }

    func renameList(id: String, name: String) async throws -> GroceryList {
        guard let session = tokenStore.loadSession() else { throw APIError.notSignedIn }
        return try await apiClient.send(path: "grocery-lists/\(id)", method: "PUT", headers: ["Authorization": "Bearer \(session.accessToken)", "Content-Type": "application/json"], body: JSONSerialization.data(withJSONObject: ["name": name]))
    }

    func deleteList(id: String) async throws {
        guard let session = tokenStore.loadSession() else { throw APIError.notSignedIn }
        let _: EmptyAPIResponse = try await apiClient.send(path: "grocery-lists/\(id)", method: "DELETE", headers: ["Authorization": "Bearer \(session.accessToken)"])
    }
}

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

struct GroceryList: Decodable, Identifiable {
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

    private enum CodingKeys: String, CodingKey {
        case id, name, items
        case createdAt  // backend sends "createdAt" (camelCase)
        case isActive = "is_active"
        case savingsAmount = "savings_amount"
        case leastExpensiveStoreName = "least_expensive_store_name"
        case leastExpensiveStorePrice = "least_expensive_store_price"
        case mostExpensiveStoreName = "most_expensive_store_name"
        case mostExpensiveStorePrice = "most_expensive_store_price"
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

    func debugChatSessions() async -> String {
        guard let session = tokenStore.loadSession() else { return "NO TOKEN" }
        guard let url = URL(string: "https://savr.app/api/chat/sessions") else { return "BAD URL" }
        var req = URLRequest(url: url)
        req.setValue("Bearer \(session.accessToken)", forHTTPHeaderField: "Authorization")
        req.setValue("application/json", forHTTPHeaderField: "Accept")
        req.timeoutInterval = 10
        guard let (data, _) = try? await URLSession.shared.data(for: req) else { return "REQUEST FAILED" }
        return String(data: data, encoding: .utf8) ?? "unreadable"
    }

    // Fallback: build GroceryList objects from chat session lists
    func fetchListsFromChatSessions() async -> [GroceryList] {
        guard let session = tokenStore.loadSession() else { return [] }
        let headers = [
            "Authorization": "Bearer \(session.accessToken)",
            "Accept": "application/json"
        ]

        // Get all sessions
        guard let sessions: [[String: Any]] = try? await rawFetch(path: "chat/sessions", headers: headers) else { return [] }

        var result: [GroceryList] = []
        for s in sessions {
            guard let sessionId = s["id"] as? String else { continue }
            // Get the list for this session
            if let listData: [String: Any] = try? await rawFetch(path: "chat/session/\(sessionId)/list", headers: headers),
               let name = listData["name"] as? String ?? listData["list_name"] as? String {
                let rawItems = listData["items"] as? [[String: Any]] ?? []
                let items = rawItems.compactMap { item -> GroceryListItem? in
                    guard let n = item["name"] as? String else { return nil }
                    let qty = (item["quantity"] as? String) ?? (item["quantity"].map { "\($0)" })
                    return GroceryListItem(
                        name: n,
                        category: item["category"] as? String,
                        meal: item["meal"] as? String,
                        quantity: qty,
                        unit: item["unit"] as? String
                    )
                }
                let createdAt = s["created_at"] as? String ?? ""
                let gl = GroceryList(
                    id: sessionId,
                    name: name,
                    items: items,
                    createdAt: createdAt,
                    isActive: true,
                    savingsAmount: nil,
                    leastExpensiveStoreName: nil,
                    leastExpensiveStorePrice: nil,
                    mostExpensiveStoreName: nil,
                    mostExpensiveStorePrice: nil
                )
                result.append(gl)
            }
        }
        return result
    }

    private func rawFetch<T>(path: String, headers: [String: String]) async throws -> T {
        guard var url = URL(string: "https://savr.app/api/\(path)") else {
            throw APIError.invalidURL
        }
        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.timeoutInterval = 10
        for (k, v) in headers { request.setValue(v, forHTTPHeaderField: k) }
        let (data, _) = try await URLSession.shared.data(for: request)
        guard let obj = try JSONSerialization.jsonObject(with: data) as? T else {
            throw APIError.decodingFailed
        }
        return obj
    }

    func deleteList(id: String) async throws {
        guard let session = tokenStore.loadSession() else { return }
        // DELETE returns 204 no content — use raw send
        guard var url = URL(string: "https://savr.app/api/grocery-lists/\(id)") else { return }
        var request = URLRequest(url: url)
        request.httpMethod = "DELETE"
        request.setValue("Bearer \(session.accessToken)", forHTTPHeaderField: "Authorization")
        request.timeoutInterval = 10
        _ = try? await URLSession.shared.data(for: request)
    }
}

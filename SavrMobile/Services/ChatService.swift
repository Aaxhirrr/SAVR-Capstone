import Foundation

struct ChatAPIResponse: Decodable {
    let sessionId: String
    let botResponse: String

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        // API may return snake_case or camelCase
        if let sid = try? container.decode(String.self, forKey: .sessionId) {
            sessionId = sid
        } else {
            sessionId = try container.decode(String.self, forKey: .sessionIdSnake)
        }
        if let bot = try? container.decode(String.self, forKey: .botResponse) {
            botResponse = bot
        } else {
            botResponse = try container.decode(String.self, forKey: .botResponseSnake)
        }
    }

    private enum CodingKeys: String, CodingKey {
        case sessionId = "sessionId"
        case sessionIdSnake = "session_id"
        case botResponse = "botResponse"
        case botResponseSnake = "bot_response"
    }
}

final class ChatService {
    private let apiClient: APIClient
    private let tokenStore: AuthTokenStore

    init(apiClient: APIClient = .shared, tokenStore: AuthTokenStore = AuthTokenStore()) {
        self.apiClient = apiClient
        self.tokenStore = tokenStore
    }

    func fetchHistory(sessionId: String) async throws -> [ChatMessage] {
        guard let session = tokenStore.loadSession() else {
            throw APIError.requestFailed(statusCode: 401, message: "Not signed in.", responseBody: nil, requestURL: nil, method: "GET")
        }
        // Backend returns array of { id, content, is_user, timestamp }
        struct HistoryMessage: Decodable {
            let id: String
            let content: String
            let is_user: Bool
            let timestamp: String
        }
        let history: [HistoryMessage] = try await apiClient.send(
            path: "chat/history/\(sessionId)",
            method: "GET",
            headers: [
                "Authorization": "Bearer \(session.accessToken)",
                "Accept": "application/json"
            ]
        )
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        return history.map { msg in
            ChatMessage(
                role: msg.is_user ? .user : .assistant,
                text: msg.content,
                timestamp: formatter.date(from: msg.timestamp) ?? ISO8601DateFormatter().date(from: msg.timestamp) ?? Date()
            )
        }
    }

    func sendMessage(text: String, sessionId: String?, imageData: Data? = nil, context: [String: String]? = nil) async throws -> ChatAPIResponse {
        guard let session = tokenStore.loadSession() else {
            throw APIError.requestFailed(
                statusCode: 401,
                message: "You are not signed in.",
                responseBody: nil,
                requestURL: nil,
                method: "POST"
            )
        }

        var body: [String: Any] = ["message": text]
        if let sessionId { body["sessionId"] = sessionId }
        if let context { body["context"] = context }
        if let imageData {
            body["imageBase64"] = imageData.base64EncodedString()
            body["imageMediaType"] = "image/jpeg"
        }

        let data = try JSONSerialization.data(withJSONObject: body)

        let response: ChatAPIResponse = try await apiClient.send(
            path: "chat/message",
            method: "POST",
            headers: [
                "Authorization": "Bearer \(session.accessToken)",
                "Content-Type": "application/json",
                "Accept": "application/json"
            ],
            body: data,
            timeout: 90
        )
        return response
    }
}

struct ChatSessionSummary: Decodable, Identifiable {
    let id: String
    let created_at: String
    let updated_at: String
}
struct SessionListResponse: Decodable {
    struct ListInfo: Decodable { let id: String; let name: String }
    let list: ListInfo?
    let items: [GroceryListItem]
    let itemsCount: Int
}
extension ChatService {
    private func headers() throws -> [String: String] {
        guard let session = tokenStore.loadSession() else { throw APIError.notSignedIn }
        return ["Authorization": "Bearer \(session.accessToken)", "Accept": "application/json", "Content-Type": "application/json"]
    }
    func createSession() async throws -> String {
        struct Welcome: Decodable { let session_id: String }
        let response: Welcome = try await apiClient.send(path: "chat/welcome", method: "POST", headers: headers())
        return response.session_id
    }
    func fetchSessions() async throws -> [ChatSessionSummary] {
        try await apiClient.send(path: "chat/sessions", method: "GET", headers: headers())
    }
    func currentList(sessionId: String) async throws -> SessionListResponse {
        try await apiClient.send(path: "chat/session/\(sessionId)/list", method: "GET", headers: headers())
    }
    func finalizeList(sessionId: String) async throws -> String {
        struct Response: Decodable { let listId: String }
        let result: Response = try await apiClient.send(path: "chat/session/\(sessionId)/finalize", method: "POST", headers: headers(), body: Data("{}".utf8))
        return result.listId
    }
    func detachList(sessionId: String) async throws {
        let _: EmptyAPIResponse = try await apiClient.send(path: "chat/session/\(sessionId)/current_list", method: "DELETE", headers: headers())
    }
}

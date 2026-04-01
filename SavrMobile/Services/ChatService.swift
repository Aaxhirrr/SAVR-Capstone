import Foundation

struct ChatAPIResponse: Decodable {
    let sessionId: String
    let botResponse: String

    private enum CodingKeys: String, CodingKey {
        case sessionId = "sessionId"
        case botResponse = "botResponse"
    }
}

final class ChatService {
    private let apiClient: APIClient
    private let tokenStore: AuthTokenStore

    init(apiClient: APIClient = .shared, tokenStore: AuthTokenStore = AuthTokenStore()) {
        self.apiClient = apiClient
        self.tokenStore = tokenStore
    }

    func sendMessage(text: String, sessionId: String?) async throws -> ChatAPIResponse {
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

        let data = try JSONSerialization.data(withJSONObject: body)

        let response: ChatAPIResponse = try await apiClient.send(
            path: "chat/message",
            method: "POST",
            headers: [
                "Authorization": "Bearer \(session.accessToken)",
                "Content-Type": "application/json",
                "Accept": "application/json"
            ],
            body: data
        )
        return response
    }
}

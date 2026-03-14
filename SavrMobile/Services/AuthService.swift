import Foundation

final class AuthService {
    private let apiClient: APIClient
    private let tokenStore: AuthTokenStore

    init(
        apiClient: APIClient = .shared,
        tokenStore: AuthTokenStore = AuthTokenStore()
    ) {
        self.apiClient = apiClient
        self.tokenStore = tokenStore
    }

    func login(username: String, password: String) async throws -> AuthSession {
        let boundary = "Boundary-\(UUID().uuidString)"
        let body = multipartBody(
            boundary: boundary,
            fields: [
                ("username", username),
                ("password", password)
            ]
        )

        let response: LoginResponse = try await apiClient.send(
            path: "auth/login",
            method: "POST",
            headers: [
                "Content-Type": "multipart/form-data; boundary=\(boundary)",
                "Accept": "application/json"
            ],
            body: body
        )

        let session = AuthSession(accessToken: response.accessToken, userID: response.userID)
        try tokenStore.save(accessToken: session.accessToken, userID: session.userID)
        return session
    }

    func restoreSession() -> AuthSession? {
        tokenStore.loadSession()
    }

    func fetchProfile() async throws -> UserProfile {
        guard let session = tokenStore.loadSession() else {
            throw APIError.requestFailed(
                statusCode: 401,
                message: "You are not signed in.",
                responseBody: nil,
                requestURL: nil,
                method: "GET"
            )
        }

        let response: UserProfileResponse = try await apiClient.send(
            path: "auth/profile",
            method: "GET",
            headers: [
                "Authorization": "Bearer \(session.accessToken)",
                "Accept": "application/json"
            ]
        )

        return UserProfile(response: response)
    }

    func logout() throws {
        try tokenStore.clear()
    }

    private func multipartBody(boundary: String, fields: [(String, String)]) -> Data {
        var body = Data()

        for (name, value) in fields {
            body.append("--\(boundary)\r\n")
            body.append("Content-Disposition: form-data; name=\"\(name)\"\r\n\r\n")
            body.append("\(value)\r\n")
        }

        body.append("--\(boundary)--\r\n")
        return body
    }
}

private extension Data {
    mutating func append(_ string: String) {
        append(Data(string.utf8))
    }
}

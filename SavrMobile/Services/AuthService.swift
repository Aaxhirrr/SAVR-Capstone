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

    func signup(
        email: String,
        password: String,
        firstName: String?,
        lastName: String?,
        phone: String?,
        street: String?,
        city: String?,
        province: String?,
        postal: String?
    ) async throws -> AuthSession {
        var body: [String: Any] = [
            "email": email,
            "password": password
        ]
        if let firstName { body["first_name"] = firstName }
        if let lastName { body["last_name"] = lastName }
        if let phone, !phone.isEmpty { body["phone"] = phone }

        let hasAddress = [street, city, province, postal].contains(where: { !($0?.isEmpty ?? true) })
        if hasAddress {
            var addr: [String: String] = [:]
            if let street, !street.isEmpty { addr["street"] = street }
            if let city, !city.isEmpty { addr["city"] = city }
            if let province, !province.isEmpty { addr["province"] = province }
            if let postal, !postal.isEmpty { addr["postalCode"] = postal }
            body["address"] = addr
        }

        let data = try JSONSerialization.data(withJSONObject: body)
        let response: LoginResponse = try await apiClient.send(
            path: "auth/signup",
            method: "POST",
            headers: [
                "Content-Type": "application/json",
                "Accept": "application/json"
            ],
            body: data
        )

        let session = AuthSession(accessToken: response.accessToken, userID: response.userID)
        try tokenStore.save(accessToken: session.accessToken, userID: session.userID)
        return session
    }

    func updateProfile(
        firstName: String?,
        lastName: String?,
        phone: String?,
        address: CanadianAddress?,
        dietaryRestrictions: [String],
        likedBrands: [(category: String, brand: String)],
        dislikedBrands: [(category: String, brand: String)]
    ) async throws {
        guard let session = tokenStore.loadSession() else {
            throw APIError.requestFailed(statusCode: 401, message: "Not signed in.", responseBody: nil, requestURL: nil, method: "PUT")
        }

        var body: [String: Any] = [:]
        if let firstName { body["first_name"] = firstName }
        if let lastName { body["last_name"] = lastName }
        if let phone, !phone.isEmpty { body["phone"] = phone }

        // Address is stored as a plain string on the mobile side — send as street
        if let address {
            body["address"] = try JSONSerialization.jsonObject(with: JSONEncoder().encode(address))
        }

        body["dietaryRestrictions"] = dietaryRestrictions

        var liked: [String: String] = [:]
        for entry in likedBrands where !entry.brand.isEmpty {
            liked[entry.category.isEmpty ? entry.brand : entry.category] = entry.brand
        }
        var disliked: [String: String] = [:]
        for entry in dislikedBrands where !entry.brand.isEmpty {
            disliked[entry.category.isEmpty ? entry.brand : entry.category] = entry.brand
        }
        body["brandPreferences"] = ["liked": liked, "disliked": disliked]

        let data = try JSONSerialization.data(withJSONObject: body)
        let _: UserProfileResponse = try await apiClient.send(
            path: "auth/profile",
            method: "PUT",
            headers: [
                "Authorization": "Bearer \(session.accessToken)",
                "Content-Type": "application/json",
                "Accept": "application/json"
            ],
            body: data
        )
    }

    func deleteAccount(password: String) async throws {
        guard let session = tokenStore.loadSession() else {
            throw APIError.requestFailed(statusCode: 401, message: "Not signed in.", responseBody: nil, requestURL: nil, method: "DELETE")
        }
        let _: EmptyAPIResponse = try await apiClient.send(
            path: "auth/account",
            method: "DELETE",
            headers: [
                "Authorization": "Bearer \(session.accessToken)",
                "Accept": "application/json",
                "Content-Type": "application/json"
            ],
            body: try JSONSerialization.data(withJSONObject: ["password": password, "confirmationText": "DELETE"])
        )
        try tokenStore.clear()
    }

    func requestPasswordReset(email: String) async throws {
        let _: EmptyAPIResponse = try await apiClient.send(path: "auth/forgot-password", method: "POST", headers: ["Content-Type": "application/json"], body: JSONSerialization.data(withJSONObject: ["email": email.trimmingCharacters(in: .whitespacesAndNewlines)]))
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

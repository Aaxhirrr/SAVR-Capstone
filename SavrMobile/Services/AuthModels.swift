import Foundation

struct LoginResponse: Decodable {
    let accessToken: String
    let userID: String

    private enum CodingKeys: String, CodingKey {
        case accessToken = "access_token"
        case userID = "user_id"
    }
}

struct AuthSession {
    let accessToken: String
    let userID: String
}

struct UserProfileResponse: Decodable {
    let firstName: String?
    let lastName: String?
    let email: String?
    let username: String?

    private enum CodingKeys: String, CodingKey {
        case firstName = "first_name"
        case lastName = "last_name"
        case email
        case username
    }
}

struct UserProfile {
    let firstName: String?
    let lastName: String?
    let email: String?
    let username: String?

    init(response: UserProfileResponse) {
        firstName = response.firstName?.trimmingCharacters(in: .whitespacesAndNewlines)
        lastName = response.lastName?.trimmingCharacters(in: .whitespacesAndNewlines)
        email = response.email?.trimmingCharacters(in: .whitespacesAndNewlines)
        username = response.username?.trimmingCharacters(in: .whitespacesAndNewlines)
    }

    var displayName: String {
        let fullName = [firstName, lastName]
            .compactMap { $0 }
            .filter { !$0.isEmpty }
            .joined(separator: " ")

        if !fullName.isEmpty {
            return fullName
        }

        if let email, !email.isEmpty {
            return email
        }

        if let username, !username.isEmpty {
            return username
        }

        return "User"
    }

    var firstDisplayName: String {
        if let firstName, !firstName.isEmpty {
            return firstName
        }

        return displayName.components(separatedBy: " ").first ?? "there"
    }
}

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
    let phone: String?
    let dietaryRestrictions: [String]?
    let brandPreferences: BrandPreferencesResponse?

    private enum CodingKeys: String, CodingKey {
        case firstName = "first_name"
        case lastName = "last_name"
        case email
        case username
        case phone
        // backend returns both camelCase and snake_case — pick one
        case dietaryRestrictions = "dietary_restrictions"
        case brandPreferences = "brand_preferences"
    }
}

struct BrandPreferencesResponse: Decodable {
    // The backend stores liked/disliked as { "Category": "BrandName" } dicts
    let liked: [String: String]?
    let disliked: [String: String]?
}

struct UserProfile {
    let firstName: String?
    let lastName: String?
    let email: String?
    let username: String?
    let phone: String?
    let dietaryRestrictions: [String]
    let likedBrands: [(category: String, brand: String)]
    let dislikedBrands: [(category: String, brand: String)]

    init(response: UserProfileResponse) {
        firstName = response.firstName?.trimmingCharacters(in: .whitespacesAndNewlines)
        lastName = response.lastName?.trimmingCharacters(in: .whitespacesAndNewlines)
        email = response.email?.trimmingCharacters(in: .whitespacesAndNewlines)
        username = response.username?.trimmingCharacters(in: .whitespacesAndNewlines)
        phone = response.phone?.trimmingCharacters(in: .whitespacesAndNewlines)
        dietaryRestrictions = response.dietaryRestrictions ?? []
        likedBrands = (response.brandPreferences?.liked ?? [:]).map { ($0.key, $0.value) }
        dislikedBrands = (response.brandPreferences?.disliked ?? [:]).map { ($0.key, $0.value) }
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

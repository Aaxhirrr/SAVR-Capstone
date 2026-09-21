import Foundation
import Security

final class AuthTokenStore {
    private let service: String
    init(service: String = "com.savr.mobile.auth") { self.service = service }
    private let tokenAccount = "access_token"
    private let userIDKey = "savr_user_id"

    func save(accessToken: String, userID: String) throws {
        if loadUserID() != userID { clearUserCaches() }
        try saveToken(accessToken)
        UserDefaults.standard.set(userID, forKey: userIDKey)
    }

    func loadSession() -> AuthSession? {
        guard let accessToken = loadToken(), let userID = loadUserID() else {
            return nil
        }

        return AuthSession(accessToken: accessToken, userID: userID)
    }

    func clearUserCaches() {
        for key in UserDefaults.standard.dictionaryRepresentation().keys
        where key.hasPrefix("savr_") || key.hasPrefix("savr.") {
            UserDefaults.standard.removeObject(forKey: key)
        }
    }

    func clear() throws {
        defer { clearUserCaches() }
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: tokenAccount
        ]

        let status = SecItemDelete(query as CFDictionary)
        guard status == errSecSuccess || status == errSecItemNotFound else {
            throw KeychainError.unhandled(status)
        }

        UserDefaults.standard.removeObject(forKey: userIDKey)
    }

    private func saveToken(_ token: String) throws {
        let data = Data(token.utf8)
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: tokenAccount
        ]

        let attributes: [String: Any] = [
            kSecValueData as String: data
        ]

        let updateStatus = SecItemUpdate(query as CFDictionary, attributes as CFDictionary)
        if updateStatus == errSecItemNotFound {
            var insertQuery = query
            insertQuery[kSecValueData as String] = data

            let addStatus = SecItemAdd(insertQuery as CFDictionary, nil)
            guard addStatus == errSecSuccess else {
                throw KeychainError.unhandled(addStatus)
            }
        } else if updateStatus != errSecSuccess {
            throw KeychainError.unhandled(updateStatus)
        }
    }

    private func loadToken() -> String? {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: tokenAccount,
            kSecReturnData as String: true,
            kSecMatchLimit as String: kSecMatchLimitOne
        ]

        var item: CFTypeRef?
        let status = SecItemCopyMatching(query as CFDictionary, &item)
        guard status == errSecSuccess, let data = item as? Data else {
            return nil
        }

        return String(data: data, encoding: .utf8)
    }

    private func loadUserID() -> String? {
        UserDefaults.standard.string(forKey: userIDKey)
    }
}

private enum KeychainError: LocalizedError {
    case unhandled(OSStatus)

    var errorDescription: String? {
        switch self {
        case let .unhandled(status):
            return "Keychain error: \(status)"
        }
    }
}

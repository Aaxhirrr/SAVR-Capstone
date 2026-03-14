import Foundation

@MainActor
final class AppState: ObservableObject {
    enum SessionState {
        case loading
        case signedOut
        case signedIn
    }

    @Published private(set) var sessionState: SessionState = .loading
    @Published private(set) var userID: String?
    @Published private(set) var profile: UserProfile?

    private let authService: AuthService

    var isSignedIn: Bool {
        sessionState == .signedIn
    }

    var displayName: String {
        profile?.displayName ?? "User"
    }

    var firstName: String {
        profile?.firstDisplayName ?? "there"
    }

    init(authService: AuthService = AuthService()) {
        self.authService = authService
    }

    func bootstrap() async {
        if let session = authService.restoreSession() {
            userID = session.userID
            profile = try? await authService.fetchProfile()
            sessionState = .signedIn
        } else {
            userID = nil
            profile = nil
            sessionState = .signedOut
        }
    }

    func signIn(username: String, password: String) async throws {
        let session = try await authService.login(username: username, password: password)
        userID = session.userID
        profile = try? await authService.fetchProfile()
        sessionState = .signedIn
    }

    func signOut() {
        do {
            try authService.logout()
        } catch {
            // Local logout should still clear UI state even if persistence cleanup fails.
        }

        userID = nil
        profile = nil
        sessionState = .signedOut
    }
}

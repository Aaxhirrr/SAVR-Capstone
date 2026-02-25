import Foundation

final class AppState: ObservableObject {
    @Published var isSignedIn: Bool = false
}
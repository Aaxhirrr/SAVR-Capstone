import SwiftUI

struct RootView: View {
    @EnvironmentObject private var appState: AppState

    var body: some View {
        NavigationStack {
            if appState.isSignedIn {
                AppShellView()
                    .navigationBarHidden(true)
            } else {
                HomeLandingView()
                    .navigationBarHidden(true)
            }
        }
    }
}
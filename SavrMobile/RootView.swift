import SwiftUI

struct RootView: View {
    @EnvironmentObject private var appState: AppState

    var body: some View {
        NavigationStack {
            switch appState.sessionState {
            case .loading:
                ZStack {
                    LinearGradient(
                        colors: [SavrColors.bgTop, SavrColors.bgBottom],
                        startPoint: .top,
                        endPoint: .bottom
                    )
                    .ignoresSafeArea()

                    ProgressView("Loading account...")
                        .tint(SavrColors.brandGreen)
                }
                .navigationBarHidden(true)
            case .signedIn:
                AppShellView()
                    .navigationBarHidden(true)
            case .signedOut:
                HomeLandingView()
                    .navigationBarHidden(true)
            }
        }
    }
}

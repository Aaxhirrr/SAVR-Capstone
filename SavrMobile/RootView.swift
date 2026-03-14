import SwiftUI

struct RootView: View {
    @EnvironmentObject private var appState: AppState

    var body: some View {
        NavigationStack {
            ZStack {
                HomeLandingView()
                    .navigationBarHidden(true)

                if appState.sessionState == .loading {
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
                }
            }
        }
    }
}

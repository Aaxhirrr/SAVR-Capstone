import SwiftUI

struct RootView: View {
    var body: some View {
        NavigationStack {
            HomeLandingView()
                .navigationBarHidden(true)
        }
    }
}
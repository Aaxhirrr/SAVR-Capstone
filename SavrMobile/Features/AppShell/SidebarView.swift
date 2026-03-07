import SwiftUI

struct SidebarView: View {
    @EnvironmentObject private var appState: AppState
    @Binding var selection: AppShellView.Route?

    var body: some View {
        VStack(spacing: 0) {
            HStack(spacing: 10) {
                SavrLogoView(size: 34)
                Spacer()
            }
            .padding(.horizontal, 14)
            .padding(.top, 14)
            .padding(.bottom, 10)

            List(selection: $selection) {
                NavigationLink(value: AppShellView.Route.chat) {
                    Label("Chat", systemImage: "message.fill")
                }
                NavigationLink(value: AppShellView.Route.flyers) {
                    Label("Flyers", systemImage: "newspaper")
                }
                NavigationLink(value: AppShellView.Route.lists) {
                    Label("My Lists", systemImage: "list.bullet.rectangle")
                }
            }
            .listStyle(.sidebar)

            Spacer()

            VStack(alignment: .leading, spacing: 10) {
                HStack(spacing: 10) {
                    Circle()
                        .fill(SavrColors.brandGreen.opacity(0.25))
                        .frame(width: 32, height: 32)
                        .overlay(Text("A").font(.system(size: 14, weight: .bold, design: .rounded)))
                    VStack(alignment: .leading, spacing: 2) {
                        Text("Aashir Javed")
                            .font(.system(size: 14, weight: .bold, design: .rounded))
                        Text("Signed in")
                            .font(.system(size: 12, weight: .medium, design: .rounded))
                            .foregroundStyle(.secondary)
                    }
                    Spacer()
                }

                Button {
                    appState.isSignedIn = false
                } label: {
                    HStack {
                        Image(systemName: "arrow.left.square")
                        Text("Logout")
                    }
                    .frame(maxWidth: .infinity)
                }
                .buttonStyle(SavrSecondaryButtonStyle())
            }
            .padding(14)
        }
        .background(
            LinearGradient(colors: [SavrColors.bgTop, SavrColors.bgBottom],
                           startPoint: .top, endPoint: .bottom)
            .ignoresSafeArea()
        )
    }
}

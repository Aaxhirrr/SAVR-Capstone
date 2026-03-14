import SwiftUI

struct SidebarView: View {
    @EnvironmentObject private var appState: AppState
    @Binding var selection: AppShellView.Route

    private var userInitial: String {
        guard let first = appState.displayName.first else { return "U" }
        return String(first).uppercased()
    }

    var body: some View {
        VStack(spacing: 0) {
            SavrLogoView(size: 30)
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(.horizontal, 14)
                .padding(.top, 18)
                .padding(.bottom, 22)

            Button {
                selection = .chat
            } label: {
                HStack(spacing: 10) {
                    Image(systemName: "plus")
                    Text("New Chat")
                        .lineLimit(1)
                }
                .font(.system(size: 13, weight: .bold, design: .rounded))
                .foregroundStyle(.white)
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(.horizontal, 12)
                .padding(.vertical, 12)
                .background(
                    LinearGradient(
                        colors: [Color(red: 0.99, green: 0.78, blue: 0.28), Color(red: 0.98, green: 0.82, blue: 0.34)],
                        startPoint: .leading,
                        endPoint: .trailing
                    )
                )
                .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
            }
            .padding(.horizontal, 8)
            .padding(.bottom, 8)

            VStack(spacing: 8) {
                navRow("Chat", systemImage: "message", route: .chat, tint: Color(red: 0.74, green: 0.93, blue: 0.84))
                navRow("Flyers", systemImage: "newspaper", route: .flyers, tint: Color(red: 0.99, green: 0.86, blue: 0.67))
                navRow("My Lists", systemImage: "cart", route: .lists, tint: Color(red: 0.99, green: 0.82, blue: 0.86))
            }
            .padding(.horizontal, 8)

            Spacer()

            VStack(alignment: .leading, spacing: 10) {
                HStack(spacing: 10) {
                    Circle()
                        .fill(SavrColors.brandGreen.opacity(0.25))
                        .frame(width: 32, height: 32)
                        .overlay(Text(userInitial).font(.system(size: 14, weight: .bold, design: .rounded)))
                    VStack(alignment: .leading, spacing: 2) {
                        Text(appState.displayName)
                            .font(.system(size: 13, weight: .bold, design: .rounded))
                            .lineLimit(1)
                        Text("Signed in")
                            .font(.system(size: 11, weight: .medium, design: .rounded))
                            .foregroundStyle(.secondary)
                    }
                    Spacer()
                }

                Button {
                    appState.signOut()
                } label: {
                    HStack {
                        Image(systemName: "arrow.left.square")
                        Text("Logout")
                    }
                    .frame(maxWidth: .infinity)
                }
                .font(.system(size: 13, weight: .bold, design: .rounded))
                .foregroundStyle(Color(red: 0.88, green: 0.44, blue: 0.47))
                .padding(.vertical, 10)
                .background(Color(red: 1.0, green: 0.94, blue: 0.95))
                .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))

                HStack(spacing: 10) {
                    Text("Terms")
                    Text("Privacy")
                }
                .font(.system(size: 10, weight: .medium, design: .rounded))
                .foregroundStyle(SavrColors.textSecondary)
            }
            .padding(14)
        }
        .padding(.bottom, 16)
        .background(Color.white)
        .overlay(Rectangle().fill(SavrColors.cardStroke.opacity(0.65)).frame(width: 1), alignment: .trailing)
    }

    private func navRow(_ title: String, systemImage: String, route: AppShellView.Route, tint: Color) -> some View {
        Button {
            selection = route
        } label: {
            HStack(spacing: 10) {
                ZStack {
                    RoundedRectangle(cornerRadius: 9, style: .continuous)
                        .fill(tint)
                        .frame(width: 28, height: 28)
                    Image(systemName: systemImage)
                        .font(.system(size: 13, weight: .semibold))
                }

                Text(title)
                    .font(.system(size: 13, weight: .bold, design: .rounded))
                    .foregroundStyle(SavrColors.textPrimary)
                    .lineLimit(1)

                Spacer(minLength: 0)
            }
            .padding(.horizontal, 10)
            .padding(.vertical, 10)
            .background(selection == route ? tint.opacity(0.35) : .clear)
            .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
        }
    }
}

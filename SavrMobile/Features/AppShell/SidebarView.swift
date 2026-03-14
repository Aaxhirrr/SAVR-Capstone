import SwiftUI

struct SidebarView: View {
    @EnvironmentObject private var appState: AppState

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            HStack {
                SavrLogoView(fontSize: 46)
                Spacer()
            }
            .padding(.horizontal, 18)
            .padding(.top, 22)
            .padding(.bottom, 24)

            Button { } label: {
                HStack(spacing: 12) {
                    ZStack {
                        RoundedRectangle(cornerRadius: 10, style: .continuous)
                            .fill(Color.white.opacity(0.25))
                            .frame(width: 38, height: 38)

                        Image(systemName: "plus")
                            .font(.system(size: 16, weight: .bold))
                            .foregroundStyle(.white)
                    }

                    Text("New Chat ✨")
                        .font(.system(size: 18, weight: .bold, design: .rounded))
                        .foregroundStyle(.white)

                    Spacer()
                }
                .padding(.horizontal, 14)
                .padding(.vertical, 14)
                .background(
                    LinearGradient(
                        colors: [
                            Color(red: 0.99, green: 0.72, blue: 0.21),
                            Color(red: 0.99, green: 0.81, blue: 0.05)
                        ],
                        startPoint: .leading,
                        endPoint: .trailing
                    )
                )
                .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
            }
            .padding(.horizontal, 12)

            VStack(spacing: 10) {
                SideNavItem(
                    title: "Chat",
                    systemImage: "bubble.left",
                    iconBg: Color(red: 0.22, green: 0.80, blue: 0.47),
                    isActive: true,
                    showChevron: false
                )

                SideNavItem(
                    title: "Flyers",
                    systemImage: "newspaper",
                    iconBg: Color(red: 1.00, green: 0.86, blue: 0.70),
                    isActive: false,
                    showChevron: false
                )

                SideNavItem(
                    title: "My Lists",
                    systemImage: "cart",
                    iconBg: Color(red: 1.00, green: 0.84, blue: 0.90),
                    isActive: false,
                    showChevron: true
                )
            }
            .padding(.horizontal, 12)
            .padding(.top, 8)

            Spacer()

            VStack(alignment: .leading, spacing: 16) {
                HStack(spacing: 12) {
                    ZStack {
                        Circle()
                            .fill(Color(red: 0.72, green: 0.83, blue: 1.00))
                            .frame(width: 30, height: 30)

                        Image(systemName: "person.crop.circle")
                            .font(.system(size: 15, weight: .bold))
                            .foregroundStyle(Color(red: 0.16, green: 0.34, blue: 0.75))
                    }

                    Text(appState.displayName)
                        .font(.system(size: 17, weight: .semibold, design: .rounded))
                        .foregroundStyle(Color(red: 0.24, green: 0.29, blue: 0.36))
                        .lineLimit(1)
                }

                Button {
                    appState.signOut()
                } label: {
                    HStack(spacing: 12) {
                        ZStack {
                            Circle()
                                .fill(Color(red: 1.00, green: 0.88, blue: 0.88))
                                .frame(width: 30, height: 30)

                            Image(systemName: "arrow.right.square")
                                .font(.system(size: 14, weight: .bold))
                                .foregroundStyle(Color(red: 0.92, green: 0.39, blue: 0.42))
                        }

                        Text("Logout")
                            .font(.system(size: 17, weight: .semibold, design: .rounded))
                            .foregroundStyle(Color(red: 0.24, green: 0.29, blue: 0.36))
                    }
                }

                HStack(spacing: 10) {
                    Text("Terms")
                    Text("•")
                    Text("Privacy")
                }
                .font(.system(size: 14, weight: .medium, design: .rounded))
                .foregroundStyle(Color(red: 0.55, green: 0.58, blue: 0.64))
                .padding(.leading, 4)
            }
            .padding(.horizontal, 22)
            .padding(.bottom, 18)
        }
        .background(Color(red: 0.99, green: 0.98, blue: 0.96))
    }
}

private struct SideNavItem: View {
    let title: String
    let systemImage: String
    let iconBg: Color
    let isActive: Bool
    let showChevron: Bool

    var body: some View {
        HStack(spacing: 14) {
            ZStack {
                RoundedRectangle(cornerRadius: 12, style: .continuous)
                    .fill(iconBg)
                    .frame(width: 36, height: 36)

                Image(systemName: systemImage)
                    .font(.system(size: 16, weight: .bold))
                    .foregroundStyle(isActive ? .white : Color(red: 0.93, green: 0.39, blue: 0.42))
            }

            Text(title)
                .font(.system(size: 18, weight: .semibold, design: .rounded))
                .foregroundStyle(isActive ? Color(red: 0.10, green: 0.52, blue: 0.22) : Color(red: 0.21, green: 0.27, blue: 0.36))

            Spacer()

            if showChevron {
                Image(systemName: "chevron.down")
                    .font(.system(size: 12, weight: .bold))
                    .foregroundStyle(Color(red: 0.38, green: 0.44, blue: 0.52))
            }
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 12)
        .background(
            isActive
            ? Color(red: 0.82, green: 0.95, blue: 0.87)
            : Color.clear
        )
        .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
    }
}

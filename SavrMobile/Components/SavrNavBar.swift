import SwiftUI

struct SavrNavBar: View {
    let onSignIn: () -> Void
    let onGetStarted: () -> Void

    var body: some View {
        HStack(spacing: 12) {
            logo

            Spacer(minLength: 4)

            HStack(spacing: 6) {
                Circle()
                    .fill(SavrColors.brandGreen)
                    .frame(width: 7, height: 7)
                Text("Live prices\nupdating")
                    .font(.system(size: 11, weight: .medium, design: .rounded))
                    .foregroundStyle(SavrColors.textSecondary)
                    .lineLimit(2)
            }
            .padding(.horizontal, 8)
            .padding(.vertical, 5)
            .background(.white.opacity(0.7))
            .clipShape(Capsule())

            Spacer(minLength: 4)

            HStack(spacing: 10) {
                Button("Sign In", action: onSignIn)
                    .font(.system(size: 13, weight: .semibold, design: .rounded))
                    .foregroundStyle(SavrColors.textPrimary)
                    .lineLimit(1)

                Button(action: onGetStarted) {
                    Text("Get\nStarted")
                        .font(.system(size: 12, weight: .bold, design: .rounded))
                        .foregroundStyle(.white)
                        .multilineTextAlignment(.center)
                        .lineLimit(2)
                        .minimumScaleFactor(0.9)
                        .frame(width: 78, height: 78)
                        .background(SavrColors.brandGreen)
                        .clipShape(Circle())
                }
            }
        }
        .padding(.horizontal, 18)
        .padding(.top, 10)
        .padding(.bottom, 12)
        .background(.white.opacity(0.9))
        .overlay(
            Rectangle()
                .fill(SavrColors.cardStroke.opacity(0.8))
                .frame(height: 1),
            alignment: .bottom
        )
    }

    private var logo: some View {
        Text("savr")
            .font(.system(size: 32, weight: .black, design: .rounded))
            .foregroundStyle(SavrColors.brandGreen)
            .overlay(alignment: .topTrailing) {
                Circle()
                    .fill(.red)
                    .frame(width: 8, height: 8)
                    .offset(x: -6, y: -3)
                    .opacity(0.92)
            }
            .padding(.trailing, 6)
            .lineLimit(1)
    }
}

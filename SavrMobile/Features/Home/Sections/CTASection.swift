import SwiftUI

struct CTASection: View {
    let onGetStarted: () -> Void
    let onSignIn: () -> Void

    var body: some View {
        VStack(spacing: 18) {
            VStack(spacing: 10) {
                Text("Ready to Start Saving?")
                    .font(.system(size: 34, weight: .black, design: .serif))
                    .foregroundStyle(SavrColors.textPrimary)
                    .multilineTextAlignment(.center)

                Text("Join Canadians who are already spending less on groceries every week. Create your free account in seconds and start comparing prices today.")
                    .font(.system(size: 17, weight: .medium, design: .rounded))
                    .foregroundStyle(SavrColors.textSecondary)
                    .multilineTextAlignment(.center)
                    .lineSpacing(4)
            }

            VStack(spacing: 12) {
                Button(action: onGetStarted) {
                    Text("Get Started for Free")
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 14)
                }
                .font(.system(size: 17, weight: .bold, design: .rounded))
                .foregroundStyle(.white)
                .background(SavrColors.brandGreen)
                .clipShape(Capsule())

                Button(action: onSignIn) {
                    Text("See How It Works")
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 14)
                }
                .font(.system(size: 17, weight: .bold, design: .rounded))
                .foregroundStyle(SavrColors.textPrimary)
                .background(.white.opacity(0.9))
                .clipShape(Capsule())
                .overlay(Capsule().stroke(SavrColors.cardStroke, lineWidth: 1))
            }
        }
        .padding(.horizontal, 22)
        .padding(.vertical, 30)
        .background(
            LinearGradient(
                colors: [SavrColors.mintGlow.opacity(0.6), SavrColors.peach.opacity(0.8)],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
        )
        .clipShape(RoundedRectangle(cornerRadius: 28, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: 28, style: .continuous)
                .stroke(SavrColors.cardStroke.opacity(0.9), lineWidth: 1)
        )
        .padding(.horizontal, 20)
    }
}

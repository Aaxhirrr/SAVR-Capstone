import SwiftUI

struct CTASection: View {
    let onGetStarted: () -> Void
    let onSignIn: () -> Void

    var body: some View {
        VStack(spacing: 12) {
            VStack(spacing: 6) {
                Text("Ready to Start Saving?")
                    .font(SavrTypography.sectionTitle)
                    .foregroundStyle(SavrColors.textPrimary)

                Text("Join Canadians who are already spending less on groceries.\nIt's free to try — no credit card required.")
                    .font(SavrTypography.body)
                    .foregroundStyle(SavrColors.textSecondary)
                    .multilineTextAlignment(.center)
            }

            HStack(spacing: 12) {
                Button(action: onGetStarted) {
                    HStack(spacing: 8) {
                        Text("Get Started Free")
                        Image(systemName: "arrow.right")
                    }
                }
                .buttonStyle(SavrPrimaryButtonStyle())

                Button("Sign In", action: onSignIn)
                    .buttonStyle(SavrSecondaryButtonStyle())
            }
            .padding(.top, 6)
        }
        .padding(18)
        .background(.white.opacity(0.85))
        .clipShape(RoundedRectangle(cornerRadius: 20, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: 20, style: .continuous)
                .stroke(SavrColors.brandBlue.opacity(0.7), lineWidth: 1)
        )
        .shadow(color: .black.opacity(0.06), radius: 14, x: 0, y: 10)
        .padding(.horizontal, 16)
        .padding(.top, 6)
    }
}
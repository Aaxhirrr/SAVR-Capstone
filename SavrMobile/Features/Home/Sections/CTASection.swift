import SwiftUI

struct CTASection: View {
    let onGetStarted: () -> Void
    let onHowItWorks: () -> Void

    var body: some View {
        VStack {
            VStack(spacing: 24) {
                Text("Ready to Start Saving?")
                    .font(SavrTypography.cta)
                    .foregroundStyle(SavrColors.deepGreen)
                    .multilineTextAlignment(.center)

                Text("Join Canadians who are already spending less on groceries every week. Create your free account in seconds — no credit card required. Start comparing prices across stores like No Frills, Loblaws, Metro, Walmart, and Sobeys today.")
                    .font(.system(size: 20, weight: .medium, design: .rounded))
                    .foregroundStyle(SavrColors.textSecondary)
                    .multilineTextAlignment(.center)
                    .lineSpacing(6)

                VStack(spacing: 16) {
                    Button(action: onGetStarted) {
                        Text("Get Started for Free")
                            .font(.system(size: 18, weight: .bold, design: .rounded))
                            .foregroundStyle(.white)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 18)
                            .background(SavrColors.brandGreen)
                            .clipShape(Capsule())
                    }

                    Button(action: onHowItWorks) {
                        Text("See How It Works")
                            .font(.system(size: 18, weight: .bold, design: .rounded))
                            .foregroundStyle(SavrColors.deepGreen)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 18)
                            .background(.white)
                            .clipShape(Capsule())
                    }
                }
            }
            .padding(.horizontal, 28)
            .padding(.vertical, 56)
            .frame(maxWidth: .infinity)
            .background(
                RoundedRectangle(cornerRadius: 30, style: .continuous)
                    .fill(
                        LinearGradient(
                            colors: [
                                Color(red: 0.82, green: 0.88, blue: 0.68),
                                SavrColors.ctaCard,
                                Color(red: 0.95, green: 0.81, blue: 0.61)
                            ],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )
            )
        }
        .padding(.horizontal, 28)
        .padding(.bottom, 24)
    }
}

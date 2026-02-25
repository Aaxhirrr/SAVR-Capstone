import SwiftUI

struct HowItWorksSection: View {
    var body: some View {
        VStack(spacing: 14) {
            PillTag(text: "Simple as 1-2-3")

            Text("How Savr Works")
                .font(SavrTypography.sectionTitle)
                .foregroundStyle(SavrColors.textPrimary)

            Text("From your kitchen to checkout in three easy steps")
                .font(SavrTypography.body)
                .foregroundStyle(SavrColors.textSecondary)

            VStack(spacing: 14) {
                InfoCard(
                    icon: "message.fill",
                    iconColor: SavrColors.brandGreen,
                    title: "Tell Savr What You Need",
                    subtitle: "Chat naturally about recipes, meal plans, or just the basics. Savr understands you and builds your list as you talk."
                )

                InfoCard(
                    icon: "mappin.and.ellipse",
                    iconColor: SavrColors.brandBlue,
                    title: "Choose Your Stores",
                    subtitle: "Pick up to 3 stores near you. Savr instantly checks real-time prices at each one — no more guessing."
                )

                InfoCard(
                    icon: "arrow.down.right",
                    iconColor: SavrColors.brandOrange,
                    title: "Save Real Money",
                    subtitle: "Compare every item side-by-side. Pick the best deals or go with the cheapest store overall. You decide."
                )
            }
            .padding(.horizontal, 16)
        }
        .padding(.top, 6)
    }
}
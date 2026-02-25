import SwiftUI

struct FeaturesSection: View {
    var body: some View {
        VStack(spacing: 14) {
            PillTag(text: "Packed with features")

            Text("Why Canadians Love Savr")
                .font(SavrTypography.sectionTitle)
                .foregroundStyle(SavrColors.textPrimary)

            Text("Everything you need to shop smarter, save more, and stress less")
                .font(SavrTypography.body)
                .foregroundStyle(SavrColors.textSecondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 24)

            VStack(spacing: 14) {
                InfoCard(
                    icon: "bubble.left.and.bubble.right.fill",
                    iconColor: SavrColors.brandGreen,
                    title: "Just Ask Savr",
                    subtitle: "No menus. No buttons. Describe what you need in your own words."
                )

                InfoCard(
                    icon: "chart.bar.fill",
                    iconColor: SavrColors.brandPurple,
                    title: "Compare 3 Stores Instantly",
                    subtitle: "Real prices, real-time. See exactly what you'll pay at each store before you leave home."
                )

                InfoCard(
                    icon: "camera.viewfinder",
                    iconColor: SavrColors.brandBlue,
                    title: "Snap & Shop",
                    subtitle: "Photograph a recipe, handwritten list, or your fridge — Savr reads it and builds your list."
                )

                InfoCard(
                    icon: "wand.and.stars.inverse",
                    iconColor: SavrColors.brandOrange,
                    title: "Always Your Choice",
                    subtitle: "Multiple options per item. Every dollar is your call."
                )

                InfoCard(
                    icon: "heart.fill",
                    iconColor: .pink,
                    title: "Made for You",
                    subtitle: "Set dietary preferences once. Vegan, gluten-free, allergies — covered."
                )

                InfoCard(
                    icon: "square.and.arrow.up",
                    iconColor: SavrColors.metricsGreen,
                    title: "Shop Your Way",
                    subtitle: "Print, share, or pull it up in-store. Your list goes wherever you go."
                )
            }
            .padding(.horizontal, 16)
        }
    }
}
import SwiftUI

struct FeaturesSection: View {
    var body: some View {
        VStack(spacing: 32) {
            StatBar(stats: [
                ("15+", "Canadian Stores"),
                ("3", "Store Comparison"),
                ("100%", "Free to Use"),
                ("∞", "Grocery Lists")
            ])

            VStack(spacing: 16) {
                Text("EVERYTHING YOU NEED")
                    .font(.system(size: 14, weight: .bold, design: .rounded))
                    .foregroundStyle(SavrColors.brandGreen)

                Text("Features Built for Savings")
                    .font(SavrTypography.section)
                    .foregroundStyle(SavrColors.deepGreen)
                    .multilineTextAlignment(.center)
            }

            VStack(spacing: 20) {
                FeatureCard(
                    title: "Just Ask SAVR",
                    detail: "Ask anything about your grocery trip. Need meal ideas, recipes, or help planning what to make with what you already have? SAVR understands your preferences and builds a personalized grocery list in seconds.",
                    icon: "bubble.left",
                    iconColor: SavrColors.brandGreen
                )

                FeatureCard(
                    title: "Compare 3 Stores Instantly",
                    detail: "SAVR scans 15+ Canadian grocery stores in real-time — including No Frills, Loblaws, Metro, Walmart, Sobeys, and FreshCo — then surfaces the top 3 closest options so you always shop the best price.",
                    icon: "arrow.left.arrow.right",
                    iconColor: SavrColors.featureYellow
                )

                FeatureCard(
                    title: "Snap & Shop",
                    detail: "Photograph a recipe, handwritten list, or your fridge. SAVR reads the image using AI and instantly builds a complete grocery list you can price-check across stores.",
                    icon: "viewfinder",
                    iconColor: SavrColors.deepGreen
                )

                FeatureCard(
                    title: "Multiple Options Per Item",
                    detail: "See multiple product options for every item on your list. Compare brands, sizes, and unit prices so every dollar is your call.",
                    icon: "checkmark",
                    iconColor: SavrColors.featureBeige
                )

                FeatureCard(
                    title: "Made for You",
                    detail: "Whether you eat vegan, gluten-free, keto, or have specific food allergies, SAVR tailors every suggestion to match your dietary needs.",
                    icon: "leaf",
                    iconColor: SavrColors.brandGreen
                )

                FeatureCard(
                    title: "Shop Your Way",
                    detail: "Print your list, share it with family, or pull it up on your phone while you shop. Your grocery list is always accessible when you need it.",
                    icon: "bag",
                    iconColor: SavrColors.featureYellow
                )
            }
        }
        .padding(.horizontal, 28)
        .padding(.bottom, 70)
    }
}

private struct StatBar: View {
    let stats: [(String, String)]

    var body: some View {
        VStack(spacing: 18) {
            ForEach(Array(stats.enumerated()), id: \.offset) { index, stat in
                VStack(spacing: 8) {
                    Text(stat.0)
                        .font(.system(size: 44, weight: .black, design: .rounded))
                        .foregroundStyle(.white)
                    Text(stat.1)
                        .font(.system(size: 16, weight: .medium, design: .rounded))
                        .foregroundStyle(.white.opacity(0.75))
                }

                if index < stats.count - 1 {
                    Rectangle()
                        .fill(.white.opacity(0.10))
                        .frame(height: 1)
                }
            }
        }
        .padding(.horizontal, 18)
        .padding(.vertical, 28)
        .background(SavrColors.statBar)
        .clipShape(RoundedRectangle(cornerRadius: 24, style: .continuous))
    }
}

private struct FeatureCard: View {
    let title: String
    let detail: String
    let icon: String
    let iconColor: Color

    var body: some View {
        VStack(alignment: .leading, spacing: 18) {
            ZStack {
                RoundedRectangle(cornerRadius: 14, style: .continuous)
                    .fill(iconColor)
                    .frame(width: 44, height: 44)

                Image(systemName: icon)
                    .font(.system(size: 18, weight: .bold))
                    .foregroundStyle(.white)
            }

            Text(title)
                .font(.system(size: 18, weight: .black, design: .rounded))
                .foregroundStyle(SavrColors.deepGreen)

            Text(detail)
                .font(SavrTypography.body)
                .foregroundStyle(SavrColors.textSecondary)
                .lineSpacing(5)

            Spacer()
        }
        .padding(22)
        .frame(maxWidth: .infinity, minHeight: 220, alignment: .topLeading)
        .background(.white)
        .clipShape(RoundedRectangle(cornerRadius: 20, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: 20, style: .continuous)
                .stroke(SavrColors.line, lineWidth: 1)
        )
    }
}

import SwiftUI

struct FeaturesSection: View {
    private let items: [(String, Color, String, String)] = [
        ("bubble.left", SavrColors.brandGreen, "Just Ask SAVR", "Ask anything about your grocery trip. Need meal ideas, recipes, or help planning what to make with what you already have?"),
        ("arrow.left.arrow.right", SavrColors.brandOrange, "Compare 3 Stores Instantly", "SAVR scans Canadian grocery stores in real time and surfaces the top closest options so you always shop the best price."),
        ("viewfinder", SavrColors.metricsGreen, "Snap & Shop", "Photograph a recipe, handwritten list, or your fridge. SAVR reads the image and builds a complete grocery list."),
        ("checkmark", SavrColors.peachGlow, "Multiple Options Per Item", "See multiple product options for every item on your list. Compare brands, sizes, and prices so every dollar is your call."),
        ("sprout", SavrColors.brandGreen, "Made for You", "Whether you eat vegan, gluten-free, keto, or have specific food allergies, SAVR tailors every suggestion."),
        ("bag", SavrColors.brandOrange, "Shop Your Way", "Print your list, share it with family, or pull it up on your phone while you shop. Your grocery list stays accessible.")
    ]

    var body: some View {
        VStack(spacing: 22) {
            VStack(spacing: 10) {
                Text("EVERYTHING YOU NEED")
                    .font(.system(size: 13, weight: .black, design: .rounded))
                    .foregroundStyle(SavrColors.brandGreen)

                Text("Features Built for Savings")
                    .font(.system(size: 34, weight: .black, design: .serif))
                    .foregroundStyle(SavrColors.textPrimary)
                    .multilineTextAlignment(.center)
            }

            VStack(spacing: 16) {
                ForEach(Array(items.enumerated()), id: \.offset) { _, item in
                    featureCard(icon: item.0, iconColor: item.1, title: item.2, subtitle: item.3)
                }
            }
            .padding(.horizontal, 20)
        }
    }

    private func featureCard(icon: String, iconColor: Color, title: String, subtitle: String) -> some View {
        VStack(alignment: .leading, spacing: 14) {
            RoundedRectangle(cornerRadius: 12, style: .continuous)
                .fill(iconColor.opacity(0.95))
                .frame(width: 38, height: 38)
                .overlay(
                    Image(systemName: icon)
                        .font(.system(size: 16, weight: .black))
                        .foregroundStyle(iconColor == SavrColors.peachGlow ? SavrColors.textPrimary : .white)
                )

            Text(title)
                .font(.system(size: 24, weight: .black, design: .rounded))
                .foregroundStyle(SavrColors.textPrimary)

            Text(subtitle)
                .font(.system(size: 15, weight: .medium, design: .rounded))
                .foregroundStyle(SavrColors.textSecondary)
                .lineSpacing(3)
        }
        .padding(18)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(.white)
        .clipShape(RoundedRectangle(cornerRadius: 24, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: 24, style: .continuous)
                .stroke(SavrColors.cardStroke.opacity(0.8), lineWidth: 1)
        )
        .shadow(color: .black.opacity(0.04), radius: 10, x: 0, y: 8)
    }
}

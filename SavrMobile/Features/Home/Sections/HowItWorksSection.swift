import SwiftUI

struct HowItWorksSection: View {
    var body: some View {
        VStack(spacing: 22) {
            VStack(spacing: 10) {
                Text("SIMPLE PROCESS")
                    .font(.system(size: 13, weight: .black, design: .rounded))
                    .foregroundStyle(SavrColors.brandGreen)

                Text("How It Works")
                    .font(.system(size: 34, weight: .black, design: .serif))
                    .foregroundStyle(SavrColors.textPrimary)
            }

            VStack(spacing: 16) {
                stepCard(number: "01", icon: "message", title: "Tell Savr What You Need", subtitle: "Chat naturally about recipes, meal plans, or just the basics. Savr understands you and builds your list as you talk.")
                stepCard(number: "02", icon: "arrow.left.arrow.right", title: "Choose Your Stores", subtitle: "Pick up to 3 stores near you. Savr instantly checks real-time prices at each one so you stop guessing.")
                stepCard(number: "03", icon: "cart", title: "Save Real Money", subtitle: "Compare every item side-by-side and pick the best deals or the cheapest store overall.")
            }
            .padding(.horizontal, 20)
        }
    }

    private func stepCard(number: String, icon: String, title: String, subtitle: String) -> some View {
        ZStack(alignment: .topTrailing) {
            RoundedRectangle(cornerRadius: 28, style: .continuous)
                .fill(
                    LinearGradient(
                        colors: [SavrColors.peach.opacity(0.92), SavrColors.peachGlow.opacity(0.72)],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    )
                )

            Text(number)
                .font(.system(size: 32, weight: .black, design: .rounded))
                .foregroundStyle(SavrColors.textPrimary.opacity(0.12))
                .padding(18)

            VStack(alignment: .leading, spacing: 14) {
                RoundedRectangle(cornerRadius: 14, style: .continuous)
                    .fill(SavrColors.brandGreen)
                    .frame(width: 54, height: 54)
                    .overlay(
                        Image(systemName: icon)
                            .font(.system(size: 20, weight: .bold))
                            .foregroundStyle(.white)
                    )

                Text(title)
                    .font(.system(size: 22, weight: .black, design: .rounded))
                    .foregroundStyle(SavrColors.textPrimary)

                Text(subtitle)
                    .font(.system(size: 15, weight: .medium, design: .rounded))
                    .foregroundStyle(SavrColors.textSecondary)
                    .lineSpacing(3)
            }
            .padding(20)
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .frame(maxWidth: .infinity)
        .frame(height: 210)
        .overlay(
            RoundedRectangle(cornerRadius: 28, style: .continuous)
                .stroke(SavrColors.cardStroke.opacity(0.8), lineWidth: 1)
        )
    }
}

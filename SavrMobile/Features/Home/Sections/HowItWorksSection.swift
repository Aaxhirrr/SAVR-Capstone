import SwiftUI

struct HowItWorksSection: View {
    var body: some View {
        VStack(spacing: 26) {
            Text("SIMPLE PROCESS")
                .font(.system(size: 14, weight: .bold, design: .rounded))
                .foregroundStyle(SavrColors.brandGreen)

            Text("How It Works")
                .font(SavrTypography.section)
                .foregroundStyle(SavrColors.deepGreen)

            VStack(spacing: 22) {
                ProcessCard(
                    number: "01",
                    step: "STEP 01",
                    title: "Tell Savr What You Need",
                    detail: "Chat naturally about recipes, meal plans, or just the basics. Savr understands you and builds your list as you talk.",
                    icon: "bubble.left"
                )

                ProcessCard(
                    number: "02",
                    step: "STEP 02",
                    title: "Choose Your Stores",
                    detail: "Pick up to 3 stores near you. Savr instantly checks real-time prices at each one — no more guessing.",
                    icon: "arrow.left.arrow.right"
                )

                ProcessCard(
                    number: "03",
                    step: "STEP 03",
                    title: "Save Real Money",
                    detail: "Compare every item side-by-side. Pick the best deals or go with the cheapest store overall. You decide.",
                    icon: "cart"
                )
            }
        }
        .padding(.horizontal, 28)
        .padding(.vertical, 90)
    }
}

private struct ProcessCard: View {
    let number: String
    let step: String
    let title: String
    let detail: String
    let icon: String

    var body: some View {
        VStack(alignment: .center, spacing: 14) {
            HStack {
                Spacer()
                Text(number)
                    .font(.system(size: 34, weight: .black, design: .rounded))
                    .foregroundStyle(Color.black.opacity(0.08))
            }

            ZStack {
                RoundedRectangle(cornerRadius: 16, style: .continuous)
                    .fill(SavrColors.brandGreen)
                    .frame(width: 52, height: 52)

                Image(systemName: icon)
                    .font(.system(size: 20, weight: .bold))
                    .foregroundStyle(.white)
            }

            Text(step)
                .font(.system(size: 12, weight: .bold, design: .rounded))
                .foregroundStyle(SavrColors.brandGreen)

            Text(title)
                .font(.system(size: 18, weight: .black, design: .rounded))
                .foregroundStyle(SavrColors.deepGreen)
                .multilineTextAlignment(.center)

            Text(detail)
                .font(SavrTypography.body)
                .foregroundStyle(SavrColors.textSecondary)
                .multilineTextAlignment(.center)
                .lineSpacing(4)
        }
        .padding(24)
        .frame(maxWidth: .infinity, minHeight: 250, alignment: .top)
        .background(SavrColors.processCard)
        .clipShape(RoundedRectangle(cornerRadius: 22, style: .continuous))
    }
}

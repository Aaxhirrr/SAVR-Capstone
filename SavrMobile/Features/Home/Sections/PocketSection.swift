import SwiftUI

struct PocketSection: View {
    var body: some View {
        VStack(spacing: 28) {
            Text("SEE IT IN ACTION")
                .font(.system(size: 14, weight: .bold, design: .rounded))
                .foregroundStyle(SavrColors.brandGreen)

            Text("Built for Your Pocket")
                .font(SavrTypography.section)
                .foregroundStyle(SavrColors.deepGreen)
                .multilineTextAlignment(.center)

            VStack(alignment: .center, spacing: 28) {
                previewPhone(title: "Chat Interface", width: 210, height: 260)
                previewPhone(title: "Price Comparison", width: 160, height: 220)
                previewPhone(title: "Grocery List", width: 230, height: 320)
            }
        }
        .padding(.horizontal, 28)
        .padding(.bottom, 80)
    }

    private func previewPhone(title: String, width: CGFloat, height: CGFloat) -> some View {
        VStack(spacing: 14) {
            RoundedRectangle(cornerRadius: 34, style: .continuous)
                .stroke(SavrColors.deepGreen, lineWidth: 7)
                .frame(width: width, height: height)
                .overlay(
                    RoundedRectangle(cornerRadius: 26, style: .continuous)
                        .fill(Color.white.opacity(0.96))
                        .padding(10)
                )
                .overlay(
                    Capsule()
                        .fill(SavrColors.deepGreen)
                        .frame(width: 72, height: 20)
                        .offset(y: -height / 2 + 14)
                )
                .shadow(color: .black.opacity(0.08), radius: 18, x: 0, y: 12)

            Text(title)
                .font(.system(size: 18, weight: .bold, design: .rounded))
                .foregroundStyle(SavrColors.deepGreen)
        }
    }
}

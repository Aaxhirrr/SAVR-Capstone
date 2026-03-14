import SwiftUI

struct FeatureCard: View {
    let title: String
    let body: String
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

            Text(body)
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

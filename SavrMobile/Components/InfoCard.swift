import SwiftUI

struct InfoCard: View {
    let icon: String
    let iconColor: Color
    let title: String
    let subtitle: String

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            ZStack {
                RoundedRectangle(cornerRadius: 14, style: .continuous)
                    .fill(iconColor)
                    .frame(width: 54, height: 54)
                Image(systemName: icon)
                    .font(.system(size: 22, weight: .bold))
                    .foregroundStyle(.white)
            }

            Text(title)
                .font(SavrTypography.cardTitle)
                .foregroundStyle(SavrColors.textPrimary)

            Text(subtitle)
                .font(SavrTypography.caption)
                .foregroundStyle(SavrColors.textSecondary)
                .fixedSize(horizontal: false, vertical: true)

            Spacer(minLength: 0)
        }
        .padding(16)
        .frame(maxWidth: .infinity, minHeight: 160, alignment: .topLeading)
        .background(SavrColors.card)
        .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: 18, style: .continuous)
                .stroke(SavrColors.cardStroke, lineWidth: 1)
        )
        .shadow(color: .black.opacity(0.05), radius: 12, x: 0, y: 8)
    }
}
import SwiftUI

struct ProcessCard: View {
    let number: String
    let step: String
    let title: String
    let body: String
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

            Text(body)
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

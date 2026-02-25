import SwiftUI

struct PillTag: View {
    let text: String

    var body: some View {
        Text(text.uppercased())
            .font(SavrTypography.caption)
            .foregroundStyle(SavrColors.textSecondary)
            .padding(.vertical, 6)
            .padding(.horizontal, 10)
            .background(.white.opacity(0.65))
            .clipShape(Capsule())
            .overlay(Capsule().stroke(SavrColors.cardStroke, lineWidth: 1))
    }
}
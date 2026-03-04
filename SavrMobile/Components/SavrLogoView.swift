import SwiftUI

struct SavrLogoView: View {
    var size: CGFloat = 54

    var body: some View {
        ZStack {
            Text("savr")
                .font(.system(size: size, weight: .black, design: .rounded))
                .foregroundStyle(SavrColors.brandGreen)

            Circle()
                .fill(.red.opacity(0.9))
                .frame(width: max(6, size * 0.12), height: max(6, size * 0.12))
                .offset(x: size * 0.37, y: -size * 0.22)
        }
        .accessibilityLabel("Savr")
    }
}
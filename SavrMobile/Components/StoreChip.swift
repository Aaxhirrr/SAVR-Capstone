import SwiftUI

struct StoreChip: View {
    let text: String

    var body: some View {
        Text(text)
            .font(.system(size: 16, weight: .semibold, design: .rounded))
            .foregroundStyle(SavrColors.deepGreen)
            .padding(.horizontal, 20)
            .padding(.vertical, 14)
            .background(.white)
            .clipShape(Capsule())
            .overlay(
                Capsule()
                    .stroke(SavrColors.line, lineWidth: 1.2)
            )
    }
}

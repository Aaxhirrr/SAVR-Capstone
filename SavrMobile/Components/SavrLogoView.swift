import SwiftUI

struct SavrLogoView: View {
    var fontSize: CGFloat = 54

    init(fontSize: CGFloat = 54) {
        self.fontSize = fontSize
    }

    init(size: CGFloat = 54) {
        self.fontSize = size
    }

    var body: some View {
        Text("savr")
            .font(.system(size: fontSize, weight: .black, design: .rounded))
            .foregroundStyle(Color(red: 0.43, green: 0.78, blue: 0.45))
            .overlay(
                Circle()
                    .fill(Color.red)
                    .frame(width: max(8, fontSize * 0.10), height: max(8, fontSize * 0.10))
                    .offset(x: fontSize * 0.28, y: -fontSize * 0.18)
            )
        .accessibilityLabel("Savr")
    }
}

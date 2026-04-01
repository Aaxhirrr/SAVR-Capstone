import SwiftUI

struct SavrBackground: ViewModifier {
    func body(content: Content) -> some View {
        content
            .background(
                ZStack {
                    LinearGradient(
                        colors: [SavrColors.bgTop, SavrColors.bgBottom],
                        startPoint: .top,
                        endPoint: .bottom
                    )

                    Circle()
                        .fill(SavrColors.mintGlow.opacity(0.35))
                        .frame(width: 260, height: 260)
                        .blur(radius: 30)
                        .offset(x: 120, y: 180)

                    Circle()
                        .fill(SavrColors.peachGlow.opacity(0.28))
                        .frame(width: 240, height: 240)
                        .blur(radius: 32)
                        .offset(x: -110, y: 420)
                }
                .ignoresSafeArea()
            )
    }
}

extension View {
    func savrBackground() -> some View { modifier(SavrBackground()) }
}

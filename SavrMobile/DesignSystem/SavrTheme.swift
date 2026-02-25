import SwiftUI

struct SavrBackground: ViewModifier {
    func body(content: Content) -> some View {
        content
            .background(
                LinearGradient(
                    colors: [SavrColors.bgTop, SavrColors.bgBottom],
                    startPoint: .top,
                    endPoint: .bottom
                )
                .ignoresSafeArea()
            )
    }
}

extension View {
    func savrBackground() -> some View { modifier(SavrBackground()) }
}
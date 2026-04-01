import SwiftUI

struct FlyersView: View {
    var body: some View {
        ZStack {
            LinearGradient(colors: [SavrColors.bgTop, SavrColors.bgBottom],
                           startPoint: .top, endPoint: .bottom)
            .ignoresSafeArea()

            VStack(spacing: 10) {
                Text("Flyers")
                    .font(.system(size: 28, weight: .black, design: .rounded))
                Text("Coming soon - flyer browsing & deals.")
                    .foregroundStyle(.secondary)
            }
        }
    }
}
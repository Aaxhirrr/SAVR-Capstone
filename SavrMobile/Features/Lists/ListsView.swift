import SwiftUI

struct ListsView: View {
    var body: some View {
        ZStack {
            LinearGradient(colors: [SavrColors.bgTop, SavrColors.bgBottom],
                           startPoint: .top, endPoint: .bottom)
            .ignoresSafeArea()

            VStack(spacing: 12) {
                Image(systemName: "cart")
                    .font(.system(size: 44, weight: .bold))
                    .foregroundStyle(SavrColors.textSecondary)

                Text("My Lists")
                    .font(.system(size: 28, weight: .black, design: .rounded))

                Text("No lists yet. Start a chat to create one.")
                    .foregroundStyle(.secondary)
            }
        }
    }
}
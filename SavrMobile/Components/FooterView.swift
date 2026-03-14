import SwiftUI

struct FooterView: View {
    var body: some View {
        VStack(spacing: 0) {
            Rectangle()
                .fill(SavrColors.line)
                .frame(height: 1)

            VStack(spacing: 18) {
                Text("savr")
                    .font(.system(size: 28, weight: .black, design: .rounded))
                    .foregroundStyle(SavrColors.brandGreen)
                    .overlay(alignment: .topTrailing) {
                        Circle()
                            .fill(.red)
                            .frame(width: 7, height: 7)
                            .offset(x: -5, y: -2)
                    }

                Text("Built with love in Canada · 2026 © SAVR")
                    .font(.system(size: 15, weight: .medium, design: .rounded))
                    .foregroundStyle(SavrColors.textSecondary)
                    .multilineTextAlignment(.center)

                HStack(spacing: 24) {
                    Text("Blog")
                    Text("Privacy")
                    Text("Terms")
                }
                .font(.system(size: 15, weight: .semibold, design: .rounded))
                .foregroundStyle(SavrColors.deepGreen)
            }
            .padding(.horizontal, 28)
            .padding(.vertical, 24)
        }
    }
}

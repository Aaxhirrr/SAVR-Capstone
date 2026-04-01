import SwiftUI

struct StatBar: View {
    let stats: [(String, String)]

    var body: some View {
        VStack(spacing: 18) {
            ForEach(Array(stats.enumerated()), id: \.offset) { index, stat in
                VStack(spacing: 8) {
                    Text(stat.0)
                        .font(.system(size: 44, weight: .black, design: .rounded))
                        .foregroundStyle(.white)
                    Text(stat.1)
                        .font(.system(size: 16, weight: .medium, design: .rounded))
                        .foregroundStyle(.white.opacity(0.75))
                }

                if index < stats.count - 1 {
                    Rectangle()
                        .fill(.white.opacity(0.10))
                        .frame(height: 1)
                }
            }
        }
        .padding(.horizontal, 18)
        .padding(.vertical, 28)
        .background(SavrColors.statBar)
        .clipShape(RoundedRectangle(cornerRadius: 24, style: .continuous))
    }
}

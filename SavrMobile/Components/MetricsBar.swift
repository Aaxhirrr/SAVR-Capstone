import SwiftUI

struct MetricsBar: View {
    struct Metric: Identifiable {
        let id = UUID()
        let value: String
        let label: String
        let sublabel: String
    }

    let metrics: [Metric]

    var body: some View {
        VStack(spacing: 14) {
            LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 14) {
                ForEach(metrics) { m in
                    VStack(alignment: .leading, spacing: 4) {
                        Text(m.value)
                            .font(.system(size: 28, weight: .black, design: .rounded))
                            .foregroundStyle(.white)
                        Text(m.label)
                            .font(.system(size: 14, weight: .bold, design: .rounded))
                            .foregroundStyle(.white.opacity(0.92))
                        Text(m.sublabel)
                            .font(.system(size: 12, weight: .medium, design: .rounded))
                            .foregroundStyle(.white.opacity(0.75))
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                }
            }
        }
        .padding(16)
        .background(SavrColors.metricsGreen)
        .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: 18, style: .continuous)
                .stroke(Color.white.opacity(0.08), lineWidth: 1)
        )
        .padding(.horizontal, 16)
    }
}
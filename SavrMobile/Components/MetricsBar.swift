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
        VStack(spacing: 0) {
            LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 0) {
                ForEach(metrics) { m in
                    VStack(spacing: 8) {
                        Text(m.value)
                            .font(.system(size: 34, weight: .black, design: .rounded))
                            .foregroundStyle(.white)
                        Text(m.label)
                            .font(.system(size: 14, weight: .bold, design: .rounded))
                            .foregroundStyle(.white.opacity(0.92))
                        if !m.sublabel.isEmpty {
                            Text(m.sublabel)
                                .font(.system(size: 11, weight: .medium, design: .rounded))
                                .foregroundStyle(.white.opacity(0.75))
                                .multilineTextAlignment(.center)
                        }
                    }
                    .frame(maxWidth: .infinity, minHeight: 120)
                    .overlay(
                        RoundedRectangle(cornerRadius: 0)
                            .stroke(Color.white.opacity(0.08), lineWidth: 0.5)
                    )
                }
            }
        }
        .background(SavrColors.metricsGreen)
        .clipShape(RoundedRectangle(cornerRadius: 28, style: .continuous))
        .padding(.horizontal, 20)
    }
}

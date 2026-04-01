import SwiftUI

struct CheckboxToggleStyle: ToggleStyle {
    func makeBody(configuration: Configuration) -> some View {
        Button {
            configuration.isOn.toggle()
        } label: {
            HStack(alignment: .top, spacing: 10) {
                ZStack {
                    RoundedRectangle(cornerRadius: 6, style: .continuous)
                        .stroke(SavrColors.cardStroke, lineWidth: 1)
                        .frame(width: 22, height: 22)
                        .background(
                            RoundedRectangle(cornerRadius: 6, style: .continuous)
                                .fill(configuration.isOn ? SavrColors.brandGreen.opacity(0.20) : .clear)
                        )

                    if configuration.isOn {
                        Image(systemName: "checkmark")
                            .font(.system(size: 13, weight: .bold))
                            .foregroundStyle(SavrColors.brandGreen)
                    }
                }

                configuration.label
                    .foregroundStyle(SavrColors.textSecondary)
                    .font(SavrTypography.caption)
            }
        }
        .buttonStyle(.plain)
    }
}
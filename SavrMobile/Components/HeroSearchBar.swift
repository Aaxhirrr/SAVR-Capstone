import SwiftUI

struct HeroSearchBar: View {
    @Binding var text: String
    let onCamera: () -> Void
    let onSubmit: () -> Void

    var body: some View {
        HStack(spacing: 12) {
            Button(action: onCamera) {
                ZStack {
                    RoundedRectangle(cornerRadius: 14, style: .continuous)
                        .fill(Color(red: 0.94, green: 0.91, blue: 0.86))
                        .frame(width: 42, height: 42)

                    Image(systemName: "camera.fill")
                        .foregroundStyle(SavrColors.textSecondary)
                }
            }

            TextField("Ask SAVR anything...", text: $text)
                .font(.system(size: 17, weight: .medium, design: .rounded))
                .foregroundStyle(SavrColors.textPrimary)
                .submitLabel(.send)
                .onSubmit { onSubmit() }

            Button(action: onSubmit) {
                ZStack {
                    RoundedRectangle(cornerRadius: 14, style: .continuous)
                        .fill(SavrColors.brandGreen)
                        .frame(width: 42, height: 42)

                    Image(systemName: "arrow.up")
                        .font(.system(size: 17, weight: .bold))
                        .foregroundStyle(.white)
                }
            }
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 10)
        .background(.white)
        .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: 18, style: .continuous)
                .stroke(SavrColors.orangeBorder, lineWidth: 2)
        )
    }
}

import SwiftUI

struct SavrSearchBar: View {
    @Binding var text: String
    var onCamera: () -> Void
    var onSubmit: () -> Void

    var body: some View {
        HStack(spacing: 10) {
            TextField("What are you shopping for?", text: $text)
                .textInputAutocapitalization(.sentences)
                .autocorrectionDisabled(false)
                .submitLabel(.search)
                .onSubmit { onSubmit() }

            Button(action: onCamera) {
                Image(systemName: "camera")
                    .font(.system(size: 18, weight: .semibold))
                    .foregroundStyle(SavrColors.textSecondary)
            }

            Button(action: onSubmit) {
                Image(systemName: "arrow.up.circle.fill")
                    .font(.system(size: 22, weight: .bold))
                    .foregroundStyle(SavrColors.brandGreen)
            }
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 12)
        .background(.white.opacity(0.9))
        .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: 18, style: .continuous)
                .stroke(SavrColors.cardStroke, lineWidth: 1)
        )
        .shadow(color: .black.opacity(0.06), radius: 10, x: 0, y: 6)
        .padding(.horizontal, 16)
    }
}
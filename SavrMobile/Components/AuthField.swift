import SwiftUI

struct AuthField: View {
    let title: String
    let placeholder: String
    @Binding var text: String
    var isSecure: Bool = false
    var keyboard: UIKeyboardType = .default

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(title)
                .font(.system(size: 14, weight: .bold, design: .rounded))
                .foregroundStyle(Color(red: 0.18, green: 0.23, blue: 0.33))

            Group {
                if isSecure {
                    SecureField(placeholder, text: $text)
                        .textInputAutocapitalization(.never)
                        .autocorrectionDisabled(true)
                        .textContentType(.password)
                        .font(.system(size: 16, weight: .medium, design: .rounded))
                } else {
                    TextField(placeholder, text: $text)
                        .keyboardType(keyboard)
                        .textInputAutocapitalization(.never)
                        .autocorrectionDisabled(true)
                        .textContentType(keyboard == .emailAddress ? .emailAddress : .username)
                        .font(.system(size: 16, weight: .medium, design: .rounded))
                }
            }
            .padding(.horizontal, 14)
            .padding(.vertical, 13)
            .background(Color(red: 0.95, green: 0.96, blue: 0.97))
            .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: 10, style: .continuous)
                    .stroke(Color(red: 0.78, green: 0.81, blue: 0.85), lineWidth: 1.5)
            )
        }
    }
}

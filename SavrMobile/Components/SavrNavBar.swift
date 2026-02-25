import SwiftUI

struct SavrNavBar: View {
    let onSignIn: () -> Void
    let onGetStarted: () -> Void

    var body: some View {
        HStack {
            HStack(spacing: 6) {
                Text("savr")
                    .font(.system(size: 26, weight: .heavy, design: .rounded))
                    .foregroundStyle(SavrColors.brandGreen)
                Circle()
                    .fill(.red)
                    .frame(width: 6, height: 6)
                    .offset(x: -12, y: -10)
                    .opacity(0.9)
            }

            Spacer()

            Button("Sign In", action: onSignIn)
                .buttonStyle(SavrSecondaryButtonStyle())

            Button("Get Started", action: onGetStarted)
                .buttonStyle(SavrPrimaryButtonStyle())
        }
        .padding(.horizontal, 16)
        .padding(.top, 10)
        .padding(.bottom, 6)
    }
}
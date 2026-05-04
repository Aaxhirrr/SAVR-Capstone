import SwiftUI

struct SavrNavBar: View {
    let onSignIn: () -> Void
    let onGetStarted: () -> Void

    var body: some View {
        HStack {
            SavrLogoView(fontSize: 26)

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

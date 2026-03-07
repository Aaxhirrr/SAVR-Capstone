import SwiftUI

struct SignInView: View {
    @Environment(\.dismiss) private var dismiss
    @EnvironmentObject private var appState: AppState

    @State private var email = ""
    @State private var password = ""

    @State private var showSignUp = false
    
    private var isValidEmail: Bool {
        email.contains("@") && email.contains(".")
    }
    
    private var canSubmit: Bool {
        isValidEmail && password.count >= 6
    }

    var body: some View {
        ZStack {
            LinearGradient(colors: [SavrColors.bgTop, SavrColors.bgBottom],
                           startPoint: .top, endPoint: .bottom)
            .ignoresSafeArea()

            ScrollView(showsIndicators: false) {
                VStack(spacing: 18) {
                    Spacer(minLength: 26)

                    card

                    Spacer(minLength: 26)
                }
                .frame(maxWidth: 520)
                .padding(.horizontal, 18)
                .padding(.vertical, 20)
            }
        }
        .sheet(isPresented: $showSignUp) {
            SignUpView()
        }
    }

    private var card: some View {
        VStack(spacing: 16) {
            SavrLogoView(size: 56)

            VStack(spacing: 6) {
                Text("Welcome")
                    .font(.system(size: 30, weight: .black, design: .rounded))
                    .foregroundStyle(SavrColors.textPrimary)
                Text("Sign in to your account to start saving on groceries")
                    .font(SavrTypography.body)
                    .foregroundStyle(SavrColors.textSecondary)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 10)
            }

            VStack(spacing: 12) {
                AuthField(title: "Email address", placeholder: "Email address", text: $email, keyboard: .emailAddress)
                AuthField(title: "Password", placeholder: "Password", text: $password, isSecure: true)
                
                if !email.isEmpty && !isValidEmail {
                    Text("Enter a valid email address.")
                        .font(SavrTypography.caption)
                        .foregroundStyle(.red.opacity(0.85))
                        .frame(maxWidth: .infinity, alignment: .leading)
                }

                HStack {
                    Spacer()
                    Button("Forgot password?") { }
                        .font(SavrTypography.caption)
                        .foregroundStyle(SavrColors.brandGreen)
                }
            }
            .padding(.top, 4)

            Button {
                // stub: accept any input for now
                guard canSubmit else { return }
                appState.isSignedIn = true
                dismiss()
            } label: {
                Text("Sign in")
                    .frame(maxWidth: .infinity)
            }
            .buttonStyle(SavrPrimaryButtonStyle())
            .opacity(canSubmit ? 1 : 0.55)
            .padding(.top, 4)

            HStack(spacing: 10) {
                Rectangle().fill(SavrColors.cardStroke).frame(height: 1)
                Text("Or continue with")
                    .font(SavrTypography.caption)
                    .foregroundStyle(SavrColors.textSecondary)
                Rectangle().fill(SavrColors.cardStroke).frame(height: 1)
            }
            .padding(.top, 6)

            Button {
                // stub: Google sign-in placeholder
                appState.isSignedIn = true
                dismiss()
            } label: {
                HStack(spacing: 10) {
                    Image(systemName: "g.circle.fill")
                        .font(.system(size: 18, weight: .bold))
                    Text("Sign in with Google")
                        .font(.system(size: 15, weight: .bold, design: .rounded))
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 12)
            }
            .foregroundStyle(SavrColors.textPrimary)
            .background(.white.opacity(0.95))
            .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: 12, style: .continuous)
                    .stroke(SavrColors.cardStroke, lineWidth: 1)
            )

            HStack(spacing: 6) {
                Text("Don't have an account?")
                    .foregroundStyle(SavrColors.textSecondary)
                Button("Sign up here") { showSignUp = true }
                    .foregroundStyle(SavrColors.brandGreen)
                    .fontWeight(.bold)
            }
            .font(SavrTypography.caption)
            .padding(.top, 4)
        }
        .padding(22)
        .background(.white.opacity(0.85))
        .clipShape(RoundedRectangle(cornerRadius: 22, style: .continuous))
        .shadow(color: .black.opacity(0.08), radius: 16, x: 0, y: 10)
        .overlay(
            RoundedRectangle(cornerRadius: 22, style: .continuous)
                .stroke(SavrColors.cardStroke, lineWidth: 1)
        )
    }
}

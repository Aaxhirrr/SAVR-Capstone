import SwiftUI

struct SignInView: View {
    @Environment(\.dismiss) private var dismiss
    @EnvironmentObject private var appState: AppState

    @State private var email = ""
    @State private var password = ""

    @State private var showSignUp = false
    @State private var isSubmitting = false
    @State private var errorMessage: String?
    @State private var debugMessage: String?

    private var canSubmit: Bool {
        !email.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty && password.count >= 6
    }

    var body: some View {
        ZStack {
            signInBackground
                .ignoresSafeArea()

            ScrollView(showsIndicators: false) {
                VStack(spacing: 18) {
                    Spacer(minLength: 72)

                    card

                    Spacer(minLength: 72)
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
            SavrLogoView(size: 72)

            VStack(spacing: 6) {
                Text("Welcome")
                    .font(.system(size: 32, weight: .black, design: .rounded))
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

                if let errorMessage {
                    Text(errorMessage)
                        .font(SavrTypography.caption)
                        .foregroundStyle(.red.opacity(0.85))
                        .frame(maxWidth: .infinity, alignment: .leading)
                }

                if let debugMessage {
                    Text(debugMessage)
                        .font(.system(size: 11, weight: .medium, design: .monospaced))
                        .foregroundStyle(SavrColors.textPrimary)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding(10)
                        .background(.black.opacity(0.06))
                        .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
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
                guard canSubmit else { return }
                Task {
                    await handleSignIn()
                }
            } label: {
                Group {
                    if isSubmitting {
                        ProgressView()
                            .tint(.white)
                            .frame(maxWidth: .infinity)
                    } else {
                        Text("Sign in")
                            .frame(maxWidth: .infinity)
                    }
                }
            }
            .buttonStyle(SavrPrimaryButtonStyle())
            .opacity(canSubmit && !isSubmitting ? 1 : 0.55)
            .disabled(!canSubmit || isSubmitting)
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
                errorMessage = "Google sign-in is not connected yet."
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
        .padding(.horizontal, 22)
        .padding(.vertical, 26)
        .background(.white.opacity(0.94))
        .clipShape(RoundedRectangle(cornerRadius: 20, style: .continuous))
        .shadow(color: .black.opacity(0.06), radius: 18, x: 0, y: 14)
        .overlay(
            RoundedRectangle(cornerRadius: 20, style: .continuous)
                .stroke(.white.opacity(0.85), lineWidth: 1)
        )
    }

    private var signInBackground: some View {
        ZStack {
            LinearGradient(
                colors: [Color.white, SavrColors.bgBottom],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )

            RadialGradient(
                colors: [SavrColors.peachGlow.opacity(0.28), .clear],
                center: .leading,
                startRadius: 10,
                endRadius: 280
            )
            .frame(width: 320, height: 420)
            .offset(x: -130, y: -40)

            RadialGradient(
                colors: [SavrColors.brandBlue.opacity(0.24), .clear],
                center: .trailing,
                startRadius: 10,
                endRadius: 320
            )
            .frame(width: 360, height: 460)
            .offset(x: 140, y: 70)

            HStack {
                patternColumn
                    .offset(x: -16)
                Spacer()
                patternColumn
                    .scaleEffect(x: -1, y: 1)
                    .offset(x: 16)
            }
            .opacity(0.18)
        }
    }

    private var patternColumn: some View {
        VStack(spacing: 14) {
            ForEach(0..<18, id: \.self) { index in
                HStack(spacing: 14) {
                    Image(systemName: index.isMultiple(of: 3) ? "cup.and.saucer" : (index.isMultiple(of: 2) ? "birthday.cake" : "fork.knife"))
                    Image(systemName: index.isMultiple(of: 2) ? "carrot" : "fish")
                    Image(systemName: index.isMultiple(of: 4) ? "takeoutbag.and.cup.and.straw" : "leaf")
                }
                .font(.system(size: 20, weight: .regular))
                .foregroundStyle(.white)
            }
        }
    }

    private func handleSignIn() async {
        isSubmitting = true
        errorMessage = nil
        debugMessage = nil

        do {
            try await appState.signIn(
                username: email.trimmingCharacters(in: .whitespacesAndNewlines),
                password: password
            )
            dismiss()
        } catch {
            errorMessage = error.localizedDescription
            if let apiError = error as? APIError {
                debugMessage = apiError.debugSummary
            } else {
                debugMessage = String(describing: error)
            }
        }

        isSubmitting = false
    }
}

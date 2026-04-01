import SwiftUI

struct SignInView: View {
    @EnvironmentObject private var appState: AppState
    @Environment(\.dismiss) private var dismiss

    let onSuccess: (() -> Void)?

    @State private var email = ""
    @State private var password = ""
    @State private var isSubmitting = false
    @State private var errorMessage: String?

    init(onSuccess: (() -> Void)? = nil) {
        self.onSuccess = onSuccess
    }

    private var canSubmit: Bool {
        !email.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty && password.count >= 6
    }

    var body: some View {
        ZStack {
            LinearGradient(
                colors: [
                    Color(red: 0.93, green: 0.98, blue: 0.92),
                    Color(red: 0.97, green: 0.94, blue: 0.82)
                ],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
            .ignoresSafeArea()

            ScrollView(showsIndicators: false) {
                VStack(spacing: 28) {
                    // Logo + headline
                    VStack(spacing: 8) {
                        SavrLogoView(fontSize: 52)
                        Text("Welcome back")
                            .font(.system(size: 26, weight: .black, design: .rounded))
                            .foregroundStyle(Color(red: 0.08, green: 0.20, blue: 0.12))
                        Text("Sign in to start saving on groceries")
                            .font(.system(size: 15, weight: .medium, design: .rounded))
                            .foregroundStyle(Color(red: 0.35, green: 0.42, blue: 0.38))
                            .multilineTextAlignment(.center)
                    }
                    .padding(.top, 70)

                    // Form card — fixed width with horizontal padding
                    VStack(spacing: 16) {
                        // Email field
                        VStack(alignment: .leading, spacing: 6) {
                            Text("Email address")
                                .font(.system(size: 13, weight: .semibold, design: .rounded))
                                .foregroundStyle(Color(red: 0.20, green: 0.28, blue: 0.22))
                            TextField("you@example.com", text: $email)
                                .keyboardType(.emailAddress)
                                .textInputAutocapitalization(.never)
                                .autocorrectionDisabled()
                                .font(.system(size: 16, design: .rounded))
                                .padding(.horizontal, 14)
                                .padding(.vertical, 13)
                                .background(Color.white)
                                .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
                                .overlay(
                                    RoundedRectangle(cornerRadius: 12, style: .continuous)
                                        .stroke(Color(red: 0.80, green: 0.86, blue: 0.80), lineWidth: 1.5)
                                )
                        }

                        // Password field
                        VStack(alignment: .leading, spacing: 6) {
                            Text("Password")
                                .font(.system(size: 13, weight: .semibold, design: .rounded))
                                .foregroundStyle(Color(red: 0.20, green: 0.28, blue: 0.22))
                            SecureField("Password", text: $password)
                                .font(.system(size: 16, design: .rounded))
                                .padding(.horizontal, 14)
                                .padding(.vertical, 13)
                                .background(Color.white)
                                .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
                                .overlay(
                                    RoundedRectangle(cornerRadius: 12, style: .continuous)
                                        .stroke(Color(red: 0.80, green: 0.86, blue: 0.80), lineWidth: 1.5)
                                )
                            HStack {
                                Spacer()
                                Button("Forgot password?") { }
                                    .font(.system(size: 13, weight: .medium, design: .rounded))
                                    .foregroundStyle(Color(red: 0.12, green: 0.62, blue: 0.28))
                            }
                        }

                        if let errorMessage {
                            Text(errorMessage)
                                .font(.system(size: 13, weight: .medium, design: .rounded))
                                .foregroundStyle(.red.opacity(0.85))
                                .frame(maxWidth: .infinity, alignment: .leading)
                        }

                        // Sign in button
                        Button {
                            guard canSubmit else { return }
                            Task { await handleSignIn() }
                        } label: {
                            ZStack {
                                RoundedRectangle(cornerRadius: 14, style: .continuous)
                                    .fill(Color(red: 0.12, green: 0.62, blue: 0.28))
                                if isSubmitting {
                                    ProgressView().tint(.white)
                                } else {
                                    Text("Sign in")
                                        .font(.system(size: 17, weight: .bold, design: .rounded))
                                        .foregroundStyle(.white)
                                }
                            }
                            .frame(maxWidth: .infinity)
                            .frame(height: 52)
                        }
                        .opacity(canSubmit && !isSubmitting ? 1 : 0.5)
                        .disabled(!canSubmit || isSubmitting)
                        .padding(.top, 4)

                        HStack(spacing: 12) {
                            Rectangle().fill(Color(red: 0.75, green: 0.82, blue: 0.76)).frame(height: 1)
                            Text("or")
                                .font(.system(size: 13, weight: .medium, design: .rounded))
                                .foregroundStyle(Color(red: 0.50, green: 0.56, blue: 0.52))
                            Rectangle().fill(Color(red: 0.75, green: 0.82, blue: 0.76)).frame(height: 1)
                        }

                        // Google button
                        Button {
                            errorMessage = "Google sign-in is not connected yet."
                        } label: {
                            HStack(spacing: 10) {
                                Text("G")
                                    .font(.system(size: 18, weight: .black, design: .rounded))
                                    .foregroundStyle(.blue)
                                Text("Continue with Google")
                                    .font(.system(size: 15, weight: .semibold, design: .rounded))
                                    .foregroundStyle(Color(red: 0.15, green: 0.20, blue: 0.18))
                            }
                            .frame(maxWidth: .infinity)
                            .frame(height: 50)
                            .background(Color.white)
                            .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
                            .overlay(
                                RoundedRectangle(cornerRadius: 14, style: .continuous)
                                    .stroke(Color(red: 0.80, green: 0.86, blue: 0.80), lineWidth: 1.5)
                            )
                        }

                        HStack(spacing: 4) {
                            Text("Don't have an account?")
                                .foregroundStyle(Color(red: 0.40, green: 0.46, blue: 0.42))
                            Button("Sign up") { }
                                .foregroundStyle(Color(red: 0.12, green: 0.62, blue: 0.28))
                        }
                        .font(.system(size: 14, weight: .medium, design: .rounded))
                        .padding(.top, 4)
                    }
                    .padding(24)
                    .background(
                        RoundedRectangle(cornerRadius: 24, style: .continuous)
                            .fill(Color.white.opacity(0.88))
                            .shadow(color: .black.opacity(0.10), radius: 20, x: 0, y: 8)
                    )
                    .padding(.horizontal, 24)
                    .padding(.bottom, 60)
                }
            }
        }
    }

    private func handleSignIn() async {
        isSubmitting = true
        errorMessage = nil
        do {
            try await appState.signIn(
                username: email.trimmingCharacters(in: .whitespacesAndNewlines),
                password: password
            )
            dismiss()
            onSuccess?()
        } catch {
            errorMessage = error.localizedDescription
        }
        isSubmitting = false
    }
}

#Preview {
    SignInView()
        .environmentObject(AppState())
}

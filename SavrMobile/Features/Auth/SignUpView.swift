import SwiftUI

struct SignUpView: View {
    @Environment(\.dismiss) private var dismiss

    enum Province: String, CaseIterable, Identifiable {
        case AB, BC, MB, NB, NL, NS, NT, NU, ON, PE, QC, SK, YT
        var id: String { rawValue }
    }

    @State private var email = ""
    @State private var firstName = ""
    @State private var lastName = ""
    @State private var password = ""
    @State private var confirmPassword = ""

    @State private var street = ""
    @State private var city = ""
    @State private var province: Province = .ON
    @State private var postal = ""
    @State private var phone = ""

    @State private var accepted = false
    @State private var errorMessage: String?
    
    private var passwordsMatch: Bool {
        !password.isEmpty && password == confirmPassword
    }
    
    private var canSubmit: Bool {
        accepted && passwordsMatch
    }

    var body: some View {
        ZStack {
            LinearGradient(colors: [SavrColors.bgTop, SavrColors.bgBottom],
                           startPoint: .top, endPoint: .bottom)
            .ignoresSafeArea()

            ScrollView(showsIndicators: false) {
                VStack(spacing: 18) {
                    Spacer(minLength: 18)

                    VStack(spacing: 16) {
                        SavrLogoView(size: 56)

                        VStack(spacing: 6) {
                            Text("Create your Savr account")
                                .font(.system(size: 28, weight: .black, design: .rounded))
                                .foregroundStyle(SavrColors.textPrimary)
                            Text("Save on groceries with personalized recommendations")
                                .font(SavrTypography.body)
                                .foregroundStyle(SavrColors.textSecondary)
                                .multilineTextAlignment(.center)
                                .padding(.horizontal, 10)
                        }

                        Button {
                            errorMessage = "Sign up is not connected to the backend yet."
                        } label: {
                            HStack(spacing: 10) {
                                Image(systemName: "g.circle.fill")
                                    .font(.system(size: 18, weight: .bold))
                                Text("Sign up with Google")
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

                        HStack(spacing: 10) {
                            Rectangle().fill(SavrColors.cardStroke).frame(height: 1)
                            Text("Or sign up with email")
                                .font(SavrTypography.caption)
                                .foregroundStyle(SavrColors.textSecondary)
                            Rectangle().fill(SavrColors.cardStroke).frame(height: 1)
                        }
                        .padding(.top, 4)

                        VStack(spacing: 12) {
                            AuthField(title: "Email address", placeholder: "Email address", text: $email, keyboard: .emailAddress)

                            HStack(spacing: 12) {
                                AuthField(title: "First Name", placeholder: "First Name", text: $firstName)
                                AuthField(title: "Last Name", placeholder: "Last Name", text: $lastName)
                            }

                            AuthField(title: "Password", placeholder: "Password", text: $password, isSecure: true)
                            AuthField(title: "Confirm Password", placeholder: "Confirm Password", text: $confirmPassword, isSecure: true)
                            
                            if !confirmPassword.isEmpty && !passwordsMatch {
                                Text("Passwords do not match.")
                                    .font(SavrTypography.caption)
                                    .foregroundStyle(.red.opacity(0.85))
                                    .frame(maxWidth: .infinity, alignment: .leading)
                            }

                            if let errorMessage {
                                Text(errorMessage)
                                    .font(SavrTypography.caption)
                                    .foregroundStyle(.red.opacity(0.85))
                                    .frame(maxWidth: .infinity, alignment: .leading)
                            }
                        }

                        Divider().opacity(0.35).padding(.top, 6)

                        VStack(alignment: .leading, spacing: 12) {
                            Text("Canadian Address")
                                .font(.system(size: 18, weight: .black, design: .rounded))
                                .foregroundStyle(SavrColors.textPrimary)

                            AuthField(title: "Street Address", placeholder: "123 Main St", text: $street)
                            AuthField(title: "City", placeholder: "Toronto", text: $city)

                            HStack(spacing: 12) {
                                VStack(alignment: .leading, spacing: 8) {
                                    Text("Province")
                                        .font(.system(size: 13, weight: .bold, design: .rounded))
                                        .foregroundStyle(SavrColors.textPrimary)

                                    Picker("Province", selection: $province) {
                                        ForEach(Province.allCases) { p in
                                            Text(p.rawValue).tag(p)
                                        }
                                    }
                                    .pickerStyle(.menu)
                                    .frame(maxWidth: .infinity, alignment: .leading)
                                    .padding(.horizontal, 14)
                                    .padding(.vertical, 12)
                                    .background(.white.opacity(0.95))
                                    .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
                                    .overlay(
                                        RoundedRectangle(cornerRadius: 12, style: .continuous)
                                            .stroke(SavrColors.cardStroke, lineWidth: 1)
                                    )
                                }

                                AuthField(title: "Postal Code", placeholder: "A1A 1A1", text: $postal)
                            }

                            AuthField(title: "Phone Number", placeholder: "(123) 456-7890", text: $phone, keyboard: .phonePad)
                        }

                        Toggle(isOn: $accepted) {
                            Text("I have read and agree to the ")
                            + Text("Privacy Policy").foregroundColor(SavrColors.brandGreen).fontWeight(.bold)
                            + Text(" and ")
                            + Text("Terms of Service").foregroundColor(SavrColors.brandGreen).fontWeight(.bold)
                        }
                        .toggleStyle(CheckboxToggleStyle())
                        .padding(.top, 8)

                        Button {
                            guard canSubmit else { return }
                            errorMessage = "Sign up is not connected to the backend yet."
                        } label: {
                            Text("Sign up with Email")
                                .frame(maxWidth: .infinity)
                        }
                        .buttonStyle(SavrPrimaryButtonStyle())
                        .opacity(canSubmit ? 1 : 0.55)
                        .padding(.top, 6)

                        HStack(spacing: 6) {
                            Text("Already have an account?")
                                .foregroundStyle(SavrColors.textSecondary)
                            Button("Sign in here") { dismiss() }
                                .foregroundStyle(SavrColors.brandGreen)
                                .fontWeight(.bold)
                        }
                        .font(SavrTypography.caption)
                        .padding(.top, 2)
                    }
                    .padding(22)
                    .background(.white.opacity(0.85))
                    .clipShape(RoundedRectangle(cornerRadius: 22, style: .continuous))
                    .shadow(color: .black.opacity(0.08), radius: 16, x: 0, y: 10)
                    .overlay(
                        RoundedRectangle(cornerRadius: 22, style: .continuous)
                            .stroke(SavrColors.cardStroke, lineWidth: 1)
                    )
                    .frame(maxWidth: 560)

                    Spacer(minLength: 18)
                }
                .padding(.horizontal, 18)
                .padding(.vertical, 20)
            }
        }
    }
}

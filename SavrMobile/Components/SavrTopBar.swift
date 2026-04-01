import SwiftUI

struct SavrTopBar: View {
    let onSignIn: () -> Void
    let onGetStarted: () -> Void

    var body: some View {
        VStack(spacing: 0) {
            VStack(spacing: 14) {
                HStack {
                    Text("savr")
                        .font(.system(size: 34, weight: .black, design: .rounded))
                        .foregroundStyle(SavrColors.brandGreen)
                        .overlay(alignment: .topTrailing) {
                            Circle()
                                .fill(.red)
                                .frame(width: 8, height: 8)
                                .offset(x: -6, y: -2)
                        }

                    Spacer()

                    HStack(spacing: 8) {
                        Circle()
                            .fill(SavrColors.brandGreen)
                            .frame(width: 10, height: 10)
                        Text("Live prices updating")
                            .font(SavrTypography.nav)
                            .foregroundStyle(SavrColors.textSecondary)
                    }
                }

                HStack(spacing: 12) {
                    Button("Sign In", action: onSignIn)
                        .font(SavrTypography.nav)
                        .foregroundStyle(SavrColors.deepGreen)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 14)
                        .background(.white.opacity(0.75))
                        .clipShape(Capsule())
                        .overlay(
                            Capsule()
                                .stroke(SavrColors.line, lineWidth: 1)
                        )

                    Button(action: onGetStarted) {
                        Text("Get Started")
                            .font(SavrTypography.nav)
                            .foregroundStyle(.white)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 14)
                            .background(SavrColors.brandGreen)
                            .clipShape(Capsule())
                    }
                }
            }
            .padding(.horizontal, 20)
            .padding(.top, 16)
            .padding(.bottom, 16)

            Rectangle()
                .fill(SavrColors.line)
                .frame(height: 1)
        }
        .background(SavrColors.bg)
    }
}

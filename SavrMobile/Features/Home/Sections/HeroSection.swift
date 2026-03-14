import SwiftUI

struct HeroSection: View {
    @Binding var query: String
    let onCamera: () -> Void
    let onSubmit: () -> Void

    @State private var animatePhone = false

    var body: some View {
        VStack(alignment: .leading, spacing: 32) {
            VStack(alignment: .leading, spacing: 24) {
                Text("☀️ 🛒 AI-Powered Canadian Grocery Shopping 🇨🇦")
                    .font(.system(size: 12, weight: .bold, design: .rounded))
                    .foregroundStyle(SavrColors.textSecondary)
                    .padding(.horizontal, 14)
                    .padding(.vertical, 9)
                    .background(Color(red: 0.93, green: 0.96, blue: 0.89))
                    .clipShape(Capsule())
                    .lineLimit(1)
                    .minimumScaleFactor(0.85)

                VStack(alignment: .leading, spacing: 0) {
                    Text("Your ai")
                        .font(.system(size: 28, weight: .black, design: .serif))
                        .foregroundStyle(SavrColors.deepGreen)

                    Text("grocery shopping")
                        .font(.system(size: 28, weight: .black, design: .serif))
                        .foregroundStyle(SavrColors.brandGreen)

                    Text("companion.")
                        .font(.system(size: 28, weight: .black, design: .serif))
                        .foregroundStyle(SavrColors.deepGreen)
                }

                Text("Stop overpaying for groceries. Tell SAVR what you need and we'll find the lowest price at a nearby store, saving you real money.")
                    .font(.system(size: 16, weight: .medium, design: .rounded))
                    .foregroundStyle(SavrColors.textSecondary)
                    .lineSpacing(4)

                VStack(alignment: .leading, spacing: 10) {
                    Text("✨ Try it now!")
                        .font(.system(size: 16, weight: .black, design: .rounded))
                        .foregroundStyle(SavrColors.deepGreen)

                    HeroSearchBar(text: $query, onCamera: onCamera, onSubmit: onSubmit)

                    Text("Try: \"Cheapest groceries for a family of 4 this week\"")
                        .font(.system(size: 15, weight: .medium, design: .rounded))
                        .foregroundStyle(SavrColors.textSecondary)
                }
            }

            previewPhone
        }
        .padding(.horizontal, 28)
        .padding(.top, 22)
        .padding(.bottom, 54)
    }

    private var previewPhone: some View {
        let w: CGFloat = 230
        let h: CGFloat = 420

        return ZStack {
            Circle()
                .fill(Color(red: 0.93, green: 0.89, blue: 0.79))
                .frame(width: 140, height: 140)
                .offset(x: 80, y: -60)
                .blur(radius: 2)

            Circle()
                .fill(Color(red: 0.88, green: 0.96, blue: 0.84))
                .frame(width: 110, height: 110)
                .offset(x: -70, y: 110)
                .blur(radius: 2)

            VStack(spacing: 10) {
                // Same shell style as the in-action phones, scaled up
                ZStack {
                    // Border + white fill
                    RoundedRectangle(cornerRadius: 30, style: .continuous)
                        .stroke(SavrColors.deepGreen, lineWidth: 5)
                        .frame(width: w, height: h)
                        .background(
                            RoundedRectangle(cornerRadius: 30, style: .continuous)
                                .fill(.white)
                        )
                        .clipShape(RoundedRectangle(cornerRadius: 30, style: .continuous))
                        .shadow(color: .black.opacity(0.08), radius: 16, x: 0, y: 10)

                    // Screenshot inside the screen area
                    BundledJPEGImage(name: "AppListPricingImage 2", fileExtension: "jpeg", directory: "")
                        .scaledToFill()
                        .frame(width: w - 10, height: h - 10)
                        .clipShape(RoundedRectangle(cornerRadius: 26, style: .continuous))

                    // Dynamic island capsule on top
                    Capsule()
                        .fill(SavrColors.deepGreen)
                        .frame(width: w * 0.3, height: 16)
                        .offset(y: -h / 2 + 10)
                }
                .rotationEffect(.degrees(animatePhone ? 2.5 : 5.3))
                .offset(
                    x: animatePhone ? -8 : 8,
                    y: animatePhone ? 4 : -6
                )

                Text("SAVR Preview")
                    .font(.system(size: 15, weight: .bold, design: .rounded))
                    .foregroundStyle(SavrColors.textSecondary)
            }
        }
        .frame(maxWidth: .infinity)
        .frame(height: 480)
        .onAppear {
            withAnimation(
                .timingCurve(0.42, 0.0, 0.20, 1.0, duration: 4.8)
                    .repeatForever(autoreverses: true)
            ) {
                animatePhone = true
            }
        }
    }
}

private struct BundledJPEGImage: View {
    let name: String
    let fileExtension: String
    let directory: String

    var body: some View {
        Group {
            if let uiImage = UIImage(named: name) ?? UIImage(contentsOfFile: Bundle.main.path(forResource: name, ofType: fileExtension) ?? "") {
                Image(uiImage: uiImage)
                    .resizable()
                    .scaledToFit()
            } else {
                RoundedRectangle(cornerRadius: 24, style: .continuous)
                    .fill(Color.white.opacity(0.8))
                    .overlay(
                        Text("Missing AppListPricingImage.jpeg")
                            .font(.system(size: 14, weight: .bold, design: .rounded))
                            .foregroundStyle(SavrColors.textSecondary)
                            .padding(16)
                    )
            }
        }
    }
}

private struct HeroSearchBar: View {
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

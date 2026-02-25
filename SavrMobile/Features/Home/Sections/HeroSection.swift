import SwiftUI

struct HeroSection: View {
    @Binding var query: String
    let onCamera: () -> Void
    let onSubmit: () -> Void

    var body: some View {
        VStack(spacing: 14) {
            VStack(spacing: 6) {
                HStack(spacing: 8) {
                    Text("🍎")
                        .font(.system(size: 30))
                    Text("Your AI Grocery")
                        .font(SavrTypography.heroTitle)
                        .foregroundStyle(SavrColors.textPrimary)
                }

                HStack(spacing: 8) {
                    Text("Shopping Companion")
                        .font(SavrTypography.heroTitle)
                        .foregroundStyle(SavrColors.brandGreen)
                    Text("🔒")
                        .font(.system(size: 22))
                        .opacity(0.9)
                }
            }
            .multilineTextAlignment(.center)
            .padding(.horizontal, 16)

            Text("Stop overpaying for groceries. Tell Savr what you need and we'll find the lowest price at a nearby store, saving you real money.")
                .font(SavrTypography.body)
                .foregroundStyle(SavrColors.textSecondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 22)

            SavrSearchBar(text: $query, onCamera: onCamera, onSubmit: onSubmit)
                .padding(.top, 8)
        }
        .padding(.top, 10)
    }
}
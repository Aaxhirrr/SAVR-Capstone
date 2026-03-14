import SwiftUI

struct HeroSection: View {
    @Binding var query: String
    let onCamera: () -> Void
    let onSubmit: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 26) {
            VStack(alignment: .leading, spacing: 18) {
                HStack(spacing: 8) {
                    Image(systemName: "sparkles")
                        .font(.system(size: 11, weight: .bold))
                    Text("AI-Powered Canadian Grocery Shopping")
                }
                .font(.system(size: 12, weight: .bold, design: .rounded))
                .foregroundStyle(SavrColors.textPrimary)
                .padding(.horizontal, 14)
                .padding(.vertical, 10)
                .background(SavrColors.mintGlow.opacity(0.45))
                .clipShape(Capsule())
                .overlay(Capsule().stroke(SavrColors.cardStroke, lineWidth: 1))

                VStack(alignment: .leading, spacing: 4) {
                    Text("Your ai")
                    Text("grocery shopping")
                        .foregroundStyle(SavrColors.brandGreen)
                    Text("companion.")
                }
                .font(.system(size: 42, weight: .black, design: .serif))
                .foregroundStyle(SavrColors.textPrimary)
                .lineSpacing(-4)

                Text("Stop overpaying for groceries. Tell SAVR what you need and we'll find the lowest price at a nearby store, saving you real money.")
                    .font(.system(size: 17, weight: .medium, design: .rounded))
                    .foregroundStyle(SavrColors.textSecondary)
                    .lineSpacing(4)

                VStack(alignment: .leading, spacing: 10) {
                    Text("Try it now!")
                        .font(.system(size: 18, weight: .black, design: .serif))
                        .foregroundStyle(SavrColors.textPrimary)

                    HStack(spacing: 10) {
                        Button(action: onCamera) {
                            Image(systemName: "camera")
                                .font(.system(size: 18, weight: .bold))
                                .foregroundStyle(SavrColors.textSecondary)
                                .frame(width: 40, height: 40)
                                .background(SavrColors.bgTop)
                                .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
                        }

                        TextField("Ask SAVR anything...", text: $query)
                            .textInputAutocapitalization(.sentences)
                            .autocorrectionDisabled(false)
                            .submitLabel(.send)
                            .onSubmit { onSubmit() }
                            .font(.system(size: 16, weight: .medium, design: .rounded))
                            .foregroundStyle(SavrColors.textPrimary)

                        Button(action: onSubmit) {
                            Image(systemName: "arrow.up")
                                .font(.system(size: 18, weight: .black))
                                .foregroundStyle(.white)
                                .frame(width: 44, height: 44)
                                .background(SavrColors.brandGreen)
                                .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
                        }
                    }
                    .padding(8)
                    .background(.white)
                    .clipShape(RoundedRectangle(cornerRadius: 20, style: .continuous))
                    .overlay(
                        RoundedRectangle(cornerRadius: 20, style: .continuous)
                            .stroke(SavrColors.peachGlow, lineWidth: 2)
                    )

                    Text("Try: \"Cheapest groceries for a family of 4 this week\"")
                        .font(.system(size: 12, weight: .medium, design: .rounded))
                        .foregroundStyle(SavrColors.textSecondary)
                        .padding(.bottom, 8)
                }
            }

            heroPhone
        }
        .padding(.horizontal, 20)
        .padding(.top, 0)
        .padding(.bottom, 28)
    }

    private var heroPhone: some View {
        ZStack {
            Circle()
                .fill(SavrColors.peachGlow.opacity(0.32))
                .frame(width: 210, height: 210)
                .blur(radius: 10)
                .offset(x: 78, y: -30)

            Circle()
                .fill(SavrColors.mintGlow.opacity(0.35))
                .frame(width: 140, height: 140)
                .offset(x: -96, y: 112)

            VStack(spacing: 0) {
                Capsule()
                    .fill(SavrColors.metricsGreen)
                    .frame(width: 118, height: 24)
                    .padding(.top, 10)

                VStack(alignment: .leading, spacing: 12) {
                    phoneHeader
                    priceCards
                    productRows
                    phoneActions
                }
                .padding(14)
            }
            .frame(maxWidth: .infinity)
            .background(.white)
            .clipShape(RoundedRectangle(cornerRadius: 34, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: 34, style: .continuous)
                    .stroke(SavrColors.metricsGreen, lineWidth: 6)
            )
            .shadow(color: SavrColors.metricsGreen.opacity(0.12), radius: 30, x: 0, y: 18)
            .rotationEffect(.degrees(7))
            .padding(.horizontal, 44)
            .offset(y: 8)
        }
        .frame(height: 450)
    }

    private var phoneHeader: some View {
        HStack {
            Text("Weekly Essentials")
                .font(.system(size: 14, weight: .black, design: .rounded))
                .foregroundStyle(SavrColors.textPrimary)
            Spacer()
            Text("18 items")
                .font(.system(size: 11, weight: .bold, design: .rounded))
                .foregroundStyle(SavrColors.textSecondary)
        }
    }

    private var priceCards: some View {
        HStack(spacing: 8) {
            phonePriceCard(store: "No Frills", total: "$84.53", tint: SavrColors.brandGreen)
            phonePriceCard(store: "Loblaws", total: "$86.57", tint: SavrColors.peachGlow)
            phonePriceCard(store: "FreshCo", total: "$117.37", tint: SavrColors.mintGlow)
        }
    }

    private func phonePriceCard(store: String, total: String, tint: Color) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(store)
                .font(.system(size: 10, weight: .bold, design: .rounded))
                .foregroundStyle(SavrColors.textSecondary)
            Text(total)
                .font(.system(size: 15, weight: .black, design: .rounded))
                .foregroundStyle(SavrColors.textPrimary)
        }
        .padding(10)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(tint.opacity(0.22))
        .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: 14, style: .continuous)
                .stroke(tint.opacity(0.6), lineWidth: 1)
        )
    }

    private var productRows: some View {
        VStack(spacing: 8) {
            phoneRow(title: "Chicken Breast", price: "$13.00")
            phoneRow(title: "Ground Beef", price: "$5.44")
            phoneRow(title: "Eggs", price: "$3.93")
            phoneRow(title: "Milk", price: "$6.44")
        }
    }

    private func phoneRow(title: String, price: String) -> some View {
        HStack(spacing: 10) {
            RoundedRectangle(cornerRadius: 10, style: .continuous)
                .fill(SavrColors.bgTop)
                .frame(width: 44, height: 44)
                .overlay(Image(systemName: "cart").foregroundStyle(SavrColors.textSecondary))

            VStack(alignment: .leading, spacing: 3) {
                Text(title)
                    .font(.system(size: 13, weight: .bold, design: .rounded))
                    .foregroundStyle(SavrColors.textPrimary)
                    .lineLimit(1)
                    .minimumScaleFactor(0.75)
                Text("Best local option")
                    .font(.system(size: 10, weight: .medium, design: .rounded))
                    .foregroundStyle(SavrColors.textSecondary)
            }

            Spacer()

            Text(price)
                .font(.system(size: 13, weight: .black, design: .rounded))
                .foregroundStyle(SavrColors.textPrimary)
        }
        .padding(10)
        .background(.white)
        .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: 14, style: .continuous)
                .stroke(SavrColors.cardStroke.opacity(0.7), lineWidth: 1)
        )
    }

    private var phoneActions: some View {
        HStack(spacing: 8) {
            Label("Select Stores", systemImage: "mappin.and.ellipse")
                .font(.system(size: 11, weight: .bold, design: .rounded))
                .foregroundStyle(SavrColors.textPrimary)
                .padding(.horizontal, 10)
                .padding(.vertical, 8)
                .background(.white)
                .clipShape(Capsule())
                .overlay(Capsule().stroke(SavrColors.cardStroke, lineWidth: 1))

            Label("Update Prices", systemImage: "arrow.clockwise")
                .font(.system(size: 11, weight: .bold, design: .rounded))
                .foregroundStyle(.white)
                .padding(.horizontal, 10)
                .padding(.vertical, 8)
                .background(SavrColors.brandGreen)
                .clipShape(Capsule())
        }
    }
}

import SwiftUI

struct HomeLandingView: View {
    @StateObject private var vm = HomeViewModel()

    @State private var showSignIn = false
    @State private var showGetStarted = false

    private let stores = [
        "No Frills", "Loblaws", "Metro", "Walmart", "Sobeys", "FreshCo",
        "T&T", "Food Basics", "Independent", "Real Canadian Superstore",
        "Atlantic Superstore", "Foodland", "Maxi"
    ]

    var body: some View {
        ZStack(alignment: .top) {
            ScrollView(showsIndicators: false) {
                VStack(spacing: 34) {
                    SavrNavBar(
                        onSignIn: { showSignIn = true },
                        onGetStarted: { showGetStarted = true }
                    )

                    HeroSection(query: $vm.query, onCamera: vm.openCamera, onSubmit: vm.submitQuery)

                    HowItWorksSection()

                    PocketPreviewSection()

                    MetricsBar(metrics: [
                        .init(value: "15+", label: "Canadian Stores", sublabel: ""),
                        .init(value: "3", label: "Store Comparison", sublabel: ""),
                        .init(value: "100%", label: "Free to Use", sublabel: ""),
                        .init(value: "∞", label: "Grocery Lists", sublabel: "")
                    ])

                    FeaturesSection()

                    StoreCloudSection(stores: stores)

                    CTASection(
                        onGetStarted: { showGetStarted = true },
                        onSignIn: { showSignIn = true }
                    )

                    LandingFooter()

                    Spacer(minLength: 24)
                }
                .padding(.bottom, 40)
            }
            .savrBackground()

            if vm.showToast {
                VStack {
                    HStack {
                        Image(systemName: "sparkles")
                        Text(vm.lastSubmitted.isEmpty ? "Camera flow placeholder" : "Submitted: \(vm.lastSubmitted)")
                            .lineLimit(1)
                        Spacer()
                    }
                    .font(.system(size: 14, weight: .semibold, design: .rounded))
                    .foregroundStyle(SavrColors.textPrimary)
                    .padding(12)
                    .background(.white.opacity(0.92))
                    .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
                    .overlay(
                        RoundedRectangle(cornerRadius: 14, style: .continuous)
                            .stroke(SavrColors.cardStroke, lineWidth: 1)
                    )
                    .padding(.horizontal, 16)
                    .padding(.top, 84)

                    Spacer()
                }
                .transition(.move(edge: .top).combined(with: .opacity))
                .animation(.spring(response: 0.35, dampingFraction: 0.9), value: vm.showToast)
            }
        }
        .sheet(isPresented: $showSignIn) { SignInView() }
        .sheet(isPresented: $showGetStarted) { SignUpView() }
    }
}

private struct PocketPreviewSection: View {
    var body: some View {
        VStack(spacing: 18) {
            VStack(spacing: 8) {
                Text("SEE IT IN ACTION")
                    .font(.system(size: 13, weight: .black, design: .rounded))
                    .foregroundStyle(SavrColors.brandGreen)
                Text("Built for Your Pocket")
                    .font(.system(size: 34, weight: .black, design: .serif))
                    .foregroundStyle(SavrColors.textPrimary)
                    .multilineTextAlignment(.center)
            }

            HStack(alignment: .bottom, spacing: 14) {
                phoneCard(title: "Chat Interface", rows: ["Hey! What groceries do you need today?", "Chicken breast, milk, bananas, and rice", "Found the best prices across 3 stores."], width: 96, height: 172)
                phoneCard(title: "Price Comparison", rows: ["No Frills        $4.29", "Loblaws          $5.99", "Metro            $5.49"], width: 84, height: 150)
                phoneCard(title: "Grocery List", rows: ["Chicken Breast", "2% Milk 4L", "Bananas 1lb", "Basmati Rice 2kg"], width: 112, height: 194)
            }
            .padding(.horizontal, 20)
        }
    }

    private func phoneCard(title: String, rows: [String], width: CGFloat, height: CGFloat) -> some View {
        VStack(spacing: 8) {
            ZStack(alignment: .top) {
                RoundedRectangle(cornerRadius: 22, style: .continuous)
                    .fill(.white)
                    .frame(width: width, height: height)
                    .overlay(
                        RoundedRectangle(cornerRadius: 22, style: .continuous)
                            .stroke(SavrColors.metricsGreen, lineWidth: 4)
                    )

                Capsule()
                    .fill(SavrColors.metricsGreen)
                    .frame(width: 44, height: 12)
                    .padding(.top, 8)

                VStack(alignment: .leading, spacing: 6) {
                    ForEach(rows, id: \.self) { row in
                        Text(row)
                            .font(.system(size: 6.8, weight: .bold, design: .rounded))
                            .foregroundStyle(SavrColors.textPrimary)
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .padding(.horizontal, 6)
                            .padding(.vertical, 5)
                            .background(row == rows.first ? SavrColors.peach.opacity(0.35) : SavrColors.bgTop)
                            .clipShape(RoundedRectangle(cornerRadius: 7, style: .continuous))
                            .lineLimit(2)
                            .minimumScaleFactor(0.75)
                    }
                }
                .padding(.top, 28)
                .padding(.horizontal, 8)
            }

            Text(title)
                .font(.system(size: 12, weight: .bold, design: .rounded))
                .foregroundStyle(SavrColors.textPrimary)
        }
    }
}

private struct StoreCloudSection: View {
    let stores: [String]

    private let columns = [
        GridItem(.flexible(), spacing: 12),
        GridItem(.flexible(), spacing: 12),
        GridItem(.flexible(), spacing: 12)
    ]

    var body: some View {
        VStack(spacing: 18) {
            VStack(spacing: 8) {
                Text("PRICES COMPARED ACROSS CANADA'S TOP STORES")
                    .font(.system(size: 13, weight: .black, design: .rounded))
                    .foregroundStyle(SavrColors.brandGreen)
                    .multilineTextAlignment(.center)

                Text("SAVR checks real-time prices at over 15 major Canadian grocery retailers so you can find the lowest price near you without visiting multiple websites.")
                    .font(.system(size: 15, weight: .medium, design: .rounded))
                    .foregroundStyle(SavrColors.textSecondary)
                    .multilineTextAlignment(.center)
                    .lineSpacing(3)
                    .padding(.horizontal, 24)
            }

            LazyVGrid(columns: columns, alignment: .center, spacing: 12) {
                ForEach(stores, id: \.self) { store in
                    Text(store)
                        .font(.system(size: 13, weight: .bold, design: .rounded))
                        .foregroundStyle(SavrColors.textPrimary)
                        .padding(.horizontal, 14)
                        .padding(.vertical, 12)
                        .frame(maxWidth: .infinity, minHeight: 52)
                        .background(.white.opacity(0.95))
                        .clipShape(RoundedRectangle(cornerRadius: 26, style: .continuous))
                        .overlay(
                            RoundedRectangle(cornerRadius: 26, style: .continuous)
                                .stroke(SavrColors.cardStroke, lineWidth: 1)
                        )
                        .multilineTextAlignment(.center)
                }
            }
            .padding(.horizontal, 20)
        }
    }
}

private struct LandingFooter: View {
    var body: some View {
        HStack {
            Text("savr")
                .font(.system(size: 30, weight: .black, design: .rounded))
                .foregroundStyle(SavrColors.brandGreen)
                .overlay(alignment: .topTrailing) {
                    Circle()
                        .fill(.red)
                        .frame(width: 7, height: 7)
                        .offset(x: -5, y: -2)
                }

            Spacer()

            VStack(alignment: .trailing, spacing: 4) {
                Text("Built with love in Canada · 2026 © SAVR")
                Text("Blog   Privacy   Terms")
            }
            .font(.system(size: 11, weight: .bold, design: .rounded))
            .foregroundStyle(SavrColors.textSecondary)
            .multilineTextAlignment(.trailing)
        }
        .padding(.horizontal, 20)
    }
}

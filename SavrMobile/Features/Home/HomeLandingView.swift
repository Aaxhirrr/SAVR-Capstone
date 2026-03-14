import SwiftUI

struct HomeLandingView: View {
    @EnvironmentObject private var appState: AppState
    @State private var query = ""
    @State private var showSignIn = false
    @State private var showGetStarted = false
    @State private var showAppShell = false

    var body: some View {
        ScrollView(showsIndicators: false) {
            VStack(spacing: 0) {
                SavrTopBar(
                    onSignIn: {
                        if appState.sessionState == .signedIn {
                            showAppShell = true
                        } else {
                            showSignIn = true
                        }
                    },
                    onGetStarted: { showGetStarted = true }
                )

                HeroSection(
                    query: $query,
                    onCamera: {},
                    onSubmit: {}
                )

                HowItWorksSection()

                PocketSection()

                FeaturesSection()

                StoreCoverageSection()

                CTASection(
                    onGetStarted: { showGetStarted = true },
                    onHowItWorks: {}
                )

                FooterView()
            }
        }
        .background(SavrColors.bg.ignoresSafeArea())
        .sheet(isPresented: $showSignIn) {
            SignInView {
                showAppShell = true
            }
        }
        .sheet(isPresented: $showGetStarted) {
            SignUpView()
        }
        .fullScreenCover(isPresented: $showAppShell) {
            AppShellView()
        }
        .onChange(of: appState.sessionState) { state in
            switch state {
            case .signedIn:
                showSignIn = false
                showAppShell = true
            case .signedOut:
                showAppShell = false
                showSignIn = false
            case .loading:
                break
            }
        }
    }
}

private struct SavrTopBar: View {
    let onSignIn: () -> Void
    let onGetStarted: () -> Void

    var body: some View {
        GeometryReader { proxy in
            let compact = proxy.size.width < 430

            VStack(spacing: 0) {
                VStack(spacing: compact ? 12 : 14) {
                    HStack(alignment: .center, spacing: 12) {
                        Text("savr")
                            .font(.system(size: compact ? 28 : 34, weight: .black, design: .rounded))
                            .foregroundStyle(SavrColors.brandGreen)
                            .overlay(alignment: .topTrailing) {
                                Circle()
                                    .fill(.red)
                                    .frame(width: compact ? 7 : 8, height: compact ? 7 : 8)
                                    .offset(x: -6, y: -2)
                            }

                        Spacer(minLength: 8)

                        HStack(spacing: 6) {
                            Circle()
                                .fill(SavrColors.brandGreen)
                                .frame(width: 8, height: 8)
                            Text("Live prices updating")
                                .font(.system(size: compact ? 12 : 16, weight: .semibold, design: .rounded))
                                .foregroundStyle(SavrColors.textSecondary)
                                .lineLimit(1)
                                .minimumScaleFactor(0.85)
                        }
                        .padding(.leading, 4)
                    }

                    HStack(spacing: 10) {
                        Button("Sign In", action: onSignIn)
                            .font(.system(size: compact ? 15 : 16, weight: .semibold, design: .rounded))
                            .foregroundStyle(SavrColors.deepGreen)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, compact ? 12 : 14)
                            .background(.white.opacity(0.75))
                            .clipShape(Capsule())
                            .overlay(
                                Capsule()
                                    .stroke(SavrColors.line, lineWidth: 1)
                            )

                        Button(action: onGetStarted) {
                            Text("Get Started")
                                .font(.system(size: compact ? 15 : 16, weight: .semibold, design: .rounded))
                                .lineLimit(1)
                                .minimumScaleFactor(0.9)
                                .foregroundStyle(.white)
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, compact ? 12 : 14)
                                .background(SavrColors.brandGreen)
                                .clipShape(Capsule())
                        }
                    }
                }
                .padding(.horizontal, compact ? 14 : 20)
                .padding(.top, compact ? 12 : 16)
                .padding(.bottom, compact ? 12 : 16)

                Rectangle()
                    .fill(SavrColors.line)
                    .frame(height: 1)
            }
            .background(SavrColors.bg)
        }
        .frame(height: 106)
    }
}

private struct PocketSection: View {
    var body: some View {
        VStack(spacing: 24) {
            Text("SEE IT IN ACTION")
                .font(.system(size: 14, weight: .bold, design: .rounded))
                .foregroundStyle(SavrColors.brandGreen)

            Text("Built for Your Pocket")
                .font(.system(size: 28, weight: .black, design: .serif))
                .foregroundStyle(SavrColors.deepGreen)
                .multilineTextAlignment(.center)

            VStack(alignment: .center, spacing: 24) {
                chatPhone
                comparisonPhone
                groceryListPhone
            }
        }
        .padding(.horizontal, 20)
        .padding(.bottom, 70)
    }

    private var chatPhone: some View {
        VStack(spacing: 12) {
            ZStack {
                phoneShell(width: 220, height: 270)

                VStack(spacing: 0) {
                    phoneTopBar(time: "9:41", title: "SAVR")

                    ZStack {
                        LinearGradient(
                            colors: [
                                Color(red: 0.93, green: 0.98, blue: 0.92),
                                Color(red: 0.97, green: 0.94, blue: 0.82)
                            ],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )

                        patternOverlay
                            .opacity(0.18)

                        VStack(alignment: .leading, spacing: 8) {
                            chatBubble("Hey! What groceries do you need today?", color: Color(red: 0.94, green: 0.82, blue: 0.64), alignRight: false)
                            chatBubble("Chicken breast, milk, bananas...", color: SavrColors.brandGreen, alignRight: true)
                            chatBubble("Found the best prices across 3 stores.", color: Color(red: 0.94, green: 0.82, blue: 0.64), alignRight: false)
                            chatBubble("Great! Show me the comparison", color: SavrColors.brandGreen, alignRight: true)
                            chatBubble("Here are your options...", color: Color(red: 0.94, green: 0.82, blue: 0.64), alignRight: false)

                            Spacer()

                            HStack(spacing: 8) {
                                RoundedRectangle(cornerRadius: 6)
                                    .fill(Color.white.opacity(0.75))
                                    .frame(height: 8)

                                ZStack {
                                    RoundedRectangle(cornerRadius: 8)
                                        .fill(SavrColors.brandGreen)
                                        .frame(width: 20, height: 20)

                                    Image(systemName: "arrow.up")
                                        .font(.system(size: 9, weight: .bold))
                                        .foregroundStyle(.white)
                                }
                            }
                        }
                        .padding(10)
                    }
                    .clipped()
                }
                .frame(width: 200, height: 250)
                .clipShape(RoundedRectangle(cornerRadius: 25, style: .continuous))
            }

            Text("Chat Interface")
                .font(.system(size: 16, weight: .bold, design: .rounded))
                .foregroundStyle(SavrColors.deepGreen)
        }
    }

    private var comparisonPhone: some View {
        VStack(spacing: 12) {
            ZStack {
                phoneShell(width: 200, height: 270)

                VStack(spacing: 0) {
                    phoneTopBar(time: "9:41", title: "SAVR")

                    VStack(spacing: 8) {
                        Text("Chicken Breast")
                            .font(.system(size: 12, weight: .bold, design: .rounded))
                            .foregroundStyle(SavrColors.deepGreen)
                            .padding(.top, 4)

                        comparisonRow(store: "No Frills", price: "$4.29", tint: Color(red: 0.90, green: 0.96, blue: 0.87))
                        comparisonRow(store: "Loblaws", price: "$5.99", tint: Color(red: 0.96, green: 0.93, blue: 0.88))
                        comparisonRow(store: "Metro", price: "$5.49", tint: Color(red: 0.96, green: 0.93, blue: 0.88))

                        RoundedRectangle(cornerRadius: 12, style: .continuous)
                            .fill(Color(red: 0.93, green: 0.82, blue: 0.67))
                            .frame(height: 36)
                            .overlay(
                                Text("Save $1.70")
                                    .font(.system(size: 13, weight: .black, design: .rounded))
                                    .foregroundStyle(SavrColors.deepGreen)
                            )

                        Spacer()
                    }
                    .padding(.horizontal, 10)
                    .padding(.top, 4)
                    .clipped()
                }
                .frame(width: 180, height: 250)
                .clipShape(RoundedRectangle(cornerRadius: 25, style: .continuous))
            }

            Text("Price Comparison")
                .font(.system(size: 16, weight: .bold, design: .rounded))
                .foregroundStyle(SavrColors.deepGreen)
        }
    }

    private var groceryListPhone: some View {
        VStack(spacing: 12) {
            ZStack {
                phoneShell(width: 220, height: 320)

                VStack(spacing: 0) {
                    phoneTopBar(time: "9:41", title: "SAVR")

                    VStack(alignment: .leading, spacing: 7) {
                        HStack {
                            Text("My Grocery List")
                                .font(.system(size: 13, weight: .bold, design: .rounded))
                                .foregroundStyle(SavrColors.deepGreen)

                            Spacer()

                            Text("3/8")
                                .font(.system(size: 12, weight: .bold, design: .rounded))
                                .foregroundStyle(SavrColors.brandGreen)
                        }
                        .padding(.top, 2)

                        groceryItem("Chicken Breast", store: "No Frills", checked: true)
                        groceryItem("2% Milk 4L", store: "No Frills", checked: true)
                        groceryItem("Bananas 1lb", store: "Metro", checked: false)
                        groceryItem("Rice 2kg", store: "Walmart", checked: false)
                        groceryItem("Greek Yogurt", store: "Loblaws", checked: false)

                        Spacer()
                    }
                    .padding(.horizontal, 10)
                    .padding(.top, 4)
                    .clipped()
                }
                .frame(width: 200, height: 300)
                .clipShape(RoundedRectangle(cornerRadius: 25, style: .continuous))
            }

            Text("Grocery List")
                .font(.system(size: 16, weight: .bold, design: .rounded))
                .foregroundStyle(SavrColors.deepGreen)
        }
    }

    private func phoneShell(width: CGFloat, height: CGFloat) -> some View {
        RoundedRectangle(cornerRadius: 30, style: .continuous)
            .stroke(SavrColors.deepGreen, lineWidth: 5)
            .frame(width: width, height: height)
            .background(
                RoundedRectangle(cornerRadius: 30, style: .continuous)
                    .fill(.white)
            )
            .clipShape(RoundedRectangle(cornerRadius: 30, style: .continuous))
            .shadow(color: .black.opacity(0.08), radius: 16, x: 0, y: 10)
            .overlay(
                Capsule()
                    .fill(SavrColors.deepGreen)
                    .frame(width: width * 0.3, height: 16)
                    .offset(y: -height / 2 + 10)
            )
    }

    private func phoneTopBar(time: String, title: String) -> some View {
        HStack {
            Text(time)
                .font(.system(size: 9, weight: .bold, design: .rounded))
                .foregroundStyle(SavrColors.deepGreen)

            Spacer()

            Text(title)
                .font(.system(size: 9, weight: .bold, design: .rounded))
                .foregroundStyle(SavrColors.deepGreen)

            Spacer()

            HStack(spacing: 4) {
                Circle()
                    .fill(SavrColors.deepGreen)
                    .frame(width: 5, height: 5)
                Circle()
                    .fill(SavrColors.deepGreen)
                    .frame(width: 5, height: 5)
            }
        }
        .padding(.horizontal, 8)
        .padding(.top, 10)
        .padding(.bottom, 6)
    }

    private func chatBubble(_ text: String, color: Color, alignRight: Bool) -> some View {
        HStack {
            if alignRight { Spacer(minLength: 18) }

            Text(text)
                .font(.system(size: 9, weight: .medium, design: .rounded))
                .lineLimit(2)
                .foregroundStyle(alignRight ? .white : SavrColors.deepGreen)
                .padding(.horizontal, 8)
                .padding(.vertical, 7)
                .background(color)
                .clipShape(Capsule())

            if !alignRight { Spacer(minLength: 18) }
        }
    }

    private func comparisonRow(store: String, price: String, tint: Color) -> some View {
        RoundedRectangle(cornerRadius: 12, style: .continuous)
            .fill(tint)
            .frame(height: 40)
            .overlay(
                HStack(spacing: 6) {
                    Image(systemName: "bag")
                        .font(.system(size: 10, weight: .bold))
                        .foregroundStyle(SavrColors.textSecondary)

                    Text(store)
                        .font(.system(size: 11, weight: .bold, design: .rounded))
                        .foregroundStyle(SavrColors.deepGreen)

                    Spacer()

                    Text(price)
                        .font(.system(size: 11, weight: .black, design: .rounded))
                        .foregroundStyle(SavrColors.brandGreen)
                }
                .padding(.horizontal, 10)
            )
    }

    private func groceryItem(_ title: String, store: String, checked: Bool) -> some View {
        RoundedRectangle(cornerRadius: 14, style: .continuous)
            .fill(checked ? Color(red: 0.95, green: 0.98, blue: 0.93) : .white)
            .frame(height: 46)
            .overlay(
                RoundedRectangle(cornerRadius: 14, style: .continuous)
                    .stroke(Color(red: 0.89, green: 0.84, blue: 0.76), lineWidth: 1)
            )
            .overlay(
                HStack(spacing: 10) {
                    ZStack {
                        RoundedRectangle(cornerRadius: 6, style: .continuous)
                            .fill(checked ? SavrColors.brandGreen : Color(red: 0.96, green: 0.94, blue: 0.91))
                            .frame(width: 20, height: 20)

                        if checked {
                            Image(systemName: "checkmark")
                                .font(.system(size: 9, weight: .bold))
                                .foregroundStyle(.white)
                        }
                    }

                    VStack(alignment: .leading, spacing: 1) {
                        Text(title)
                            .font(.system(size: 11, weight: .bold, design: .rounded))
                            .foregroundStyle(SavrColors.deepGreen)
                            .lineLimit(1)
                            .strikethrough(checked, color: SavrColors.textSecondary)

                        Text(store)
                            .font(.system(size: 9, weight: .medium, design: .rounded))
                            .foregroundStyle(SavrColors.textSecondary)
                    }

                    Spacer()
                }
                .padding(.horizontal, 10)
            )
    }

    private var patternOverlay: some View {
        VStack(spacing: 14) {
            HStack(spacing: 18) {
                Image(systemName: "fork.knife")
                Image(systemName: "cup.and.saucer")
                Image(systemName: "fish")
            }
            HStack(spacing: 18) {
                Image(systemName: "birthday.cake")
                Image(systemName: "takeoutbag.and.cup.and.straw")
                Image(systemName: "carrot")
            }
            HStack(spacing: 18) {
                Image(systemName: "leaf")
                Image(systemName: "fork.knife")
                Image(systemName: "cup.and.saucer")
            }
        }
        .font(.system(size: 18, weight: .regular))
        .foregroundStyle(.white.opacity(0.5))
    }
}
private struct StoreCoverageSection: View {
    let stores = [
        "No Frills", "Loblaws", "Metro", "Walmart", "Sobeys", "FreshCo",
        "T&T", "Food Basics", "Independent", "Real Canadian Superstore",
        "Atlantic Superstore", "Foodland", "Maxi"
    ]

    var body: some View {
        VStack(spacing: 20) {
            Text("PRICES COMPARED ACROSS CANADA'S TOP STORES")
                .font(.system(size: 14, weight: .bold, design: .rounded))
                .foregroundStyle(SavrColors.textSecondary)
                .multilineTextAlignment(.center)

            Text("SAVR checks real-time prices at over 15 major Canadian grocery retailers so you can find the lowest price near you without visiting multiple websites.")
                .font(SavrTypography.body)
                .foregroundStyle(SavrColors.textSecondary)
                .multilineTextAlignment(.center)
                .frame(maxWidth: 700)

            VStack(spacing: 18) {
                let rows = [
                    Array(stores.prefix(3)),
                    Array(stores.dropFirst(3).prefix(3)),
                    Array(stores.dropFirst(6).prefix(3)),
                    Array(stores.dropFirst(9).prefix(2)),
                    Array(stores.suffix(2))
                ]

                ForEach(0..<rows.count, id: \.self) { row in
                    HStack(spacing: 12) {
                        ForEach(rows[row], id: \.self) { store in
                            StoreChip(text: store)
                        }
                    }
                }
            }
        }
        .padding(.horizontal, 28)
        .padding(.bottom, 80)
    }
}

private struct StoreChip: View {
    let text: String

    var body: some View {
        Text(text)
            .font(.system(size: 16, weight: .semibold, design: .rounded))
            .foregroundStyle(SavrColors.deepGreen)
            .padding(.horizontal, 20)
            .padding(.vertical, 14)
            .background(.white)
            .clipShape(Capsule())
            .overlay(
                Capsule()
                    .stroke(SavrColors.line, lineWidth: 1.2)
            )
    }
}

private struct FooterView: View {
    var body: some View {
        VStack(spacing: 0) {
            Rectangle()
                .fill(SavrColors.line)
                .frame(height: 1)

            VStack(spacing: 18) {
                Text("savr")
                    .font(.system(size: 28, weight: .black, design: .rounded))
                    .foregroundStyle(SavrColors.brandGreen)
                    .overlay(alignment: .topTrailing) {
                        Circle()
                            .fill(.red)
                            .frame(width: 7, height: 7)
                            .offset(x: -5, y: -2)
                    }

                Text("Built with love in Canada · 2026 © SAVR")
                    .font(.system(size: 15, weight: .medium, design: .rounded))
                    .foregroundStyle(SavrColors.textSecondary)
                    .multilineTextAlignment(.center)

                HStack(spacing: 24) {
                    Text("Blog")
                    Text("Privacy")
                    Text("Terms")
                }
                .font(.system(size: 15, weight: .semibold, design: .rounded))
                .foregroundStyle(SavrColors.deepGreen)
            }
            .padding(.horizontal, 28)
            .padding(.vertical, 24)
        }
    }
}

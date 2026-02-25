import SwiftUI

struct HomeLandingView: View {
    @StateObject private var vm = HomeViewModel()

    @State private var showSignIn = false
    @State private var showGetStarted = false

    var body: some View {
        ZStack(alignment: .top) {
            ScrollView(showsIndicators: false) {
                VStack(spacing: 26) {
                    SavrNavBar(
                        onSignIn: { showSignIn = true },
                        onGetStarted: { showGetStarted = true }
                    )

                    HeroSection(query: $vm.query, onCamera: vm.openCamera, onSubmit: vm.submitQuery)

                    HowItWorksSection()

                    FeaturesSection()

                    MetricsBar(metrics: [
                        .init(value: "15+", label: "Canadian Stores", sublabel: "Real prices, real-time"),
                        .init(value: "3", label: "Store Comparison", sublabel: "Side-by-side pricing"),
                        .init(value: "100%", label: "Free to Use", sublabel: "No credit card needed"),
                        .init(value: "∞", label: "Grocery Lists", sublabel: "Create as many as you want")
                    ])

                    CTASection(
                        onGetStarted: { showGetStarted = true },
                        onSignIn: { showSignIn = true }
                    )

                    Spacer(minLength: 24)
                }
                .padding(.bottom, 30)
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
                    .padding(.top, 54)

                    Spacer()
                }
                .transition(.move(edge: .top).combined(with: .opacity))
                .animation(.spring(response: 0.35, dampingFraction: 0.9), value: vm.showToast)
            }
        }
        .sheet(isPresented: $showSignIn) { SignInView() }
        .sheet(isPresented: $showGetStarted) { GetStartedView() }
    }
}
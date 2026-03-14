import SwiftUI

struct ChatView: View {
    @EnvironmentObject private var appState: AppState
    @StateObject private var vm = ChatViewModel()
    @State private var showStores = false
    @State private var showPrefs = false

    var body: some View {
        ZStack {
            shellBackground
                .ignoresSafeArea()

            ScrollView(showsIndicators: false) {
                VStack(alignment: .leading, spacing: 16) {
                    Text("Hello \(appState.firstName) 👋")
                        .font(.system(size: 20, weight: .bold, design: .rounded))
                        .foregroundStyle(SavrColors.textSecondary)

                    VStack(alignment: .leading, spacing: -4) {
                        Text("Your ai grocery")
                            .foregroundStyle(SavrColors.textPrimary)
                        Text("shopping")
                            .foregroundStyle(SavrColors.brandGreen)
                        Text("companion.")
                            .foregroundStyle(SavrColors.textPrimary)
                    }
                    .font(.system(size: 34, weight: .black, design: .serif))
                    .minimumScaleFactor(0.8)

                    Text("✨🛒 AI-Powered Canadian Grocery Shopping 🇨🇦")
                        .font(.system(size: 12, weight: .bold, design: .rounded))
                        .foregroundStyle(SavrColors.textPrimary)
                        .padding(.horizontal, 14)
                        .padding(.vertical, 10)
                        .background(Color.white.opacity(0.72))
                        .clipShape(Capsule())
                        .overlay(
                            Capsule()
                                .stroke(SavrColors.peachGlow.opacity(0.9), lineWidth: 1)
                        )

                    HStack(spacing: 8) {
                        ZStack {
                            Circle()
                                .fill(SavrColors.brandGreen)
                                .frame(width: 22, height: 22)
                            Image(systemName: "message")
                                .font(.system(size: 10, weight: .bold))
                                .foregroundStyle(.white)
                        }
                        Text("Savr Assistant")
                            .font(.system(size: 16, weight: .bold, design: .rounded))
                            .foregroundStyle(SavrColors.brandGreen)
                    }

                    introCard

                    inputComposer

                    if !vm.messages.isEmpty {
                        VStack(alignment: .leading, spacing: 12) {
                            ForEach(vm.messages) { msg in
                                messageBubble(msg)
                            }
                        }
                    }
                }
                .padding(.horizontal, 24)
                .padding(.vertical, 24)
            }
        }
        .sheet(isPresented: $showStores) { StoreSelectView() }
        .sheet(isPresented: $showPrefs) { PreferencesView() }
    }

    private var introCard: some View {
        Text("Hi \(appState.firstName)! Welcome to Savr, your personal grocery shopping companion. Planning your meals for the week? Just let me know what you're craving, and I'll help you create the perfect shopping list.")
            .font(.system(size: 15, weight: .medium, design: .rounded))
            .foregroundStyle(SavrColors.textPrimary)
            .lineSpacing(4)
            .padding(18)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(Color.white.opacity(0.76))
            .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: 18, style: .continuous)
                    .stroke(SavrColors.cardStroke.opacity(0.9), lineWidth: 1)
            )
            .shadow(color: .white.opacity(0.3), radius: 16, x: 0, y: 0)
    }

    private var inputComposer: some View {
        VStack(alignment: .leading, spacing: 12) {
            TextField("Ask anything...", text: $vm.draft, axis: .vertical)
                .lineLimit(2...4)
                .textInputAutocapitalization(.sentences)
                .autocorrectionDisabled(false)

            HStack(spacing: 10) {
                actionIcon("camera") { }
                actionIcon("heart") {
                    showPrefs = true
                }
                actionIcon("storefront") {
                    showStores = true
                }

                Spacer()

                Button {
                    vm.send()
                } label: {
                    Image(systemName: "arrow.right")
                        .font(.system(size: 16, weight: .bold))
                        .foregroundStyle(.white)
                        .frame(width: 30, height: 30)
                        .background(SavrColors.brandGreen)
                        .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
                }
            }
        }
        .padding(14)
        .background(Color.white.opacity(0.82))
        .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: 18, style: .continuous)
                .stroke(Color(red: 0.99, green: 0.66, blue: 0.61), lineWidth: 1.2)
        )
    }

    private func messageBubble(_ msg: ChatMessage) -> some View {
        let isUser = (msg.role == .user)

        return HStack {
            if isUser { Spacer(minLength: 0) }

            VStack(alignment: .leading, spacing: 6) {
                Text(msg.text)
                    .font(SavrTypography.body)
                    .foregroundStyle(isUser ? .white : SavrColors.textPrimary)

                Text(msg.timestamp, style: .time)
                    .font(SavrTypography.caption)
                    .foregroundStyle((isUser ? .white.opacity(0.75) : SavrColors.textSecondary))
            }
            .padding(14)
            .background(isUser ? SavrColors.brandGreen : SavrColors.card)
            .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: 16, style: .continuous)
                    .stroke(SavrColors.cardStroke, lineWidth: isUser ? 0 : 1)
            )
            .frame(maxWidth: 450, alignment: isUser ? .trailing : .leading)

            if !isUser { Spacer(minLength: 0) }
        }
    }

    private var shellBackground: some View {
        ZStack {
            LinearGradient(
                colors: [Color.white, SavrColors.bgBottom],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )

            HStack {
                patternWall
                    .frame(width: 96)
                Spacer()
                patternWall
                    .frame(width: 96)
                    .scaleEffect(x: -1, y: 1)
            }
            .opacity(0.17)

            RadialGradient(
                colors: [SavrColors.peachGlow.opacity(0.24), .clear],
                center: .leading,
                startRadius: 14,
                endRadius: 260
            )
            .offset(x: -110, y: 0)

            RadialGradient(
                colors: [SavrColors.brandBlue.opacity(0.22), .clear],
                center: .trailing,
                startRadius: 14,
                endRadius: 280
            )
            .offset(x: 140, y: 40)
        }
    }

    private var patternWall: some View {
        VStack(spacing: 12) {
            ForEach(0..<16, id: \.self) { index in
                HStack(spacing: 10) {
                    Image(systemName: index.isMultiple(of: 3) ? "birthday.cake" : "fork.knife")
                    Image(systemName: index.isMultiple(of: 2) ? "fish" : "cup.and.saucer")
                }
                .font(.system(size: 16, weight: .regular))
                .foregroundStyle(.white)
            }
        }
    }

    private func actionIcon(_ systemName: String, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Image(systemName: systemName)
                .font(.system(size: 15, weight: .semibold))
                .foregroundStyle(SavrColors.textSecondary)
                .frame(width: 30, height: 30)
                .background(Color.white.opacity(0.9))
                .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
                .overlay(
                    RoundedRectangle(cornerRadius: 10, style: .continuous)
                        .stroke(SavrColors.cardStroke.opacity(0.9), lineWidth: 1)
                )
        }
    }
}

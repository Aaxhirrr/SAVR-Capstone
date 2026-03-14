import SwiftUI

struct AppShellView: View {
    var body: some View {
        ChatHomeView()
    }
}

private struct ChatHomeView: View {
    @EnvironmentObject private var appState: AppState
    @State private var draft = ""

    private var greetingName: String {
        let first = appState.firstName.trimmingCharacters(in: .whitespacesAndNewlines)
        if !first.isEmpty {
            return first
        }

        let display = appState.displayName.trimmingCharacters(in: .whitespacesAndNewlines)
        if !display.isEmpty {
            return display.components(separatedBy: " ").first ?? display
        }

        return "there"
    }

    var body: some View {
        VStack(spacing: 0) {
            topBar

            ScrollView(showsIndicators: false) {
                VStack(alignment: .leading, spacing: 16) {
                    greetingSection
                    aiPill
                    assistantHeader
                    messageBubble
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(.horizontal, 16)
                .padding(.top, 14)
                .padding(.bottom, 28)
            }

            composerView
                .padding(.horizontal, 12)
                .padding(.top, 8)
                .padding(.bottom, 20)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(background.ignoresSafeArea())
    }

    private var topBar: some View {
        HStack {
            SavrLogoView(fontSize: 34)

            Spacer()

            Menu {
                Button("Flyers") { }
                Button("My Lists") { }
                Button("Preferences") { }
                Button("Logout") {
                    appState.signOut()
                }
            } label: {
                ZStack {
                    RoundedRectangle(cornerRadius: 12, style: .continuous)
                        .fill(.white.opacity(0.88))
                        .frame(width: 42, height: 42)
                        .overlay(
                            RoundedRectangle(cornerRadius: 12, style: .continuous)
                                .stroke(Color(red: 0.86, green: 0.87, blue: 0.89), lineWidth: 1)
                        )

                    Image(systemName: "line.3.horizontal")
                        .font(.system(size: 18, weight: .bold))
                        .foregroundStyle(Color(red: 0.20, green: 0.24, blue: 0.32))
                }
            }
        }
        .padding(.horizontal, 16)
        .padding(.top, 10)
        .padding(.bottom, 8)
    }

    private var greetingSection: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Hello \(greetingName) 👋")
                .font(.system(size: 18, weight: .bold, design: .rounded))
                .foregroundStyle(Color(red: 0.19, green: 0.24, blue: 0.35))

            VStack(alignment: .leading, spacing: -2) {
                Text("Your ai grocery")
                    .font(.system(size: 30, weight: .black, design: .serif))
                    .foregroundStyle(Color(red: 0.10, green: 0.30, blue: 0.16))
                    .fixedSize(horizontal: false, vertical: true)

                Text("shopping companion.")
                    .font(.system(size: 30, weight: .black, design: .serif))
                    .foregroundStyle(Color(red: 0.12, green: 0.67, blue: 0.28))
                    .fixedSize(horizontal: false, vertical: true)
            }
        }
    }

    private var aiPill: some View {
        Text("☀️ 🛒 AI-Powered Canadian Grocery Shopping 🇨🇦")
            .font(.system(size: 13, weight: .bold, design: .rounded))
            .foregroundStyle(Color(red: 0.38, green: 0.42, blue: 0.50))
            .lineLimit(1)
            .minimumScaleFactor(0.75)
            .padding(.horizontal, 14)
            .padding(.vertical, 10)
            .background(.white.opacity(0.78))
            .clipShape(Capsule())
            .overlay(
                Capsule()
                    .stroke(Color(red: 0.98, green: 0.74, blue: 0.54), lineWidth: 2)
            )
    }

    private var assistantHeader: some View {
        HStack(spacing: 10) {
            ZStack {
                Circle()
                    .fill(Color(red: 0.12, green: 0.67, blue: 0.28))
                    .frame(width: 34, height: 34)

                Image(systemName: "bubble.left")
                    .font(.system(size: 15, weight: .bold))
                    .foregroundStyle(.white)
            }

            Text("Savr Assistant")
                .font(.system(size: 20, weight: .bold, design: .rounded))
                .foregroundStyle(Color(red: 0.10, green: 0.62, blue: 0.25))
        }
    }

    private var messageBubble: some View {
        Text("Hi \(greetingName)! Welcome to Savr, your personal grocery shopping companion. Planning your meals for the week? Just let me know what you're craving, and I'll help you create the perfect shopping list.")
            .font(.system(size: 15, weight: .medium, design: .rounded))
            .foregroundStyle(Color(red: 0.18, green: 0.22, blue: 0.30))
            .lineSpacing(5)
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(16)
            .background(Color(red: 0.96, green: 0.97, blue: 0.98))
            .clipShape(RoundedRectangle(cornerRadius: 20, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: 20, style: .continuous)
                    .stroke(Color(red: 0.88, green: 0.89, blue: 0.92), lineWidth: 1)
            )
    }

    private var composerView: some View {
        VStack(alignment: .leading, spacing: 14) {
            TextField("Ask anything...", text: $draft)
                .font(.system(size: 16, weight: .medium, design: .rounded))
                .foregroundStyle(Color(red: 0.20, green: 0.24, blue: 0.32))

            HStack {
                HStack(spacing: 10) {
                    composerIcon("camera.fill")
                    composerIcon("heart")
                    composerIcon("storefront")
                }

                Spacer()

                Button(action: {}) {
                    RoundedRectangle(cornerRadius: 14, style: .continuous)
                        .fill(Color(red: 0.72, green: 0.89, blue: 0.72))
                        .frame(width: 44, height: 44)
                        .overlay(
                            Image(systemName: "arrow.right")
                                .font(.system(size: 16, weight: .bold))
                                .foregroundStyle(.white)
                        )
                }
            }
        }
        .padding(14)
        .background(.white)
        .clipShape(RoundedRectangle(cornerRadius: 22, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: 22, style: .continuous)
                .stroke(Color(red: 0.98, green: 0.58, blue: 0.47), lineWidth: 2)
        )
        .shadow(color: .black.opacity(0.04), radius: 10, x: 0, y: 3)
    }

    private func composerIcon(_ name: String) -> some View {
        RoundedRectangle(cornerRadius: 12, style: .continuous)
            .fill(Color(red: 0.95, green: 0.92, blue: 0.87))
            .frame(width: 38, height: 38)
            .overlay(
                Image(systemName: name)
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundStyle(Color(red: 0.27, green: 0.31, blue: 0.39))
            )
    }

    private var background: some View {
        ZStack {
            LinearGradient(
                colors: [
                    Color(red: 0.985, green: 0.985, blue: 0.985),
                    Color(red: 0.98, green: 0.99, blue: 0.99)
                ],
                startPoint: .leading,
                endPoint: .trailing
            )

            HStack {
                LinearGradient(
                    colors: [
                        Color(red: 0.99, green: 0.96, blue: 0.84),
                        .clear
                    ],
                    startPoint: .leading,
                    endPoint: .trailing
                )

                LinearGradient(
                    colors: [
                        .clear,
                        Color(red: 0.92, green: 1.00, blue: 0.98)
                    ],
                    startPoint: .leading,
                    endPoint: .trailing
                )
            }

            HStack {
                patternBlock.opacity(0.18)
                Spacer()
                patternBlock.opacity(0.12)
            }
        }
    }

    private var patternBlock: some View {
        VStack(spacing: 14) {
            ForEach(0..<7, id: \.self) { _ in
                HStack(spacing: 14) {
                    ForEach(0..<6, id: \.self) { _ in
                        Image(systemName: [
                            "fork.knife",
                            "cup.and.saucer",
                            "birthday.cake",
                            "takeoutbag.and.cup.and.straw",
                            "carrot",
                            "fish",
                            "leaf"
                        ][Int.random(in: 0...6)])
                        .font(.system(size: 22, weight: .regular))
                        .foregroundStyle(.white.opacity(0.55))
                        .frame(width: 30, height: 30)
                    }
                }
            }
        }
        .padding(24)
    }
}

import SwiftUI

struct ChatView: View {
    @StateObject private var vm = ChatViewModel()
    @State private var showStores = false
    @State private var showPrefs = false

    var body: some View {
        ZStack {
            LinearGradient(colors: [SavrColors.bgTop, SavrColors.bgBottom],
                           startPoint: .top, endPoint: .bottom)
            .ignoresSafeArea()

            VStack(spacing: 0) {
                header

                ScrollViewReader { proxy in
                    ScrollView(showsIndicators: false) {
                        VStack(alignment: .leading, spacing: 12) {
                            ForEach(vm.messages) { msg in
                                messageBubble(msg)
                                    .id(msg.id)
                            }
                        }
                        .padding(.horizontal, 16)
                        .padding(.top, 14)
                        .padding(.bottom, 12)
                    }
                    .onChange(of: vm.messages) { _ in
                        if let last = vm.messages.last {
                            withAnimation(.easeOut(duration: 0.2)) {
                                proxy.scrollTo(last.id, anchor: .bottom)
                            }
                        }
                    }
                }

                inputBar
            }
        }
        .sheet(isPresented: $showStores) { StoreSelectView() }
        .sheet(isPresented: $showPrefs) { PreferencesView() }
    }

    private var header: some View {
        HStack(spacing: 12) {
            Image(systemName: "bag.fill")
                .foregroundStyle(SavrColors.brandGreen)

            VStack(alignment: .leading, spacing: 2) {
                Text("Savr Assistant")
                    .font(.system(size: 16, weight: .bold, design: .rounded))
                    .foregroundStyle(SavrColors.textPrimary)
                Text("Your AI grocery shopping companion")
                    .font(.system(size: 12, weight: .medium, design: .rounded))
                    .foregroundStyle(SavrColors.textSecondary)
            }

            Spacer()

            Button {
                vm.newChat()
            } label: {
                Label("New Chat", systemImage: "plus.bubble")
            }
            .buttonStyle(SavrSecondaryButtonStyle())

            Button {
                showStores = true
            } label: {
                Label("Select Stores", systemImage: "mappin.and.ellipse")
            }
            .buttonStyle(SavrSecondaryButtonStyle())

            Button {
                showPrefs = true
            } label: {
                Label("Preferences", systemImage: "heart")
            }
            .buttonStyle(SavrSecondaryButtonStyle())
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 12)
        .background(.white.opacity(0.55))
        .overlay(Rectangle().fill(SavrColors.cardStroke).frame(height: 1), alignment: .bottom)
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
            .frame(maxWidth: 520, alignment: isUser ? .trailing : .leading)

            if !isUser { Spacer(minLength: 0) }
        }
    }

    private var inputBar: some View {
        HStack(spacing: 10) {
            TextField("Message Savr...", text: $vm.draft)
                .textInputAutocapitalization(.sentences)
                .autocorrectionDisabled(false)
                .submitLabel(.send)
                .onSubmit { vm.send() }

            Button {
                // stub camera
            } label: {
                Image(systemName: "camera")
                    .font(.system(size: 18, weight: .semibold))
                    .foregroundStyle(SavrColors.textSecondary)
            }

            Button {
                vm.send()
            } label: {
                Image(systemName: "arrow.up.circle.fill")
                    .font(.system(size: 24, weight: .bold))
                    .foregroundStyle(SavrColors.brandGreen)
            }
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 12)
        .background(.white.opacity(0.92))
        .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: 18, style: .continuous)
                .stroke(SavrColors.cardStroke, lineWidth: 1)
        )
        .shadow(color: .black.opacity(0.06), radius: 10, x: 0, y: 6)
        .padding(.horizontal, 16)
        .padding(.vertical, 12)
        .background(.white.opacity(0.55))
    }
}
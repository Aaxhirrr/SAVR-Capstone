import SwiftUI

// MARK: - ViewModel

@MainActor
final class ListDetailChatViewModel: ObservableObject {
    @Published var messages: [ChatMessage] = []
    @Published var draft: String = ""
    @Published var isLoading: Bool = false
    @Published var isWaiting: Bool = false
    @Published var errorMessage: String?

    private let sessionId: String
    private let chatService: ChatService

    init(sessionId: String, chatService: ChatService = ChatService()) {
        self.sessionId = sessionId
        self.chatService = chatService
    }

    func loadHistory() async {
        guard messages.isEmpty else { return }
        isLoading = true
        do {
            messages = try await chatService.fetchHistory(sessionId: sessionId)
        } catch {
            errorMessage = "Couldn't load chat history."
        }
        isLoading = false
    }

    func send() {
        let trimmed = draft.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty, !isWaiting else { return }
        draft = ""
        messages.append(.init(role: .user, text: trimmed, timestamp: Date()))
        isWaiting = true
        errorMessage = nil

        Task {
            do {
                let response = try await chatService.sendMessage(text: trimmed, sessionId: sessionId)
                messages.append(.init(role: .assistant, text: response.botResponse, timestamp: Date()))
            } catch {
                errorMessage = error.localizedDescription
                messages.append(.init(role: .assistant, text: "Sorry, something went wrong. Please try again.", timestamp: Date()))
            }
            isWaiting = false
        }
    }
}

// MARK: - Main View

struct ListDetailView: View {
    let list: GroceryList

    @State private var selectedTab: Tab = .list
    @StateObject private var chatViewModel: ListDetailChatViewModel
    @State private var checkedItems: Set<String> = []
    @Environment(\.dismiss) private var dismiss

    enum Tab { case list, chat }

    init(list: GroceryList) {
        self.list = list
        // Use sessionId from the list, or fall back to list id (for session-based lists)
        let sid = list.sessionId ?? list.id
        _chatViewModel = StateObject(wrappedValue: ListDetailChatViewModel(sessionId: sid))
    }

    var body: some View {
        ZStack {
            LinearGradient(colors: [SavrColors.bgTop, SavrColors.bgBottom],
                           startPoint: .top, endPoint: .bottom)
                .ignoresSafeArea()

            VStack(spacing: 0) {
                // Nav bar
                navBar

                // Pill toggle
                togglePill
                    .padding(.horizontal, 20)
                    .padding(.top, 14)
                    .padding(.bottom, 10)

                // Content
                if selectedTab == .list {
                    listTab
                } else {
                    chatTab
                }
            }
        }
        .navigationBarHidden(true)
        .task {
            if selectedTab == .chat {
                await chatViewModel.loadHistory()
            }
        }
        .onChange(of: selectedTab) { tab in
            if tab == .chat {
                Task { await chatViewModel.loadHistory() }
            }
        }
    }

    // MARK: - Nav Bar

    private var navBar: some View {
        HStack(spacing: 12) {
            Button {
                dismiss()
            } label: {
                Image(systemName: "chevron.left")
                    .font(.system(size: 17, weight: .semibold))
                    .foregroundStyle(Color(red: 0.10, green: 0.30, blue: 0.16))
                    .frame(width: 36, height: 36)
                    .background(.white.opacity(0.7))
                    .clipShape(Circle())
            }
            .buttonStyle(.plain)

            Text(list.name)
                .font(.system(size: 18, weight: .bold, design: .rounded))
                .foregroundStyle(Color(red: 0.10, green: 0.30, blue: 0.16))
                .lineLimit(1)

            Spacer()

            Text("\(list.items.count) item\(list.items.count == 1 ? "" : "s")")
                .font(.system(size: 13, weight: .medium))
                .foregroundStyle(.secondary)
        }
        .padding(.horizontal, 20)
        .padding(.top, 16)
        .padding(.bottom, 8)
    }

    // MARK: - Toggle Pill

    private var togglePill: some View {
        HStack(spacing: 0) {
            pillButton("List", tab: .list, icon: "list.bullet")
            pillButton("Chat", tab: .chat, icon: "bubble.left.fill")
        }
        .background(Color.white.opacity(0.55))
        .clipShape(Capsule())
        .overlay(Capsule().stroke(Color(red: 0.88, green: 0.92, blue: 0.88), lineWidth: 1))
    }

    private func pillButton(_ label: String, tab: Tab, icon: String) -> some View {
        Button {
            withAnimation(.spring(response: 0.25)) { selectedTab = tab }
        } label: {
            HStack(spacing: 6) {
                Image(systemName: icon)
                    .font(.system(size: 13, weight: .semibold))
                Text(label)
                    .font(.system(size: 14, weight: .semibold, design: .rounded))
            }
            .foregroundStyle(selectedTab == tab ? .white : Color(red: 0.10, green: 0.30, blue: 0.16))
            .padding(.vertical, 9)
            .frame(maxWidth: .infinity)
            .background(
                selectedTab == tab
                    ? Capsule().fill(SavrColors.brandGreen)
                    : Capsule().fill(Color.clear)
            )
            .padding(3)
        }
        .buttonStyle(.plain)
    }

    // MARK: - List Tab

    private var listTab: some View {
        ScrollView {
            VStack(spacing: 0) {
                // White card wrapping all items, just like the web UI
                VStack(spacing: 0) {
                    let grouped = Dictionary(grouping: list.items) { $0.category ?? "Other" }
                    // Sort: Meat, Produce, Pantry, then alpha
                    let sortedKeys = grouped.keys.sorted { a, b in
                        let order = ["Meat", "Produce", "Dairy", "Bakery", "Frozen", "Pantry", "Beverages", "Snacks", "Other"]
                        let ai = order.firstIndex(of: a) ?? 99
                        let bi = order.firstIndex(of: b) ?? 99
                        return ai == bi ? a < b : ai < bi
                    }

                    ForEach(Array(sortedKeys.enumerated()), id: \.element) { sectionIndex, category in
                        if let items = grouped[category] {
                            // Category header row
                            HStack {
                                Text(category.uppercased())
                                    .font(.system(size: 11, weight: .bold))
                                    .foregroundStyle(Color(red: 0.45, green: 0.50, blue: 0.45))
                                    .tracking(1.0)
                                Spacer()
                            }
                            .padding(.horizontal, 18)
                            .padding(.top, sectionIndex == 0 ? 14 : 18)
                            .padding(.bottom, 4)

                            // Item rows
                            ForEach(Array(items.enumerated()), id: \.element.id) { index, item in
                                itemRow(item: item, isLastInSection: index == items.count - 1, isLastSection: sectionIndex == sortedKeys.count - 1)
                            }
                        }
                    }
                }
                .background(Color.white)
                .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
                .overlay(
                    RoundedRectangle(cornerRadius: 16, style: .continuous)
                        .stroke(Color(red: 0.90, green: 0.92, blue: 0.90), lineWidth: 1)
                )
                .shadow(color: .black.opacity(0.05), radius: 10, x: 0, y: 3)
                .padding(.horizontal, 16)
                .padding(.top, 10)
                .padding(.bottom, 40)
            }
        }
    }

    private func itemRow(item: GroceryListItem, isLastInSection: Bool, isLastSection: Bool) -> some View {
        let isChecked = checkedItems.contains(item.id)
        let isLast = isLastInSection && isLastSection

        return VStack(spacing: 0) {
            HStack(spacing: 12) {
                // Green checkmark — filled when checked, outline when not
                Button {
                    withAnimation(.spring(response: 0.2)) {
                        if isChecked {
                            checkedItems.remove(item.id)
                        } else {
                            checkedItems.insert(item.id)
                        }
                    }
                } label: {
                    Image(systemName: isChecked ? "checkmark.circle.fill" : "circle")
                        .font(.system(size: 20))
                        .foregroundStyle(isChecked ? SavrColors.brandGreen : Color(red: 0.78, green: 0.82, blue: 0.78))
                }
                .buttonStyle(.plain)

                // Item name
                Text(item.name)
                    .font(.system(size: 15, weight: .medium))
                    .foregroundStyle(isChecked ? Color(red: 0.60, green: 0.65, blue: 0.60) : Color(red: 0.10, green: 0.15, blue: 0.10))
                    .strikethrough(isChecked, color: Color(red: 0.60, green: 0.65, blue: 0.60))

                Spacer()

                // Quantity
                if let qty = item.quantity, !qty.isEmpty {
                    Text(qty)
                        .font(.system(size: 13, weight: .medium))
                        .foregroundStyle(Color(red: 0.45, green: 0.50, blue: 0.45))
                }

                // Category badge — matches web UI
                if let cat = item.category, !cat.isEmpty {
                    Text(cat)
                        .font(.system(size: 11, weight: .semibold))
                        .foregroundStyle(Color(red: 0.45, green: 0.50, blue: 0.45))
                        .padding(.horizontal, 8)
                        .padding(.vertical, 3)
                        .background(Color(red: 0.93, green: 0.96, blue: 0.93))
                        .clipShape(RoundedRectangle(cornerRadius: 6, style: .continuous))
                }
            }
            .padding(.horizontal, 18)
            .padding(.vertical, 13)

            if !isLast {
                Divider()
                    .padding(.leading, 50)
            }
        }
    }

    // MARK: - Chat Tab

    private var chatTab: some View {
        VStack(spacing: 0) {
            // Messages
            ScrollViewReader { proxy in
                ScrollView {
                    LazyVStack(spacing: 12) {
                        if chatViewModel.isLoading {
                            ProgressView()
                                .padding(.top, 40)
                        } else if chatViewModel.messages.isEmpty {
                            Text("No chat history yet.")
                                .font(.system(size: 15))
                                .foregroundStyle(.secondary)
                                .padding(.top, 40)
                        } else {
                            ForEach(chatViewModel.messages) { msg in
                                chatBubble(msg)
                                    .id(msg.id)
                            }

                            if chatViewModel.isWaiting {
                                typingIndicator
                            }
                        }
                    }
                    .padding(.horizontal, 16)
                    .padding(.vertical, 14)
                }
                .onChange(of: chatViewModel.messages.count) { _ in
                    if let last = chatViewModel.messages.last {
                        withAnimation { proxy.scrollTo(last.id, anchor: .bottom) }
                    }
                }
            }

            // Input bar
            chatInputBar
        }
    }

    private func chatBubble(_ msg: ChatMessage) -> some View {
        HStack {
            if msg.role == .user { Spacer(minLength: 60) }

            Text(msg.text)
                .font(.system(size: 15, design: .rounded))
                .foregroundStyle(msg.role == .user ? .white : Color(red: 0.10, green: 0.30, blue: 0.16))
                .padding(.horizontal, 14)
                .padding(.vertical, 10)
                .background(
                    msg.role == .user
                        ? SavrColors.brandGreen
                        : Color.white.opacity(0.90)
                )
                .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
                .shadow(color: .black.opacity(0.05), radius: 4, x: 0, y: 2)

            if msg.role == .assistant { Spacer(minLength: 60) }
        }
    }

    private var typingIndicator: some View {
        HStack {
            HStack(spacing: 5) {
                ForEach(0..<3, id: \.self) { i in
                    Circle()
                        .fill(SavrColors.brandGreen)
                        .frame(width: 7, height: 7)
                        .opacity(0.6)
                }
            }
            .padding(.horizontal, 14)
            .padding(.vertical, 12)
            .background(Color.white.opacity(0.90))
            .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
            Spacer(minLength: 60)
        }
    }

    private var chatInputBar: some View {
        VStack(spacing: 0) {
            Divider()

            HStack(spacing: 10) {
                TextField("Continue the conversation…", text: $chatViewModel.draft, axis: .vertical)
                    .font(.system(size: 15, design: .rounded))
                    .lineLimit(1...5)
                    .padding(.horizontal, 14)
                    .padding(.vertical, 10)
                    .background(Color.white.opacity(0.85))
                    .clipShape(RoundedRectangle(cornerRadius: 20, style: .continuous))
                    .overlay(
                        RoundedRectangle(cornerRadius: 20, style: .continuous)
                            .stroke(Color(red: 0.85, green: 0.92, blue: 0.85), lineWidth: 1)
                    )

                Button {
                    chatViewModel.send()
                } label: {
                    Image(systemName: "arrow.up.circle.fill")
                        .font(.system(size: 32))
                        .foregroundStyle(
                            chatViewModel.draft.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty || chatViewModel.isWaiting
                                ? Color.gray.opacity(0.4)
                                : SavrColors.brandGreen
                        )
                }
                .buttonStyle(.plain)
                .disabled(chatViewModel.draft.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty || chatViewModel.isWaiting)
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 10)
            .background(
                LinearGradient(colors: [SavrColors.bgTop, SavrColors.bgBottom],
                               startPoint: .top, endPoint: .bottom)
                .ignoresSafeArea(edges: .bottom)
            )
        }
    }
}

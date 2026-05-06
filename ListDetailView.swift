import SwiftUI

// MARK: - ViewModel

@MainActor
final class ListDetailViewModel: ObservableObject {
    @Published private(set) var list: GroceryList
    @Published var isRefreshing = false
    @Published var errorMessage: String?

    private let service: GroceryListService

    init(list: GroceryList, service: GroceryListService = GroceryListService()) {
        self.list = list
        self.service = service
    }

    func loadLatest() async {
        guard !isRefreshing else { return }
        isRefreshing = true
        defer { isRefreshing = false }

        do {
            list = try await service.fetchList(id: list.id)
            errorMessage = nil
        } catch {
            errorMessage = "Couldn't refresh this list."
        }
    }
}

@MainActor
final class ListDetailChatViewModel: ObservableObject {
    @Published var messages: [ChatMessage] = []
    @Published var draft: String = ""
    @Published var isLoading: Bool = false
    @Published var isWaiting: Bool = false
    @Published var errorMessage: String?

    private var sessionId: String?
    private let listId: String
    private let chatService: ChatService
    private let sessionStore: ListChatSessionStore
    private var listContext: GroceryList
    private var hasAttemptedRemoteHistoryLoad = false

    init(
        list: GroceryList,
        chatService: ChatService = ChatService(),
        sessionStore: ListChatSessionStore = ListChatSessionStore()
    ) {
        self.listId = list.id
        self.listContext = list
        self.chatService = chatService
        self.sessionStore = sessionStore
        self.sessionId = sessionStore.sessionId(for: list.id) ?? list.sessionId
        self.messages = sessionStore.messages(for: list.id)
    }

    func updateList(_ list: GroceryList) {
        listContext = list

        if let persistedSessionId = sessionStore.sessionId(for: list.id) {
            sessionId = persistedSessionId
        } else if sessionId == nil {
            sessionId = list.sessionId
        }

        let cachedMessages = sessionStore.messages(for: list.id)
        if messages.isEmpty, !cachedMessages.isEmpty {
            messages = cachedMessages
        }
    }

    func loadHistory() async {
        if messages.isEmpty {
            messages = sessionStore.messages(for: listId)
        }

        guard let sessionId else { return }
        guard !hasAttemptedRemoteHistoryLoad else { return }

        hasAttemptedRemoteHistoryLoad = true
        isLoading = true
        errorMessage = nil
        do {
            messages = try await chatService.fetchHistory(sessionId: sessionId)
            sessionStore.save(messages: messages, for: listId)
            sessionStore.save(sessionId: sessionId, for: listId)
        } catch {
            if isMissingSession(error) {
                self.sessionId = nil
                sessionStore.clearSessionId(for: listId)
                errorMessage = nil
            } else {
                errorMessage = "Couldn't load chat history."
            }
        }
        isLoading = false
    }

    func send() {
        let trimmed = draft.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty, !isWaiting else { return }
        draft = ""
        let userMessage = ChatMessage(role: .user, text: trimmed, timestamp: Date())
        let previousTranscript = messages
        messages.append(userMessage)
        sessionStore.save(messages: messages, for: listId)
        isWaiting = true
        errorMessage = nil

        Task {
            do {
                let response = try await sendMessage(
                    userMessage: trimmed,
                    transcript: previousTranscript
                )
                sessionId = response.sessionId
                sessionStore.save(sessionId: response.sessionId, for: listId)
                messages.append(.init(role: .assistant, text: response.botResponse, timestamp: Date()))
                sessionStore.save(messages: messages, for: listId)
            } catch {
                errorMessage = error.localizedDescription
                messages.append(.init(role: .assistant, text: "Sorry, something went wrong. Please try again.", timestamp: Date()))
                sessionStore.save(messages: messages, for: listId)
            }
            isWaiting = false
        }
    }

    private func sendMessage(
        userMessage: String,
        transcript: [ChatMessage]
    ) async throws -> ChatAPIResponse {
        do {
            return try await chatService.sendMessage(
                text: payload(for: userMessage, transcript: transcript, needsContextBootstrap: sessionId == nil),
                sessionId: sessionId
            )
        } catch {
            guard isMissingSession(error) else { throw error }

            sessionId = nil
            sessionStore.clearSessionId(for: listId)

            return try await chatService.sendMessage(
                text: payload(for: userMessage, transcript: transcript, needsContextBootstrap: true),
                sessionId: nil
            )
        }
    }

    private func payload(
        for userMessage: String,
        transcript: [ChatMessage],
        needsContextBootstrap: Bool
    ) -> String {
        guard needsContextBootstrap else { return userMessage }

        let itemPreview = listContext.items.prefix(12).map { item in
            let quantity = item.quantity?.isEmpty == false ? " (\(item.quantity!))" : ""
            let category = item.category?.isEmpty == false ? " - \(item.category!)" : ""
            return "- \(item.name)\(quantity)\(category)"
        }.joined(separator: "\n")

        let recentTranscript = transcript.suffix(8).map { message in
            let speaker = message.role == .user ? "User" : "Assistant"
            return "\(speaker): \(message.text)"
        }.joined(separator: "\n")

        return """
        Continue this SAVR grocery list conversation as the same thread.
        List name: \(listContext.name)
        Current list items:
        \(itemPreview.isEmpty ? "- No items saved yet" : itemPreview)

        Recent conversation context:
        \(recentTranscript.isEmpty ? "No previous transcript is available." : recentTranscript)

        The user's new message is:
        \(userMessage)

        Respond naturally as if continuing the existing list chat. Use the prior list context without restating all of it unless helpful.
        """
    }

    private func isMissingSession(_ error: Error) -> Bool {
        guard case let APIError.requestFailed(statusCode, _, _, _, _) = error else { return false }
        return statusCode == 404
    }
}

private struct PersistedListChatMessage: Codable {
    let role: String
    let text: String
    let timestamp: Date

    init(message: ChatMessage) {
        role = message.role == .user ? "user" : "assistant"
        text = message.text
        timestamp = message.timestamp
    }

    var chatMessage: ChatMessage {
        ChatMessage(
            role: role == "user" ? .user : .assistant,
            text: text,
            timestamp: timestamp
        )
    }
}

struct ListChatSessionStore {
    private let defaults = UserDefaults.standard
    private let sessionPrefix = "savr.list-chat.session."
    private let messagesPrefix = "savr.list-chat.messages."

    func sessionId(for listId: String) -> String? {
        defaults.string(forKey: sessionPrefix + listId)
    }

    func save(sessionId: String, for listId: String) {
        defaults.set(sessionId, forKey: sessionPrefix + listId)
    }

    func clearSessionId(for listId: String) {
        defaults.removeObject(forKey: sessionPrefix + listId)
    }

    func messages(for listId: String) -> [ChatMessage] {
        guard
            let data = defaults.data(forKey: messagesPrefix + listId),
            let savedMessages = try? JSONDecoder().decode([PersistedListChatMessage].self, from: data)
        else {
            return []
        }

        return savedMessages.map(\.chatMessage)
    }

    func save(messages: [ChatMessage], for listId: String) {
        let persistedMessages = messages.map(PersistedListChatMessage.init(message:))
        guard let data = try? JSONEncoder().encode(persistedMessages) else { return }
        defaults.set(data, forKey: messagesPrefix + listId)
    }
}

// MARK: - Main View

struct ListDetailView: View {
    let list: GroceryList

    @State private var selectedTab: Tab = .list
    @StateObject private var detailViewModel: ListDetailViewModel
    @StateObject private var chatViewModel: ListDetailChatViewModel
    @State private var selectedGrouping: ReceiptGrouping = .category
    @State private var checkedLineItems: Set<Int> = []
    @Environment(\.dismiss) private var dismiss

    enum Tab { case list, chat }

    init(list: GroceryList) {
        self.list = list
        _detailViewModel = StateObject(wrappedValue: ListDetailViewModel(list: list))
        _chatViewModel = StateObject(wrappedValue: ListDetailChatViewModel(list: list))
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
            await refreshList()
            if selectedTab == .chat {
                await chatViewModel.loadHistory()
            }
        }
        .onChange(of: selectedTab) { tab in
            if tab == .chat {
                Task { await chatViewModel.loadHistory() }
            }
        }
        .onChange(of: detailViewModel.list.id) { _ in
            syncCheckedItemsWithCurrentList()
        }
        .onChange(of: detailViewModel.list.items.count) { _ in
            syncCheckedItemsWithCurrentList()
        }
    }

    private func refreshList() async {
        await detailViewModel.loadLatest()
        chatViewModel.updateList(detailViewModel.list)
        syncCheckedItemsWithCurrentList()
    }

    private func syncCheckedItemsWithCurrentList() {
        let validIndexes = Set(detailViewModel.list.items.indices)
        checkedLineItems = checkedLineItems.intersection(validIndexes)
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

            Text(detailViewModel.list.name)
                .font(.system(size: 18, weight: .bold, design: .rounded))
                .foregroundStyle(Color(red: 0.10, green: 0.30, blue: 0.16))
                .lineLimit(1)

            Spacer()

            HStack(spacing: 8) {
                if detailViewModel.isRefreshing {
                    ProgressView()
                        .controlSize(.small)
                }

                Text("\(detailViewModel.list.items.count) item\(detailViewModel.list.items.count == 1 ? "" : "s")")
                    .font(.system(size: 13, weight: .medium))
                    .foregroundStyle(.secondary)
            }
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
            VStack(spacing: 12) {
                if let errorMessage = detailViewModel.errorMessage {
                    Text(errorMessage)
                        .font(.system(size: 13, weight: .medium, design: .rounded))
                        .foregroundStyle(.red)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding(.horizontal, 18)
                        .padding(.vertical, 12)
                        .background(Color.white.opacity(0.82))
                        .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
                }

                ReceiptListCard(
                    list: detailViewModel.list,
                    selectedGrouping: $selectedGrouping,
                    checkedLineItems: $checkedLineItems
                )
            }
                .padding(.horizontal, 16)
                .padding(.top, 10)
                .padding(.bottom, 40)
        }
        .refreshable {
            await refreshList()
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

            if msg.role == .assistant {
                ListDetailAssistantBubble(text: msg.text)
            } else {
                Text(msg.text)
                    .font(.system(size: 15, design: .rounded))
                    .foregroundStyle(.white)
                    .padding(.horizontal, 14)
                    .padding(.vertical, 10)
                    .background(SavrColors.brandGreen)
                    .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
                    .shadow(color: .black.opacity(0.05), radius: 4, x: 0, y: 2)
            }

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

private enum ReceiptGrouping: String, CaseIterable, Identifiable {
    case all = "All"
    case category = "Category"
    case meal = "Meal"

    var id: Self { self }
}

private struct ReceiptSection: Identifiable {
    let title: String
    let items: [(index: Int, item: GroceryListItem)]

    var id: String { title }
}

private struct ReceiptListCard: View {
    let list: GroceryList
    @Binding var selectedGrouping: ReceiptGrouping
    @Binding var checkedLineItems: Set<Int>

    private let preferredCategoryOrder = [
        "Meat", "Produce", "Dairy", "Bakery", "Frozen",
        "Pantry", "Beverages", "Snacks", "Other"
    ]

    private var receiptSections: [ReceiptSection] {
        let indexedItems = Array(list.items.enumerated())

        switch selectedGrouping {
        case .all:
            return [
                ReceiptSection(
                    title: "All Items",
                    items: indexedItems.map { (index: $0.offset, item: $0.element) }
                )
            ]

        case .category:
            let grouped = Dictionary(grouping: indexedItems) { entry in
                let item = entry.element
                return normalizedTitle(item.category, fallback: "Other")
            }

            return grouped.keys.sorted(by: compareSectionTitles).map { key in
                let items = grouped[key, default: []].map { (index: $0.offset, item: $0.element) }
                return ReceiptSection(title: key, items: items)
            }

        case .meal:
            let grouped = Dictionary(grouping: indexedItems) { entry in
                let item = entry.element
                return normalizedTitle(item.meal, fallback: "General")
            }

            return grouped.keys.sorted().map { key in
                let items = grouped[key, default: []].map { (index: $0.offset, item: $0.element) }
                return ReceiptSection(title: key, items: items)
            }
        }
    }

    private var bestStoreText: String {
        guard
            let name = list.leastExpensiveStoreName,
            let price = list.leastExpensiveStorePrice
        else {
            return "Best price pending"
        }

        return "\(name) $\(price.formatted(.number.precision(.fractionLength(2))))"
    }

    private var savingsText: String {
        guard let savings = list.savingsAmount, savings > 0 else {
            return "Live prices unavailable"
        }

        return "Save $\(savings.formatted(.number.precision(.fractionLength(2))))"
    }

    var body: some View {
        VStack(spacing: 0) {
            receiptHeader
            groupingTabs
                .padding(.horizontal, 18)
                .padding(.top, 8)
                .padding(.bottom, 10)

            VStack(spacing: 0) {
                ForEach(Array(receiptSections.enumerated()), id: \.element.id) { sectionOffset, section in
                    sectionView(section, isFirst: sectionOffset == 0)
                }
            }

            receiptFooter
        }
        .padding(.top, 16)
        .padding(.bottom, 18)
        .background(
            ReceiptPaperShape()
                .fill(Color.white.opacity(0.96))
        )
        .overlay(
            ReceiptPaperShape()
                .stroke(Color(red: 0.90, green: 0.92, blue: 0.90), lineWidth: 1)
        )
        .shadow(color: .black.opacity(0.07), radius: 16, x: 0, y: 10)
    }

    private var receiptHeader: some View {
        HStack(spacing: 12) {
            ZStack {
                Circle()
                    .fill(Color(red: 0.90, green: 0.98, blue: 0.91))
                    .frame(width: 34, height: 34)

                Image(systemName: "cart.fill")
                    .font(.system(size: 15, weight: .semibold))
                    .foregroundStyle(SavrColors.brandGreen)
            }

            VStack(alignment: .leading, spacing: 2) {
                Text(list.name)
                    .font(.system(size: 18, weight: .bold, design: .rounded))
                    .foregroundStyle(Color(red: 0.16, green: 0.20, blue: 0.28))
                    .lineLimit(2)

                Text("\(list.items.count) item\(list.items.count == 1 ? "" : "s")")
                    .font(.system(size: 14, weight: .medium, design: .rounded))
                    .foregroundStyle(Color(red: 0.50, green: 0.54, blue: 0.63))
            }

            Spacer()

            Image(systemName: "arrow.up.left.and.arrow.down.right")
                .font(.system(size: 15, weight: .semibold))
                .foregroundStyle(Color(red: 0.38, green: 0.43, blue: 0.53))
        }
        .padding(.horizontal, 18)
        .padding(.bottom, 14)
    }

    private var groupingTabs: some View {
        HStack(spacing: 0) {
            ForEach(ReceiptGrouping.allCases) { grouping in
                Button {
                    withAnimation(.spring(response: 0.24, dampingFraction: 0.9)) {
                        selectedGrouping = grouping
                    }
                } label: {
                    Text(grouping.rawValue)
                        .font(.system(size: 14, weight: .semibold, design: .rounded))
                        .foregroundStyle(
                            selectedGrouping == grouping
                                ? Color(red: 0.23, green: 0.28, blue: 0.36)
                                : Color(red: 0.43, green: 0.48, blue: 0.57)
                        )
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 10)
                        .background(
                            RoundedRectangle(cornerRadius: 10, style: .continuous)
                                .fill(
                                    selectedGrouping == grouping
                                        ? Color.white
                                        : Color.clear
                                )
                        )
                }
                .buttonStyle(.plain)
            }
        }
        .padding(4)
        .background(Color(red: 0.94, green: 0.95, blue: 0.97))
        .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
    }

    private func sectionView(_ section: ReceiptSection, isFirst: Bool) -> some View {
        VStack(spacing: 0) {
            HStack {
                Text(section.title.uppercased())
                    .font(.system(size: 11, weight: .bold))
                    .tracking(1.0)
                    .foregroundStyle(Color(red: 0.47, green: 0.53, blue: 0.64))

                Spacer()
            }
            .padding(.horizontal, 18)
            .padding(.top, isFirst ? 8 : 18)
            .padding(.bottom, 6)

            ForEach(Array(section.items.enumerated()), id: \.offset) { rowOffset, entry in
                receiptRow(
                    index: entry.index,
                    item: entry.item,
                    showDivider: rowOffset < section.items.count - 1
                )
            }
        }
    }

    private func receiptRow(index: Int, item: GroceryListItem, showDivider: Bool) -> some View {
        let isChecked = checkedLineItems.contains(index)

        return VStack(spacing: 0) {
            HStack(spacing: 10) {
                Button {
                    withAnimation(.spring(response: 0.22, dampingFraction: 0.85)) {
                        if isChecked {
                            checkedLineItems.remove(index)
                        } else {
                            checkedLineItems.insert(index)
                        }
                    }
                } label: {
                    Image(systemName: isChecked ? "checkmark" : "circle.fill")
                        .font(.system(size: isChecked ? 16 : 9, weight: .bold))
                        .foregroundStyle(
                            isChecked
                                ? SavrColors.brandGreen
                                : Color(red: 0.74, green: 0.80, blue: 0.76)
                        )
                        .frame(width: 18, height: 18)
                }
                .buttonStyle(.plain)

                Text(item.name)
                    .font(.system(size: 15, weight: .medium, design: .rounded))
                    .foregroundStyle(
                        isChecked
                            ? Color(red: 0.57, green: 0.61, blue: 0.66)
                            : Color(red: 0.21, green: 0.25, blue: 0.33)
                    )
                    .strikethrough(isChecked, color: Color(red: 0.57, green: 0.61, blue: 0.66))
                    .frame(maxWidth: .infinity, alignment: .leading)

                if let quantity = item.quantity, !quantity.isEmpty {
                    Text(quantity)
                        .font(.system(size: 13, weight: .medium, design: .rounded))
                        .foregroundStyle(Color(red: 0.47, green: 0.53, blue: 0.64))
                }

                if let badge = badgeText(for: item) {
                    Text(badge)
                        .font(.system(size: 11, weight: .semibold, design: .rounded))
                        .foregroundStyle(Color(red: 0.25, green: 0.28, blue: 0.33))
                        .padding(.horizontal, 8)
                        .padding(.vertical, 4)
                        .background(Color(red: 0.97, green: 0.97, blue: 0.98))
                        .clipShape(Capsule())
                }
            }
            .padding(.horizontal, 18)
            .padding(.vertical, 13)

            if showDivider {
                Divider()
                    .padding(.leading, 46)
            }
        }
    }

    private var receiptFooter: some View {
        HStack(spacing: 10) {
            footerChip(
                title: "Stores",
                systemImage: "storefront",
                tint: Color(red: 0.36, green: 0.40, blue: 0.49),
                isOutlined: true
            )

            footerChip(
                title: bestStoreText,
                systemImage: "tag.fill",
                tint: SavrColors.deepGreen,
                isOutlined: true
            )

            footerChip(
                title: savingsText,
                systemImage: "sparkles",
                tint: .white,
                background: SavrColors.brandGreen
            )
        }
        .padding(.horizontal, 18)
        .padding(.top, 18)
    }

    private func footerChip(
        title: String,
        systemImage: String,
        tint: Color,
        background: Color = Color.white,
        isOutlined: Bool = false
    ) -> some View {
        HStack(spacing: 7) {
            Image(systemName: systemImage)
                .font(.system(size: 13, weight: .semibold))

            Text(title)
                .font(.system(size: 13, weight: .bold, design: .rounded))
                .lineLimit(1)
                .minimumScaleFactor(0.8)
        }
        .foregroundStyle(tint)
        .padding(.horizontal, 12)
        .padding(.vertical, 10)
        .frame(maxWidth: .infinity)
        .background(background)
        .overlay(
            RoundedRectangle(cornerRadius: 9, style: .continuous)
                .stroke(
                    isOutlined
                        ? Color(red: 0.84, green: 0.88, blue: 0.93)
                        : Color.clear,
                    lineWidth: 1
                )
        )
        .clipShape(RoundedRectangle(cornerRadius: 9, style: .continuous))
    }

    private func badgeText(for item: GroceryListItem) -> String? {
        switch selectedGrouping {
        case .all:
            return item.category ?? item.meal
        case .category:
            return item.category
        case .meal:
            return item.meal ?? item.category
        }
    }

    private func normalizedTitle(_ value: String?, fallback: String) -> String {
        let trimmed = value?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
        return trimmed.isEmpty ? fallback : trimmed
    }

    private func compareSectionTitles(_ lhs: String, _ rhs: String) -> Bool {
        let lhsIndex = preferredCategoryOrder.firstIndex(of: lhs) ?? Int.max
        let rhsIndex = preferredCategoryOrder.firstIndex(of: rhs) ?? Int.max

        if lhsIndex != rhsIndex {
            return lhsIndex < rhsIndex
        }

        return lhs.localizedCaseInsensitiveCompare(rhs) == .orderedAscending
    }
}

private struct ReceiptPaperShape: Shape {
    private let toothSize: CGFloat = 10

    func path(in rect: CGRect) -> Path {
        var path = Path()
        let topY = toothSize
        let bottomY = rect.height - toothSize

        path.move(to: CGPoint(x: 0, y: topY))

        var x: CGFloat = 0
        while x < rect.width {
            let midX = min(x + toothSize / 2, rect.width)
            let nextX = min(x + toothSize, rect.width)
            path.addLine(to: CGPoint(x: midX, y: 0))
            path.addLine(to: CGPoint(x: nextX, y: topY))
            x += toothSize
        }

        path.addLine(to: CGPoint(x: rect.width, y: bottomY))

        x = rect.width
        while x > 0 {
            let midX = max(x - toothSize / 2, 0)
            let nextX = max(x - toothSize, 0)
            path.addLine(to: CGPoint(x: midX, y: rect.height))
            path.addLine(to: CGPoint(x: nextX, y: bottomY))
            x -= toothSize
        }

        path.closeSubpath()
        return path
    }
}

private struct ListDetailAssistantBubble: View {
    let text: String

    var body: some View {
        ListDetailAssistantFormattedText(text: text)
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(16)
            .background(Color(red: 0.96, green: 0.97, blue: 0.98))
            .clipShape(RoundedRectangle(cornerRadius: 20, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: 20, style: .continuous)
                    .stroke(Color(red: 0.88, green: 0.89, blue: 0.92), lineWidth: 1)
            )
            .shadow(color: .black.opacity(0.05), radius: 4, x: 0, y: 2)
    }
}

private struct ListDetailAssistantFormattedText: View {
    let text: String

    private var blocks: [ListDetailAssistantTextBlock] {
        ListDetailAssistantTextFormatter.blocks(from: text)
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            ForEach(Array(blocks.enumerated()), id: \.offset) { _, block in
                switch block {
                case .heading(let value):
                    Text(value)
                        .font(.system(size: 16, weight: .bold, design: .rounded))
                        .foregroundStyle(Color(red: 0.16, green: 0.21, blue: 0.29))
                        .lineSpacing(4)

                case .bullet(let value):
                    HStack(alignment: .top, spacing: 8) {
                        Text("•")
                            .font(.system(size: 15, weight: .bold, design: .rounded))
                            .foregroundStyle(Color(red: 0.12, green: 0.67, blue: 0.28))

                        Text(value)
                            .font(.system(size: 15, weight: .medium, design: .rounded))
                            .foregroundStyle(Color(red: 0.18, green: 0.22, blue: 0.30))
                            .lineSpacing(5)
                    }

                case .paragraph(let value):
                    Text(value)
                        .font(.system(size: 15, weight: .medium, design: .rounded))
                        .foregroundStyle(Color(red: 0.18, green: 0.22, blue: 0.30))
                        .lineSpacing(5)
                }
            }
        }
    }
}

private enum ListDetailAssistantTextBlock {
    case heading(AttributedString)
    case bullet(AttributedString)
    case paragraph(AttributedString)
}

private enum ListDetailAssistantTextFormatter {
    static func blocks(from rawText: String) -> [ListDetailAssistantTextBlock] {
        let normalized = rawText
            .replacingOccurrences(of: "\\n", with: "\n")
            .replacingOccurrences(of: "\r\n", with: "\n")
            .replacingOccurrences(of: "\r", with: "\n")

        let lines = normalized
            .components(separatedBy: .newlines)
            .map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }

        var result: [ListDetailAssistantTextBlock] = []
        var paragraphBuffer: [String] = []

        func flushParagraph() {
            guard !paragraphBuffer.isEmpty else { return }
            let text = paragraphBuffer.joined(separator: " ")
            result.append(.paragraph(attributed(text)))
            paragraphBuffer.removeAll()
        }

        for line in lines {
            guard !line.isEmpty else {
                flushParagraph()
                continue
            }

            if isHeading(line) {
                flushParagraph()
                result.append(.heading(attributed(line)))
                continue
            }

            if isBullet(line) {
                flushParagraph()
                result.append(.bullet(attributed(cleanBullet(line))))
                continue
            }

            paragraphBuffer.append(line)
        }

        flushParagraph()
        return result
    }

    private static func isHeading(_ line: String) -> Bool {
        line.hasPrefix("**") && line.hasSuffix("**") && line.dropFirst(2).dropLast(2).contains(where: { !$0.isWhitespace })
    }

    private static func isBullet(_ line: String) -> Bool {
        if line.hasPrefix("•") || line.hasPrefix("-") || line.hasPrefix("* ") || hasUnicodeBulletPrefix(line) {
            return true
        }

        guard line.hasPrefix("**"), let closingRange = line.range(of: "**", options: [], range: line.index(line.startIndex, offsetBy: 2)..<line.endIndex) else {
            return false
        }

        let trailing = line[closingRange.upperBound...].trimmingCharacters(in: .whitespacesAndNewlines)
        return !trailing.isEmpty
    }

    private static func cleanBullet(_ line: String) -> String {
        if line.hasPrefix("•") {
            return line.dropFirst().trimmingCharacters(in: .whitespacesAndNewlines)
        }

        if line.hasPrefix("-") {
            return line.dropFirst().trimmingCharacters(in: .whitespacesAndNewlines)
        }

        if line.hasPrefix("* ") {
            return String(line.dropFirst(2)).trimmingCharacters(in: .whitespacesAndNewlines)
        }

        if hasUnicodeBulletPrefix(line) {
            return line.dropFirst().trimmingCharacters(in: .whitespacesAndNewlines)
        }

        return line
    }

    private static func hasUnicodeBulletPrefix(_ line: String) -> Bool {
        guard let first = line.first else { return false }
        return ["・", "◦", "‣"].contains(first)
    }

    private static func attributed(_ text: String) -> AttributedString {
        if let markdown = try? AttributedString(
            markdown: text,
            options: AttributedString.MarkdownParsingOptions(
                interpretedSyntax: .inlineOnlyPreservingWhitespace,
                failurePolicy: .returnPartiallyParsedIfPossible
            )
        ) {
            return markdown
        }

        return AttributedString(text)
    }
}

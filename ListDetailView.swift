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
    @State private var selectedGrouping: ReceiptGrouping = .category
    @State private var checkedLineItems: Set<Int> = []
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
            ReceiptListCard(
                list: list,
                selectedGrouping: $selectedGrouping,
                checkedLineItems: $checkedLineItems
            )
                .padding(.horizontal, 16)
                .padding(.top, 10)
                .padding(.bottom, 40)
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

            Group {
                if msg.role == .assistant {
                    Text(markdownText(from: msg.text))
                } else {
                    Text(msg.text)
                }
            }
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

    private func markdownText(from text: String) -> AttributedString {
        if let markdown = try? AttributedString(
            markdown: text,
            options: AttributedString.MarkdownParsingOptions(
                interpretedSyntax: .full,
                failurePolicy: .returnPartiallyParsedIfPossible
            )
        ) {
            return markdown
        }

        return AttributedString(text)
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

import Foundation

@MainActor
final class ChatViewModel: ObservableObject {
    @Published var messages: [ChatMessage] = [
        .init(role: .assistant,
              text: "Hi Aashir! Welcome to Savr, your personal grocery shopping companion here in Toronto. Planning your meals for the week? Just let me know what you're craving, and I'll help you create the perfect shopping list.",
              timestamp: Date())
    ]

    @Published var draft: String = ""

    func newChat() {
        messages = [
            .init(role: .assistant,
                  text: "Hey! Tell me what you're shopping for today 🙂",
                  timestamp: Date())
        ]
    }

    func send() {
        let trimmed = draft.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return }

        messages.append(.init(role: .user, text: trimmed, timestamp: Date()))
        draft = ""

        // stub response
        messages.append(.init(role: .assistant,
                              text: "Got it. Next step: choose up to 3 stores and I'll compare prices.",
                              timestamp: Date()))
    }
}
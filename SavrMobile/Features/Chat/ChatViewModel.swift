import Foundation

@MainActor
final class ChatViewModel: ObservableObject {
    @Published var messages: [ChatMessage] = []

    @Published var draft: String = ""

    func newChat() {
        messages = []
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

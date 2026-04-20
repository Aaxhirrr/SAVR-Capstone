import Foundation

@MainActor
final class ChatViewModel: ObservableObject {
    @Published var messages: [ChatMessage] = []
    @Published var draft: String = ""
    @Published var isWaiting: Bool = false
    @Published var errorMessage: String?

    private var sessionId: String?
    private let chatService: ChatService

    init(chatService: ChatService = ChatService()) {
        self.chatService = chatService
    }

    func newChat() {
        messages = []
        sessionId = nil
        errorMessage = nil
    }

    func send() {
        let trimmed = draft.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty, !isWaiting else { return }

        messages.append(.init(role: .user, text: trimmed, timestamp: Date()))
        draft = ""
        isWaiting = true
        errorMessage = nil

        Task {
            do {
                let response = try await chatService.sendMessage(text: trimmed, sessionId: sessionId)
                sessionId = response.sessionId
                messages.append(.init(role: .assistant, text: response.botResponse, timestamp: Date()))
            } catch {
                errorMessage = error.localizedDescription
                #if DEBUG
                print("Chat error: \(error)")
                if let apiError = error as? APIError { print(apiError.debugSummary) }
                #endif
                messages.append(.init(role: .assistant, text: "Sorry, something went wrong. Please try again.", timestamp: Date()))
            }
            isWaiting = false
        }
    }
}

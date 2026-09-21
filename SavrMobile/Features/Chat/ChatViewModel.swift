import Foundation
import UIKit

@MainActor
final class ChatViewModel: ObservableObject {
    @Published var messages: [ChatMessage] = []
    @Published var draft = ""
    @Published var isWaiting = false
    @Published var errorMessage: String?
    @Published var showImagePicker = false
    @Published var imagePickerSource: UIImagePickerController.SourceType = .photoLibrary
    @Published var isProcessingImage = false
    @Published var sessions: [ChatSessionSummary] = []
    @Published var currentList: SessionListResponse?
    @Published var sessionNotice: String?
    @Published private(set) var sessionId: String?
    private let chatService: ChatService
    private var restored = false
    private var requestTask: Task<Void, Never>?
    private let activeKey = "savr.active-chat"

    init(chatService: ChatService = ChatService()) { self.chatService = chatService }

    func restore() async {
        guard !restored else { return }
        restored = true
        await refreshSessions()
        if let saved = UserDefaults.standard.string(forKey: activeKey), sessions.contains(where: { $0.id == saved }) {
            await selectSession(saved)
        }
    }
    func refreshSessions() async {
        do { sessions = try await chatService.fetchSessions().sorted { $0.updated_at > $1.updated_at } }
        catch { errorMessage = error.localizedDescription }
    }
    func selectSession(_ id: String) async {
        guard !isWaiting else { return }
        isWaiting = true
        defer { isWaiting = false }
        do {
            let history = try await chatService.fetchHistory(sessionId: id)
            messages = history
            sessionId = id
            UserDefaults.standard.set(id, forKey: activeKey)
            errorMessage = nil
            await refreshCurrentList()
        } catch { errorMessage = error.localizedDescription }
    }
    func newChat() {
        guard !isWaiting else { return }
        messages = []; sessionId = nil; currentList = nil; errorMessage = nil; sessionNotice = nil
        UserDefaults.standard.removeObject(forKey: activeKey)
    }
    func refreshCurrentList() async {
        guard let sessionId else { return }
        do { currentList = try await chatService.currentList(sessionId: sessionId) }
        catch { errorMessage = error.localizedDescription }
    }
    func finalizeList() async {
        guard let sessionId, !isWaiting else { return }
        isWaiting = true
        defer { isWaiting = false }
        do {
            _ = try await chatService.finalizeList(sessionId: sessionId)
            sessionNotice = "List saved. Open My Lists to view it."
            await refreshCurrentList()
        } catch { errorMessage = error.localizedDescription }
    }
    func detachList() async {
        guard let sessionId, !isWaiting else { return }
        isWaiting = true
        defer { isWaiting = false }
        do {
            try await chatService.detachList(sessionId: sessionId)
            currentList = nil
            sessionNotice = "List detached from this chat. Your saved list is kept."
        } catch { errorMessage = error.localizedDescription }
    }
    func send() {
        let trimmed = draft.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty, !isWaiting else { return }
        draft = ""
        sendText(trimmed)
    }
    func sendText(_ text: String, imageData: Data? = nil) {
        guard !isWaiting else { return }
        messages.append(.init(role: .user, text: text, timestamp: Date()))
        isWaiting = true
        errorMessage = nil
        sessionNotice = nil
        requestTask = Task {
            defer { isWaiting = false; isProcessingImage = false }
            do {
                let response = try await chatService.sendMessage(text: text, sessionId: sessionId, imageData: imageData)
                try Task.checkCancellation()
                sessionId = response.sessionId
                UserDefaults.standard.set(response.sessionId, forKey: activeKey)
                messages.append(.init(role: .assistant, text: response.botResponse, timestamp: Date()))
                await refreshCurrentList()
                await refreshSessions()
            } catch {
                errorMessage = error.localizedDescription
                if imageData == nil { draft = text }
            }
        }
    }
    /// Normalize orientation and bound the upload; the SAVR backend interprets the image.
    func handlePickedImage(_ image: UIImage) {
        guard !isWaiting else { return }
        let scale = min(1, 1600 / max(image.size.width, image.size.height))
        let size = CGSize(width: image.size.width * scale, height: image.size.height * scale)
        let format = UIGraphicsImageRendererFormat(); format.scale = 1
        let normalized = UIGraphicsImageRenderer(size: size, format: format).image { _ in image.draw(in: CGRect(origin: .zero, size: size)) }
        guard let data = normalized.jpegData(compressionQuality: 0.8), data.count <= 8_000_000 else {
            errorMessage = "This image could not be prepared. Try a smaller photo."; return
        }
        isProcessingImage = true
        sendText("Please identify the groceries in this photo and create a grocery list from them.", imageData: data)
    }
}

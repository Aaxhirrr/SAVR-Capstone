import Foundation
import Vision
import UIKit

@MainActor
final class ChatViewModel: ObservableObject {
    @Published var messages: [ChatMessage] = []
    @Published var draft: String = ""
    @Published var isWaiting: Bool = false
    @Published var errorMessage: String?
    @Published var showImagePicker: Bool = false
    @Published var imagePickerSource: UIImagePickerController.SourceType = .photoLibrary
    @Published var isProcessingImage: Bool = false

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
        sendText(trimmed)
        draft = ""
    }

    func sendText(_ text: String) {
        guard !isWaiting else { return }
        messages.append(.init(role: .user, text: text, timestamp: Date()))
        isWaiting = true
        errorMessage = nil

        Task {
            do {
                let response = try await chatService.sendMessage(text: text, sessionId: sessionId)
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

    /// Runs on-device OCR on the picked image, then sends extracted text to chat.
    func handlePickedImage(_ image: UIImage) {
        isProcessingImage = true
        Task {
            let extracted = await extractText(from: image)
            isProcessingImage = false
            if extracted.isEmpty {
                // No text found — ask Savr to help build a list from a description
                sendText("I took a photo of some grocery items but couldn't read the text clearly. Can you help me build a grocery list?")
            } else {
                sendText("I scanned a photo and found these items or text: \"\(extracted)\". Can you help me turn this into a grocery list or find deals on these items?")
            }
        }
    }

    private func extractText(from image: UIImage) async -> String {
        guard let cgImage = image.cgImage else { return "" }
        return await withCheckedContinuation { continuation in
            let request = VNRecognizeTextRequest { request, _ in
                let observations = request.results as? [VNRecognizedTextObservation] ?? []
                let lines = observations.compactMap { $0.topCandidates(1).first?.string }
                continuation.resume(returning: lines.joined(separator: ", "))
            }
            request.recognitionLevel = .accurate
            request.usesLanguageCorrection = true
            let handler = VNImageRequestHandler(cgImage: cgImage, options: [:])
            try? handler.perform([request])
        }
    }
}

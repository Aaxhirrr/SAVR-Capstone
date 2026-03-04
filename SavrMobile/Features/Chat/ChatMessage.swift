import Foundation

struct ChatMessage: Identifiable, Hashable {
    enum Role { case assistant, user }

    let id: UUID = UUID()
    let role: Role
    let text: String
    let timestamp: Date
}
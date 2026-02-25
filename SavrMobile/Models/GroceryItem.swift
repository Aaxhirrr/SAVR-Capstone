import Foundation

struct GroceryItem: Identifiable, Hashable {
    let id: UUID
    let name: String
    let quantity: String?

    init(id: UUID = UUID(), name: String, quantity: String? = nil) {
        self.id = id
        self.name = name
        self.quantity = quantity
    }
}
import Foundation

struct Store: Identifiable, Hashable {
    let id: UUID
    let name: String
    let city: String

    init(id: UUID = UUID(), name: String, city: String) {
        self.id = id
        self.name = name
        self.city = city
    }
}
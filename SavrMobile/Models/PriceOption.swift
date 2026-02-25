import Foundation

struct PriceOption: Identifiable, Hashable {
    let id: UUID
    let storeName: String
    let itemName: String
    let price: Double
    let unit: String?

    init(id: UUID = UUID(), storeName: String, itemName: String, price: Double, unit: String? = nil) {
        self.id = id
        self.storeName = storeName
        self.itemName = itemName
        self.price = price
        self.unit = unit
    }
}
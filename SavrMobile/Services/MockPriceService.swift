import Foundation

struct MockPriceService: PriceService {
    func compare(query: String) async throws -> [PriceOption] {
        // fake latency
        try await Task.sleep(nanoseconds: 250_000_000)

        return [
            PriceOption(storeName: "No Frills", itemName: query, price: 4.49, unit: nil),
            PriceOption(storeName: "Walmart", itemName: query, price: 4.29, unit: nil),
            PriceOption(storeName: "FreshCo", itemName: query, price: 4.79, unit: nil)
        ]
    }
}
import Foundation

protocol PriceService {
    func compare(query: String) async throws -> [PriceOption]
}
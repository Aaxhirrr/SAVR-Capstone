import Foundation

@MainActor
final class HomeViewModel: ObservableObject {
    @Published var query: String = ""
    @Published var lastSubmitted: String = ""
    @Published var showToast: Bool = false

    private let priceService: PriceService

    init(priceService: PriceService = MockPriceService()) {
        self.priceService = priceService
    }

    func submitQuery() {
        let trimmed = query.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return }

        lastSubmitted = trimmed
        query = ""

        // Placeholder “real app” hook:
        // Later: parse grocery items -> pick 3 stores -> fetch quotes -> compare UI
        Task {
            _ = try? await priceService.compare(query: trimmed)
        }

        showToast = true
        Task {
            try? await Task.sleep(nanoseconds: 1_200_000_000)
            showToast = false
        }
    }

    func openCamera() {
        // Hook this up to PhotosPicker / Vision later
        showToast = true
    }
}
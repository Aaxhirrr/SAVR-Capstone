import SwiftUI

@MainActor
final class ListsViewModel: ObservableObject {
    @Published var lists: [GroceryList] = []
    @Published var isLoading = false
    @Published var errorMessage: String?

    private let service = GroceryListService()

    func load() async {
        isLoading = true
        errorMessage = nil
        do {
            lists = try await service.fetchAllLists()
        } catch {
            errorMessage = error.localizedDescription
        }
        isLoading = false
    }

    func delete(id: String) async {
        try? await service.deleteList(id: id)
        lists.removeAll { $0.id == id }
    }
}

struct ListsView: View {
    @StateObject private var viewModel = ListsViewModel()

    var body: some View {
        ZStack {
            LinearGradient(colors: [SavrColors.bgTop, SavrColors.bgBottom],
                           startPoint: .top, endPoint: .bottom)
                .ignoresSafeArea()

            if viewModel.isLoading {
                ProgressView()
                    .scaleEffect(1.3)
            } else if viewModel.lists.isEmpty {
                emptyState
            } else {
                listContent
            }
        }
        .task { await viewModel.load() }
        .refreshable { await viewModel.load() }
    }

    // MARK: - Empty State

    private var emptyState: some View {
        VStack(spacing: 14) {
            Image(systemName: "cart")
                .font(.system(size: 48, weight: .bold))
                .foregroundStyle(SavrColors.textSecondary)

            Text("My Lists")
                .font(.system(size: 28, weight: .black, design: .rounded))

            Text("No lists yet. Chat with SAVR to build one.")
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 40)
        }
    }

    // MARK: - List Content

    private var listContent: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 0) {
                Text("My Lists")
                    .font(.system(size: 28, weight: .black, design: .rounded))
                    .padding(.horizontal, 20)
                    .padding(.top, 20)
                    .padding(.bottom, 14)

                if let error = viewModel.errorMessage {
                    Text(error)
                        .font(.footnote)
                        .foregroundStyle(.red)
                        .padding(.horizontal, 20)
                }

                LazyVStack(spacing: 14) {
                    ForEach(viewModel.lists) { list in
                        GroceryListCard(list: list) {
                            Task { await viewModel.delete(id: list.id) }
                        }
                        .padding(.horizontal, 16)
                    }
                }
                .padding(.bottom, 30)
            }
        }
    }
}

// MARK: - Card

private struct GroceryListCard: View {
    let list: GroceryList
    let onDelete: () -> Void

    @State private var expanded = false

    private var dateLabel: String {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        if let date = formatter.date(from: list.createdAt) {
            let df = DateFormatter()
            df.dateStyle = .medium
            df.timeStyle = .none
            return df.string(from: date)
        }
        return list.createdAt
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            // Header
            Button {
                withAnimation(.spring(response: 0.3)) { expanded.toggle() }
            } label: {
                HStack(alignment: .top) {
                    VStack(alignment: .leading, spacing: 4) {
                        Text(list.name)
                            .font(.system(size: 17, weight: .bold, design: .rounded))
                            .foregroundStyle(Color(red: 0.10, green: 0.30, blue: 0.16))

                        Text("\(list.items.count) item\(list.items.count == 1 ? "" : "s") · \(dateLabel)")
                            .font(.system(size: 13, weight: .medium))
                            .foregroundStyle(.secondary)
                    }

                    Spacer()

                    Image(systemName: expanded ? "chevron.up" : "chevron.down")
                        .font(.system(size: 14, weight: .semibold))
                        .foregroundStyle(.secondary)
                }
                .padding(16)
            }
            .buttonStyle(.plain)

            // Items (expandable)
            if expanded {
                Divider().padding(.horizontal, 16)

                VStack(alignment: .leading, spacing: 8) {
                    ForEach(list.items) { item in
                        HStack(spacing: 10) {
                            Image(systemName: "circle.fill")
                                .font(.system(size: 6))
                                .foregroundStyle(SavrColors.brandGreen)

                            Text(item.name)
                                .font(.system(size: 15, weight: .medium, design: .rounded))

                            Spacer()

                            if let qty = item.quantity, !qty.isEmpty {
                                Text(qty)
                                    .font(.system(size: 13))
                                    .foregroundStyle(.secondary)
                            }
                        }
                    }
                }
                .padding(.horizontal, 20)
                .padding(.vertical, 14)

                Divider().padding(.horizontal, 16)

                // Delete button
                Button(role: .destructive) {
                    onDelete()
                } label: {
                    HStack {
                        Spacer()
                        Label("Delete List", systemImage: "trash")
                            .font(.system(size: 14, weight: .semibold))
                        Spacer()
                    }
                    .padding(.vertical, 12)
                }
                .foregroundStyle(.red)
            }
        }
        .background(.white.opacity(0.85))
        .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: 18, style: .continuous)
                .stroke(Color(red: 0.88, green: 0.92, blue: 0.88), lineWidth: 1)
        )
        .shadow(color: .black.opacity(0.04), radius: 8, x: 0, y: 3)
    }
}

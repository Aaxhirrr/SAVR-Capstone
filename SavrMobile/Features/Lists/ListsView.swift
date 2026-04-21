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

    func rename(id: String, newName: String) {
        guard let index = lists.firstIndex(where: { $0.id == id }) else { return }
        let old = lists[index]
        lists[index] = GroceryList(
            id: old.id, name: newName, items: old.items, createdAt: old.createdAt,
            isActive: old.isActive, savingsAmount: old.savingsAmount,
            leastExpensiveStoreName: old.leastExpensiveStoreName,
            leastExpensiveStorePrice: old.leastExpensiveStorePrice,
            mostExpensiveStoreName: old.mostExpensiveStoreName,
            mostExpensiveStorePrice: old.mostExpensiveStorePrice,
            sessionId: old.sessionId
        )
    }
}

struct ListsView: View {
    @StateObject private var viewModel = ListsViewModel()

    // Rename sheet state
    @State private var listToRename: GroceryList?
    @State private var renameText: String = ""

    var body: some View {
        NavigationStack {
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
            .navigationDestination(for: GroceryList.self) { list in
                ListDetailView(list: list)
            }
            .sheet(item: $listToRename) { list in
                renameSheet(for: list)
            }
        }
    }

    // MARK: - Rename Sheet

    private func renameSheet(for list: GroceryList) -> some View {
        NavigationStack {
            VStack(spacing: 20) {
                TextField("List name", text: $renameText)
                    .font(.system(size: 17, design: .rounded))
                    .padding(14)
                    .background(Color(red: 0.96, green: 0.97, blue: 0.96))
                    .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
                    .padding(.horizontal, 20)
                    .padding(.top, 20)

                Spacer()
            }
            .navigationTitle("Rename List")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { listToRename = nil }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") {
                        let trimmed = renameText.trimmingCharacters(in: .whitespacesAndNewlines)
                        if !trimmed.isEmpty {
                            viewModel.rename(id: list.id, newName: trimmed)
                        }
                        listToRename = nil
                    }
                    .disabled(renameText.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
                }
            }
        }
        .presentationDetents([.height(180)])
        .presentationDragIndicator(.visible)
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
                        NavigationLink(value: list) {
                            GroceryListCard(list: list, onRename: {
                                renameText = list.name
                                listToRename = list
                            }, onDelete: {
                                Task { await viewModel.delete(id: list.id) }
                            })
                        }
                        .buttonStyle(.plain)
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
    let onRename: () -> Void
    let onDelete: () -> Void

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
        HStack(alignment: .center, spacing: 0) {
            VStack(alignment: .leading, spacing: 4) {
                Text(list.name)
                    .font(.system(size: 17, weight: .bold, design: .rounded))
                    .foregroundStyle(Color(red: 0.10, green: 0.30, blue: 0.16))
                    .multilineTextAlignment(.leading)

                Text("\(list.items.count) item\(list.items.count == 1 ? "" : "s") · \(dateLabel)")
                    .font(.system(size: 13, weight: .medium))
                    .foregroundStyle(.secondary)
            }
            .padding(16)

            Spacer()

            // 3-dot menu
            Menu {
                Button {
                    onRename()
                } label: {
                    Label("Rename", systemImage: "pencil")
                }

                Button(role: .destructive) {
                    onDelete()
                } label: {
                    Label("Delete", systemImage: "trash")
                }
            } label: {
                Image(systemName: "ellipsis")
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundStyle(Color(red: 0.55, green: 0.60, blue: 0.55))
                    .frame(width: 44, height: 44)
                    .contentShape(Rectangle())
            }
            .padding(.trailing, 6)
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

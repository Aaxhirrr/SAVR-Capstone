import SwiftUI

struct StoreSelectView: View {
    @Environment(\.dismiss) private var dismiss
    @State private var selectedStores: Set<String> = []

    private let stores = ["Walmart", "Loblaws", "No Frills", "Metro"]

    var body: some View {
        NavigationStack {
            VStack(spacing: 12) {
                Text("Select Stores")
                    .font(.system(size: 28, weight: .black, design: .rounded))

                Text("Pick up to 3 stores near you.")
                    .foregroundStyle(.secondary)

                List(stores, id: \.self) { store in
                    Button {
                        if selectedStores.contains(store) {
                            selectedStores.remove(store)
                        } else if selectedStores.count < 3 {
                            selectedStores.insert(store)
                        }
                    } label: {
                        HStack {
                            Text(store)
                            Spacer()
                            if selectedStores.contains(store) {
                                Image(systemName: "checkmark.circle.fill")
                                    .foregroundStyle(SavrColors.brandGreen)
                            }
                        }
                    }
                    .buttonStyle(.plain)
                }
                .listStyle(.insetGrouped)
            }
            .padding(20)
            .navigationTitle("")
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Close") { dismiss() }
                }
            }
        }
    }
}

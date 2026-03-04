import SwiftUI

struct StoreSelectView: View {
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            VStack(spacing: 12) {
                Text("Select Stores")
                    .font(.system(size: 28, weight: .black, design: .rounded))

                Text("Pick up to 3 stores near you (stub screen).")
                    .foregroundStyle(.secondary)

                Spacer()
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
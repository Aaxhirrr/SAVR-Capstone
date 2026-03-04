import SwiftUI

struct PreferencesView: View {
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            VStack(spacing: 12) {
                Text("Preferences")
                    .font(.system(size: 28, weight: .black, design: .rounded))

                Text("Dietary prefs (vegan/gluten-free/allergies) coming soon.")
                    .foregroundStyle(.secondary)

                Spacer()
            }
            .padding(20)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Close") { dismiss() }
                }
            }
        }
    }
}
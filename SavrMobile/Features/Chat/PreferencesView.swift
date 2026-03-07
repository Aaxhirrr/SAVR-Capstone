import SwiftUI

struct PreferencesView: View {
    @Environment(\.dismiss) private var dismiss
    @State private var isVegan = false
    @State private var isGlutenFree = false
    @State private var hasNutAllergy = false

    var body: some View {
        NavigationStack {
            VStack(spacing: 12) {
                Text("Preferences")
                    .font(.system(size: 28, weight: .black, design: .rounded))

                Text("Dietary prefs (vegan/gluten-free/allergies) coming soon.")
                    .foregroundStyle(.secondary)

                Toggle("Vegan", isOn: $isVegan)
                Toggle("Gluten-Free", isOn: $isGlutenFree)
                Toggle("Nut Allergy", isOn: $hasNutAllergy)

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

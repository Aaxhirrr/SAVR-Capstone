import SwiftUI

// Dietary preferences are handled via ProfileView(initialTab: .dietary)
// This file is kept as a placeholder to avoid breaking the project structure.
struct PreferencesView: View {
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        ProfileView(initialTab: .dietary)
    }
}

import SwiftUI

struct GetStartedView: View {
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            VStack(spacing: 16) {
                Text("Get Started")
                    .font(.system(size: 28, weight: .black, design: .rounded))

                Text("This is the onboarding placeholder.\nNext: store selection (up to 3) + preferences.")
                    .multilineTextAlignment(.center)
                    .foregroundStyle(.secondary)

                Button("Continue") { dismiss() }
                    .buttonStyle(SavrPrimaryButtonStyle())

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
import SwiftUI

struct AppShellView: View {
    @State private var selectedTab = 1

    var body: some View {
        TabView(selection: $selectedTab) {
            ListsView()
                .tabItem {
                    Label("My Lists", systemImage: "cart.fill")
                }
                .tag(0)

            ChatView()
                .tabItem {
                    Label("Chat", systemImage: "bubble.left.fill")
                }
                .tag(1)

            FlyersView()
                .tabItem {
                    Label("Flyers", systemImage: "doc.text.fill")
                }
                .tag(2)

            StoreSelectView()
                .tabItem {
                    Label("Stores", systemImage: "storefront.fill")
                }
                .tag(3)
        }
        .tint(Color(red: 0.13, green: 0.69, blue: 0.30))
    }
}

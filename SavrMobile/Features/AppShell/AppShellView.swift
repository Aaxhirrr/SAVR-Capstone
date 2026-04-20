import SwiftUI

struct AppShellView: View {
    var body: some View {
        TabView {
            ListsView()
                .tabItem {
                    Label("My Lists", systemImage: "cart.fill")
                }

            ChatView()
                .tabItem {
                    Label("Chat", systemImage: "bubble.left.fill")
                }

            FlyersView()
                .tabItem {
                    Label("Flyers", systemImage: "doc.text.fill")
                }

            StoreSelectView()
                .tabItem {
                    Label("Stores", systemImage: "storefront.fill")
                }

            ProfileView()
                .tabItem {
                    Label("Profile", systemImage: "person.circle.fill")
                }
        }
        .tint(Color(red: 0.13, green: 0.69, blue: 0.30))
    }
}

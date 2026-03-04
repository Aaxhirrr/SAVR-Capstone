import SwiftUI

struct AppShellView: View {
    enum Route: Hashable {
        case flyers
        case chat
        case lists
    }

    @State private var selection: Route? = .chat

    var body: some View {
        NavigationSplitView {
            SidebarView(selection: $selection)
        } detail: {
            switch selection ?? .chat {
            case .flyers:
                FlyersView()
            case .chat:
                ChatView()
            case .lists:
                ListsView()
            }
        }
    }
}
import SwiftUI

struct AppShellView: View {
    enum Route: Hashable {
        case chat
        case flyers
        case lists
    }

    @State private var selection: Route = .chat

    var body: some View {
        GeometryReader { proxy in
            HStack(spacing: 0) {
                SidebarView(selection: $selection)
                    .frame(width: min(132, max(110, proxy.size.width * 0.29)))

                Group {
                    switch selection {
                    case .chat:
                        ChatView()
                    case .flyers:
                        FlyersView()
                    case .lists:
                        ListsView()
                    }
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
            }
            .background(Color.white)
            .ignoresSafeArea()
        }
    }
}

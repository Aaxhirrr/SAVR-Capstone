import SwiftUI

struct StoreCoverageSection: View {
    let stores = [
        "No Frills", "Loblaws", "Metro", "Walmart", "Sobeys", "FreshCo",
        "T&T", "Food Basics", "Independent", "Real Canadian Superstore",
        "Atlantic Superstore", "Foodland", "Maxi"
    ]

    var body: some View {
        VStack(spacing: 20) {
            Text("PRICES COMPARED ACROSS CANADA'S TOP STORES")
                .font(.system(size: 14, weight: .bold, design: .rounded))
                .foregroundStyle(SavrColors.textSecondary)
                .multilineTextAlignment(.center)

            Text("SAVR checks real-time prices at over 15 major Canadian grocery retailers so you can find the lowest price near you without visiting multiple websites.")
                .font(SavrTypography.body)
                .foregroundStyle(SavrColors.textSecondary)
                .multilineTextAlignment(.center)
                .frame(maxWidth: 700)

            VStack(spacing: 18) {
                let rows = [
                    Array(stores.prefix(3)),
                    Array(stores.dropFirst(3).prefix(3)),
                    Array(stores.dropFirst(6).prefix(3)),
                    Array(stores.dropFirst(9).prefix(2)),
                    Array(stores.suffix(2))
                ]

                ForEach(0..<rows.count, id: \.self) { row in
                    HStack(spacing: 12) {
                        ForEach(rows[row], id: \.self) { store in
                            StoreChip(text: store)
                        }
                    }
                }
            }
        }
        .padding(.horizontal, 28)
        .padding(.bottom, 80)
    }
}

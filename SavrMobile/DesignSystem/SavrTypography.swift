import SwiftUI

enum SavrTypography {
    static let hero = Font.system(size: 54, weight: .black, design: .serif)
    static let section = Font.system(size: 34, weight: .black, design: .serif)
    static let cta = Font.system(size: 42, weight: .black, design: .serif)

    static let nav = Font.system(size: 16, weight: .semibold, design: .rounded)
    static let body = Font.system(size: 16, weight: .regular, design: .rounded)
    static let bodyBold = Font.system(size: 16, weight: .bold, design: .rounded)
    static let caption = Font.system(size: 13, weight: .semibold, design: .rounded)
    static let overline = Font.system(size: 14, weight: .bold, design: .rounded)

    static let heroTitle = section
    static let sectionTitle = section
    static let cardTitle = Font.system(size: 18, weight: .bold, design: .rounded)
}

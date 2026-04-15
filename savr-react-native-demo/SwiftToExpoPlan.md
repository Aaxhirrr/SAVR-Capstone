# Migration Steps Outline


1.  **Set Up Project**: Setup Expo project, and install core dependencies (already done).

2.  **Translate Models**: Convert `GroceryItem.swift`, `PriceOption.swift`, and `Store.swift` into TypeScript interfaces in `/models`.

3.  **Translate Design System**: Map all colors, fonts, and global themes from `/DesignSystem` to a centralized TS config.
 
4.  **Implement Services**: Port `AuthService.swift` and `ChatService.swift` using the fetch API.

5.  **Build Core Components**: Finish porting basic UI blocks (`SavrNavBar`, `AuthField`, `StatBar`, `InfoCard`).

6.  **Migrate Screens Iteratively**: Start with `Auth` -> `Home` -> `Chat` -> `Lists` -> `Flyers`. Use dummy data first, then wire up services.

7.  **Navigation Wiring**: Link screens together using React Navigation based on `AppShellView.swift` logic.

8.  **Testing & Optimization**: Validate layouts on both iOS and Android Simulators.

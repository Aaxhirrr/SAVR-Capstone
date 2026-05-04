<p align="center">
  <img src="SavrMobile/savr-logo.svg" alt="SAVR Logo" width="240" />
</p>

<h1 align="center">SAVR Capstone</h1>

<p align="center">
  AI-assisted grocery planning for mobile, designed to mirror the SAVR web experience.
</p>

<p align="center">
  SwiftUI iOS app • Backend-integrated core flows • Final capstone handoff repository
</p>

SAVR is an AI-assisted grocery shopping mobile experience focused on helping users build lists, compare options, browse flyer deals, and manage store preferences in a polished iOS app that mirrors the SAVR web product.

This repository now serves as the final capstone handoff for the current mobile build. It contains the SwiftUI iOS application, supporting design system code, backend service integrations, and legacy reference material used during the transformation from earlier concepts into the current product direction.

## What This Project Is

From a non-technical perspective, SAVR is a grocery planning companion:
- users can create an account and sign in
- chat with SAVR to plan shopping
- generate and revisit grocery lists
- browse flyers from saved stores
- manage store selections
- update their profile, dietary restrictions, and brand preferences

From a technical perspective, this repository contains:
- a SwiftUI iOS app
- authentication and profile integration against the SAVR backend
- chat integration against the SAVR backend
- grocery list retrieval and detail views
- flyer retrieval and add-to-list support
- store selection persistence against the backend
- a design system used to keep the mobile UI visually aligned with the SAVR web UI

## Final Status Summary

Current state of the app:
- the main signed-in app shell is implemented
- the visual design is substantially aligned with the SAVR web experience
- core flows are connected to the backend for auth, chat, lists, flyers, profile, and saved stores
- list detail UI includes a receipt-style presentation inspired by the web UI
- chat formatting and camera entry interactions have been improved for readability and usability

Important honesty note:
- the homepage query flow is still backed by `MockPriceService`
- the homepage camera action is still a placeholder
- Google sign-in / sign-up buttons are present in UI but are not connected

So this repository represents a strong and functional mobile capstone deliverable, but not a fully complete production release.

## Team

- **Aashir Javed**: backend-focused and systems-oriented development, mobile integration, auth, API work, and product implementation
- **Peter Forbes**: full-stack development support, API integration, and mobile application development
- **Alexander Wei**: UX/UI direction, visual polish, and design contribution

## Repository Layout

Primary areas of the repo:

- `SavrMobile/`
  - main iOS application source
- `SavrMobile/SavrMobile/`
  - app entry points, design system, features, models, and services
- `SavrMobile/SavrMobile/App/`
  - app-wide session and bootstrap state
- `SavrMobile/SavrMobile/Features/`
  - landing, auth, and newer organized feature modules
- `SavrMobile/`
  - also contains some top-level SwiftUI screens used by the current app shell
- `SavrMobile/SavrMobile/Services/`
  - backend-facing service layer
- `savr-react-native-demo/`
  - older/secondary demo material not used as the main iOS app entry point

Most important app files:
- [SavrMobileApp.swift](/Users/anola133/Documents/SAVR-Capstone/SavrMobile/SavrMobile/SavrMobileApp.swift)
- [RootView.swift](/Users/anola133/Documents/SAVR-Capstone/SavrMobile/SavrMobile/RootView.swift)
- [AppShellView.swift](/Users/anola133/Documents/SAVR-Capstone/SavrMobile/AppShellView.swift)
- [AppState.swift](/Users/anola133/Documents/SAVR-Capstone/SavrMobile/SavrMobile/App/AppState.swift)
- [APIClient.swift](/Users/anola133/Documents/SAVR-Capstone/SavrMobile/SavrMobile/Services/APIClient.swift)

## Product Flow

This is the intended user journey through the app:

1. The user lands on the marketing-style home page.
2. They can sign in or create an account.
3. After authentication, they enter the main tab-based app shell.
4. In Chat, they interact with SAVR to plan shopping.
5. In Lists, they revisit generated grocery lists and open a specific list.
6. Inside a specific list, they can switch between the receipt-style list and its associated chat history.
7. In Flyers, they browse store deals and add selected items to a grocery list.
8. In Stores, they choose up to three preferred stores on the map-based selection screen.
9. In Profile, they manage account details, dietary restrictions, and brand preferences.
10. The camera entry point in Chat supports capturing or selecting an image to help drive chat/list creation.

## Main Features

### 1. Landing / Home

The home page introduces SAVR as an AI-powered Canadian grocery shopping companion. It includes:
- hero section
- visual phone previews
- store coverage messaging
- sign-in and get-started entry points

Key file:
- [HomeLandingView.swift](/Users/anola133/Documents/SAVR-Capstone/SavrMobile/SavrMobile/Features/Home/HomeLandingView.swift)

Current limitation:
- the home query submission path still calls a mock price comparison service

### 2. Authentication

The app supports:
- email/password sign in
- email/password sign up
- session bootstrap on app launch
- profile fetch after authentication

Key files:
- [SignInView.swift](/Users/anola133/Documents/SAVR-Capstone/SavrMobile/SavrMobile/Features/Auth/SignInView.swift)
- [SignUpView.swift](/Users/anola133/Documents/SAVR-Capstone/SavrMobile/SignUpView.swift)
- [AuthService.swift](/Users/anola133/Documents/SAVR-Capstone/SavrMobile/SavrMobile/Services/AuthService.swift)
- [AuthTokenStore.swift](/Users/anola133/Documents/SAVR-Capstone/SavrMobile/SavrMobile/Services/AuthTokenStore.swift)

Current limitation:
- Google auth buttons are present as UI only

### 3. Chat

The chat page is the core SAVR interaction surface. It supports:
- live conversation with the SAVR backend
- persisted session-based messaging
- assistant message formatting improvements
- image capture / image library entry point

Key files:
- [ChatView.swift](/Users/anola133/Documents/SAVR-Capstone/SavrMobile/SavrMobile/Features/Chat/ChatView.swift)
- [ChatViewModel.swift](/Users/anola133/Documents/SAVR-Capstone/SavrMobile/ChatViewModel.swift)
- [ChatService.swift](/Users/anola133/Documents/SAVR-Capstone/SavrMobile/SavrMobile/Services/ChatService.swift)

### 4. Lists

The lists area supports:
- retrieving a user’s grocery lists from the backend
- deleting lists
- renaming lists locally in UI
- opening a detailed list screen

Inside each specific list:
- there is a `List` tab
- there is a `Chat` tab
- the list view is presented in a receipt-style layout inspired by the SAVR web product

Key files:
- [ListsView.swift](/Users/anola133/Documents/SAVR-Capstone/SavrMobile/ListsView.swift)
- [ListDetailView.swift](/Users/anola133/Documents/SAVR-Capstone/SavrMobile/ListDetailView.swift)
- [GroceryListService.swift](/Users/anola133/Documents/SAVR-Capstone/SavrMobile/SavrMobile/Services/GroceryListService.swift)

### 5. Flyers

The flyers area supports:
- fetching flyer deals for saved stores
- deal search
- selecting flyer items
- adding selected flyer deals to a grocery list

Key file:
- [FlyersView.swift](/Users/anola133/Documents/SAVR-Capstone/SavrMobile/FlyersView.swift)

### 6. Stores

The stores screen supports:
- map-based store browsing
- location-aware centering
- saving up to three stores
- syncing saved stores with the backend

Key file:
- [StoreSelectView.swift](/Users/anola133/Documents/SAVR-Capstone/SavrMobile/StoreSelectView.swift)

### 7. Profile

The profile area supports:
- profile fetch
- profile update
- password change
- dietary preference management
- liked/disliked brand preference management
- account deletion
- sign out

Key file:
- [ProfileView.swift](/Users/anola133/Documents/SAVR-Capstone/SavrMobile/ProfileView.swift)

## Backend Connectivity

Base API configuration:
- [APIClient.swift](/Users/anola133/Documents/SAVR-Capstone/SavrMobile/SavrMobile/Services/APIClient.swift)
- base URL: `https://savr.app/api`

Connected backend service areas:
- `auth/*`
- `chat/*`
- `grocery-lists/*`
- `flyers/*`
- `user/selected_stores`
- profile update / delete flows

Backend-connected services:
- [AuthService.swift](/Users/anola133/Documents/SAVR-Capstone/SavrMobile/SavrMobile/Services/AuthService.swift)
- [ChatService.swift](/Users/anola133/Documents/SAVR-Capstone/SavrMobile/SavrMobile/Services/ChatService.swift)
- [GroceryListService.swift](/Users/anola133/Documents/SAVR-Capstone/SavrMobile/SavrMobile/Services/GroceryListService.swift)
- `FlyerService` inside [FlyersView.swift](/Users/anola133/Documents/SAVR-Capstone/SavrMobile/FlyersView.swift)

Still mocked or partial:
- homepage price comparison uses [MockPriceService.swift](/Users/anola133/Documents/SAVR-Capstone/SavrMobile/SavrMobile/Services/MockPriceService.swift)
- homepage camera CTA is not fully implemented
- Google auth flows are not implemented

## UI / Design System

The project includes a lightweight design system to keep the app visually consistent.

Key files:
- [SavrColors.swift](/Users/anola133/Documents/SAVR-Capstone/SavrMobile/SavrMobile/DesignSystem/SavrColors.swift)
- [SavrTheme.swift](/Users/anola133/Documents/SAVR-Capstone/SavrMobile/SavrMobile/DesignSystem/SavrTheme.swift)
- [SavrTypography.swift](/Users/anola133/Documents/SAVR-Capstone/SavrMobile/SavrMobile/DesignSystem/SavrTypography.swift)
- [SavrButtonStyles.swift](/Users/anola133/Documents/SAVR-Capstone/SavrMobile/SavrMobile/DesignSystem/SavrButtonStyles.swift)
- [SavrLogoView.swift](/Users/anola133/Documents/SAVR-Capstone/SavrMobile/SavrLogoView.swift)

Visual direction:
- warm cream backgrounds
- SAVR green as the primary accent
- rounded, friendly, high-contrast SwiftUI components
- layouts and list detail styling adapted from the SAVR web experience

## Running the App

### Requirements

- macOS
- Xcode
- an iOS Simulator or physical iPhone

### Open in Xcode

1. Clone this repository.
2. Open the Xcode project for the iOS app.
3. Use the `SavrMobile` scheme.
4. Choose an iOS simulator.
5. Run the project.

If opening manually, start with the app project/workspace that contains:
- `SavrMobileApp.swift`
- `RootView.swift`

### App Entry

The runtime flow begins in:
- [SavrMobileApp.swift](/Users/anola133/Documents/SAVR-Capstone/SavrMobile/SavrMobile/SavrMobileApp.swift)

Which creates:
- `AppState`
- `RootView`

And after sign-in, users move into:
- [AppShellView.swift](/Users/anola133/Documents/SAVR-Capstone/SavrMobile/AppShellView.swift)

## How to Demo the App

Recommended demo order:

1. Open the landing page and explain SAVR’s value proposition.
2. Walk through sign up or sign in.
3. Enter the main app shell.
4. Demo Chat and show formatted assistant responses.
5. Demo Lists and open a specific list.
6. Show the receipt-style list view and the list-specific chat tab.
7. Demo Flyers and selecting deals.
8. Demo Stores and saved store selection.
9. Demo Profile editing, dietary preferences, and brand settings.
10. Show the chat camera entry point.

## Known Limitations

Current known issues or incomplete areas:
- homepage price comparison is still mock-backed
- homepage camera CTA is placeholder behavior
- Google auth is UI-only
- some project history includes older parallel files and legacy/demo material
- local git metadata in one development checkout became noisy during late-stage work, but GitHub contains the current pushed state

## GitHub / Source of Truth

For final project review, treat GitHub as the source of truth for committed deliverables.

This repository contains:
- the final capstone iOS implementation state
- the backend-connected SwiftUI screens described above
- the visual alignment work bringing the mobile UI closer to the SAVR web product

## Why This Matters

This capstone was not just a static redesign. The outcome is a functional mobile application shell with real backend connectivity across the most important user journeys:
- account access
- conversational planning
- persistent list review
- flyer browsing
- saved store management
- profile personalization

That combination of technical integration and product-level UI polish is the core value of this repository.

## Future Work

Natural next steps if this project continues:
- replace `MockPriceService` with a live backend price comparison flow for the homepage
- connect homepage camera capture to OCR/list generation
- implement Google authentication
- continue consolidating duplicate or legacy file paths into one fully normalized project structure
- expand testing coverage

## Links

- Taiga Board: https://tree.taiga.io/project/peteyjoe-savr-asu-cse-capstone/backlog

<p align="center">
  <img src="SavrMobile/savr-logo.svg" alt="SAVR Logo" width="240" />
</p>

<h1 align="center">SAVR Mobile</h1>

<p align="center">
  AI-assisted grocery planning for iPhone and Android, built on the SAVR API.<br/>
  ASU CSE Capstone handoff repository for SAVR.
</p>

## Handoff Checklist

- [x] **Project summary:** what SAVR is and how it is meant to be used ([jump](#project-summary))
- [x] **Installation and technical documentation:** prerequisites, exact versions, setup, configuration, and how to run, test, and build ([jump](#installation-and-technical-documentation))
- [x] **User guide:** main user flows, inputs and outputs, and a demo order ([jump](#user-guide))
- [x] **Support contacts** for ongoing questions ([jump](#support))
- [x] **Ownership:** repository, Expo/EAS project, signing credentials, store listings, Figma, and Taiga handed to SAVR

---

## Project Summary

SAVR is an AI grocery planning companion for shoppers in Canada. A shopper chats with SAVR to plan meals and shopping, keeps grocery lists, finds flyer deals at up to three preferred stores, compares what a full basket costs at each store, and checks items off while shopping.

This repository contains:

| Folder | What it is |
|---|---|
| [`SavrExpo/SAVR/`](SavrExpo/SAVR/) | **Main app.** One TypeScript codebase (Expo SDK 57, React Native 0.86) that runs on iOS and Android and talks to the existing SAVR API. |
| [`SavrMobile/`](SavrMobile/), `SavrMobile.xcodeproj` | Native SwiftUI iOS app, kept as a working reference. |
| [`SavrMobileTests/`](SavrMobileTests/) | XCTest suite for the native app's backend flows (27 tests). |
| [`Sprint-Deliverables/`](Sprint-Deliverables/) | QA evidence by sprint: implementation notes, bug ledgers, screenshots, recordings, test logs, and setup scripts. |
| [`savr-react-native-demo/`](savr-react-native-demo/) | Early Expo demo from Sprints 2 to 3. Reference only. |
| [`flake.nix`](flake.nix) | Reproducible dev shell with pinned Node, Java, and Android SDK. |
| [`migration_guide.txt`](migration_guide.txt) | SwiftUI to Expo component mapping. |

The Sprint 10 shopping experience improvements (shopping mode, ingredient review, chat change receipt with Undo, fair store comparison, flyer selection tray, and resume shopping) were delivered in SAVR's own iOS codebase (`savr-asu`), with a QA walkthrough in `docs/qa/ios-ux-2026-11-10/`.

## Installation and Technical Documentation

### Prerequisites

| Tool | Version | Notes |
|---|---|---|
| macOS + Xcode | Xcode 26.3, iOS 26.2 simulator | iOS builds and the SwiftUI app |
| Node.js / npm | Node 24 | Provided by `nix develop` |
| Java (OpenJDK) | 17 | Provided by `nix develop` |
| Android SDK | Platform 36, build-tools 35.0.0 and 36.0.0 | Provided by `nix develop` |
| Android NDK / CMake | 27.1.12297006 / 3.30.5 | Provided by `nix develop` |
| EAS CLI | >= 18.0.0 | `npx eas-cli@latest` |
| Nix (optional) | flakes enabled | One-command setup of everything above except Xcode |

### Run the cross-platform app (iOS and Android)

```sh
git clone https://github.com/Aaxhirrr/SAVR-Capstone.git
cd SAVR-Capstone
nix develop                     # optional: pinned toolchain
cd SavrExpo/SAVR
npm ci                          # installs the exact locked versions
cp .env.example .env.local
npx expo start                  # i = iOS simulator, a = Android emulator
```

Other commands: `npm run ios`, `npm run android`, `npm run web` (browser preview).

Photo text scanning and maps need a development build instead of Expo Go:

```sh
npx eas-cli@latest build --platform ios --profile development
npx eas-cli@latest build --platform android --profile development
npx expo start --dev-client
```

Release builds and store submission:

```sh
npx eas-cli@latest build --platform all --profile production
npx eas-cli@latest submit --platform ios
npx eas-cli@latest submit --platform android
```

### Run the native SwiftUI app (iOS)

1. Open `SavrMobile.xcodeproj` in Xcode 26.3 or later.
2. Choose the `SavrMobile` scheme and an iPhone simulator (deployment target iOS 16.0).
3. Run. Keep code signing on: sign-in uses the simulator keychain entitlement.

Or from the repository root:

```sh
bash Sprint-Deliverables/shared/scripts/run-ios.sh    # SAVR_SIMULATOR_ID picks the device
bash Sprint-Deliverables/shared/scripts/test-ios.sh   # 27 XCTest cases
```

### Configuration

| Setting | Where | Notes |
|---|---|---|
| `EXPO_PUBLIC_API_URL` | `.env.local` | Defaults to `https://savr.app/api`. Point at a test backend when testing anything that writes data. |
| `GOOGLE_MAPS_ANDROID_API_KEY` | `.env.local` or EAS environment | Restrict to `com.savr.mobile` and SAVR's signing certificate. |
| Bundle / package ID | `app.json`, Xcode project | `com.savr.mobile` on both platforms |
| Versioning | `eas.json` | Remote app version, production builds auto-increment |

No credentials or tokens are stored in this repository. Session tokens live in SecureStore on the device.

### Verify the setup

```sh
cd SavrExpo/SAVR
npm run check                   # TypeScript, lint, and regression tests
npx expo-doctor
npx expo export --platform all
npx playwright install chromium
npm run test:e2e                # browser journeys against a mocked backend
```

### Main libraries (locked versions)

| Library | Version | License |
|---|---|---|
| expo | 57.0.28 | MIT |
| react / react-dom | 19.2.3 | MIT |
| react-native | 0.86.3 | MIT |
| expo-router | 57.0.26 | MIT |
| expo-secure-store | 57.0.4 | MIT |
| @react-native-async-storage/async-storage | 2.2.0 | MIT |
| expo-image-picker | 57.0.20 | MIT |
| expo-location | 57.0.21 | MIT |
| react-native-maps | 1.27.2 | MIT |
| react-native-reanimated | 4.5.1 | MIT |
| typescript (dev) | 6.0.3 | Apache-2.0 |
| @playwright/test (dev) | 1.63.0 | Apache-2.0 |
| Google ML Kit text-recognition (Android) | 16.0.1 | Google ML Kit Terms |

Full list: [`SavrExpo/SAVR/package.json`](SavrExpo/SAVR/package.json) and `package-lock.json`.

### APIs and SDKs

- **SAVR API** (`https://savr.app/api`): `auth/*`, `chat/*`, `grocery-lists/*`, `flyers/*`, `user/selected_stores`, profile update and delete
- **Expo SDK 57** with EAS Build and Submit
- **Apple Vision** (on-device OCR) and **MapKit** on iOS
- **Google ML Kit Text Recognition 16.0.1** and **Google Maps SDK for Android**

## User Guide

| I want to... | Go to | What happens |
|---|---|---|
| Create an account and stay signed in | Sign up / Sign in | Email and password. Session is saved securely and restored on reopen. |
| Plan shopping | Chat | Ask SAVR. It replies with formatted plans and creates lists. |
| Scan a recipe or written list | Camera button in Chat | Text is read on the device and placed in the message box to edit. |
| Review my lists | Lists, then a list | Receipt-style list with rename, share, delete, and its own chat. |
| Add a recipe without duplicates | List, then Add recipe | Mark what you already have; only missing items are saved. |
| See what chat changed | Change receipt in Chat | Shows what was actually saved. Undo restores the previous list. |
| Shop in the store | List, then Start shopping | Check items off, pause, close the app, and resume later. |
| Find deals | Flyers | Search deals at saved stores, review picks in a tray, add to a list. |
| Compare stores | List, then Compare | Only complete baskets can be marked Best. |
| Choose stores | Stores | Map or list, up to three stores. |
| Manage my account | Profile | Dietary preferences, brands, password, sign out, delete account. |

**Inputs and outputs:** text messages, photos, optional location, store picks, flyer selections, and checkmarks go in. AI replies, saved grocery lists, scanned text, a store map, saved stores, and shopping progress come out. All account data is stored by the SAVR backend; sessions and shopping progress are stored on the device.

**Demo order:** sign up, pick stores, chat to create a list, add flyer deals, compare stores, start shopping.

## Support

| Name | Role | Contact for | Email |
|---|---|---|---|
| Aashir Javed (primary) | Backend and integration | Setup, API, auth, tests | anola133@asu.edu |
| Peter Forbes | Expo and release builds | Android, EAS, signing, store submissions | pqforbes@asu.edu |
| Alex Wei | UI/UX design | Figma and design system | gwei10@asu.edu |
| David D'Agostino | Sponsor, SAVR | API, backend, product decisions | david@savr.app |

To report a problem, open a GitHub issue with steps to reproduce, the device and OS version, and a screenshot.

## Links

- Taiga board: https://tree.taiga.io/project/peteyjoe-savr-asu-cse-capstone/backlog
- Figma prototype: https://www.figma.com/design/7B9cTaJyursjmfAOr74R6h/Savr-app-prototype?node-id=135-543
- Early Expo web demo: https://peteyjoe.github.io/savr-react-native-demo/

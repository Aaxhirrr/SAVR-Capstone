# SAVR for Expo

The SwiftUI application's mobile flows are implemented here in TypeScript and
React Native with Expo Router (SDK 57). The Swift project remains available as
a reference. This application uses the existing SAVR API; it does not require a
new backend.

## Run with Nix

From the repository root:

```sh
nix develop
cd SavrExpo/SAVR
npm ci
cp .env.example .env.local
npx expo start
```

The flake supplies Node 24, npm, Java 17, Android SDK 36, build-tools 35/36,
NDK 27.1, and CMake 3.30.5. Run all
Node/npm commands from that shell. To preview in a browser, use `npm run web`.
The browser preview stores its login token in memory, so a full reload signs out.
Mobile sessions use SecureStore and survive app restarts.

`EXPO_PUBLIC_API_URL` defaults to `https://savr.app/api`. Point it at a compatible
test backend when testing mutations. This URL is public configuration, not a
secret. No API credentials are included in the repository.

## Native development builds

Camera text recognition uses the local module in `modules/savr-ocr`: Apple
Vision on iOS and bundled ML Kit Latin text recognition on Android. Images are
processed on the device. The extracted text is placed in the composer for review
before the user sends it to SAVR. OCR requires a development or production build;
Expo Go can preview the other flows and shows a fallback for unavailable scanning.

Build with an authenticated Expo/EAS account from the Nix shell:

```sh
npx eas-cli@latest build --platform android --profile development
# On an iOS development team:
npx eas-cli@latest build --platform ios --profile development
npx expo start --dev-client
```

EAS will ask to link/configure an Expo project and signing credentials on first
use. Build profiles are in `eas.json`; no build or submission is performed by
starting the development server. Production builds use the `production` profile.

Local Android builds use `npx expo run:android`. Expo generates the ignored native
project. Local iOS builds require macOS and Xcode. Configure native behavior in
`app.json`, `app.config.ts`, and local modules, rather than hand-editing generated
native projects. Rebuild after changing native modules or permission settings.

Set `GOOGLE_MAPS_ANDROID_API_KEY` in `.env.local` for local builds or in the EAS
build environment. Restrict the key to `com.savr.mobile` and the appropriate
signing certificate. Android gracefully falls back to the store list without a
key. iOS uses Apple Maps. Web uses the store list. The 13 representative chain
locations and three-store limit match the Swift implementation; these are not
live nearby-store search results.

The bundle/package identifier is `com.savr.mobile`, matching the Swift project.
Confirm signing ownership before distributing an upgrade. SecureStore and
AsyncStorage do not automatically import the old Swift Keychain/UserDefaults:
users sign in again and reload server data. Preserving local-only Swift history
would require a separate one-time native data migration.

## Implemented flows

- Public SAVR landing page, email/password signup and login, session restoration,
  authenticated route protection, logout, and expired-session handling.
- Chat with formatted messages, photo capture/library OCR, editable scan results,
  waiting/error states, new conversations, and account-scoped local history.
- Grocery lists, receipt-style details, shopping checkboxes, sharing, confirmed
  deletion, and per-list conversations. Missing backend chat sessions recover
  once with list context and recent messages.
- Saved-store flyers, search, pagination, multi-deal selection, and an explicit
  target-list picker. Failed mutations are visible and do not report success.
- Store map/list selection, foreground location, saved-store removal, and the
  three-store limit.
- Profile/account details, standard/custom dietary preferences, liked/disliked
  brand dictionaries, password changes, and confirmed account deletion.

The homepage's old mock price query and unwired Google buttons are not exposed
as working features. List renaming retains the Swift app's temporary display-name
behavior and labels that limitation. Shopping checkmarks are local screen state.
The backend remains responsible for authorization and authoritative list/pricing
calculations.

## Code map

- `src/app/`: routes and protected stack/tab layouts.
- `src/features/`: home, auth, chat, lists, flyers, stores, and profile screens.
- `src/services/`: HTTP transport, API contracts, response normalization,
  session restoration, conversation recovery, and scanning.
- `src/models/`: TypeScript domain models and runtime response parsing.
- `src/state/` and `src/storage/`: account state, secure sessions, and scoped caches.
- `src/components/savr/`, `src/theme/`, `src/data/`: shared UI, design tokens,
  and store data. `assets/brand/` contains copies of the Swift app's brand assets.
- `modules/savr-ocr/`: local Expo module with Swift and Kotlin OCR implementations.

## Verify

```sh
npm run check                    # TypeScript, lint, and API/session regression tests
npx expo-doctor                   # SDK and configuration diagnostics
npx expo export --platform all    # iOS, Android, and web JS/assets
npx playwright install chromium
npm run test:e2e                  # Mocked backend, phone-width browser journeys
```

On NixOS, use a Nix-provided Chromium instead of Playwright's Linux download:

```sh
nix shell nixpkgs#chromium --command bash -c 'PLAYWRIGHT_CHROMIUM_EXECUTABLE=$(command -v chromium) npm run test:e2e'
```

Run that command from the existing `nix develop` shell. The browser tests start
Expo on port 8082 with the reserved savr.test API hostname, intercept API
traffic, and never modify a real SAVR account.
They exercise protected navigation, chat/list recovery, failed/successful
removal, flyer additions, the store limit, profile saves, and logout. Screenshots
and failure traces go to ignored `test-results/`.

A JS export is not a signed native build. Before release, test an installed iOS
and Android development build against a test account: session restoration after
restart, denied camera/location permission, OCR with rotated/handwritten images,
Android map credentials, offline/server errors, keyboard/back navigation, and
account deletion. Native behavior and production API parity require these checks
on devices; mocked browser tests cannot establish them.

Migration verification on September 29, 2026: TypeScript and lint passed, all
12 API/session tests and 4 browser journeys passed, and production JavaScript
exports succeeded for iOS, Android, and web. The Android OCR module compiled
successfully with Gradle in the Nix shell. No signed application, live-account
acceptance test, or iOS native compilation has been performed.

Implementation references: [Expo SDK 57](https://docs.expo.dev/versions/v57.0.0/),
[protected routes](https://docs.expo.dev/router/advanced/protected/),
[local modules](https://docs.expo.dev/modules/get-started/), and
[ML Kit text recognition](https://developers.google.com/ml-kit/vision/text-recognition/v2/android).

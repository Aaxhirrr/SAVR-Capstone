# Sprint 8 reproduction workflows

Run the migrated app in `SavrExpo/SAVR`, not the old Swift app or Sprint 7 backend-only demo. Use the dedicated SAVR test account; do not put credentials in screenshots, reports or Git.

## Start the app

From the repository root, run `cd SavrExpo/SAVR`, `npm ci`, then `npx expo start --go --port 8083 --max-workers 2`. Install Expo Go for SDK 57 on the iOS Simulator and Android Emulator. Open `exp://127.0.0.1:8083`; Android also needs `adb reverse tcp:8083 tcp:8083`. Full local OCR needs a development build, not Expo Go.

These are reproduction instructions, not a record that every native flow passed. See [REGRESSION-RESULTS.md](REGRESSION-RESULTS.md) for the actual outcomes and blockers.

## Repeat these flows on each platform

1. **Landing and sign-in validation.** Open SAVR, select Sign in, and submit with empty fields. Expect a readable validation message and a usable form. Enter the test account and sign in. Expect the Chat screen with navigation to lists, flyers and stores.
2. **Session restoration.** After signing in, fully terminate Expo Go and reopen the same project URL. Expect to remain signed in and be able to open lists. A temporary network failure must not erase the saved session.
3. **Chat and keyboard.** Type a short grocery question and send it. Expect a waiting indicator followed by a response. Open another tab and return. The app should remain responsive and show the conversation. Use New conversation only for this QA conversation.
4. **Lists and item details.** Open My Lists and the disposable list named Sprint 8 QA Verified. Verify items load, toggle one shopping checkbox and return to the list screen. Checkmarks are local screen state, not server persistence.
5. **Persistent rename.** Rename only the disposable QA list, e.g. Sprint 8 QA iOS or Sprint 8 QA Android. Refresh the list screen, open its details, and restart the app. Expect the new name everywhere. An unsuccessful request must keep the old name and show an error.
6. **List conversation.** Open the disposable list, switch to Conversation, and ask what is on this list. Expect a response scoped to this list. Existing conversations must carry the selected list context too.
7. **Flyers and addition.** Open Flyers, choose a saved store, search for a product, select a deal, and choose the disposable QA list. Confirm the addition, then open/refresh that list and verify the item is present. Try Next/Previous on a search with multiple result pages. Selections retain item names across pages.
8. **Stores and permission fallback.** Open Stores, inspect saved stores and the three-store limit. If testing location, deny permission and confirm the list remains usable. Android without a Google Maps key shows an explicit map-unavailable message and keeps the store list available. Do not remove the account's existing stores for this check.
9. **Profile round trip.** Note the original dietary preferences. Select Vegetarian, save, leave Profile and return, then restart and check again. Clear the test preference back to its original value and save. The success message must reflect the server response. Account address updates require street, city, province and postal code; incomplete input shows validation instead of submitting.
10. **Sign-out and protected navigation.** Open Profile → Security → Sign out → Confirm. Expect the public landing screen. Reopening a protected route must not reveal the prior account's data. Sign back in if leaving the app ready for a demo.
11. **Photo scanning availability.** In Chat, tap the photo button. Expo Go should show an understandable scanning-unavailable message and keep typed chat usable. Actual OCR extraction and physical-camera capture are separate development-build/device checks.

## Automated failure checks

Run `npm run check` inside `SavrExpo/SAVR` for typecheck, lint, and service tests. The Sprint 8 tests cover timeouts, offline transport, malformed responses, server validation errors, failed renames, profile payloads, flyer payloads, and selected-list context.

Run `npm run test:e2e` with Playwright Chromium installed. On this Mac, an alternative is `PLAYWRIGHT_CHROMIUM_EXECUTABLE='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' npm run test:e2e`. These are phone-width browser tests with a controlled backend. They do not establish native iOS/Android behavior. The failed-chat case returns HTTP 503, verifies the draft stays editable, then retries against a successful response.

## Updated API handoff

Once Peter obtains sponsor confirmation, record the exact staging URL, schema/version and changed endpoints in API-CONTRACT-AND-BLOCKERS.md. Add tests for each confirmed difference, rerun the automated suite, and repeat affected native flows. Do not treat a public OpenAPI snapshot as sponsor approval.

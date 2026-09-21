# Verified milestones

2026-09-21: The Simulator build launches and signs in using the authorized SAVR test account. The login screen initially exposed Keychain error -34018 in the unsigned build; Simulator-specific signing fixed it. Screenshot `01-live-sign-in.png` shows the signed-in chat screen.

The first XCTest run passed 24 tests covering six core areas with injected HTTP responses, including offline, timeout, malformed JSON, failed mutations, API field contracts, and cache cleanup. These are deterministic client tests, not a claim that every live workflow or Android is complete.

Live probes returned HTTP 200 for profile, sessions, list collection, stores and flyers. The live list collection uses `createdAt`, while the detail schema uses `created_at`; support for both has been added and is pending the next regression run.

Remaining work: full live interaction and recording, camera request/result, list and session persistence, expanded regression run, Android validation and final per-sprint evidence.

Live camera QA passed: imported `grocery-photo-test.jpg`, selected it through Camera > Choose from Library, received a real assistant response identifying milk, eggs and bananas, and observed a backend-linked list. Screenshot 04 and recording 02 capture the flow. The source contains no Vision OCR path. Session restart QA also passed: the same conversation reloaded after terminating and relaunching the app.

2026-09-21 follow-up: 27 targeted iOS tests passed with zero failures. Live session finalization preserves a server-side list/chat link; detach succeeds and keeps the saved list. List-specific messages explicitly identify the selected saved list because the live assistant otherwise reused an older list from conversation history. The app returned the correct Milk 1, Eggs 1 dozen, Bananas 1 bunch for Sprint 6 QA. A long-history SwiftUI scroll layout loop was reproduced and fixed by using a fixed bottom target without animated lazy layout; sending and navigating back were reverified. Screenshots 07–09 and recording 03 document the result. Renaming the QA list to Sprint 6 QA Verified persisted after process restart.

# Verified milestones

2026-09-21: The Simulator build launches and signs in using the authorized SAVR test account. The login screen initially exposed Keychain error -34018 in the unsigned build; Simulator-specific signing fixed it. Screenshot `01-live-sign-in.png` shows the signed-in chat screen.

The first XCTest run passed 24 tests covering six core areas with injected HTTP responses, including offline, timeout, malformed JSON, failed mutations, API field contracts, and cache cleanup. These are deterministic client tests, not a claim that every live workflow or Android is complete.

Live probes returned HTTP 200 for profile, sessions, list collection, stores and flyers. The live list collection uses `createdAt`, while the detail schema uses `created_at`; support for both has been added and is pending the next regression run.

Remaining work: full live interaction and recording, camera request/result, list and session persistence, expanded regression run, Android validation and final per-sprint evidence.

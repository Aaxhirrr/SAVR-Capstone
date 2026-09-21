# Sprint 6 — Aashir Javed

Source: supplied Sprint 6 backlog, User Story 1 (11 points). Scope is the four Aashir tasks; Peter's Expo migration and Alex's release assets are separate.

## Delivered work

| Task | Implementation | Verification |
|---|---|---|
| S6.1 Real camera integration | Normalize a selected/captured image and POST JPEG base64 to the documented `/chat/message` image contract, with a 90-second request budget. Removed the Apple Vision OCR route. | Actual Simulator photo-library selection sent the fixture to SAVR; response identified milk, eggs and bananas and linked a three-item list. Screenshots 04–05, recording 02. Simulator has no physical camera, so library input exercises the shared upload/result path. |
| S6.2 Backend session integration | Discover sessions, choose history, retrieve current list, save/finalize, detach, create missing list-chat sessions, and preserve list association after finalization. Persist active session ID and reload its history from the server after restart. | Screenshots 02–03 and 07–11; recordings 01 and 03. Saved list remains after detach. Selected session restores history plus correct linked list. |
| S6.3 Prototype fixes | See distinct issues below. | Live screenshots/recordings plus targeted regression tests. |
| S6.4 Test environment | Xcode test target, shared scheme, isolated URLSession protocol stubs and test token storage, setup/run scripts. | Initial 24 tests grew to 27 tests covering all six areas. Reports identify controlled tests separately from real network checks. |

## Distinct prototype issues resolved

| ID | Before → after | Evidence |
|---|---|---|
| S6-B1 | Simulator login failed to store credentials with Keychain -34018 → Simulator-specific signing permits real sign-in and restart persistence. | Screenshot 01; real signed-in relaunch in 03. |
| S6-B2 | Renaming changed local state only → PUT succeeds before updating visible list name. | Screenshot 09 after process restart; `testRenamePersistsBeforeChangingVisibleRow`, failed rename test. |
| S6-B3 | Failed list deletion removed the visible row → leave the row intact and report the error until the server succeeds. | `testFailedDeleteKeepsListVisible`; controlled test only, no pre-existing account list deleted. |
| S6-B4 | Live collection/detail date and session keys did not decode consistently → support `createdAt`/`created_at` and backend session linkage; parse timezone-less dates for display. | Both decoder regression tests; dates visible in screenshot 09. |
| S6-B5 | Saved/finalized list lost its server chat association → reattach the finalized list to the same session. | Current-list API, saved list history and screenshots 08/11; link-session contract test. |
| S6-B6 | List chat could answer about another list → link the selected list and explicitly identify its name/ID in the backend message. | Screenshot 08 shows Milk 1, Eggs 1 dozen, Bananas 1 bunch for the selected list; recording 03. |

## Session endpoint inventory

| Endpoint | Consumer | Validation |
|---|---|---|
| `POST /chat/welcome` | Create a session when a saved list has no usable chat | Screenshot 12: fresh conversation for Flyer picks correctly returns one butter-croissants item. |
| `GET /chat/sessions` | Chat menu → Chat history | Screenshot 10 and contract test. |
| `GET /chat/history/{id}` | Session selection and restart restoration | Screenshots 03/11; history test. |
| `GET /chat/session/{id}/list` | Current list strip | Screenshots 05/11; current-list test. |
| `POST /chat/session/{id}/finalize` | Save list | Live saved confirmation and server readback; finalize test. |
| `DELETE /chat/session/{id}/current_list` | Detach | Screenshot 07; saved list still visible in 09. |
| `PUT /grocery-lists/{id}` with `chat_session_id` | Preserve/restore actual list association | Link-session test and live list-context verification. |

`DELETE /chat/session/{id}/draft` is a destructive legacy draft operation, not the app's Detach contract. Detach uses `current_list` and preserves saved data. Streaming, onboarding/guest and developer-only endpoints are outside these signed-in session tasks.

## Limits

These results cover Aashir's assigned integration changes, not an App Store launch certification. A physical-camera capture and a full migrated Android product UI remain device/migration work; actual Simulator image upload and Android backend contract checks are documented separately. Model-generated list names can differ in prose; the UI reads the authoritative list name from the API.

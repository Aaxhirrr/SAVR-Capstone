# Sprint 8 defect ledger

Scope: Aashir's regression and stability work on Peter's Expo port. Imported baseline: `origin/peter-sprint-6-7` at `b70bf28`. Review branch: `codex/aashir-sprint-8-qa`; the team's main branch has not been overwritten.

| ID | Severity | Before | Fix | Verification / owner |
|---|---|---|---|---|
| S8-01 | High | Flyer additions sent deal IDs; the public API requires names and rejects the request. | Send selected item names and target list ID. Store names with selections so changing pages does not lose them. | Payload regression test and live addition/readback passed. Aashir; native retest tracked in matrix. |
| S8-02 | High | Profile preferences used unsupported snake_case keys. UI could announce success using its own draft even if the server ignored those fields. | Use current camelCase keys, parse the server's returned profile, and display/store that authoritative result. | Preference parsing, empty-value precedence, request/response tests and live round trip passed. Aashir. |
| S8-03 | High | Every profile save sent only the street, violating the full Canadian address schema; signup used postal_code. | Preserve all address fields, use postalCode, validate incomplete input, and do not present unsupported phone edits as savable. Remove stale-address fallback. | Complete/incomplete/empty address tests and live profile save passed. Aashir. |
| S8-04 | Medium | Rename was a temporary display alias; details and restarts showed the old name. | PUT the new name, update visible state only after success, and keep the rename form on failure. | Successful/failed rename tests; live server readback passed. Aashir. |
| S8-05 | High | Lists ignored chat_session_id, and an existing session's messages omitted selected-list context. | Read the published session field and include list name, ID and item context on every list-chat message. | Session parsing, context and bounded missing-session recovery tests passed. Aashir. |
| S8-06 | Medium | Account delete omitted the required confirmation request body. | Send explicit confirmation after the existing confirmation dialog; keep existing success-only sign-out behavior. | Controlled API test passed; no real account deletion performed. Aashir. |

The automated suite also covers offline transport, timeout, cancellation, malformed responses, validation errors, session expiry, and failed mutations. These are controlled tests and must not be described as live network outages.

Native verification remains open. iOS has a captured Expo Go Fabric assertion; Android has emulator responsiveness failures. Their exact causes are unconfirmed. Both are recorded with severity, owner and next steps in REGRESSION-RESULTS.md; neither is claimed as fixed. SDK 57 patch packages were aligned using Expo’s installer, and the final service/browser checks passed after alignment.

## Additional visual finding from evidence capture

S8-07 — Medium, owner Aashir, unresolved: the browser profile and sign-out screenshots show an “Unexpected text node” development warning. The service assertions and six browser journeys still passed. Next step: locate the raw string rendered outside a Text component, correct it, and rerun those flows and the native checks. See `screenshots/browser/08-profile-saved.png` and `09-signed-out.png`; no clean visual PASS is claimed for these captures.

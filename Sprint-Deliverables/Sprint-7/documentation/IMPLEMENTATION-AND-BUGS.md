# Sprint 7 — Aashir Javed

Source: supplied Sprint 7 backlog, User Story 2 (11 points). Four assigned tasks: expand six-flow coverage, compare Android/iOS responses, harden failures, and fix at least five newly surfaced issues.

## Changes and verified bugs

| ID | Defect → correction | Verification |
|---|---|---|
| S7-B1 | Flyer add used deal IDs rather than the API's item names → send `item_names` and a chosen `list_id` or `new_list_name`. | Native UI created Flyer picks containing butter croissants; screenshots 01–03, recording 01; payload test. |
| S7-B2 | Flyers stopped at the first page → fetch pages until total is reached. | Native catalog displayed Foodland 127, FreshCo 268 and Walmart 925 deals; pagination test. |
| S7-B3 | Store names could collide by substring → exact canonical brand matching, including Superstore vs Atlantic Superstore. | Exact-brand regression test; selected live stores loaded consistently. |
| S7-B4 | Profile used wrong preference keys → read/write `dietaryRestrictions` and `brandPreferences` and Canadian address fields. | Live preference save/restart/clear (screenshots 05–07); profile decode/write tests. |
| S7-B5 | An empty server preference list resurrected stale local preferences → server empty values remain authoritative and account caches clear on sign-out. | Empty-preference and sign-out tests; live clearing verified. |
| S7-B6 | Successful empty 204 responses were decoded as JSON and failed → handle empty success explicitly. | 204, account confirmation and mutation contract tests. No live password change or account deletion was needed. |
| S7-B7 | Account deletion failure could sign the user out → clear session only after server success and send required password/confirmation fields. | Failed-delete-retains-session and required-confirmation tests. Controlled tests only. |
| S7-B8 | Flyer network failures appeared to be an empty catalog → report failed chains and retain existing results for failed refreshes. | Targeted failed-refresh test. |
| S7-B9 | Offline/timeout errors exposed raw system codes → actionable messages with bounded requests; failed chat draft remains available. | Screenshots 08–11, recording 02; offline/timeout tests also verify existing data survives refresh failure. |
| S7-B10 | Long list-chat history could enter an animated lazy-layout loop on iOS 26 → fixed scroll anchor and nonanimated regular stack. | Reproduced during visual QA, then resent and navigated back successfully; Sprint 6 recording 03 captures the repaired connected flow. |

## Verification layers

1. **Deterministic iOS tests:** 27 cases exercise actual client/service/view-model code through injected HTTP responses, across authentication, chat, lists, flyers, stores and profile. No live account deletion or credential mutation.
2. **Native iOS live UI:** actual sign-in, image upload, session selection/save/detach/restart, list rename/restart, flyer pagination/addition, store loading without location permission, and profile preference save/restart/clear.
3. **Controlled failure UI:** DEBUG Simulator launch switches inject offline, timeout and malformed-response errors at the shared API boundary. These are deliberately induced conditions, not claims of a production outage or a physical network switch. Normal relaunch reverified recovery.
4. **Cross-platform live backend screen:** `/backend-qa` in the existing Expo project provides six repeatable live contract checks and sanitized result fingerprints. Run on actual iOS Simulator and Android Emulator and compare the reports. This is Aashir's testing environment, not completion of Peter's full UI migration.

Refer to `QA-FLOWS.md`, `../test-results/` and `../screenshots/` for outcomes and reproduction evidence. Changes to the production server are not included; this repository contains mobile clients, so hardening is implemented in the client integration layer.

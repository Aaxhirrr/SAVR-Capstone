# Focused verification results — 2026-09-21

| Layer | Result | Artifact |
|---|---|---|
| Native iOS client regression | 27 executed, 0 failures | `final-ios-tests.log` (Xcode reports TEST SUCCEEDED) |
| Shared QA screen TypeScript | `tsc --noEmit` exited 0 | New route and Test-tab link checked |
| Live iOS mobile contracts | 6/6 HTTP 200 | `cross-platform-ios.json` |
| Live Android mobile contracts | 6/6 HTTP 200 | `cross-platform-android.json` |
| Cross-platform field comparison | 5/5 match | `cross-platform-comparison.json` |
| Native failure UI | Offline, timeout and malformed response + successful normal recovery | Screenshots 08–11, recording 02 |

## Matched live data

| Endpoint | iOS | Android | Outcome |
|---|---|---|---|
| Sessions | 53; `573171c8` | 53; `573171c8` | Match |
| Grocery lists | 27; `5068cdb1` | 27; `5068cdb1` | Match |
| Walmart flyers page 1 | 100; `b06a0b8d` | 100; `b06a0b8d` | Match |
| Selected stores | 3; `d7f6f763` | 3; `d7f6f763` | Match |
| Profile preferences | `fb327e73` | `fb327e73` | Match |

Runs occurred at 14:09:47 UTC (iOS) and 14:15:18 UTC (Android). Counts are snapshots, not permanent expected production values. The native flyers page separately loaded every page (127 Foodland, 268 FreshCo, 925 Walmart deals). The shared six-flow screen intentionally compares one identical flyer page on both platforms.

## Final targeted test coverage

Authentication/profile contract, real image payload construction and AI request timeout, optional chat context, session discovery/history/current-list/finalize/detach, both collection/detail date schemas, server list-session linkage, successful and failed rename, failed-delete row retention, successful 204, flyer payload/new-list semantics, flyer pagination, flyer network-error classification, exact store brand matching, store mutation failure, profile mutation fields, authoritative empty preferences, account-delete failure/required confirmation, sign-out cache cleanup, malformed JSON, offline list retention, timed-out store refresh retention, expired authentication bootstrap, and readable validation errors.

These tests exercise the client implementation with controlled responses. The recordings and platform JSON reports supply separate live evidence. No unrelated feature tests were added.

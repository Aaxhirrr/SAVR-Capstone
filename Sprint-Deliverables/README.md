# Aashir's Sprint 6 and Sprint 7 delivery

This folder contains only the work assigned to Aashir Javed in the supplied backlogs: Sprint 6 User Story 1 and Sprint 7 User Story 2, four tasks each. Original documents are preserved unchanged under each sprint's `documentation/` folder.

## Start here

- [Simple before-and-after explanation: what I changed](WHAT-I-CHANGED.md)
- [Setup and simulator commands](shared/SETUP.md)
- [Sprint 6: implementation and bug ledger](Sprint-6/documentation/IMPLEMENTATION-AND-BUGS.md)
- [Sprint 6: natural-language QA walkthroughs](Sprint-6/documentation/QA-FLOWS.md)
- [Sprint 7: implementation and bug ledger](Sprint-7/documentation/IMPLEMENTATION-AND-BUGS.md)
- [Sprint 7: natural-language QA walkthroughs](Sprint-7/documentation/QA-FLOWS.md)
- [Evidence inventory](EVIDENCE.md)

## Assigned task checklist

| Task | Result | Evidence |
|---|---|---|
| S6.1 Wire real camera API and retire Vision fallback | Complete for the Simulator image-input path. Real image sent to SAVR; three groceries returned. | S6 screenshots 04–05, recording 02. |
| S6.2 Wire remaining signed-in session endpoints | Complete: discovery, history, current list, finalize, detach, restart restoration and selected-list association. | S6 screenshots 02–03, 07–11; session inventory in implementation report. |
| S6.3 Resolve at least five prototype issues | Six distinct issues documented and verified, with additional fixes in Sprint 7. | S6 bug ledger and regression results. |
| S6.4 Establish auth/chat/list tests | Complete: real Xcode test target and repeatable scripts. | Initial 24-test log; final expanded 27-test suite. |
| S7.1 Expand to six core flows across both platforms | Complete: six live contract checks on iOS and Android; native iOS interaction and deterministic coverage for all six areas. | S7 screenshots 13–14, mobile JSON reports, final XCTest log. |
| S7.2 Compare at least four backend endpoints | Complete: five matching endpoint fingerprints, same account and live data. | `cross-platform-comparison.json`: all five match. |
| S7.3 Harden failure conditions | Complete: offline, timeout and malformed response tested visually, with recovery; failed mutations and expiry covered in controlled tests. | S7 screenshots 08–11, recording 02, final test log. |
| S7.4 Fix at least five newly surfaced issues | Ten distinct issues documented, with no failures in the targeted final regression suite. | S7 bug ledger, native walkthroughs and final test report. |

## Verified results

- **27/27 targeted iOS tests passed**, zero failures, final run September 21, 2026. Tests concern the changed integrations and their failure paths.
- **6/6 live checks passed on iOS and 6/6 on Android**. Both authenticated successfully. Sessions, list contents, flyer fields, selected stores and profile preference fingerprints matched.
- Actual Simulator screenshots and screen recordings are stored by sprint. MP4s are compressed captures; no fabricated app screenshots.
- The native iOS app runs in Simulator, with working Simulator Keychain signing. Android API 35 ARM64 and SDK-matched Expo Go are installed for the shared testing environment.
- Verified milestones were pushed to branch `codex/aashir-sprints-6-7`; `main` was not overwritten.

## Scope and evidence limits

The Android work is Aashir's six-flow backend testing environment running in the existing Expo project. It does **not** represent completion of Peter's full Android screen migration. The native iOS user journeys were checked in the actual app. Simulator photo-library input exercises the real image upload path; physical camera hardware was not available.

Failure recordings use explicit DEBUG Simulator injection, and service regression tests use controlled HTTP responses. Live tests are separately labeled. Password changes, account deletion, purchases and old account-list deletion were not performed against the live account. Test profile preferences were restored to their original empty state. No credentials or tokens are included in these deliverables.

No claim is made that every feature outside Aashir's assigned sprint scope is production-certified. The source backlog documents are planning inputs; this delivery does not edit or impersonate the team's Taiga/sponsor approvals.

## Folder layout

Each sprint has `documentation/`, `screenshots/`, `recordings/` and `test-results/`. `shared/` contains repeatable scripts, setup instructions and the non-sensitive camera fixture. Large raw recordings, build products and `.xcresult` bundles remain outside Git under `/tmp/savr-sprint-work`; the useful compact evidence is committed here.

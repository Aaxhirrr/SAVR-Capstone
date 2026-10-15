# Aashir's Sprint 8 work

Scope: **User Story 1 — Aashir Javed, four tasks, 12 points.** Work and evidence recorded October 13, 2026. The original planned sprint ended October 12; these results are not backdated.

**Six app/API defects fixed; 28 service tests, 8 live API checks and 6 browser flows passed. Native acceptance is still blocked.** This is a reviewable delivery with explicit remaining work, not a claim that every simulator flow passed.

## Start here

- [Plain-English backend tests and fixes](documentation/BACKEND-TESTS-AND-FIXES.md)
- [Short before-and-after explanation](documentation/WHAT-I-CHANGED.md)
- [Natural-language reproduction flows](documentation/QA-FLOWS.md)
- [Results for each platform](documentation/REGRESSION-RESULTS.md)
- [Defects, severity and owners](documentation/IMPLEMENTATION-AND-BUGS.md)
- [API contract and dependencies](documentation/API-CONTRACT-AND-BLOCKERS.md)
- [Evidence inventory](EVIDENCE.md)
- [Original backlog](documentation/Product_Backlog_Sprint_8-1.docx)

## Assigned tasks

| Aashir's task | What is done | What remains |
|---|---|---|
| 1. Cross-platform regression | Eleven flows recorded for each platform, including explicit blocked results; setup attempted on both native runtimes. | Complete native walkthroughs after startup/runtime blockers are resolved. |
| 2. Stability fixes | Six focused defects corrected and covered by tests. SDK 57 patch dependencies aligned. | Resolve/retest native runtime failures; root cause is not yet confirmed. |
| 3. API tests | Added 16 tests; retained/updated 12 existing tests; eight live public-API checks passed. Prepared updated-contract cases. | Peter/sponsor must supply the confirmed updated contract and access before its execution can be claimed. |
| 4. Retest and document | Final 28-test suite and six browser journeys pass; live readbacks and blocker owners documented. | Native retest of high-priority fixes remains blocked on both platforms. |

Peter's existing Expo port at `b70bf28` is the baseline being tested, not work claimed by Aashir. Sponsor meetings, Peter's separately proposed API migration, Alex's UI/B2B tasks, Taiga updates and production release are outside this delivery.

All evidence is under this folder. The existing Sprint 6 and 7 evidence in the main local checkout remains unchanged.

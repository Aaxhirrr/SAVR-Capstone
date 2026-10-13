# Sprint 8 evidence

These files are actual execution outputs or unedited screenshots. Native startup evidence is labeled as such; it is not proof that the app's signed-in flows passed.

| File | What it supports |
|---|---|
| `test-results/automated-checks.log` | Final TypeScript, lint and 28 passing service tests. |
| `test-results/browser-final.log` | Final clean six-journey browser run after SDK patch alignment. Backend responses are simulated. |
| `test-results/browser-initial.log`, `browser-retest.log` | Earlier failures and subsequent retest, retained for traceability. |
| `test-results/live-api-preflight.json` | Live login/read endpoint availability, without credentials or account contents. |
| `test-results/live-client-checks.json` | Eight live checks using the Expo service classes in Node, including rename/item readbacks. |
| `test-results/observed-api-contract.json` | Selected public API schema details; explicitly not sponsor approval. |
| `test-results/ios-runtime-crash.json` | Sanitized Expo Go native crash details and stack frames. |
| `screenshots/ios/00-startup-investigation.png` | iPhone 17 Pro stuck loading the SAVR project in Expo Go. |
| `screenshots/ios/01-native-startup-blocker.png` | iPhone 16e SpringBoard during the later stalled launch attempt. |
| `screenshots/android/01-landing.png` | Actual Android SAVR landing render, with Expo's development overlay. Further interaction was blocked. |
| `screenshots/browser/01-landing.png` | Phone-width browser landing page from the final automated run. |
| `screenshots/browser/02-list-chat.png` | Browser list conversation using controlled responses. |

No complete native workflow recording was obtained. The `recordings/` note records this gap rather than presenting an idle simulator video as successful QA.

The human-readable test explanation is [BACKEND-TESTS-AND-FIXES.md](documentation/BACKEND-TESTS-AND-FIXES.md). Exact platform limitations and follow-up owners are in [REGRESSION-RESULTS.md](documentation/REGRESSION-RESULTS.md).

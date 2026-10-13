# Aashir’s Sprint 8 — backend tests and fixes

I checked how the Expo app talks to SAVR, fixed the issues below, and saved the test results. These are changes to the mobile app’s backend connection. The server itself was not changed.

## What was broken and what I fixed

**These screenshots are browser test evidence, not iOS evidence.** They use a simulated backend. The actual iOS captures show a startup blocker; no completed iOS flow is marked passed.

| Area | What was wrong before | What I changed | Test proof | Browser screenshot link |
|---|---|---|---|---|
| Adding flyer items | The app sent deal IDs, but the server needed product names. | It now sends selected product names and the right list. Names stay with selections across pages. | Request test, browser confirmation and live item readback passed. Native page-to-page selection still needs checking. | [Flyer addition confirmed](../screenshots/browser/06-flyer-added.png) |
| Saving preferences | The app used the wrong field names and could show its own draft as saved. | It now sends the right fields and uses what the server returned. Empty preferences stay empty. | Value tests and browser Vegetarian save passed. Live save preserved existing preferences. Native restart check remains open. | [Vegetarian preference saved](../screenshots/browser/08-profile-saved.png) |
| Saving addresses | Profile saves only sent the street. Signup used the wrong postal-code field. | I kept the full address and added checks for missing details. Phone editing is disabled because the API does not support it. | Complete, incomplete and empty-address tests; signup request test; live profile save passed. [Test code](../../../SavrExpo/SAVR/tests/sprint8.test.ts) | No dedicated screenshot captured. Verified by test output. |
| Renaming a list | The new name only appeared on screen and was not saved. | Rename now saves to the server. A failed request keeps the draft and shows the error. | Success/failure tests, browser refresh and live saved-name readback passed. | [Saved list name after refresh](../screenshots/browser/03-list-renamed.png) |
| Chat for a selected list | The app missed the linked session and left out list details in existing conversations. | I kept the linked session and included the list’s name, ID and items with the message. | Existing/missing-session tests and browser list-chat check passed. | [List conversation](../screenshots/browser/02-list-chat.png) |
| Account deletion request | The request was missing the required confirmation. | I added that confirmation after the existing confirmation dialog. | Simulated request test passed. **No real account was deleted.** [Test code](../../../SavrExpo/SAVR/tests/sprint8.test.ts) | No live deletion screenshot; request tested with a simulated response. |

## Results and actual success codes

| Check | Result | What the proof means | Saved proof |
|---|---|---|---|
| TypeScript, lint and service tests | **28 tests passed; command exit code 0** | The code checks and all 28 controlled service tests completed successfully. | [Full output](../test-results/automated-checks.log) · [Recorded exit code and run time](../test-results/proof-run.json) |
| Browser flows | **6 passed; command exit code 0** | The six existing screen flows passed with a simulated backend. Screenshots were taken after their checks passed. | [Full output](../test-results/browser-final.log) · [Recorded exit code and run time](../test-results/proof-run.json) |
| Live login and initial reads | **HTTP 200** | The real server successfully answered login, profile, lists, stores and flyer requests. | [Actual HTTP results](../test-results/live-api-preflight.json) |
| Live checks through the app’s service code | **8 passed** | Real API reads plus saved-name, profile and added-item checks passed. This report records PASS/FAIL, not individual HTTP codes. | [Actual live results](../test-results/live-client-checks.json) |
| Native iOS and Android walkthroughs | **Blocked** | Startup/runtime problems prevented complete native flows. These are not counted as passes. | [Platform results](REGRESSION-RESULTS.md) · [iOS crash details](../test-results/ios-runtime-crash.json) |

An exit code of **0** means the test command finished successfully. **HTTP 200** means a server request succeeded. They are different kinds of proof.

## Actual output from the latest run

Copied from the linked logs, with no result wording changed:

```text
# tests 28
# pass 28
# fail 0
# cancelled 0
# skipped 0
```

```text
  ✓  1 tests/e2e/migration.spec.ts:141:5 › landing and protected navigation work at phone width (5.7s)
  ✓  2 tests/e2e/migration.spec.ts:163:5 › Sprint 8 rename survives server refresh and detail navigation (17.0s)
  ✓  3 tests/e2e/migration.spec.ts:176:5 › Sprint 8 failed chat preserves the draft and retries successfully (5.6s)
  ✓  4 tests/e2e/migration.spec.ts:194:5 › chat, list context recovery, and failed deletion retain correct state (5.8s)
  ✓  5 tests/e2e/migration.spec.ts:248:5 › flyers add selected deals to an explicit list and stores enforce the limit (5.6s)
  ✓  6 tests/e2e/migration.spec.ts:293:5 › profile saves preferences and sign-out removes access to protected screens (3.2s)
  6 passed (50.3s)
```

The recorded exit code for each command is `0` in [proof-run.json](../test-results/proof-run.json).

## All 28 service tests

I added **16 tests** and kept or updated **12 existing tests** from the Expo port. These use controlled server responses so failures can be repeated safely.

| Test | What I checked | Result |
|---|---|---|
| Existing 1 | Login sends the email and password in the expected format. | Pass |
| Existing 2, updated | Signup sends optional details and the full address correctly. | Pass |
| Existing 3 | Signed-in requests keep the correct API address, login token and list ID. An empty successful delete response is accepted. | Pass |
| Existing 4 | A failed list delete returns an error instead of pretending it worked. | Pass |
| Existing 5 | Flyer search keeps special characters, page numbers and price text correctly. | Pass |
| Existing 6 | An expired login ends the session; a permission error does not unnecessarily sign the user out. | Pass |
| Existing 7 | Badly formatted responses and validation errors are handled clearly. | Pass |
| Existing 8 | Older response names, missing prices, brand preferences and numeric store IDs are read correctly. | Pass |
| Existing 9, updated | A missing chat session is retried once with the list and recent conversation included. | Pass |
| Existing 10 | Other chat failures do not cause repeated retries or an endless loop. | Pass |
| Existing 11 | A valid saved login is restored; temporary failures do not erase it. | Pass |
| Existing 12 | Adding flyer items requires a chosen grocery list. | Pass |
| New 1 | The app reads the current preference fields and full address. | Pass |
| New 2 | Empty current preferences do not bring back older values. | Pass |
| New 3 | Saving a profile sends the right fields and uses the server's returned profile. | Pass |
| New 4 | An incomplete address is stopped before any request is sent. | Pass |
| New 5 | An empty address and cleared preferences are sent explicitly. | Pass |
| New 6 | A list keeps its linked chat session. | Pass |
| New 7 | Renaming sends a real save request and uses the returned name. | Pass |
| New 8 | A failed rename is reported as a failure. | Pass |
| New 9 | Flyer additions send product names and the selected list ID. | Pass |
| New 10 | Account deletion includes the required confirmation. | Pass |
| New 11 | List details are included even when the chat session already exists. | Pass |
| New 12 | A simulated connection failure gives a useful retry message. | Pass |
| New 13 | A request that takes too long is cancelled and reports a timeout. | Pass |
| New 14 | Cancelling a request is treated differently from a timeout. | Pass |
| New 15 | An HTML response or an unexpected list format fails clearly. | Pass |
| New 16 | A rejected profile save leaves the user's draft available to retry. | Pass |


## Eight checks against the real backend

| # | What I did | What I checked afterward | Result |
|---|---|---|---|
| 1 | Loaded grocery lists. | The service could read the returned lists. | Pass |
| 2 | Opened the disposable QA list. | Its details and items could be read. | Pass |
| 3 | Loaded saved stores. | The service could read the returned stores. | Pass |
| 4 | Loaded flyers. | The service could read the returned flyer data. | Pass |
| 5 | Loaded the profile. | The service could read the returned profile. | Pass |
| 6 | Renamed the QA list. | Loading it again returned the saved name. | Pass |
| 7 | Saved the existing profile without changing its preferences. | The returned dietary preferences still matched. | Pass |
| 8 | Added a new item through the flyer endpoint. | Loading the QA list again showed that item. | Pass |

These checks ran in Node using the app’s actual service code. They did not run through the simulator screens. List changes were limited to a disposable QA list.

## Six browser flows — screenshot links (not iOS)

| Flow | What passed | Screenshot proof |
|---|---|---|
| Landing and signed-out protection | Public page loads; a signed-out user cannot open Profile. | [Landing](../screenshots/browser/01-landing.png) |
| List rename | The new name remains after refreshing and opening the list. | [Saved name](../screenshots/browser/03-list-renamed.png) |
| Chat error and retry | A simulated server error keeps the draft; retry then succeeds. | [Error and retained draft](../screenshots/browser/04-chat-error.png) · [Successful retry](../screenshots/browser/05-chat-retry.png) |
| List chat and deletion failure | List context is included; a failed delete keeps the list available. | [List conversation](../screenshots/browser/02-list-chat.png); deletion assertions are in the test code. |
| Flyers and store limit | A deal is sent to the chosen list; the fourth store cannot be added. | [Deal added](../screenshots/browser/06-flyer-added.png) · [Three-store limit](../screenshots/browser/07-store-limit.png) |
| Preferences and sign-out | Vegetarian saves; signing out removes access to the account screens. | [Saved preference](../screenshots/browser/08-profile-saved.png) · [Signed out](../screenshots/browser/09-signed-out.png) |

The captured profile/sign-out screens also show a development warning about an unexpected text node. The six automated assertions passed, but this warning is an unresolved visual finding; the browser screenshots are not a claim of clean visual QA.

## What still needs checking

| Item | What is still missing | Proof or next step |
|---|---|---|
| Browser rendering warning | The profile/sign-out captures show an unexpected-text-node development warning. | Aashir: trace the raw text rendered inside a View, fix it and repeat the affected browser and native checks. [Screenshot](../screenshots/browser/08-profile-saved.png) |
| Sponsor’s updated API | Only the available public API was tested. The separately proposed contract/access is still pending. | Peter and the sponsor need to confirm it; then rerun the prepared cases. [Details](API-CONTRACT-AND-BLOCKERS.md) |
| iOS visual QA | Expo Go hit a native-rendering crash/startup problem. | [iOS project loading — blocked](../screenshots/ios/00-startup-investigation.png) · [Crash report](../test-results/ios-runtime-crash.json) |
| Android visual QA | SAVR reached the landing screen, but the emulator became unresponsive. | [Android landing only — full flow blocked](../screenshots/android/01-landing.png) |
| Native persistence and pagination | Changed preferences after restart, list-chat behavior and flyer selections across pages still need complete native walkthroughs. | Follow [the reproduction guide](QA-FLOWS.md) once the runtimes are working. |
| Photo text scanning | Expo Go does not include the local scanner module. | Test it in a development build. |

## How to repeat it

| What to repeat | Command or file |
|---|---|
| All service tests, TypeScript and lint | From `SavrExpo/SAVR`, run `npm run check`. |
| Six browser flows and screenshots | Run `npm run test:e2e` with Playwright Chromium installed. The [reproduction guide](QA-FLOWS.md) includes the installed-Chrome alternative. |
| New service test code | [sprint8.test.ts](../../../SavrExpo/SAVR/tests/sprint8.test.ts) |
| Existing service test code | [services.test.ts](../../../SavrExpo/SAVR/tests/services.test.ts) |
| Browser assertions and screenshot capture | [migration.spec.ts](../../../SavrExpo/SAVR/tests/e2e/migration.spec.ts) |
| Live API checks | [verify-live.mts](../scripts/verify-live.mts), using a test token and disposable QA list. Keep credentials out of the report. |
| Native walkthroughs | [QA-FLOWS.md](QA-FLOWS.md) |

Results recorded October 13, 2026. Screenshots and logs are saved alongside this report under Sprint 8.

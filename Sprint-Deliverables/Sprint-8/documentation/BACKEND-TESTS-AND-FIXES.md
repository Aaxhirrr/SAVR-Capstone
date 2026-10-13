# What I tested and fixed — Aashir, Sprint 8

I checked how the Expo app talks to the SAVR backend. I found a few places where the app was sending the wrong information, losing information from the server, or showing a change that had not actually been saved.

These fixes are in the mobile app. I did not change the backend server itself. I added 16 focused tests and reran the 12 existing service tests. **All 28 passed.** I also ran **8 checks against the live API** and **6 browser test flows**, which passed.

## What was wrong, and what I changed

### 1. Adding flyer items to a list

**Before:** The app sent deal IDs, but the backend expected product names. That meant the request did not match what the server needed.

**What I changed:** The app now sends the names of the selected products and the list they should go into. It keeps the names with the selections when the user changes pages.

**How I checked it:** I checked the request in an automated test, tested the list picker in the browser, and added a new item to a disposable list through the live API. I then loaded that list again and confirmed the item was there. Moving selections between pages still needs a full native walkthrough.

### 2. Saving dietary and brand preferences

**Before:** The app used field names that did not match the current API. It could also show its own edited copy as “saved,” even if the server had returned something different.

**What I changed:** I corrected the field names and made the app use the profile returned by the server after saving. Clearing preferences now stays cleared instead of falling back to older values.

**How I checked it:** Tests checked the outgoing information, the server's returned values, and empty preferences. The browser test saved Vegetarian. The live check saved the account's existing preferences and confirmed they came back unchanged; it did not prove a changed preference survives a native app restart.

### 3. Address details causing profile-save problems

**Before:** Profile saves only sent the street, even though the API needs the city, province and postal code too. Signup also used the wrong name for the postal-code field.

**What I changed:** The app keeps the full address and sends it correctly. It asks for missing address details before submitting an incomplete address. I also made the phone field read-only because the current profile-update API does not support changing it.

**How I checked it:** I tested complete, incomplete and empty addresses, checked the signup request, and ran a live profile-save request.

### 4. List names not really being saved

**Before:** Renaming a list only changed the name on that screen. It did not save the new name to the backend.

**What I changed:** Rename now sends the change to the server. The screen updates after it succeeds. If it fails, the user keeps their draft and sees the error.

**How I checked it:** Tests covered successful and failed requests. The browser test renamed a list, refreshed it and opened its details. The live check renamed only the disposable QA list and loaded it again to confirm the saved name.

### 5. Chat losing the selected list's context

**Before:** The app missed the API's list-chat session field. It also left out the selected list's details when sending a message in an existing conversation.

**What I changed:** The app now reads the linked chat session and includes the list's name, ID and items when sending a list-chat message.

**How I checked it:** Tests checked both an existing session and recovery from a missing session. The browser flow checked that the list context was included. I have not marked live native conversation behavior as passed.

### 6. Account deletion missing its confirmation

**Before:** The request did not include the explicit confirmation required by the API.

**What I changed:** It now includes that confirmation after the app's existing confirmation dialog.

**How I checked it:** I used a simulated server response to inspect the request. **No real account was deleted.**

## All 28 service tests, in plain English

These tests give the app controlled server responses. That lets me check failures safely and repeat them without breaking the live service.

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

The existing tests came with the Expo port. I kept them, updated the affected cases, and added the 16 Sprint 8 tests. I am not claiming all 28 were newly written for this sprint.

## What I checked against the real backend

The supplied test account logged in successfully. I then used the app's actual service code for these eight checks:

1. Load grocery lists.
2. Open the disposable QA list and read its items.
3. Load saved stores.
4. Load flyer data.
5. Load the profile.
6. Rename the QA list and confirm the new name by loading it again.
7. Save the existing profile and confirm its dietary preferences still match.
8. Add a new item through the flyer endpoint and confirm it appears in the QA list.

**All eight passed.** These ran directly against the API using Node, not through the iPhone or Android screens. The profile check preserved the existing preferences. List changes were limited to the disposable Sprint 8 QA list.

## What the browser tests checked

All six passed in the final run: signed-out page protection; rename and refresh; keeping a chat draft after an error and retrying; list-chat recovery and failed deletion; flyer additions and the store limit; and saving preferences followed by sign-out.

These used a simulated backend. They support the screen behavior, but they do not replace simulator testing.

## What still needs checking

The sponsor-confirmed updated API has not been provided. These results cover the public API available on October 13, 2026. Peter and the sponsor still need to confirm the intended changes; I have documented the cases to rerun once that happens.

Full native visual QA is also still open. iOS hit an Expo Go native-rendering crash/startup problem. Android reached the landing screen, but the emulator became unresponsive. I saved the available evidence and recorded the blocked flows instead of calling them passes. Native OCR needs a development build as well.

## Where to find the proof or repeat the tests

- [28-test result and code checks](../test-results/automated-checks.log)
- [Eight live results](../test-results/live-client-checks.json)
- [Six browser results](../test-results/browser-final.log)
- [Step-by-step reproduction guide](QA-FLOWS.md)
- [Platform results and remaining blockers](REGRESSION-RESULTS.md)
- Test code: `SavrExpo/SAVR/tests/sprint8.test.ts` and `tests/services.test.ts`.

From `SavrExpo/SAVR`, run `npm run check` to repeat the service tests, TypeScript check and lint. Run `npm run test:e2e` for the browser flows after installing Playwright's Chromium, or use the Chrome command in the reproduction guide. The live-check script is under `Sprint-8/scripts/verify-live.mts` and needs a test token and a disposable QA list; keep both out of the report.

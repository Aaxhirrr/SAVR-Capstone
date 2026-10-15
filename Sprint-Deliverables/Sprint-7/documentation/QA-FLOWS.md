# Sprint 7 — reproduce Aashir's visual QA

Start the signed native iOS app using `shared/scripts/run-ios.sh` and sign in to the dedicated test account. Use only QA-created lists. All paths below are relative to `Sprint-Deliverables/Sprint-7`.

## 1. Flyers: complete catalog and persisted addition

Open Flyers. The account used for this run had Foodland, FreshCo and Walmart selected. Wait for the catalog; the captured run displayed 127, 268 and 925 deals, exceeding one API page. Numbers can change with live offers. Select the checkbox beside All Butter Croissants (or another visible grocery item), tap Add 1 to List, and choose Create new list. Confirm the success message. Open My Lists → Flyer picks and verify the actual saved item. The server may normalize the product name; our saved item became “butter croissants.” Screenshots 01–03 and recording 01 show this exact flow.

## 2. Stores: selected state and denied location

Open Stores. If asked for location, choose Don't Allow; saved store selections and the default map should still load. Confirm the selected count matches the server, and unselected stores are disabled when three are already selected. Screenshot 04 shows this state. The exact Superstore/Atlantic Superstore matching fix and failed-mutation preservation are tested deterministically; this run did not alter the account's existing three stores.

## 3. Profile: save, restart, clear

Open Chat → menu → Profile → Dietary. Record the original selections. On the QA account they were empty. Select Vegetarian, tap Save Preferences, and verify the success message. Restart the app, reopen Dietary and confirm Vegetarian is still selected. Clear it and save again to restore the original empty state. Reopen to confirm None remains. Screenshots 05–07 and recording 01 document save, restart persistence and clearing. Do not change the account password or delete the account for this walkthrough; those request/error contracts are covered by controlled tests.

## 4. Three controlled failures and live recovery

The following opt-in flags work only in a DEBUG iOS Simulator build. They deliberately produce errors at the API boundary. They do not disconnect the computer or alter the live service.

1. Run `bash Sprint-Deliverables/shared/scripts/qa-failure.sh offline`. In Chat, type a short list request and send. Expect a readable offline message, an enabled composer and the same text retained for retry. Screenshot 08.
2. Run the script with `timeout`. Open Stores. Expect “The request timed out. Please try again.” and no crash. Screenshot 09. Existing in-memory selections surviving a failed refresh are also covered by the automated test; a fresh process has no loaded selections yet.
3. Run it with `malformed`. Open My Lists. Expect an unreadable-response alert; dismiss it and confirm navigation remains usable. Screenshot 10.
4. Run it with `normal`. Return to My Lists and confirm live data loads and the account remains signed in. Screenshot 11.

Recording 02 captures the three induced errors and recovery. Timeouts are 30 seconds for ordinary requests and 90 seconds for AI/image requests. The timeout UI test injects the timeout immediately; it does not claim the recording waited for a real 30-second outage.

## 5. Six live checks on iOS and Android

Use the existing Expo project and the setup instructions in `shared/SETUP.md`. Open the Test tab → Aashir · Sprint 6 & 7 backend checks, or use the `/backend-qa` deep link. Enter the same dedicated test credentials and tap Run six checks. Password/token values are never written to the report; the token is kept in memory for the run and discarded afterward.

Verify six PASS cards: Authentication, Chat sessions, Grocery lists, Flyers, Stores and Profile. Confirm the 6/6 summary above the six result cards. Repeat on the other platform without editing backend data between runs. Compare the sanitized fingerprints for sessions, lists, flyers, stores and profile in `test-results/cross-platform-*.json` using `shared/scripts/compare-platform-results.py`.

These are live API contract checks running in each mobile runtime. They do not imply that every production Swift UI has been ported to Android. Peter owns that migration in both source backlogs.

## 6. Automated regression results

Run `bash Sprint-Deliverables/shared/scripts/test-ios.sh` for the 27 targeted iOS tests. The final log is `test-results/final-ios-tests.log`. TypeScript validation for the new shared QA route uses:

```sh
cd savr-react-native-demo
npx tsc --noEmit
```

Every checked item is tied to the assigned integrations, expanded six-flow coverage, or failure handling. There are no unrelated benchmarks or broad exploratory test suites in this deliverable.

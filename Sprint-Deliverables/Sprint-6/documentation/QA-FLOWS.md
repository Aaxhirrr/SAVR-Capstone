# Sprint 6 — reproduce Aashir's visual QA

Use the dedicated SAVR test account. Credentials are intentionally absent from this repository. Run all shell commands from the repository root. The evidence was captured on iPhone 17 Pro, iOS 26.2, with a signed Debug Simulator build.

## 1. Setup, sign-in and restart

Run `bash Sprint-Deliverables/shared/scripts/run-ios.sh`. Simulator opens and the app launches. Sign in with the test account. You should reach Chat. Quit and relaunch the app; you should remain signed in. Screenshot 01 is the first successful sign-in. The Simulator signing entitlement is required for Keychain storage; do not build with signing disabled.

## 2. Real text chat, list and session persistence

Open Chat, choose New chat from the top-right menu, then ask: “Create a grocery list named Sprint 6 QA with milk, one dozen eggs, and one bunch of bananas.” Wait for the real assistant response and the linked-list strip. Tap Save list. Open My Lists and confirm all three items. Terminate and relaunch the app with:

```sh
xcrun simctl terminate 142415AD-EB6B-4D56-B728-0DB3BD121A77 com.savr.mobile
xcrun simctl launch 142415AD-EB6B-4D56-B728-0DB3BD121A77 com.savr.mobile
```

The conversation should return from backend history. Open Chat history from the menu and select the recent conversation; its messages and linked list should load. Tap Detach to remove the current-list association, then check My Lists: the saved list still exists. Screenshots 02–03, 07, 10–11 and recording 01 cover these states.

## 3. Real image upload

Import the non-sensitive fixture into Simulator Photos:

```sh
xcrun simctl addmedia 142415AD-EB6B-4D56-B728-0DB3BD121A77 Sprint-Deliverables/shared/fixtures/grocery-photo-test.jpg
```

In Chat, start a new conversation. Tap Camera → Choose from Library and select the grocery fixture. Wait for the assistant to identify milk, eggs and bananas. A linked list should appear and contain those items in My Lists. This uses a real SAVR request with the JPEG image; no Apple Vision fallback. A Simulator cannot provide a physical-camera feed, so selecting from Photos verifies the common image processing/upload/result path. Screenshots 04–05 and recording 02 cover this flow.

## 4. Selected-list chat and rename persistence

Open the three-item QA list, inspect the quantities, and switch to its Chat tab. Ask “List the items and their exact quantities.” The answer should correspond to that selected list. Sending after a longer history and returning with Back should remain responsive. Screenshot 08 and recording 03 show the corrected result.

Return to My Lists, open the QA row's ellipsis/context menu, choose Rename, enter “Sprint 6 QA Verified,” and Save. Restart the app and return to My Lists. The new name should remain; screenshot 09 shows it. Only use lists created for this QA, leaving older account lists alone.

## 5. Repeat the targeted regression suite

Run `bash Sprint-Deliverables/shared/scripts/test-ios.sh`. For an isolated test Simulator, set `SAVR_SIMULATOR_ID` to the iPhone 16e ID listed in `shared/SETUP.md`. Expect 27 passing tests covering the changed integration code. Xcode creates a timestamped `.xcresult` in `/tmp`. Final results are also saved under Sprint 7 because that suite extends Sprint 6 to all six core areas.

## Screenshot/recording index

- 01: signed-in session.
- 02–03: saved list and restored chat after restart.
- 04–05: live image result and backend-linked list.
- 06: generated grocery items.
- 07: detach confirmation.
- 08: correct selected-list quantities.
- 09: persisted rename after restart.
- 10–11: discovered sessions and restored selected conversation.
- 12: fresh chat session for a list created from a flyer. Open that new list → Chat → ask what is on it; the backend creates a session and responds with the correct item.
- Recording 01: chat and session flow; 02: camera upload; 03: selected-list chat after the layout/context fixes.

Recordings are actual Simulator captures, compressed only for storage. Earlier incorrect assistant messages may remain visible in the test conversation history; screenshot 08 and the end of recording 03 show the final corrected response.

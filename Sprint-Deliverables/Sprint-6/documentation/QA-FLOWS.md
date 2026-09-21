# Sprint 6 Aashir QA flows

These flows exercise Aashir's new backend integration and prototype fixes. Use the SAVR test account supplied separately; credentials are not included in deliverables.

## S6.2 Authentication and conversation persistence

1. Run `bash Sprint-Deliverables/shared/scripts/run-ios.sh` from the repository.
2. Open Sign In and enter the test account. Expect Chat with your greeting, with no Keychain error.
3. Send: “Create a grocery list named Sprint 6 QA with milk, eggs, and bananas. Only these three items.”
4. Wait for the real assistant reply. Expect the list name above the conversation and Save list / Detach actions.
5. Tap Save list. Expect the saved confirmation. The backend may detach the current list after finalization; My Lists retains it.
6. Terminate and relaunch the app. Expect to remain signed in and the same conversation to reload from backend history.
7. Open the top-right menu, then Chat history. Select the newest conversation. Expect the same user message and response.

Evidence so far: `01-live-sign-in.png`, `02-chat-list-finalized.png`, `03-session-restored-after-relaunch.png`; recording `01-chat-and-session.mp4`.

## S6.1 Camera image backend

1. Import `shared/fixtures/grocery-photo-test.jpg` using Simulator File > Open Simulator or `xcrun simctl addmedia <device-id> <image-path>`.
2. From Chat, choose New chat in the menu.
3. Tap the camera icon, then Choose from Library. Select the grocery test image.
4. Expect an “Analyzing photo with SAVR…” state. The app uploads a normalized JPEG to `/chat/message` using `imageBase64` and `imageMediaType`. No Vision OCR is used.
5. Expect the backend to identify milk, eggs and bananas and build a list. Verify that list under My Lists.

Physical-camera capture is unavailable in iOS Simulator; the library route exercises the same image upload and backend interpretation code.

## S6.3 List persistence

1. Open My Lists and locate only the list created by this QA run.
2. Use its menu to rename it “Sprint 6 QA verified”. Save, refresh, and relaunch; the new name must persist.
3. Open the list and confirm its items.
4. Delete only a disposable list created for this run. Confirm it stays removed after refresh.

## S6.4 Automated checks

Run `bash Sprint-Deliverables/shared/scripts/test-ios.sh`. XCTest runs against injected HTTP responses; the live UI flows above provide separate real-backend evidence. See the final requirement matrix for the tests mapped to each fix.

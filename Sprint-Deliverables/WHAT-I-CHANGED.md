# Aashir — what I changed in Sprints 6 and 7

This is a simple explanation of my assigned work. The backend is SAVR's online server; the mobile app calls its API to save and retrieve data. These changes were made in the mobile apps and testing setup, not the production server.

## Sprint 6: connect the main app features properly

| Area | Before | What I changed |
|---|---|---|
| Image recognition | The image flow used a local Apple Vision fallback. | I connected the image flow to SAVR's real API. The app converts the photo to JPEG, uploads it, and displays the server's grocery results. |
| Chat sessions | Session discovery, history, saving and list links were not fully connected. | I connected these actions to the server and saved the active session ID so the app can reload the conversation after restarting. |
| Saving a chat list | Saving could remove the link between a list and its conversation. | I restored that link after saving, so the conversation can still find its list. Detaching a list keeps the saved list available. |
| Chat about a selected list | Chat could answer about a different list. | I linked the selected list to the session and included its name and ID in the request. If it has no session, the app creates one. |
| Simulator login | Login could fail because the Simulator could not save the login token in Keychain. | I fixed the Simulator signing settings so sign-in and login persistence work. |
| List editing | A rename could appear successful without being saved online. A failed delete could hide the list. | I made the app wait for server success before updating the visible list. Failed changes show an error and keep the existing data. |
| Reading list data | Different date and session field names caused inconsistent results. | I updated the app to understand the formats returned by the server. |
| Repeatable testing | There was no dedicated test setup for these integrations. | I added an Xcode test target and scripts to run the app and check the changed features. |

**Real example:** I selected a grocery photo in Simulator. SAVR returned milk, eggs and bananas. I also saved a list, restarted the app, and checked that its name and conversation were still correct.

## Sprint 7: expand coverage and handle failures

| Area | Before | What I changed |
|---|---|---|
| Adding flyer items | The app sent deal IDs, but the API expected item names. | I corrected the request and added a choice of an existing list or a new list. |
| Loading flyers | Only the first page of deals loaded. | I made the app request the remaining pages. Failed refreshes now show an error and keep previously loaded results. |
| Store matching | Similar store names could match the wrong brand. | I changed matching to use exact, normalized brand names. |
| Profile preferences | Some field names did not match the API, and cleared preferences could reappear from old local data. | I corrected the profile fields, treated empty server values as valid, and cleared account-specific cached data on sign-out. |
| Successful empty responses | The app could report failure when the server successfully returned no content. | I made it accept these empty success responses, including HTTP 204. |
| Failed account deletion | A failed deletion could still sign the user out. | I made sign-out happen only after successful deletion and included the required confirmation fields. This was tested with controlled responses. |
| Network errors | Errors could show confusing system messages. | I added readable offline and timeout messages, request time limits, and recovery handling. Failed chat messages keep the draft so it can be retried. |
| Long chat history | A scrolling/layout loop could freeze the iOS app. | I simplified the message layout and scrolling behavior, then checked sending and navigation again. |
| iOS and Android comparison | There was no shared screen to check the same backend flows on both platforms. | I added a backend QA screen in the Expo app for login, chat sessions, lists, flyers, stores and profile. It produces reports without passwords or login tokens. |

**Real example:** I added a flyer item to a new list and checked that it was saved. I also saved a dietary preference, restarted the app, confirmed it stayed saved, and then cleared it back to its original state.

## How I checked the work

1. **Used the real iOS app in Simulator:** signed in, uploaded a photo, used chat and lists, added a flyer item, loaded stores, and changed profile preferences. I saved screenshots and recordings of the flows.
2. **Ran 27 targeted automated tests:** all passed. These check the changed app code using controlled server responses, including failure cases.
3. **Ran six live backend checks on each platform:** all six passed on iOS and Android. Five endpoint reports matched across both platforms.
4. **Visually checked three deliberate failures:** offline, timeout and an unreadable server response. These were injected in the debug Simulator build; I then returned to normal mode and checked recovery.
5. **Organized the evidence and pushed the work:** each sprint has documentation, screenshots, recordings and test results. The code is on `codex/aashir-sprints-6-7` in [PR #6](https://github.com/Aaxhirrr/SAVR-Capstone/pull/6).

## What the results cover

- Android verification covers the shared backend QA screen. The full Android UI migration is Peter's separate task.
- The image upload was tested with the Simulator photo library, not a physical camera.
- Account deletion and password-related cases used controlled tests; the live account was not deleted or given a new password.

## Reproduce it or see the evidence

- [Setup and run commands](shared/SETUP.md)
- [Sprint 6 walkthrough](Sprint-6/documentation/QA-FLOWS.md)
- [Sprint 7 walkthrough](Sprint-7/documentation/QA-FLOWS.md)
- [Screenshot and recording index](EVIDENCE.md)

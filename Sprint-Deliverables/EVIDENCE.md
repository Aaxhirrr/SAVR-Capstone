# Evidence inventory

Actual Simulator/Emulator captures for Aashir’s assigned work. Source documents and reproduction steps are in each sprint’s documentation folder.

## Sprint-6

### Screenshots

- [01-live-sign-in](Sprint-6/screenshots/01-live-sign-in.png)
- [02-chat-list-finalized](Sprint-6/screenshots/02-chat-list-finalized.png)
- [03-session-restored-after-relaunch](Sprint-6/screenshots/03-session-restored-after-relaunch.png)
- [04-live-camera-backend-result](Sprint-6/screenshots/04-live-camera-backend-result.png)
- [05-camera-list-linked](Sprint-6/screenshots/05-camera-list-linked.png)
- [06-generated-list-items](Sprint-6/screenshots/06-generated-list-items.png)
- [07-session-detached-list-kept](Sprint-6/screenshots/07-session-detached-list-kept.png)
- [08-selected-list-chat-correct-quantities](Sprint-6/screenshots/08-selected-list-chat-correct-quantities.png)
- [09-rename-persisted-after-restart](Sprint-6/screenshots/09-rename-persisted-after-restart.png)
- [10-backend-session-discovery](Sprint-6/screenshots/10-backend-session-discovery.png)
- [11-session-selected-with-linked-list](Sprint-6/screenshots/11-session-selected-with-linked-list.png)
- [12-fresh-session-for-saved-list](Sprint-6/screenshots/12-fresh-session-for-saved-list.png)

### Screen recordings

- [01-chat-and-session](Sprint-6/recordings/01-chat-and-session.mp4) — 0.98 MB
- [02-camera-backend](Sprint-6/recordings/02-camera-backend.mp4) — 0.82 MB
- [03-selected-list-chat](Sprint-6/recordings/03-selected-list-chat.mp4) — 0.78 MB

### Test results

- [initial-24-tests.log](Sprint-6/test-results/initial-24-tests.log)

## Sprint-7

### Screenshots

- [01-flyer-list-picker](Sprint-7/screenshots/01-flyer-list-picker.png)
- [02-flyer-add-success](Sprint-7/screenshots/02-flyer-add-success.png)
- [03-flyer-item-persisted](Sprint-7/screenshots/03-flyer-item-persisted.png)
- [04-stores-permission-denied-fallback](Sprint-7/screenshots/04-stores-permission-denied-fallback.png)
- [05-profile-preference-saved](Sprint-7/screenshots/05-profile-preference-saved.png)
- [06-profile-persisted-after-restart](Sprint-7/screenshots/06-profile-persisted-after-restart.png)
- [07-profile-preferences-cleared](Sprint-7/screenshots/07-profile-preferences-cleared.png)
- [08-offline-draft-retained](Sprint-7/screenshots/08-offline-draft-retained.png)
- [09-store-timeout-message](Sprint-7/screenshots/09-store-timeout-message.png)
- [10-malformed-response-message](Sprint-7/screenshots/10-malformed-response-message.png)
- [11-live-recovery-after-failures](Sprint-7/screenshots/11-live-recovery-after-failures.png)
- [12-ios-live-contract-results](Sprint-7/screenshots/12-ios-live-contract-results.png)
- [13-ios-six-flows-passed](Sprint-7/screenshots/13-ios-six-flows-passed.png)
- [14-android-six-flows-passed](Sprint-7/screenshots/14-android-six-flows-passed.png)

### Screen recordings

- [01-flyers-stores-profile](Sprint-7/recordings/01-flyers-stores-profile.mp4) — 1.80 MB
- [02-controlled-failures-and-recovery](Sprint-7/recordings/02-controlled-failures-and-recovery.mp4) — 1.16 MB
- [03-ios-six-flow-results](Sprint-7/recordings/03-ios-six-flow-results.mp4) — 0.28 MB
- [04-android-six-live-checks](Sprint-7/recordings/04-android-six-live-checks.mp4) — 0.14 MB

### Test results

- [27-targeted-ios-tests.log](Sprint-7/test-results/27-targeted-ios-tests.log)
- [RESULTS.md](Sprint-7/test-results/RESULTS.md)
- [cross-platform-android.json](Sprint-7/test-results/cross-platform-android.json)
- [cross-platform-comparison.json](Sprint-7/test-results/cross-platform-comparison.json)
- [cross-platform-ios.json](Sprint-7/test-results/cross-platform-ios.json)
- [final-ios-tests.log](Sprint-7/test-results/final-ios-tests.log)
- [live-endpoint-probes.json](Sprint-7/test-results/live-endpoint-probes.json)
- [typescript-check.log](Sprint-7/test-results/typescript-check.log)

## Reading the evidence

- Native iOS flows: Sprint 6 recordings 01–03 and Sprint 7 recording 01.
- Controlled offline/timeout/malformed response and recovery: Sprint 7 recording 02.
- Live shared mobile API results: Sprint 7 recordings 03–04 and screenshots 13–14.
- The iOS API-results clip includes the compact layout update with real completed results retained; it is a result-screen capture. The Android clip captures execution and results.
- All seven MP4s were probed successfully for video streams and positive duration. No password or token is embedded in source/report text.

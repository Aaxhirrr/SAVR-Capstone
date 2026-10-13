# Sprint 8 regression results

Recorded October 13, 2026 against the Expo port in `SavrExpo/SAVR`. PASS means the named check actually completed; BLOCKED means the full flow could not be exercised. A rendered landing page alone is not a successful login or a complete regression pass.

## Native platform matrix

iOS: iPhone 17 Pro and iPhone 16e simulators, iOS 26.2, SDK-matched Expo Go 57.0.9. Android: SAVR_QA_API35 ARM64 emulator, Expo Go 57.0.9. Only one native platform was kept running during later recovery attempts.

| Core flow | iOS result and note | Android result and note | API dependency |
|---|---|---|---|
| Landing and empty sign-in validation | **BLOCKED:** project loading stalled; native Expo Go crash also recorded. | **BLOCKED:** landing rendered, but sign-in interaction did not complete reliably. | Landing/empty validation do not need the API. |
| Live login and signed-in navigation | **BLOCKED:** N1 prevented entry. | **BLOCKED:** N2 prevented entry. | Current login succeeded separately through HTTP; native path unverified. |
| Session restoration after restart | **BLOCKED:** no completed native login to restore. | **BLOCKED:** no completed native login to restore. | Current profile API; controlled bootstrap tests passed. |
| Chat, keyboard and navigation | **BLOCKED:** N1. | **BLOCKED:** N2. | Current chat endpoint; browser retry behavior passed with simulated responses. |
| Grocery lists and item checkbox | **BLOCKED:** N1. | **BLOCKED:** N2. | Current list endpoints; live reads and browser checkbox passed separately. |
| Persistent list rename | **BLOCKED:** N1; native high-priority retest remains open. | **BLOCKED:** N2; native retest remains open. | Current PUT/GET endpoints; live readback and browser refresh passed. |
| Selected-list conversation | **BLOCKED:** N1. | **BLOCKED:** N2. | Current session/context contract; controlled service/browser tests passed. |
| Flyers, search, pagination and addition | **BLOCKED:** N1. | **BLOCKED:** N2. | Live read/add/readback passed separately; native pagination/selection unverified. |
| Stores and denied-location fallback | **BLOCKED:** N1. | **BLOCKED:** N2; map-key dependency also recorded. | Current stores API works separately; native permission fallback unverified. |
| Profile save and restart persistence | **BLOCKED:** N1. | **BLOCKED:** N2. | Live unchanged-profile round trip passed; changed native preference persistence unverified. |
| Sign-out and protected navigation | **BLOCKED:** N1. | **BLOCKED:** N2. | Mostly local session state; browser protection passed separately. |

All eleven flows have recorded results on each platform, but none is claimed as a complete native PASS. The backlog permits documented blocked results; that does not establish crash-free normal use.

## Unresolved defects and next steps

| ID | Severity / owner | Observed evidence | Next step |
|---|---|---|---|
| N1 | High; Aashir owns QA investigation, Peter supports the native runtime/build | Expo Go crash report shows `EXC_BREAKPOINT` in `ExpoFabricView.injectInitializer`; project-loading screenshot and later SpringBoard screenshot saved. Simulator open/launch commands also stalled. | Reproduce on a responsive SDK 57-compatible simulator/development build; capture the assertion's full message, isolate the failing native view, then rerun all eleven iOS flows. SDK patch alignment passed checks but did not establish a native fix. |
| N2 | High QA blocker; Aashir | Android first showed System UI not responding. Cold boot reached SAVR's landing screen; taps and ADB commands later stalled. A software-renderer attempt failed to initialize its graphics libraries. | Use a responsive API 35 emulator or device, retest Expo Go without stale snapshots, then rerun all eleven Android flows. Do not attribute the OS/emulator freeze to SAVR without a reproducible app-level trace. |
| N3 | Blocked native feature; Peter supplies build, Aashir retests | Expo Go does not include local `SavrOcr`; no signed development build available. | Produce a development build on a compatible build host and test scanning plus unavailable/denied-permission states. |
| API-1 | External dependency; Peter and sponsor | The backlog says the updated API and approval are pending. Only the public API was available for this work. | Confirm environment, changed schemas/auth, and access; run the prepared tests and affected native flows. |

An Android log inspection also surfaced an `EventEmitter`/app-registration startup error during investigation. Later the landing page rendered. That observation alone does not establish a persistent app defect or prove that dependency alignment fixed it. The native root cause remains unconfirmed.

## Checks that completed

- TypeScript and lint: PASS.
- Targeted service tests: **28/28 PASS**, including 16 added Sprint 8 cases.
- Actual Expo service classes against the public API: **8/8 PASS** in Node. No native UI claim.
- Final phone-width browser run: **6/6 PASS**, using controlled backend responses. Initial cold-start timeout and hidden-element selector issue were corrected/retested; initial logs are retained.
- SDK compatibility check after `expo install --fix`: PASS; Expo now 57.0.28 with SDK-compatible patch packages.

No live password change, account deletion, or deletion of existing account lists was performed. Live writes were the disposable QA list rename/item addition and a profile save preserving existing values.

Follow [QA-FLOWS.md](QA-FLOWS.md) for each native retest. Replace a BLOCKED result only after the complete flow succeeds and its evidence is saved.

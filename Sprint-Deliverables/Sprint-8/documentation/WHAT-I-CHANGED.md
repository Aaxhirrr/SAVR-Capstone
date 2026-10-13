# Aashir's Sprint 8 changes in simple language

I brought in the team's ported Expo app and checked its integration with SAVR's available backend.

- **Flyer items:** Before, the app sent deal IDs and the server expected product names. I changed the request and kept the selected names available when moving between pages.
- **Profile preferences:** Before, the app used the wrong field names and could show a saved message using only the local draft. I corrected the fields and made the screen use the profile actually returned by the server.
- **Addresses:** Before, saving a profile sent an incomplete address. I kept the full address and added clear validation for missing fields.
- **List names:** Before, renaming only changed the display until the app closed. I connected renaming to the server and made failed saves keep the old name.
- **List chat:** Before, the app missed the backend session field and could lose the selected list context. I corrected the field and included the selected list's details in its messages.
- **Account deletion request:** I added the confirmation field required by the public API. I tested this with a controlled response; I did not delete the real account.
- **Regression tests:** I added focused tests for the fixes, connection failures, timeouts, malformed responses and retries. The 28 service tests passed, and eight checks using the real Expo service code passed against the live backend.

Simulator and browser outcomes are recorded separately in the regression results. Passing service tests does not mean every native screen was visually verified. A separate sponsor-confirmed API contract and native OCR build remain dependencies.

# API observations and remaining dependencies

Observed October 13, 2026: the public endpoint `https://savr.app/api/openapi.json` is reachable and identifies itself as Savr API 1.0.0. The supplied test login works. Relevant schema excerpts are preserved in `../test-results/observed-api-contract.json`.

## Verified public-contract corrections

| Contract | Expo port before | Correction and focused test |
|---|---|---|
| FlyerAddToListRequest | `deal_ids` | Send `item_names` and the chosen `list_id`; retain names across selected pages. |
| UserUpdate and UserResponse | snake_case preferences | Read/write `dietaryRestrictions` and `brandPreferences`; empty current values win over legacy aliases. |
| CanadianAddress | Street alone, or `postal_code` | Preserve street/city/province/postalCode/phoneNumber; validate partial address before submission. |
| GroceryListResponse | `session_id` only | Read `chat_session_id` and retain the legacy alias for compatibility. |
| GroceryListUpdate | Temporary local rename | PUT the name, update the screen only after success, and use the returned list. |
| AccountDeleteRequest | No body | Send `confirmationText: DELETE` after the existing confirmation UI. Checked with controlled responses only; no real account deletion. |

## Sponsor-confirmed changes are still pending

**Owner: Peter Forbes, with sponsor David D’Agostino.** The backlog states that access and clarification are pending. No later sponsor-approved contract was found in the repository or supplied files. Public API availability does not prove access to that separate proposed API.

Next steps for the owner: obtain the intended API base URL/environment, an explicit endpoint/schema change list, authentication requirements, permitted test data, and confirmation of which changes apply to this sprint. Record the meeting decision and link the agreed contract. Aashir can then run the prepared cases against that environment.

Prepared checks for each confirmed change: successful request/response parsing; missing or nullable fields; malformed JSON; HTTP 401/403/422/500; offline and timeout; retry without duplicate mutations; persistence after restart; and the same affected screen flow on both platforms. Existing tests are a baseline, not a claim that unspecified changes are covered.

## Native build dependencies

**Local OCR and physical camera — owner Peter Forbes; QA owner Aashir.** Expo Go does not contain the repository's SavrOcr native module. Its safe unavailable state can be checked; OCR extraction requires a development build and camera hardware requires a device. The installed Xcode is 26.3, while SDK 57's documentation lists Xcode 26.4+ for native builds. Use a matching build host or an authorized EAS development build before those tests.

**Android map tiles — owner Peter Forbes.** A configured Google Maps key is required for map tiles in the native build. Store-list fallback can be tested without the key. A key was not invented or obtained from unrelated projects.

No sponsor meeting, Taiga update, B2B approval or production release is implied by this delivery.

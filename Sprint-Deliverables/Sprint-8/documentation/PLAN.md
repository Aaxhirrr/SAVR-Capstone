# Aashir Sprint 8 work plan

Scope: User Story 1, four assigned tasks, 12 points. Source backlog preserved alongside this file. Actual execution begins October 13, 2026, after the planned September 28–October 12 sprint window; evidence is not backdated.

1. Integrate Peter's screen-port branch into an isolated sprint branch and run its baseline checks.
2. Regress at least eight real Expo flows on iOS and Android: landing/auth validation, live login, session restart, chat, list browsing/details, list editing, flyers/search/addition, stores, profile persistence, and sign-out/protection. Record PASS/FAIL/BLOCKED with evidence.
3. Fix reproducible stability and integration defects in those flows. Add focused regression tests for each fix and network/error handling.
4. Retest the fixes on both platforms, save screenshots/recordings and results, write natural-language reproduction steps and plain-language changes, then push a reviewable PR.

API distinction: https://savr.app/api/openapi.json is reachable. It is observed public documentation, not evidence of sponsor approval or access to a separately proposed API. Prepare a contract-change checklist and record the sponsor-confirmation dependency with Peter as follow-up owner. Do not invent sponsor decisions.

Native scope: SDK 57 Expo app in SavrExpo/SAVR. Use matching Expo Go for normal screens; local OCR requires a development build and must be labeled blocked if unavailable. No production deployment or account deletion is needed.

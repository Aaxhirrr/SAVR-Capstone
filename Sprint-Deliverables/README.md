# Aashir's Sprint 6 and Sprint 7 delivery

Scope: Aashir Javed's assignments in the supplied sprint backlogs. Source documents describe requirements and prior status; completion here requires fresh implementation and evidence.

## Plan and acceptance checklist

### Sprint 6
- [ ] S6.1 Integrate camera images with the documented SAVR backend; remove Vision from the successful image path. Verify real image input and result, or document unavailable endpoint.
- [ ] S6.2 Wire session discovery, history, current list, finalization and detach; verify restart persistence.
- [ ] S6.3 Fix and re-verify at least five prototype issues.
- [ ] S6.4 Provide repeatable automated auth/chat/list tests and results.

### Sprint 7
- [ ] S7.1 Expand tests to flyers, stores and profile (six core flows).
- [ ] S7.2 Compare at least four real backend endpoints on iOS and Android. Requires Peter's runnable Android app; a desktop request or fixture is not Android evidence.
- [ ] S7.3 Harden timeouts, malformed responses, offline behavior, authentication expiry and failed mutations. Verify at least three failure scenarios.
- [ ] S7.4 Fix and verify at least five additional issues; rerun the core suite.

## Execution order

1. Preserve existing work and inspect backend OpenAPI and available platform builds.
2. Implement documented integrations and fixes.
3. Add repeatable tests; build the app.
4. Install and run in Simulator; interact with every core flow and inspect screenshots.
5. Save per-sprint results, bug ledger, screenshots and natural-language reproduction steps.

## Folder guide

- `Sprint-6/documentation/`: source backlog, implementation report and QA flows.
- `Sprint-6/screenshots/`: actual Simulator evidence for Sprint 6.
- `Sprint-6/test-results/`: repeatable checks and build results.
- `Sprint-7/`: corresponding expanded coverage and hardening evidence.
- `shared/scripts/`: setup and test commands.
- `shared/fixtures/`: non-sensitive repeatable test input.

Live production checks, local deterministic tests, and unavailable dependencies will be identified separately. Credentials are kept outside this repository.

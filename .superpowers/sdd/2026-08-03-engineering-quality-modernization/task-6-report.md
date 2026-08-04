# Task 6 report: generated API contract integration

## Status

Complete on `feat/engineering-quality-modernization`, building on the inherited NSwag/client/adapter commits. The generated transport remains confined to `frontend/src/generated`; application consumers use the handwritten `PracticeOpsApiAdapter`.

## Repairs completed

- Mapped and validated dashboard, reset, appointment, note, and claim response DTOs into the existing domain-facing frontend models.
- Validated required fields plus generated status enums, scenario workspace values, and scenario step states before exposing DTOs to application code.
- Preserved the existing portfolio actor on every mutation.
- Converted both generated `ApiException` failures and plain NSwag `ProblemDetails` objects back to the existing `HttpErrorResponse.error.detail` shape while propagating non-API transport errors unchanged.
- Kept retry, stale-snapshot, polling, notices, synthetic fallback, and post-mutation refresh policy in `OperationalRefreshStore`.
- Replaced obsolete store tests that exercised the deleted direct `HttpClient` service with a fake handwritten adapter, preserving store fallback coverage without leaking NSwag response mechanics.
- Made `api:check` non-mutating: NSwag writes to a temporary candidate, line endings are normalized for Windows/Linux comparison, and drift fails without touching the tracked client or invoking Git.
- Made generation use an isolated ephemeral Compose project with a dynamic API port; cleanup removes only that project's containers, network, and volume.
- Converted `.github/workflows/nswag-generate.yml` from a hard-coded branch writer into a read-only pull-request drift check. It no longer commits or pushes.

No direct `PracticeOpsApiService` references remain. Outside the generated folder, only the adapter and its contract test import the generated client. String enum values including `CheckedIn`, `InReview`, `Signed`, `ReadyForSubmission`, and `Submitted` remain present in the generated contract.

## Test-first and debugging evidence

- Baseline frontend compilation failed in the inherited adapter because required scenario fields were mapped to `null` and scenario workspace/state strings were not narrowed.
- New adapter mutation/problem-detail/malformed-contract tests were added before the adapter repair.
- Review regression RED: the focused adapter suite passed 11 tests and failed the new plain-problem-detail test because NSwag's non-`ApiException` object exposed no `error.error.detail`. GREEN: a narrow numeric-status/string-detail guard normalized that generated shape and the focused suite passed 12/12.
- The first repaired full run exposed five obsolete store tests failing on NSwag's Blob response transport. Replacing their direct HTTP harness with a fake adapter restored policy-level coverage without production store changes.
- A real `api:check` first detected Windows CRLF as false drift. The comparison now normalizes CRLF/LF and the same real-stack check passes.

## Verification

- `dotnet tool restore` — passed; NSwag 14.4.0 restored.
- `npm --prefix frontend ci` — passed; 1,519 packages installed.
- `npm --prefix frontend run api:generate` — passed against an isolated PostgreSQL/RabbitMQ/API stack; generated Git content remained unchanged.
- `npm --prefix frontend run api:check` — passed: `Generated API client matches the committed contract.` Isolated containers/network/volume were removed.
- Focused adapter test — passed, 12/12 after the expected one-test RED run.
- `npm --prefix frontend run test` — passed, 109/109.
- `npm --prefix frontend run build` — passed; production output generated.
- `dotnet test PracticeOps.sln` — passed, 18/18.
- `git diff --check` — passed.
- Contract-generation container check — no `practiceops-api-contract-*` containers remain.

## Remaining concerns outside Task 6

- The workstation uses unsupported Node `v23.6.1`; CI is pinned to Node 22. Local commands passed, but an Angular-supported LTS should be used for routine development.
- `npm ci` reports 47 dependency vulnerabilities (2 low, 19 moderate, 25 high, 1 critical). Dependency-health remediation belongs to the approved final cleanup task and should not be addressed through uncontrolled major upgrades here.
- The separate `modernization-bootstrap.yml` workflow remains mutating; it spans Storybook/Playwright bootstrap work and is reserved for the approved Task 8 cleanup rather than this Task 6 repair.

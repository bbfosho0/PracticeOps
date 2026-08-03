# Deployment-Truthful PracticeOps MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver a persisted, resettable employer-demo scenario with truthful live/synthetic behavior, shared reactive refresh, real audit/outbox proof, and a bounded System & Demo workspace.

**Architecture:** The backend builds one authoritative dashboard snapshot that includes scenario and outbox telemetry. A transactional demo reset recreates the deterministic fictional baseline. The Angular frontend moves HTTP lifecycle work into a typed API service and a visibility-aware refresh store; the existing component renders and drives the guided scenario from that shared state.

**Tech Stack:** .NET 8, ASP.NET Core Minimal APIs, Entity Framework Core, PostgreSQL, RabbitMQ, Angular 20, TypeScript 5.9, RxJS 7.8, Jasmine, xUnit.

## Global Constraints

- All names and records remain fictional.
- Do not claim HIPAA certification or production compliance.
- Use the existing workflow transition rules; do not bypass domain validation.
- Poll every 45 seconds only in live mode while the document is visible.
- Synthetic fallback is fully navigable and read-only for persisted actions.
- Do not add WebSockets, SSE, authentication, user administration, or new production settings.
- Preserve reduced-motion and keyboard-visible focus support.
- Do not merge the pull request without an explicit merge instruction.

---

### Task 1: Authoritative dashboard, scenario, and outbox contracts

**Files:**
- Create: `backend/PracticeOps.Api/DashboardSnapshot.cs`
- Create: `backend/PracticeOps.Api/PortfolioScenario.cs`
- Modify: `backend/PracticeOps.Api/Program.cs`
- Test: `backend/PracticeOps.Tests/PortfolioScenarioTests.cs`

**Interfaces:**
- Produces: `DashboardSnapshotBuilder.BuildAsync(PracticeOpsDbContext, CancellationToken)`
- Produces: `PortfolioScenarioBuilder.Build(IReadOnlyList<Appointment>, IReadOnlyList<ClinicalNote>, IReadOnlyList<Claim>)`
- Produces: `OutboxSummary`
- Consumes: existing entities and `DashboardMetricsCalculator.Calculate`

- [ ] **Step 1: Write failing scenario tests**

```csharp
[Fact]
public void Build_selects_the_seeded_exception_records_and_reports_initial_progress()
{
    var dataset = FictionalSeed.BuildDataset(new DateTimeOffset(2026, 8, 3, 12, 0, 0, TimeSpan.Zero));
    var scenario = PortfolioScenarioBuilder.Build(dataset.Appointments, dataset.Notes, dataset.Claims);

    Assert.Equal("practiceops-exception-journey", scenario.Id);
    Assert.Equal("Luna Baker", dataset.Appointments.Single(x => x.Id == scenario.AppointmentId).PatientDisplayName);
    Assert.Equal(0, scenario.CompletedSteps);
    Assert.Equal("schedule", scenario.CurrentWorkspace);
}
```

- [ ] **Step 2: Run the focused backend test and confirm it fails**

Run: `dotnet test backend/PracticeOps.Tests/PracticeOps.Tests.csproj --filter PortfolioScenarioTests`

Expected: FAIL because `PortfolioScenarioBuilder` does not exist.

- [ ] **Step 3: Implement immutable response records and progress derivation**

Use the seeded appointment for `Luna Baker`, its note by `AppointmentId`, and claim `CLM-742198`. Define ordered steps for appointment confirmation, note review, note signature, claim readiness, claim submission, and proof review. Derive complete/current/pending state from entity statuses; do not store progress independently.

- [ ] **Step 4: Implement the dashboard snapshot builder**

Load today’s appointments, all notes, at-risk/current-scenario claims, the latest 20 audit entries, and outbox messages. Return metrics, records, `PortfolioScenario`, and an `OutboxSummary` that separates pending from processed messages.

- [ ] **Step 5: Replace the inline `/api/dashboard` query with the builder**

```csharp
app.MapGet("/api/dashboard", async (PracticeOpsDbContext db, CancellationToken ct) =>
    Results.Ok(await DashboardSnapshotBuilder.BuildAsync(db, ct)))
    .WithName("GetDashboard")
    .WithOpenApi();
```

- [ ] **Step 6: Run backend tests**

Run: `dotnet test PracticeOps.sln`

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add backend/PracticeOps.Api backend/PracticeOps.Tests/PortfolioScenarioTests.cs
git commit -m "feat: expose portfolio scenario telemetry"
```

### Task 2: Transactional deterministic reset and correct HTTP errors

**Files:**
- Create: `backend/PracticeOps.Api/DemoResetService.cs`
- Modify: `backend/PracticeOps.Api/Program.cs`
- Test: `backend/PracticeOps.Tests/DemoResetServiceTests.cs`
- Modify: `backend/PracticeOps.Tests/PracticeOps.Tests.csproj`

**Interfaces:**
- Produces: `DemoResetService.ResetAsync(PracticeOpsDbContext, DateTimeOffset, CancellationToken)`
- Produces: `POST /api/demo/reset`
- Consumes: `FictionalSeed.BuildDataset` and `DashboardSnapshotBuilder.BuildAsync`

- [ ] **Step 1: Add EF Core InMemory for service-level reset tests**

Add `Microsoft.EntityFrameworkCore.InMemory` version matching the API project’s EF Core major/minor version.

- [ ] **Step 2: Write a failing reset test**

Seed an old appointment and outbox message, call `ResetAsync`, then assert the old IDs are absent, the baseline counts are 24 appointments, 24 notes, 12 claims, 12 audit entries, zero outbox messages, and the returned scenario starts at the schedule step.

- [ ] **Step 3: Implement reset inside an explicit transaction**

Delete outbox, audit, claims, notes, and appointments in dependency-safe order, add a fresh `FictionalSeedDataset`, save, commit, and return the authoritative snapshot. Roll back and rethrow on failure.

- [ ] **Step 4: Add the bounded reset endpoint**

```csharp
app.MapPost("/api/demo/reset", async (PracticeOpsDbContext db, CancellationToken ct) =>
    Results.Ok(await DemoResetService.ResetAsync(db, DateTimeOffset.UtcNow, ct)))
    .WithName("ResetPortfolioDemo")
    .WithOpenApi();
```

- [ ] **Step 5: Map missing records to 404**

Update the exception handler so `KeyNotFoundException` becomes RFC 9457 `404 Not Found`, `InvalidOperationException` remains `409 Conflict`, and unexpected failures remain `500`.

- [ ] **Step 6: Run restore, build, and backend tests**

Run:

```bash
dotnet restore PracticeOps.sln
dotnet build PracticeOps.sln --configuration Release --no-restore
dotnet test PracticeOps.sln --configuration Release --no-build
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add backend
git commit -m "feat: add deterministic portfolio reset"
```

### Task 3: Typed frontend API and shared refresh store

**Files:**
- Create: `frontend/src/practiceops-api.service.ts`
- Create: `frontend/src/operational-refresh.store.ts`
- Modify: `frontend/src/dashboard-model.ts`
- Test: `frontend/src/operational-refresh.store.spec.ts`
- Modify: `frontend/src/main.ts`

**Interfaces:**
- Produces: `PracticeOpsApiService.loadDashboard()`, `resetDemo()`, `transitionAppointment()`, `transitionNote()`, `transitionClaim()`
- Produces: `OperationalRefreshStore.dashboard`, `apiMode`, `loading`, `refreshing`, `lastUpdatedAt`, `stale`, `notice`, `refresh()`, `resetDemo()`, and `runMutation()`
- Consumes: extended `Dashboard`, `PortfolioScenario`, and `OutboxSummary` interfaces

- [ ] **Step 1: Extend the typed dashboard model**

Add `appointmentId` to `ClinicalNote`, `scenario` and `outbox` to `Dashboard`, and deterministic synthetic equivalents. Synthetic scenario IDs use the existing `demo-*` IDs and remain explicitly non-persisted.

- [ ] **Step 2: Write refresh-store tests with a fake API**

Cover initial live load, fallback load, overlapping refresh deduplication, mutation-triggered invalidation, preserved last-valid data after failure, and disabled persisted mutations in demo mode.

- [ ] **Step 3: Implement the typed API service**

Use `HttpClient` and return `Observable<Dashboard>` for all requests. Encode actor as `Portfolio reviewer` and use the existing status endpoints.

- [ ] **Step 4: Implement the signal-based refresh store**

The store owns dashboard/API lifecycle state, one in-flight subscription, a 45-second interval, and `visibilitychange` handling. Poll only when `apiMode() === 'live'` and the document is visible. Preserve the last dashboard during failures.

- [ ] **Step 5: Register the services through Angular DI**

Both classes use `providedIn: 'root'`; keep `provideHttpClient()` in `main.ts`.

- [ ] **Step 6: Run Angular tests**

Run: `npm --prefix frontend run test -- --watch=false`

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add frontend/src
git commit -m "feat: add reactive operational refresh store"
```

### Task 4: Guided scenario controller and truthful mutation behavior

**Files:**
- Create: `frontend/src/portfolio-scenario.controller.ts`
- Test: `frontend/src/portfolio-scenario.controller.spec.ts`
- Modify: `frontend/src/app.component.ts`
- Modify: `frontend/src/app.component.html`

**Interfaces:**
- Produces: `PortfolioScenarioController.start()`, `performCurrentAction()`, `openCurrentWorkspace()`, `canMutate`, `actionLabel`, and `actionDescription`
- Consumes: `OperationalRefreshStore`, `PracticeOpsApiService`, and `ViewId`

- [ ] **Step 1: Write controller tests**

Assert each scenario state maps to the correct workspace and API transition:

```text
Scheduled appointment → Confirmed
Draft note → InReview
InReview note → Signed
NeedsReview claim → ReadyForSubmission
ReadyForSubmission claim → Submitted
Submitted claim → Audit/System proof
```

Assert demo mode rejects persisted actions without issuing an HTTP request.

- [ ] **Step 2: Implement the controller**

Use authoritative scenario IDs and status fields. `start()` calls reset. `performCurrentAction()` calls exactly one bounded transition, then relies on store invalidation to reload the snapshot.

- [ ] **Step 3: Refactor `AppComponent` to consume the store**

Remove direct `HttpClient`, `liveDashboard`, `load()`, and `applyDashboard()` ownership. Keep existing computed presentation models and filters, but source `dashboard`, `loading`, `apiMode`, `notice`, refresh timestamps, and stale state from the store.

- [ ] **Step 4: Add the guided journey UI**

Add a compact scenario rail/card that shows progress, current task, current workspace, **Start portfolio scenario**, **Continue journey**, and **Reset demo**. In synthetic mode, disable persisted actions and show the specific live-API requirement.

- [ ] **Step 5: Add manual refresh and truthful status copy**

Expose **Refresh**, `Updated just now`, `Updating…`, and stale status without blanking the current dashboard.

- [ ] **Step 6: Run Angular tests and build**

```bash
npm --prefix frontend run test -- --watch=false
npm --prefix frontend run build
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add frontend/src
git commit -m "feat: add persisted employer demo journey"
```

### Task 5: System & Demo truth pass and outbox proof

**Files:**
- Modify: `frontend/src/app.component.ts`
- Modify: `frontend/src/app.component.html`
- Modify: `frontend/src/app.component.css`
- Modify: `frontend/src/app.component.workspaces.css`
- Modify: `frontend/src/portfolio-showcase.css`

**Interfaces:**
- Consumes: `Dashboard.outbox`, scenario progress, refresh-store status, and browser-local preferences
- Produces: bounded System & Demo workspace and state-driven visual classes

- [ ] **Step 1: Rename Settings copy and navigation**

Keep the internal `settings` view ID to avoid unnecessary route churn, but display **System & Demo** in navigation, headings, and mobile labels.

- [ ] **Step 2: Replace implied integrations with truthful telemetry**

Show API/live-preview mode, last successful refresh, outbox delivered/pending counts, latest event, current scenario progress, architecture, fictional-data boundary, and local preferences. Remove or relabel any unsupported security, user, role, or integration configuration.

- [ ] **Step 3: Bind Event Spectrum to real outbox state**

Show `Delivered` only when `processedAt` exists; otherwise show `Pending delivery`. Do not infer RabbitMQ health solely from dashboard availability.

- [ ] **Step 4: Add state-driven motion classes**

Animate changed KPI/record states briefly, limit breathing to live/processing/attention states, stop positive motion for stale data, pause the atmosphere while hidden, and preserve reduced-motion overrides.

- [ ] **Step 5: Audit every visible control**

Each control must perform a real action, navigate, perform a labeled local action, be disabled with an explanation, or be removed.

- [ ] **Step 6: Build the frontend**

Run: `npm --prefix frontend run build`

Expected: PASS with no Angular template errors.

- [ ] **Step 7: Commit**

```bash
git add frontend/src
git commit -m "fix: make portfolio controls deployment truthful"
```

### Task 6: Documentation, CI, and final verification

**Files:**
- Modify: `README.md`
- Modify: `AGENTS.md` only if new conventions require it
- Modify: `.github/workflows/ci.yml` only if test discovery or commands changed
- Create: `docs/portfolio-demo.md`

**Interfaces:**
- Produces: reproducible setup and one-minute employer demonstration instructions

- [ ] **Step 1: Document the portfolio journey**

Include exact setup commands, fictional-data boundary, live versus synthetic behavior, reset semantics, the six-step employer walkthrough, architecture proof points, and expected outbox behavior with and without RabbitMQ.

- [ ] **Step 2: Document deployment constraints**

Explain that persisted demo actions require the API/PostgreSQL deployment and that the static Angular fallback is intentionally read-only.

- [ ] **Step 3: Run full verification**

```bash
dotnet restore PracticeOps.sln
dotnet build PracticeOps.sln --configuration Release --no-restore
dotnet test PracticeOps.sln --configuration Release --no-build
dotnet format PracticeOps.sln --verify-no-changes --no-restore
npm --prefix frontend ci
npm --prefix frontend run test -- --watch=false
npm --prefix frontend run build
```

Expected: all commands PASS.

- [ ] **Step 4: Verify scenario behavior manually**

With Docker Compose running, reset the demo, perform each guided action, confirm every workspace updates, confirm audit entries are appended, and confirm outbox state is either truthfully delivered or pending.

- [ ] **Step 5: Commit**

```bash
git add README.md AGENTS.md .github/workflows/ci.yml docs
git commit -m "docs: add PracticeOps portfolio demo guide"
```

- [ ] **Step 6: Open a draft pull request**

Title: `Finish PracticeOps deployment-truthful portfolio MVP`

The PR body must summarize the persisted golden journey, reset endpoint, refresh architecture, synthetic read-only behavior, System & Demo truth pass, tests, and any verification that could not be run locally.

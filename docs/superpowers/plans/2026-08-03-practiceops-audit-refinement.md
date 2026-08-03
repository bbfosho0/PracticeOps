# PracticeOps Final Audit Refinement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Correct the remaining delivery-truth, state, hierarchy, accessibility, and verification gaps in the PracticeOps portfolio MVP without replacing its Clinical Observatory identity.

**Architecture:** Keep the modular monolith and shared Angular refresh-store design. Strengthen the outbox publisher with RabbitMQ confirms and a durable routed queue, simplify scenario semantics to five persisted transitions plus proof navigation, and layer focused presentation overrides rather than rewriting the existing workspace system.

**Tech Stack:** .NET 8, ASP.NET Core Minimal APIs, Entity Framework Core 8, PostgreSQL 16, RabbitMQ.Client 7.1.2, RabbitMQ 4, Angular 20, RxJS 7.8, Jasmine/Karma, GitHub Actions, headless Chromium.

## Global Constraints

- All records remain fictional.
- Do not claim HIPAA certification or production compliance.
- `ProcessedAt` means broker-confirmed publication, not downstream consumption.
- Keep five persisted workflow transitions and expose proof inspection as navigation after completion.
- Preserve manual schedule-date navigation after initialization.
- Preserve last-valid data during transient refresh failures.
- Retain the Clinical Observatory visual identity and reduced-motion behavior.
- No WebSockets, SSE, authentication, user administration, or fake integrations.
- Do not merge into `main` without an explicit merge instruction.

---

### Task 1: Broker-confirmed outbox publication

**Files:**
- Modify: `backend/PracticeOps.Api/OutboxDispatcher.cs`
- Modify: `backend/PracticeOps.Api/DashboardSnapshot.cs`
- Modify: `backend/PracticeOps.Tests/DashboardSnapshotTests.cs`
- Modify: `.github/workflows/ci.yml`
- Modify: `README.md`
- Modify: `docs/portfolio-demo.md`

**Interfaces:**
- Consumes: `OutboxMessage.ProcessedAt`, RabbitMQ exchange `practiceops.events`
- Produces: durable queue `practiceops.portfolio.audit`, broker-confirmed publication semantics

- [ ] **Step 1: Update the aggregate regression test terminology**

Assert `PublishedMessages` and `LatestPublishedAt` rather than delivered semantics while retaining exact totals above 100 records.

- [ ] **Step 2: Run the backend tests and confirm the contract fails to compile**

Run: `dotnet test backend/PracticeOps.Tests/PracticeOps.Tests.csproj --filter DashboardSnapshotTests`

Expected: FAIL because the renamed response properties do not exist.

- [ ] **Step 3: Enable publisher confirmations and routing proof**

Create the channel with:

```csharp
var channelOptions = new CreateChannelOptions(
    publisherConfirmationsEnabled: true,
    publisherConfirmationTrackingEnabled: true);
await using var channel = await connection.CreateChannelAsync(channelOptions, cancellationToken);
```

Declare `practiceops.events`, declare durable queue `practiceops.portfolio.audit`, and bind it with routing key `#`. Publish with `mandatory: true`. Set `ProcessedAt` only after the awaited publish completes without return, nack, or connection failure.

- [ ] **Step 4: Rename public outbox response semantics**

Use:

```csharp
public sealed record OutboxSummary(
    int TotalMessages,
    int PendingMessages,
    int PublishedMessages,
    string? LatestEventType,
    DateTimeOffset? LatestOccurredAt,
    DateTimeOffset? LatestPublishedAt);
```

- [ ] **Step 5: Verify routed messages in the acceptance job**

After the five transitions, run:

```bash
docker compose exec -T rabbitmq rabbitmqctl list_queues name messages --quiet |
  grep -E '^practiceops\.portfolio\.audit[[:space:]]+5$'
```

- [ ] **Step 6: Run backend and full-stack verification**

Run the backend suite and the `portfolio-journey` workflow. Expected: all pass and the queue contains five messages.

### Task 2: Five-transition scenario plus proof navigation

**Files:**
- Modify: `backend/PracticeOps.Api/PortfolioScenario.cs`
- Modify: `backend/PracticeOps.Tests/PortfolioScenarioTests.cs`
- Modify: `frontend/src/dashboard-model.ts`
- Modify: `frontend/src/portfolio-scenario.controller.ts`
- Modify: `frontend/src/portfolio-scenario.controller.spec.ts`
- Modify: `.github/workflows/ci.yml`

**Interfaces:**
- Produces: five persisted steps, terminal `inspect-proof` navigation state, `5/5` completion

- [ ] **Step 1: Change scenario tests to expect five persisted transitions**

Initial state remains `0/5`; after appointment, two note transitions, claim readiness, and claim submission, expect `5/5`, `100%`, current step `inspect-proof`, and current workspace `audit`.

- [ ] **Step 2: Run focused tests and confirm failure**

Run: `dotnet test backend/PracticeOps.Tests/PracticeOps.Tests.csproj --filter PortfolioScenarioTests`

Expected: FAIL because the builder still counts proof inspection as a sixth completed step.

- [ ] **Step 3: Implement the terminal proof state**

Keep five `PortfolioScenarioStep` records. When all five are complete, set:

```csharp
CurrentStepId = "inspect-proof";
CurrentWorkspace = "audit";
CompletedSteps = 5;
TotalSteps = 5;
CompletionPercent = 100;
```

- [ ] **Step 4: Update the frontend controller**

Return a synthetic current-step description for `inspect-proof`, keep the primary action label `Inspect proof`, and navigate without issuing a persistence request.

- [ ] **Step 5: Update acceptance assertions**

Use expected progress `1, 2, 3, 4, 5`; assert final completion percent 100.

### Task 3: Refresh recovery and schedule-date correctness

**Files:**
- Modify: `frontend/src/operational-refresh.store.ts`
- Replace: `frontend/src/operational-refresh.store.spec.ts`
- Modify: `frontend/src/app.component.ts`
- Create: `frontend/src/schedule-date.ts`
- Create: `frontend/src/schedule-date.spec.ts`

**Interfaces:**
- Produces: `resolveInitialScheduleDate(appointments, selectedDate)`
- Produces: store recovery that clears stale warning copy

- [ ] **Step 1: Add failing schedule-date tests**

Cover a reviewer-local day that differs from the first appointment’s local day. With no explicit selection, expect the first appointment day. With a reviewer-selected day, preserve the selection.

- [ ] **Step 2: Add HTTP-backed refresh-store tests**

Using `provideHttpClientTesting`, verify:

- initial live response enters live mode;
- initial 503 enters synthetic preview;
- a failed refresh after live load retains the previous dashboard and sets stale;
- the next successful refresh clears stale and replaces the failure notice with recovery copy;
- reset returns the authoritative dashboard;
- a mutation triggers one follow-up dashboard refresh.

- [ ] **Step 3: Implement schedule-date resolution**

Use the first appointment date only while no manual selection exists. `shiftScheduleDate` creates the manual selection. Reset clears the manual selection before reseeding.

- [ ] **Step 4: Implement recovery copy**

On successful refresh after `stale() === true`, set `Live data recovered.`. Ordinary quiet polls should not create a persistent success banner.

- [ ] **Step 5: Run Angular tests**

Run: `npm --prefix frontend run test -- --watch=false`

Expected: PASS.

### Task 4: Hierarchy, typography, focus, and mobile polish

**Files:**
- Create: `frontend/src/portfolio-final-polish.css`
- Modify: `frontend/src/styles.css`
- Modify: `frontend/src/app.component.html`
- Modify: `frontend/src/app.component.ts`
- Modify: `frontend/src/portfolio-showcase.css`
- Modify: `.github/workflows/visual-audit.yml`

**Interfaces:**
- Produces: compact scenario rail on non-overview workspaces and mobile
- Produces: readable minimum typography and safe fixed navigation

- [ ] **Step 1: Add visual-audit assertions that fail on the current UI**

Assert:

- mobile scenario rail height is below 360 pixels;
- fixed mobile navigation does not cover the scenario primary action;
- primary buttons have at least 40-pixel height;
- a keyboard-focused refresh button has a visible outline or box shadow;
- representative operational text is at least 10 CSS pixels.

- [ ] **Step 2: Collapse explanatory chrome**

Return `false` from `defaultProofLayerOpen()`. Add `is-compact` to the scenario rail when the active workspace is not Overview. Hide the step list in compact and mobile layouts while retaining current task, progress, reset, navigation, and primary action.

- [ ] **Step 3: Add final typography and contrast overrides**

Import `portfolio-final-polish.css` after existing global styles. Raise representative 6–9 pixel operational text to 10–12 pixels, increase muted contrast, add line height, and keep tables horizontally scrollable where necessary.

- [ ] **Step 4: Add focus and touch-target treatment**

Apply a consistent `:focus-visible` ring to buttons, inputs, and selects. Use 40-pixel minimum controls on desktop and 44 pixels on mobile where practical.

- [ ] **Step 5: Add mobile safe-area spacing**

Pad the workspace bottom by the fixed navigation height plus `env(safe-area-inset-bottom)`.

- [ ] **Step 6: Run visual audit and inspect all 12 screenshots**

Expected: no overflow, no console errors, compact mobile journey, readable text, and unchanged visual identity.

### Task 5: Real audit timeline and copy cleanup

**Files:**
- Modify: `frontend/src/operational-telemetry.ts`
- Modify: `frontend/src/app.component.ts`
- Modify: `frontend/src/app.component.html`
- Modify: `frontend/src/dashboard-model.ts`
- Modify: `README.md`
- Modify: `docs/portfolio-demo.md`

**Interfaces:**
- Produces: actual event-time histogram, real category counts, published/pending terminology

- [ ] **Step 1: Add failing telemetry tests**

Create events in known 15-minute buckets and assert the spectrum is derived from their timestamps rather than event hashes. Assert empty input produces zeroed buckets.

- [ ] **Step 2: Replace decorative telemetry values**

Remove signals-per-minute, synthetic lag, and pseudo-delivery-rate claims from visible KPIs. Use audit count, appointment events, documentation events, claim events, outbox published, and outbox pending.

- [ ] **Step 3: Build the spectrum from event timestamps**

Bucket loaded audit entries by occurrence time and normalize counts for rendering. Label the axis as audit sequence/time coverage rather than real-time streaming.

- [ ] **Step 4: Update all delivered wording**

Use `Published`, `Pending publication`, and `Broker confirmed`. Explain that downstream consumption is outside the demo boundary.

### Task 6: Live browser employer journey

**Files:**
- Modify: `.github/workflows/ci.yml`
- Modify: `.github/workflows/visual-audit.yml` only for shared browser helpers if required
- Modify: `docs/portfolio-demo.md`

**Interfaces:**
- Consumes: Docker Compose API stack and Angular dev-server proxy
- Produces: browser-driven proof of the five-transition journey

- [ ] **Step 1: Start Angular with the API proxy in `portfolio-journey`**

Install Node 22, run `npm ci`, and start `npm start -- --host 127.0.0.1` after the API becomes ready.

- [ ] **Step 2: Drive the live UI through Chromium**

Verify `data-api-mode="live"`, click Start/reset, complete all five persisted transitions, and assert:

- progress advances 0/5 → 5/5;
- unsigned notes falls 7 → 6;
- claims at risk falls 12 → 11;
- the primary action becomes `Inspect proof`;
- Event Spectrum shows 17 audit entries;
- outbox shows five published and zero pending;
- the RabbitMQ queue contains five messages.

- [ ] **Step 3: Capture live completion evidence**

Upload final Overview, Audit, and System & Demo screenshots plus a JSON result file.

- [ ] **Step 4: Run exact-head verification**

Require backend, frontend, portfolio journey, and visual audit jobs to pass on the final commit.

### Task 7: Final review and PR state

**Files:**
- Modify: pull request description only

- [ ] **Step 1: Review the final diff against the design spec**

Check delivery semantics, five-step progress, date anchoring, recovery behavior, mobile hierarchy, typography, audit truth, and test coverage.

- [ ] **Step 2: Inspect all workflow logs and artifacts**

Do not rely only on job conclusions; confirm the expected assertions and screenshots are present.

- [ ] **Step 3: Update the PR body with exact-head evidence**

Document the final SHA, tests, queue proof, live browser journey, visual audit, and remaining deliberate boundaries.

- [ ] **Step 4: Mark ready for review**

Only after every exact-head workflow passes. Keep the PR unmerged.

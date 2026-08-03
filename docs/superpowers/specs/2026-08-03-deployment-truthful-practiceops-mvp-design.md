# PracticeOps Deployment-Truthful Portfolio MVP Design

**Date:** 2026-08-03  
**Status:** Approved  
**Branch:** `feature/deployment-truthful-practiceops-mvp`

## Objective

Finish PracticeOps as a portfolio-ready behavioral-health operations MVP whose visible workflows are either genuinely persisted through the ASP.NET Core API or explicitly presented as read-only synthetic preview data. The primary employer demonstration must communicate the product, architecture, and engineering depth in under one minute without relying on decorative controls or unsupported claims.

## Product story

The primary employer journey is a guided, persisted operations-exception scenario:

```text
Schedule exception
→ documentation delay
→ claim risk
→ staff resolution actions
→ immutable audit events
→ transactional outbox delivery
```

The journey uses fictional records only. It demonstrates Angular state management, ASP.NET Core workflow rules, PostgreSQL persistence, auditability, and RabbitMQ delivery without claiming HIPAA certification or production compliance.

## Approved scope

### 1. Guided portfolio scenario

Add a visible **Start portfolio scenario** action in live API mode. Starting the scenario resets the fictional dataset to a deterministic baseline and returns the authoritative scenario record identifiers.

The scenario uses one seeded appointment, its seeded clinical note, and one seeded claim. The UI guides the reviewer across:

1. **Schedule** — resolve the unconfirmed appointment exception.
2. **Documentation** — submit and sign the related clinical note.
3. **Claims** — clear the claim risk and advance it toward submission.
4. **Audit** — inspect the persisted audit entries created by each transition.
5. **System & Demo** — inspect API mode, scenario completion, outbox status, and safety boundaries.

Every action calls the existing workflow endpoints or a new bounded demo endpoint. No browser-only action may imply PostgreSQL, audit, or outbox persistence.

### 2. Deterministic reset

Add `POST /api/demo/reset`.

The endpoint:

- Deletes existing fictional appointments, notes, claims, audit entries, and outbox messages inside one database transaction.
- Rebuilds the existing fictional seed dataset using the current UTC day.
- Returns the same dashboard contract as `GET /api/dashboard`, including scenario metadata and outbox telemetry.
- Is explicitly documented as a portfolio/demo operation.
- Is not presented as a production administrative feature.

### 3. Scenario metadata

The dashboard response gains a `scenario` object containing:

- Scenario identifier and title.
- Appointment, clinical-note, and claim IDs.
- Ordered scenario steps.
- Current step and completion percentage.
- The workspace associated with each step.
- Whether each step is complete, current, or pending.

Scenario progress is derived from authoritative entity states rather than stored separately.

### 4. Outbox telemetry

The dashboard response gains an `outbox` summary:

- Total messages.
- Pending messages.
- Delivered messages.
- Latest event type.
- Latest occurrence time.
- Latest processed time when available.

The Event Spectrum and System & Demo workspaces use this real summary. They must not claim successful delivery when messages are pending because RabbitMQ is unavailable.

### 5. Hybrid reactive refresh

Introduce one frontend refresh coordinator shared by all six workspaces.

Behavior:

- Load immediately on startup.
- Refresh immediately after every persisted scenario action.
- Poll every 45 seconds while the document is visible and live API mode is active.
- Pause polling while the document is hidden.
- Deduplicate overlapping refresh requests.
- Preserve the last valid dashboard during temporary failures.
- Display manual refresh, `Updated just now`/relative timestamp, refreshing state, and stale/error state.
- Stop positive live-state motion while data is stale.

No WebSockets or Server-Sent Events are added.

### 6. Read-only synthetic fallback

When `/api/dashboard` is unavailable:

- Keep all six workspaces navigable with deterministic fictional data.
- Show one persistent `Synthetic preview — API unavailable` state and a **Retry API** action.
- Disable scenario start, reset, workflow mutations, and any other control that implies persistence.
- Explain that persisted actions require the live API.
- Keep local notification preferences functional and explicitly label them browser-local.
- Never fabricate audit or outbox persistence.

### 7. System & Demo workspace

Rename **Workspace Parameters** to **System & Demo** and constrain it to truthful behavior:

- API mode and last successful refresh.
- PostgreSQL/readiness state inferred from dashboard availability and health data exposed by the API.
- RabbitMQ/outbox delivery state from the real outbox summary.
- Current scenario progress and deterministic reset.
- Architecture summary.
- Fictional-data and non-HIPAA boundary.
- Browser-local notification preferences.

Do not add fake user management, role editing, integration setup, security policy editing, or administrative configuration.

### 8. State-driven premium motion

Motion communicates change rather than decorating every surface:

- KPI values interpolate only when underlying values change.
- Changed records receive a brief highlight.
- Scenario progress animates between real states.
- Breathing motion is limited to live, processing, or attention-required indicators.
- Stale and error states stop positive breathing and show explicit status treatment.
- Background animation pauses while the document is hidden.
- `prefers-reduced-motion` removes interpolation, breathing, sweeping, and nonessential transitions.

### 9. Truthful-control rule

Every visible control must do one of the following:

1. Perform a real persisted action.
2. Navigate to a real functional workspace.
3. Perform an explicitly browser-local action.
4. Be disabled with a specific explanation.
5. Be removed.

No decorative save, export, assign, integration, administration, or automation controls remain unexplained.

## Architecture

### Backend units

- `PortfolioScenario`: identifies the deterministic seeded records and derives progress from entity states.
- `DashboardSnapshotBuilder`: builds one authoritative dashboard response used by both dashboard load and reset.
- `DemoResetService`: performs transactional deletion and reseeding.
- Existing appointment, clinical-note, and claim transition endpoints remain the authoritative mutation surface.

### Frontend units

- `PracticeOpsApiService`: typed dashboard, reset, and status-transition requests.
- `OperationalRefreshStore`: dashboard signal, API mode, refresh timestamps, stale/error state, visibility-aware polling, and mutation invalidation.
- `PortfolioScenarioController`: maps scenario steps to workspace navigation and bounded workflow actions.
- `AppComponent`: presentation state, existing filters, and workspace rendering. Network lifecycle logic moves out of the component.

### Data flow

```text
User scenario action
→ typed Angular API request
→ ASP.NET Core workflow transition
→ PostgreSQL entity update + audit entry + outbox message
→ immediate dashboard invalidation
→ shared dashboard refresh
→ all workspace KPIs and records update
→ outbox worker publishes to RabbitMQ when available
→ later poll/refresh reflects delivered or pending state truthfully
```

## Error handling

- Invalid transitions return RFC 9457 Problem Details with HTTP 409.
- Missing records return HTTP 404 rather than becoming generic 500 responses.
- Reset failure leaves the previous dataset intact through transaction rollback.
- Frontend mutation failures preserve the previous valid dashboard and display the API detail when safe.
- Polling failures do not blank the interface.
- After repeated failures, live mode becomes stale and exposes **Retry API**.
- Synthetic mode remains clearly labeled and mutation controls stay disabled.

## Testing strategy

### Backend

- Scenario record selection is deterministic for a seeded dataset.
- Scenario progress advances from entity statuses.
- Reset deletes old records, reseeds the baseline, and returns the authoritative snapshot.
- Reset is transactional.
- Every transition creates one audit entry and one outbox message.
- Outbox summary distinguishes pending and delivered messages.
- Missing transition targets return 404.

### Frontend

- Refresh coordinator deduplicates requests.
- Immediate mutation invalidation reloads the dashboard.
- 45-second polling starts only in live mode while visible.
- Hidden-document polling pauses and resumes correctly.
- Last valid data survives refresh failures.
- Synthetic mode disables persisted actions.
- Scenario actions navigate to the correct workspace and use authoritative IDs.
- API recovery replaces synthetic data with live data.
- Reduced-motion and stale-state classes are applied correctly.

### Delivery verification

- `.NET` restore, build, tests, and formatting verification pass.
- Angular tests and production build pass.
- GitHub Actions pass on the exact PR head.
- Desktop and mobile smoke verification cover all six workspaces.
- The persisted golden journey is verified against PostgreSQL-backed API data.

## Acceptance criteria

PracticeOps is portfolio-MVP complete when:

- A reviewer can start/reset the scenario from the interface in live mode.
- Each guided action persists and immediately updates all affected workspaces.
- Audit entries and outbox messages are created for every transition.
- Outbox delivery is reported as delivered or pending based on real state.
- Synthetic fallback is fully navigable but read-only and unmistakably labeled.
- System & Demo contains only real, local, or explicitly bounded information.
- No visible control silently does nothing or implies unsupported functionality.
- The app remains usable with reduced motion, keyboard navigation, and mobile layouts.
- Repository documentation explains setup, demo flow, architecture, limitations, and verification commands.

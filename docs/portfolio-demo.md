# PracticeOps Portfolio Demo

PracticeOps is a fictional-data behavioral-health operations portfolio application. This walkthrough demonstrates workflow modeling, transactional persistence, auditability, event delivery, reactive frontend state, and truthful degraded behavior.

It is not HIPAA-certified, is not connected to real clinical systems, and must not be represented as a production healthcare product.

## One-minute employer walkthrough

### 1. Establish the system

Open **Operations Observatory** and point out:

- backend-derived appointment, documentation, claim-risk, exposure, and utilization metrics;
- the current runtime mode and last successful refresh;
- the persisted employer-journey rail;
- the explicit fictional-data boundary.

Select **Start / reset**. In live mode, this calls `POST /api/demo/reset`, transactionally replaces the demo dataset, and returns the authoritative dashboard snapshot.

### 2. Resolve the schedule exception

Open **Temporal Runway**. The highlighted Luna Baker appointment is the scenario record.

Select **Complete current step**. Angular calls the appointment status endpoint, ASP.NET Core validates the transition, PostgreSQL stores the new status, and the request writes both an immutable audit entry and a transactional outbox message.

The shared refresh store invalidates the dashboard immediately. All visible metrics and workspaces receive the new snapshot.

### 3. Complete documentation

Continue into **Documentation Continuum**.

The scenario performs two bounded transitions:

1. `Draft → InReview`
2. `InReview → Signed`

The unsigned-note KPI and documentation pipeline update from the refreshed backend data after each persisted action.

### 4. Clear claim risk

Continue into **Risk Constellation**.

The highlighted claim moves through:

1. `NeedsReview → ReadyForSubmission`
2. `ReadyForSubmission → Submitted`

Claim-risk totals and exposure update from the authoritative snapshot. The domain model rejects invalid state transitions with RFC 9457 Problem Details and HTTP 409.

### 5. Inspect proof

Open **Event Spectrum** and **System & Demo**.

Show:

- audit entries created by each workflow transition;
- total, pending, and published outbox messages;
- the latest outbox event type and timestamps;
- truthful publication state: `Delivered` only when `ProcessedAt` exists, otherwise `Pending delivery`;
- API/PostgreSQL availability, snapshot freshness, and 45-second visibility-aware polling;
- the non-HIPAA, fictional-data boundary.

## Live and synthetic modes

### Live API mode

When `/api/dashboard` is reachable:

- workflow actions persist through ASP.NET Core and PostgreSQL;
- the scenario reset is enabled;
- mutations trigger an immediate shared refresh;
- quiet polling runs every 45 seconds while the browser tab is visible;
- audit and outbox telemetry reflect real database state;
- RabbitMQ delivery is reported as published or pending based on `ProcessedAt`.

### Synthetic preview mode

When the API is unavailable:

- all six workspaces remain navigable with deterministic fictional data;
- one persistent message identifies the synthetic preview;
- persisted actions and reset are disabled;
- **Retry API** attempts recovery;
- browser-local notification toggles remain functional and are labeled local;
- the interface does not fabricate PostgreSQL, audit, or RabbitMQ success.

## Local setup

### Prerequisites

- .NET SDK 8
- Node.js 22 and npm
- Docker Desktop or Docker Engine with Compose

### Start the full stack

```bash
docker compose up --build
```

Services:

- API and Swagger: `http://localhost:8081`
- Readiness: `http://localhost:8081/health/ready`
- RabbitMQ management: `http://localhost:15672`

In another terminal:

```bash
npm --prefix frontend ci
npm --prefix frontend start
```

Open `http://localhost:4200`.

## Reset endpoint

```http
POST /api/demo/reset
```

The endpoint is intentionally portfolio-only. It clears and recreates the fictional appointments, notes, claims, audit entries, and outbox records inside a database transaction, then returns a fresh authoritative dashboard snapshot.

## Architecture proof points

```text
ASP.NET Core OpenAPI
        |
        | pinned NSwag generation
        v
Machine-owned TypeScript transport client
        |
        | handwritten validation and mapping
        v
PracticeOps API adapter
        |
        v
Shared refresh store / scenario controller
        |
        v
Angular shell and six standalone workspaces
        |
        | typed REST requests
        v
ASP.NET Core Minimal API
        |
        +-- validated appointment state machine
        +-- validated clinical-note state machine
        +-- validated claim state machine
        +-- immutable audit records
        +-- transactional outbox records
        |
        +--> PostgreSQL
        |
        +--> RabbitMQ topic exchange
```

The frontend uses one refresh store rather than per-page requests. It deduplicates overlapping refreshes, pauses polling while hidden, retains the last valid snapshot during transient failures, and applies new data across every workspace.

The generated client under `frontend/src/generated` is committed for reproducible review but is owned only by NSwag. The handwritten adapter under `frontend/src/app/api` validates required generated fields and maps transport DTOs into the application model. Generated code does not own retry, stale-data retention, polling, fallback, notices, or scenario policy.

## Verification

```bash
dotnet restore PracticeOps.sln
dotnet build PracticeOps.sln --configuration Release --no-restore
dotnet test PracticeOps.sln --configuration Release --no-build
dotnet format PracticeOps.sln --verify-no-changes --no-restore
npm --prefix frontend ci
npm --prefix frontend run api:check
npm --prefix frontend run test -- --watch=false
npm --prefix frontend run build
npm --prefix frontend run build-storybook
# Serve frontend/storybook-static on 127.0.0.1:6006 before this command.
npm --prefix frontend run test-storybook
npm --prefix frontend run test:e2e
```

`api:check` requires Docker and starts an isolated real API stack before comparing a temporary generated candidate to the committed client. The default Playwright command intentionally verifies synthetic-preview mode without Docker.

For the live browser journey, start the real services and opt in explicitly:

```powershell
docker compose up --build --detach postgres rabbitmq api
$env:PRACTICEOPS_E2E_LIVE = '1'
Push-Location frontend
npx --no-install playwright test --project=desktop --grep="persists all five transitions"
Pop-Location
Remove-Item Env:PRACTICEOPS_E2E_LIVE
docker compose down --volumes --remove-orphans
```

GitHub Actions runs read-only backend, frontend, Storybook, contract-drift, synthetic Playwright, live Playwright, and API/RabbitMQ journey gates. Failed browser jobs retain Playwright traces, screenshots, videos, and the HTML report; successful jobs do not upload those artifacts. The responsive visual-audit workflow remains as an additional rendered check across all six workspaces.

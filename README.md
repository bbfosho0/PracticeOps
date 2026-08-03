# PracticeOps

PracticeOps is a portfolio-grade behavioral-health operations platform built entirely with fictional data. It demonstrates domain workflow design, transactional persistence, immutable audit trails, asynchronous event delivery, reactive frontend state, and a premium operational interface without claiming HIPAA certification or production compliance.

## Portfolio MVP

The application includes one guided, persisted employer journey:

```text
Schedule exception
→ documentation delay
→ claim risk
→ staff resolution actions
→ immutable audit events
→ transactional outbox delivery
```

In live API mode, every guided action uses a real ASP.NET Core endpoint, persists to PostgreSQL, creates an audit entry and outbox message, and immediately refreshes every Angular workspace. A deterministic reset restores the fictional baseline for repeatable interviews.

When the API is unavailable, all six workspaces remain navigable with clearly labeled synthetic data. Persisted actions are disabled rather than simulated.

See [`docs/portfolio-demo.md`](docs/portfolio-demo.md) for the one-minute employer walkthrough.

## Clinical Observatory interface

The code-first Angular interface includes:

- **Operations Observatory** for schedule, documentation, claim risk, and activity signals
- **Temporal Runway** for provider capacity and the scenario appointment exception
- **Documentation Continuum** for draft, review, signature, and billing readiness
- **Risk Constellation** for payer, filing, coding, and authorization exposure
- **Event Spectrum** for immutable audit records and truthful outbox delivery state
- **System & Demo** for runtime mode, refresh state, scenario progress, architecture, and safety boundaries
- CSS-rendered aurora, signal fields, glass materials, orbit visualizations, and state-driven motion
- responsive desktop, tablet, and mobile layouts
- reduced-motion support and keyboard-visible focus states
- visibility-aware 45-second polling in live mode
- deterministic, read-only synthetic fallback when the API is unavailable

## Architecture

```text
Angular 20 Clinical Observatory
        |
        | typed REST / JSON
        v
ASP.NET Core Minimal API
        |
        +-- Appointment workflow
        +-- Documentation workflow
        +-- Claims workflow
        +-- Immutable audit timeline
        +-- Transactional outbox
        +-- Deterministic demo reset
        |
        +--> PostgreSQL
        |
        +--> RabbitMQ topic exchange
```

PracticeOps is intentionally a modular monolith. It keeps local development and transaction boundaries clear while demonstrating asynchronous delivery through the outbox pattern.

## Technology

| Area | Technology |
| --- | --- |
| Backend | .NET 8, ASP.NET Core, Minimal APIs |
| Persistence | Entity Framework Core, PostgreSQL |
| Messaging | RabbitMQ.Client, transactional outbox |
| Frontend | Angular 20, TypeScript, standalone components, signals, RxJS |
| Visual system | CSS gradients, backdrop filters, SVG, WebGL2 atmosphere, responsive grid |
| API quality | OpenAPI, RFC 9457 Problem Details, health checks |
| Testing | xUnit domain/reset/scenario tests, Jasmine model/refresh/action tests |
| Delivery | Docker Compose, GitHub Actions, responsive visual audit |

## Runtime behavior

### Live API mode

- The shared frontend store loads one authoritative dashboard snapshot.
- Successful mutations invalidate and refresh all workspaces immediately.
- Quiet polling runs every 45 seconds while the document is visible.
- Polling pauses when the browser tab is hidden.
- The last valid snapshot remains visible during transient failures.
- Outbox delivery is shown as delivered only when the database record has `ProcessedAt`.

### Synthetic preview mode

- Deterministic fictional data keeps every workspace available.
- The interface displays `Synthetic preview — API unavailable`.
- Scenario reset and workflow mutations are disabled.
- **Retry API** recovers live mode when the backend becomes reachable.
- Browser-local preference toggles remain functional and are labeled local.

## Local setup

### Prerequisites

- .NET SDK 8
- Node.js 22 and npm
- Docker Desktop or Docker Engine with Compose

### Start infrastructure and API

```bash
docker compose up --build
```

Services:

- API and Swagger: `http://localhost:8081`
- Readiness: `http://localhost:8081/health/ready`
- RabbitMQ management: `http://localhost:15672`

### Start the Angular frontend

```bash
npm --prefix frontend ci
npm --prefix frontend start
```

Open `http://localhost:4200`.

Select **Start / reset** in live mode to restore the deterministic employer scenario.

## Verification

```bash
dotnet restore PracticeOps.sln
dotnet build PracticeOps.sln --configuration Release --no-restore
dotnet test PracticeOps.sln --configuration Release --no-build
dotnet format PracticeOps.sln --verify-no-changes --no-restore
npm --prefix frontend ci
npm --prefix frontend run test -- --watch=false
npm --prefix frontend run build
```

## Repository map

```text
backend/PracticeOps.Api/                   API, domain, persistence, scenario, reset, outbox worker
backend/PracticeOps.Tests/                 Domain, metrics, scenario, and reset tests
frontend/src/practiceops-api.service.ts    Typed API requests
frontend/src/operational-refresh.store.ts  Shared refresh, recovery, and fallback state
frontend/src/portfolio-scenario.controller.ts Guided scenario actions
frontend/src/app.component.*               Six employer-facing workspaces
frontend/src/dashboard-model.ts            Typed dashboard and deterministic preview data
docs/portfolio-demo.md                     Employer demo and architecture walkthrough
docs/design/                               Code-first design translation and handoff
docs/superpowers/specs/                    Approved product specifications
docs/superpowers/plans/                    Implementation plans
.github/workflows/                         CI and responsive visual verification
docker-compose.yml                         PostgreSQL, RabbitMQ, and API stack
AGENTS.md                                  Engineering conventions
```

## Design sources

- Editable Figma specification: https://www.figma.com/design/fiI8ThH4h0nxU4iCjvZXQK
- Code-first implementation guide: [`docs/design/clinical-observatory-code-first.md`](docs/design/clinical-observatory-code-first.md)
- Browser source of truth: [`frontend/src/app.component.html`](frontend/src/app.component.html) and the styles under [`frontend/src`](frontend/src)

The browser implementation is the final source of truth for materials, lighting, motion, responsiveness, and accessibility. Figma remains the editable layout and interaction blueprint.

## Important boundary

All names, appointments, notes, claims, metrics, audit records, and scenario events are fictional demonstration data. PracticeOps is an engineering portfolio project, not a certified clinical system.

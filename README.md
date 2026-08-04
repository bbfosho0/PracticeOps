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
→ transactional outbox publication
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
- **Event Spectrum** for immutable audit records and truthful outbox publication state
- **System & Demo** for runtime mode, refresh state, scenario progress, architecture, and safety boundaries
- CSS-rendered aurora, signal fields, glass materials, orbit visualizations, and state-driven motion
- responsive desktop, tablet, and mobile layouts
- reduced-motion support and keyboard-visible focus states
- visibility-aware 45-second polling in live mode
- deterministic, read-only synthetic fallback when the API is unavailable

## Architecture and frontend ownership

```text
ASP.NET Core OpenAPI document
        |
        | pinned NSwag generation
        v
Generated TypeScript transport client
        |
        | handwritten validation and domain mapping
        v
PracticeOps API adapter
        |
        v
OperationalRefreshStore / PortfolioScenarioController
        |
        v
Angular 20 shell and six standalone workspaces
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

The Angular root component coordinates runtime state and routes explicit component events. Shell components live in `frontend/src/app/shell`; the Overview, Schedule, Documentation, Claims, Audit, and System workspaces live in their matching folders under `frontend/src/app`. Workspace components consume typed immutable inputs and do not own transport, polling, retry, fallback, or persistence policy.

`frontend/src/generated` is machine-owned. Regenerate it with the pinned NSwag tool; never add handwritten logic there. `frontend/src/app/api/practiceops-api.adapter.ts` is the handwritten boundary that validates generated DTOs, preserves Problem Details messages, and maps transport shapes into stable application models. Retry, stale-snapshot retention, visibility-aware polling, notices, and synthetic fallback remain in `OperationalRefreshStore`.

## Technology

| Area | Technology |
| --- | --- |
| Backend | .NET 8, ASP.NET Core, Minimal APIs |
| Persistence | Entity Framework Core, PostgreSQL |
| Messaging | RabbitMQ.Client, transactional outbox |
| Frontend | Angular 20, TypeScript, standalone components, signals, RxJS |
| Visual system | Tailwind CSS v4 structure and tokens, AutoAnimate, GSAP, custom CSS, inline SVG, WebGL2 atmosphere |
| API quality | OpenAPI, RFC 9457 Problem Details, health checks |
| Testing | xUnit, Jasmine/Karma, Storybook interactions/a11y, Playwright/axe |
| Delivery | Docker Compose, read-only GitHub Actions, responsive visual audit |

## Runtime behavior

### Live API mode

- The shared frontend store loads one authoritative dashboard snapshot.
- Successful mutations invalidate and refresh all workspaces immediately.
- Quiet polling runs every 45 seconds while the document is visible.
- Polling pauses when the browser tab is hidden.
- The last valid snapshot remains visible during transient failures.
- Outbox publication is shown as delivered only when the database record has `ProcessedAt`.

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

## Component workshop

Storybook renders 25 deterministic fictional states without calling the API. Start the workshop with:

```bash
npm --prefix frontend run storybook
```

Build the static workshop with:

```bash
npm --prefix frontend run build-storybook
```

`test-storybook` expects a server on `http://127.0.0.1:6006`. CI serves `frontend/storybook-static` and then runs:

```bash
npm --prefix frontend run test-storybook
```

## Generated API contract

Both API-contract commands require Docker because they start an isolated PostgreSQL, RabbitMQ, and API stack. They use a unique Compose project and clean up its containers, network, and volume when finished.

```bash
# Rewrite the committed machine-owned client.
npm --prefix frontend run api:generate

# Read-only: generate a temporary candidate and fail on drift.
npm --prefix frontend run api:check
```

## Browser verification

Install Chromium once, then run the synthetic-preview suite. This mode intentionally runs without the API and covers desktop, tablet, mobile, reduced motion, accessibility, keyboard operation, filtering, navigation, and responsive containment.

```bash
npm --prefix frontend run e2e:install
npm --prefix frontend run test:e2e
cd frontend
npx --no-install playwright test --project=mobile
cd ..
```

The live browser journey requires Docker services. On PowerShell:

```powershell
docker compose up --build --detach postgres rabbitmq api
$env:PRACTICEOPS_E2E_LIVE = '1'
Push-Location frontend
npx --no-install playwright test --project=desktop --grep="persists all five transitions"
npx --no-install playwright test --project=reduced-motion --grep="persists one scenario action"
Pop-Location
Remove-Item Env:PRACTICEOPS_E2E_LIVE
docker compose down --volumes --remove-orphans
```

The live tests use API calls only for readiness, deterministic setup, and independent verification. All journey transitions are performed through visible controls, and the final reset restores the fictional baseline.

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

The permanent `CI` workflow runs separately named, read-only jobs for backend restore/build/test/format, frontend unit/build, Storybook build/interactions/accessibility, generated-contract drift, the four-project synthetic Playwright matrix, the live Playwright journey, and the existing API/RabbitMQ portfolio journey. Superseded runs are cancelled, dependency caches are used, jobs have bounded timeouts, and browser diagnostics are uploaded only when a job fails. The separate visual-audit workflow retains the rendered responsive proof. No workflow commits or pushes generated files.

## Dependency health

The modernization updated Angular within major 20 and Storybook within major 9, reducing `npm audit` from 47 findings (including one critical) to 14 findings (13 moderate, one high). The remaining high finding is the exact `postcss@8.5.12` nested dependency of `@angular-devkit/build-angular@20.3.32`; npm offers only a breaking Storybook downgrade as its automated fix. The moderate remainder is confined to Angular CLI development tooling and Storybook 9's compatible test-runner/webpack chain. Clearing it requires a coordinated Angular/Storybook/test-runner migration, so no force install or incompatible override is used.

`dotnet list PracticeOps.sln package --vulnerable --include-transitive` reports no vulnerable packages. The outdated-package report is dominated by .NET 10 and test-runner major upgrades, which are intentionally deferred while the application targets .NET 8. Use supported Node 22 locally; Node 23 emits engine and non-LTS warnings. CI is pinned to Node 22.

## Repository map

```text
backend/PracticeOps.Api/                         API, domain, persistence, scenario, reset, outbox worker
backend/PracticeOps.Tests/                       Domain, metrics, scenario, and reset tests
frontend/src/app/shell/                          Persistent Angular shell surfaces
frontend/src/app/{overview,schedule,...}/        Six standalone workspace component trees
frontend/src/generated/                          Machine-owned NSwag transport client
frontend/src/app/api/practiceops-api.adapter.ts   Handwritten validation and domain mapping boundary
frontend/src/operational-refresh.store.ts         Shared refresh, recovery, polling, and fallback policy
frontend/src/portfolio-scenario.controller.ts     Guided scenario actions
frontend/src/app/testing/                         Deterministic fictional fixtures and Storybook providers
frontend/e2e/                                     Synthetic, live, responsive, a11y, and motion browser tests
docs/portfolio-demo.md                            Employer demo and architecture walkthrough
docs/design/                                      Code-first design translation and handoff
docs/superpowers/specs/                           Approved product specifications
docs/superpowers/plans/                           Implementation plans
.github/workflows/                                Read-only CI and responsive visual verification
docker-compose.yml                                PostgreSQL, RabbitMQ, and API stack
AGENTS.md                                         Engineering conventions
```

## Design sources

- Editable Figma specification: https://www.figma.com/design/fiI8ThH4h0nxU4iCjvZXQK
- Code-first implementation guide: [`docs/design/clinical-observatory-code-first.md`](docs/design/clinical-observatory-code-first.md)
- Browser source of truth: [`frontend/src/app.component.html`](frontend/src/app.component.html) and the styles under [`frontend/src`](frontend/src)

The browser implementation is the final source of truth for materials, lighting, motion, responsiveness, and accessibility. Tailwind provides structural tokens and reusable layout rules. AutoAnimate handles structural list and layout changes, GSAP handles authored state and SVG choreography, and custom CSS plus WebGL preserve the Clinical Observatory atmosphere. Figma remains the editable layout and interaction blueprint.

## Important boundary

All names, appointments, notes, claims, metrics, audit records, and scenario events are fictional demonstration data. PracticeOps is an engineering portfolio project, not a certified clinical system.

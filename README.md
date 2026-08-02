# PracticeOps

PracticeOps is a portfolio-grade behavioral-health operations platform built entirely with fictional data. It demonstrates workflow design, transactional persistence, auditability, event-driven integration, and a premium operational interface without claiming HIPAA certification or production compliance.

## Clinical Observatory interface

The frontend uses a code-first visual implementation called **Clinical Observatory**. The concept images remain the art-direction master, Figma provides the editable structural specification, and the browser implementation is the final source of truth for materials, lighting, motion, responsiveness, and accessibility.

The interface includes:

- **Operations Observatory** for schedule, documentation, claims risk, and activity signals
- **Temporal Runway** for provider capacity and appointment coordination
- **Documentation Continuum** for capture, review, signature, and billing readiness
- **Risk Constellation** for payer, filing, coding, and authorization exposure
- **Event Spectrum** for audit events, delivery health, and system observability
- **Workspace Parameters** for demo boundaries, roles, integrations, and system status
- CSS-rendered aurora, signal fields, glass materials, orbit visualizations, and motion
- responsive desktop, tablet, and mobile layouts
- reduced-motion support and keyboard-visible focus states
- automatic local synthetic fallback when the API is unavailable

## Product workflow

- Review today’s appointments, confirmation state, and check-ins.
- Track clinical notes from draft through signature.
- Prioritize claims that have validation or timely-filing risk.
- Inspect immutable operational activity.
- Persist domain events to an outbox and publish them to RabbitMQ.

## Architecture

```text
Angular 20 Clinical Observatory
        |
        | REST / JSON
        v
ASP.NET Core API
        |
        +-- Appointment workflow
        +-- Documentation workflow
        +-- Claims workflow
        +-- Audit timeline
        +-- Transactional outbox
        |
        +--> PostgreSQL
        |
        +--> RabbitMQ topic exchange
```

PracticeOps is intentionally a modular monolith. It keeps local development and transaction boundaries clear while still demonstrating asynchronous event delivery through the outbox pattern.

## Technology

| Area | Technology |
| --- | --- |
| Backend | .NET 8, ASP.NET Core, Minimal APIs |
| Persistence | Entity Framework Core, PostgreSQL |
| Messaging | RabbitMQ.Client, transactional outbox |
| Frontend | Angular 20, TypeScript, standalone components, signals |
| Visual system | CSS gradients, backdrop filters, SVG, responsive grid, reduced-motion media queries |
| API quality | OpenAPI, RFC 9457 Problem Details, health checks |
| Testing | xUnit domain tests, Jasmine model tests |
| Delivery | Docker Compose, GitHub Actions |

## Design sources

- Editable Figma specification: https://www.figma.com/design/fiI8ThH4h0nxU4iCjvZXQK
- Code-first implementation guide: [`docs/design/clinical-observatory-code-first.md`](docs/design/clinical-observatory-code-first.md)
- Browser source of truth: [`frontend/src/app.component.html`](frontend/src/app.component.html) and the component styles in [`frontend/src/app.component.css`](frontend/src/app.component.css) plus [`frontend/src/app.component.workspaces.css`](frontend/src/app.component.workspaces.css)

The Figma file is intentionally treated as a layout, component, token, and interaction blueprint. Atmospheric effects that do not translate reliably through Figma are implemented directly in CSS.

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

- API: `http://localhost:8081`
- Swagger: `http://localhost:8081/swagger`
- Readiness: `http://localhost:8081/health/ready`
- RabbitMQ management: `http://localhost:15672`

### Start the Angular frontend

```bash
cd frontend
npm install
npm start
```

Open `http://localhost:4200`.

The frontend remains fully navigable when the API is offline. It displays a clearly labeled local synthetic dataset and offers an API retry action.

## Verification

```bash
dotnet restore PracticeOps.sln
dotnet test PracticeOps.sln
npm --prefix frontend ci
npm --prefix frontend run test -- --watch=false
npm --prefix frontend run build
```

## Frontend structure

```text
frontend/src/main.ts                         Angular bootstrap
frontend/src/app.component.ts                workspace state, view models, API fallback
frontend/src/app.component.html              six complete operational workspaces
frontend/src/app.component.css               shell, atmosphere, navigation, and shared visual system
frontend/src/app.component.workspaces.css    workspace layouts, data visuals, motion, and responsive rules
frontend/src/dashboard-model.ts              typed dashboard data and pure derivation functions
frontend/src/app.spec.ts                     deterministic model tests
frontend/src/styles.css                      global fonts and document defaults
```

## Repository map

```text
backend/PracticeOps.Api/        API, domain, persistence, outbox worker
backend/PracticeOps.Tests/      Domain workflow tests
frontend/                       Angular Clinical Observatory application
docs/design/                    code-first design translation and handoff
docs/superpowers/specs/         product and architecture design
docs/superpowers/plans/         implementation plans
.github/workflows/ci.yml        backend and frontend verification
docker-compose.yml              PostgreSQL, RabbitMQ, and API stack
AGENTS.md                       engineering conventions
```

## Important boundary

All names, appointments, notes, claims, and metrics are fictional demonstration data. PracticeOps is an engineering portfolio project, not a certified clinical system.

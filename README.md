# PracticeOps

PracticeOps is a portfolio-grade behavioral-health practice operations platform built entirely with fictional data. It demonstrates enterprise workflow design, transactional persistence, auditability, event-driven integration, and a polished operations dashboard without claiming HIPAA certification or production compliance.

## Product workflow

- Review today’s appointments, confirmation state, and check-ins.
- Track clinical notes from draft through signature.
- Prioritize claims that have validation or timely-filing risk.
- Inspect immutable operational activity.
- Persist domain events to an outbox and publish them to RabbitMQ.

## Architecture

```text
Angular 20 dashboard
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
| API quality | OpenAPI, RFC 9457 Problem Details, health checks |
| Testing | xUnit domain tests |
| Delivery | Docker Compose, GitHub Actions |

## Figma design

Editable product design: https://www.figma.com/design/pipf33S4ZSF4RF04GzQM0W

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

- API: `http://localhost:8080`
- Swagger: `http://localhost:8080/swagger`
- Readiness: `http://localhost:8080/health/ready`
- RabbitMQ management: `http://localhost:15672`

### Start the Angular frontend

```bash
cd frontend
npm install
npm start
```

Open `http://localhost:4200`.

## Verification

```bash
dotnet restore PracticeOps.sln
dotnet test PracticeOps.sln
npm --prefix frontend install
npm --prefix frontend run build
```

## Repository map

```text
backend/PracticeOps.Api/        API, domain, persistence, outbox worker
backend/PracticeOps.Tests/      Domain workflow tests
frontend/                       Angular operations dashboard
docs/superpowers/specs/         Product and architecture design
docs/superpowers/plans/         Implementation plan
.github/workflows/ci.yml        Backend and frontend verification
docker-compose.yml              PostgreSQL, RabbitMQ, and API stack
AGENTS.md                        Engineering conventions
```

## Important boundary

All names, appointments, notes, claims, and metrics are fictional demonstration data. PracticeOps is an engineering portfolio project, not a certified clinical system.

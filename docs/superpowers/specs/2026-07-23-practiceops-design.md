# PracticeOps MVP Design

## Purpose

PracticeOps is a portfolio-grade behavioral-health practice operations application using fictional data. It demonstrates enterprise full-stack development through realistic workflows without claiming production compliance certification.

## Users

- Front-desk coordinators manage appointments and check-in status.
- Clinicians review documentation readiness and sign notes.
- Billing specialists triage claims at risk.
- Practice administrators review operational metrics and the audit timeline.

## MVP surfaces

1. Operations overview with appointment, note, claim, and utilization metrics.
2. Appointment queue with confirmation and check-in state.
3. Documentation readiness queue with controlled note transitions.
4. Claims risk queue with validation issues and exposure.
5. Immutable audit activity for important changes.

## Architecture

PracticeOps is a modular monolith. ASP.NET Core hosts REST endpoints, application services, persistence, outbox dispatch, health checks, and OpenAPI. PostgreSQL is the source of truth. Domain events are persisted in the same transaction as business changes, then a background dispatcher publishes them to RabbitMQ. Angular provides a standalone signal-based operations dashboard.

This approach demonstrates event-driven design while retaining simple local deployment and transaction boundaries.

## Core data

- Appointment: patient display name, clinician, scheduled time, service, status.
- Clinical note: appointment, clinician, status, due time, signed time.
- Claim: payer, amount, status, risk reason, updated time.
- Audit entry: actor, action, entity type, entity ID, timestamp, summary.
- Outbox message: event type, JSON payload, occurred time, processed time.

All seeded records are fictional.

## State rules

Appointment status follows `Scheduled -> Confirmed -> CheckedIn -> Completed`, with `Cancelled` permitted before completion.

Clinical note status follows `Draft -> AwaitingSignature -> Signed`. A signed note cannot return to an earlier state.

Claim status follows `Draft -> Ready -> Submitted -> Paid`, with `NeedsReview` available whenever validation or payer feedback requires intervention.

## API behavior

- Read endpoints return dashboard and queue projections.
- Mutation endpoints validate transitions and return RFC 9457 Problem Details for invalid operations.
- Role policies separate operational, clinical, billing, and administrative actions.
- Health endpoints distinguish liveness and readiness.

## Frontend

The desktop dashboard follows the companion Figma file. It uses a persistent dark navigation rail, high-contrast metric cards, schedule and documentation panels, claims risk, and recent audit activity. Angular services own API access, signals own view state, and components remain presentation-focused.

## Testing

- Domain unit tests cover state transitions.
- API tests cover dashboard response shape and invalid transition responses.
- Angular tests cover metric rendering and loading/error states.
- CI runs backend tests plus frontend test and production build.

## Delivery

Docker Compose starts PostgreSQL, RabbitMQ, the API, and the Angular development container. Configuration is environment-based and `.env.example` contains safe local defaults.

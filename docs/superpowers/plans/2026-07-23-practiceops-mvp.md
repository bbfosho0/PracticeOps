# PracticeOps MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a runnable behavioral-health practice operations portfolio application using fictional data.

**Architecture:** Use an ASP.NET Core modular monolith with PostgreSQL persistence and a transactional outbox that publishes domain events to RabbitMQ. Use an Angular standalone frontend with signals and typed API models.

**Tech Stack:** .NET 8, ASP.NET Core, Entity Framework Core, PostgreSQL, RabbitMQ.Client, Angular 20, TypeScript, Docker Compose, xUnit, GitHub Actions.

## Global Constraints

- Use fictional data only.
- Do not claim HIPAA certification or production compliance.
- Return RFC 9457 Problem Details for invalid API operations.
- Keep RabbitMQ delivery behind a transactional outbox.
- Keep the first release to dashboard, appointments, documentation, claims, and audit activity.

---

### Task 1: Repository foundation

- [ ] Add solution, projects, safe environment defaults, Docker Compose, and engineering guidance.
- [ ] Verify project restore and container configuration.
- [ ] Commit repository foundation.

### Task 2: Domain and persistence

- [ ] Write failing state-transition tests.
- [ ] Implement appointments, notes, claims, audit entries, and outbox entities.
- [ ] Add EF Core mappings and fictional seed data.
- [ ] Run backend tests and commit.

### Task 3: API and event delivery

- [ ] Add dashboard and queue endpoints.
- [ ] Add controlled transition endpoints with Problem Details failures.
- [ ] Add outbox dispatcher and RabbitMQ publisher.
- [ ] Add liveness, readiness, and OpenAPI.
- [ ] Run backend tests and commit.

### Task 4: Angular operations dashboard

- [ ] Add typed models and API service.
- [ ] Build the Figma-aligned dashboard shell and responsive panels.
- [ ] Add loading and error states.
- [ ] Run Angular tests and production build, then commit.

### Task 5: Delivery proof

- [ ] Add GitHub Actions verification.
- [ ] Add complete README, architecture diagram, demo accounts, and local setup.
- [ ] Run the full verification matrix.
- [ ] Open a pull request for review.

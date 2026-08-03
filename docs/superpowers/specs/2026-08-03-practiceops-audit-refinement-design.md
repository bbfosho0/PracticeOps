# PracticeOps Final Audit, Refinement, and Polish Design

**Date:** 2026-08-03  
**Status:** Approved through standing implementation authorization  
**Branch:** `feature/deployment-truthful-practiceops-mvp`

## Objective

Perform a final evidence-driven pass over PracticeOps without replacing its Clinical Observatory identity. Correct misleading semantics, remove remaining friction, improve readability and hierarchy, and strengthen automated proof that the persisted employer journey works through the browser.

## Audit findings

### 1. RabbitMQ state is overstated

The outbox dispatcher currently sets `ProcessedAt` after `BasicPublishAsync`, but the channel is not configured for publisher confirmations and no queue is bound to the topic exchange. The interface calls these records delivered. A broker connection alone is not proof of routing or downstream consumption.

### 2. Scenario completion conflates workflow completion with proof inspection

The sixth “inspect proof” step is marked complete as soon as the claim is submitted. That makes the progress indicator reach 100% before the reviewer opens the audit workspace.

### 3. Initial schedule date can diverge from the authoritative dataset

The frontend initializes the selected day from the reviewer’s local clock. The backend seeds and queries the current UTC day. Near date boundaries, the KPI can report 24 appointments while the selected schedule appears empty.

### 4. Refresh recovery can retain stale warning copy

A successful quiet poll clears the stale flag but may leave the prior failure notice visible because poll success intentionally supplies no notice text.

### 5. Employer-journey chrome dominates the product

The full scenario rail appears on every workspace. It consumes roughly 225 pixels on desktop and more than 500 pixels on a 390-pixel mobile viewport before the actual workspace content appears. The proof layer is also open by default on wide screens, duplicating explanatory content.

### 6. Microcopy is visually undersized

Many labels, table rows, statuses, and diagram annotations use 6–9 pixel text. The interface is visually distinctive but unnecessarily difficult to scan, especially in screenshots and on mobile.

### 7. Behavioral tests are shallower than the PR narrative

Current frontend tests cover pure helper functions and action mapping, but do not exercise the actual refresh store, fallback/recovery behavior, or controller-to-HTTP mutation flow. Backend acceptance tests verify the API journey, while the browser audit verifies only synthetic fallback rendering.

### 8. Some audit visuals imply measured telemetry that is actually derived decoration

Signals-per-minute, lag-style values, and hash-generated spectrum bars can appear like real observability measurements. The final pass will favor counts and timelines derived directly from audit/outbox records.

## Selected approach

Use a targeted production-truth pass rather than a cosmetic-only pass or a full redesign.

### Workstream A — truthful outbox publication

- Enable RabbitMQ publisher confirmations and confirmation tracking.
- Declare a durable portfolio audit queue and bind it to the topic exchange with `#`.
- Keep messages pending when publication is returned, nacked, or otherwise fails.
- Describe `ProcessedAt` as broker-confirmed publication, not downstream consumption.
- Replace user-facing “delivered” wording with “published” unless a consumer acknowledgement actually exists.
- Verify the durable queue receives the five scenario events in CI.

### Workstream B — coherent scenario semantics

- Count five persisted workflow transitions: appointment confirmation, note review, note signature, claim readiness, and claim submission.
- After the fifth transition, expose `inspect-proof` as the next navigation action without counting it as a persisted transition.
- Show `5 of 5 persisted transitions` and a separate `Proof ready` state.
- Keep scenario progress derived from authoritative entity status.

### Workstream C — state correctness

- Anchor the initial schedule view to the first authoritative appointment when no reviewer-selected day exists.
- Preserve manual date navigation across ordinary refreshes.
- Clear or replace stale-warning copy after successful recovery.
- Keep the last valid snapshot visible throughout transient failures.

### Workstream D — hierarchy and accessibility polish

- Show the full journey rail on Overview only.
- Use a compact current-step strip on other desktop workspaces.
- Hide the six-step list on mobile and prioritize current task, progress, and one primary action.
- Collapse the operator proof layer by default.
- Raise microcopy and table typography to practical minimums, improve muted contrast, and preserve layout density.
- Add consistent `:focus-visible` treatment and 40–44 pixel interactive targets where space allows.
- Add mobile bottom safe-area padding so fixed navigation never obscures actionable content.
- Retain reduced-motion behavior and the existing visual identity.

### Workstream E — verification depth

- Add Angular HTTP-backed tests for initial live load, synthetic fallback, stale snapshot retention, recovery, reset, and mutation-triggered refresh.
- Add controller integration tests that verify exact endpoints and status payloads.
- Extend CI with a live browser journey against PostgreSQL, RabbitMQ, and the API.
- Verify the UI progresses from 0/5 through 5/5, KPI values update, audit rows appear, and outbox publication reaches five confirmed messages.
- Extend visual checks for minimum touch targets, focus visibility, mobile safe-area spacing, and compact journey layout.

## Non-goals

- No authentication or authorization system.
- No real patient data.
- No HIPAA or production-compliance claim.
- No WebSockets or Server-Sent Events.
- No redesign of the six-workspace information architecture.
- No new administrative settings or fake integrations.
- No merge into `main` without an explicit merge instruction.

## Acceptance criteria

- Broker-confirmed publication is distinct from consumer delivery in code, copy, and documentation.
- Five persisted transitions produce five audit records and five routed RabbitMQ messages.
- Scenario progress reaches 100% only after the five persisted transitions; proof inspection remains a clear follow-up action.
- The schedule opens on the dataset’s actual day regardless of reviewer timezone.
- A recovered poll removes stale warning state and copy.
- On mobile, the first viewport exposes the current task and primary action without a 500-pixel step list.
- No primary operational text intentionally renders below 10 pixels on desktop or mobile.
- The proof layer is collapsed by default.
- Frontend store/controller behavior and the full live browser journey are tested.
- Backend, frontend, full-stack acceptance, and visual audit workflows pass on the exact PR head.

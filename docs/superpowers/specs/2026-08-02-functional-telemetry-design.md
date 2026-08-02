# Functional Telemetry and Layout Verification Design

## Goal

Make every displayed operational KPI and data visualization in PracticeOps derive from the current dashboard payload, make visible controls change real application state, and continuously verify that all six workspaces render without overlap, clipping, or console errors.

## Source of truth

- Backend records are the authoritative source when the API is available.
- The local synthetic dashboard must obey the same invariants as the backend payload.
- Frontend telemetry builders derive all displayed aggregates from the payload instead of duplicating hardcoded numbers.
- Decorative atmosphere remains visual only. Operational counts, percentages, progress values, chart geometry, risk nodes, pipeline stages, and status summaries must be data-driven.

## Functional requirements

### KPI consistency

The following values must reconcile with the arrays delivered in the same payload:

- Appointments today equals the number of appointments on the dashboard date.
- Unsigned notes equals notes whose status is not `Signed`.
- Claims at risk equals claims in `NeedsReview` or `Denied`.
- Claim exposure equals the sum of at-risk claim amounts.
- Team utilization equals active appointments divided by seven daily slots per unique clinician, clamped to 0 through 100.

The frontend must recalculate these values when receiving an API payload so stale or inconsistent metric fields cannot produce contradictory visuals.

### Data-driven workspaces

- Overview metric signals, documentation pipeline, claims topology, and recent activity derive from dashboard data.
- Schedule clinician load, capacity, reminders, no-show risk, provider rows, and runway blocks derive from appointments.
- Documentation backlog, signature aging, follow-up counts, and health metrics derive from notes and due dates.
- Claims payer watchlist, risk distribution, exposure bars, and recent actions derive from claims.
- Audit event categories, summary KPIs, and spectrum bars derive from audit events.
- Settings notification switches update local state and expose correct accessibility state.

### Synthetic data invariants

The bundled demo dataset must contain enough records to support the approved concept without fake aggregate values:

- 24 appointments across four clinicians.
- 24 notes, with exactly seven unsigned.
- 12 at-risk claims totaling $54,280.
- Audit records covering appointment, note, claim, delivery, and security categories.

### Interaction requirements

- Every navigation destination changes the active workspace and `aria-current` state.
- Day, Week, and List controls change rendered schedule mode.
- Schedule date controls change the selected date and update visible data or an empty state.
- Provider and service filters change visible appointments.
- Settings notification switches toggle and expose `aria-checked`.
- Retry API continues to restore live mode when the endpoint becomes available.

## Layout requirements

- Overview keeps the validated desktop composition: schedule left, documentation upper right, claims and activity below.
- Desktop captures cover all six workspaces at 1600 by 1000.
- Mobile captures cover all six workspaces at 390 by 844.
- No primary panel may overlap another panel, extend outside the viewport, or hide required controls.
- The bottom dock must expose all six destinations on mobile.

## Verification

- Pure telemetry builders receive deterministic unit tests.
- Backend dashboard metrics receive integration-level tests against seeded records.
- Headless Chrome checks every workspace, schedule mode, settings toggle, KPI reconciliation, layout rectangles, overflow, and console output.
- Existing Angular build, Angular tests, .NET build, .NET tests, and formatting checks remain required.

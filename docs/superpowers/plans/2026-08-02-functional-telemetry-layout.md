# Functional Telemetry and Layout Verification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make every operational number and visualization data-driven, make visible controls update real UI state, and verify every desktop and mobile workspace layout.

**Architecture:** Add pure telemetry builders that reconcile payload metrics and derive workspace-specific visual models. Keep the Angular component focused on signals and user interaction, while the backend seed and dashboard endpoint provide internally consistent synthetic records. Extend the existing visual-audit workflow into a functional browser audit.

**Tech Stack:** Angular 20, TypeScript 5.9, Jasmine/Karma, ASP.NET Core 8, Entity Framework Core, xUnit, GitHub Actions, headless Google Chrome CDP.

## Global Constraints

- Use fictional data only.
- Preserve the current Clinical Observatory visual language.
- Do not replace code-native UI with screenshots.
- Preserve live API mode and clearly labeled local fallback mode.
- Preserve keyboard focus and `prefers-reduced-motion` support.
- All aggregate values must reconcile with records in the same payload.

---

### Task 1: Telemetry invariants

**Files:**
- Create: `frontend/src/operational-telemetry.ts`
- Modify: `frontend/src/app.spec.ts`
- Modify: `frontend/src/dashboard-model.ts`

**Interfaces:**
- Produces `reconcileDashboard(dashboard, referenceDate?)`
- Produces `buildScheduleTelemetry(dashboard, referenceDate?)`
- Produces `buildDocumentationTelemetry(dashboard, referenceDate?)`
- Produces `buildAuditTelemetry(dashboard)`
- Produces `buildClinicianLoad(dashboard)`

- [ ] Write failing tests asserting metrics reconcile with arrays, demo invariants hold, and each telemetry builder changes when input records change.
- [ ] Run frontend tests and confirm failure because the telemetry module does not exist.
- [ ] Implement the pure telemetry module and update the demo dataset to satisfy the invariants.
- [ ] Run frontend tests and confirm all tests pass.
- [ ] Commit the telemetry model.

### Task 2: Component state and real controls

**Files:**
- Modify: `frontend/src/app.component.ts`
- Modify: `frontend/src/app.component.html`
- Modify: `frontend/src/app.component.workspaces.css`

**Interfaces:**
- Consumes telemetry builders from Task 1.
- Produces schedule date, mode, provider filter, service filter, and notification preference signals.

- [ ] Add failing browser-audit assertions for schedule mode, date changes, filtering, settings toggles, and KPI reconciliation.
- [ ] Confirm the visual audit fails on inert controls or stale values.
- [ ] Replace static component arrays and summary values with computed telemetry.
- [ ] Wire Day, Week, List, date navigation, provider/service filters, and notification switches.
- [ ] Add explicit empty states for filtered or date ranges with no records.
- [ ] Run frontend tests and production build.
- [ ] Commit component functionality.

### Task 3: Backend consistency

**Files:**
- Modify: `backend/PracticeOps.Api/PracticeOpsDbContext.cs`
- Modify: `backend/PracticeOps.Api/Program.cs`
- Modify: `backend/PracticeOps.Tests/DomainTransitionTests.cs`

**Interfaces:**
- Dashboard endpoint returns metrics derived from persisted records.
- Synthetic seed contains 24 appointments, 24 notes, 12 at-risk claims totaling $54,280, and representative audit events.

- [ ] Add failing backend tests for seeded counts, claim exposure, unsigned notes, and derived utilization.
- [ ] Confirm backend tests fail against the current small seed and fixed utilization.
- [ ] Expand synthetic seed data and extract a reusable dashboard metric calculator.
- [ ] Use the calculator in `/api/dashboard`.
- [ ] Run .NET build, tests, and format verification.
- [ ] Commit backend consistency.

### Task 4: Layout and interaction audit

**Files:**
- Modify: `.github/workflows/visual-audit.yml`
- Modify: `frontend/src/visual-layout-fixes.css` only if rendered evidence identifies a defect.

**Interfaces:**
- Produces desktop and mobile screenshots for all six workspaces.
- Produces `functional.json`, `layout.json`, and `console.json` audit evidence.

- [ ] Capture all six workspaces at 1600 by 1000 and 390 by 844.
- [ ] Verify no panel rectangles overlap unexpectedly, no primary content exceeds viewport width, and required controls are visible.
- [ ] Exercise all navigation buttons, schedule modes, one date change, one provider filter, and one settings toggle.
- [ ] Assert KPI text equals values calculated from the rendered record rows or embedded audit model.
- [ ] Fail the workflow on console exceptions, missing content, overlap, overflow, or inert interaction.
- [ ] Review screenshots against the approved Clinical Observatory images and correct any material layout issue.
- [ ] Commit the audit.

### Task 5: Final verification and merge

**Files:**
- Update PR description with verified behavior and remaining intentional read-only surfaces.

- [ ] Run GitHub Actions CI and Visual Audit from the final head commit.
- [ ] Confirm Angular tests and build pass.
- [ ] Confirm .NET build, tests, and formatting pass.
- [ ] Confirm the functional visual audit passes.
- [ ] Mark the PR ready and squash merge only after all evidence is green.

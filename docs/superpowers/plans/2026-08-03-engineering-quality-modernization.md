# PracticeOps Engineering Quality Modernization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Preserve the existing PracticeOps Clinical Observatory while decomposing the Angular frontend, adding Storybook, generating the TypeScript API client from OpenAPI, and introducing Playwright workflow verification.

**Architecture:** The root Angular component becomes a thin shell coordinator. Each workspace becomes a standalone component driven by typed inputs and explicit outputs. Generated transport code remains isolated behind a handwritten adapter. Storybook verifies isolated states, while Playwright verifies integrated live, synthetic, responsive, keyboard, and reduced-motion workflows.

**Tech Stack:** Angular 20.2, TypeScript 5.9, Storybook for Angular, NSwag, Playwright, axe-core, existing Tailwind CSS 4.3.3, AutoAnimate 0.10.0, GSAP 3.15.0, Jasmine, Karma, ASP.NET Core 8, PostgreSQL, RabbitMQ.

## Global Constraints

- Preserve all six existing workspaces and the persisted employer journey.
- Preserve live mode, stale snapshots, synthetic preview labels, transactional outbox truth, and current retry behavior.
- Preserve CSS, Tailwind, AutoAnimate, GSAP, SVG, and WebGL ownership boundaries.
- Maintain Angular 20 compatibility.
- Do not add ng-motion, another general animation engine, authentication, microservices, Kubernetes, or new product workflows.
- Generated code belongs only in `frontend/src/generated` and is never manually edited.
- Motion must not delay state, focus, live-region, or disabled-state updates.
- Every extraction must preserve rendered structure and behavior before proceeding.

---

### Task 1: Establish deterministic frontend fixtures and decomposition seams

**Files:**
- Create: `frontend/src/app/testing/practiceops-fixtures.ts`
- Create: `frontend/src/app/testing/practiceops-fixtures.spec.ts`
- Modify: `frontend/src/app.component.ts`

**Interfaces:**
- Produces: `createDashboardFixture()`, `createLiveRuntimeFixture()`, `createSyntheticRuntimeFixture()`, and frozen fixture types reused by Storybook and component tests.
- Produces: exported view metadata and workspace input-model interfaces required by later extraction tasks.

- [x] Write failing tests asserting fixtures are deterministic, deeply independent between calls, and contain the complete six-workspace scenario dataset.
- [x] Run `npm --prefix frontend test -- --watch=false` and confirm the new test fails because the fixture module does not exist.
- [x] Implement fixture factories using existing fictional baseline data and explicit cloning.
- [x] Export shared workspace view metadata and typed input models without changing runtime behavior.
- [x] Run all frontend tests and production build.
- [x] Commit with `test: add deterministic PracticeOps UI fixtures`.

### Task 2: Extract the shell and shared runtime components

**Files:**
- Create: `frontend/src/app/shell/command-dock.component.ts`
- Create: `frontend/src/app/shell/workspace-header.component.ts`
- Create: `frontend/src/app/shell/runtime-notice.component.ts`
- Create: `frontend/src/app/shell/observatory-shell.component.ts`
- Create matching `.html`, `.css`, and `.spec.ts` files where templates or styles are non-trivial.
- Modify: `frontend/src/app.component.ts`
- Modify: `frontend/src/app.component.html`
- Modify: `frontend/src/app.component.css`

**Interfaces:**
- `CommandDockComponent`: consumes navigation items, active view, and runtime mode; emits `viewSelected`.
- `WorkspaceHeaderComponent`: consumes active view metadata and runtime status.
- `RuntimeNoticeComponent`: consumes mode, notice, stale state, and retry availability; emits `retryRequested`.
- `ObservatoryShellComponent`: composes persistent shell surfaces and projects the active workspace.

- [x] Write component tests for selection events, runtime labels, retry events, and accessible names.
- [x] Extract markup without changing CSS selectors or rendered hierarchy used by motion and visual audits.
- [x] Keep atmosphere rendering and application services at the top-level coordinator.
- [x] Run frontend tests and production build.
- [x] Commit with `refactor: extract PracticeOps application shell`.

### Task 3: Extract overview and schedule workspaces

**Files:**
- Create: `frontend/src/app/overview/overview-workspace.component.*`
- Create: `frontend/src/app/overview/metric-signal-strip.component.*`
- Create: `frontend/src/app/schedule/schedule-workspace.component.*`
- Create: `frontend/src/app/schedule/schedule-filters.component.*`
- Create: `frontend/src/app/schedule/temporal-runway.component.*`
- Modify: `frontend/src/app.component.ts`
- Modify: `frontend/src/app.component.html`
- Move only workspace-specific CSS from existing styles into the new component stylesheets.

**Interfaces:**
- Overview receives metrics, pipeline, risk distribution, documentation telemetry, audit telemetry, and navigation callbacks.
- Schedule receives appointments, selected date, mode, filter options, selected filters, telemetry, clinician load, and runway blocks; emits filter and mode changes.

- [x] Write tests for empty, populated, filtered, day, week, and list states.
- [x] Extract pure filtering or view-model logic into focused exported functions when component tests would otherwise require private implementation access.
- [x] Preserve AutoAnimate attachment points and GSAP workspace-motion boundaries.
- [x] Run all frontend tests and production build.
- [x] Commit with `refactor: extract overview and schedule workspaces`.

### Task 4: Extract documentation, claims, audit, and system workspaces

**Files:**
- Create workspace components under `frontend/src/app/documentation`, `claims`, `audit`, and `system`.
- Create focused child components for claims filters/table, documentation queue/pipeline, audit timeline/spectrum, and scenario controls.
- Move `risk-topology.component.*` under `frontend/src/app/claims` while preserving its selector and behavior.
- Modify: `frontend/src/app.component.ts`
- Modify: `frontend/src/app.component.html`

**Interfaces:**
- Each workspace consumes immutable typed input models and emits explicit user intents.
- No workspace imports `OperationalRefreshStore` or `PortfolioScenarioController` directly.
- Root coordinator maps service state to workspace inputs and output handlers.

- [x] Write tests for populated, empty, mutation-pending, synthetic-disabled, stale, and completed scenario states.
- [x] Extract components one workspace at a time and run the complete frontend suite after each extraction.
- [x] Reduce `AppComponent` to navigation, shared services, top-level derived state, and event handlers.
- [x] Run production build and existing responsive visual audit.
- [x] Commit with `refactor: decompose remaining PracticeOps workspaces`.

### Task 5: Add Storybook and isolated state coverage

**Files:**
- Modify: `frontend/package.json`
- Modify: `frontend/package-lock.json`
- Create: `frontend/.storybook/main.ts`
- Create: `frontend/.storybook/preview.ts`
- Create stories beside extracted components.
- Create: `frontend/src/app/testing/storybook-providers.ts`

**Interfaces:**
- Adds scripts: `storybook`, `build-storybook`, and `test-storybook`.
- Stories consume deterministic factories from Task 1 and never call the live API.

- [x] Initialize the current Angular-compatible Storybook release and configure application styles, fonts, and providers.
- [x] Add accessibility and interaction-test support.
- [x] Add the approved state matrix for metric strip, runtime notice, claims, schedule, and scenario controls.
- [x] Add play-function tests for filters, view-mode changes, retry events, and mutation events.
- [x] Run Storybook build and component tests.
- [x] Commit with `test: add Storybook component-state workshop`.

### Task 6: Generate and isolate the OpenAPI client

**Files:**
- Create: `backend/PracticeOps.Api/nswag.json`
- Create: `frontend/src/generated/practiceops-api-client.ts`
- Create: `frontend/src/app/api/practiceops-api.adapter.ts`
- Create: `frontend/src/app/api/practiceops-api.adapter.spec.ts`
- Modify: existing frontend API service and stores to depend on the adapter.
- Modify: solution or project build targets as needed for deterministic OpenAPI output.

**Interfaces:**
- `PracticeOpsApiAdapter` preserves existing application-facing method signatures and error semantics.
- NSwag-generated classes remain internal to the adapter.

- [x] Write adapter contract tests using a fake generated client.
- [x] Configure NSwag to generate an Angular-compatible TypeScript client from the ASP.NET Core OpenAPI document.
- [x] Generate and commit the client.
- [x] Replace direct transport calls with the adapter without changing store behavior.
- [x] Add `api:generate` and `api:check` scripts, where `api:check` fails on generated diffs.
- [x] Run backend build/tests, frontend tests, and frontend production build.
- [x] Commit with `feat: generate frontend client from OpenAPI`.

### Task 7: Add Playwright workflow and responsive verification

**Files:**
- Modify: `frontend/package.json`
- Modify: `frontend/package-lock.json`
- Create: `frontend/playwright.config.ts`
- Create: `frontend/e2e/synthetic-preview.spec.ts`
- Create: `frontend/e2e/live-scenario.spec.ts`
- Create: `frontend/e2e/responsive-accessibility.spec.ts`
- Create: `frontend/e2e/helpers.ts`

**Interfaces:**
- Adds scripts: `e2e`, `e2e:ui`, and `e2e:install`.
- Defines desktop 1440x1000, tablet 900x1100, mobile 390x844, and reduced-motion projects.

- [x] Add synthetic-preview tests with the API intentionally unavailable.
- [x] Add live scenario tests covering reset, persisted actions, refresh across workspaces, audit events, and outbox truth.
- [x] Add claims filtering and schedule mode tests.
- [x] Add mobile overflow, keyboard navigation, accessible-name, axe, and reduced-motion assertions.
- [x] Configure traces and screenshots on failure.
- [x] Run all Playwright projects against local services.
- [x] Commit with `test: add Playwright workflow verification`.

### Task 8: Integrate CI, documentation, and final verification

**Files:**
- Modify existing workflows under `.github/workflows`.
- Modify: `README.md`
- Modify: `docs/portfolio-demo.md`
- Modify: `AGENTS.md` if repository workflow instructions need updating.

**Interfaces:**
- CI gates frontend unit tests, Storybook build/tests, generated-client no-diff check, backend tests/formatting, and Playwright workflows.
- Failure artifacts include Playwright traces and screenshots.

- [x] Add cached deterministic CI jobs without duplicating existing exact-head protections.
- [x] Document the component architecture, Storybook commands, API generation, and Playwright workflow.
- [x] Document which tests require Docker services.
- [x] Run `dotnet restore`, build, tests, and formatting verification.
- [x] Run `npm ci`, frontend tests, frontend build, Storybook build/tests, API generation check, and Playwright.
- [x] Review the complete branch for visual regressions, generated-code leakage, duplicate motion ownership, and stale documentation.
- [x] Commit with `chore: complete PracticeOps modernization verification`.

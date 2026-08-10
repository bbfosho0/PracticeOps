# Quiet Command Center Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply the approved quiet command-center visual system across the PracticeOps shell and navigable workspaces, then verify desktop/mobile hierarchy, interaction states, accessibility, and build health.

**Architecture:** Keep existing Angular standalone components, signals, stores, and generated API boundaries. Centralize visual tokens in existing stylesheet boundaries, then tune each workspace stylesheet/template only where hierarchy or state needs to change. Use Playwright/Storybook as rendered evidence.

**Tech Stack:** Angular 20 standalone components, TypeScript, CSS, Storybook 9, Playwright, Jasmine/Karma.

## Global Constraints

- Preserve the synthetic-data behavioral-health demo boundary; never claim HIPAA certification or production compliance.
- Keep business rules inside domain/application classes, not controllers or Angular components.
- Treat `frontend/src/generated` as machine-owned.
- Preserve existing API contracts and Problem Details responses.
- Preserve unrelated local changes in `frontend/angular.json`, `.claude/`, and `frontend/qa-observatory.png`.
- Support 390x844, tablet, 1280x800, and 1440x900 without horizontal overflow.
- Keep reduced-motion behavior and visible keyboard focus.

## File map

- Shared visual layer: `frontend/src/styles.css`, `frontend/src/visual-polish.css`, `frontend/src/responsive-telemetry.css`.
- Shell: `frontend/src/app/shell/observatory-shell.component.{html,css,ts}`, `workspace-header.component.{html,css,ts}`, and `command-dock.component.{html,css,ts}`.
- Overview: `frontend/src/app/overview/**` and its focused specs.
- Workspaces: `frontend/src/app/{schedule,documentation,claims,audit,system}/**` and focused specs.
- Verification: existing frontend tests, Storybook build, Playwright e2e, viewport screenshots, console and accessibility checks.

---

### Task 1: Establish quiet visual tokens

**Files:** Modify shared styles listed above; test with shell specs.

- [ ] Inspect current token/override order:

```powershell
rg -n "--|font-family|box-shadow|border|glow|@media|@container" frontend/src/styles.css frontend/src/visual-polish.css frontend/src/responsive-telemetry.css frontend/angular.json
```

- [ ] Add canvas, nav, work, secondary, border, text, signal, radius, spacing, shadow, and motion variables. Keep the dark blue palette; reserve glow for active/urgent states.
- [ ] Add global typography, tabular numerals, consistent controls, visible `:focus-visible`, and 44px practical touch targets.
- [ ] Add overflow guardrails and reduced-motion overrides at 390px and desktop widths.
- [ ] Run `npm --prefix frontend test -- --watch=false` and `git diff --check`.
- [ ] Commit: `git add frontend/src/styles.css frontend/src/visual-polish.css frontend/src/responsive-telemetry.css; git commit -m "style: establish quiet command center tokens"`.

### Task 2: Simplify the shared shell

**Files:** Modify the three shell component families above and `frontend/src/app.spec.ts`; test shell specs.

- [ ] Add assertions that each workspace has an accessible name, selected navigation exposes `aria-current="page"`, and clicking a workspace changes the heading.
- [ ] Group brand, workspaces, and system controls semantically without changing `activeView`, `selectView`, or runtime state ownership.
- [ ] Reduce rail glow/borders, give the active item one calm accent, align header actions, and make the runtime/API notice a distinct system banner.
- [ ] Add keyboard/focus behavior and a single compact mobile navigation pattern.
- [ ] Run `npm --prefix frontend test -- --watch=false`.
- [ ] Commit: `git add frontend/src/app/shell frontend/src/app.spec.ts; git commit -m "feat: clarify PracticeOps workspace shell"`.

### Task 3: Rebalance Overview into triage

**Files:** Modify `frontend/src/app/overview/**`; test focused Overview specs.

- [ ] Assert one primary work region, four metric signals, labeled supporting modules, and explicit view actions.
- [ ] Reorder presentation markup so work/exception content leads, metrics stay compact, and topology/activity become evidence modules; preserve bindings and callbacks.
- [ ] Tune metric cards for readable values, semantic text summaries, and fewer competing borders/glows.
- [ ] Tune schedule rows and supporting modules so work is visually stronger than evidence.
- [ ] Run focused specs, click schedule/documentation/claims actions in Playwright, and inspect console output.
- [ ] Commit: `git add frontend/src/app/overview; git commit -m "feat: rebalance observatory overview for triage"`.

### Task 4: Apply workspace-specific hierarchy and states

**Files:** Modify `frontend/src/app/{schedule,documentation,claims,audit,system}/**`; update adjacent focused specs.

- [ ] Inventory exact boundaries and current state contracts:

```powershell
rg -n "selector:|@Input|input\(|signal\(|button|aria-|status|loading|empty|error" frontend/src/app/schedule frontend/src/app/documentation frontend/src/app/claims frontend/src/app/audit frontend/src/app/system
```

- [ ] Add tests for primary queue/timeline headings, status text that does not rely on color, empty/error copy, action names, and selected/expanded states.
- [ ] Make Schedule timeline-first; Documentation queue-first with owner/age/next action; Claims risk/financial impact-first; Audit actor/time/action-first; System grouped and explicit about disabled persisted actions.
- [ ] Run `npm --prefix frontend test -- --watch=false` and `git diff --check`.
- [ ] Commit: `git add frontend/src/app/schedule frontend/src/app/documentation frontend/src/app/claims frontend/src/app/audit frontend/src/app/system; git commit -m "feat: clarify PracticeOps workspace workflows"`.

### Task 5: Rendered responsive QA and fixes

**Files:** Modify any changed styles/templates identified by QA; use temporary local captures unless repository QA conventions require checked-in evidence.

- [ ] Start Angular on a verified available port without killing unrelated listeners; use supported Node 22 if the current runtime blocks startup.
- [ ] Capture Overview at 390x844, tablet, 1280x800, and 1440x900; record screenshot, dimensions, scroll width, hierarchy, and console errors.
- [ ] Navigate every workspace, verify heading/content changes, exercise one primary action/expansion per workspace, and verify focus/selected states.
- [ ] Run axe/Playwright support where configured; manually verify accessible names, `aria-current`, expanded state, and reduced motion.
- [ ] Fix P0/P1/P2 findings and repeat captures until overflow, contrast, hierarchy, and state behavior are correct.
- [ ] Run:

```powershell
dotnet test PracticeOps.sln
npm --prefix frontend test -- --watch=false
npm --prefix frontend run build
npm --prefix frontend run build-storybook
git diff --check
```

- [ ] Inspect `git status -sb`, `git diff --stat`, and `git log -5 --oneline`; report exact evidence and remaining gaps.

# Observatory Motion Orchestration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans. Use test-driven-development for the motion policy and verification-before-completion before integration.

**Goal:** Integrate AutoAnimate and GSAP into PracticeOps with clear ownership, reduced-motion support, deterministic cleanup, and no regression to the existing functional visual audit.

**Architecture:** AutoAnimate is applied directly to dynamic Angular parent containers. GSAP is isolated behind a workspace-motion directive, the KPI motion directive, and the inline SVG topology component. A pure motion-policy module centralizes durations and compact/reduced behavior.

**Tech Stack:** Angular 20, TypeScript 5.9, `@formkit/auto-animate` 0.10.0, GSAP 3.15.0, Jasmine, Karma.

### Task 1: Preserve the incremental Tailwind boundary

**Files:**
- Modify: `frontend/src/styles.css`

- [ ] Import Tailwind theme and utilities without Preflight.
- [ ] Confirm the legacy observatory retains its original inherited line-height and control metrics.
- [ ] Confirm the 390 px journey rail returns below the existing 360 px audit limit.

### Task 2: Add runtime motion dependencies

**Files:**
- Modify: `frontend/package.json`
- Modify: `frontend/package-lock.json`

- [ ] Add exact runtime dependencies `@formkit/auto-animate@0.10.0` and `gsap@3.15.0`.
- [ ] Regenerate the lockfile through npm.
- [ ] Verify `npm ci` from the generated lockfile.

### Task 3: Add the motion policy using TDD

**Files:**
- Create: `frontend/src/motion-policy.spec.ts`
- Create: `frontend/src/motion-policy.ts`

- [ ] Write tests for desktop, compact, and reduced-motion profiles.
- [ ] Write tests for bounded metric tween duration.
- [ ] Run the test suite and confirm the tests fail because the policy module does not exist.
- [ ] Implement the minimal pure functions required by the tests.
- [ ] Run the complete test suite and confirm green.

### Task 4: Integrate AutoAnimate for structural changes

**Files:**
- Modify: `frontend/src/app.component.ts`
- Modify: `frontend/src/app.component.html`

- [ ] Import `AutoAnimateDirective` into the standalone application component.
- [ ] Attach `auto-animate` to the schedule workspace, schedule lists, claims table, recent activity list, and scenario actions.
- [ ] Avoid broad shell-level attachment and avoid SVG parents.
- [ ] Confirm filtering and day/week/list replacement still work.

### Task 5: Add GSAP workspace choreography

**Files:**
- Create: `frontend/src/observatory-view-motion.directive.ts`
- Modify: `frontend/src/app.component.ts`
- Modify: `frontend/src/app.component.html`

- [ ] Add a standalone directive driven by `activeView()`.
- [ ] Animate changed header copy and current view surfaces after Angular renders them.
- [ ] Leave persistent navigation, scenario rail, runtime notice, and proof layer stable.
- [ ] Kill prior timelines before a new transition and on destroy.
- [ ] Render final state immediately in reduced-motion mode.

### Task 6: Move KPI interpolation to GSAP

**Files:**
- Modify: `frontend/src/metric-value-motion.directive.ts`

- [ ] Replace the manual requestAnimationFrame interpolator with a GSAP object tween.
- [ ] Keep initial render immediate.
- [ ] Keep number formatting and update-state class behavior.
- [ ] Use bounded durations from `motion-policy.ts`.
- [ ] Kill active tweens and timers during cleanup.

### Task 7: Add GSAP SVG topology choreography

**Files:**
- Modify: `frontend/src/risk-topology.component.ts`
- Modify: `frontend/src/risk-topology.component.html`
- Modify: `frontend/src/risk-topology.component.css`

- [ ] Add an SVG view reference.
- [ ] Reveal center state, paths, and nodes with a restrained timeline.
- [ ] Start a low-frequency path-flow tween only after entrance completes.
- [ ] Re-run motion when topology inputs change.
- [ ] Remove the competing CSS path-flow animation.
- [ ] Kill all timelines, tweens, and frames on destroy.
- [ ] Render final state without looping motion for reduced-motion users.

### Task 8: Verify and clean up

**Files:**
- Delete: `.github/workflows/tailwind-layout-diagnostic.yml`
- Delete: `docs/diagnostics/tailwind-mobile-rail.json`
- Update: `README.md`

- [ ] Remove temporary layout diagnostics.
- [ ] Document AutoAnimate and GSAP ownership in the visual-system section.
- [ ] Run all 30+ Angular tests.
- [ ] Run Angular production build.
- [ ] Run backend build, tests, formatting, and persisted portfolio journey.
- [ ] Run all six desktop and mobile functional browser audits.
- [ ] Verify exact-head CI before merge.

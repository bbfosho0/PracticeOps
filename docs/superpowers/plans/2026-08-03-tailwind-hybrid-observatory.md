# Tailwind Hybrid Observatory Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a production-ready Tailwind v4 structural design system and a data-driven inline SVG risk topology without replacing PracticeOps' custom Clinical Observatory effects.

**Architecture:** Tailwind and PostCSS provide semantic tokens and reusable structural rules. Existing Angular templates keep semantic class names, with a component-scoped stylesheet applying Tailwind utilities. Custom SVG and CSS remain responsible for visualization geometry and state-driven effects.

**Tech Stack:** Angular 20, TypeScript 5.9, Tailwind CSS 4.3.3, PostCSS 8.5.23, Jasmine, Karma, SVG, existing CSS/WebGL.

## Global Constraints

- Preserve all backend APIs, persisted workflows, synthetic fallback behavior, and runtime truth labels.
- Do not claim HIPAA certification or production compliance.
- Preserve keyboard navigation, visible focus states, and `prefers-reduced-motion` behavior.
- Do not replace custom geometry, WebGL, aurora, signal, or topology effects with a generic component library.
- Keep the migration incremental and reversible.

---

### Task 1: Tailwind build and token layer

**Files:**
- Modify: `frontend/package.json`
- Modify: `frontend/package-lock.json`
- Create: `frontend/.postcssrc.json`
- Modify: `frontend/src/styles.css`

**Interfaces:**
- Produces: Tailwind v4 utilities and semantic theme tokens available to Angular global and component styles.

- [ ] Add exact development dependencies `tailwindcss@4.3.3`, `@tailwindcss/postcss@4.3.3`, and `postcss@8.5.23`.
- [ ] Configure `@tailwindcss/postcss` in `.postcssrc.json`.
- [ ] Import Tailwind before existing global imports.
- [ ] Define semantic colors, radii, shadows, fonts, and the `3xl` breakpoint using `@theme`.
- [ ] Run `npm --prefix frontend install` to update the lockfile.
- [ ] Run `npm --prefix frontend run build` and confirm PostCSS processes the theme without errors.

### Task 2: Structural observatory layer

**Files:**
- Create: `frontend/src/tailwind-structure.css`
- Modify: `frontend/src/app.component.ts`

**Interfaces:**
- Consumes: theme tokens from `frontend/src/styles.css`.
- Produces: consistent shell, panel, metric, control, status, and responsive layout styling through existing semantic selectors.

- [ ] Add `tailwind-structure.css` last in `AppComponent.styleUrls`.
- [ ] Reference the global Tailwind theme.
- [ ] Apply shared shell, header, grid, panel, button, chip, focus, and responsive rules to existing selectors.
- [ ] Keep specialized geometry and animations in their current stylesheets.
- [ ] Run the Angular production build and inspect for unknown utility or theme-token errors.

### Task 3: Risk topology model using TDD

**Files:**
- Create: `frontend/src/risk-topology.spec.ts`
- Create: `frontend/src/risk-topology.ts`

**Interfaces:**
- Consumes: `readonly RiskSlice[]` from `dashboard-model.ts`.
- Produces: `buildRiskTopologyNodes(slices): readonly RiskTopologyNode[]`.

- [ ] Write tests that require deterministic coordinates, preserved counts, center-origin paths, and an empty result for empty input.
- [ ] Run `npm --prefix frontend test -- --watch=false` and confirm failure because `risk-topology.ts` does not exist.
- [ ] Implement `RiskTopologyNode` and `buildRiskTopologyNodes` with a fixed responsive viewBox coordinate system.
- [ ] Run the complete Angular test suite and confirm the new tests pass.

### Task 4: Accessible inline SVG component

**Files:**
- Create: `frontend/src/risk-topology.component.ts`
- Create: `frontend/src/risk-topology.component.html`
- Create: `frontend/src/risk-topology.component.css`
- Modify: `frontend/src/app.component.ts`
- Modify: `frontend/src/app.component.html`

**Interfaces:**
- Inputs: `slices: readonly RiskSlice[]`, `totalAtRisk: number`.
- Output: responsive SVG visualization with accessible text equivalent.

- [ ] Create a standalone OnPush Angular component using signal inputs and a computed node list.
- [ ] Render rings, center state, curved connections, category nodes, counts, and exposure labels as inline SVG.
- [ ] Add an SVG title and description plus a screen-reader category list.
- [ ] Add custom path-flow, node-breathing, tone, focus, and reduced-motion styles.
- [ ] Import the component into `AppComponent`.
- [ ] Replace the overview CSS-only risk radar with `app-risk-topology` while preserving the existing claims navigation action.
- [ ] Run the complete Angular test suite and production build.

### Task 5: Documentation and repository verification

**Files:**
- Modify: `README.md`

**Interfaces:**
- Produces: accurate setup and architecture documentation for future contributors.

- [ ] Update the visual-system technology row to describe Tailwind structure plus CSS, SVG, and WebGL effects.
- [ ] Document the hybrid source-of-truth rule in the design section.
- [ ] Run `dotnet test PracticeOps.sln`.
- [ ] Run `npm --prefix frontend ci`.
- [ ] Run `npm --prefix frontend test -- --watch=false`.
- [ ] Run `npm --prefix frontend run build`.
- [ ] Open a pull request and verify GitHub Actions against the exact head commit.

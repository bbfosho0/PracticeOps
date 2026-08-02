# Clinical Observatory Fidelity Pass Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bring the rendered PracticeOps browser UI materially closer to the approved Clinical Observatory concept images while preserving usability, responsiveness, and accessibility.

**Architecture:** Keep the existing Angular component structure and data flow intact. Add a focused visual-polish stylesheet loaded after the component styles, then validate the rendered desktop and mobile app through a headless-Chrome screenshot workflow. Iterate only on visible fidelity gaps, not product behavior.

**Tech Stack:** Angular 20, TypeScript, CSS, SVG, GitHub Actions, headless Google Chrome.

## Global Constraints

- The approved Clinical Observatory images remain the art-direction master.
- Figma remains the editable structure and token blueprint.
- The browser remains the final source of truth for atmosphere, materials, motion, responsiveness, and accessibility.
- Preserve all six workspaces and current API/fallback behavior.
- Add no runtime dependencies.
- Keep all patient, provider, claims, and operational data fictional.
- Respect `prefers-reduced-motion` and visible keyboard focus.

---

### Task 1: Add the visual-fidelity layer

**Files:**
- Create: `frontend/src/visual-polish.css`
- Modify: `frontend/angular.json`

**Interfaces:**
- Consumes: Existing `.observatory`, `.workspace`, `.glass-panel`, `.command-dock`, chart, pipeline, runway, and responsive selectors.
- Produces: A late-loaded CSS layer that refines the approved visual language without changing Angular templates or data behavior.

- [ ] **Step 1: Add stronger canvas depth and view-aware atmosphere**

Add a framed observatory canvas, view-specific aurora hue, vignette, subtle noise, horizon glow, and controlled particle depth.

- [ ] **Step 2: Refine graphite glass materials**

Add spectral edge highlights, inner illumination, restrained hover elevation, stronger selected states, and consistent panel radii.

- [ ] **Step 3: Refine typography and hierarchy**

Improve editorial heading contrast, label tracking, muted-text legibility, and metric emphasis without changing visible copy.

- [ ] **Step 4: Refine signature visualizations**

Strengthen the runway beam, documentation continuum, claims constellation, audit spectrum, settings integration orbit, and status telemetry.

- [ ] **Step 5: Preserve responsive and reduced-motion behavior**

Ensure the late-loaded layer does not introduce mobile overflow, clipped content, or motion when reduced motion is requested.

### Task 2: Add repeatable rendered visual QA

**Files:**
- Create: `.github/workflows/visual-audit.yml`

**Interfaces:**
- Consumes: Angular production build and synthetic API fallback.
- Produces: Desktop and mobile PNG screenshots as a GitHub Actions artifact.

- [ ] **Step 1: Build the Angular app in CI**

Run `npm ci` and `npm run build` from `frontend`.

- [ ] **Step 2: Serve the production output**

Use Python's static HTTP server against `frontend/dist/practiceops/browser`.

- [ ] **Step 3: Capture desktop and mobile screenshots**

Use preinstalled headless Google Chrome at 1600x1000 and 390x844, then upload both images as the `clinical-observatory-visual-audit` artifact.

### Task 3: Verify and iterate

**Files:**
- Modify only if visual evidence identifies a concrete fidelity defect.

**Interfaces:**
- Consumes: Approved concept/Figma evidence and CI screenshot artifacts.
- Produces: A mismatch ledger with each material issue fixed or explicitly justified.

- [ ] **Step 1: Verify build and test health**

Run the existing CI workflow and confirm backend and frontend jobs pass.

- [ ] **Step 2: Inspect desktop screenshot**

Check composition, typography, aurora placement, panel material, visual density, icon treatment, and first-viewport balance.

- [ ] **Step 3: Inspect mobile screenshot**

Check navigation, wrapping, overflow, control sizing, panel stacking, readable type, and visual continuity.

- [ ] **Step 4: Exercise a workspace interaction**

Confirm a navigation control changes the rendered workspace without runtime errors.

- [ ] **Step 5: Commit final corrections and merge**

Open a focused PR, wait for CI success, and merge only after the screenshot evidence passes the fidelity review.

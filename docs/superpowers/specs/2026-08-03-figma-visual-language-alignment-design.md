# Figma visual-language alignment — Operations Observatory

**Date:** 2026-08-03
**Status:** Approved, ready for implementation plan

## Context

The Figma spec at `https://www.figma.com/design/fiI8ThH4h0nxU4iCjvZXQK` ("01 Overview" /
"Operations Observatory" frame) defines the target visual language for PracticeOps: a
dark space-observatory dashboard with glowing accent nodes, a slim icon rail, a single-row
header, and compact panel spacing.

An audit comparing the Figma target against the running app (`ng serve`, all six workspace
views: Overview, Schedule, Docs, Claims, Audit, System) found the core visual language is
already close, but several structural and bug-level gaps keep it from matching. This spec
covers closing those gaps.

Source screenshots referenced during the audit (Figma target, current app per view) were
captured to a scratch directory during brainstorming and are not part of this repo.

## Goals

- Align global chrome (header, status indicators, scenario tracker) with Figma's slim,
  single-row treatment, applied once in shared shell markup so it benefits all six views.
- Fix two concrete rendering bugs found during the audit.
- Apply Figma's softer glow/typography treatment as a shared style change.
- Preserve the existing "persisted employer journey" scenario/proof feature — it is
  intentional product surface, not scaffolding to delete — but stop it from dominating
  the top of every view.

## Non-goals

- No pixel-for-pixel layout matching. Figma is a visual-language reference; real dynamic
  data (variable schedule row counts, etc.) and the scenario/proof UI are allowed to make
  the shipped layout diverge from Figma's static mock.
- No new features beyond what's listed below.

## Design

### 1. Header: single-row, single status pill

Today's header renders three separate elements: a `Refresh` button, a `SYNTHETIC PREVIEW`
pill, and a `NOT CONNECTED YET` pill, plus the avatar. Figma's header uses one compact
pill (`● LIVE TELEMETRY`) alongside a `Synthetic demo` pill and avatar.

Merge the mode + connection state into a single status pill, e.g.
`● Synthetic preview · Retry` (the retry action lives inside the pill when disconnected,
and disappears when connected). Move `Refresh` to a small icon-only button next to the
avatar, matching Figma's tighter right-side cluster.

This is shell-level markup (used by every view via the observatory shell component), so
the change applies once and benefits all six views.

### 2. Persisted-journey tracker: collapsible strip

The "Persisted employer journey" panel (5-step tracker + action buttons) currently renders
full-size on every view, pushing all page content down by roughly 230px before any real
content appears. Figma has no equivalent element eating that space.

Default state becomes a single-line collapsed strip:

```
Step 1 of 5 · Resolve one exception from schedule to revenue proof   [Expand ▾]
```

Clicking expands it in place to today's full tracker (5 numbered steps + action buttons),
matching current visual design when expanded. Collapse/expand state is a single piece of
UI state shared across views (it's the same journey regardless of which workspace view is
active), not per-view state — navigating between views preserves whether it's open.

Default is collapsed on load.

### 3. "Portfolio proof" chip: restyle only

No structural change — stays top-right. Reduce its padding/border weight to match the
new slimmer header pill so it doesn't visually outweigh the simplified header next to it.

### 4. Bug fix: Claims Risk Topology broken on Overview

**Symptom:** On the Overview page, the `<app-risk-topology>` panel (`.risk-preview`,
`overview-workspace.component.html:37-40`) renders only the center "N AT RISK" node with
faint dashed spokes. The four category nodes (rings, labels, counts) that Figma's design
and the Claims page both show are missing. A stray unstyled arc/circle fragment also
appears floating near the panel's top-left corner, outside the panel's visible bounds.

**Confirmed:** The identical `RiskTopologyComponent` (`risk-topology.component.ts`) renders
completely correctly on the Claims page (`app/claims/`), with all rings, category nodes,
and labels visible. Same component, same inputs shape (`slices`, `totalAtRisk`) — the
defect is in how Overview hosts/sizes it, not in the component itself.

**Investigation starting points** (confirm during implementation, this is not yet root
caused):
- `overview-workspace.component.css:27` sets `.risk-preview { min-height: 200px }`, far
  smaller than the Claims page's hosting container.
- `risk-topology.component.css` `.topology-shell` uses `min-h-72` (288px) with
  `overflow-hidden`, and `.topology-svg` uses `h-auto min-h-64 w-full flex-1` — the
  interaction between `flex-1` height-stretching and the SVG's `viewBox="0 0 640 360"`
  aspect ratio should letterbox via `preserveAspectRatio` (default `xMidYMid meet`), which
  should not clip content. The actual clipping mechanism needs to be found by inspecting
  computed layout in the Overview context specifically.
- The stray floating arc is suspicious of a decorative `::before` pseudo-element
  (`topology-shell::before`) that may be positioned using assumptions about container
  width/height that don't hold at Overview's narrower panel width.
- GSAP entrance animation (`animateTopology()` in `risk-topology.component.ts`) uses
  `autoAlpha` fade-ins keyed off SVG-space coordinates, so it's unlikely to be a pure
  animation-timing bug, but confirm the entrance timeline actually completes in the
  Overview context (nodes stuck at `autoAlpha: 0` would explain "missing" nodes that are
  technically present in the DOM).

**Fix requirement:** Overview's embedded topology must show the full rings and all four
category nodes, sized appropriately for its smaller card — this may mean introducing a
compact/dense rendering mode on the component (smaller radii/label font at narrow widths)
rather than forcing the full-size layout into a small container.

### 5. Bug fix: Schedule day-grid overlapping appointments

**Symptom:** On the Schedule page's day view, when two appointments for the same provider
have close start times (e.g. Ava Chen: 9:20 AM and 10:40 AM in the audit screenshot), their
time blocks visually overlap in the grid and the appointment text becomes unreadable.

**Fix requirement:** The day-grid's appointment layout must detect time-overlapping
appointments within a provider's row and lay them out in side-by-side lanes (like a
calendar app's overlap handling) instead of allowing them to stack directly on top of one
another. Non-overlapping appointments keep their current full-width single-lane layout.

### 6. Visual polish: glow + typography

- Metric icon treatment (the circular icons in the top metric strip, e.g. "Appointments
  today", "Unsigned notes") gets a softer inner radial glow matching Figma's halo
  treatment, replacing the current flatter outlined-circle look. This is a shared style
  (used by the metric-strip component wherever it appears), so it updates once.
- Title/eyebrow vertical spacing (page title + eyebrow label stack, e.g. "OPERATIONAL
  COMMAND WORKSPACE" / "Operations observatory") tightens slightly to match Figma's denser
  stack rhythm. Shared shell-level typography change.

### 7. Text-pair readability: System page

The "Runtime and publication state" panel on the System view (label + value pairs like
"PracticeOps API" / "Static fictional preview") currently renders label and value with
insufficient visual separation, causing them to read as one run-on phrase. Apply the same
label/value line-breaking pattern already used correctly elsewhere in the app (e.g. the
Docs page's clinician backlog rows) so each pair is scannable.

## Testing

- Visual: re-screenshot all six views after implementation and compare against this spec's
  descriptions and the Figma reference frame.
- Claims Risk Topology: verify all four category nodes + rings render on both Overview and
  Claims pages, at both the Overview's narrow width and Claims' wide width.
- Schedule: verify overlapping-appointment scenario renders in separate lanes with fully
  readable text; verify non-overlapping appointments are unaffected.
- Scenario tracker: verify collapse/expand state persists across view navigation and
  defaults to collapsed on fresh load.
- Existing component/e2e test suites (`ng test`, `playwright test`) must continue passing;
  add coverage for the two bug fixes (topology rendering, schedule lane assignment) and the
  new collapsed/expanded tracker states.

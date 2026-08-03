# Tailwind Hybrid Observatory Design

## Decision

PracticeOps will use Tailwind CSS v4 as its structural design-system layer while retaining custom CSS, SVG, and WebGL for the Clinical Observatory identity.

Tailwind does not replace the current visual language. It standardizes layout, spacing, typography, responsive behavior, focus treatment, controls, panel materials, and design tokens. Custom rendering remains responsible for aurora, bloom, scanlines, signal motion, scheduling geometry, topology diagrams, and the WebGL atmosphere.

## Goals

- Reduce visual drift across six workspaces.
- Replace repeated structural declarations with a tokenized system.
- Preserve the existing obsidian, cobalt, cyan, ultraviolet, green, amber, and coral palette.
- Introduce a production-quality, data-driven SVG pattern.
- Keep all persisted workflows, synthetic fallback behavior, accessibility, and responsive behavior unchanged.
- Establish an incremental migration path instead of rewriting every template.

## Non-goals

- No backend, API, database, messaging, or domain changes.
- No replacement of the WebGL atmosphere.
- No generic Tailwind component kit.
- No conversion of every existing selector in one pull request.
- No new patient-facing or production-compliance claims.

## Architecture

### Global Tailwind layer

`frontend/src/styles.css` imports Tailwind and declares semantic theme tokens. Tailwind utilities are generated from Angular HTML and TypeScript sources. The token set includes colors, typography, radii, shadows, spacing, and the wide-screen breakpoint used by the observatory.

### Component-scoped structural layer

`frontend/src/tailwind-structure.css` is loaded last by `AppComponent`. It references the global Tailwind theme and uses `@apply` against existing semantic selectors. This gives existing templates consistent structure without replacing meaningful class names with long utility strings.

The first migration slice covers the application shell, headers, signal strip, overview grid, panels, common controls, status pills, and table/list density. Existing specialized styles remain in place for geometry and animation.

### Data-driven SVG layer

`RiskTopologyComponent` renders the overview claims topology as inline SVG. A pure `buildRiskTopologyNodes` function converts current risk slices into deterministic node positions and connection paths. The component renders real counts and exposure values, includes an accessible text equivalent, and honors reduced-motion preferences.

The SVG component is the reference pattern for later waveform, radial progress, and dependency-map components.

## Visual rules

- Atmospheric effects remain behind content and never reduce text contrast.
- Strong bloom is reserved for active, warning, live, and selected states.
- Each workspace keeps one dominant visualization.
- Every artistic visualization must expose the same information textually.
- Interface text uses Inter, editorial display text uses DM Serif Display.
- Controls use consistent heights, radii, borders, focus rings, and disabled states.
- Motion communicates state and collapses under `prefers-reduced-motion`.

## Responsive rules

- Mobile begins at 320 pixels with no page-level horizontal scrolling.
- Signal metrics use one column, then two, then four at wide desktop widths.
- Overview modules preserve the current content priority while using a shared grid scale.
- Dense tables may scroll inside their panels.
- The SVG topology scales through `viewBox` and never depends on fixed CSS pixel coordinates.

## Accessibility

- Keep visible keyboard focus treatment.
- The SVG has a title and description plus a screen-reader list of categories.
- Decorative connection paths are hidden from assistive technology.
- Reduced-motion mode disables path flow and node breathing.
- Existing live regions and runtime-state announcements remain unchanged.

## Testing

- Add unit tests for deterministic SVG node generation, empty input, and count preservation.
- Run the complete Angular test suite.
- Run the Angular production build so Tailwind source detection, PostCSS processing, component styles, and template compilation are verified together.
- Run the existing repository CI before merge.

## Rollout

This pull request establishes the infrastructure and migrates a representative set of surfaces. Future workspace refinements should use the semantic Tailwind tokens and component-scoped structural layer first, then add custom CSS or SVG only when the visualization requires it.

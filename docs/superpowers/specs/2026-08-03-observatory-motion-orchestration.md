# Clinical Observatory Motion Orchestration

## Decision

PracticeOps will use AutoAnimate and GSAP together, with strict ownership boundaries.

- AutoAnimate owns structural DOM motion caused by insertion, removal, reordering, filtering, and view-mode replacement.
- GSAP owns authored sequences, operational state transitions, KPI interpolation, and SVG topology choreography.
- Existing CSS owns low-cost ambient effects such as glow, breathing, scanlines, and background atmosphere.

No element should have the same property animated by more than one layer at the same time.

## Goals

- Make filtering and mode changes visually traceable.
- Give workspace transitions a deliberate, premium rhythm.
- Make KPI changes feel reactive without becoming theatrical.
- Turn the claims topology into a legible data-state animation rather than a decorative loop.
- Preserve keyboard operation, screen-reader equivalents, runtime truth, and reduced-motion behavior.

## AutoAnimate scope

AutoAnimate is attached only to parent elements whose direct children genuinely change:

- schedule workspace, for day, week, and list replacement
- schedule lists, for provider, service, status, and date filtering
- claims table, for payer, risk, and search filtering
- recent activity list, for refreshed persisted events
- scenario actions, for live versus synthetic-preview capability changes

AutoAnimate is not attached to the entire application shell, SVG internals, dense timeline geometry, or continuously updating decorative layers.

## GSAP scope

### Workspace transitions

A standalone Angular directive watches the active workspace. After Angular renders the new view, it animates the changed header copy and current workspace surfaces with restrained opacity, vertical translation, and scale. Persistent navigation, the scenario rail, runtime notice, and proof layer remain stable.

### KPI value motion

The existing metric-value directive moves from a manual requestAnimationFrame interpolator to a GSAP object tween. Values animate only when authoritative data changes. Initial render and reduced-motion mode render immediately.

### Claims topology

The inline SVG topology uses GSAP for:

- center-state reveal
- connection-path reveal
- staggered category-node entrance
- restrained connection flow after entrance

The existing text equivalent remains authoritative for assistive technology. Reduced-motion mode renders the final state without entrance or looping motion.

## Motion profiles

A pure `motion-policy.ts` module provides deterministic profiles for desktop, compact viewports, and reduced motion. This keeps duration and stagger choices consistent across directives and components.

Desktop motion is slightly slower and more spatial. Compact motion uses shorter distances, shorter durations, and tighter staggering. Reduced motion uses zero-duration final-state rendering.

## Performance rules

- Animate opacity and transforms for workspace surfaces.
- Animate numeric proxy objects for KPI text.
- Animate SVG opacity, transform, and stroke dash offset only.
- Use `overwrite: true` for state-reactive tweens.
- Kill timelines, tweens, animation frames, and media-query contexts during cleanup.
- Avoid ScrollTrigger because PracticeOps is an application workspace, not a scroll-driven narrative.
- Do not animate table height, grid-template properties, box shadows, filters, or backdrop filters through JavaScript.

## Accessibility

- AutoAnimate keeps its default respect for `prefers-reduced-motion`.
- GSAP motion resolves through an explicit reduced-motion profile.
- No animation is required to understand state.
- Focus is never moved or delayed by animation.
- Live regions, button state, disabled state, and screen-reader text update immediately.

## Verification

- Unit-test motion-profile selection and metric-duration bounds.
- Verify the new tests fail before implementation.
- Run all Angular tests and the production build.
- Run the persisted backend journey unchanged.
- Run the functional browser audit across all six workspaces at desktop and mobile sizes.
- Reject horizontal overflow, hidden primary surfaces, console errors, or mobile journey-rail regressions.

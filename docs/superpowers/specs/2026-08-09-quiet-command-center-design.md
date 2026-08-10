# PracticeOps quiet command center design

## Status

Approved direction: quiet command center.

This is a visual and interaction pass across the shared PracticeOps shell and all navigable workspaces. It preserves the dark Clinical Observatory identity while reducing visual noise, clarifying hierarchy, and making operational actions easier to scan.

## Problem

The current product contains strong ingredients—dark clinical surfaces, signal colors, an editorial heading voice, real workspace separation, and responsive telemetry—but too many treatments compete simultaneously. Repeated borders, glow effects, uppercase micro-labels, dense metadata, and equally weighted panels make the experience feel more like a visual concept board than a calm operations tool.

The pass should improve perceived quality without changing the product boundary, synthetic-data status, API contracts, or domain behavior.

## Design thesis

PracticeOps should feel like a calm operations room: a small number of high-signal indicators, a clear work queue, and supporting evidence available without visual competition.

The hierarchy is:

1. Context: where the operator is and what the workspace is for.
2. Work: the primary queue, timeline, or exception requiring attention.
3. Evidence: supporting metrics, activity, risk, and system detail.

Signal colors are reserved for semantic meaning. Glow is used only for active or urgent signals, never as a default surface decoration.

## Shared visual system

### Surfaces

- Canvas: near-black blue with a subtle tonal field, not a visible gradient pattern.
- Navigation: slightly lighter, quiet surface with a single active rail treatment.
- Work surface: elevated blue-black panels using tonal contrast before borders.
- Secondary surface: lower-contrast panels for supporting evidence.
- Borders: one restrained border token, with stronger borders reserved for focus, selected, or critical states.

### Color

- Cyan: active navigation, primary interactive emphasis, confirmed operational signal.
- Violet: intelligence, review, or documentation state.
- Amber: attention, pending, or financial exposure.
- Coral: risk, exception, or destructive state.
- Green: healthy, completed, or connected state.
- Neutral text: high-contrast primary, readable secondary, subdued metadata.

The palette must remain accessible in text, badges, focus rings, and charts. Color is never the only carrier of state; pair it with labels, icons, or position.

### Typography

- Use the existing editorial display voice only for page titles and major section titles.
- Use a highly readable sans-serif for navigation, controls, body copy, and metadata.
- Reduce all-caps usage to short section eyebrows and status labels.
- Increase metadata size and contrast where it affects scanning or action choice.
- Use tabular numerals for metrics and times.

### Shape and spacing

- Establish a small radius scale: compact controls, standard panels, and one large shell radius.
- Use spacing and grouping to define sections before adding borders.
- Keep touch targets at least 44px where practical.
- Avoid nested rounded containers when a flat grouping or divider communicates the same relationship.

## Shell and navigation

The shell becomes quieter and more predictable:

- The rail has a compact brand mark, grouped workspace navigation, and a calm active state.
- Active navigation uses a filled tonal capsule plus a single signal accent; inactive items are text-forward and low contrast.
- The header has one clear page title, one short description, connection state, refresh, and user identity.
- The environment/API notice is a distinct system banner with clear read-only language and one action, rather than another decorative card.
- Remove redundant shell ornamentation and avoid competing glow sources.
- On mobile, use a compact top bar and a horizontally scrollable or bottom workspace switcher with labels and accessible active state.

## Workspace patterns

Each workspace keeps its own content model but follows the same hierarchy.

### Overview

- Page header and operational context.
- One primary exception/work queue region.
- A compact metric strip with four meaningful signals.
- Supporting schedule, documentation readiness, risk, and recent activity modules.
- The schedule and exceptions get the strongest visual weight; topology and activity become evidence modules.

### Schedule

- Timeline-first layout with date/context controls.
- Clear current-time marker, appointment status, and quick action affordances.
- Avoid equal visual treatment for every appointment; active and at-risk items should be visually distinct.

### Documentation

- Work queue first: unsigned, overdue, in review, and ready states.
- Pipeline progress becomes a summary above the queue rather than a dominant decorative rail.
- Each row exposes owner, age, next action, and status without requiring visual decoding.

### Claims

- Risk queue first, with clear severity and financial impact.
- Use compact semantic badges and a detail pane or expandable row for evidence.
- Reserve coral/amber accents for true risk and pending states.

### Audit

- Event stream first, with stronger timestamp and actor hierarchy.
- Filters and date controls are compact, explicit, and keyboard reachable.
- Use a subtle vertical timeline treatment only where it clarifies sequence.

### System

- Group settings and scenario controls into clear sections.
- Make preview/runtime state prominent but calm.
- Keep disabled persisted actions visibly disabled with an explanation tied to the synthetic/API state.

## Interaction and state requirements

Core controls must have deliberate states:

- default, hover, focus-visible, pressed, selected, disabled, loading, empty, error, and success where applicable;
- primary actions must have a clear label and state change;
- selected navigation must expose `aria-current` or an equivalent semantic state;
- status changes must be announced where they affect the current task;
- expandable or collapsible content must expose expanded state;
- keyboard focus must remain visible against dark surfaces;
- reduced-motion mode must disable nonessential transitions and metric interpolation.

Motion should be sparse and purposeful: workspace entry, queue updates, and metric changes may animate briefly; ambient glow, perpetual shimmer, and decorative motion should be removed or paused.

## Responsive behavior

Use the existing responsive and container-query foundations, but validate the actual rendered result:

- 390x844: no horizontal overflow; stack work modules; keep the primary queue usable without excessive nesting; preserve readable type and 44px targets.
- Tablet: maintain a two-column work/evidence relationship where space permits; collapse secondary evidence before shrinking primary content.
- 1280x800: preserve comfortable reading widths and prevent the shell from becoming a wall of cards.
- 1440x900 and wide desktop: use additional space for breathing room and evidence, not larger typography or more ornament.

## Accessibility and content rules

- Preserve synthetic-data and read-only language; never imply production compliance or real patient data.
- Keep semantic headings in a logical order.
- Ensure text and controls meet contrast requirements on the final surfaces.
- Use visible labels for actions; tooltips may supplement but not replace them.
- Ensure charts/topology have adjacent textual summaries.
- Do not rely on color alone for appointment, documentation, claim, or connection status.

## Implementation boundaries

- Keep business rules in existing domain/application classes and UI state in existing stores/controllers.
- Prefer shared shell tokens and focused component styles over one-off global overrides.
- Treat `frontend/src/generated` as machine-owned.
- Avoid backend/API changes unless a visual state cannot be represented from the existing contract; if a schema change becomes necessary, add the required migration and tests.
- Preserve unrelated local files and do not overwrite `frontend/qa-observatory.png` or `.claude/`.

## Verification matrix

Implementation is not considered complete until:

- Angular unit tests pass.
- Production build passes.
- Storybook build passes.
- Playwright checks confirm navigation across all workspaces and meaningful selected states.
- Screenshots are captured at 390x844, tablet, 1280x800, and 1440x900.
- Screenshots show no horizontal overflow and confirm the primary hierarchy at each breakpoint.
- Browser console is checked for errors during the interaction sweep.
- Keyboard focus, reduced motion, and accessible names are checked for the shell and primary workspace actions.

## Out of scope

- Backend domain behavior, authentication, persistence model, generated API client changes, and production compliance claims.
- New product capabilities unrelated to the current workspaces.
- A wholesale brand replacement or light-theme redesign.

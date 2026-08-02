# Clinical Observatory Code-First Handoff

## Decision

PracticeOps uses a hybrid design workflow:

1. Concept renders are the art-direction master.
2. Figma is the editable blueprint for composition, hierarchy, tokens, and interaction intent.
3. The Angular application is the final visual source of truth.
4. CSS, SVG, and browser motion reproduce effects that Figma cannot express reliably.

This avoids degrading the approved concept into a generic dashboard simply because every atmospheric detail cannot be recreated as editable Figma primitives.

## Source-of-truth matrix

| Concern | Source of truth |
| --- | --- |
| Product hierarchy and page composition | Figma |
| Spacing, panel proportions, and component inventory | Figma and design tokens |
| Data, behavior, loading, fallback, and accessibility | Angular |
| Aurora, bloom, particles, glass refraction, scanlines, and signal animation | CSS |
| Charts, topology, orbit graphics, and waveform visuals | CSS and SVG |
| Responsive behavior | Angular templates and CSS media queries |
| Production quality | Browser screenshots and automated verification |

## Visual contract

### Palette

- Obsidian: `#04060c`
- Elevated ink: `#0c1422`
- Electric cobalt: `#2f6bff`
- Surgical cyan: `#19d9ff`
- Ultraviolet: `#7a4dff`
- Signal green: `#37e08b`
- Warning amber: `#ffb020`
- Risk coral: `#ff5f78`
- Primary text: `#f5f7ff`
- Muted text: `#8796b1`

### Typography

- Editorial display: DM Serif Display
- Interface text: Inter
- Display headings use restrained negative tracking and short line lengths.
- Technical labels use uppercase microtype with expanded tracking.
- Numeric signals remain large enough to scan without turning every module into a conventional KPI card.

### Material model

Every elevated surface uses:

- a translucent dark gradient
- a cool-blue spectral border
- a subtle top inner highlight
- a deep ambient shadow
- a low-opacity cyan or violet internal bloom
- restrained backdrop blur
- rounded corners between 13 and 18 pixels

The background atmosphere is separate from the content panels. It must never reduce text contrast.

### Motion grammar

- Aurora drift: 18 to 24 seconds, low amplitude
- Star-field drift: 38 seconds, linear
- Live pulse: 2 seconds
- Signal sweep: 9 seconds
- Hover elevation: 160 to 180 milliseconds
- Reduced motion: all nonessential motion collapses to a near-zero duration

## Workspace translation

### Operations Observatory

- Four integrated signal metrics
- Schedule list with one active row
- Documentation signal pipeline
- Claims risk radar
- Live activity stream

### Temporal Runway

- Provider rows aligned to a time grid
- Current-time beam
- Appointment blocks coded by operational state
- Clinician load, no-show risk, waitlist, reminder, and capacity modules

### Documentation Continuum

- Five-stage luminous pipeline
- Note queue
- Clinician backlog
- Signature bottleneck orbit
- Priority follow-ups
- Documentation health strip

### Risk Constellation

- Central exposure field with connected risk categories
- Exposure trend
- Risk distribution
- Payer watchlist
- Recent claim actions
- Detailed risk table

### Event Spectrum

- Six observability metrics
- Event waveform
- Event type distribution
- Delivery, flags, signatures, and claim status orbit cards
- Immutable activity stream

### Workspace Parameters

- Synthetic-data boundary banner
- Workspace identity
- Notification preferences
- Role and access summary
- Integration orbit
- System status and residency information

## Implementation boundaries

- No patient or provider data is real.
- The app must remain useful when the backend is unavailable.
- The local fallback must be clearly labeled as synthetic.
- The interface must remain keyboard navigable.
- Focus states must be visible.
- Motion must honor `prefers-reduced-motion`.
- Desktop density may not create horizontal page scrolling.
- Data tables may scroll within their own panels on narrow viewports.

## Files

- `frontend/src/app.component.html`
- `frontend/src/app.component.css`
- `frontend/src/app.component.workspaces.css`
- `frontend/src/app.component.ts`
- `frontend/src/dashboard-model.ts`
- `frontend/src/styles.css`
- `frontend/src/app.spec.ts`

## Completion criteria

- All six navigation destinations render complete workspaces.
- API data is used when available.
- A local synthetic fallback renders when the API is unavailable.
- Frontend tests and production build pass.
- Backend tests remain unchanged and pass.
- GitHub Actions passes.
- The pull request is ready for merge.

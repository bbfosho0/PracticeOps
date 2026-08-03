# PracticeOps Premium Design and Implementation Prompt for Local Codex

Work autonomously through a complete **product-design, UX, UI, motion, shader, implementation, and verification pass** for:

`https://github.com/bbfosho0/PracticeOps`

This is not a setup-only task and not a superficial CSS polish. You are the product designer, interaction designer, visual-systems designer, frontend engineer, and QA owner. The finished browser application must feel premium, expressive, cinematic, technically credible, and portfolio-defining while remaining usable, accessible, responsive, and fully functional.

The approved Clinical Observatory reference images are the visual art-direction master. Figma is only a structural blueprint. The production Angular application is the final source of truth.

## Reference pack, mandatory

Locate the extracted reference images before changing code. Search these likely locations:

- `./design-reference/clinical-observatory/`
- `./practiceops-clinical-observatory-reference-pack/`
- `../practiceops-clinical-observatory-reference-pack/`
- the user’s Downloads folder

Expected files:

1. `01-operations-observatory.png`
2. `02-temporal-runway.png`
3. `03-documentation-continuum.png`
4. `04-risk-constellation.png`
5. `05-event-spectrum.png`
6. `06-workspace-parameters.png`
7. `07-clinical-observatory-system.png`
8. `08-states-and-motion-grammar.png`

Open and inspect the images. Do not claim fidelity from file names alone. If image inspection is unavailable or the files cannot be found, stop and request their exact local path. Do not redesign from memory or substitute a generic dashboard aesthetic.

Keep the reference images local. Add their local folder to `.git/info/exclude` if it is inside the repository. Do not commit large reference PNGs unless the user explicitly asks.

## Non-negotiable product direction

PracticeOps must feel like a **cinematic clinical operations observatory**, not a component-library demo, conventional admin dashboard, crypto terminal, or decorative sci-fi wallpaper.

The design language is:

- Near-black obsidian spatial canvas
- Graphite and deep-blue operational surfaces
- Surgical cyan and electric cobalt for telemetry and active state
- Ultraviolet and indigo for intelligence and documentation flow
- Signal green for healthy completion
- Warm amber and warning coral only for risk and exceptions
- Editorial serif display typography paired with precise technical sans-serif labels
- One dominant operational focal point per workspace
- Integrated instruments, fields, runways, spectra, and pipelines instead of endless detached cards
- Layered light, controlled bloom, atmospheric depth, and crisp information hierarchy
- Dense but legible operational information
- Human authority visually stronger than automated suggestions

Avoid:

- Generic rounded-card grids
- Excessive bento layout
- Random neon glow on every object
- Gradient wallpaper without depth or purpose
- Tiny unreadable labels
- Decorative motion that competes with tasks
- Glassmorphism that reduces contrast
- Heavy 3D or shaders behind tables, forms, long text, or dense operational rows
- Replacing working workflows with static mockups
- Hardcoded visual metrics that contradict application data

## Read before modifying

Read completely:

- `AGENTS.md`
- `README.md`
- `frontend/package.json`
- `frontend/angular.json`
- `frontend/src/app.component.ts`
- `frontend/src/app.component.html`
- `frontend/src/app.component.css`
- `frontend/src/app.component.workspaces.css`
- `frontend/src/functional-layout-fixes.css`
- `frontend/src/functional-telemetry.css`
- `frontend/src/dashboard-model.ts`
- `frontend/src/operational-telemetry.ts`
- `frontend/src/app.spec.ts`
- `frontend/src/operational-telemetry.spec.ts`
- `.github/workflows/ci.yml`
- `.github/workflows/visual-audit.yml`
- `docs/design/clinical-observatory-code-first.md`

Inspect the current application in the browser at desktop and mobile sizes before making changes. Capture baseline screenshots of every workspace.

## Git safety

1. Run `git status --short`, `git branch --show-current`, `git log -5 --oneline`, and `git remote -v`.
2. Preserve all existing user work. Never reset, clean, discard, or overwrite unrelated changes.
3. Update `main` safely with `git pull --ff-only origin main` when the tree is clean.
4. Create a branch:
   `git switch -c design/premium-clinical-observatory-v2`
5. Make focused local commits as work becomes verified.
6. Do not push or merge without explicit user approval.

## Phase 1, product and visual audit

Audit every existing workspace against its corresponding reference image:

- Overview, Operations Observatory
- Schedule, Temporal Runway
- Documentation, Documentation Continuum
- Claims, Risk Constellation
- Audit, Event Spectrum
- Settings, Workspace Parameters

Create `docs/design/clinical-observatory-v2-audit.md` containing:

- What already matches
- What looks flat, generic, crowded, weak, or inconsistent
- Hierarchy and composition gaps
- Typography gaps
- Material and lighting gaps
- Motion and interaction gaps
- Responsive problems
- Accessibility and performance risks
- Page-specific changes required

Evaluate the current implementation using these dimensions from 1 to 10:

- Composition
- Hierarchy
- Typography
- Material depth
- Atmospheric fidelity
- Data-visual integration
- Interaction clarity
- Motion quality
- Responsive quality
- Accessibility

Do not start by randomly editing CSS. Establish the gap and the system first.

## Phase 2, define the production design system

Create or refine a tokenized design system using CSS custom properties and typed TypeScript where useful.

Define:

### Color and light

- Obsidian background tiers
- Graphite panel tiers
- Cyan, cobalt, violet, green, amber, and coral signal scales
- Text hierarchy
- Border, edge-light, inner-light, shadow, and bloom levels
- Risk and status semantics

### Typography

- Editorial display scale for workspace titles
- Operational heading scale
- Body and supporting-copy scale
- Technical micro-label scale
- Numeric KPI scale
- Responsive fluid sizing with `clamp()`
- Maximum readable line lengths

### Spatial system

- 8-point spacing scale
- Desktop, tablet, and mobile grids
- Panel radii and edge treatments
- Content density rules
- Large focal-region rules
- Table and timeline density rules

### Material system

Create a restrained hierarchy:

1. Deep glass for primary operational surfaces
2. Elevated glass for selected or actionable regions
3. Subtle glass for overlays and dock items
4. Solid or near-solid surfaces for dense data and forms

Each material must define fill, border, inner highlight, outer shadow, blur, saturation, and fallback behavior.

### Component system

Refactor repeated UI into maintainable Angular components or directives where this improves clarity without overengineering. Include:

- Command dock
- Metric signal
- Operational panel shell
- Status chip
- Filter control
- Signal orb
- Timeline or runway item
- Pipeline node
- Risk node
- Activity item
- Empty, loading, warning, error, and fallback states
- Data-table shell
- Toggle and preference row

Preserve the existing data derivations, signals, API behavior, filters, and accessibility state.

## Phase 3, signature shader and atmosphere

Implement one coherent shader language, not unrelated effects everywhere.

### Primary signature effect

Create a lightweight full-viewport atmospheric layer that visually approaches the reference images:

- Flowing aurora ribbons using layered fractal or simplex-style noise
- Cyan and cobalt center energy with ultraviolet outer fields
- Curved luminous horizon or orbital edge
- Sparse signal stars and vertical telemetry beams
- Subtle depth parallax
- Very restrained pointer response, only when it improves spatial presence

Implementation order:

1. Prefer a small custom WebGL2 canvas or similarly lightweight solution.
2. Use a tiny dependency such as OGL only when it materially reduces complexity and the bundle impact is justified.
3. Do not add Three.js for a background effect unless there is a strong measured reason.
4. Provide a high-quality CSS and SVG fallback.

Shader requirements:

- Canvas is decorative, `aria-hidden`, and `pointer-events: none`
- Cap device pixel ratio, generally at 1.5
- Pause when the page is hidden
- Reduce or stop animation when the user prefers reduced motion
- Degrade gracefully on unsupported devices
- Avoid blocking application startup
- Avoid allocating every frame
- Keep text and controls above the effect with reliable contrast
- No effect may obscure dense tables or forms
- Target smooth behavior on ordinary integrated graphics, not only a high-end GPU

Use shaders selectively for:

- The global atmosphere
- One claims-risk scan or field effect
- One documentation energy-flow treatment
- One audit-spectrum signal treatment

Do not use animated shader surfaces on every card.

## Phase 4, motion grammar

Define one motion system before implementing animation.

### Timing

- Micro feedback: 120 to 180 ms
- Control and row transitions: 180 to 240 ms
- Panel and workspace transitions: 240 to 360 ms
- Ambient shader drift: slow and continuous
- Metric and visualization updates: 350 to 650 ms

### Motion principles

- Preserve context
- Communicate state and causality
- Use transform and opacity where possible
- No excessive bounce
- No dramatic page fly-ins
- No constant pulsing except live or risk indicators
- Stagger no more than a few important elements
- Keep interfaces immediately usable while motion completes

Implement:

- Workspace crossfade with a restrained 8 to 14 px depth shift
- Dock selection transition
- Hover and focus lift for actionable surfaces
- KPI value transition when data changes
- Schedule cursor and appointment-state transitions
- Documentation pipeline energy traversal
- Claims risk scan and node emphasis
- Audit spectrum live update treatment
- Toggle and filter state transitions
- Loading skeleton shimmer
- Empty-state reveal

Add a complete `prefers-reduced-motion` implementation that preserves every state change without spatial animation.

Use native CSS animations and Web Animations API first. Add GSAP only if a specific complex sequence genuinely needs timeline control. Do not add Lenis unless there is a measured scrolling problem and native scrolling cannot satisfy it.

## Phase 5, workspace redesign

### Operations Observatory

Match the reference image’s composition and hierarchy:

- The aurora and horizon create the spatial identity but do not reduce readability
- KPI signals feel integrated into one telemetry band
- Today’s schedule is the dominant operational surface
- Documentation readiness behaves like an energy continuum, not a progress-bar widget
- Claims risk is a topology or orbital field
- Recent activity reads as a live event stream
- Footer telemetry feels like an instrument panel

Improve real UX:

- Clear primary actions
- Meaningful hover and focus states
- Useful empty and loading states
- Data labels that explain rather than decorate
- Drill-in actions that navigate to the correct workspace

### Temporal Runway

- Make the scheduling runway the focal instrument
- Improve time-scale legibility
- Place provider load, waitlist, reminders, no-show risk, and capacity around the runway as supporting telemetry
- Ensure Day, Week, and List modes feel intentionally designed, not three variations of the same list
- Filters must remain obvious and fast
- Appointment status and duration must be readable without relying only on color
- Current-time treatment must be accurate and visually restrained

### Documentation Continuum

- Turn note progression into a luminous but legible continuum
- Give Capture, Review, Signature, Final QA, and Billing Ready distinct operational meaning
- Make bottlenecks and priority follow-ups immediately understandable
- Improve queue density and scanability
- Use animated energy only to communicate flow or change
- Keep detailed note lists on stable, high-contrast surfaces

### Risk Constellation

- Make the claims field visually memorable and data-driven
- Nodes, orbit sizes, glow strength, and labels must derive from real claim-risk data
- Exposure, payer watchlist, risk distribution, and claim actions must reconcile with the claims table
- Filters and search must remain obvious
- Use amber and coral selectively to focus attention
- Do not turn the claims page into decorative astronomy

### Event Spectrum

- The spectrum is the dominant signal visualization
- Event type, throughput, delivery rate, lag, flags, and activity stream derive from real telemetry
- Improve visual correlation between spectrum color, category, and event list
- Dense audit rows remain calm, crisp, and readable
- Motion should imply live signal flow without making the audit log unstable

### Workspace Parameters

- Keep the same dark observatory language as the other workspaces
- Make synthetic-demo boundaries unmistakable
- Improve information grouping for profile, preferences, roles, integrations, and system information
- Toggles must work, announce state, and remain keyboard accessible
- Use orbital integration graphics only as supporting health visualization
- Do not switch to a generic white settings page

## Phase 6, UX completeness

Review every user journey, not just individual screens:

1. Understand current operational health from Overview
2. Move from a KPI to its detailed workspace
3. Filter and inspect schedule capacity
4. Identify documentation bottlenecks
5. Locate and investigate a risky claim
6. Understand audit activity and system delivery
7. Change notification preferences
8. Distinguish live API mode from local synthetic fallback
9. Recover from API failure using Retry API

For every journey, verify:

- Clear entry point
- Visible current state
- Predictable action
- Useful feedback
- Empty state
- Error state
- Keyboard path
- Mobile path

Do not invent backend workflows that do not exist. Improve navigation, affordances, state presentation, and interaction within the real product boundary.

## Phase 7, responsive design

Design intentionally for:

- 1600 by 1000
- 1440 by 900
- 1280 by 800
- 1024 by 768
- 768 by 1024
- 390 by 844
- 360 by 800

Requirements:

- No document-level horizontal overflow
- No overlapping primary panels
- Mobile dock contains all six destinations
- Tables use intentional local scrolling or mobile transformations
- Schedule remains useful on narrow screens
- KPI text never collides with suffixes or supporting labels
- Settings fields and actions do not overlap
- Shader and atmospheric layers crop gracefully
- Dense information is progressively disclosed, not merely shrunk
- Touch targets are at least 44 px where practical
- Safe-area insets are respected

## Phase 8, accessibility and performance

Accessibility:

- Preserve semantic headings and landmarks
- Preserve `aria-current`, `aria-checked`, labels, and live-region behavior
- Never rely solely on color
- Maintain visible keyboard focus
- Verify contrast on all text over atmospheric backgrounds
- Provide reduced-motion behavior
- Decorative visuals must be hidden from assistive technology

Performance:

- Measure before and after
- Avoid layout thrashing
- Avoid expensive full-screen blur stacks on mobile
- Use `contain`, `content-visibility`, and compositing carefully when useful
- Pause background work when hidden
- Clamp shader resolution and animation intensity by capability
- Lazy-initialize expensive effects
- Avoid unnecessary dependencies
- Keep browser console free of warnings and errors

## Phase 9, visual validation loop

Do not stop after one implementation pass.

Perform at least three explicit passes:

### Pass 1, composition and hierarchy

- Match major proportions and focal regions
- Remove generic card-grid structure
- Fix spacing, scale, typography, and page rhythm

### Pass 2, materials and atmosphere

- Refine shader, light, glass, edge treatment, depth, and data-visual styling
- Ensure the product feels premium without visual noise

### Pass 3, interaction and polish

- Refine motion, hover, focus, loading, empty, error, live, fallback, responsive, and microcopy states
- Remove clipping, collisions, dead controls, and inconsistent behavior

For each pass:

1. Run the app with live API data.
2. Capture every workspace at 1600 by 1000 and 390 by 844.
3. Create side-by-side comparisons against the approved reference images.
4. Inspect the images, do not rely only on automated tests.
5. Record remaining gaps.
6. Iterate.

Store temporary images outside tracked source or in an ignored directory such as `.local-audit/`.

Use the reference images as art direction, not as permission to fake functionality. The browser implementation must preserve real data, responsive behavior, and controls.

## Phase 10, functional verification

Start and verify the complete stack:

```bash
docker compose up --build -d
npm --prefix frontend ci
npm --prefix frontend start
```

Expected URLs:

- Frontend: `http://localhost:4200`
- API: `http://localhost:8081`
- Swagger: `http://localhost:8081/swagger`
- Readiness: `http://localhost:8081/health/ready`
- RabbitMQ management: `http://localhost:15672`

Verify both live API mode and synthetic fallback mode.

Run:

```bash
dotnet restore PracticeOps.sln
dotnet build PracticeOps.sln --configuration Release --no-restore
dotnet test PracticeOps.sln --configuration Release --no-build
dotnet format PracticeOps.sln --verify-no-changes
npm --prefix frontend run test -- --watch=false
npm --prefix frontend run build
```

Exercise:

- All six workspace destinations
- Day, Week, and List schedule modes
- Previous and next date
- Schedule provider, service, and status filters
- Claims risk and payer filters
- Claims search
- Notification toggles
- Retry API
- Live to fallback and fallback to live recovery
- Keyboard navigation
- Reduced-motion mode

Validate that every KPI and visualization derives from the current dashboard state and reconciles with detailed records.

## Phase 11, regression and visual tests

Extend the existing verification system where useful:

- Add focused unit tests for new pure visual-model derivations
- Add interaction assertions for critical controls
- Add layout assertions for major overlaps and overflow
- Add screenshot captures for all six workspaces on desktop and mobile
- Add checks that the shader layer exists when supported and the static fallback works when disabled
- Add reduced-motion assertions

Do not create brittle pixel-perfect snapshots for the entire animated page. Use stable visual regions, deterministic animation disabling, layout geometry checks, and human-inspected comparison captures.

## Acceptance criteria

The work is not complete until all of the following are true:

- The implemented browser UI is materially closer to the approved reference images than the current baseline
- Every workspace has a distinct focal composition within one coherent system
- The global aurora and horizon feel dimensional rather than like a flat gradient
- The product no longer reads as a generic card dashboard
- Shaders are purposeful, performant, and gracefully degradable
- Motion communicates state and preserves context
- All existing controls and data remain functional
- KPIs and visualizations reconcile with real application state
- Desktop, tablet, and mobile layouts are deliberate and collision-free
- Keyboard, contrast, and reduced-motion behavior are verified
- No browser console errors
- Backend build and tests pass
- Frontend tests and production build pass
- Visual audit is captured and inspected
- Git status contains only intentional source and documentation changes

## Final deliverables

Produce:

1. A complete premium browser implementation
2. `docs/design/clinical-observatory-v2-audit.md`
3. `docs/design/clinical-observatory-v2-system.md`
4. `docs/design/clinical-observatory-v2-motion.md`
5. Updated tests and visual-audit automation where justified
6. Desktop and mobile comparison captures in an ignored local audit folder
7. Focused local commits on `design/premium-clinical-observatory-v2`
8. A final evidence-based report

## Final report format

### Visual result

- Summary of the new design system
- Shader implementation
- Motion grammar
- Workspace-by-workspace changes
- Before and after screenshot locations
- Remaining visual differences from the references

### UX result

- Journeys verified
- Controls verified
- Loading, empty, error, live, and fallback states
- Keyboard and reduced-motion behavior

### Performance and accessibility

- Shader fallback behavior
- Browser performance observations
- Contrast and focus results
- Responsive results

### Verification

- Backend build and test counts
- Frontend test counts
- Production build result
- Browser console result
- Viewports tested
- KPI reconciliation values

### Git state

- Branch
- Commits
- Files changed
- `git status --short`
- Any work requiring user approval before push or merge

Do not finish with “the design is improved” or another subjective claim. Show the rendered evidence, commands, test results, screenshots, and remaining gaps. Continue iterating until the app is both magnificent and operationally credible.

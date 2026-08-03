# PracticeOps Engineering Quality Modernization

## Decision

PracticeOps will preserve its current Clinical Observatory appearance, workflows, motion system, backend architecture, and truthful synthetic fallback. The next pass will improve engineering quality rather than add more visual libraries or product scope.

The modernization has four primary outcomes:

1. Decompose the Angular frontend into understandable workspace and shared components.
2. Add Storybook as the isolated component-state workshop and accessibility review surface.
3. Generate the Angular API client from the ASP.NET Core OpenAPI contract.
4. Add Playwright as the conventional end-to-end and responsive browser verification layer.

OpenTelemetry, Testcontainers expansion, selected analytical charts, and broader repository automation are deferred to a second pass.

## Constraints

- Preserve all six existing workspaces and the complete persisted employer journey.
- Preserve live API mode, stale snapshot behavior, and clearly labeled synthetic preview mode.
- Preserve the transactional outbox proof and never fabricate delivery state.
- Preserve Tailwind, AutoAnimate, GSAP, custom CSS, inline SVG, and WebGL ownership boundaries.
- Do not add ng-motion or another general animation engine.
- Preserve keyboard operation, visible focus, screen-reader equivalents, and reduced-motion behavior.
- Do not introduce authentication, microservices, Kubernetes, real patient data, or unrelated product expansion.
- Keep generated source isolated and never edit it manually.
- Maintain Angular 20 compatibility.

## Current state

The frontend currently centralizes navigation, six workspace views, filters, derived telemetry, scenario state, preferences, atmosphere rendering, motion integration, and view-specific transformation logic inside the root application component.

The application is functional and visually mature, but the root component has become the main architectural bottleneck. It is difficult to test, review, document, or visually refine one workspace independently.

The existing motion architecture is retained:

- CSS owns ambient effects, glows, scanlines, and atmosphere.
- AutoAnimate owns structural insertion, removal, filtering, and reordering.
- GSAP owns authored workspace choreography, KPI interpolation, and SVG topology motion.
- Tailwind owns shared structure and design tokens.

## Architecture

### Application shell

The root component becomes a thin coordinator responsible for:

- active workspace selection
- top-level runtime state
- shared refresh and scenario services
- shell-level composition

Target shell components:

```text
frontend/src/app/shell/
  observatory-shell.component.*
  command-dock.component.*
  workspace-header.component.*
  runtime-notice.component.*
```

### Workspace components

Each workspace becomes an independently understandable standalone Angular component.

```text
frontend/src/app/overview/
frontend/src/app/schedule/
frontend/src/app/documentation/
frontend/src/app/claims/
frontend/src/app/audit/
frontend/src/app/system/
```

Each workspace receives typed inputs and emits explicit events. Workspace internals may use focused child components for filters, tables, timelines, pipelines, and visualizations.

Examples:

```ts
readonly claims = input.required<readonly Claim[]>();
readonly riskDistribution = input.required<readonly RiskSlice[]>();
readonly resolveClaim = output<string>();
```

The root component must not retain workspace-specific formatting or transformation logic after extraction unless that logic is genuinely shared across workspaces.

### Shared modules

```text
frontend/src/app/shared/
  motion/
  ui/
  formatting/
  accessibility/
```

Existing motion directives and motion policy move under `shared/motion` without changing behavior.

Pure telemetry and model-building functions remain framework-independent and continue to be unit-tested directly.

## Data flow

```text
Generated OpenAPI client
        ↓
PracticeOps API adapter
        ↓
OperationalRefreshStore and PortfolioScenarioController
        ↓
Thin application shell
        ↓
Typed workspace inputs and explicit output events
```

The generated client is an infrastructure detail. Components and stores must depend on a thin handwritten adapter rather than import generated classes throughout the application.

## Storybook

Storybook becomes the source of truth for isolated component states.

Figma remains design intent. The running application remains the integration source of truth. Storybook becomes the component behavior, state, and accessibility source of truth.

Initial story coverage:

### Metric signal strip

- normal
- loading
- refreshed
- critical risk
- reduced motion

### Runtime notice

- connecting
- live
- synthetic preview
- stale snapshot
- API failure

### Claims workspace

- populated
- filtered
- no matches
- critical claims
- mutation pending

### Schedule workspace

- day
- week
- list
- empty schedule
- active provider filter

### Scenario controller

- not started
- in progress
- complete
- mutation disabled
- API unavailable

Stories must use deterministic fictional fixtures. They must not call the live API.

Storybook interaction tests should cover important local component behaviors, such as changing filters, toggling view modes, and invoking output events. The accessibility addon must run against the initial story set.

## Generated API contract

The ASP.NET Core OpenAPI document becomes the authoritative frontend transport contract.

Use NSwag to generate an Angular-compatible TypeScript client into:

```text
frontend/src/generated/practiceops-api-client.ts
```

Rules:

- Generated source is committed for reproducible builds and code review.
- Generated source is never manually edited.
- A handwritten adapter presents stable application-facing methods.
- Existing domain-facing stores remain unaware of NSwag-specific implementation details.
- CI regenerates the client and fails when the result differs from the committed file.
- OpenAPI generation must be deterministic.

## Playwright verification

Playwright becomes the primary browser-level verification layer while existing unit and backend tests remain in place.

Required projects:

- desktop, 1440 by 1000
- tablet, 900 by 1100
- mobile, 390 by 844
- reduced motion, desktop viewport with `reducedMotion: reduce`

Required workflows:

1. Synthetic preview loads truthfully when the API is unavailable.
2. Live mode loads authoritative API data.
3. The complete employer scenario persists from reset through resolution.
4. Successful mutations refresh all workspaces.
5. Claims filters produce the expected rows and empty state.
6. Schedule day, week, and list modes remain functional.
7. Reduced-motion mode avoids persistent GSAP choreography.
8. Keyboard navigation reaches every meaningful action.
9. No horizontal overflow occurs at the mobile audit width.
10. Audit and outbox state remain truthful after scenario actions.

Failed CI runs must upload Playwright traces and relevant screenshots.

## Accessibility

Accessibility is a release requirement rather than a manual afterthought.

The modernization adds:

- Storybook accessibility checks
- axe checks in critical Playwright workflows
- keyboard-only navigation tests
- reduced-motion assertions
- live-region assertions for runtime and KPI updates
- checks for meaningful heading structure and accessible names

Readable operational text should generally meet these targets:

- body text, at least 14px
- supporting text, at least 12px
- labels and chips, at least 11px
- decorative telemetry labels may use 10px only when they are not required to operate or understand the workflow

The pass must distinguish decorative microcopy from operationally required information rather than increasing every label indiscriminately.

## Error handling

- Component extraction must preserve current stale-data and retry behavior.
- Storybook stories must cover connecting, failed, stale, and synthetic states.
- The generated client adapter must convert transport failures into the existing application error model.
- Playwright tests must distinguish intentional synthetic fallback from an unexpected application failure.
- Motion must never delay state updates, focus, live-region changes, or disabled-state changes.

## Testing strategy

### Unit tests

- pure telemetry and model functions
- stores and controllers
- extracted workspace logic
- motion policy
- API adapter mapping

### Storybook interaction tests

- isolated component behavior
- output event invocation
- visual state completeness
- accessibility checks

### Playwright

- complete user workflows
- responsive behavior
- reduced motion
- keyboard navigation
- truthful runtime modes

### Existing backend tests

Continue verifying domain behavior, scenario reset, persistence, outbox creation, health endpoints, and publication truth.

## Implementation sequence

1. Establish decomposition seams and fixture factories.
2. Extract shell components.
3. Extract each workspace one at a time without visual changes.
4. Add Storybook and initial stories during extraction.
5. Add NSwag generation and the handwritten API adapter.
6. Add deterministic client-generation verification.
7. Add Playwright configuration and critical workflows.
8. Add accessibility gates.
9. Run the complete frontend, backend, responsive, and scenario verification suite.
10. Update README and employer-demo documentation with the new architecture and test evidence.

## Deferred second pass

The following are explicitly outside this implementation plan:

- OpenTelemetry and Grafana stack
- broader Testcontainers coverage
- ECharts analytical visualizations
- Lighthouse CI budgets
- Knip, Renovate, Trivy, and expanded CodeQL configuration
- authentication and role-based access
- additional clinical or billing workflows

These may proceed only after the modernization is complete and verified.

## Success criteria

The pass is complete when:

- `AppComponent` is a thin coordinator rather than a six-workspace implementation file.
- Every major workspace can be rendered and reviewed independently.
- Storybook includes the agreed deterministic state matrix.
- The frontend API transport layer is generated from OpenAPI and protected by a no-diff CI check.
- Playwright verifies live mode, synthetic mode, the persisted employer journey, responsiveness, reduced motion, and keyboard operation.
- Existing visual fidelity and application behavior do not regress.
- All existing frontend and backend tests remain green.
- Documentation accurately explains the architecture, generated contract, and verification workflow.

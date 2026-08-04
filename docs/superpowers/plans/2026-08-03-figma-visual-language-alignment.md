# Figma Visual-Language Alignment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bring the running PracticeOps frontend into alignment with the Figma "Operations Observatory" visual language across all six workspace views, and fix two concrete rendering bugs found during the design audit.

**Architecture:** All changes are localized to existing Angular 20 standalone components under `frontend/src/app/` and a handful of root-level `frontend/src/*.ts` pure-logic files. No new components are introduced except one new pure-logic file (`runway-blocks.ts`) extracted to make the schedule-grid bug testable in isolation. No routing, dependency, or backend changes.

**Tech Stack:** Angular 20 (standalone components, signals), Tailwind 4 (via `@apply`/`@reference`), Karma/Jasmine (`ng test`), Playwright (`ng run practiceops:e2e`).

## Global Constraints

- Spec: `docs/superpowers/specs/2026-08-03-figma-visual-language-alignment-design.md` — all tasks below implement sections of this spec; do not deviate from it without checking back in.
- Visual-language match, not pixel-for-pixel — real dynamic data and the scenario/proof UI are allowed to diverge from the static Figma mock.
- The "persisted employer journey" scenario tracker is a real feature to redesign around, not scaffolding to delete.
- Scope covers all six workspace views (Overview, Schedule, Docs, Claims, Audit, System) since the header/scenario-tracker/portfolio-proof chrome is shared across all of them.
- Every task must leave `ng test` and existing component specs passing. Do not use `--no-verify` or skip hooks.
- Follow existing code conventions: Angular signals (`input()`, `output()`, `computed()`), `OnPush` change detection, standalone components, `@reference "../../styles.css"` + `@apply` for Tailwind utility mixing in component CSS.

---

## File Structure

| File | Responsibility | Change |
|---|---|---|
| `frontend/src/app/shell/workspace-header.component.ts/html/css` | Shared header (all views) | Merge status pills into one pill, icon refresh button, tighten title/eyebrow spacing |
| `frontend/src/app/system/scenario-controls.component.ts/html/css` | Shared scenario tracker (all views) | Add collapsed/expanded state, default collapsed |
| `frontend/src/portfolio-showcase.css`, `frontend/src/portfolio-final-polish.css` | Portfolio-proof chip styling | Lighten padding/border/shadow to match new header weight |
| `frontend/src/app/claims/risk-topology.component.ts/html/css` | Risk topology visualization (shared by Overview + Claims) | Add `compact` input/mode |
| `frontend/src/app/overview/overview-workspace.component.html/css` | Overview grid | Use compact topology mode, fix grid row starvation |
| `frontend/src/runway-blocks.ts` (new) | Pure appointment→grid-block layout logic | New file: correct row assignment + lane splitting |
| `frontend/src/runway-blocks.spec.ts` (new) | Unit tests for the above | New file |
| `frontend/src/app.component.ts` | Wires `runwayBlocks` computed | Delegate to `buildRunwayBlocks` |
| `frontend/src/app/schedule/temporal-runway.component.ts/html/css` | Day-grid rendering | Add `lane`/multi-row-per-provider rendering |
| `frontend/src/app/overview/metric-signal-strip.component.css` | Metric icon glow | Stronger inner halo |
| `frontend/src/app/system/system-workspace.component.css` | Runtime/publication panel | Fix label/value run-on text |

---

### Task 1: Header — merge status pills into one pill, icon refresh button

**Files:**
- Modify: `frontend/src/app/shell/workspace-header.component.ts`
- Modify: `frontend/src/app/shell/workspace-header.component.html`
- Modify: `frontend/src/app/shell/workspace-header.component.css`
- Test: `frontend/src/app/shell/workspace-header.component.spec.ts`

**Interfaces:**
- Consumes: existing `WorkspaceViewMetadata`, `RuntimeStatus` (unchanged), the `updatedLabel: input.required<string>()`, `refreshing: input.required<boolean>()`, `refreshRequested: output<void>()` (all unchanged signatures — no caller changes needed).
- Produces: same public API as before. Only internal template/CSS changes.

- [ ] **Step 1: Write the failing test for the merged pill**

Replace the first test in `workspace-header.component.spec.ts` (the one asserting `.live-pill` and `.demo-pill` separately) with an assertion on a single merged pill:

```typescript
it('renders workspace metadata and a single merged status pill', () => {
  const host = render().nativeElement as HTMLElement;

  expect(host.querySelector('h1')?.textContent).toContain('Risk constellation');
  const pill = host.querySelector('.status-pill');
  expect(pill?.textContent).toContain('Live API');
  expect(pill?.getAttribute('data-tone')).toBe('green');
  expect(host.querySelector('.live-pill')).toBeNull();
  expect(host.querySelector('.demo-pill')).toBeNull();
});
```

Also replace the refresh-button test to target an icon button:

```typescript
it('provides an accessible icon refresh control and emits refresh requests when available', () => {
  const fixture = render();
  let refreshes = 0;
  fixture.componentInstance.refreshRequested.subscribe(() => refreshes++);
  const host = fixture.nativeElement as HTMLElement;
  const refresh = host.querySelector('.refresh-control') as HTMLButtonElement;

  expect(host.querySelector('.avatar')?.getAttribute('aria-label')).toBe('Yoshi Gomez');
  expect(refresh.getAttribute('aria-label')).toBe('Refresh');
  refresh.click();
  expect(refreshes).toBe(1);
});
```

And update the disabled/label test:

```typescript
it('disables the refresh control and marks it busy while a refresh is running', () => {
  const refresh = render(true).nativeElement.querySelector('.refresh-control') as HTMLButtonElement;

  expect(refresh.disabled).toBeTrue();
  expect(refresh.getAttribute('aria-busy')).toBe('true');
});
```

Update `componentReducedMotionRule('.live-dot[')` call in the last test to `componentReducedMotionRule('.status-dot[')`.

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd frontend && npx ng test --watch=false --browsers=ChromeHeadless --include='**/workspace-header.component.spec.ts'`
Expected: FAIL — `.status-pill`, `.refresh-control`, `.status-dot` don't exist yet.

- [ ] **Step 3: Implement the merged pill and icon refresh button**

Replace `workspace-header.component.html` in full:

```html
<div class="brand-lockup"><span class="product-name">PracticeOps</span><span class="product-divider"></span><span class="product-context">Clinical Observatory</span></div>
<div class="header-copy"><span class="eyebrow">{{ metadata().eyebrow }}</span><h1>{{ metadata().title }}</h1><p>{{ metadata().description }}</p></div>
<div class="header-actions">
  <span class="status-pill" [attr.data-tone]="runtimeStatus().tone"><span class="status-dot"></span>{{ runtimeStatus().label }}<em>{{ updatedLabel() }}</em></span>
  <button type="button" class="refresh-control" [attr.aria-busy]="refreshing()" [disabled]="refreshing()" aria-label="Refresh" (click)="refreshRequested.emit()"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M13.5 8a5.5 5.5 0 1 1-1.66-3.94M13.5 2v3.5H10" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
  <span class="avatar" aria-label="Yoshi Gomez">YG</span>
</div>
```

Update `workspace-header.component.css`: replace the `.live-pill, .demo-pill` block and `.refresh-control`/`.avatar` rules with:

```css
.status-pill { min-height: 34px; display: inline-flex; align-items: center; gap: 8px; padding: 0 14px; border: 1px solid rgba(51, 87, 134, 0.5); border-radius: 999px; background: rgba(7, 14, 26, 0.75); backdrop-filter: blur(15px); color: #c4ccdc; font-size: 9px; text-transform: uppercase; }
.status-pill { @apply rounded-full border border-white/10 bg-white/[0.035] px-2.5 py-1 text-xs font-medium; }
.status-pill em { font-style: normal; color: #7d899f; text-transform: none; }
.status-pill em::before { content: '·'; margin-right: 8px; color: #4a5772; }
.status-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--cyan); box-shadow: 0 0 11px var(--cyan); animation: pulse 2s infinite; }
.refresh-control { width: 34px; height: 34px; display: grid; place-items: center; border-radius: 999px; @apply border border-white/10 bg-white/[0.035] transition duration-150 ease-out; }
.refresh-control svg { width: 15px; height: 15px; }
.refresh-control[aria-busy='true'] svg { animation: spin 900ms linear infinite; }
.refresh-control:focus-visible { @apply outline-none ring-2 ring-cyan/70 ring-offset-2 ring-offset-obsidian; }
.refresh-control:hover:not(:disabled) { @apply border-cyan/25 bg-white/5; }
.avatar { width: 38px; height: 38px; display: grid; place-items: center; border: 1px solid var(--cyan); border-radius: 50%; color: var(--cyan); font-size: 11px; background: rgba(7, 20, 33, 0.9); box-shadow: 0 0 23px rgba(25, 217, 255, 0.3); }
button { font: inherit; color: inherit; }
button:focus-visible { outline: 2px solid var(--cyan); outline-offset: 3px; }

@keyframes pulse { 50% { opacity: 0.45; transform: scale(0.8); } }
@keyframes spin { to { transform: rotate(360deg); } }
```

Remove the old `.refresh-control { @apply rounded-control ... }` rule block (it's superseded above) and remove the `@media (max-width: 560px) { .demo-pill { display: none; } }` rule (replace with `.status-pill em { display: none; }` at that breakpoint, since the pill now carries both label and detail):

```css
@media (max-width: 560px) {
  .status-pill em { display: none; }
}
```

Add reduced-motion handling for the new spin animation next to the existing rule:

```css
@media (prefers-reduced-motion: reduce) {
  .refresh-control { transition-duration: 1ms; }
  .refresh-control[aria-busy='true'] svg { animation: none; }
  .status-dot { animation: none !important; }
}
```
(This replaces the existing `@media (prefers-reduced-motion: reduce) { .refresh-control { transition-duration: 1ms; } .live-dot { animation: none !important; } }` block.)

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd frontend && npx ng test --watch=false --browsers=ChromeHeadless --include='**/workspace-header.component.spec.ts'`
Expected: PASS

- [ ] **Step 5: Check other specs that assert on the old pill markup**

Run: `cd frontend && grep -rl "live-pill\|demo-pill" src/app/shell/observatory-shell.component.spec.ts`

If `observatory-shell.component.spec.ts` references `.live-pill`/`.demo-pill`, update those assertions to `.status-pill` the same way as Step 1. Re-run:

Run: `cd frontend && npx ng test --watch=false --browsers=ChromeHeadless --include='**/observatory-shell.component.spec.ts'`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add frontend/src/app/shell/workspace-header.component.ts frontend/src/app/shell/workspace-header.component.html frontend/src/app/shell/workspace-header.component.css frontend/src/app/shell/workspace-header.component.spec.ts frontend/src/app/shell/observatory-shell.component.spec.ts
git commit -m "feat: merge header status pills into one pill with icon refresh button"
```

---

### Task 2: Header — tighten title/eyebrow vertical rhythm

**Files:**
- Modify: `frontend/src/app/shell/workspace-header.component.css`

**Interfaces:**
- No API changes — purely visual spacing values.

- [ ] **Step 1: Adjust spacing values**

In `workspace-header.component.css`, change:

```css
.eyebrow { display: block; margin-bottom: 8px; ... }
```
to
```css
.eyebrow { display: block; margin-bottom: 5px; ... }
```

Change:
```css
h1 { margin: 0; max-width: 940px; ... line-height: 0.98; ... }
```
to
```css
h1 { margin: 0; max-width: 940px; ... line-height: 0.94; ... }
```

Change:
```css
.header-copy p { max-width: 700px; margin: 9px 0 0; ... }
```
to
```css
.header-copy p { max-width: 700px; margin: 6px 0 0; ... }
```

These three changes tighten the eyebrow→title→description stack by roughly 8px total, matching Figma's denser rhythm, without touching layout structure.

- [ ] **Step 2: Visually verify**

Run: `cd frontend && npm run start -- --port 4300` (background), then screenshot the Overview page (see Task 9's verification approach for the exact Playwright snippet) and confirm the header stack reads noticeably tighter without any text clipping or overlap at 1600px and 1120px viewport widths.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/app/shell/workspace-header.component.css
git commit -m "style: tighten header title and eyebrow vertical rhythm"
```

---

### Task 3: Scenario tracker — collapsible strip, default collapsed

**Files:**
- Modify: `frontend/src/app/system/scenario-controls.component.ts`
- Modify: `frontend/src/app/system/scenario-controls.component.html`
- Modify: `frontend/src/app/system/scenario-controls.component.css`
- Test: `frontend/src/app/system/scenario-controls.component.spec.ts`

**Interfaces:**
- Consumes: existing inputs/outputs, unchanged.
- Produces: internal `expanded` signal (component-local state — no new inputs/outputs). Since `ScenarioControlsComponent` is instantiated once in `app.component.html` (outside the view `@switch`), this local signal naturally persists across view navigation without any parent wiring.

- [ ] **Step 1: Check the existing spec for baseline expectations**

Run: `cd frontend && cat src/app/system/scenario-controls.component.spec.ts`

Note the existing render helper's default inputs (scenario, currentStep, apiMode, etc.) — the new tests below reuse that helper.

- [ ] **Step 2: Write the failing tests**

Add to `scenario-controls.component.spec.ts`:

```typescript
it('renders collapsed by default with a one-line summary', () => {
  const host = render().nativeElement as HTMLElement;

  expect(host.querySelector('.scenario-strip')).not.toBeNull();
  expect(host.querySelector('.scenario-summary')).toBeNull();
  expect(host.querySelector('.scenario-strip')?.textContent).toContain('Step 1 of');
});

it('expands to the full tracker when the strip is clicked, and can collapse again', () => {
  const fixture = render();
  const host = fixture.nativeElement as HTMLElement;

  (host.querySelector('.scenario-strip') as HTMLButtonElement).click();
  fixture.detectChanges();
  expect(host.querySelector('.scenario-summary')).not.toBeNull();
  expect(host.querySelector('.scenario-strip')).toBeNull();

  (host.querySelector('.scenario-collapse') as HTMLButtonElement).click();
  fixture.detectChanges();
  expect(host.querySelector('.scenario-strip')).not.toBeNull();
  expect(host.querySelector('.scenario-summary')).toBeNull();
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `cd frontend && npx ng test --watch=false --browsers=ChromeHeadless --include='**/scenario-controls.component.spec.ts'`
Expected: FAIL — `.scenario-strip` doesn't exist yet.

- [ ] **Step 4: Implement the collapsed/expanded state**

In `scenario-controls.component.ts`, add the local state and a step-index computed after the existing `complete` input:

```typescript
import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
```
(add `computed` and `signal` to the existing import line)

Add inside the class body, after the existing `readonly actionLabel = input.required<string>();`:

```typescript
  readonly expanded = signal(false);
  readonly currentStepIndex = computed(() =>
    this.scenario().steps.findIndex(step => step.id === this.currentStep().id));

  toggleExpanded(): void {
    this.expanded.update(value => !value);
  }
```

Replace `scenario-controls.component.html` in full:

```html
@if (!expanded()) {
  <button type="button" class="scenario-strip" (click)="toggleExpanded()">
    <span class="panel-kicker">Persisted employer journey</span>
    <span class="scenario-strip-title">Step {{ currentStepIndex() + 1 }} of {{ scenario().totalSteps }} · {{ scenario().title }}</span>
    <span class="scenario-strip-toggle">Expand <i>▾</i></span>
  </button>
} @else {
  <div class="scenario-summary">
    <span class="panel-kicker">Persisted employer journey</span>
    <h2 id="scenario-title">{{ scenario().title }}</h2>
    <p>{{ currentStep().description }}</p>
    <div class="scenario-progress" role="progressbar" aria-label="Scenario progress" [attr.aria-valuenow]="scenario().completionPercent" aria-valuemin="0" aria-valuemax="100"><span [style.width.%]="scenario().completionPercent"></span></div>
    <small>{{ scenario().completedSteps }} of {{ scenario().totalSteps }} persisted transitions complete · {{ scenario().completionPercent }}%</small>
  </div>
  <ol class="scenario-steps" aria-label="Portfolio scenario progress">
    @for (step of scenario().steps; track step.id) {
      <li [attr.data-state]="step.state"><span>{{ $index + 1 }}</span><button type="button" (click)="stepSelected.emit(step.workspace)">{{ step.label }}</button></li>
    }
  </ol>
  <div class="scenario-actions" auto-animate>
    <button type="button" class="scenario-secondary" [disabled]="apiMode() !== 'live' || mutationPending()" (click)="startRequested.emit()">Start / reset</button>
    <button type="button" class="scenario-secondary" (click)="workspaceRequested.emit()">Open current workspace</button>
    <button type="button" class="scenario-primary" [disabled]="!canMutate() && !complete()" (click)="continueRequested.emit()">{{ actionLabel() }}</button>
    @if (apiMode() !== 'live') { <small>Persisted actions require the live API. This preview remains read-only.</small> }
    <button type="button" class="scenario-collapse" (click)="toggleExpanded()">Collapse <i>▴</i></button>
  </div>
}
```

Add to `scenario-controls.component.css`, appended after the existing rules (before the `@media` blocks):

```css
:host([data-expanded='false']) { grid-template-columns: 1fr; padding: 0; margin: 14px 0 18px; overflow: visible; }
.scenario-strip { width: 100%; min-height: 46px; display: flex; align-items: center; gap: 14px; padding: 0 18px; border: 1px solid rgba(142,168,219,.18); border-radius: 999px; background: rgba(8,14,31,.74); color: rgba(223,232,255,.86); font-size: .78rem; cursor: pointer; transition: border-color 160ms ease, background 160ms ease; }
.scenario-strip:hover { border-color: rgba(25,217,255,.34); background: rgba(25,217,255,.06); }
.scenario-strip .panel-kicker { flex: 0 0 auto; }
.scenario-strip-title { flex: 1 1 auto; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: rgba(223,232,255,.92); font-weight: 600; }
.scenario-strip-toggle { flex: 0 0 auto; color: var(--cyan); font-size: .68rem; text-transform: uppercase; letter-spacing: .06em; }
.scenario-collapse { justify-self: start; padding: 6px 12px; border: 1px solid rgba(142,168,219,.22); border-radius: 999px; color: rgba(229,237,255,.7); background: transparent; font-size: .68rem; text-transform: uppercase; letter-spacing: .06em; cursor: pointer; }
.scenario-collapse:hover { border-color: rgba(25,217,255,.34); color: #e9fbff; }
```

Update the host binding in `scenario-controls.component.ts` to expose the expanded state as an attribute for the CSS selector above:

```typescript
  host: {
    '[attr.data-state]': `apiMode() === 'live' ? (complete() ? 'complete' : 'active') : 'preview'`,
    '[attr.data-expanded]': 'expanded()',
    '[attr.aria-labelledby]': `'scenario-title'`
  }
```

- [ ] **Step 5: Update the four existing tests that assumed the tracker starts expanded**

The existing tests `'disables persisted controls while a mutation is pending'`, `'keeps synthetic preview persisted actions disabled and explains the live API requirement'`, `'marks a completed scenario and keeps the proof action available'`, and `'emits explicit navigation and reset intents'` all query `.scenario-secondary`/`.scenario-primary`/`.scenario-actions`/`.scenario-steps button`/`[role="progressbar"]` directly, which now only exist after expanding. Add one line right after each `render(...)` call (before the first assertion) to click the strip open first:

```typescript
  it('disables persisted controls while a mutation is pending', () => {
    const fixture = render({ mutationPending: true });
    (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('.scenario-strip')?.click();
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;
    const buttons = Array.from(host.querySelectorAll('button'));

    expect((buttons.find(button => button.textContent?.includes('Start / reset')) as HTMLButtonElement).disabled).toBeTrue();
    expect((buttons.find(button => button.textContent?.includes('Saving')) as HTMLButtonElement).disabled).toBeTrue();
  });

  it('keeps synthetic preview persisted actions disabled and explains the live API requirement', () => {
    const fixture = render({ apiMode: 'demo' });
    (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('.scenario-strip')?.click();
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;

    expect((host.querySelector('.scenario-secondary') as HTMLButtonElement).disabled).toBeTrue();
    expect((host.querySelector('.scenario-primary') as HTMLButtonElement).disabled).toBeTrue();
    expect(host.querySelector('.scenario-actions')?.textContent).toContain('Persisted actions require the live API');
  });

  it('marks a completed scenario and keeps the proof action available', () => {
    const fixture = render({ complete: true });
    (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('.scenario-strip')?.click();
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;

    expect(host.closest('[data-state="complete"]') ?? host.querySelector('[data-state="complete"]')).not.toBeNull();
    expect(host.querySelector('[role="progressbar"]')?.getAttribute('aria-valuenow')).toBe('100');
    expect(host.querySelector('[role="progressbar"]')?.getAttribute('aria-label')).toBe('Scenario progress');
    expect((host.querySelector('.scenario-primary') as HTMLButtonElement).disabled).toBeFalse();
    expect(host.querySelector('.scenario-primary')?.textContent).toContain('Inspect proof');
  });

  it('emits explicit navigation and reset intents', () => {
    const fixture = render();
    const views: string[] = [];
    let resets = 0;
    fixture.componentInstance.stepSelected.subscribe(view => views.push(view));
    fixture.componentInstance.startRequested.subscribe(() => resets++);
    (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('.scenario-strip')?.click();
    fixture.detectChanges();
    const buttons = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('button'));

    (buttons.find(button => button.textContent?.includes('Start / reset')) as HTMLButtonElement).click();
    (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('.scenario-steps button')?.click();

    expect(resets).toBe(1);
    expect(views).toEqual([dashboard.scenario.steps[0].workspace]);
  });
```

Replace the four matching `it(...)` blocks in `scenario-controls.component.spec.ts` with these versions (same test names, same assertions — only the added expand-click and the resulting `fixture`/`host` extraction differ).

- [ ] **Step 6: Run tests to verify they pass**

Run: `cd frontend && npx ng test --watch=false --browsers=ChromeHeadless --include='**/scenario-controls.component.spec.ts'`
Expected: PASS

- [ ] **Step 7: Run the full component test suite to catch any other spec asserting on removed markup**

Run: `cd frontend && npx ng test --watch=false --browsers=ChromeHeadless`
Expected: PASS. If `app.component.workspace-extraction.spec.ts` or any other spec asserts on `.scenario-summary`/`.scenario-primary`/`.scenario-actions` being visible by default, apply the same expand-click fix used in Step 5.

- [ ] **Step 8: Commit**

```bash
git add frontend/src/app/system/scenario-controls.component.ts frontend/src/app/system/scenario-controls.component.html frontend/src/app/system/scenario-controls.component.css frontend/src/app/system/scenario-controls.component.spec.ts
git commit -m "feat: collapse the persisted-journey scenario tracker to a strip by default"
```

---

### Task 4: Portfolio-proof chip — restyle to match slimmer header

**Files:**
- Modify: `frontend/src/portfolio-showcase.css`
- Modify: `frontend/src/portfolio-final-polish.css`

**Interfaces:** None — pure CSS value changes, no markup or component changes.

- [ ] **Step 1: Lighten the base chip styling**

In `portfolio-showcase.css`, change:

```css
.portfolio-proof { position: fixed; z-index: 14; top: 94px; right: 22px; width: var(--proof-width); max-height: calc(100vh - 126px); overflow: auto; padding: 16px; border: 1px solid rgba(62, 132, 213, .46); border-radius: 16px; background: linear-gradient(160deg, rgba(10, 24, 43, .96), rgba(4, 11, 22, .94)); box-shadow: 0 28px 70px rgba(0,0,0,.44), inset 0 1px rgba(255,255,255,.07); backdrop-filter: blur(22px); }
```
to
```css
.portfolio-proof { position: fixed; z-index: 14; top: 94px; right: 22px; width: var(--proof-width); max-height: calc(100vh - 126px); overflow: auto; padding: 10px 14px; border: 1px solid rgba(51, 87, 134, .4); border-radius: 14px; background: linear-gradient(160deg, rgba(10, 24, 43, .9), rgba(4, 11, 22, .86)); box-shadow: 0 12px 32px rgba(0,0,0,.32), inset 0 1px rgba(255,255,255,.055); backdrop-filter: blur(15px); }
```

- [ ] **Step 2: Lighten the collapsed (default) state**

In `portfolio-final-polish.css`, change:

```css
  .portfolio-proof {
    width: 132px !important;
```
to (within the same `@media (min-width: 1380px)` rule, keep the rest of the block, just add a shadow override alongside `width`):
```css
  .portfolio-proof {
    width: 132px !important;
    box-shadow: 0 12px 32px rgba(0,0,0,.32), inset 0 1px rgba(255,255,255,.055) !important;
```

And change the smaller-viewport collapsed block:

```css
  .portfolio-proof {
    max-height: 58px !important;
```
to
```css
  .portfolio-proof {
    max-height: 44px !important;
    padding: 8px 12px !important;
```

- [ ] **Step 3: Visually verify**

Screenshot the Overview page at 1600px width (desktop, expanded chip layout threshold) and confirm the chip now reads visually lighter, roughly matching the new header status pill's weight, with no text clipping in its collapsed state.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/portfolio-showcase.css frontend/src/portfolio-final-polish.css
git commit -m "style: lighten portfolio-proof chip to match slimmer header"
```

---

### Task 5: Fix Claims Risk Topology — compact mode for Overview's embedding

**Files:**
- Modify: `frontend/src/app/claims/risk-topology.component.ts`
- Modify: `frontend/src/app/claims/risk-topology.component.html`
- Modify: `frontend/src/app/claims/risk-topology.component.css`
- Modify: `frontend/src/app/overview/overview-workspace.component.html`
- Modify: `frontend/src/app/overview/overview-workspace.component.css`
- Test: `frontend/src/app/claims/risk-topology.component.spec.ts`

**Interfaces:**
- Produces: new `compact: input<boolean>(false)` on `RiskTopologyComponent`. Existing `slices`/`totalAtRisk` inputs unchanged. Claims page usage (`app/claims/claims-workspace.component.html`) is unaffected since it doesn't pass `compact` and the default is `false`.

- [ ] **Step 1: Write the failing test**

`risk-topology.component.spec.ts` currently has one `describe` block that renders `RiskTopologyComponent` indirectly through a `HostComponent` wrapper with fixed template bindings (no `compact` input). Add a second, independent `describe` block to the same file that renders `RiskTopologyComponent` directly, so `compact` can be set per test:

```typescript
describe('RiskTopologyComponent compact mode', () => {
  const dashboard = createDemoDashboard(new Date('2026-08-03T15:00:00.000Z'));
  const slices = buildRiskDistribution(dashboard);
  const totalAtRisk = dashboard.metrics.claimsAtRisk;

  beforeEach(() => TestBed.configureTestingModule({
    imports: [RiskTopologyComponent],
    providers: [provideZonelessChangeDetection()]
  }));

  function render(compact?: boolean) {
    const fixture = TestBed.createComponent(RiskTopologyComponent);
    fixture.componentRef.setInput('slices', slices);
    fixture.componentRef.setInput('totalAtRisk', totalAtRisk);
    if (compact !== undefined) fixture.componentRef.setInput('compact', compact);
    fixture.detectChanges();
    return fixture;
  }

  it('applies compact sizing when the compact input is set', () => {
    const host = render(true).nativeElement as HTMLElement;

    expect(host.getAttribute('data-compact')).toBe('true');
  });

  it('defaults to non-compact sizing', () => {
    const host = render().nativeElement as HTMLElement;

    expect(host.getAttribute('data-compact')).toBe('false');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd frontend && npx ng test --watch=false --browsers=ChromeHeadless --include='**/risk-topology.component.spec.ts'`
Expected: FAIL — `compact` input doesn't exist yet.

- [ ] **Step 3: Add the compact input and host binding**

In `risk-topology.component.ts`, add `input` already imported. Add after `readonly totalAtRisk = input.required<number>();`:

```typescript
  readonly compact = input(false);
```

Add `'[attr.data-compact]': 'compact()'` to a new `host` block in the `@Component` decorator (there isn't one currently — add it):

```typescript
@Component({
  selector: 'app-risk-topology',
  standalone: true,
  imports: [CurrencyPipe, DecimalPipe],
  templateUrl: './risk-topology.component.html',
  styleUrl: './risk-topology.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[attr.data-compact]': 'compact()' }
})
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd frontend && npx ng test --watch=false --browsers=ChromeHeadless --include='**/risk-topology.component.spec.ts'`
Expected: PASS

- [ ] **Step 5: Add compact CSS sizing**

In `risk-topology.component.css`, append at the end (before the final `@media (prefers-reduced-motion: reduce)` block, or after — order doesn't matter since specificity is equal and this uses an attribute selector that only matches in compact mode):

```css
:host([data-compact='true']) {
  @apply min-h-56;
}
:host([data-compact='true']) .topology-shell {
  @apply min-h-56;
}
:host([data-compact='true']) .topology-svg {
  @apply min-h-48;
}
:host([data-compact='true']) .core-count { font-size: 19px; }
:host([data-compact='true']) .core-label { font-size: 7px; }
:host([data-compact='true']) .node-count { font-size: 12px; }
:host([data-compact='true']) .node-label { font-size: 6.5px; }
:host([data-compact='true']) .topology-summary { @apply px-3 py-2 text-[0.68rem]; }
```

(`min-h-56` = 14rem = 224px, `min-h-48` = 12rem = 192px — both Tailwind's default spacing scale, matching classes already used elsewhere in this file like `min-h-72`/`min-h-64`.)

- [ ] **Step 6: Wire `compact` on the Overview usage**

In `overview-workspace.component.html`, change:

```html
    <app-risk-topology [slices]="riskDistribution()" [totalAtRisk]="claimsAtRisk()"></app-risk-topology>
```
to
```html
    <app-risk-topology compact [slices]="riskDistribution()" [totalAtRisk]="claimsAtRisk()"></app-risk-topology>
```

- [ ] **Step 7: Fix the Overview grid row so it doesn't starve the risk/activity row**

In `overview-workspace.component.css`, change:

```css
.overview-grid { display: grid; grid-template-columns: minmax(0, 1.25fr) minmax(260px, .66fr) minmax(280px, .8fr); grid-template-areas: "schedule schedule documentation" "schedule risk activity"; gap: 16px; }
```
to
```css
.overview-grid { display: grid; grid-template-columns: minmax(0, 1.25fr) minmax(260px, .66fr) minmax(280px, .8fr); grid-template-rows: minmax(194px, auto) minmax(224px, auto); grid-template-areas: "schedule schedule documentation" "schedule risk activity"; gap: 16px; }
```

(This gives the `risk`/`activity` row an explicit 224px floor, matching the topology's new compact minimum, so the `schedule` item's cross-row span can no longer squeeze it below the height the topology needs.)

Also update the min-height of the wrapping panel to match:

```css
.risk-preview { grid-area: risk; min-height: 200px; padding: 15px 16px; border-radius: 18px; }
```
to
```css
.risk-preview { grid-area: risk; min-height: 224px; padding: 15px 16px; border-radius: 18px; }
```

- [ ] **Step 8: Visually verify the fix**

Start the dev server if not running (`cd frontend && npm run start -- --port 4300`), then screenshot the Overview page with Playwright (pattern from the audit: launch chromium, `page.goto('http://localhost:4300')`, `page.screenshot({ fullPage: true })`) and confirm the Claims Risk Topology panel now shows the center "N AT RISK" node plus all four category nodes with rings and labels, with no stray floating fragments.

- [ ] **Step 9: Run the full frontend test suite**

Run: `cd frontend && npx ng test --watch=false --browsers=ChromeHeadless`
Expected: PASS

- [ ] **Step 10: Commit**

```bash
git add frontend/src/app/claims/risk-topology.component.ts frontend/src/app/claims/risk-topology.component.html frontend/src/app/claims/risk-topology.component.css frontend/src/app/claims/risk-topology.component.spec.ts frontend/src/app/overview/overview-workspace.component.html frontend/src/app/overview/overview-workspace.component.css
git commit -m "fix: render full claims risk topology on Overview via compact mode and grid row fix"
```

---

### Task 6: Fix Schedule day-grid — correct row-to-clinician assignment

**Files:**
- Create: `frontend/src/runway-blocks.ts`
- Create: `frontend/src/runway-blocks.spec.ts`
- Modify: `frontend/src/app.component.ts`
- Modify: `frontend/src/app/schedule/temporal-runway.component.ts`

**Interfaces:**
- Produces: `export interface RunwayBlockInput { readonly id: string; readonly patientDisplayName: string; readonly clinician: string; readonly service: string; readonly status: string; readonly startsAt: string; }` and `export function buildRunwayBlocks(appointments: readonly RunwayBlockInput[], providerNames: readonly string[]): RunwayBlock[]` in `runway-blocks.ts`.
- Consumes (Task 7 depends on this): the `RunwayBlock` interface gains a `lane: number` and `laneCount: number` field (added in this task so Task 7 can use them without touching this file again) — see Step 3 below.

- [ ] **Step 1: Write the failing tests**

Create `frontend/src/runway-blocks.spec.ts`:

```typescript
import { buildRunwayBlocks } from './runway-blocks';

describe('buildRunwayBlocks', () => {
  const providerNames = ['Ava Chen', 'Daniel Ward'];

  it('assigns each block to the grid row matching its own clinician, not a round-robin index', () => {
    const appointments = [
      { id: '1', patientDisplayName: 'Pt A', clinician: 'Daniel Ward', service: 'Individual Therapy', status: 'Scheduled', startsAt: '2026-08-03T08:00:00' },
      { id: '2', patientDisplayName: 'Pt B', clinician: 'Ava Chen', service: 'Individual Therapy', status: 'Scheduled', startsAt: '2026-08-03T09:00:00' },
      { id: '3', patientDisplayName: 'Pt C', clinician: 'Daniel Ward', service: 'Individual Therapy', status: 'Scheduled', startsAt: '2026-08-03T10:00:00' }
    ];

    const blocks = buildRunwayBlocks(appointments, providerNames);

    expect(blocks.find(b => b.id === '1')?.row).toBe(2);
    expect(blocks.find(b => b.id === '2')?.row).toBe(1);
    expect(blocks.find(b => b.id === '3')?.row).toBe(2);
  });

  it('falls back to row 1 for a clinician not present in providerNames', () => {
    const appointments = [
      { id: '1', patientDisplayName: 'Pt A', clinician: 'Unknown Clinician', service: 'Individual Therapy', status: 'Scheduled', startsAt: '2026-08-03T08:00:00' }
    ];

    const blocks = buildRunwayBlocks(appointments, providerNames);

    expect(blocks[0].row).toBe(1);
  });

  it('caps the row at 7 to match the fixed 7-row grid template', () => {
    const manyProviders = Array.from({ length: 10 }, (_, i) => `Provider ${i}`);
    const appointments = [
      { id: '1', patientDisplayName: 'Pt A', clinician: 'Provider 9', service: 'Individual Therapy', status: 'Scheduled', startsAt: '2026-08-03T08:00:00' }
    ];

    const blocks = buildRunwayBlocks(appointments, manyProviders);

    expect(blocks[0].row).toBe(7);
  });

  it('limits to the first 18 appointments', () => {
    const appointments = Array.from({ length: 20 }, (_, i) => ({
      id: String(i), patientDisplayName: `Pt ${i}`, clinician: 'Ava Chen', service: 'Individual Therapy', status: 'Scheduled', startsAt: '2026-08-03T08:00:00'
    }));

    const blocks = buildRunwayBlocks(appointments, providerNames);

    expect(blocks.length).toBe(18);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd frontend && npx ng test --watch=false --browsers=ChromeHeadless --include='**/runway-blocks.spec.ts'`
Expected: FAIL — `./runway-blocks` module doesn't exist yet.

- [ ] **Step 3: Implement `buildRunwayBlocks`**

Create `frontend/src/runway-blocks.ts`:

```typescript
import { SignalTone, toneForStatus } from './dashboard-model';

export interface RunwayBlockInput {
  readonly id: string;
  readonly patientDisplayName: string;
  readonly clinician: string;
  readonly service: string;
  readonly status: string;
  readonly startsAt: string;
}

export interface RunwayBlock {
  readonly id: string;
  readonly patient: string;
  readonly clinician: string;
  readonly service: string;
  readonly status: string;
  readonly time: string;
  readonly row: number;
  readonly lane: number;
  readonly laneCount: number;
  readonly column: string;
  readonly tone: SignalTone;
}

export function buildRunwayBlocks(
  appointments: readonly RunwayBlockInput[],
  providerNames: readonly string[]
): RunwayBlock[] {
  const source = appointments.slice(0, 18);
  const withTiming = source.map(appointment => {
    const start = new Date(appointment.startsAt);
    const hourOffset = Math.max(0, Math.min(9, start.getHours() - 8));
    const span = appointment.service.toLowerCase().includes('assessment') ? 2 : 1;
    const providerIndex = providerNames.indexOf(appointment.clinician);
    const row = Math.min(7, providerIndex >= 0 ? providerIndex + 1 : 1);
    return { appointment, start, hourOffset, span, row };
  });

  const laneByProvider = new Map<number, { end: number; lane: number }[]>();

  return withTiming.map(({ appointment, start, hourOffset, span, row }) => {
    const occupied = laneByProvider.get(row) ?? [];
    const startUnit = hourOffset;
    const endUnit = hourOffset + span;
    let lane = 0;
    while (occupied.some(entry => entry.lane === lane && entry.end > startUnit)) {
      lane++;
    }
    occupied.push({ end: endUnit, lane });
    laneByProvider.set(row, occupied);

    return {
      id: appointment.id,
      patient: appointment.patientDisplayName,
      clinician: appointment.clinician,
      service: appointment.service,
      status: appointment.status,
      time: start.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
      row,
      lane,
      laneCount: 1,
      column: `${hourOffset + 1} / span ${span}`,
      tone: toneForStatus(appointment.status)
    };
  }).map((block, _index, all) => {
    const laneCount = Math.max(...all.filter(b => b.row === block.row).map(b => b.lane)) + 1;
    return { ...block, laneCount };
  });
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd frontend && npx ng test --watch=false --browsers=ChromeHeadless --include='**/runway-blocks.spec.ts'`
Expected: PASS

- [ ] **Step 5: Wire `app.component.ts` to use the new pure function**

In `frontend/src/app.component.ts`, remove the import of `RunwayBlock` from `temporal-runway.component` and add:

```typescript
import { RunwayBlock, buildRunwayBlocks } from './runway-blocks';
```
(remove the old line `import { RunwayBlock } from './app/schedule/temporal-runway.component';`)

Also remove `toneForStatus` from the destructured import at the top of the file if it's no longer used elsewhere in `app.component.ts` — check first:

Run: `cd frontend && grep -n "toneForStatus" src/app.component.ts`

If `toneForStatus` is only used inside the old `runwayBlocks` computed (which you're about to replace), remove it from the import list. If it's used elsewhere in the file, leave it.

Replace the `runwayBlocks` computed:

```typescript
  readonly runwayBlocks = computed<RunwayBlock[]>(() => {
    const source = this.filteredScheduleAppointments().slice(0, 18);
    return source.map((appointment, index) => {
      const start = new Date(appointment.startsAt);
      const hourOffset = Math.max(0, Math.min(9, start.getHours() - 8));
      const span = appointment.service.toLowerCase().includes('assessment') ? 2 : 1;
      return {
        id: appointment.id,
        patient: appointment.patientDisplayName,
        clinician: appointment.clinician,
        service: appointment.service,
        status: appointment.status,
        time: start.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
        row: Math.min(7, (index % Math.max(1, this.providerRows().length)) + 1),
        column: `${hourOffset + 1} / span ${span}`,
        tone: toneForStatus(appointment.status)
      };
    });
  });
```
with
```typescript
  readonly runwayBlocks = computed<RunwayBlock[]>(() =>
    buildRunwayBlocks(this.filteredScheduleAppointments(), this.providerRows()));
```

- [ ] **Step 6: Update `RunwayBlock` re-export in `temporal-runway.component.ts`**

In `frontend/src/app/schedule/temporal-runway.component.ts`, replace the locally-declared `RunwayBlock` interface with a re-export from the new pure file, so existing imports elsewhere (`schedule-workspace.component.ts`) keep working unchanged:

```typescript
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Appointment, humanizeStatus } from '../../dashboard-model';
import { ClinicianLoadMetric } from '../../operational-telemetry';
import { RunwayBlock } from '../../runway-blocks';

export type { RunwayBlock };
```
(remove the old `export interface RunwayBlock { ... }` block entirely — it's now defined in `runway-blocks.ts`.)

- [ ] **Step 7: Run the full frontend test suite**

Run: `cd frontend && npx ng test --watch=false --browsers=ChromeHeadless`
Expected: PASS. Fix any compile errors from the interface move (e.g., unused imports) as they surface.

- [ ] **Step 8: Visually verify**

With the dev server running, screenshot the Schedule page and confirm appointment blocks now align with the correct provider row (each block's row matches the clinician column it visually sits under).

- [ ] **Step 9: Commit**

```bash
git add frontend/src/runway-blocks.ts frontend/src/runway-blocks.spec.ts frontend/src/app.component.ts frontend/src/app/schedule/temporal-runway.component.ts
git commit -m "fix: assign schedule grid blocks to the row matching their actual clinician"
```

---

### Task 7: Fix Schedule day-grid — side-by-side lanes for genuinely overlapping appointments

**Files:**
- Modify: `frontend/src/runway-blocks.spec.ts`
- Modify: `frontend/src/app/schedule/temporal-runway.component.html`
- Modify: `frontend/src/app/schedule/temporal-runway.component.css`

**Interfaces:**
- Consumes: `RunwayBlock.lane` and `RunwayBlock.laneCount`, produced by Task 6's `buildRunwayBlocks`.

- [ ] **Step 1: Write the failing test for lane assignment**

Add to `runway-blocks.spec.ts`:

```typescript
it('assigns overlapping appointments for the same clinician to separate lanes', () => {
  const providerNames = ['Ava Chen'];
  const appointments = [
    { id: '1', patientDisplayName: 'Pt A', clinician: 'Ava Chen', service: 'Diagnostic Evaluation', status: 'Scheduled', startsAt: '2026-08-03T09:20:00' },
    { id: '2', patientDisplayName: 'Pt B', clinician: 'Ava Chen', service: 'Individual Therapy', status: 'Scheduled', startsAt: '2026-08-03T10:40:00' }
  ];

  const blocks = buildRunwayBlocks(appointments, providerNames);
  const first = blocks.find(b => b.id === '1')!;
  const second = blocks.find(b => b.id === '2')!;

  // "Diagnostic Evaluation" is not an assessment service, so it spans 1 hour (9-10),
  // and the second appointment starts at 10-11 -- these do NOT overlap, so both
  // should land in lane 0. This asserts the non-overlap case stays single-lane.
  expect(first.lane).toBe(0);
  expect(second.lane).toBe(0);
  expect(first.laneCount).toBe(1);
});

it('splits into two lanes when two appointments for the same clinician truly overlap in time', () => {
  const providerNames = ['Ava Chen'];
  const appointments = [
    { id: '1', patientDisplayName: 'Pt A', clinician: 'Ava Chen', service: 'Initial Assessment', status: 'Scheduled', startsAt: '2026-08-03T09:00:00' },
    { id: '2', patientDisplayName: 'Pt B', clinician: 'Ava Chen', service: 'Individual Therapy', status: 'Scheduled', startsAt: '2026-08-03T10:00:00' }
  ];

  const blocks = buildRunwayBlocks(appointments, providerNames);
  const first = blocks.find(b => b.id === '1')!;
  const second = blocks.find(b => b.id === '2')!;

  // "Initial Assessment" spans 2 hours (9-11), the second starts at 10-11 -- these
  // genuinely overlap and must land in different lanes.
  expect(first.lane).toBe(0);
  expect(second.lane).toBe(1);
  expect(first.laneCount).toBe(2);
  expect(second.laneCount).toBe(2);
});
```

- [ ] **Step 2: Run tests to verify they fail or pass**

Run: `cd frontend && npx ng test --watch=false --browsers=ChromeHeadless --include='**/runway-blocks.spec.ts'`
Expected: The first new test should already PASS (Task 6's lane algorithm handles non-overlap correctly). The second test should also PASS, since Task 6 already implemented the greedy lane-assignment algorithm with `laneCount`. This step confirms Task 6's lane logic is correct before Task 7 wires it into rendering — if either fails, fix `buildRunwayBlocks` in `runway-blocks.ts` before proceeding (the greedy interval-scheduling loop from Task 6 Step 3 is the reference implementation).

- [ ] **Step 3: Render blocks in their assigned lane**

In `temporal-runway.component.html`, change the appointment-block rendering:

```html
      @for (block of runwayBlocks(); track block.id) {
        <div class="appointment-block" [class.scenario-record]="block.id === scenarioAppointmentId()" role="group" [attr.data-tone]="block.tone" [style.gridRow]="block.row" [style.gridColumn]="block.column" [attr.aria-label]="block.patient + ', ' + block.time + ', ' + statusLabel(block.status)">
          <time>{{ block.time }}</time><strong>{{ block.patient }}</strong><small>{{ statusLabel(block.status) }}</small>
        </div>
      }
```
to
```html
      @for (block of runwayBlocks(); track block.id) {
        <div class="appointment-block" [class.scenario-record]="block.id === scenarioAppointmentId()" [class.is-multilane]="block.laneCount > 1" role="group" [attr.data-tone]="block.tone" [style.gridRow]="block.row" [style.gridColumn]="block.column" [style.--lane]="block.lane" [style.--lane-count]="block.laneCount" [attr.aria-label]="block.patient + ', ' + block.time + ', ' + statusLabel(block.status)">
          <time>{{ block.time }}</time><strong>{{ block.patient }}</strong><small>{{ statusLabel(block.status) }}</small>
        </div>
      }
```

- [ ] **Step 4: Add lane-splitting CSS**

Check the existing `.appointment-block` rule first:

Run: `cd frontend && grep -n "\.appointment-block" src/app/schedule/temporal-runway.component.css`

Add after the existing `.appointment-block` rule (don't remove the existing rule — this adds width/position math on top of it):

```css
.appointment-block {
  --lane: 0;
  --lane-count: 1;
  position: relative;
  width: calc((100% - (var(--lane-count) - 1) * 4px) / var(--lane-count));
  margin-left: calc(var(--lane) * ((100% - (var(--lane-count) - 1) * 4px) / var(--lane-count) + 4px));
}
.appointment-block.is-multilane strong,
.appointment-block.is-multilane small { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
```

This keeps every block's default full-width single-lane behavior unchanged when `laneCount === 1` (the `calc()` reduces to `100%` and `0px` margin), and splits multi-lane blocks into equal-width columns with a 4px gap when two or more appointments truly overlap.

- [ ] **Step 5: Run tests, then visually verify**

Run: `cd frontend && npx ng test --watch=false --browsers=ChromeHeadless`
Expected: PASS

With the dev server running, screenshot the Schedule page's day view and confirm any provider with genuinely overlapping appointments (if the synthetic fixture data produces one) now shows them side-by-side with fully readable text, while non-overlapping appointments are unaffected (full width, unchanged from before).

- [ ] **Step 6: Commit**

```bash
git add frontend/src/runway-blocks.spec.ts frontend/src/app/schedule/temporal-runway.component.html frontend/src/app/schedule/temporal-runway.component.css
git commit -m "fix: split genuinely overlapping schedule appointments into side-by-side lanes"
```

---

### Task 8: Metric icon glow polish

**Files:**
- Modify: `frontend/src/app/overview/metric-signal-strip.component.css`

**Interfaces:** None — pure CSS value changes.

- [ ] **Step 1: Strengthen the inner glow**

Change:

```css
.signal-orb { width: 48px; height: 48px; display: grid; place-items: center; flex: 0 0 auto; border: 1px solid var(--tone); border-radius: 50%; background: radial-gradient(circle at 35% 30%, color-mix(in srgb, var(--tone) 35%, transparent), transparent 48%), rgba(9, 20, 34, .9); box-shadow: 0 0 24px color-mix(in srgb, var(--tone) 35%, transparent), inset 0 0 18px color-mix(in srgb, var(--tone) 15%, transparent); }
```
to
```css
.signal-orb { width: 48px; height: 48px; display: grid; place-items: center; flex: 0 0 auto; border: 1px solid var(--tone); border-radius: 50%; background: radial-gradient(circle at 35% 30%, color-mix(in srgb, var(--tone) 50%, transparent), transparent 58%), rgba(9, 20, 34, .9); box-shadow: 0 0 30px color-mix(in srgb, var(--tone) 45%, transparent), inset 0 0 24px color-mix(in srgb, var(--tone) 26%, transparent); }
```

Change the breathing keyframes' glow amplitude to match:

```css
@keyframes metric-orb-breathe {
  0%, 100% { transform: translateZ(0) scale(1); box-shadow: 0 0 20px color-mix(in srgb, var(--tone) 32%, transparent), inset 0 0 18px color-mix(in srgb, var(--tone) 15%, transparent); }
  50% { transform: translateZ(0) scale(1.055); box-shadow: 0 0 32px color-mix(in srgb, var(--tone) 50%, transparent), inset 0 0 24px color-mix(in srgb, var(--tone) 22%, transparent); }
}
```
to
```css
@keyframes metric-orb-breathe {
  0%, 100% { transform: translateZ(0) scale(1); box-shadow: 0 0 26px color-mix(in srgb, var(--tone) 42%, transparent), inset 0 0 24px color-mix(in srgb, var(--tone) 24%, transparent); }
  50% { transform: translateZ(0) scale(1.055); box-shadow: 0 0 38px color-mix(in srgb, var(--tone) 58%, transparent), inset 0 0 30px color-mix(in srgb, var(--tone) 30%, transparent); }
}
```

- [ ] **Step 2: Visually verify**

Screenshot the Overview page's metric strip and compare against the Figma reference — the icons should read as having a visible soft inner halo rather than a flat outline.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/app/overview/metric-signal-strip.component.css
git commit -m "style: strengthen metric icon glow to match Figma halo treatment"
```

---

### Task 9: System page — fix label/value run-on text in Runtime and publication state panel

**Files:**
- Modify: `frontend/src/app/system/system-workspace.component.css`
- Test: `frontend/src/app/system/system-workspace.component.spec.ts`

**Interfaces:** None — pure CSS layout fix, no template or TS changes.

- [ ] **Step 1: Write the failing test**

`system-workspace.component.spec.ts` already defines a `render(stale = false)` helper (returns a fixture with `dashboard`, `apiMode: 'live'`, `systemState`, `updatedLabel: 'Updated just now'`, `stale`, `refreshing: false`, `mutationPending: false`, `outboxState`, and `preferences` all set, then calls `fixture.detectChanges()`). Add this test using that same helper:

```typescript
it('renders integration row labels and details as separate lines, not run together', () => {
  const host = render().nativeElement as HTMLElement;
  const row = host.querySelector('.integration-row');
  const label = row?.querySelector('strong');
  const detail = row?.querySelector('small');

  expect(label).not.toBeNull();
  expect(detail).not.toBeNull();
  expect(getComputedStyle(label!).display).toBe('block');
  expect(getComputedStyle(detail!).display).toBe('block');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend && npx ng test --watch=false --browsers=ChromeHeadless --include='**/system-workspace.component.spec.ts'`
Expected: FAIL — `strong`/`small` currently default to `inline`.

- [ ] **Step 3: Fix the CSS**

In `system-workspace.component.css`, find this fragment within the combined rule on the line starting `.integration-layout { ... }`:

```css
.integration-row strong { font-size: 7px; }.integration-row small { color: #718097; font-size: 6px; }
```

Replace it with:

```css
.integration-row strong { display: block; font-size: 7px; }.integration-row small { display: block; margin-top: 2px; color: #718097; font-size: 6px; }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd frontend && npx ng test --watch=false --browsers=ChromeHeadless --include='**/system-workspace.component.spec.ts'`
Expected: PASS

- [ ] **Step 5: Visually verify**

Screenshot the System page and confirm rows like "PracticeOps API" / "Static fictional preview" now read as two clearly separated lines instead of a run-on phrase.

- [ ] **Step 6: Run the full frontend test suite one final time**

Run: `cd frontend && npx ng test --watch=false --browsers=ChromeHeadless`
Expected: PASS — this is the final verification that all nine tasks together leave the suite green.

- [ ] **Step 7: Commit**

```bash
git add frontend/src/app/system/system-workspace.component.css frontend/src/app/system/system-workspace.component.spec.ts
git commit -m "fix: separate label and value onto distinct lines in System integration rows"
```

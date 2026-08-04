# Task 5 report: Storybook component-state workshop

## Status

Complete. PracticeOps now has tracked Angular Storybook configuration, deterministic isolated stories for the approved component-state matrix, browser-backed interaction tests, and accessibility checks that fail the Storybook test run on violations.

## Implementation

- Added permanent Angular Storybook 9.0.15 configuration and the `storybook`, `build-storybook`, and `test-storybook` scripts.
- Kept `@storybook/addon-a11y` active globally with `a11y.test = 'error'`.
- Added an isolated provider boundary with no HTTP client or application stores. Stories derive all inputs from `createDashboardFixture`, `createLiveRuntimeFixture`, or `createSyntheticRuntimeFixture`.
- Added the approved five-state matrices for metric strip, runtime notice, claims, schedule, and scenario controls: 25 stories total.
- Added play-function coverage for claim search, schedule view-mode changes, runtime retry events, scenario mutation events, and reduced-motion emulation.
- Added accessible table semantics, named scroll regions, and a named scenario progressbar after the a11y runner identified production component issues.
- Ignored generated `frontend/storybook-static/` output while tracking all configuration and stories.

## TDD / RED evidence

The first browser-backed story run rendered all 25 stories and failed the required interactions before the signal-backed harnesses existed:

```text
npm run test-storybook
Test Suites: 4 failed, 1 passed, 5 total
Tests:       16 failed, 9 passed, 25 total
```

The failures included unchanged claim search state, unchanged schedule List mode, zero retry events, and zero scenario mutation events. The signal-backed story harnesses then made those interactions update real visible state and outputs.

The a11y runner first found an unnamed scenario progressbar. A focused production test was added before the fix:

```text
TOTAL: 1 FAILED, 4 SUCCESS
Expected null to be 'Scenario progress'.
```

After adding the accessible name, the same focused suite passed `TOTAL: 5 SUCCESS`.

The next a11y pass found invalid child roles in the claims table and keyboard-inaccessible horizontal scroll regions. Focused assertions were added before production changes:

```text
# Claims workspace, schedule workspace, and temporal runway focused suite
TOTAL: 3 FAILED, 12 SUCCESS
```

Adding columnheader/cell roles plus named, focusable schedule regions made that suite pass `TOTAL: 15 SUCCESS`.

Finally, the reduced-motion play assertion was introduced before the preview loader:

```text
npm run test-storybook
Test Suites: 1 failed, 4 passed, 5 total
Tests:       1 failed, 24 passed, 25 total
Expected false to be true.
```

The parameter-scoped media-query loader made the final run pass all 25 stories.

## Final verification

Clean dependency install:

```text
npm ci
added 1519 packages, and audited 1520 packages in 1m
Exit code: 0
```

Full frontend regression suite:

```text
npm test -- --watch=false
TOTAL: 97 SUCCESS
Exit code: 0
```

Production build:

```text
npm run build
Application bundle generation complete.
Initial total: 657.27 kB raw, 138.55 kB estimated transfer
Exit code: 0
```

Static Storybook build:

```text
npm run build-storybook
Storybook build completed successfully
Exit code: 0
```

Browser-backed Storybook component and a11y tests, against the local Storybook server on port 6006:

```text
npm run test-storybook
Test Suites: 5 passed, 5 total
Tests:       25 passed, 25 total
Snapshots:   0 total
Time:        9.999 s
Exit code: 0
```

Isolation boundary:

```text
rg -n "OperationalRefreshStore|PortfolioScenarioController|provideHttpClient|HttpClient|fetch\\(|/api/" frontend/src/app -g '*.stories.ts' frontend/src/app/testing/storybook-providers.ts
# no matches
```

Diff hygiene:

```text
git diff --check
Exit code: 0
```

## Commit

- `test: add Storybook component-state workshop`

## Concerns

- The installed runtime is Node.js `v23.6.1`. Angular warns that odd-numbered Node releases are non-LTS and outside its supported engine range; the clean install and all verification commands still passed.
- `npm ci` reports 47 dependency vulnerabilities: 2 low, 19 moderate, 25 high, and 1 critical. This task did not run an automatic audit fix because that could change the pinned dependency graph beyond the approved Storybook scope.
- `@storybook/test-runner` 0.23.0 brings deprecated Jest/Playwright-era transitive packages. It is the Storybook 9-compatible browser runner for the current Angular webpack integration; Angular 20 does not use Storybook's Vite-only Vitest addon.
- The static Storybook build reports expected webpack size warnings and TypeScript warnings for `.storybook/main.ts` and the application `src/main.ts` being outside the Storybook compilation entry path.
- `npm run test-storybook` expects a Storybook server at `http://127.0.0.1:6006`; local Chromium was installed for the browser runner. No Playwright project, direct Playwright dependency, workflow, NSwag, backend, or live-API behavior was added.

## Self-review

- All 25 states are deterministic and fictional, and no story imports a live store, controller, HTTP client, or API path.
- Interaction tests assert user-observable state or emitted-event output rather than only successful rendering.
- The a11y addon remains active in development and fails component tests on violations.
- No generated Storybook output is tracked.
- The temporary modernization workflow, contract-generation work, Playwright end-to-end work, backend, and CI remain untouched.

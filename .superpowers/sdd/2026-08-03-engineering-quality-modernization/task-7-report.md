# Task 7 report: permanent Playwright workflow coverage

## Status

Complete on `feat/engineering-quality-modernization`. Playwright now provides permanent desktop, tablet, mobile, and reduced-motion projects for truthful synthetic fallback, the persisted employer journey, responsive containment, accessibility, keyboard operation, filters, and motion policy.

## Implementation completed

- Pinned `@playwright/test` 1.62.1 and `@axe-core/playwright` 4.12.1 in `frontend/package.json` and `frontend/package-lock.json`.
- Added permanent `test:e2e`, `e2e`, `e2e:ui`, and `e2e:install` scripts.
- Retained failure-only traces, screenshots, and videos, added stable output directories, bounded the suite to two workers, and ignored local Playwright artifacts.
- Kept projects at desktop 1440x1000, tablet 900x1100, mobile 390x844, and desktop reduced motion. Playwright 1.62.1 requires reduced motion through `contextOptions`, which the test proves with `matchMedia`.
- Replaced label-only navigation helpers with workspace IDs, accessible navigation names, expected headings, `aria-current`, and visible state assertions.
- Added deterministic API interception for synthetic preview, unexpected page/console error collection, viewport containment checks, keyboard focus checks, and scenario progress helpers.
- Added the real Docker workflow with direct requests limited to readiness, deterministic setup, and independent verification. Start/reset and all persisted transitions use visible UI controls.
- Added keyboard focusability and complete ARIA table semantics to horizontally scrollable Claims, Audit, and Documentation surfaces uncovered by axe.

## Workflow coverage

- Synthetic `/api/dashboard` failure labels preview data truthfully, keeps all six workspaces navigable, disables every persisted action/reset, leaves retry enabled, sends no mutation requests, and never labels audit data authoritative.
- Schedule Day/Week/List modes and filters remain usable; Claims search, no-results, and clear-filter behavior are verified.
- Every project visits all six workspaces, checks document overflow and visible-panel containment, keeps navigation/scenario/filter controls reachable, and runs axe with zero serious or critical violations.
- Keyboard-only checks exercise the command dock and scenario controls, assert visible focus, `aria-current`, progressbar values, runtime live-region semantics, and KPI status announcements.
- Reduced-motion checks cover the media query, disabled authored GSAP inline movement, materially reduced ambient animation, reduced WebGL atmosphere state, zero-duration scenario motion, and functional navigation/mode changes.
- The live desktop journey resets through the UI, confirms the appointment, submits and signs the note, clears and submits the claim, inspects persisted audit events, compares visible outbox counts to the API snapshot, reloads to prove server persistence, and resets to the deterministic zero-progress/zero-outbox baseline.

## Test-first and debugging evidence

- First meaningful desktop RED: two failures, two passes, one skip. Audit had a critical `aria-required-children` violation because `role=row` lacked cell/header roles; the synthetic collector also saw Chromium's exact deliberate 503 console resource line. The focused GREEN rerun passed 2/2 after adding table roles and narrowing the expected console classification.
- First full-matrix RED: 9 passed, 8 failed, 7 skipped. Eight workers overloaded one Angular/WebGL server, mobile Claims failed axe `scrollable-region-focusable`, and reduced motion was not applied.
- Root cause for reduced motion was verified in installed Playwright 1.62.1: the test fixture no longer forwards a standalone `use.reducedMotion`, while a direct context test proved Chromium supports it. Moving the option under `contextOptions` made the isolated reduced-motion test pass.
- The mobile accessibility regression passed after making only the genuinely scrollable table/pipeline regions keyboard-focusable. Bounding workers to two removed the concurrency timeouts.
- The persisted Docker volume initially returned dashboard HTTP 409 because its fictional scenario rows were absent. The live test now uses the explicitly permitted reset endpoint only for deterministic setup before exercising the visible Start/reset control.
- Subsequent live failures were resilient-selector findings: the scenario appointment is outside the day runway's 18-row display window, and `Published` appears in several panels. The test now switches visibly to List and scopes outbox assertions to the System proof fields.

## Verification

- `npm --prefix frontend ci` — passed; 1,521 packages installed.
- `npm --prefix frontend run e2e:install` — passed; Chromium and platform dependencies available.
- `npm --prefix frontend test -- --watch=false` — passed, 109/109.
- `npm --prefix frontend run build` — passed; production bundle generated.
- `dotnet test PracticeOps.sln --no-restore` — passed, 18/18.
- `npm --prefix frontend run test:e2e` — passed across desktop, tablet, mobile, and reduced-motion: 17 passed, 7 intentional skips, 0 failed in 1.8 minutes. The skips are the stateful live journey outside its dedicated invocation and the reduced-motion-only assertion outside that project.
- `PRACTICEOPS_E2E_LIVE=1 npx playwright test --project=desktop --grep="live persisted employer journey"` — passed, 1/1; test body completed in 14.1 seconds.
- Docker readiness — PostgreSQL and RabbitMQ healthy, API readiness HTTP 200 on port 8081. The final live test restored zero scenario progress and zero outbox messages.
- `git diff --check` — passed before the final report/commit gate.

## Remaining concerns outside Task 7

- This workstation uses unsupported Node `v23.6.1`; all gates passed, but Angular recommends Node 20.19+, 22.12+, or 24+ rather than an odd non-LTS release.
- `npm ci` reports 47 inherited dependency vulnerabilities (2 low, 19 moderate, 25 high, 1 critical). Dependency review belongs to the approved Task 8 cleanup and should not be handled by uncontrolled upgrades here.
- Permanent CI artifact upload and workflow cleanup are intentionally reserved for Task 8. The Playwright runner already retains traces, screenshots, and videos only for failed tests.

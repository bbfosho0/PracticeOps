# Task 8 report: CI, documentation, dependency health, and final verification

## Status

Complete on `feat/engineering-quality-modernization`. The branch now has deterministic read-only CI gates for backend, frontend, Storybook, generated API contract drift, synthetic and live Playwright, and the API/RabbitMQ portfolio journey. Documentation describes the implemented architecture and the Docker boundary, dependency patches are applied conservatively, and the full local acceptance set passes.

## CI and repository cleanup

- Consolidated backend restore/build/test/format, frontend unit/build, Storybook interactions/accessibility, API contract drift, the four-project synthetic Playwright matrix, the live persisted journey, and the API/RabbitMQ acceptance journey into `.github/workflows/ci.yml`.
- Retained the separate rendered responsive `visual-audit.yml` workflow and added least-privilege permissions, concurrency cancellation, a bounded timeout, and failure-only evidence upload.
- Removed the obsolete write-capable `modernization-bootstrap.yml` workflow and the duplicated standalone `nswag-generate.yml` drift job.
- Pinned CI to Node 22, enabled npm/NuGet caches, added per-job timeouts and concurrency cancellation, and upload Playwright reports/traces/screenshots/videos only on failure.
- Kept every verification workflow read-only: repository search found no `contents: write`, `git add`, `git commit`, `git push`, or `continue-on-error` escape hatch.
- Changed project-filtered Playwright commands to execute direct local binaries with `npx --no-install` from `frontend/`. This avoids npm 10 on Windows swallowing `--project`/`--grep` arguments during script forwarding and guarantees each CI matrix cell runs only its declared project.

## Documentation and architecture boundary

- Expanded `README.md`, `docs/portfolio-demo.md`, and `AGENTS.md` with shell/workspace decomposition, domain/application ownership, generated-client versus handwritten-adapter ownership, synthetic/live modes, and exact Storybook, API generation, Playwright, Docker, and verification commands.
- Documented that generated files are machine-owned and application imports go through `PracticeOpsApiAdapter`.
- Documented which checks require Docker and the cleanup commands that remove only PracticeOps resources.

## Dependency health

- Applied safe same-major patches: Angular runtime/compiler packages to 20.3.27, Angular CLI/build packages to 20.3.32, Storybook Angular/core/a11y to 9.1.20, and the direct PostCSS dependency to 8.5.25.
- Kept `@storybook/test-runner` 0.23.0 because it is the compatible Storybook 9 release; 0.24.x targets Storybook 10.
- `npm audit fix --package-lock-only` was used without `--force`. An attempted scoped PostCSS override was rejected because `npm ls` correctly marked the resulting child dependency invalid, so it was removed before the final clean install.
- npm audit improved from 47 findings (2 low, 19 moderate, 25 high, 1 critical) to 14 findings (13 moderate, 1 high, 0 critical). The remaining high finding is a nested PostCSS version under Angular's build package; the moderate findings are inherited through Angular CLI MCP and Storybook/test-runner toolchains. npm's proposed automated remediations require breaking Angular/Storybook version changes, so they are explicitly deferred rather than forced.
- `dotnet list PracticeOps.sln package --vulnerable --include-transitive` reports no vulnerable packages. `--outdated` is dominated by major .NET 10 and test-runner migrations; those are outside a safe patch-only cleanup.

## Test-first and debugging evidence

- Workflow lint first failed on four ShellCheck `SC2034` findings for named retry-loop variables. Renaming those intentionally unused counters to `_attempt` made `actionlint` pass.
- `api:check` twice failed because its isolated RabbitMQ container was declared unhealthy under a two-second healthcheck interval. Standalone RabbitMQ 4.3.4 and the repository Compose service remained healthy with the existing five-second cadence, isolating the failure to the generator's aggressive probe. Aligning it to a five-second interval, 20 retries, and a ten-second start period made the real isolated contract check pass and clean up its containers, network, and volume.
- A Windows `npm run test:e2e -- --project=...` verification ran the stronger full suite because npm 10 did not forward the selection arguments. Permanent filtered CI and documentation commands now invoke the installed Playwright binary directly with `npx --no-install`; `npx --no-install playwright test --list --project=desktop --grep="persists all five transitions"` listed exactly one matching test.

## Final verification

- `docker run --rm -v "${PWD}:/repo" -w /repo rhysd/actionlint:latest` — passed after the focused ShellCheck fix.
- `dotnet restore PracticeOps.sln` — passed.
- `dotnet build PracticeOps.sln --configuration Release --no-restore` — passed with 0 warnings and 0 errors.
- `dotnet test PracticeOps.sln --configuration Release --no-build` — passed, 18/18.
- `dotnet format PracticeOps.sln --verify-no-changes --no-restore` — passed with no changes.
- `npm --prefix frontend ci` — passed from a clean dependency tree; 1,481 packages installed.
- `npm --prefix frontend run test -- --watch=false` — passed, 109/109.
- `npm --prefix frontend run build` — passed; 670.38 kB initial raw bundle and 140.42 kB estimated transfer.
- `npm --prefix frontend run build-storybook` followed by a local static server and `npm --prefix frontend run test-storybook` — passed, 5 suites and 25 story tests.
- `npm --prefix frontend run api:check` — passed against an isolated real PostgreSQL/RabbitMQ/API stack: generated candidate exactly matches the committed contract; all isolated resources were removed.
- `npm --prefix frontend run test:e2e` — passed across desktop, tablet, mobile, and reduced-motion: 17 passed, 11 intentional skips, 0 failed in 2.1 minutes.
- Live opt-in Playwright against the real Docker stack — passed: 19 passed, 9 intentional skips, 0 failed in 2.3 minutes, including the complete five-transition desktop journey and persisted reduced-motion action. The final reset restored the fictional baseline.
- Fresh-volume direct API/RabbitMQ acceptance — passed: 5/5 completed steps, 100% completion, 17 audit events, outbox 5 total / 5 published / 0 pending, and RabbitMQ queue depth 5. Reset then returned 0/5 steps, 12 baseline audit events, and zero outbox counts.
- `docker compose config` — passed.
- `git diff --check` — passed.

## Review and mutation checks

- No live `PracticeOpsApiService` import remains. Generated-client imports outside the generated tree are limited to the handwritten adapter and its focused test.
- Storybook stories/providers contain no application store, controller, HTTP client, or API references.
- Repository searches found no obsolete modernization bootstrap workflow, duplicated NSwag workflow, or unresolved temporary implementation marker in live product code.
- Motion ownership remains separated: atmosphere, scroll reveal, KPI value transitions, and reduced-motion policy are not duplicated across controllers.
- The six workspace browser matrix, Storybook's 25 states, and live persisted journey provide rendered regression coverage; no application behavior changed during Task 8 beyond healthcheck robustness and dependency patch updates.

## Warnings and PR readiness

- This workstation uses unsupported odd Node `v23.6.1`; all local gates pass, while CI uses supported Node 22.
- Storybook build retains non-blocking warnings about `.storybook/main.ts` and `src/main.ts` TypeScript compilation entries and bundle-size guidance. The interaction runner also prints its upstream deprecation/experimental notices.
- Fourteen inherited npm audit findings remain as described above; there are no critical findings and no .NET vulnerable packages.
- Local branch is commit-ready. It is ready to push and open/update for review after this Task 8 commit, but is not merge-ready until GitHub's permanent workflows pass on the exact pushed head. No merge is performed by this task.

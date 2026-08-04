# PracticeOps Engineering Guide

## Product boundary

PracticeOps is a synthetic-data behavioral-health operations demo. Never claim HIPAA certification or production compliance. Do not commit real patient data, credentials, access tokens, or secrets.

## Architecture

- `backend/PracticeOps.Api`: ASP.NET Core modular monolith
- `backend/PracticeOps.Tests`: backend unit and integration-oriented tests
- `frontend/`: Angular standalone application
- PostgreSQL is the system of record
- RabbitMQ receives events published from the transactional outbox

Keep business rules inside domain/application classes, not controllers or Angular components.

## Verification

```bash
dotnet test PracticeOps.sln
npm --prefix frontend ci
npm --prefix frontend run api:check
npm --prefix frontend run test -- --watch=false
npm --prefix frontend run build
npm --prefix frontend run build-storybook
npm --prefix frontend run test:e2e
```

`api:check` requires Docker. `test-storybook` additionally requires the built Storybook to be served at `http://127.0.0.1:6006`. Synthetic Playwright is the default; live Playwright requires the Docker API stack plus `PRACTICEOPS_E2E_LIVE=1`.

## Change rules

- Add a database migration for schema changes.
- Add tests for state transitions and authorization-sensitive behavior.
- Preserve Problem Details responses for API failures.
- Prefer focused modules over generic utility folders.
- Update README setup instructions when commands or environment variables change.
- Treat `frontend/src/generated` as machine-owned; keep handwritten mapping and application policy in the adapter and stores.

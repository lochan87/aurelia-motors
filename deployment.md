# Deployment guide

This document describes a portable deployment for the current foundation. The project does not
commit to a hosting vendor yet. The same topology works on a VM, a container platform, or separate
static and application hosts.

## Topology

```text
Browser
  │
  ├── HTTPS ──> static web host
  │               apps/web/dist
  │               SPA fallback to index.html
  │
  └── HTTPS ──> API host / reverse proxy
                  apps/api/dist/index.js
                  GET /api/health
                        │
                        └── private network / TLS ──> PostgreSQL
```

The web application is a static single-page application. The API is a long-running Node.js
process. PostgreSQL is managed separately and must not be publicly reachable.

## Build artifacts

Run from the repository root:

```powershell
npm ci
npm run build
```

Outputs:

| Artifact         | Location                | Notes                                                  |
| ---------------- | ----------------------- | ------------------------------------------------------ |
| Web static files | `apps/web/dist/`        | Serve with SPA fallback to `index.html`                |
| API JavaScript   | `apps/api/dist/`        | Entry point is `dist/index.js`                         |
| Shared package   | `packages/shared/dist/` | Built before API and web; keep it with the API runtime |

`npm run build` builds the shared package first. Do not deploy only `apps/api` without
`packages/shared/dist`; the API imports the workspace package at runtime.

## Environment configuration

Create production configuration in the platform's secret manager, not in Git. The API reads a root
`.env` only as a local-development convenience; hosted environments should inject variables
directly.

| Variable       | Required       | Production guidance                                                              |
| -------------- | -------------- | -------------------------------------------------------------------------------- |
| `NODE_ENV`     | Yes            | `production`                                                                     |
| `DATABASE_URL` | Yes            | Managed PostgreSQL URL, TLS enabled, least-privilege application role            |
| `API_HOST`     | Yes            | Usually `0.0.0.0` inside a container or `127.0.0.1` behind a local reverse proxy |
| `API_PORT`     | Yes            | Port exposed to the platform or reverse proxy                                    |
| `CORS_ORIGINS` | Yes            | Exact production web origins, comma-separated; no wildcard                       |
| `VITE_API_URL` | Web build only | Public API base URL; baked into the bundle at build time                         |

`VITE_*` values are readable by every browser. Never place a database password, API key, AI key, or
session secret in a `VITE_*` variable.

The API fails fast at startup if a required value is missing or malformed.

## Database deployment

1. Provision PostgreSQL with TLS, automated backups, and point-in-time recovery where available.
2. Create a dedicated application role. Do not use the database superuser.
3. Restrict network access to the API host or private network.
4. Run committed migrations before starting the new API version:

```powershell
npm run db:deploy
```

`prisma migrate deploy` is the production path. `prisma migrate dev` is for disposable local
databases and can create new migration files.

5. Verify the migration history and the `showrooms` table.
6. Start the API and confirm `GET /api/health` returns `200` with `checks.database.status: "up"`.

### Migration practices

- Commit every migration SQL file under `apps/api/prisma/migrations/`.
- Review generated SQL before deploying.
- Back up the database before risky migrations.
- Prefer expand-and-contract changes for zero-downtime deployment: add nullable columns, backfill,
  switch reads and writes, then remove old columns in a later release.
- Never edit an already-applied migration in production.
- Keep rollback plans explicit. Prisma does not generate automatic down migrations.

## API deployment

After `npm ci` and `npm run build`:

```powershell
$env:NODE_ENV = "production"
$env:API_HOST = "0.0.0.0"
$env:API_PORT = "4000"
$env:CORS_ORIGINS = "https://www.example.com"
$env:DATABASE_URL = "postgresql://app:REDACTED@db.example.com:5432/aurelia?sslmode=require"
node apps/api/dist/index.js
```

In a hosted environment, set these in the platform configuration instead of a shell.

Requirements:

- Node.js 24 or newer.
- A process supervisor or container restart policy.
- HTTPS termination at the load balancer or reverse proxy.
- Health probe on `GET /api/health`.
- Graceful shutdown on `SIGTERM`/`SIGINT` (implemented in `apps/api/src/index.ts`; the process stops
  accepting requests and disconnects Prisma).
- Access logs that preserve `X-Request-Id`. Do not log request bodies containing personal data.

The current API trusts the platform's proxy configuration. If it is deployed behind a reverse proxy,
configure Express `trust proxy` deliberately before relying on client IP addresses for rate
limiting or auditing. That change is intentionally not made in the foundation because the hosting
topology is undecided.

### Health probe semantics

- `200` with `status: "ok"`: process is serving and PostgreSQL answered `SELECT 1`.
- `503` with `status: "degraded"`: process is serving but PostgreSQL is unavailable.

A `200` is required before routing production traffic to the new instance. Do not substitute a
shallow `/` check for the database-aware endpoint.

## Web deployment

Build with the production API URL:

```powershell
$env:VITE_API_URL = "https://api.example.com"
npm run build --workspace @aurelia/web
```

Serve `apps/web/dist/` over HTTPS. Configure:

- SPA fallback: unknown non-file paths return `index.html` so React Router can render the privacy and
  404 routes.
- Long-lived immutable caching for `/assets/*` (the files are content-hashed).
- Short cache for `index.html`.
- A valid `/robots.txt` (included in `public/`).
- Compression and HTTP/2 or HTTP/3 where available.

If the web and API are served from the same origin, route `/api/*` to the API process and leave
`VITE_API_URL` empty or set it to that origin. The Vite development proxy is not a production
component.

`CORS_ORIGINS` must include the exact web origin. CORS is not a replacement for authentication or
authorization.

## Security checklist

- [ ] TLS for web, API, and database connections.
- [ ] `NODE_ENV=production`.
- [ ] Strong, unique database role and password, stored in a secret manager.
- [ ] No secrets in Git, build logs, client bundles, screenshots, or error responses.
- [ ] `CORS_ORIGINS` limited to real production origins.
- [ ] API not directly exposed without rate limiting and a reverse proxy.
- [ ] Database not reachable from the public internet.
- [ ] Backups tested by restoring into a separate environment.
- [ ] Dependency audit and lockfile review in CI.
- [ ] Future authentication, session, CSRF, and authorization design reviewed before staff routes
      are added.
- [ ] PII retention, consent records, and DPDP Act 2023 obligations reviewed before lead capture.
- [ ] Log scrubbing for phone numbers, email addresses, and free-text enquiry content.
- [ ] Alerting on health failures and migration failures.

## CI/CD outline

The repository does not include a CI provider configuration yet. A minimal pipeline should run:

```text
npm ci
npm run lint
npm run typecheck
npm test
npm run build
npm audit --audit-level=high
```

Then:

1. Apply migrations in a controlled release step with `npm run db:deploy`.
2. Deploy the API and wait for a healthy `/api/health`.
3. Deploy the static web build.
4. Run a smoke check for `/`, `/privacy`, a 404 path, and the API health endpoint.
5. Keep the previous API artifact available for rollback.

## Local production verification

The foundation was smoke-tested locally with:

```powershell
npm run build
npm run start:api
npm run preview:web
```

Observed:

- `GET /api/health` returned `200`, request ID preserved, database `up`.
- `/`, `/privacy`, and an unknown path all served the SPA shell.
- Lighthouse on the preview reported 100 accessibility, 100 best practices, and 100 SEO.

`npm run preview:web` is a static preview, not a production web server.

## Known deployment gaps

These are intentionally deferred:

- No vendor-specific configuration (Dockerfile, Compose file, Terraform, Cloudflare/Vercel/Netlify
  config, or Kubernetes manifests).
- No authentication or staff authorization yet.
- No structured logging, metrics, tracing, or error-reporting integration.
- No email/SMS provider, object storage, CDN, WAF, or AI provider configuration.
- No final domain, legal pages, grievance officer, or manufacturer branding.
- No production data seed. Do not seed fake inventory or customer records into production.

Resolve these before a public launch. The product roadmap and acceptance criteria are in
[`docs/implementation-plan.md`](docs/implementation-plan.md).

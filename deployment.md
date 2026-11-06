# Deployment guide

This document describes a portable deployment for the Aurelia Motors platform. The project does not
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

The web application is a static single-page application. The API is a long-running Node.js process. PostgreSQL is managed separately and must not be publicly reachable.

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

`npm run build` builds the shared package first. Do not deploy only `apps/api` without `packages/shared/dist`; the API imports the workspace package at runtime.

## Environment configuration

Create production configuration in the platform's secret manager, not in Git. The API reads a root `.env` only as a local-development convenience; hosted environments should inject variables directly.

| Variable                    | Required       | Production guidance                                                              |
| --------------------------- | -------------- | -------------------------------------------------------------------------------- |
| `NODE_ENV`                  | Yes            | `production`                                                                     |
| `DATABASE_URL`              | Yes            | Managed PostgreSQL URL, TLS enabled, least-privilege application role            |
| `API_HOST`                  | Yes            | Usually `0.0.0.0` inside a container or `127.0.0.1` behind a local reverse proxy |
| `API_PORT`                  | Yes            | Port exposed to the platform or reverse proxy                                    |
| `CORS_ORIGINS`              | Yes            | Exact production web origins, comma-separated; no wildcard                       |
| `CSRF_SECRET`               | Recommended    | 32+ byte random secret used for HMAC-SHA256 CSRF verification                    |
| `LEAD_RESPONSE_SLA_MINUTES` | No             | Target first-human-response SLA window in minutes (default 30)                   |
| `AURELIA_DEMO_PASSWORD`     | No             | Default initial password for seeded demo staff accounts (development only)       |
| `VITE_API_URL`              | Web build only | Public API base URL; baked into the bundle at build time                         |

`VITE_*` values are readable by every browser. Never place a database password, API key, AI key, or session secret in a `VITE_*` variable.

The API fails fast at startup if a required value is missing or malformed.

## Cookie and Session Security Behind Proxies

In production, the Express API runs behind an SSL-terminating reverse proxy (e.g. Nginx, Cloudflare, AWS ALB):

- Ensure the reverse proxy forwards `X-Forwarded-Proto: https` and `X-Forwarded-For`.
- The `aurelia_session` cookie is configured with `secure: process.env.NODE_ENV === 'production'`, `httpOnly: true`, and `sameSite: 'lax'`.
- Session tokens are stored in the database as SHA-256 hashes.
- Mutating endpoints verify double-submit HMAC `X-CSRF-Token` headers.

## Database deployment

1. Provision PostgreSQL with TLS, automated backups, and point-in-time recovery where available.
2. Create a dedicated application role. Do not use the database superuser.
3. Restrict network access to the API host or private network.
4. Run committed migrations before starting the new API version:

```powershell
npm run db:deploy
```

`prisma migrate deploy` is the production path. `prisma migrate dev` is for disposable local databases and can create new migration files.

5. Verify the migration history and domain tables.
6. Start the API and confirm `GET /api/health` returns `200` with `checks.database.status: "up"`.

### Seed Accounts (Development & Verification)

To populate the Lucknow showrooms, vehicle catalogue, demo fleet, workshops, and initial staff accounts:

```powershell
npm run db:seed
```

Seeded staff accounts:

- Dealership Administrator: `admin@aureliamotors.com` (`Aurelia2026!`)
- Sales Consultant (Central): `sales.central@aureliamotors.com` (`Aurelia2026!`)
- Sales Consultant (Gomti): `sales.gomti@aureliamotors.com` (`Aurelia2026!`)
- Used Car Specialist: `usedcars@aureliamotors.com` (`Aurelia2026!`)
- Service Advisor (Gomti): `service.gomti@aureliamotors.com` (`Aurelia2026!`)
- Service Advisor (Sushant Golf City): `service.sgc@aureliamotors.com` (`Aurelia2026!`)

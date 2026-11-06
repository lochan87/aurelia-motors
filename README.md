# Aurelia Motors

A foundation for a production-quality car dealership platform in Lucknow, Uttar Pradesh. The
temporary brand is **Aurelia Motors**; it will be replaced when the legal entity and manufacturer
partnerships are confirmed.

This repository is at the **foundation milestone**. It contains a working web shell, API,
PostgreSQL migration path, shared contracts, tests, and the engineering guardrails for the product
that follows. It deliberately does **not** contain inventory, bookings, dashboards, authentication,
or invented business records yet.

## What is implemented

- npm-workspaces monorepo with `apps/web`, `apps/api`, and `packages/shared`.
- Premium responsive storefront shell: editorial hero, standard, showrooms, certified pre-owned,
  workshop, visit, privacy, and 404 routes.
- Accessible navigation, mobile menu, skip link, reduced-motion handling, focus states, and
  colour contrast verified at WCAG AA by Lighthouse.
- React 19 + TypeScript + Vite + Tailwind CSS 4 + React Router + TanStack Query foundation.
- Express 5 API with request IDs, security headers, CORS allow-list, rate limiting, Zod validation,
  consistent response envelopes, centralized errors, and graceful shutdown.
- `GET /api/health` performs a real PostgreSQL `SELECT 1` and returns `503` with
  `status: "degraded"` when the database is unavailable.
- Prisma 6 migration path with a minimal, real `Showroom` table. The rest of the domain model is
  documented in [`docs/database-architecture.md`](docs/database-architecture.md) and intentionally
  not implemented yet.
- Shared TypeScript contracts and INR/paise formatting helpers with unit tests.
- Supertest integration tests for the health check, response envelope, CORS, malformed JSON, and
  validation middleware.
- ESLint, Prettier, strict TypeScript, Vitest, environment validation, and a zero-vulnerability
  `npm audit` result at the time of the foundation commit.

## Stack and versions

| Area            | Choice                                                   |
| --------------- | -------------------------------------------------------- |
| Runtime         | Node.js 24.14.1 (engines: `>=24.0.0`)                    |
| Package manager | npm 10.8.0 workspaces                                    |
| Language        | TypeScript 5.9.3                                         |
| Frontend        | React 19.3.1, Vite 8.3.6, Tailwind CSS 4.3.4             |
| Routing / data  | React Router 7.18.5, TanStack Query 5.106.1              |
| API             | Express 5.3.0, Zod 4.6.7                                 |
| ORM / database  | Prisma 6.19.3, PostgreSQL 18.1                           |
| Tests           | Vitest 5.1.0, Supertest 7.3.1                            |
| Quality         | ESLint 9.39.5, Prettier 3.9.10                           |
| Icons / type    | Lucide React 1.69.0, Fraunces and Manrope variable fonts |

TypeScript is pinned to 5.9.3 because the current `typescript-eslint` release supports
TypeScript `<6.1.0`. Prisma is pinned to 6.19.3. npm overrides keep the transitive audit surface
clean (`deepmerge-ts`, `minimatch`).

## Repository layout

```text
.
├── apps
│   ├── api
│   │   ├── prisma
│   │   │   ├── migrations/20261106050109_init/migration.sql
│   │   │   └── schema.prisma
│   │   ├── src
│   │   │   ├── config       environment and service constants
│   │   │   ├── db           Prisma singleton
│   │   │   ├── lib          response envelopes, errors, async wrapper, DB probe
│   │   │   ├── middleware   request context, errors, validation, rate limit
│   │   │   ├── routes       API router and health route
│   │   │   ├── app.ts       Express composition
│   │   │   └── index.ts     server lifecycle
│   │   └── tests            Supertest + Vitest
│   └── web
│       ├── public           favicon, robots.txt, neutral hero photograph
│       └── src
│           ├── components   layout, home sections, reusable UI
│           ├── lib          query client and class utilities
│           ├── pages        home, privacy, 404
│           ├── styles       Tailwind theme and motion tokens
│           └── app.tsx      router and lazy page composition
├── packages
│   └── shared
│       ├── src              API contracts and formatting helpers
│       └── tests            formatting tests
├── docs
│   ├── architecture.md
│   ├── assumptions.md
│   ├── database-architecture.md
│   └── implementation-plan.md
├── deployment.md
├── README.md
├── package.json
├── tsconfig.base.json
└── eslint.config.mjs
```

## Local setup

### Prerequisites

- Node.js 24 or newer.
- npm 10 or newer.
- PostgreSQL 18 (or a compatible supported PostgreSQL release).

### 1. Configure the environment

```powershell
Copy-Item .env.example .env
```

Edit `.env` and set a real local `DATABASE_URL`. The committed template contains placeholders
only. Never commit `.env`.

### 2. Install

```powershell
npm install
```

This installs all workspaces and runs `prisma generate` through the root `postinstall` script.
Because Prisma reads `DATABASE_URL` from the root `.env`, configure the file first.

### 3. Create or migrate the database

For a fresh local database with the committed migration:

```powershell
npm run db:deploy
```

For a disposable development database where Prisma should create a new migration:

```powershell
npm run db:migrate -- --name describe_the_change
```

### 4. Run both applications

```powershell
npm run dev
```

- Web: <http://localhost:5173>
- API: <http://127.0.0.1:4000>
- Health: <http://127.0.0.1:4000/api/health>

The Vite development server proxies `/api` to `VITE_API_URL`.

### Common scripts

| Command                               | Purpose                                              |
| ------------------------------------- | ---------------------------------------------------- |
| `npm run dev`                         | Build shared code, then run API and web together     |
| `npm run build`                       | Build shared package, API, and production web bundle |
| `npm run typecheck`                   | Strict TypeScript checks across all workspaces       |
| `npm run lint`                        | ESLint across the repository                         |
| `npm test`                            | Shared unit tests and API integration tests          |
| `npm run format`                      | Write Prettier formatting                            |
| `npm run format:check`                | Verify formatting without writing                    |
| `npm run db:generate`                 | Generate Prisma Client                               |
| `npm run db:migrate -- --name <name>` | Create and apply a development migration             |
| `npm run db:deploy`                   | Apply committed migrations                           |
| `npm run db:studio`                   | Open Prisma Studio                                   |
| `npm run start:api`                   | Start the built API                                  |
| `npm run preview:web`                 | Preview the built web application                    |

## API conventions

Successful responses:

```json
{
  "success": true,
  "data": {},
  "meta": {
    "requestId": "…",
    "timestamp": "2026-11-06T00:00:00.000Z"
  }
}
```

Error responses:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The request contains invalid data.",
    "details": []
  },
  "meta": {
    "requestId": "…",
    "timestamp": "2026-11-06T00:00:00.000Z"
  }
}
```

Every request receives an `X-Request-Id` response header. A valid caller-supplied
`X-Request-Id` is preserved. Helmet sets security headers, CORS is allow-listed, and `/api` is
rate limited to 300 requests per 15 minutes per client at this stage.

### Health check

```powershell
curl.exe http://127.0.0.1:4000/api/health
```

A healthy database returns `200` and `data.status: "ok"`. An unreachable database returns `503` and
`data.status: "degraded"`; the health endpoint never reports a database as up without a successful
query.

## Verification

The foundation is expected to pass:

```powershell
npm ci
npm run lint
npm run typecheck
npm test
npm run build
npm audit
```

At the initial commit: lint, typecheck, 13 tests, and the production build pass; `npm audit`
reports zero vulnerabilities; the live API health check returns `200` with the database `up`; and
Lighthouse on the production preview reports 100 for accessibility, best practices, and SEO.

The web build is code-split into route chunks plus React and data vendor chunks. The API health
check was exercised against a local PostgreSQL 18.1 instance; see
[`deployment.md`](deployment.md) for production guidance.

## Scope boundaries

Implemented now:

- Public brand shell and navigation between existing routes.
- API and database foundation.
- Privacy notice as a pre-launch draft.
- Documentation of the future product.

Not implemented now:

- Authentication, staff roles, and protected dashboards.
- Vehicle catalogue, inventory, and on-road price tables.
- Certified pre-owned listings and inspection reports.
- Test drives, service bookings, and capacity enforcement.
- Lead capture, assignment, response tracking, CSV import, and CRM.
- EMI calculator, trade-in workflow, CMS, or AI features.
- Payment, insurance, finance, or manufacturer integrations.
- Any demo credentials or seeded customer data.

The next product milestone is the catalogue and pricing foundation. See
[`docs/implementation-plan.md`](docs/implementation-plan.md).

## Documentation

- [Architecture](docs/architecture.md)
- [Database architecture and planned schema](docs/database-architecture.md)
- [Implementation plan](docs/implementation-plan.md)
- [Assumptions and open questions](docs/assumptions.md)
- [Deployment](deployment.md)

## Environment and secret handling

- `.env` is ignored. Only `.env.example` is committed.
- `VITE_*` variables are public at build time. Never put secrets in them.
- The database URL, future API keys, AI provider keys, and storage credentials must come from the
  deployment platform's secret store.
- The API validates its environment at boot and fails fast on malformed configuration.
- No credentials, customer records, or private keys are included in this repository.

## Photography

The hero and interlude photograph is by **Joshua Käller**, sourced from
[Pexels photo 790183](https://www.pexels.com/photo/silhouette-of-car-with-turned-on-light-790183/).
It is used under the Pexels licence as a neutral placeholder. Attribution is also present in the
site footer. No manufacturer logos or copyrighted vehicle imagery are used.

## Brand and legal status

Aurelia Motors is a temporary project brand. The legal entity, registered address, grievance
officer, manufacturer authorisations, showroom addresses, and contact channels are not final and
are intentionally absent from the interface rather than invented.

---

Built as the first verified foundation for an Isocode Software Engineering internship evaluation.

# Aurelia Motors

A foundation for a production-quality car dealership platform in Lucknow, Uttar Pradesh. The
temporary brand is **Aurelia Motors**; it will be replaced when the legal entity and manufacturer
partnerships are confirmed.

This repository contains the verified foundation, **Milestone 2 — Vehicle Catalogue,
Inventory, and On-Road Pricing**, and **Milestone 3 — End-to-End Test-Drive and Service Booking System**.
It delivers a fully database-backed vehicle catalogue, transparent itemized on-road pricing calculations,
showroom-scoped inventory tracking, certified pre-owned listings with inspection audits, and
capacity-enforced customer booking workflows for both test drives and workshop services.

## What is implemented

- npm-workspaces monorepo with `apps/web`, `apps/api`, and `packages/shared`.
- Database schema with Prisma 6 migrations for vehicle models, variants, specifications, colours,
  images, showroom inventory, versioned price books, price entries, itemized price components,
  certified used vehicles, immutable inspection reports, demo vehicles, test-drive appointments,
  workshops, workshop operating hours, service packages, service appointments, customers, and DPDP consents.
- Idempotent sample-data seeding (`npm run db:seed`) generating 3 showrooms, 5 vehicle models,
  15 variants, 20 colour options, 282 specifications, 45 showroom inventory units, 4 price books,
  264 price components, 10 certified used-car files with 90 inspection items, 13 demo vehicles,
  2 authorized service workshops, and 5 service types.
- Public REST API endpoints:
  - `GET /api/showrooms` and `GET /api/showrooms/:code`
  - `GET /api/catalogue/models` (search, bodyType/fuelType/transmission filters, price bounds, sorting)
  - `GET /api/catalogue/models/:slug` (variants, colours, specs, and showroom availability)
  - `GET /api/catalogue/variants/:slug/pricing` (itemized on-road pricing with mandatory & optional breakdown)
  - `GET /api/used-vehicles` (paginated search, fuel/transmission/year/mileage filters, sorting)
  - `GET /api/used-vehicles/:slug` (complete inspection score, inspector details, and item findings)
  - `GET /api/test-drives/availability` (showroom + variant slot availability with remaining demo fleet counts)
  - `POST /api/test-drives` (idempotent, concurrency-safe test-drive reservation with demo vehicle row lock)
  - `GET /api/services/workshops` (authorized workshops with operating schedules and bay capacities)
  - `GET /api/services/types` (service packages with standard durations and estimated pricing)
  - `GET /api/services/availability` (capacity-checked workshop slot availability)
  - `POST /api/services/bookings` (idempotent, concurrency-safe service booking with bay capacity enforcement)
  - `GET /api/bookings/confirmation/:reference` (booking verification with token-based access and DPDP PII masking)
  - `POST /api/bookings/:reference/cancel` (token-authorized cancellation releasing slot capacity)
  - `GET /api/health` (PostgreSQL probe with status envelope)
- Shared TypeScript contracts and integer-paise pricing calculation helpers (`@aurelia/shared`).
- Premium frontend pages:
  - New vehicle catalogue at `/vehicles`
  - Model and variant detail page with gallery, variant switcher, colour swatches, and showroom availability at `/vehicles/:slug`
  - Interactive test-drive booking modal on vehicle detail page and dedicated booking flow at `/test-drive`
  - Dedicated authorized workshop booking page at `/service`
  - Public booking confirmation and lookup page at `/bookings/confirmation/:reference` with calendar (.ics) download
  - Interactive On-Road Price Calculator with showroom-specific rates and optional add-on checkboxes
  - Certified pre-owned catalogue at `/certified`
  - Certified vehicle detail page with published inspection audit file at `/certified/:slug`
  - Editorial brand landing page (`/`), privacy notice (`/privacy`), and 404 route (`*`)
- Original, lightweight SVG vehicle illustrations clearly labelled as illustrative placeholders.
- 42 automated tests across unit and Supertest integration suites (including concurrency race condition tests and idempotency checks).
- Passing ESLint, Prettier, strict TypeScript, and production build checks.

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
- API and database foundation with PostgreSQL migrations.
- Vehicle catalogue, showroom-scoped inventory, and on-road price tables.
- Certified pre-owned listings and published inspection reports.
- Public vehicle browsing, variant switching, showroom availability, and price breakdown.
- Privacy notice as a pre-launch draft.

Not implemented now (deferred to upcoming milestones):

- Authentication, staff roles, and protected dashboards.
- Test drives, service bookings, and transactional capacity enforcement.
- Lead capture, assignment, response tracking, CSV import, and CRM.
- EMI calculator, trade-in workflow, CMS, or AI features.
- Payment, insurance, finance, or manufacturer integrations.

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

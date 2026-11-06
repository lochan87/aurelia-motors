# Aurelia Motors

A foundation for a production-quality car dealership platform in Lucknow, Uttar Pradesh. The
temporary brand is **Aurelia Motors**; it will be replaced when the legal entity and manufacturer
partnerships are confirmed.

This repository contains the verified foundation, **Milestone 2 — Vehicle Catalogue,
Inventory, and On-Road Pricing**, **Milestone 3 — End-to-End Test-Drive and Service Booking System**, **Milestone 4 — Secure Staff Authentication, Role-Based Access Control, and Dealership Operations Dashboard**, and **Milestone 5 — Customer Enquiries, Lead CRM, Automatic Lead Assignment, Portal CSV Imports, and Response-Time Tracking**.
It delivers a fully database-backed vehicle catalogue, transparent itemized on-road pricing calculations,
showroom-scoped inventory tracking, certified pre-owned listings with inspection audits,
capacity-enforced customer booking workflows, a secure internal staff operations portal with Argon2id authentication,
strict location-based access control, operational metrics, an omnichannel customer enquiry capture pipeline,
deterministic workload-balanced lead routing, third-party portal CSV import and deduplication, and 30-minute first-human-response SLA tracking.

## What is implemented

- npm-workspaces monorepo with `apps/web`, `apps/api`, and `packages/shared`.
- Database schema with Prisma 6 migrations for vehicle models, variants, specifications, colours,
  images, showroom inventory, versioned price books, price entries, itemized price components,
  certified used vehicles, immutable inspection reports, demo vehicles, test-drive appointments,
  workshops, workshop operating hours, service packages, service appointments, customers, DPDP consents,
  staff users, staff sessions, staff location assignments, authentication audit logs, leads,
  lead contact activities, lead internal notes, lead status audit history, and import batches.
- Idempotent sample-data seeding (`npm run db:seed`) generating 3 showrooms, 5 vehicle models,
  15 variants, 20 colour options, 282 specifications, 45 showroom inventory units, 4 price books,
  264 price components, 10 certified used-car files with 90 inspection items, 13 demo vehicles,
  2 authorized service workshops, 5 service types, and 6 staff accounts across roles and Lucknow facilities.
- Public & Staff REST API endpoints:
  - `POST /api/enquiries` (rate-limited public enquiry capture with DPDP consent and automated consultant routing)
  - `GET /api/staff/leads` (location-scoped paginated CRM inbox with status, source, showroom, and urgency filters)
  - `GET /api/staff/leads/metrics` (dealership and showroom-scoped CRM metrics: total, new, overdue, average response time, SLA compliance)
  - `GET /api/staff/leads/:id` (complete lead record, customer details, requirements, notes, and activity audit timeline)
  - `PATCH /api/staff/leads/:id/status` (lead lifecycle transitions with mandatory audit trail)
  - `POST /api/staff/leads/:id/notes` (private internal consultation notes)
  - `POST /api/staff/leads/:id/activities` (records customer outreach and establishes first-human-response SLA time)
  - `PATCH /api/staff/leads/:id/assignment` (Admin only: reassigns lead to another consultant with reason)
  - `POST /api/staff/leads/import/preview` (Admin only: validates third-party portal CSV rows, detects duplicates)
  - `POST /api/staff/leads/import` (Admin only: executes batch ingestion and automated consultant assignment)
  - `GET /api/staff/leads/imports` (Admin only: lists batch ingestion history with row metrics)
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
  - `POST /api/auth/login` (rate limited, Argon2id verification, sets HttpOnly session cookie, issues CSRF token)
  - `POST /api/auth/logout` (revokes session in database, clears cookie)
  - `GET /api/auth/me` (session lookup, returns current staff profile and CSRF token)
  - `POST /api/auth/change-password` (CSRF verified, Argon2id verification and re-hashing)
  - `GET /api/admin/staff` (Admin only: lists all staff users with assignments)
  - `POST /api/admin/staff` (Admin only: provisions new staff with role and location assignments)
  - `PATCH /api/admin/staff/:id` (Admin only: updates staff; prevents demoting/deactivating last admin)
  - `POST /api/admin/staff/:id/disable` (Admin only: disables user and revokes active sessions; safeguards last admin)
  - `GET /api/staff/dashboard` (real database aggregations strictly scoped by role & location assignments)
  - `GET /api/staff/appointments` (location-scoped appointment queue with unmasked customer details for staff)
  - `GET /api/health` (PostgreSQL probe with status envelope)
- Shared TypeScript contracts and integer-paise pricing calculation helpers (`@aurelia/shared`).
- Premium frontend pages:
  - Interactive Enquiry Modal on new vehicle pages, certified vehicle pages, and home visit section
  - Protected Lead CRM Inbox at `/staff/leads` with status tabs, SLA urgency badges, and showroom scoping
  - Protected Lead Detail and Follow-up page at `/staff/leads/:id` with first-response logging, internal notes, and audit timeline
  - Protected Portal CSV Ingestion page at `/staff/leads/import` (Admin only) with row preview, duplicate flagging, and batch execution
  - Sample portal leads file provided at `sample-leads.csv` for reviewers
  - New vehicle catalogue at `/vehicles`
  - Model and variant detail page with gallery, variant switcher, colour swatches, and showroom availability at `/vehicles/:slug`
  - Interactive test-drive booking modal on vehicle detail page and dedicated booking flow at `/test-drive`
  - Dedicated authorized workshop booking page at `/service`
  - Public booking confirmation and lookup page at `/bookings/confirmation/:reference` with calendar (.ics) download
  - Interactive On-Road Price Calculator with showroom-specific rates and optional add-on checkboxes
  - Certified pre-owned catalogue at `/certified`
  - Certified vehicle detail page with published inspection audit file at `/certified/:slug`
  - Staff login page with 1-click reviewer demo quick-fill at `/staff/login`
  - Protected staff operations dashboard at `/staff/dashboard` with role-aware metrics and location scoping notice
  - Protected appointments queue at `/staff/appointments` with unmasked customer details for staff follow-up
  - Protected staff directory and provisioning at `/staff/team` (Admin only, with last-admin safeguard)
  - Built-in Change Password modal in staff layout
  - Editorial brand landing page (`/`), privacy notice (`/privacy`), and 404 route (`*`)
- 80 automated tests across unit and Supertest integration suites (including enquiry submission, duplicate protection, DPDP consent, deterministic workload balancing, first-response SLA tracking, location scoping, portal CSV preview, and batch execution).
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
| Auth / Crypto   | Argon2id (`argon2`), HttpOnly cookies (`cookie-parser`)  |
| Tests           | Vitest 5.1.0, Supertest 7.3.1                            |
| Quality         | ESLint 9.39.5, Prettier 3.9.10                           |
| Icons / type    | Lucide React 1.69.0, Fraunces and Manrope variable fonts |

## Staff Accounts (Evaluation & Testing)

The following accounts are pre-seeded with the demo password `Aurelia2026!` (or via `AURELIA_DEMO_PASSWORD`):

| Role                | Email                             | Facility Scope                             | Permissions                                       |
| ------------------- | --------------------------------- | ------------------------------------------ | ------------------------------------------------- |
| Administrator       | `admin@aureliamotors.com`         | Dealership-wide (HQ, 3 showrooms, 2 shops) | Full access: all metrics, appointments, staff CMS |
| Sales Consultant    | `sales.central@aureliamotors.com` | Central Lucknow Showroom (`LKO-CENTRAL`)   | Scoped: Central test-drives, showroom stock only  |
| Sales Consultant    | `sales.gomti@aureliamotors.com`   | Gomti Nagar Showroom (`LKO-GOMTI`)         | Scoped: Gomti Nagar test-drives & inventory       |
| Service Advisor     | `service.gomti@aureliamotors.com` | Gomti Nagar Workshop (`WS-GOMTI`)          | Scoped: Gomti Nagar service bookings & bays only  |
| Service Advisor     | `service.sgc@aureliamotors.com`   | Sushant Golf City Workshop (`WS-SGC`)      | Scoped: Sushant Golf City service bookings & bays |
| Used Car Specialist | `usedcars@aureliamotors.com`      | Certified Pre-Owned (`LKO-GOMTI`)          | Scoped: certified fleet & multi-point inspections |

The `/staff/login` page includes a **Reviewer Test Accounts** helper section allowing 1-click credential population for convenient evaluation across all roles.

## Verification Commands

To verify the codebase:

```powershell
# Format check
npm run format:check

# Lint
npm run lint

# Strict TypeScript typecheck across all workspaces
npm run typecheck

# Run automated tests (80 passing tests)
npm test

# Production build
npm run build
```

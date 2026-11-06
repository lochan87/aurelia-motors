# Aurelia Motors

A foundation for a production-quality car dealership platform in Lucknow, Uttar Pradesh. The
temporary brand is **Aurelia Motors**; it will be replaced when the legal entity and manufacturer
partnerships are confirmed.

This repository contains the completed, fully verified implementation of all 7 project milestones:

- **Milestone 1 — Project Foundation & Architecture**
- **Milestone 2 — Vehicle Catalogue, Inventory, and On-Road Pricing**
- **Milestone 3 — End-to-End Test-Drive and Service Booking System**
- **Milestone 4 — Secure Staff Authentication, Role-Based Access Control, and Dealership Operations Dashboard**
- **Milestone 5 — Customer Enquiries, Lead CRM, Automatic Lead Assignment, Portal CSV Imports, and Response-Time Tracking**
- **Milestone 6 — Admin CMS, Price Management, Offers, EMI Calculator, Trade-In Requests, and AI-Assisted Lead Operations**
- **Milestone 7 — Final Quality Assurance, Security Audit, Integration Testing, Deployment Preparation, and Submission Packaging**

It delivers a fully database-backed vehicle catalogue, transparent itemized on-road pricing calculations, showroom-scoped inventory tracking, certified pre-owned listings with 150-point inspection audits, capacity-enforced customer booking workflows, a secure internal staff operations portal with Argon2id authentication, strict location-based access control, operational metrics, an omnichannel customer enquiry capture pipeline, deterministic workload-balanced lead routing, third-party portal CSV import and deduplication, 30-minute first-human-response SLA tracking, dealership content & price governance CMS, used car price approvals with separation of duties, reducing-balance EMI calculation, online trade-in valuations, and grounded AI lead intelligence.

## Quickstart for Reviewers

### Option A: Docker Compose (Recommended 1-Click Evaluation)

Requirements: Docker & Docker Compose installed.

```bash
# 1. Clone or extract repository
cd aurelia-motors

# 2. Launch database, API, and Web frontend containers
docker compose up --build
```

- Public Web Application: [http://localhost:5173](http://localhost:5173) or [http://localhost](http://localhost)
- Backend REST API: [http://localhost:4000/api](http://localhost:4000/api)
- API Health Status: [http://localhost:4000/api/health](http://localhost:4000/api/health)
- Staff Operations Portal: [http://localhost:5173/staff/login](http://localhost:5173/staff/login) (with 1-click test login quick-fill)

### Option B: Native Local Setup (Node.js & PostgreSQL)

Requirements: Node.js >= 22 and PostgreSQL 16+ running locally.

```bash
# 1. Install workspace dependencies
npm install

# 2. Configure environment (pre-configured for local testing)
cp .env.example .env

# 3. Apply Prisma database migrations and seed full dealership dataset
npm run db:deploy
npm run db:seed

# 4. Run test suite to verify installation
npm test

# 5. Start development servers
npm run dev
```

The web application starts at `http://localhost:5173` and the API runs at `http://localhost:4000`.

## What is implemented

- npm-workspaces monorepo with `apps/web`, `apps/api`, and `packages/shared`.
- Database schema with Prisma 6 migrations for vehicle models, variants, specifications, colours,
  images, showroom inventory, versioned price books, price entries, itemized price components,
  certified used vehicles, immutable inspection reports, demo vehicles, test-drive appointments,
  workshops, workshop operating hours, service packages, service appointments, customers, DPDP consents,
  staff users, staff sessions, staff location assignments, authentication audit logs, leads,
  lead contact activities, lead internal notes, lead status audit history, import batches,
  used car price proposals, promotion offers, homepage banners, trade-in requests, and staff notifications.
- Idempotent sample-data seeding (`npm run db:seed`) generating 3 showrooms, 5 vehicle models,
  15 variants, 20 colour options, 282 specifications, 45 showroom inventory units, 4 price books,
  264 price components, 10 certified used-car files with 90 inspection items, 13 demo vehicles,
  2 authorized service workshops, 5 service types, 6 staff accounts across roles and Lucknow facilities,
  homepage banners, and promotional campaigns.
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
  - `GET /api/admin/cms/models`, `POST /api/admin/cms/models`, `PATCH /api/admin/cms/models/:id`, `DELETE /api/admin/cms/models/:id` (Admin model CMS)
  - `POST /api/admin/cms/models/:id/variants`, `PATCH /api/admin/cms/variants/:id`, `DELETE /api/admin/cms/variants/:id` (Admin variant CMS)
  - `GET /api/admin/cms/inventory`, `POST /api/admin/cms/inventory`, `PATCH /api/admin/cms/inventory/:id` (Admin showroom inventory unit CMS)
  - `GET /api/admin/cms/price-books`, `POST /api/admin/cms/price-books`, `PUT /api/admin/cms/price-books/:id/entries/:variantId`, `POST /api/admin/cms/price-books/:id/publish`, `POST /api/admin/cms/price-books/:id/archive` (Price book governance and overlap prevention)
  - `POST /api/staff/used-vehicles/:id/propose-price` (Used car staff price proposal submission)
  - `GET /api/staff/used-car-pricing/proposals`, `POST /api/staff/used-car-pricing/proposals/:id/approve`, `POST /api/staff/used-car-pricing/proposals/:id/reject` (Price approvals with separation-of-duties and drift protection)
  - `GET /api/banners` and `GET /api/offers` (Public marketing content)
  - `GET /api/admin/content/banners`, `POST /api/admin/content/banners`, `PATCH /api/admin/content/banners/:id`, `DELETE /api/admin/content/banners/:id` (Admin banner CMS)
  - `GET /api/admin/content/offers`, `POST /api/admin/content/offers`, `PATCH /api/admin/content/offers/:id`, `DELETE /api/admin/content/offers/:id` (Admin offer CMS)
  - `POST /api/trade-ins/estimate` (Instant valuation estimation by depreciation heuristics)
  - `POST /api/trade-ins` (Trade-in submission with reference generation, CRM lead creation, and notifications)
  - `GET /api/staff/trade-ins`, `GET /api/staff/trade-ins/:id`, `PATCH /api/staff/trade-ins/:id` (Staff trade-in queue and valuation offer management)
  - `GET /api/staff/notifications`, `GET /api/staff/notifications/unread-count`, `PATCH /api/staff/notifications/:id/read`, `POST /api/staff/notifications/mark-all-read` (Staff notifications)
  - `POST /api/staff/ai/:leadId/summary` (AI-assisted structured lead intent & urgency summary)
  - `POST /api/staff/ai/:leadId/response-draft` (Human-in-the-loop tailored response drafting for WhatsApp, Email, Phone script)
  - `POST /api/staff/ai/:leadId/recommendations` (Grounded PostgreSQL inventory matching recommendations)
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
- Shared TypeScript contracts, finance arithmetic, and integer-paise pricing calculation helpers (`@aurelia/shared`).
- Premium frontend pages:
  - Reducing-Balance EMI & Finance Calculator with interactive tenure, interest rate, and down payment sliders on vehicle detail pages
  - Customer Vehicle Trade-In Modal with live valuation estimate bands and DPDP consent on vehicle and certified pages
  - Promotional Offers and Hero Banners section on homepage
  - Staff Notifications Popover in the operational header with unread badge and quick navigation
  - Staff Trade-Ins Valuation Queue at `/staff/trade-ins`
  - Staff Used Car Price Approval Queue at `/staff/used-car-pricing` with separation-of-duties validation
  - Dealership Catalogue & Stock Inventory CMS at `/staff/inventory` (Admin only)
  - Dealership Tariff & Price Book CMS at `/staff/pricing` (Admin only)
  - Dealership Marketing Banners & Offers CMS at `/staff/content` (Admin only)
  - Grounded AI Assistant widget embedded directly inside the Lead Detail page (`/staff/leads/:id`) with 1-click draft insertion into outreach logger
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
- 110 automated tests across unit and Supertest integration suites (including CMS operations, used-car price approvals, trade-in requests, content management, notifications, grounded AI assistant, enquiry submission, duplicate protection, DPDP consent, deterministic workload balancing, first-response SLA tracking, location scoping, portal CSV preview, and batch execution).
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

To verify the codebase across formatting, linting, types, tests, and production builds:

```powershell
# Format check
npm run format:check

# Lint (ESLint 9)
npm run lint

# Strict TypeScript typecheck across all workspaces
npm run typecheck

# Run full test suite (126 passing tests across 15 test suites)
npm test

# Production build (API + Web Vite production assets)
npm run build
```

## Documentation & Submission Deliverables

- **Technical Design Document**: Available in markdown (`submission/Aurelia_Motors_Technical_Design_Document.md`), PDF (`submission/Aurelia_Motors_Technical_Design_Document.pdf`), and Microsoft Word (`submission/Aurelia_Motors_Technical_Design_Document.docx`).
- **Deployment Guide**: Comprehensive environment topology, security configuration, reverse-proxy headers, and database instructions in [`deployment.md`](./deployment.md).
- **Architecture & Schema**: Complete database entity-relationship models and architectural design in [`docs/database-architecture.md`](./docs/database-architecture.md) and [`docs/architecture.md`](./docs/architecture.md).

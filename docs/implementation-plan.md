# Implementation plan

## 1. Product goal

Build a trustworthy dealership platform for Lucknow that lets a customer discover a car, understand
its full on-road price, verify a used car's condition, book a test drive or service without
capacity surprises, and get a response from a real person. Staff need one place to see and act on
leads, inventory, pricing, appointments, and content.

This plan sequences **trust-critical foundations** (pricing, capacity, consent, secure auth) before broad surface area.

## 2. Completed milestones

### Foundation (complete)

- Git repository initialized.
- npm-workspaces monorepo with `apps/web`, `apps/api`, `packages/shared`.
- React/TypeScript/Vite/Tailwind/React Router/TanStack Query shell.
- Premium, responsive public landing page, privacy draft, and 404 route.
- Express/TypeScript API with security, validation, errors, request IDs, and rate limiting.
- Prisma/PostgreSQL foundation with `Showroom` table and committed migration.
- Shared contracts and money formatting.
- Vitest/Supertest tests, strict typecheck, ESLint, Prettier.
- Documentation and verified production build.

### Milestone 2: Vehicle Catalogue, Inventory, and On-Road Pricing (complete)

- Database models for VehicleModel, VehicleVariant, VehicleColour, VehicleImage, VehicleSpecification,
  NewVehicleInventory, PriceBook, PriceEntry, PriceComponent, UsedVehicle, UsedVehicleInspection, UsedInspectionItem.
- Applied Prisma migrations: `20261106053641_vehicle_catalogue_inventory_pricing` and `20261106054000_price_and_range_constraints`.
- Idempotent sample-data seed script (`apps/api/prisma/seed.ts`) populating showrooms, models, variants, specifications,
  inventory units, published price books, price components, and certified used cars with inspections.
- REST API endpoints for Showrooms, Catalogue Models, Variant Pricing breakdown, and Certified Used Vehicles.
- Mathematical pricing calculation in integer paise ensuring standard on-road totals equal sum of visible components.
- Responsive frontend pages: `/vehicles` catalogue, `/vehicles/:slug` model and variant detail, `/certified` used-car catalogue,
  and `/certified/:slug` inspection file report.
- Original illustrative placeholder SVG vehicle artwork respecting submission size constraints.
- 33 automated tests across unit and Supertest integration suites.

### Milestone 3: End-to-End Test-Drive and Service Booking System (complete)

- Database models for Customer, CustomerConsent, DemoVehicle, TestDriveAppointment, Workshop, WorkshopOperatingHours,
  ServiceType, and ServiceAppointment.
- Applied Prisma migration: `20261106081807_test_drive_and_service_bookings`.
- Demo fleet stationed across 3 showrooms (Central Lucknow, Gomti Nagar, Sushant Golf City).
- Workshop configuration with hourly bay slot capacity and operating schedules across Gomti Nagar and Sushant Golf City.
- Concurrency-safe slot allocation via PostgreSQL row-level locks (`SELECT ... FOR UPDATE`) preventing race conditions and double-bookings.
- Public customer booking flows:
  - Test-drive modal on vehicle detail page and dedicated `/test-drive` page with real-time demo vehicle availability.
  - Dedicated `/service` page with workshop selection, service packages with upfront estimates, and bay capacity indicators.
  - Public booking confirmation and lookup page at `/bookings/confirmation/:reference` with token-based authorization and DPDP PII masking.
  - Appointment cancellation with slot capacity release.
  - Add to Calendar (.ics) export.
- 42 passing automated tests, including race condition stress tests, idempotency checks, and validation suites.

### Milestone 4: Secure Staff Authentication, Role-Based Access Control, and Dealership Operations Dashboard (complete)

- Database models: `StaffUser`, `StaffSession`, `StaffLocationAssignment`, `AuthenticationAuditEvent`.
- Applied Prisma migration: `20261106095647_staff_authentication_and_rbac`.
- Security implementation:
  - Memory-hard Argon2id password hashing ($m=65536, t=3, p=4$).
  - Secure HttpOnly, SameSite=Lax session cookies. Zero auth tokens in `localStorage`.
  - SHA-256 hashed session digests stored in database.
  - Double-submit HMAC-SHA256 CSRF verification on mutating endpoints.
  - Rate limiting on `/api/auth/login`.
  - Full authentication audit event logging.
- RBAC and Location Scoping:
  - 4 distinct roles: `ADMIN`, `SALES_CONSULTANT`, `SERVICE_ADVISOR`, `USED_CAR_STAFF`.
  - Sales consultants strictly restricted to their assigned showroom's test drives and inventory.
  - Service advisors strictly restricted to their assigned workshop's services and capacity.
  - Admin users granted dealership-wide operational view and staff account management.
  - Administrator lockout protection prevents deactivating or demoting the last active admin.
- REST API endpoints:
  - `POST /api/auth/login` (Rate limited, sets HttpOnly cookie, returns user and CSRF token)
  - `POST /api/auth/logout` (Revokes session, clears cookie)
  - `GET /api/auth/me` (Validates session, returns current user & CSRF token)
  - `POST /api/auth/change-password` (Requires CSRF and current password verification)
  - `GET /api/admin/staff` (Admin only: lists all staff with assignments)
  - `POST /api/admin/staff` (Admin only: provisions staff with role and location assignments)
  - `PATCH /api/admin/staff/:id` (Admin only: edits staff; safeguards last active admin)
  - `POST /api/admin/staff/:id/disable` (Admin only: deactivates staff & revokes sessions; safeguards last active admin)
  - `GET /api/staff/dashboard` (Database aggregations scoped by role & location)
  - `GET /api/staff/appointments` (Location-scoped queue with unmasked customer details for staff)
- Frontend portal routes:
  - `/staff/login`: Login page with 1-click reviewer demo credentials.
  - `/staff/dashboard`: Role-aware operations overview with location scoping notice.
  - `/staff/appointments`: Scoped test drive and workshop booking queue.
  - `/staff/team`: Staff directory and user provisioning dialog (Admin only).
  - Built-in Change Password modal in staff layout.
- 66 passing automated tests covering all auth, RBAC, scoping, and safeguard behaviors.

### Milestone 5: Customer Enquiries, Lead CRM, Automatic Lead Assignment, Portal CSV Imports, and Response-Time Tracking (complete)

- Database models: `Lead`, `LeadActivity`, `LeadNote`, `LeadStatusHistory`, `LeadImportBatch`.
- Applied Prisma migration: `20261106115505_lead_crm_and_enquiries`.
- Omnichannel customer enquiry capture:
  - Rate-limited `POST /api/enquiries` endpoint with DPDP Act 2023 consent capture.
  - Interactive Enquiry Modal on new vehicle detail pages, certified detail pages, and homepage showroom section.
  - Duplicate enquiry protection preventing spam within 30-minute windows.
- Deterministic workload-balanced lead assignment engine:
  - Matches showroom, active status, role (`SALES_CONSULTANT`, `USED_CAR_STAFF`), and least active assigned leads.
  - Breaks ties using least recently assigned consultant.
  - Handles fallback to unassigned queue when no eligible staff are configured.
- First-human-response SLA tracking:
  - Submitting an enquiry or assigning it does **not** count as a human response.
  - Only an explicitly recorded contact action (`POST /api/staff/leads/:id/activities`) establishes `firstResponseAt`.
  - Calculates response duration against configured SLA (default 30 minutes, `LEAD_RESPONSE_SLA_MINUTES`).
  - Flags overdue leads dynamically with urgency indicators.
- Third-party aggregator portal CSV ingestion:
  - Safe RFC 4180-compliant CSV parser with quote, comma, and newline handling.
  - Two-phase ingestion: Preview (`/api/staff/leads/import/preview`) validating rows and flagging duplicates, followed by execution (`/api/staff/leads/import`).
  - Automatic deduplication against external lead IDs and recent contact/model combinations.
  - Batch audit trail with `batchReference`, filename, author, imported count, and duplicate count.
  - Sample test file provided at `sample-leads.csv`.
- Protected Staff CRM Frontend:
  - `/staff/leads`: Lead inbox with status tabs, source filter, showroom filter, search, urgency sort, and SLA response badges.
  - `/staff/leads/:id`: Complete lead profile with customer contact links, lifecycle status transitions, outreach logger, internal notes, and activity timeline.
  - `/staff/leads/import`: Admin CSV upload interface with live preview table and batch execution.
  - Dashboard integration: Inbound enquiry metrics, overdue SLA counter, and recent leads table on `/staff/dashboard`.
- 80 passing automated tests covering enquiry capture, duplicate prevention, routing, response tracking, scoping, and CSV batch processing.

## 3. Future milestones

- **Milestone 6:** Public CMS editing (offers, banners, price publishing).
- **Milestone 7:** AI-assisted lead summarization and vehicle recommendations.

# Implementation plan

## 1. Product goal

Build a trustworthy dealership platform for Lucknow that lets a customer discover a car, understand
its full on-road price, verify a used car's condition, book a test drive or service without
capacity surprises, and get a response from a real person. Staff need one place to see and act on
leads, inventory, pricing, appointments, and content.

This plan starts from the completed foundation. It deliberately sequences **trust-critical
foundations** (pricing, capacity, consent) before broad surface area.

## 2. Completed milestones

### Foundation (complete)

- Git repository initialized.
- npm-workspaces monorepo with `apps/web`, `apps/api`, `packages/shared`.
- React/TypeScript/Vite/Tailwind/React Router/TanStack Query shell.
- Premium, responsive public landing page, privacy draft, and 404 route.
- Express/TypeScript API with security, validation, errors, request IDs, and rate limiting.
- Prisma/PostgreSQL foundation with one `Showroom` table and a committed migration.
- Shared contracts and money formatting.
- Vitest/Supertest tests, strict typecheck, ESLint, Prettier.
- Documentation and a verified production build.

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

Not delivered yet (future milestones):

- Authentication, staff roles, and admin CMS editing.
- Test-drive bookings and service bookings with capacity enforcement.
- Lead capture, assignment, response tracking, CSV import, and CRM.
- EMI calculator and trade-in valuation forms.
- AI lead summarization and recommendations.

## 3. Delivery principles

1. **Server-side truth.** Prices, availability, capacity, and permissions are enforced in the API and
   database, not just hidden in the UI.
2. **No invented business data.** Development fixtures are clearly labelled. Production starts
   empty and is populated through real admin workflows.
3. **Trust before breadth.** A correct price breakdown and a capacity-safe booking are more valuable
   than many half-finished pages.
4. **Accessible by default.** Every feature meets keyboard, focus, contrast, and screen-reader
   expectations before it is considered done.
5. **Measurable completion.** Each milestone has acceptance criteria and automated tests.
6. **Privacy and consent are product requirements.** They are not a footer link added at the end.
7. **Human-in-the-loop AI.** AI drafts and suggests. It does not make final decisions or send
   customer communication unreviewed.

## 4. Milestones

### Milestone 1: Catalogue and on-road pricing

**Outcome:** A customer can browse real models, variants, colours, and showroom availability, and see
an itemised on-road price before submitting an enquiry.

Scope:

- Staff authentication and roles (admin, sales, used-car, service).
- Showroom-scoped inventory.
- Brand/model/variant/colour catalogue.
- Media uploads with alt text and safe public derivatives.
- Price books and components per showroom + variant.
- Public model and variant pages with filters.
- Explicit price breakdown: ex-showroom, RTO/registration, insurance, accessories, extended warranty,
  other; optional vs mandatory.
- Admin price table with draft, publish, retire, and audit.
- Lead enquiry form with consent record.

Acceptance criteria:

- The displayed total equals the sum of visible components for the cited price version.
- A published price cannot be silently edited; a new version is required.
- Every price component has a label and amount; no hidden "other" line.
- Inventory is showroom-specific and availability is server-derived.
- Public pages render real data with loading, empty, and error states.
- API validation rejects unknown fields, invalid amounts, and unpublished price versions.
- Staff price publication is authorized and audited.
- Integration tests cover total calculation, publication, and historical quote stability.

Dependencies: authentication foundation, media storage, catalogue schema, pricing schema.

### Milestone 2: Certified pre-owned

**Outcome:** A used-car listing is a verifiable file, not a photo gallery.

Scope:

- Used listing intake and status workflow.
- Inspection templates, versions, and item results.
- Actual-car photography with ordering and alt text.
- Ownership, service, insurance, and document verification.
- Public filters: make, model, year, price, fuel, transmission, kilometrage, showroom.
- Public inspection report and price breakdown.
- Private documents with reviewed public derivatives only.

Acceptance criteria:

- No published listing exists without a completed inspection version and required photos.
- Inspection results and documents cannot be edited in place after publication; corrections create a
  new version.
- Public pages never expose registration documents, owner PII, or internal notes.
- Filters and pagination work against indexed queries.
- A sold or withdrawn listing is removed from public search but remains auditable.
- Tests cover publication gating and private-document access.

Dependencies: catalogue/media foundation, staff roles, used-car schema.

### Milestone 3: Capacity-safe appointments

**Outcome:** Test drives and workshop appointments are confirmed only against real capacity, with a
named advisor where applicable.

Scope:

- Test-drive slots per showroom and concrete inventory.
- Workshop bays, service advisors, service offerings, and service slots.
- Transactional capacity enforcement.
- Customer booking flow with idempotency, consent, and confirmation.
- Staff appointment calendar and status workflow.
- Reschedule/cancel flows with capacity release.
- Capacity exceptions and workshop closures.

Acceptance criteria:

- Concurrent booking attempts cannot exceed slot capacity.
- A retry with the same idempotency key returns the original booking, not a duplicate.
- A confirmed appointment always references a real slot and showroom.
- Test drives reference available inventory where required.
- Service appointments can reference a named advisor and service offering.
- Capacity failures return a clear `409` with an actionable message.
- Integration tests use a real PostgreSQL database and run concurrent requests.

Dependencies: catalogue/inventory, customers/leads, staff roles.

### Milestone 4: Lead inbox and response operations

**Outcome:** No enquiry is lost, and the team can see who owns it and whether it has been answered.

Scope:

- Unified lead inbox for website enquiries, test drives, service requests, trade-ins, and finance.
- Assignment rules by showroom and lead type, with manual reassignment.
- Response deadlines and first-response tracking.
- Lead activity timeline and notes.
- Status pipeline and lost reasons.
- CSV import with validation, preview, deduplication, and row-level errors.
- Export with permission checks and audit.
- Notification for new leads and overdue responses.

Acceptance criteria:

- Every lead has a source, showroom, status, owner or explicit unassigned state, and consent record
  where required.
- Assignment is idempotent and audited.
- A lead cannot be marked responded without a recorded response event.
- CSV import is transactional per batch, reports row-level errors, and does not create duplicates on
  retry.
- Staff only see leads permitted by role and showroom scope.
- Lists are paginated and optimised for the inbox query.
- Tests cover assignment, response tracking, deduplication, and authorization boundaries.

Dependencies: authentication, customers/consents, appointments, trade-in, finance.

### Milestone 5: Finance and trade-in tools

**Outcome:** A customer can estimate an EMI and request a trade-in valuation with clear assumptions.

Scope:

- EMI calculator using principal, rate, and tenure; monthly EMI, total interest, total payable.
- Clearly labelled assumptions and a zero-interest case.
- Finance enquiry linked to a lead, with consent.
- Trade-in request with vehicle details, condition notes, and photos.
- Staff appraisal workflow and offer status.
- No credit decisioning or payment collection.

Acceptance criteria:

- Calculator output is deterministic and unit-tested against known values.
- Rate and tenure limits are validated; results are labelled as estimates.
- Zero interest does not divide by zero.
- Finance enquiry does not store exploratory calculations unless the customer submits a request.
- Trade-in offers are authorized, audited, and tied to a staff appraiser.
- Customer communication is not sent without the required consent.

Dependencies: catalogue, leads, auth.

### Milestone 6: CMS and AI-assisted operations

**Outcome:** Authorised staff can publish approved content, and AI saves time without bypassing human
review.

Scope:

- CMS pages/sections with draft, review, publish, and revision history.
- Sanitised rich text and media references.
- AI lead summaries and reply suggestions.
- Redaction/minimisation of PII before provider calls.
- Review, accept, edit, and reject flows.
- Provenance: model, prompt version, input reference, reviewer.
- Deterministic fallback when AI is unavailable.

Acceptance criteria:

- Draft content cannot be publicly fetched.
- Publishing is audited and reversible through revisions.
- AI output is stored as untrusted draft and never auto-sent.
- Reviewer identity and timestamp are recorded on accepted output.
- Provider secrets are server-side only and never exposed in `VITE_*` variables.
- Failure of the AI provider does not block the lead workflow.

Dependencies: auth, leads, content model, provider selection.

### Milestone 7: Hardening and launch readiness

**Outcome:** The platform can be operated safely by real staff with real customer data.

Scope:

- Production infrastructure, secrets, backups, restore drill, and monitoring.
- Structured logs with PII scrubbing, metrics, alerts, and error reporting.
- Rate-limit store suitable for multiple API instances.
- Accessibility and browser QA; end-to-end test suite.
- Security review: sessions, CSRF, authorization, file uploads, dependency audit.
- Legal review: privacy notice, consent language, grievance officer, retention.
- Operational runbooks: incidents, migrations, rollback, data requests.
- Load test critical public and booking paths.

Acceptance criteria:

- Health checks, alerts, and dashboards are live.
- Backups have been restored successfully in a separate environment.
- No high/critical dependency or configuration findings remain.
- All critical journeys pass end-to-end tests.
- Privacy, consent, and legal copy are approved for launch.
- Staff roles and audit trails are verified against real workflows.
- Rollback and incident procedures have been rehearsed.

## 5. Suggested sequence and dependencies

```text
Foundation
   │
   ├── Auth + roles ───────────────┐
   ├── Catalogue + media ──┐        │
   │                       ├── Pricing
   │                       │        │
   │                       ├── Used vehicles
   │                       │        │
   │                       └── Test drives / service capacity
   │                                │
   └── Customers + consent ─────────┴── Leads / CRM ── Finance + trade-in
                                                       │
                                                       └── CMS + AI ── Hardening
```

Authentication is deliberately early because price publication, lead assignment, and appointment
management are privileged actions. Consent is also early because leads, test drives, and finance
enquiries all collect personal data.

## 6. Definition of done for every feature

- Product behaviour and edge cases agreed.
- API schema and shared types updated.
- Database migration reviewed and reversible strategy documented.
- Server-side authorization and validation.
- Loading, empty, error, and success states.
- Keyboard, focus, label, and contrast checks.
- Unit/integration tests for invariants; end-to-end test for the critical path.
- No secrets or PII in logs, fixtures, or screenshots.
- Documentation updated.
- No invented production data.
- `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build` pass.

## 7. Risks and mitigations

| Risk                                                  | Impact                         | Mitigation                                                                     |
| ----------------------------------------------------- | ------------------------------ | ------------------------------------------------------------------------------ |
| Price components vary by RTO/insurer and change often | Wrong quote, lost trust        | Versioned price books, admin publishing, audit, explicit components            |
| Booking oversell under concurrency                    | Customer arrives with no slot  | Transactional capacity check, idempotency, DB constraints, concurrency tests   |
| PII exposure through logs or uploads                  | Legal and reputational harm    | Redaction, private storage, reviewed derivatives, least privilege              |
| CSV imports create duplicates or bad data             | Inbox noise, wrong assignments | Preview, row-level validation, checksums, idempotency, transaction per batch   |
| AI output contains errors or invented facts           | Misleading customers           | Human review, provenance, deterministic fallback, no auto-send                 |
| Admin UX becomes a bottleneck                         | Staff work around the system   | Co-design with sales/service staff; measure response and booking time          |
| Scope expands before foundations are solid            | Rework                         | Milestone gates; no feature starts without acceptance criteria                 |
| Hosting/vendor choice delays launch                   | Operational risk               | Portable deployment now; choose vendor at hardening with explicit requirements |

## 8. Open product questions

Tracked in [`assumptions.md`](assumptions.md):

- Confirm the brief's "email calculator" means EMI calculator.
- Final legal entity, domain, showroom addresses, and contact channels.
- Manufacturer authorisations and brand usage.
- Exact on-road price components and tax/insurance responsibilities by showroom.
- Whether test drives require a driving licence upload and for how long it is retained.
- Service capacity unit: bay, advisor, time slot, or a combination.
- Consent purposes, notice versions, and retention periods.
- Staff authentication method and identity provider.
- Whether trade-in valuations are done in person, remotely, or both.

## 9. Immediate next milestone

**Build Milestone 3: Capacity-Safe Appointments (Test Drives & Service Bookings).**

The next implementation slice should be:

1. Test-drive slots per showroom linked to concrete available inventory units.
2. Workshop bays, service offerings, and service slots.
3. Transactional capacity checks (`SELECT ... FOR UPDATE` or atomic concurrency guard).
4. Customer booking flow with idempotency key, personal data capture, and confirmation.
5. Integration tests exercising concurrency and slot exhaustion.

# Assumptions and open questions

This document records the assumptions used to build the foundation and the decisions that must be
confirmed before later milestones. Assumptions are not requirements; they are explicit so they can
be challenged and changed.

## 1. Brand and business context

| Assumption                                                                          | Why it matters                                                         | Status      |
| ----------------------------------------------------------------------------------- | ---------------------------------------------------------------------- | ----------- |
| The temporary brand is **Aurelia Motors**                                           | The brief did not provide a real dealer name or manufacturer partner   | Temporary   |
| Positioning: authorised passenger-car dealer in Lucknow, Uttar Pradesh              | Matches the brief's market and avoids claiming a specific manufacturer | Temporary   |
| The legal entity, registered address, and formal contact channels are not yet known | Inventing them would create false legal and customer information       | Open        |
| The three showroom names and two workshop count describe a **planned** presence     | The interface must not imply open addresses or hours that do not exist | Planned     |
| No manufacturer logos or copyrighted vehicle imagery are used                       | Manufacturer authorisation is unknown                                  | Policy      |
| The hero photograph is a neutral Pexels placeholder by Joshua Käller                | A premium shell is needed without misrepresenting real inventory       | Placeholder |

Open questions:

- What is the final dealer group name, legal entity, GSTIN, and registered address?
- Which manufacturer(s) or multi-brand partnerships are authorised?
- What are the real showroom and workshop addresses, hours, phone numbers, and maps links?
- Which channels may customers use, and who is the grievance officer?

## 2. Scope of the foundation

| Assumption                                                   | Consequence                                                                                      |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------ |
| This iteration is a foundation, not a feature build          | No catalogue, inventory, bookings, dashboards, CRM, or AI are implemented                        |
| No fake inventory, bookings, customer records, or dashboards | The only persisted domain table is `Showroom`; it is empty in production                         |
| Navigation may only point to existing routes                 | The shell links to the landing sections and `/privacy`; there are no dead feature buttons        |
| The 404 and privacy pages are real routes                    | They have content and are reachable, not decorative links                                        |
| Business requirements are documented for the next milestones | The implementation plan and database architecture are design artifacts, not implemented features |

## 3. Technical assumptions

| Assumption         | Decision                                                                       |
| ------------------ | ------------------------------------------------------------------------------ |
| Runtime            | Node.js 24.14.1 is available; `engines` requires Node 24+                      |
| Package manager    | npm 10 workspaces                                                              |
| Language           | TypeScript 5.9.3, pinned because current `typescript-eslint` supports `<6.1.0` |
| Frontend           | React 19, Vite 8, Tailwind CSS 4, React Router 7, TanStack Query 5             |
| Backend            | Express 5, Zod 4                                                               |
| ORM                | Prisma 6.19.3, pinned for stability                                            |
| Database           | PostgreSQL 18.1 for local verification; managed PostgreSQL for production      |
| Tests              | Vitest and Supertest                                                           |
| Node module format | ESM in API and shared packages                                                 |
| Local database     | A local PostgreSQL instance is used for development; Docker is not required    |
| Secrets            | `.env` is local-only and gitignored; production uses a secret manager          |
| API prefix         | `/api`; versioning will be decided before public API consumers exist           |
| Response format    | `{ success, data, meta }` and `{ success: false, error, meta }`                |
| Money              | Integer paise, INR, Indian digit grouping                                      |
| Time               | UTC storage, `Asia/Kolkata` business timezone                                  |
| Health             | Real `SELECT 1`; `503` when the database is down                               |

### Why TypeScript 5.9 and Prisma 6

The newest TypeScript release available upstream was not compatible with the current
`typescript-eslint` range, so 5.9.3 keeps linting and typechecking coherent. Prisma 6.19.3 is the
conventional stable line for the generated client, migration workflow, and the current Node runtime.
These pins should be reviewed together when upgrading the toolchain.

### Why local PostgreSQL instead of Docker for verification

The machine had PostgreSQL 18.1 binaries and a running database service, while the Docker daemon was
not running. An isolated local cluster on port `55432` was used for verification so the system
database on `5432` was not touched. This is a verification detail, not a production architecture
decision. Production should use a managed PostgreSQL service or a deliberately configured cluster.

## 4. Product assumptions

### 4.1 The brief's "email calculator"

The brief mentions an "email calculator". This is interpreted as an **EMI calculator**, because it
sits naturally with finance enquiries and on-road pricing. If the intent was an email composition
tool, that is a different feature and must be clarified before building it.

### 4.2 On-road price

- The displayed on-road price is the sum of mandatory components plus any selected optional
  components.
- Expected components: ex-showroom, RTO/registration, insurance, accessories, extended warranty,
  and other clearly labelled charges.
- RTO and insurance values can differ by showroom and change over time.
- Published prices are versioned. Historical quotes must not silently change.
- Admin users publish prices; the system must not accept a single opaque total without a breakdown.
- Tax treatment (inclusive/exclusive, GST treatment, dealer vs manufacturer responsibilities) needs
  finance/legal confirmation before implementation.

### 4.3 Certified pre-owned

- Every published listing has an inspection report, actual-car photographs, and document history.
- Inspection reports are versioned; corrections do not silently overwrite a published report.
- Filters include make, model, year, price, fuel, transmission, kilometrage, and showroom.
- Registration documents and owner information are private; only reviewed derivatives are public.
- A used vehicle has at most one active listing at a time.

### 4.4 Test drives

- A test drive is tied to a showroom and, where possible, a specific inventory unit.
- Capacity is a property of the slot, enforced transactionally.
- A booking retry with the same idempotency key must not create a duplicate.
- Whether a driving licence is required, and for how long it is retained, is open. If required, it
  should be stored privately and only for the stated purpose.

### 4.5 Workshop capacity

- Capacity may be constrained by bays, advisors, time slots, or a combination. The initial design
  uses a `service_slots.capacity` and an optional named advisor.
- A slot is confirmed only after an atomic capacity check.
- Workshop closures and exceptional capacity are explicit data, not hidden UI rules.
- The customer sees a named advisor and an estimate before work begins.

### 4.6 Leads and CRM

- Lead sources include website, phone, walk-in, referral, and CSV import.
- Every lead has a showroom, source, status, consent record where required, and an owner or an
  explicit unassigned state.
- Response tracking records the first genuine response, not merely an opened record.
- Assignment rules are by showroom and lead type, with manual override.
- CSV import validates row by row, reports errors, and is idempotent.
- Staff see only the leads their role and showroom scope permit.

### 4.7 Roles

Assumed roles:

- **Dealership administrator:** all showrooms, pricing, staff, settings, audit.
- **Sales consultant:** leads, inventory, test drives, and quotes within assigned showroom(s).
- **Used-car desk:** used-car intake, inspection, listing, valuation, trade-in.
- **Service advisor:** workshop appointments, capacity, service estimates, vehicle handover.
- **Customer:** public browsing, enquiries, bookings, and their own requests.

Role names may change. Authorization must be enforced server-side regardless of naming.

### 4.8 CMS and AI

- CMS pages have draft/review/publish states and revision history.
- Public pages never expose drafts.
- AI summaries and reply suggestions are untrusted drafts requiring human review.
- AI must not make final pricing, credit, insurance, or safety decisions.
- PII should be minimised or redacted before any provider call.
- The system must work without AI if the provider is unavailable.

## 5. Privacy and consent assumptions

- The platform is intended for adults.
- The Digital Personal Data Protection Act, 2023 is the relevant Indian privacy framework.
- Consent is purpose-specific and recorded with a notice version, timestamp, source, and withdrawal
  event.
- Consent is not bundled into unrelated terms.
- Customers may request access, correction, erasure, and withdrawal, subject to legal retention.
- A grievance officer and contact channel will be appointed before public launch.
- The privacy page is a pre-launch baseline and requires legal review.
- No analytics, advertising cookies, or third-party tracking are added in the foundation.
- Logs and error reports must be scrubbed of phone numbers, email addresses, free-text notes, and
  document URLs.

## 6. Security assumptions

- Production runs with TLS for web, API, and database.
- The database is not publicly reachable.
- The application uses a least-privilege database role.
- Secrets live in a platform secret manager, never in Git or `VITE_*` variables.
- Sessions will use secure, HTTP-only, same-site cookies; tokens will not be stored in
  `localStorage`.
- CSRF protection is required for cookie-authenticated mutations.
- File uploads will be type- and size-validated, stored privately, and served through reviewed
  derivatives.
- Rate limiting will need a shared store when the API runs more than one instance.
- Authentication, authorization, and audit are **not implemented yet**. Do not expose staff or
  customer data until they are.

## 7. Deployment assumptions

- The web application is static and can be hosted on any CDN or static host with SPA fallback.
- The API is a long-running Node process.
- PostgreSQL is managed separately.
- `VITE_API_URL` is a public build-time value.
- `CORS_ORIGINS` is an exact allow-list.
- Migrations run before the new API version starts.
- `/api/health` is the readiness probe.
- No hosting vendor has been selected. The deployment guide is intentionally portable.

## 8. Open questions before Milestone 1

1. Confirm whether "email calculator" means EMI calculator.
2. Provide the final legal entity, brand, domain, and contact channels.
3. Confirm manufacturer/multi-brand authorisations and brand usage rules.
4. Confirm the exact on-road price components, tax treatment, and who owns RTO/insurance values.
5. Confirm whether test drives require a licence upload and the retention period.
6. Confirm workshop capacity semantics: bay, advisor, time slot, or combined.
7. Confirm staff identity provider and login method (email/password, SSO, phone OTP).
8. Confirm consent purposes, notice versions, and retention periods.
9. Confirm whether trade-in valuations are remote, in person, or both.
10. Confirm whether customers can manage bookings without an account, and how they prove ownership
    of a booking.

## 9. Assumptions that must not leak into production

- The placeholder brand must not be presented as a registered legal entity.
- The planned showroom names must not be published with invented addresses or hours.
- The Pexels photograph must not be described as the dealership's own inventory.
- No demo credentials, seeded leads, fake prices, or sample bookings may be loaded into production.
- The absence of authentication must not be mistaken for a finished security posture.
- The health endpoint's database probe is not a substitute for full monitoring.

When an assumption is confirmed or changed, update this document and the relevant architecture or
plan before changing the implementation.

# Assumptions and open questions

This document records the assumptions used to build the foundation, vehicle catalogue, bookings, and staff authentication/RBAC systems. Assumptions are not requirements; they are explicit so they can be challenged and changed.

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

## 2. Scope of current implementation

| Component                                   | Current status                                                                                  |
| ------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Vehicle catalogue & pricing (M2)            | Complete: 5 models, 15 variants, 20 colours, on-road price breakdowns, certified pre-owned      |
| Bookings & capacity (M3)                    | Complete: test drives, workshop services, concurrency locks, DPDP privacy, cancellation         |
| Staff Auth & RBAC (M4)                      | Complete: Argon2id auth, secure HttpOnly sessions, CSRF, location scoping, dashboards, team CMS |
| Lead CRM & portal CSV import (M5)           | Complete: enquiry modal, CRM inbox, deterministic routing, 30m human-response SLA, CSV imports  |
| Public CMS editing (offers, banners) (M6)   | Planned for future milestone                                                                    |
| AI lead summarization & recommendations(M7) | Planned for future milestone                                                                    |

## 3. Technical assumptions

| Assumption         | Decision                                                                       |
| ------------------ | ------------------------------------------------------------------------------ |
| Runtime            | Node.js 24.14.1 is available; `engines` requires Node 24+                      |
| Package manager    | npm 10 workspaces                                                              |
| Language           | TypeScript 5.9.3, pinned because current `typescript-eslint` supports `<6.1.0` |
| Frontend           | React 19, Vite 8, Tailwind CSS 4, React Router 7, TanStack Query 5             |
| Backend            | Express 5, Zod 4                                                               |
| Password hashing   | Argon2id (`$argon2id$v=19$m=65536,t=3,p=4`) via `argon2`                       |
| Session storage    | Database-backed `StaffSession` (SHA-256 hashed token); HttpOnly session cookie |
| CSRF protection    | HMAC-SHA256 double-submit header (`X-CSRF-Token`) on mutating endpoints        |
| Token storage      | **No `localStorage` auth tokens.** HttpOnly cookie + in-memory CSRF token      |
| ORM                | Prisma 6.19.3, pinned for stability                                            |
| Database           | PostgreSQL 18.1 for local verification; managed PostgreSQL for production      |
| Tests              | Vitest and Supertest (80 automated tests)                                      |
| Node module format | ESM in API and shared packages                                                 |
| Money              | Integer paise, INR, Indian digit grouping                                      |
| Time               | UTC storage, `Asia/Kolkata` business timezone                                  |
| Health             | Real `SELECT 1`; `503` when the database is down                               |

## 4. Product assumptions

### 4.1 The brief's "email calculator"

The brief mentions an "email calculator". This is interpreted as an **EMI calculator**, because it sits naturally with finance enquiries and on-road pricing.

### 4.2 On-road price

- The displayed on-road price is the sum of mandatory components plus any selected optional components.
- Implemented components: ex-showroom, road tax, comprehensive insurance, registration & handling, logistics & documentation, and optional accessory pack and extended warranty.
- RTO and insurance values differ by showroom and are calculated deterministically without floating-point errors in integer paise.
- Published prices are versioned through `PriceBook`. Draft price books are strictly excluded from public customer quotes.

### 4.3 Certified pre-owned

- Every published listing has an inspection report, actual-car photographs, and document history.
- Inspection reports are versioned; corrections do not silently overwrite a published report.
- Registration documents and owner information are private; only reviewed derivatives are public.

### 4.4 Test drives & workshop bookings

- Slot concurrency enforced via database row-level locks (`SELECT ... FOR UPDATE`).
- Public confirmation endpoints mask customer PII unless the private confirmation token is provided.
- Cancellations safely release allocated demo vehicle or workshop bay capacity.

### 4.5 Staff Authentication, RBAC, and Location Scoping

- **Argon2id hashing:** Password hashing utilizes memory-hard Argon2id ($m=65536, t=3, p=4$) preventing GPU/ASIC rainbow table attacks.
- **Session management:** Raw session tokens are never stored in the database; only SHA-256 digests are persisted. Cookies are configured with `HttpOnly`, `SameSite=Lax`, and `Secure` flags.
- **CSRF Token binding:** Mutating endpoints (`POST`, `PATCH`, `DELETE`) require `X-CSRF-Token` derived from HMAC-SHA256 of the active session token, preventing cross-site request forgery without requiring shared state or external caches.
- **Role Scoping:**
  - `ADMIN`: Dealership-wide clearance across all 3 showrooms and 2 workshops; access to staff management.
  - `SALES_CONSULTANT`: Scoped strictly to the consultant's primary assigned showroom (`LKO-CENTRAL`, `LKO-GOMTI`, or `LKO-SGC`); can only view test-drives and inventory at that showroom.
  - `SERVICE_ADVISOR`: Scoped strictly to the advisor's assigned workshop (`WS-GOMTI` or `WS-SGC`); can only view service bookings and capacity for that workshop.
  - `USED_CAR_STAFF`: Scoped to certified pre-owned fleet inventory and multi-point inspection audits.
- **Administrator Safeguard:** The server strictly rejects deactivating or demoting the last remaining active administrator account, preventing accidental dealership-wide lockouts.
- **Audit Logging:** Every authentication attempt (success, failure, bad password, inactive account, password change, logout) is recorded in `AuthenticationAuditEvent`.
- **Reviewer Accounts:** Seeded accounts use the demo password `Aurelia2026!` (configurable via `AURELIA_DEMO_PASSWORD`).

### 4.6 Lead CRM, Omnichannel Enquiries, Assignment & SLA Tracking

- **Omnichannel Ingestion:** Captures web enquiries via public modal and third-party portal leads via RFC 4180-compliant CSV upload.
- **Deterministic Workload Balancing:** Evaluates active staff assigned to the enquired showroom and selects the consultant with the lowest active lead count (`NEW`, `ASSIGNED`, `CONTACTED`, `QUALIFIED`, `NEGOTIATING`). Ties are broken by oldest assignment timestamp.
- **Dedicated Specialist Routing:** Used car enquiries prioritize staff with role `USED_CAR_STAFF` stationed at that location.
- **Response-Time Rule:** Submitting an enquiry or assigning it to a consultant strictly does **not** count as a human response. Only an explicitly recorded contact action (`POST /api/staff/leads/:id/activities`) establishes `firstResponseAt`.
- **SLA Benchmark:** Default response SLA is 30 minutes during working hours, configurable via `LEAD_RESPONSE_SLA_MINUTES`. Leads exceeding 30 minutes without contact are flagged `isOverdue: true`.
- **Portal Deduplication:** CSV rows are checked against existing `externalLeadId` records and recent phone/model combinations within 7 days. Duplicate rows are skipped during execution with metrics recorded on `LeadImportBatch`.
- **DPDP Act 2023 Compliance:** Public enquiry submission enforces explicit digital privacy consent, recorded in `CustomerConsent` with purpose `CUSTOMER_ENQUIRY` and notice version.

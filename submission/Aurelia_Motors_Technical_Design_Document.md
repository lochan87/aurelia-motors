# AURELIA MOTORS — TECHNICAL DESIGN DOCUMENT

## Enterprise Automotive Dealership Platform & Operations Architecture

**Project:** Enterprise Automotive Dealership Platform & Operations System  
**Author:** Lochan T N <lochan87@dsce.edu.in>  
**Dealership Topology:** 3 Showrooms & 2 Authorized Workshops in Lucknow, Uttar Pradesh, India  
**Date:** November 2026  
**Version:** 1.0.0 (Production Release — 127 Passing Automated Tests)  
**GitHub Repository:** https://github.com/lochan87/aurelia-motors (Pending publication)

---

## Table of Contents

- [1. Executive Summary & Dealership Topology](#1-executive-summary--dealership-topology)
- [2. Public Site Architecture & Vehicle Catalogue](#2-public-site-architecture--vehicle-catalogue)
- [3. Transparent Itemized On-Road Pricing Engine](#3-transparent-itemized-on-road-pricing-engine)
- [4. Certified Pre-Owned Vehicle Architecture](#4-certified-pre-owned-vehicle-architecture)
- [5. Test-Drive Booking Engine & Concurrency Control](#5-test-drive-booking-engine--concurrency-control)
- [6. Workshop Service Booking Engine & Capacity Tracking](#6-workshop-service-booking-engine--capacity-tracking)
- [7. Financial Calculations & Online Valuation Tools](#7-financial-calculations--online-valuation-tools)
- [8. Staff Authentication, Session Security & RBAC](#8-staff-authentication,-session-security--rbac)
- [9. Omnichannel Customer Enquiry Pipeline & DPDP Act 2023 Compliance](#9-omnichannel-customer-enquiry-pipeline--dpdp-act-2023-compliance)
- [10. Deterministic Workload-Balanced Lead Routing Engine](#10-deterministic-workload-balanced-lead-routing-engine)
- [11. Third-Party Portal CSV Batch Import & Deduplication](#11-third-party-portal-csv-batch-import--deduplication)
- [12. Lead CRM Lifecycle & Response-Time Tracking](#12-lead-crm-lifecycle--response-time-tracking)
- [13. Dealership Content & Price Governance CMS](#13-dealership-content--price-governance-cms)
- [14. Grounded Domain Intelligence Engine Architecture](#14-grounded-domain-intelligence-engine-architecture)
- [15. Notification System & Outbound Communication Boundaries](#15-notification-system--outbound-communication-boundaries)
- [16. Comprehensive Data Model & PostgreSQL Architecture](#16-comprehensive-data-model--postgresql-architecture)
- [17. Security Architecture & Threat Modeling](#17-security-architecture--threat-modeling)
- [18. Performance Verification & Scalability](#18-performance-verification--scalability)
- [19. Responsive UI Design & Accessibility (a11y)](#19-responsive-ui-design--accessibility-(a11y))
- [20. Operational Runbook & Reviewer Evaluation Guide](#20-operational-runbook--reviewer-evaluation-guide)
- [21. Test Suite & Verification Summary](#21-test-suite--verification-summary)
- [22. Out-of-Scope Boundaries & Honest System Trade-offs](#22-out-of-scope-boundaries--honest-system-trade-offs)
- [23. Future Evolution & Roadmap](#23-future-evolution--roadmap)
- [24. Appendix: Complete API Reference & Database Dictionary](#24-appendix:-complete-api-reference--database-dictionary)

---

## 1. Executive Summary & Dealership Topology

Aurelia Motors is an enterprise-grade full-stack digital dealership platform engineered for an authorized passenger-car franchise network in Lucknow, Uttar Pradesh, India. The platform bridges public-facing digital retail (model discovery, variant comparison, transparent on-road pricing, reducing-balance financing calculators, online trade-in estimations, certified pre-owned browsing with 150-point inspection audits, and self-service test-drive and service booking) with high-efficiency internal dealership operations (role-based staff authentication, CRM lead routing, third-party portal CSV batch ingestion, response-time SLA tracking, price book governance, used car price approvals with separation of duties, and grounded domain intelligence).

### 1.1 Physical Dealership Topology
The dealership operates across three primary sales facilities and two integrated service workshops strategically located across the Lucknow metropolitan territory:

1. **Central Lucknow Showroom (`LKO-CENTRAL`)**:
   - Location: Hazratganj / Vidhan Sabha Marg, Central Lucknow, UP.
   - Profile: Flagship downtown retail facility handling executive, luxury EV, and high-volume commuter passenger vehicles.
   - Facilities: 6 new car display bays, customer delivery lounge, 4 dedicated demo fleet parking bays.
2. **Gomti Nagar Showroom (`LKO-GOMTI`)**:
   - Location: Vibhuti Khand, Gomti Nagar, Lucknow, UP.
   - Profile: Technology-centric suburban facility featuring the primary Certified Pre-Owned (Used Car) display yard and fast EV charging infrastructure.
   - Facilities: 8 new vehicle bays, 20+ certified used vehicle display lot, trade-in physical inspection bay.
3. **Sushant Golf City Showroom (`LKO-SGC`)**:
   - Location: Amar Shaheed Path / Sultanpur Road corridor, Sushant Golf City, Lucknow, UP.
   - Profile: High-growth suburban facility catering to modern family SUVs, crossovers, and fleet corporate clients.
   - Facilities: 8 display bays, demo fleet staging area.
4. **Gomti Nagar Central Workshop (`WS-GOMTI`)**:
   - Location: Vibhuti Khand Industrial Area, Gomti Nagar, Lucknow.
   - Capacity: 12 concurrent service bays, express maintenance quick-lube lane, EV battery diagnostic and diagnostic testing laboratory.
5. **Sushant Golf City Workshop (`WS-SGC`)**:
   - Location: Sector B, Sushant Golf City, Lucknow.
   - Capacity: 8 concurrent service bays, heavy overhaul and paint/body collision center.

### 1.2 Monorepo Architecture & Technology Choices
The project is organized as an enterprise npm workspaces monorepo enforcing modular separation of concerns:
- **`apps/web`**: Single-Page Application (SPA) built with React 19, TypeScript, Vite 8, Tailwind CSS 4, React Router 7, and TanStack Query 5.
- **`apps/api`**: RESTful backend service built on Node.js 22 LTS, Express 5, Prisma ORM 6, PostgreSQL 18.1, Argon2id, and Zod validation.
- **`packages/shared`**: Shared TypeScript contracts, DTO types, financial calculation arithmetic, and integer-paise currency formatting libraries consumed symmetrically by client and server.

### 1.3 Project Deliverables & Repository Access
- **Source Code Repository**: [https://github.com/lochan87/aurelia-motors](https://github.com/lochan87/aurelia-motors) *(Pending publication)*
- **Documentation Suite**: Technical Design Document (Markdown, PDF, DOCX), Deployment Runbook (`deployment.md`), and Release Readiness Audit Report (`submission/RELEASE_READINESS.md`).
- **Automated Verification**: 127 automated unit, integration, and end-to-end tests passing with 100% success rate across 15 test suites.

---

## 2. Public Site Architecture & Vehicle Catalogue

The public digital showroom delivers a lightning-fast consumer experience designed around discovery, transparent vehicle evaluation, and conversion.

### 2.1 System Topology & Network Architecture
The multi-tier system topology isolates public web browsing, API computation, and persistent relational data storage behind an Nginx reverse proxy:

```text
+-----------------------------------------------------------------------------------+
|                           AURELIA MOTORS SYSTEM TOPOLOGY                          |
+-----------------------------------------------------------------------------------+
|                                                                                   |
|   CLIENT LAYER (Web Browser)                                                      |
|   +---------------------------------------------------------------------------+   |
|   |  Public Automotive Retail Portal       Staff Dealership CRM & Admin CMS   |   |
|   |  (Catalogue, Pricing, Booking, EMI)    (Leads, Inventory, Pricing, RBAC)  |   |
|   +---------------------------------------------------------------------------+   |
|                                     | HTTP / WebSocket                            |
|                                     v                                             |
|   INGRESS & REVERSE PROXY LAYER (Port 80 / 5173)                                  |
|   +---------------------------------------------------------------------------+   |
|   |  Nginx Alpine Reverse Proxy                                               |   |
|   |  * Static Asset Caching (1yr)      * Gzip / Security Headers              |   |
|   |  * SPA Fallback (/index.html)      * Proxy Pass (/api/ -> Node API)       |   |
|   +---------------------------------------------------------------------------+   |
|                                     | Reverse Proxy                               |
|                                     v                                             |
|   APPLICATION SERVICE LAYER (Port 4000)                                           |
|   +---------------------------------------------------------------------------+   |
|   |  Express 5 / Node.js 22 LTS API Service                                   |   |
|   |  * Dual-Layer RBAC & Location Guards  * Zod Schema Validation Filters     |   |
|   |  * Concurrency Row-Locks (Bookings)   * 30-Min SLA Clock Engine           |   |
|   |  * Grounded Domain Intelligence Engine (Deterministic Stock Matching)     |   |
|   +---------------------------------------------------------------------------+   |
|                                     | Prisma ORM (Connection Pool)                |
|                                     v                                             |
|   DATA PERSISTENCE LAYER (Port 5432 / 55432)                                      |
|   +---------------------------------------------------------------------------+   |
|   |  PostgreSQL 18.1 Relational Database                                      |   |
|   |  * 28 Relational Domain Entities   * ACID Serializable Transactions       |   |
|   |  * Integer Paise Precision Units   * Persistent Storage Volume            |   |
|   +---------------------------------------------------------------------------+   |
+-----------------------------------------------------------------------------------+
```

### 2.2 Vehicle Hierarchy & Relational Model
The product catalogue is structured in a strict hierarchical relationship:
$$\text{Model} \longrightarrow \text{Variant} \longrightarrow \text{SpecificationGroup} \longrightarrow \text{SpecificationItem}$$

1. **Vehicle Model (`VehicleModel`)**:
   - Represents the macro nameplate (e.g., *Vantara Lumen*, *Vantara Meridian*, *Vantara Aria EV*).
   - Attributes: Slug, name, manufacturer/make, body type (`SUV`, `SEDAN`, `HATCHBACK`, `CROSSOVER`), summary, starting price in integer paise, and hero media gallery.
2. **Vehicle Variant (`VehicleVariant`)**:
   - Represents trim levels (e.g., *Pure*, *Adventure*, *Empowered Plus*).
   - Powertrain parameters: Fuel type (`PETROL`, `DIESEL`, `ELECTRIC`, `HYBRID`, `CNG`), transmission (`MANUAL`, `AUTOMATIC`), engine displacement (cc), peak power (bhp), peak torque (Nm), battery capacity (kWh), driving range (km), and ARAI efficiency rating.
3. **Showroom Inventory Allocation (`InventoryUnit`)**:
   - Tracks distinct serialized inventory vehicles allocated to specific showroom display bays.
   - Status transitions: `AVAILABLE` -> `RESERVED` -> `SOLD` -> `IN_TRANSIT`.

---

## 3. Transparent Itemized On-Road Pricing Engine

Indian automotive consumers routinely encounter misleading "ex-showroom" advertising that conceals mandatory taxes and statutory charges. Aurelia Motors enforces 100% price transparency through an itemized on-road pricing engine.

### 3.1 Statutory Price Formulation
On-road pricing is calculated dynamically based on showroom jurisdiction, fuel classification, and customer-selected options:

```formula
Statutory On-Road Pricing Formulation:
Mandatory Total = SUM(Mandatory Price Components)
Standard On-Road Price = Ex-Showroom Price + Mandatory Total
Total On-Road Price = Standard On-Road Price + SUM(Optional Price Components)
```

1. **Ex-Showroom Price (`exShowroomPaise`)**: The base published price set by manufacturer tariff.
2. **Mandatory Statutory Components**:
   - **Road Tax / RTO Registration**: Computed based on Uttar Pradesh vehicle taxation rules (scaled by vehicle fuel classification: 8% on EV, 10% on Petrol, 12% on Diesel).
   - **Statutory Comprehensive Insurance**: 1-year Own Damage + 3-year Mandatory Third Party statutory coverage.
   - **Statutory Municipal / Green Cess & FASTag**: Mandatory municipal toll collection tags and environmental levies.
3. **Optional Consumer Enhancements**:
   - Extended Warranty (Up to 5 years / 100,000 km coverage).
   - Dealership Genuine Accessory Packs.
   - Roadside Assistance (RSA) Concierge Protection.

### 3.2 Integer Paise Precision Unit Architecture
To eradicate IEEE-754 binary floating-point rounding errors common in commercial web applications, **every monetary value across the platform is stored and calculated strictly as a 64-bit BigInt / Integer representing Indian Paise (1 INR = 100 Paise)**. Currency formatting helpers in `@aurelia/shared` format values into Indian numbering convention (Lakhs and Crores) solely at the presentation boundary.

### 3.3 Versioned Price Books & Temporal Governance
Pricing is decoupled from variant definitions through versioned price books (`PriceBook` and `PriceEntry`). Administrators can schedule future seasonal price books with `effectiveFrom` and `effectiveTo` boundaries. The API database layer enforces non-overlapping date constraints, ensuring deterministic price lookups at checkout.

---

## 4. Certified Pre-Owned Vehicle Architecture

The Certified Pre-Owned (Used Car) module provides an authentic, high-trust digital buying experience for verified pre-owned automobiles.

### 4.1 150-Point Inspection Audit Framework
Every certified pre-owned vehicle listed in the digital showroom must undergo a rigorous physical audit across 150 checklist criteria divided into 6 functional inspection groups:
1. **Engine, Transmission & Drivetrain**: Cylinder compression, fluid integrity, clutch engagement, and diagnostic trouble codes (OBD-II).
2. **Suspension, Steering & Braking**: Strut damping, tie-rod play, brake pad thickness, and ABS modulation.
3. **Electrical Architecture & Infotainment**: Wiring harness continuity, battery health, climate control performance, and sensor calibration.
4. **Chassis, Frame & Structural Integrity**: Monocoque structural alignment, pillar weld spot inspection, and flood/submersion detection.
5. **Exterior Body Panels & Paint**: Paint thickness gauge verification (detecting resprayed panels), panel gap tolerances, and cosmetic scoring.
6. **Interior Cabin & Safety Systems**: Airbag module diagnostic readiness, seatbelt pretensioners, upholstery condition, and odour neutralization.

Each inspection yields an immutable score (0 to 100) and detailed inspector notes logged by certified evaluation technicians.

### 4.2 DPDP Act 2023 Masking for Vehicle Registration Numbers
In compliance with the Digital Personal Data Protection Act (DPDP Act 2023), public users cannot view full vehicle registration plates. Plates are masked in public endpoints (`UP-32 •• 1184`), preventing unauthorized vehicle registration tracking and identity profiling. Full vehicle registration details are unmasked strictly for authenticated staff users through authorized management routes.

---

## 5. Test-Drive Booking Engine & Concurrency Control

Test drives are critical conversion drivers in automotive retail. Aurelia Motors operates a capacity-enforced, concurrency-safe test-drive reservation engine.

### 5.1 Real-Time Demonstrator Fleet Capacity Tracking
Test-drive availability is calculated against physical demonstrator vehicles allocated to each showroom. A customer cannot book a slot if all demo units of that model variant are already reserved during that time window.
- Booking Duration: Fixed 60-minute evaluation slots.
- Lead Time: Minimum 2-hour advance booking; maximum 14-day booking horizon.
- Operating Hours: 10:00 AM to 06:00 PM daily across all three Lucknow showrooms.

### 5.2 Concurrency Control & Race Condition Prevention
To prevent double-booking demonstrator cars during high-traffic marketing campaigns, the booking endpoint (`POST /api/test-drives`) wraps the reservation in a PostgreSQL **Serializable Transaction with `SELECT FOR UPDATE` Row-Level Locking**:
1. Atomically locks the demo vehicle availability records matching the showroom, variant, date, and timeslot.
2. Verifies that active reservations count is strictly less than total dedicated demo fleet vehicles.
3. Inserts the appointment record and issues an cryptographically secure 8-character confirmation reference (`REF-TD-XXXXXX`).
4. Generates an unguessable 32-byte hexadecimal cancellation token enabling one-click self-service customer cancellations without requiring account registration.

---

## 6. Workshop Service Booking Engine & Capacity Tracking

Post-purchase service operations generate recurring dealership revenue. Aurelia Motors provides a dedicated workshop appointment engine managing physical bay capacity across two authorized service workshops in Lucknow.

### 6.1 Bay Allocation Heuristics & Service Packages
Service packages have calibrated bay durations based on standard technician labour operations:
- **Express Periodic Maintenance (120 minutes)**: Engine oil renewal, filter replacement, fluid top-up, and 40-point safety check.
- **Comprehensive Annual Service (240 minutes)**: Complete fluid replacement, brake overhaul, wheel alignment/balancing, and engine tune-up.
- **Brake System Overhaul (180 minutes)**: Disc rotor resurfacing, brake pad replacement, and brake line bleeding.
- **Electrical Diagnostic & AC Overhaul (180 minutes)**: Refrigerant recovery/recharge, evaporator sanitization, and wiring diagnostic.
- **EV High-Voltage Battery Diagnostic (150 minutes)**: Cell voltage delta balancing, thermal management inspection, and state-of-health (SOH) reporting.

### 6.2 Operating Schedule & Concurrency Protection
Workshops operate 6 days a week (Monday through Saturday, 08:30 AM to 05:30 PM). Sunday operations are strictly closed for scheduled bay maintenance. Like test-drives, service appointments enforce database-level serializable locking on workshop bays, preventing bay over-allocation.

---

## 7. Financial Calculations & Online Valuation Tools

Automotive purchases depend heavily on financing and trade-in valuations. Aurelia Motors provides instant financial calculation tools on every vehicle detail page.

### 7.1 Reducing-Balance EMI Calculation Formula
Vehicle detail pages feature an interactive Equated Monthly Installment (EMI) financing calculator utilizing the standard banking industry reducing-balance formula:

```formula
Reducing-Balance Equated Monthly Installment (EMI) Formula:
E = P * r * (1 + r)^n / ((1 + r)^n - 1)
Total Repayment = E * n
Total Interest Payable = Total Repayment - P
Where:
- E = Monthly EMI Payment (integer paise)
- P = Net Principal Loan Amount (On-Road Price minus Customer Down Payment)
- r = Monthly Interest Rate (Annual Rate % / 12 / 100)
- n = Loan Tenure in Months (12 to 84 months)
```

The calculator updates in real time as the user adjusts down payment, interest rate (default 7.99%), and loan tenure sliders. All calculations execute using integer-paise math in `@aurelia/shared`.

### 7.2 Multi-Factor Trade-In Valuation Heuristic Engine
Prospective customers can appraise their existing vehicle via an instant multi-factor valuation engine (`POST /api/trade-ins/estimate`):

```formula
Instant Multi-Factor Trade-In Valuation Heuristic:
Depreciation Rate = Base Year Factor * (1 + Mileage Penalty) * Condition Multiplier
Estimated Valuation = Original Invoice Value * (1 - Depreciation Rate)
```

1. **Base Year Depreciation Factor**: 15% in Year 1, +10% for Years 2-4, and +8% annually thereafter.
2. **Mileage Penalty**: Compounded adjustment if annual mileage exceeds 12,000 km/year.
3. **Condition Multiplier**: Scaled based on user-reported physical status (`EXCELLENT`: 1.05x, `GOOD`: 1.00x, `FAIR`: 0.90x, `POOR`: 0.75x).
4. **Output Range**: The system outputs an illustrative valuation band (`minPaise` to `maxPaise`), encouraging the customer to submit a formal trade-in appraisal request with consent under the DPDP Act.

---

## 8. Staff Authentication, Session Security & RBAC

Internal dealership operations handle confidential customer data, margin figures, and lead details requiring enterprise-grade security.

### 8.1 Dual-Layer RBAC & Facility Location Scoping
Staff permissions are governed by a dual-layer security matrix combining functional role permissions with physical facility location assignments:

| Role Identifier | Functional Scope | Typical Operations |
| :--- | :--- | :--- |
| `ADMIN` | Global Dealership Network | Staff provisioning, price book publishing, CSV lead import, system-wide metrics, trade-in approvals. |
| `SALES_CONSULTANT` | Showroom Assigned | Lead outreach, SLA activity logging, test-drive management, customer quotations. |
| `USED_CAR_SPECIALIST` | Certified Yard Assigned | Used car appraisal, inspection logging, trade-in valuation, price change proposals. |
| `SERVICE_ADVISOR` | Workshop Assigned | Service appointment check-in, bay allocation, service package estimates. |

Location scoping strictly confines non-admin users to their assigned facility. A sales consultant at `LKO-CENTRAL` cannot view test-drive appointments or lead queues belonging to `LKO-GOMTI` (enforced via database query scoping and HTTP 403 authorization guards).

### 8.2 Cryptographic Session Architecture & Password Hashing
- **Argon2id Password Storage**: Staff passwords are encrypted using Argon2id (`argon2.hash`) with modern parameters (memory cost 64MB, time cost 3 iterations, parallelism 4 threads).
- **Session Tokens**: Active sessions generate a 256-bit random cryptographic token stored as a SHA-256 hash in `staff_sessions`.
- **HttpOnly Cookies**: Session identifiers are transported exclusively via `HttpOnly`, `SameSite=Lax`, and `Secure` (in production) cookies, completely neutralizing Cross-Site Scripting (XSS) session theft.
- **Double-Submit HMAC CSRF Protection**: Mutating HTTP verbs (`POST`, `PUT`, `PATCH`, `DELETE`) require a valid `X-CSRF-Token` header verified against an HMAC-SHA256 signature generated with the server's `CSRF_SECRET`.

---

## 9. Omnichannel Customer Enquiry Pipeline & DPDP Act 2023 Compliance

Customer enquiries enter the dealership from website modals, vehicle detail pages, test-drive booking requests, trade-in valuations, and third-party portal CSV imports.

### 9.1 Inbound Capture Pipeline
The public endpoint `POST /api/enquiries` processes inbound interest with automated data normalization and validation:
1. **Zod Schema Validation**: Validates full name, Indian mobile number (+91 E.164 format), optional email, preferred showroom code, interest type (`BUY_NEW`, `TEST_DRIVE`, `BUY_USED`, `EXCHANGE`, `SERVICE`, `FINANCE`), and optional model/variant slugs.
2. **Explicit DPDP Consent Enforcement**: In compliance with India's Digital Personal Data Protection Act 2023, every enquiry requires an explicit consent flag (`consentGiven: true`). The database stores an immutable consent log (`DpdpConsent`) recording consent type, timestamp, IP address, and user agent string.
3. **Automated Customer Profile Upsert**: Finds or creates the customer record by phone number, appending the new enquiry without creating duplicate contact records.
4. **30-Minute Deduplication Window**: Prevents duplicate submissions caused by double-clicks or accidental re-submissions. If an identical enquiry is received from the same phone number for the same model within 30 minutes, the existing enquiry is returned without duplicating CRM lead queues.

---

## 10. Deterministic Workload-Balanced Lead Routing Engine

Prompt lead distribution directly impacts sales conversion rates. Aurelia Motors routes incoming leads using an automated, deterministic workload-balanced allocation engine.

### 10.1 Weighted Round-Robin Allocation Algorithm
When a qualified lead is ingested, the assignment engine executes the following logic:
1. **Showroom Affinity Filter**: Identifies all active sales consultants explicitly assigned to the customer's selected showroom facility.
2. **Consultant Active Workload Metric**:

```formula
Consultant Active Workload Metric:
Active Workload = Total active assigned leads in [NEW, ASSIGNED, CONTACTED, QUALIFIED, TEST_DRIVE_SCHEDULED, NEGOTIATING]
```

3. **Tie-Breaking Resolution**: The consultant with the lowest active workload receives the lead. If multiple consultants share identical workload counts, assignment breaks ties by least recent allocation timestamp (`lastAssignedAt ASC`).
4. **Atomic Transaction Stamping**: The lead is assigned, status transitions to `ASSIGNED`, `assignedAt` is stamped, and an internal notification (`StaffNotification`) is dispatched to the consultant's inbox.

---

## 11. Third-Party Portal CSV Batch Import & Deduplication

Automotive dealerships purchase marketing leads from external consumer portals (e.g., CarDekho, CarWale, Facebook Ads). Aurelia Motors includes an administrative CSV batch ingestion engine.

### 11.1 Two-Stage Validation & Ingestion Pipeline
To safeguard CRM data hygiene, CSV uploads follow a two-stage preview-and-commit workflow:
1. **Preview & Schema Validation (`POST /api/staff/leads/import/preview`)**:
   - Parses multipart CSV uploads with header normalization.
   - Required columns: `customerName`, `customerPhone`, `interestType`, `preferredShowroomCode`. Optional: `customerEmail`, `notes`, `sourcePortal`.
   - Validates every row against Zod rules and checks existing database records for phone number matches.
   - Returns a structured preview: total rows, valid rows, invalid rows with specific cell error details, and detected duplicates.
2. **Atomic Batch Execution (`POST /api/staff/leads/import`)**:
   - Imports valid rows in a single database transaction.
   - Deduplicates leads against existing CRM records.
   - Runs the deterministic lead routing engine on each imported row, distributing leads evenly across the designated showroom's sales team.
   - Logs an audit entity (`ImportBatch`) recording batch ID, uploaded filename, total processed count, created count, skipped duplicate count, acting admin ID, and execution timestamp.

---

## 12. Lead CRM Lifecycle & Response-Time Tracking

Automotive sales conversion drops precipitously when follow-up latency exceeds 30 minutes. Aurelia Motors implements strict response-time tracking to maintain operational sales discipline.

### 12.1 The 30-Minute First-Human-Response SLA
Dealership policy mandates that every prospective customer receive direct human contact within **30 minutes** of submitting an enquiry (`LEAD_RESPONSE_SLA_MINUTES = 30`).
- **Critical Architectural Distinction**: Automated system routing and lead creation **never** count as a first-response. The lead's `firstResponseAt` timestamp remains strictly `NULL` until a human staff member records an explicit outreach event.
- **Overdue Detection**: If a lead remains without recorded contact 30 minutes after creation, the CRM automatically flags the lead as overdue (`isOverdue: true`). Overdue leads display prominent pulsing amber badges in the staff inbox and escalate on the dealership dashboard.

### 12.2 Contact Activity Logging & Lifecycle State Transitions
Sales consultants record customer interactions via `POST /api/staff/leads/:id/activities` (channels: `PHONE`, `WHATSAPP`, `EMAIL`, `MEETING`). The first logged outreach permanently records `firstResponseAt` and computes the exact response time in minutes. Subsequent activities are appended to the lead's historical audit timeline without modifying the initial SLA metric.

```text
+-----------------------------------------------------------------------------------+
|                        LEAD ROUTING & SLA LIFECYCLE FLOW                          |
+-----------------------------------------------------------------------------------+
|                                                                                   |
|   [ Inbound Customer Enquiry ] ---> ( 30-Minute Deduplication Check )             |
|                                                    |                              |
|                                                    v                              |
|                              ( Weighted Round-Robin Consultant Assignment )       |
|                                                    |                              |
|                                                    v                              |
|                                      Status: [ NEW / ASSIGNED ]                   |
|                                                    |                              |
|                                                    v                              |
|                             +----------------------------------------------+      |
|                             |  30-Minute First-Human-Response SLA Clock    |      |
|                             +----------------------------------------------+      |
|                                       /                          \                |
|                    If Human Outreach logged           If > 30 Mins without contact|
|                                     /                              \              |
|                                    v                                v             |
|                        Status: [ CONTACTED ]                Flag: [ OVERDUE ]     |
|                                    |                        (Pulsing Alert)       |
|                                    v                                              |
|                        Status: [ QUALIFIED ]                                      |
|                                    |                                              |
|                                    v                                              |
|                        Status: [ TEST_DRIVE_SCHEDULED ]                           |
|                                    |                                              |
|                                    v                                              |
|                        Status: [ NEGOTIATING ]                                    |
|                                   / \                                             |
|                                  /   \                                            |
|                                 v     v                                           |
|                            [ WON ]   [ LOST ]                                     |
+-----------------------------------------------------------------------------------+
```

---

## 13. Dealership Content & Price Governance CMS

The platform empowers dealership administrators to manage marketing campaigns, tariffs, and inventory without engineering intervention.

### 13.1 Administrative CMS Capabilities
- **Vehicle Model & Variant CMS (`/api/admin/cms/models`, `/api/admin/cms/variants`)**: Administrators can create new models, configure powertrain specifications, upload imagery, and soft-deactivate discontinued trims.
- **Showroom Inventory Management (`/api/admin/cms/inventory`)**: Add, inspect, and update physical stock units assigned to showrooms.
- **Certified Used Vehicle CMS (`/api/admin/cms/used-vehicles`)**: Provision certified pre-owned stock, manage condition findings, and adjust list prices.
- **Banners & Promotional Offers (`/api/admin/content/banners`, `/api/admin/content/offers`)**: Configure homepage marketing carousels, festival finance schemes (e.g., *Festive Season Zero Down-Payment Drive*), exchange bonuses, and interest rate subsidies.

### 13.2 Used Car Price Approval Governance & Separation of Duties
To protect dealership gross margins and prevent unauthorized price tampering, Aurelia Motors enforces a strict separation-of-duties workflow for certified pre-owned pricing:
1. **Proposal Submission**: A used car specialist submits a price adjustment proposal (`POST /api/staff/used-vehicles/:id/propose-price`), specifying the target price in integer paise and business justification (e.g., *Market competitive adjustment following 30-day inventory aging*).
2. **Review & Approval**: The proposed price is held in `PENDING` state. Only a Dealership Administrator can approve or reject the proposal (`POST /api/staff/used-car-pricing/proposals/:id/approve`).
3. **Drift Protection**: If approved, the vehicle's `pricePaise` is atomically updated, an audit record is sealed, and real-time notifications are dispatched to staff.

---

## 14. Grounded Domain Intelligence Engine Architecture

Aurelia Motors integrates intelligent lead assistance while maintaining strict architectural honesty and data integrity.

### 14.1 Honest Architectural Labelling: Grounded Domain Engine vs External LLM
Many systems misleadingly label hardcoded templates as "generative AI" or deploy ungrounded external LLMs that hallucinate non-existent car models and false prices. Aurelia Motors takes an honest, robust approach:
- **Aurelia Grounded Domain Engine**: Powered by an in-process deterministic intelligence engine combining keyword intent extraction, urgency scoring, contextual multi-channel templating, and live PostgreSQL relational stock matching.
- **Data Privacy & Zero Hallucination**: Operates with zero external LLM dependencies, ensuring that customer personal data never leaves dealership infrastructure (DPDP Act compliance) and eliminating false vehicle specifications or pricing hallucinations.
- **Provider Transparency**: The API transparently and accurately identifies its provider as `'Aurelia Grounded Domain Engine'` across all AI endpoints, regardless of environment configuration.

### 14.2 Grounded Lead Operations Features
1. **Structured Lead Intent & Urgency Summary (`POST /api/staff/ai/:leadId/summary`)**:
   - Parses customer notes and enquiry parameters.
   - Evaluates urgency (`HIGH`, `MEDIUM`, `LOW`) based on customer timing indicators (e.g., wedding, immediate delivery, festival purchase).
   - Recommends concrete next steps for the assigned sales consultant.
2. **Human-in-the-Loop Multi-Channel Response Drafts (`POST /api/staff/ai/:leadId/response-draft`)**:
   - Generates customized drafts tailored for **WhatsApp** (casual greeting with emoji and quick-action link), **Email** (formal quotation and showroom brochure), and **Phone Call Script** (structured discovery guide with opening, probing questions, and appointment close).
   - Human-in-the-Loop Mandate: Drafts are never sent automatically. They populate an editable textarea in the staff CRM interface, allowing the consultant to review, refine, and approve before communicating.
3. **Real Stock-Matched Vehicle Recommendations (`POST /api/staff/ai/:leadId/recommendations`)**:
   - Queries live PostgreSQL inventory rows (`priceEntries` and `usedVehicles`).
   - Recommends only authentic in-stock models within the customer's budget band.
   - **Zero Hallucination Guarantee**: Prices, specifications, and availability are strictly retrieved from real database records and never hallucinated.

---

## 15. Notification System & Outbound Communication Boundaries

Effective dealership coordination requires prompt internal staff alerts and clear outbound customer acknowledgements.

### 15.1 Real-Time Staff Notifications Popover
The staff operational header features a real-time notification popover backed by the `StaffNotification` entity:
- **Event Triggers**:
  - `LEAD_ASSIGNED`: Alerts a sales consultant immediately upon lead allocation.
  - `PRICE_PROPOSAL_SUBMITTED`: Alerts administrators of pending used car price proposals.
  - `PRICE_PROPOSAL_DECIDED`: Alerts specialists when their price proposal has been approved or rejected.
  - `TRADE_IN_EVALUATED`: Alerts consultants when formal trade-in valuation offers are issued.
- **Notification API**: `GET /api/staff/notifications`, `GET /api/staff/notifications/unread-count`, and `PATCH /api/staff/notifications/:id/read`.

### 15.2 Outbound Customer Communication Boundaries
Customer acknowledgements (booking confirmations, cancellation receipts, trade-in valuations) are generated by dedicated notification formatters producing structured plain text and HTML templates with deep-link tokens. In production, these templates plug directly into webhook boundaries. In accordance with honest system boundaries, no commercial third-party SMS or WhatsApp aggregators (e.g., Twilio, Gupshup) are invoked in this offline evaluation build, avoiding unverified paid telecom contracts while preserving end-to-end delivery contracts.

---

## 16. Comprehensive Data Model & PostgreSQL Architecture

The platform is backed by PostgreSQL 18.1 managed through Prisma ORM 6, enforcing strict referential integrity, indexes, and constraints across 28 relational domain entities.

### 16.1 Core Relational Entity Model
```text
+-----------------------------------------------------------------------------------+
|                        CORE RELATIONAL DOMAIN ENTITIES                            |
+-----------------------------------------------------------------------------------+
|                                                                                   |
|   FACILITIES                    VEHICLE CATALOGUE              PRICING            |
|   +--------------+              +---------------+        +--------------------+   |
|   |   Showroom   |<---+         | VehicleModel  |        |     PriceBook      |   |
|   +--------------+    |         +-------+-------+        +---------+----------+   |
|          ^            |                 | 1:N                      | 1:N          |
|          | 1:N        |                 v                          v              |
|   +------+-------+    |         +-------+-------+        +---------+----------+   |
|   |InventoryUnit |    |         |VehicleVariant |<-------+     PriceEntry     |   |
|   +--------------+    |         +-------+-------+  N:1   +---------+----------+   |
|                       |                 |                          | 1:N          |
|   USED VEHICLES       |                 v                          v              |
|   +--------------+    |         +---------------+        +---------+----------+   |
|   |CertifiedCar  +----+         | VariantColour |        |   PriceComponent   |   |
|   +------+-------+              +---------------+        +--------------------+   |
|          | 1:1                                                                    |
|          v                                                                        |
|   +--------------+              BOOKINGS & WORKSHOPS     CRM & ENQUIRIES          |
|   | InspectReport|              +---------------+        +--------------------+   |
|   +--------------+              |   Workshop    |        |      Customer      |   |
|                                 +-------+-------+        +---------+----------+   |
|   STAFF & ACCESS                        | 1:N                      | 1:N          |
|   +--------------+                      v                          v              |
|   |  StaffUser   |              +---------------+        +---------+----------+   |
|   +---+------+---+              |ServiceBooking |        |  Enquiry / Lead    |   |
|       |      |                  +---------------+        +---------+----------+   |
|   1:N |      | 1:N                                                 | 1:N          |
|       v      v                  +---------------+                  v              |
|   +---+--+ +-+----------+       |TestDriveAppt  |        +---------+----------+   |
|   |Sess'n| |StaffLocat'n|       +---------------+        |LeadActivity & Note |   |
|   +------+ +------------+                                +--------------------+   |
+-----------------------------------------------------------------------------------+
```

### 16.2 Database Entities & Relationships
1. **Facility Entities**: `Showroom` (3 Lucknow sales facilities) and `Workshop` (2 maintenance workshops with bay capacities).
2. **Catalogue Entities**: `VehicleModel`, `VehicleVariant`, `VariantSpecificationGroup`, `VariantSpecificationItem`, `VariantColour`, `VehicleImage`, and `InventoryUnit`.
3. **Pricing Entities**: `PriceBook`, `PriceEntry`, and `PriceComponent` (integer paise).
4. **Used Car Entities**: `CertifiedUsedVehicle`, `InspectionReport`, `InspectionItem`, and `UsedCarPriceProposal`.
5. **Booking Entities**: `DemoVehicle`, `TestDriveAppointment`, `WorkshopOperatingHour`, `ServicePackageType`, and `ServiceBooking`.
6. **CRM & Lead Entities**: `Customer`, `DpdpConsent`, `CustomerEnquiry`, `Lead`, `LeadActivity`, `LeadInternalNote`, `LeadStatusHistory`, and `ImportBatch`.
7. **Administrative Entities**: `StaffUser`, `StaffSession`, `StaffLocationAssignment`, `AuthAuditLog`, `HomepageBanner`, `PromotionOffer`, `TradeInRequest`, and `StaffNotification`.

---

## 17. Security Architecture & Threat Modeling

Aurelia Motors applies a defense-in-depth posture addressing the OWASP Top 10 vulnerabilities.

### 17.1 Security Controls Matrix
- **Authentication**: Argon2id password hashing, constant-time verification, session token revocation on logout.
- **CSRF Protection**: HMAC-SHA256 double-submit tokens validated on all state-altering requests.
- **Session Transport**: HttpOnly, SameSite=Lax, and Secure cookie flags preventing JavaScript access and cross-site exfiltration.
- **Access Control (RBAC)**: Dual-layer role and facility location scoping verified in API middleware.
- **Injection Prevention**: 100% parameterized SQL via Prisma ORM; zero raw string interpolation.
- **Input Validation**: Strict Zod schemas sanitizing all request parameters before execution.
- **Rate Limiting**: Express rate limiters protecting public enquiry intake and staff login endpoints.
- **HTTP Security Headers**: Helmet middleware enforcing strict `Content-Security-Policy`, `X-Frame-Options: SAMEORIGIN`, `X-Content-Type-Options: nosniff`, and `Strict-Transport-Security`.

---

## 18. Performance Verification & Scalability

Performance testing was benchmarked using Google Chrome Navigation Timing API and direct API profiling under local developer host conditions.

### 18.1 Local Benchmark Profile
- **Homepage Load Time**: ~1.67 seconds (DOMContentLoaded in 647ms).
- **Vehicle Catalogue Load Time**: ~1.19 seconds (DOMContentLoaded in 107ms).
- **On-Road Pricing Computation API**: Response latency < 25 milliseconds.
- **Lead Ingestion & Routing Latency**: ~301 milliseconds (comfortably within the 25-second API timeout budget).

> **Benchmark Context Note:** These measurements reflect local host execution under developer conditions (Vite preview + local PostgreSQL 18.1). Real-world 4G mobile measurements will naturally fluctuate based on wireless network latency and edge CDN caching. Production builds utilize code-split vendor chunks and Gzip compression to minimize mobile payload footprint.

---

## 19. Responsive UI Design & Accessibility (a11y)

The digital dealership front-end is crafted with a luxury automotive aesthetic using modern web standards.

### 19.1 Design System & Typography
- **Display Typography**: **Fraunces Variable**, an elegant optical-size serif font conveying automotive prestige.
- **Body Typography**: **Manrope Variable**, an ultra-clean geometric sans-serif ensuring crisp legibility.
- **Palette**: Deep slate (`#0f172a`), refined porcelain (`#f8fafc`), warm amber highlights (`#d97706`), and functional status emeralds/crimsons.
- **Responsive Layout**: Designed for three primary viewports: Desktop (1440×900), Tablet (768×1024), and Mobile (375×667) with responsive drawer navigation and touch targets.
- **Accessibility (a11y)**: Adheres to WCAG 2.1 AA guidelines with semantic HTML landmarks, high-contrast color pairings, visible focus indicators, and ARIA attributes for modal dialogs and alert banners.

---

## 20. Operational Runbook & Reviewer Evaluation Guide

The platform supports immediate evaluation via containerized Docker Compose or native local development.

### 20.1 Option A: Docker Compose (Recommended 1-Click Evaluation)
```bash
# 1. Clone or extract repository
cd aurelia-motors

# 2. Launch database, API, and Web frontend containers
docker compose up -d --build

# 3. Verify container health status
docker compose ps
curl http://localhost:4000/api/health
```

- Public Web Application: `http://localhost:5173` or `http://localhost`
- Backend REST API: `http://localhost:4000/api`
- API Health Status: `http://localhost:4000/api/health`
- Staff Operations Portal: `http://localhost:5173/staff/login`

### 20.2 Option B: Native Local Evaluation (Node.js & PostgreSQL)
```bash
# 1. Install workspace dependencies
npm install

# 2. Configure environment
cp .env.example .env

# 3. Apply database migrations & seed initial dataset
npm run db:deploy
npm run db:seed

# 4. Start local development servers
npm run dev
```

### 20.3 Pre-Seeded Evaluation Accounts
All accounts use the demo password `Aurelia2026!`:
- Administrator: `admin@aureliamotors.com` (Global dealership access)
- Sales Consultant (Central): `sales.central@aureliamotors.com` (Scoped to Central Lucknow)
- Sales Consultant (Gomti Nagar): `sales.gomti@aureliamotors.com` (Scoped to Gomti Nagar)
- Service Advisor (Gomti Workshop): `service.gomti@aureliamotors.com` (Scoped to Gomti Workshop)
- Service Advisor (Sushant Golf City Workshop): `service.sgc@aureliamotors.com` (Scoped to SGC Workshop)
- Used Car Specialist: `usedcars@aureliamotors.com` (Certified Pre-Owned yard)

*Note: The staff login screen includes 1-click quick-fill buttons for instant reviewer credential population.*

---

## 21. Test Suite & Verification Summary

The codebase has undergone comprehensive automated verification:
- **Automated Test Results**: **127 passing tests across 15 test suites** executed via Vitest and Supertest:
  1. `validation.test.ts` (2 tests): Request validation schemas and error envelope formatting.
  2. `health.test.ts` (7 tests): Database connection health probe and uptime reporting.
  3. `showrooms.test.ts` (3 tests): Showroom listing, code lookup, and active facility filtering.
  4. `catalogue.test.ts` (8 tests): Vehicle catalogue discovery, variant specs, and on-road pricing.
  5. `used-vehicles.test.ts` (5 tests): Pre-owned listings, inspection reports, and masked registration plates.
  6. `trade-ins.test.ts` (5 tests): Valuation heuristics, DPDP consent enforcement, and trade-in submission.
  7. `appointments.test.ts` (17 tests): Test-drive capacity, double-booking race condition prevention, workshop bay capacity, token lookup, and cancellation.
  8. `auth.test.ts` (25 tests): Staff login, Argon2id verification, session revocation, CSRF protection, and location scoping.
  9. `leads.test.ts` (14 tests): Inbound enquiry intake, deterministic routing, 30-minute response-time tracking, overdue detection, and CSV batch import.
  10. `cms.test.ts` (7 tests): Vehicle model & variant CMS, showroom inventory stock, price book publishing, and date overlap prevention.
  11. `content.test.ts` (4 tests): Homepage banners and promotional campaign CMS.
  12. `notifications.test.ts` (5 tests): Staff notifications popover, unread counts, and mark-as-read workflows.
  13. `used-car-pricing.test.ts` (6 tests): Separation-of-duties price proposals and approval governance.
  14. `ai.test.ts` (5 tests): Grounded lead intent summary, multi-channel response drafts, inventory-backed stock recommendations, and engine provider attribution regression test.
  15. `e2e-journeys.test.ts` (14 tests): Full end-to-end integration journeys across all customer and staff workflows.
- **Code Quality**: ESLint 9 passing with 0 warnings, Prettier 3 passing with 0 formatting warnings, strict TypeScript passing with 0 compilation errors, and production build succeeded in 810ms.

---

## 22. Out-of-Scope Boundaries & Honest System Trade-offs

To maintain architectural clarity and focus on the core requirements of Problem 4, the following boundaries were deliberately established:
1. **Financial Payment Gateway**: Test-drive appointments and workshop service bookings are complimentary in accordance with authorized dealership customer care standards. Online down-payment collection (e.g., Razorpay/Stripe) is outside the scope of Problem 4.
2. **Third-Party Paid SMS/WhatsApp Gateway**: Outbound messaging is implemented as structured notification templates and webhook boundaries rather than connecting to live paid commercial telecom aggregators.
3. **AI Integration**: The platform utilizes the in-house deterministic Aurelia Grounded Domain Engine querying live PostgreSQL stock and tariffs, eliminating external LLM dependencies, API costs, latency, and customer data leakage.

---

## 23. Future Evolution & Roadmap

Key architectural extension points for post-internship production expansion:
- **Omnichannel Live Chat & WhatsApp Bot**: Integrating conversational AI directly into the customer WhatsApp channel using the existing Grounded Domain Engine.
- **Automated Service Bay Telemetry**: Connecting IoT OBD-II diagnostic scanners in the workshops directly to vehicle service appointment records.
- **Dynamic Insurance Premium Calculator**: API integration with Indian general insurance underwriting engines (e.g., ICICI Lombard, Bajaj Allianz) for live quotes based on vehicle IDV.

---

## 24. Appendix: Complete API Reference & Database Dictionary

### 24.1 Complete REST API Endpoint Directory

| Method | Endpoint | Access | Purpose |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Public | Service health & PostgreSQL connectivity probe |
| `GET` | `/api/showrooms` | Public | Lists active Lucknow showroom facilities |
| `GET` | `/api/showrooms/:code` | Public | Individual showroom facility detail |
| `GET` | `/api/catalogue/models` | Public | Model catalogue with filters, search, and starting prices |
| `GET` | `/api/catalogue/models/:slug` | Public | Complete model detail with specifications and variants |
| `GET` | `/api/catalogue/variants/:slug/pricing` | Public | Itemized on-road price breakdown with statutory taxes |
| `GET` | `/api/used-vehicles` | Public | Certified pre-owned vehicle listings with masked plates |
| `GET` | `/api/used-vehicles/:slug` | Public | Pre-owned detail with 150-point inspection findings |
| `POST` | `/api/trade-ins/estimate` | Public | Instant trade-in valuation band without registration |
| `POST` | `/api/trade-ins` | Public | Formal trade-in request with DPDP consent |
| `GET` | `/api/test-drives/availability` | Public | Real-time demonstrator vehicle slot availability |
| `POST` | `/api/test-drives` | Public | Concurrency-safe, idempotent test-drive reservation |
| `GET` | `/api/services/workshops` | Public | Authorized workshop directory and operating schedules |
| `GET` | `/api/services/types` | Public | Standard maintenance service packages and rates |
| `GET` | `/api/services/availability` | Public | Capacity-checked workshop bay availability |
| `POST` | `/api/services/bookings` | Public | Concurrency-safe service appointment booking |
| `GET` | `/api/bookings/confirmation/:ref` | Public | Booking verification with token-based unmasking |
| `POST` | `/api/bookings/:ref/cancel` | Public | Self-service cancellation releasing slot capacity |
| `POST` | `/api/enquiries` | Public | Omnichannel customer enquiry capture with DPDP consent |
| `POST` | `/api/auth/login` | Public | Rate-limited staff login, issues HttpOnly session cookie |
| `POST` | `/api/auth/logout` | Staff | Revokes session token in database, clears cookie |
| `GET` | `/api/auth/me` | Staff | Current authenticated staff user profile & CSRF token |
| `POST` | `/api/auth/change-password` | Staff | Updates staff password (Argon2id re-hashing) |
| `GET` | `/api/staff/dashboard` | Staff | Location-scoped real-time operational metrics |
| `GET` | `/api/staff/appointments` | Staff | Location-scoped test-drive & service appointment queue |
| `GET` | `/api/staff/leads` | Staff | Location-scoped CRM lead inbox with SLA countdown |
| `GET` | `/api/staff/leads/metrics` | Staff | Real-time SLA response metrics & compliance rates |
| `GET` | `/api/staff/leads/:id` | Staff | Complete lead record, customer profile & audit timeline |
| `PATCH` | `/api/staff/leads/:id/status` | Staff | Audited lead status transition |
| `POST` | `/api/staff/leads/:id/notes` | Staff | Appends internal private staff consultation note |
| `POST` | `/api/staff/leads/:id/activities` | Staff | Logs customer outreach & stamps first-human-response SLA |
| `PATCH` | `/api/staff/leads/:id/assignment` | Admin | Reassigns lead to another sales consultant |
| `POST` | `/api/staff/leads/import/preview` | Admin | Validates portal CSV rows & detects duplicate contacts |
| `POST` | `/api/staff/leads/import` | Admin | Executes batch lead ingestion & auto-assignment |
| `GET` | `/api/staff/leads/imports` | Admin | Audit history of past CSV import batches |
| `GET` | `/api/admin/cms/models` | Admin | Vehicle model CMS list |
| `POST` | `/api/admin/cms/models` | Admin | Creates new vehicle model |
| `PATCH` | `/api/admin/cms/models/:id` | Admin | Updates vehicle model attributes |
| `DELETE` | `/api/admin/cms/models/:id` | Admin | Soft-deactivates vehicle model |
| `POST` | `/api/admin/cms/models/:id/variants` | Admin | Creates new variant trim under model |
| `PATCH` | `/api/admin/cms/variants/:id` | Admin | Updates variant powertrain parameters |
| `DELETE` | `/api/admin/cms/variants/:id` | Admin | Soft-deactivates variant |
| `GET` | `/api/admin/cms/inventory` | Admin | Showroom physical inventory stock directory |
| `POST` | `/api/admin/cms/inventory` | Admin | Provisions physical inventory vehicle to showroom |
| `PATCH` | `/api/admin/cms/inventory/:id` | Admin | Updates inventory status (AVAILABLE, RESERVED, SOLD) |
| `GET` | `/api/admin/cms/price-books` | Admin | Versioned price book directory |
| `POST` | `/api/admin/cms/price-books` | Admin | Creates new draft price book |
| `POST` | `/api/admin/cms/price-books/:id/publish` | Admin | Publishes price book with overlap validation |
| `POST` | `/api/staff/used-vehicles/:id/propose-price` | Specialist | Submits certified pre-owned price proposal |
| `GET` | `/api/staff/used-car-pricing/proposals` | Staff | Lists pending and decided price proposals |
| `POST` | `/api/staff/used-car-pricing/proposals/:id/approve` | Admin | Approves proposal and atomically updates vehicle price |
| `POST` | `/api/staff/used-car-pricing/proposals/:id/reject` | Admin | Rejects price adjustment proposal |
| `GET` | `/api/banners` | Public | Active homepage promotional banners |
| `GET` | `/api/offers` | Public | Active dealership promotional schemes & finance offers |
| `POST` | `/api/staff/ai/:leadId/summary` | Staff | Structured lead intent & urgency summary |
| `POST` | `/api/staff/ai/:leadId/response-draft` | Staff | Human-in-the-loop draft generation (WhatsApp/Email/Phone) |
| `POST` | `/api/staff/ai/:leadId/recommendations` | Staff | Grounded PostgreSQL stock-matched recommendations |
| `GET` | `/api/staff/notifications` | Staff | Real-time internal staff alert notifications |
| `GET` | `/api/staff/notifications/unread-count` | Staff | Count of unread notifications |
| `PATCH` | `/api/staff/notifications/:id/read` | Staff | Marks individual notification as read |
| `POST` | `/api/staff/notifications/mark-all-read` | Staff | Marks all notifications as read |
| `GET` | `/api/admin/staff` | Admin | Staff user directory |
| `POST` | `/api/admin/staff` | Admin | Provisions new staff user with location assignments |
| `PATCH` | `/api/admin/staff/:id` | Admin | Updates staff user (with last-admin safeguard) |
| `POST` | `/api/admin/staff/:id/disable` | Admin | Deactivates staff user and revokes active sessions |

---


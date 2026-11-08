# -*- coding: utf-8 -*-
"""
Aurelia Motors — Technical Design Document (TDD) Multi-Format Publishing Engine
Generates synchronized Markdown (.md), PDF (.pdf), and Microsoft Word (.docx) documents.
Author: Lochan T N <lochan87@dsce.edu.in>
"""
import os
import sys
import re

from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import parse_xml
from docx.oxml.ns import nsdecls

from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    PageBreak,
    KeepTogether,
    HRFlowable,
)
from reportlab.pdfgen import canvas

SUBMISSION_DIR = os.path.dirname(os.path.abspath(__file__))
MD_PATH = os.path.join(SUBMISSION_DIR, "Aurelia_Motors_Technical_Design_Document.md")
DOCX_PATH = os.path.join(SUBMISSION_DIR, "Aurelia_Motors_Technical_Design_Document.docx")
PDF_PATH = os.path.join(SUBMISSION_DIR, "Aurelia_Motors_Technical_Design_Document.pdf")

TITLE = "AURELIA MOTORS — TECHNICAL DESIGN DOCUMENT"
SUBTITLE = "Enterprise Automotive Dealership Platform & Operations Architecture"
METADATA = """
**Project:** Enterprise Automotive Dealership Platform & Operations System  
**Author:** Lochan T N <lochan87@dsce.edu.in>  
**Dealership Topology:** 3 Showrooms & 2 Authorized Workshops in Lucknow, Uttar Pradesh, India  
**Date:** November 2026  
**Version:** 1.0.0 (Production Release — 127 Passing Automated Tests)  
**GitHub Repository:** https://github.com/lochan87/aurelia-motors (Pending publication)
"""

SECTIONS = [{'id': '1', 'title': '1. Executive Summary & Dealership Topology', 'content': 'Aurelia Motors is an enterprise-grade full-stack digital dealership platform engineered for an authorized passenger-car franchise network in Lucknow, Uttar Pradesh, India. The platform bridges public-facing digital retail (model discovery, variant comparison, transparent on-road pricing, reducing-balance financing calculators, online trade-in estimations, certified pre-owned browsing with 150-point inspection audits, and self-service test-drive and service booking) with high-efficiency internal dealership operations (role-based staff authentication, CRM lead routing, third-party portal CSV batch ingestion, response-time SLA tracking, price book governance, used car price approvals with separation of duties, and grounded domain intelligence).\n\n### 1.1 Physical Dealership Topology\nThe dealership operates across three primary sales facilities and two integrated service workshops strategically located across the Lucknow metropolitan territory:\n\n1. **Central Lucknow Showroom (`LKO-CENTRAL`)**:\n   - Location: Hazratganj / Vidhan Sabha Marg, Central Lucknow, UP.\n   - Profile: Flagship downtown retail facility handling executive, luxury EV, and high-volume commuter passenger vehicles.\n   - Facilities: 6 new car display bays, customer delivery lounge, 4 dedicated demo fleet parking bays.\n2. **Gomti Nagar Showroom (`LKO-GOMTI`)**:\n   - Location: Vibhuti Khand, Gomti Nagar, Lucknow, UP.\n   - Profile: Technology-centric suburban facility featuring the primary Certified Pre-Owned (Used Car) display yard and fast EV charging infrastructure.\n   - Facilities: 8 new vehicle bays, 20+ certified used vehicle display lot, trade-in physical inspection bay.\n3. **Sushant Golf City Showroom (`LKO-SGC`)**:\n   - Location: Amar Shaheed Path / Sultanpur Road corridor, Sushant Golf City, Lucknow, UP.\n   - Profile: High-growth suburban facility catering to modern family SUVs, crossovers, and fleet corporate clients.\n   - Facilities: 8 display bays, demo fleet staging area.\n4. **Gomti Nagar Central Workshop (`WS-GOMTI`)**:\n   - Location: Vibhuti Khand Industrial Area, Gomti Nagar, Lucknow.\n   - Capacity: 12 concurrent service bays, express maintenance quick-lube lane, EV battery diagnostic and diagnostic testing laboratory.\n5. **Sushant Golf City Workshop (`WS-SGC`)**:\n   - Location: Sector B, Sushant Golf City, Lucknow.\n   - Capacity: 8 concurrent service bays, heavy overhaul and paint/body collision center.\n\n### 1.2 Monorepo Architecture & Technology Choices\nThe project is organized as an enterprise npm workspaces monorepo enforcing modular separation of concerns:\n- **`apps/web`**: Single-Page Application (SPA) built with React 19, TypeScript, Vite 8, Tailwind CSS 4, React Router 7, and TanStack Query 5.\n- **`apps/api`**: RESTful backend service built on Node.js 22 LTS, Express 5, Prisma ORM 6, PostgreSQL 18.1, Argon2id, and Zod validation.\n- **`packages/shared`**: Shared TypeScript contracts, DTO types, financial calculation arithmetic, and integer-paise currency formatting libraries consumed symmetrically by client and server.\n\n### 1.3 Project Deliverables & Repository Access\n- **Source Code Repository**: [https://github.com/lochan87/aurelia-motors](https://github.com/lochan87/aurelia-motors) *(Pending publication)*\n- **Documentation Suite**: Technical Design Document (Markdown, PDF, DOCX), Deployment Runbook (`deployment.md`), and Release Readiness Audit Report (`submission/RELEASE_READINESS.md`).\n- **Automated Verification**: 127 automated unit, integration, and end-to-end tests passing with 100% success rate across 15 test suites.'}, {'id': '2', 'title': '2. Public Site Architecture & Vehicle Catalogue', 'content': 'The public digital showroom delivers a lightning-fast consumer experience designed around discovery, transparent vehicle evaluation, and conversion.\n\n### 2.1 System Topology & Network Architecture\nThe multi-tier system topology isolates public web browsing, API computation, and persistent relational data storage behind an Nginx reverse proxy:\n\n```text\n+-----------------------------------------------------------------------------------+\n|                           AURELIA MOTORS SYSTEM TOPOLOGY                          |\n+-----------------------------------------------------------------------------------+\n|                                                                                   |\n|   CLIENT LAYER (Web Browser)                                                      |\n|   +---------------------------------------------------------------------------+   |\n|   |  Public Automotive Retail Portal       Staff Dealership CRM & Admin CMS   |   |\n|   |  (Catalogue, Pricing, Booking, EMI)    (Leads, Inventory, Pricing, RBAC)  |   |\n|   +---------------------------------------------------------------------------+   |\n|                                     | HTTP / WebSocket                            |\n|                                     v                                             |\n|   INGRESS & REVERSE PROXY LAYER (Port 80 / 5173)                                  |\n|   +---------------------------------------------------------------------------+   |\n|   |  Nginx Alpine Reverse Proxy                                               |   |\n|   |  * Static Asset Caching (1yr)      * Gzip / Security Headers              |   |\n|   |  * SPA Fallback (/index.html)      * Proxy Pass (/api/ -> Node API)       |   |\n|   +---------------------------------------------------------------------------+   |\n|                                     | Reverse Proxy                               |\n|                                     v                                             |\n|   APPLICATION SERVICE LAYER (Port 4000)                                           |\n|   +---------------------------------------------------------------------------+   |\n|   |  Express 5 / Node.js 22 LTS API Service                                   |   |\n|   |  * Dual-Layer RBAC & Location Guards  * Zod Schema Validation Filters     |   |\n|   |  * Concurrency Row-Locks (Bookings)   * 30-Min SLA Clock Engine           |   |\n|   |  * Grounded Domain Intelligence Engine (Deterministic Stock Matching)     |   |\n|   +---------------------------------------------------------------------------+   |\n|                                     | Prisma ORM (Connection Pool)                |\n|                                     v                                             |\n|   DATA PERSISTENCE LAYER (Port 5432 / 55432)                                      |\n|   +---------------------------------------------------------------------------+   |\n|   |  PostgreSQL 18.1 Relational Database                                      |   |\n|   |  * 28 Relational Domain Entities   * ACID Serializable Transactions       |   |\n|   |  * Integer Paise Precision Units   * Persistent Storage Volume            |   |\n|   +---------------------------------------------------------------------------+   |\n+-----------------------------------------------------------------------------------+\n```\n\n### 2.2 Vehicle Hierarchy & Relational Model\nThe product catalogue is structured in a strict hierarchical relationship:\n$$\\text{Model} \\longrightarrow \\text{Variant} \\longrightarrow \\text{SpecificationGroup} \\longrightarrow \\text{SpecificationItem}$$\n\n1. **Vehicle Model (`VehicleModel`)**:\n   - Represents the macro nameplate (e.g., *Vantara Lumen*, *Vantara Meridian*, *Vantara Aria EV*).\n   - Attributes: Slug, name, manufacturer/make, body type (`SUV`, `SEDAN`, `HATCHBACK`, `CROSSOVER`), summary, starting price in integer paise, and hero media gallery.\n2. **Vehicle Variant (`VehicleVariant`)**:\n   - Represents trim levels (e.g., *Pure*, *Adventure*, *Empowered Plus*).\n   - Powertrain parameters: Fuel type (`PETROL`, `DIESEL`, `ELECTRIC`, `HYBRID`, `CNG`), transmission (`MANUAL`, `AUTOMATIC`), engine displacement (cc), peak power (bhp), peak torque (Nm), battery capacity (kWh), driving range (km), and ARAI efficiency rating.\n3. **Showroom Inventory Allocation (`InventoryUnit`)**:\n   - Tracks distinct serialized inventory vehicles allocated to specific showroom display bays.\n   - Status transitions: `AVAILABLE` -> `RESERVED` -> `SOLD` -> `IN_TRANSIT`.'}, {'id': '3', 'title': '3. Transparent Itemized On-Road Pricing Engine', 'content': 'Indian automotive consumers routinely encounter misleading "ex-showroom" advertising that conceals mandatory taxes and statutory charges. Aurelia Motors enforces 100% price transparency through an itemized on-road pricing engine.\n\n### 3.1 Statutory Price Formulation\nOn-road pricing is calculated dynamically based on showroom jurisdiction, fuel classification, and customer-selected options:\n\n```formula\nStatutory On-Road Pricing Formulation:\nMandatory Total = SUM(Mandatory Price Components)\nStandard On-Road Price = Ex-Showroom Price + Mandatory Total\nTotal On-Road Price = Standard On-Road Price + SUM(Optional Price Components)\n```\n\n1. **Ex-Showroom Price (`exShowroomPaise`)**: The base published price set by manufacturer tariff.\n2. **Mandatory Statutory Components**:\n   - **Road Tax / RTO Registration**: Computed based on Uttar Pradesh vehicle taxation rules (scaled by vehicle fuel classification: 8% on EV, 10% on Petrol, 12% on Diesel).\n   - **Statutory Comprehensive Insurance**: 1-year Own Damage + 3-year Mandatory Third Party statutory coverage.\n   - **Statutory Municipal / Green Cess & FASTag**: Mandatory municipal toll collection tags and environmental levies.\n3. **Optional Consumer Enhancements**:\n   - Extended Warranty (Up to 5 years / 100,000 km coverage).\n   - Dealership Genuine Accessory Packs.\n   - Roadside Assistance (RSA) Concierge Protection.\n\n### 3.2 Integer Paise Precision Unit Architecture\nTo eradicate IEEE-754 binary floating-point rounding errors common in commercial web applications, **every monetary value across the platform is stored and calculated strictly as a 64-bit BigInt / Integer representing Indian Paise (1 INR = 100 Paise)**. Currency formatting helpers in `@aurelia/shared` format values into Indian numbering convention (Lakhs and Crores) solely at the presentation boundary.\n\n### 3.3 Versioned Price Books & Temporal Governance\nPricing is decoupled from variant definitions through versioned price books (`PriceBook` and `PriceEntry`). Administrators can schedule future seasonal price books with `effectiveFrom` and `effectiveTo` boundaries. The API database layer enforces non-overlapping date constraints, ensuring deterministic price lookups at checkout.'}, {'id': '4', 'title': '4. Certified Pre-Owned Vehicle Architecture', 'content': 'The Certified Pre-Owned (Used Car) module provides an authentic, high-trust digital buying experience for verified pre-owned automobiles.\n\n### 4.1 150-Point Inspection Audit Framework\nEvery certified pre-owned vehicle listed in the digital showroom must undergo a rigorous physical audit across 150 checklist criteria divided into 6 functional inspection groups:\n1. **Engine, Transmission & Drivetrain**: Cylinder compression, fluid integrity, clutch engagement, and diagnostic trouble codes (OBD-II).\n2. **Suspension, Steering & Braking**: Strut damping, tie-rod play, brake pad thickness, and ABS modulation.\n3. **Electrical Architecture & Infotainment**: Wiring harness continuity, battery health, climate control performance, and sensor calibration.\n4. **Chassis, Frame & Structural Integrity**: Monocoque structural alignment, pillar weld spot inspection, and flood/submersion detection.\n5. **Exterior Body Panels & Paint**: Paint thickness gauge verification (detecting resprayed panels), panel gap tolerances, and cosmetic scoring.\n6. **Interior Cabin & Safety Systems**: Airbag module diagnostic readiness, seatbelt pretensioners, upholstery condition, and odour neutralization.\n\nEach inspection yields an immutable score (0 to 100) and detailed inspector notes logged by certified evaluation technicians.\n\n### 4.2 DPDP Act 2023 Masking for Vehicle Registration Numbers\nIn compliance with the Digital Personal Data Protection Act (DPDP Act 2023), public users cannot view full vehicle registration plates. Plates are masked in public endpoints (`UP-32 •• 1184`), preventing unauthorized vehicle registration tracking and identity profiling. Full vehicle registration details are unmasked strictly for authenticated staff users through authorized management routes.'}, {'id': '5', 'title': '5. Test-Drive Booking Engine & Concurrency Control', 'content': 'Test drives are critical conversion drivers in automotive retail. Aurelia Motors operates a capacity-enforced, concurrency-safe test-drive reservation engine.\n\n### 5.1 Real-Time Demonstrator Fleet Capacity Tracking\nTest-drive availability is calculated against physical demonstrator vehicles allocated to each showroom. A customer cannot book a slot if all demo units of that model variant are already reserved during that time window.\n- Booking Duration: Fixed 60-minute evaluation slots.\n- Lead Time: Minimum 2-hour advance booking; maximum 14-day booking horizon.\n- Operating Hours: 10:00 AM to 06:00 PM daily across all three Lucknow showrooms.\n\n### 5.2 Concurrency Control & Race Condition Prevention\nTo prevent double-booking demonstrator cars during high-traffic marketing campaigns, the booking endpoint (`POST /api/test-drives`) wraps the reservation in a PostgreSQL **Serializable Transaction with `SELECT FOR UPDATE` Row-Level Locking**:\n1. Atomically locks the demo vehicle availability records matching the showroom, variant, date, and timeslot.\n2. Verifies that active reservations count is strictly less than total dedicated demo fleet vehicles.\n3. Inserts the appointment record and issues an cryptographically secure 8-character confirmation reference (`REF-TD-XXXXXX`).\n4. Generates an unguessable 32-byte hexadecimal cancellation token enabling one-click self-service customer cancellations without requiring account registration.'}, {'id': '6', 'title': '6. Workshop Service Booking Engine & Capacity Tracking', 'content': 'Post-purchase service operations generate recurring dealership revenue. Aurelia Motors provides a dedicated workshop appointment engine managing physical bay capacity across two authorized service workshops in Lucknow.\n\n### 6.1 Bay Allocation Heuristics & Service Packages\nService packages have calibrated bay durations based on standard technician labour operations:\n- **Express Periodic Maintenance (120 minutes)**: Engine oil renewal, filter replacement, fluid top-up, and 40-point safety check.\n- **Comprehensive Annual Service (240 minutes)**: Complete fluid replacement, brake overhaul, wheel alignment/balancing, and engine tune-up.\n- **Brake System Overhaul (180 minutes)**: Disc rotor resurfacing, brake pad replacement, and brake line bleeding.\n- **Electrical Diagnostic & AC Overhaul (180 minutes)**: Refrigerant recovery/recharge, evaporator sanitization, and wiring diagnostic.\n- **EV High-Voltage Battery Diagnostic (150 minutes)**: Cell voltage delta balancing, thermal management inspection, and state-of-health (SOH) reporting.\n\n### 6.2 Operating Schedule & Concurrency Protection\nWorkshops operate 6 days a week (Monday through Saturday, 08:30 AM to 05:30 PM). Sunday operations are strictly closed for scheduled bay maintenance. Like test-drives, service appointments enforce database-level serializable locking on workshop bays, preventing bay over-allocation.'}, {'id': '7', 'title': '7. Financial Calculations & Online Valuation Tools', 'content': 'Automotive purchases depend heavily on financing and trade-in valuations. Aurelia Motors provides instant financial calculation tools on every vehicle detail page.\n\n### 7.1 Reducing-Balance EMI Calculation Formula\nVehicle detail pages feature an interactive Equated Monthly Installment (EMI) financing calculator utilizing the standard banking industry reducing-balance formula:\n\n```formula\nReducing-Balance Equated Monthly Installment (EMI) Formula:\nE = P * r * (1 + r)^n / ((1 + r)^n - 1)\nTotal Repayment = E * n\nTotal Interest Payable = Total Repayment - P\nWhere:\n- E = Monthly EMI Payment (integer paise)\n- P = Net Principal Loan Amount (On-Road Price minus Customer Down Payment)\n- r = Monthly Interest Rate (Annual Rate % / 12 / 100)\n- n = Loan Tenure in Months (12 to 84 months)\n```\n\nThe calculator updates in real time as the user adjusts down payment, interest rate (default 7.99%), and loan tenure sliders. All calculations execute using integer-paise math in `@aurelia/shared`.\n\n### 7.2 Multi-Factor Trade-In Valuation Heuristic Engine\nProspective customers can appraise their existing vehicle via an instant multi-factor valuation engine (`POST /api/trade-ins/estimate`):\n\n```formula\nInstant Multi-Factor Trade-In Valuation Heuristic:\nDepreciation Rate = Base Year Factor * (1 + Mileage Penalty) * Condition Multiplier\nEstimated Valuation = Original Invoice Value * (1 - Depreciation Rate)\n```\n\n1. **Base Year Depreciation Factor**: 15% in Year 1, +10% for Years 2-4, and +8% annually thereafter.\n2. **Mileage Penalty**: Compounded adjustment if annual mileage exceeds 12,000 km/year.\n3. **Condition Multiplier**: Scaled based on user-reported physical status (`EXCELLENT`: 1.05x, `GOOD`: 1.00x, `FAIR`: 0.90x, `POOR`: 0.75x).\n4. **Output Range**: The system outputs an illustrative valuation band (`minPaise` to `maxPaise`), encouraging the customer to submit a formal trade-in appraisal request with consent under the DPDP Act.'}, {'id': '8', 'title': '8. Staff Authentication, Session Security & RBAC', 'content': "Internal dealership operations handle confidential customer data, margin figures, and lead details requiring enterprise-grade security.\n\n### 8.1 Dual-Layer RBAC & Facility Location Scoping\nStaff permissions are governed by a dual-layer security matrix combining functional role permissions with physical facility location assignments:\n\n| Role Identifier | Functional Scope | Typical Operations |\n| :--- | :--- | :--- |\n| `ADMIN` | Global Dealership Network | Staff provisioning, price book publishing, CSV lead import, system-wide metrics, trade-in approvals. |\n| `SALES_CONSULTANT` | Showroom Assigned | Lead outreach, SLA activity logging, test-drive management, customer quotations. |\n| `USED_CAR_SPECIALIST` | Certified Yard Assigned | Used car appraisal, inspection logging, trade-in valuation, price change proposals. |\n| `SERVICE_ADVISOR` | Workshop Assigned | Service appointment check-in, bay allocation, service package estimates. |\n\nLocation scoping strictly confines non-admin users to their assigned facility. A sales consultant at `LKO-CENTRAL` cannot view test-drive appointments or lead queues belonging to `LKO-GOMTI` (enforced via database query scoping and HTTP 403 authorization guards).\n\n### 8.2 Cryptographic Session Architecture & Password Hashing\n- **Argon2id Password Storage**: Staff passwords are encrypted using Argon2id (`argon2.hash`) with modern parameters (memory cost 64MB, time cost 3 iterations, parallelism 4 threads).\n- **Session Tokens**: Active sessions generate a 256-bit random cryptographic token stored as a SHA-256 hash in `staff_sessions`.\n- **HttpOnly Cookies**: Session identifiers are transported exclusively via `HttpOnly`, `SameSite=Lax`, and `Secure` (in production) cookies, completely neutralizing Cross-Site Scripting (XSS) session theft.\n- **Double-Submit HMAC CSRF Protection**: Mutating HTTP verbs (`POST`, `PUT`, `PATCH`, `DELETE`) require a valid `X-CSRF-Token` header verified against an HMAC-SHA256 signature generated with the server's `CSRF_SECRET`."}, {'id': '9', 'title': '9. Omnichannel Customer Enquiry Pipeline & DPDP Act 2023 Compliance', 'content': "Customer enquiries enter the dealership from website modals, vehicle detail pages, test-drive booking requests, trade-in valuations, and third-party portal CSV imports.\n\n### 9.1 Inbound Capture Pipeline\nThe public endpoint `POST /api/enquiries` processes inbound interest with automated data normalization and validation:\n1. **Zod Schema Validation**: Validates full name, Indian mobile number (+91 E.164 format), optional email, preferred showroom code, interest type (`BUY_NEW`, `TEST_DRIVE`, `BUY_USED`, `EXCHANGE`, `SERVICE`, `FINANCE`), and optional model/variant slugs.\n2. **Explicit DPDP Consent Enforcement**: In compliance with India's Digital Personal Data Protection Act 2023, every enquiry requires an explicit consent flag (`consentGiven: true`). The database stores an immutable consent log (`DpdpConsent`) recording consent type, timestamp, IP address, and user agent string.\n3. **Automated Customer Profile Upsert**: Finds or creates the customer record by phone number, appending the new enquiry without creating duplicate contact records.\n4. **30-Minute Deduplication Window**: Prevents duplicate submissions caused by double-clicks or accidental re-submissions. If an identical enquiry is received from the same phone number for the same model within 30 minutes, the existing enquiry is returned without duplicating CRM lead queues."}, {'id': '10', 'title': '10. Deterministic Workload-Balanced Lead Routing Engine', 'content': "Prompt lead distribution directly impacts sales conversion rates. Aurelia Motors routes incoming leads using an automated, deterministic workload-balanced allocation engine.\n\n### 10.1 Weighted Round-Robin Allocation Algorithm\nWhen a qualified lead is ingested, the assignment engine executes the following logic:\n1. **Showroom Affinity Filter**: Identifies all active sales consultants explicitly assigned to the customer's selected showroom facility.\n2. **Consultant Active Workload Metric**:\n\n```formula\nConsultant Active Workload Metric:\nActive Workload = Total active assigned leads in [NEW, ASSIGNED, CONTACTED, QUALIFIED, TEST_DRIVE_SCHEDULED, NEGOTIATING]\n```\n\n3. **Tie-Breaking Resolution**: The consultant with the lowest active workload receives the lead. If multiple consultants share identical workload counts, assignment breaks ties by least recent allocation timestamp (`lastAssignedAt ASC`).\n4. **Atomic Transaction Stamping**: The lead is assigned, status transitions to `ASSIGNED`, `assignedAt` is stamped, and an internal notification (`StaffNotification`) is dispatched to the consultant's inbox."}, {'id': '11', 'title': '11. Third-Party Portal CSV Batch Import & Deduplication', 'content': "Automotive dealerships purchase marketing leads from external consumer portals (e.g., CarDekho, CarWale, Facebook Ads). Aurelia Motors includes an administrative CSV batch ingestion engine.\n\n### 11.1 Two-Stage Validation & Ingestion Pipeline\nTo safeguard CRM data hygiene, CSV uploads follow a two-stage preview-and-commit workflow:\n1. **Preview & Schema Validation (`POST /api/staff/leads/import/preview`)**:\n   - Parses multipart CSV uploads with header normalization.\n   - Required columns: `customerName`, `customerPhone`, `interestType`, `preferredShowroomCode`. Optional: `customerEmail`, `notes`, `sourcePortal`.\n   - Validates every row against Zod rules and checks existing database records for phone number matches.\n   - Returns a structured preview: total rows, valid rows, invalid rows with specific cell error details, and detected duplicates.\n2. **Atomic Batch Execution (`POST /api/staff/leads/import`)**:\n   - Imports valid rows in a single database transaction.\n   - Deduplicates leads against existing CRM records.\n   - Runs the deterministic lead routing engine on each imported row, distributing leads evenly across the designated showroom's sales team.\n   - Logs an audit entity (`ImportBatch`) recording batch ID, uploaded filename, total processed count, created count, skipped duplicate count, acting admin ID, and execution timestamp."}, {'id': '12', 'title': '12. Lead CRM Lifecycle & Response-Time Tracking', 'content': "Automotive sales conversion drops precipitously when follow-up latency exceeds 30 minutes. Aurelia Motors implements strict response-time tracking to maintain operational sales discipline.\n\n### 12.1 The 30-Minute First-Human-Response SLA\nDealership policy mandates that every prospective customer receive direct human contact within **30 minutes** of submitting an enquiry (`LEAD_RESPONSE_SLA_MINUTES = 30`).\n- **Critical Architectural Distinction**: Automated system routing and lead creation **never** count as a first-response. The lead's `firstResponseAt` timestamp remains strictly `NULL` until a human staff member records an explicit outreach event.\n- **Overdue Detection**: If a lead remains without recorded contact 30 minutes after creation, the CRM automatically flags the lead as overdue (`isOverdue: true`). Overdue leads display prominent pulsing amber badges in the staff inbox and escalate on the dealership dashboard.\n\n### 12.2 Contact Activity Logging & Lifecycle State Transitions\nSales consultants record customer interactions via `POST /api/staff/leads/:id/activities` (channels: `PHONE`, `WHATSAPP`, `EMAIL`, `MEETING`). The first logged outreach permanently records `firstResponseAt` and computes the exact response time in minutes. Subsequent activities are appended to the lead's historical audit timeline without modifying the initial SLA metric.\n\n```text\n+-----------------------------------------------------------------------------------+\n|                        LEAD ROUTING & SLA LIFECYCLE FLOW                          |\n+-----------------------------------------------------------------------------------+\n|                                                                                   |\n|   [ Inbound Customer Enquiry ] ---> ( 30-Minute Deduplication Check )             |\n|                                                    |                              |\n|                                                    v                              |\n|                              ( Weighted Round-Robin Consultant Assignment )       |\n|                                                    |                              |\n|                                                    v                              |\n|                                      Status: [ NEW / ASSIGNED ]                   |\n|                                                    |                              |\n|                                                    v                              |\n|                             +----------------------------------------------+      |\n|                             |  30-Minute First-Human-Response SLA Clock    |      |\n|                             +----------------------------------------------+      |\n|                                       /                          \\                |\n|                    If Human Outreach logged           If > 30 Mins without contact|\n|                                     /                              \\              |\n|                                    v                                v             |\n|                        Status: [ CONTACTED ]                Flag: [ OVERDUE ]     |\n|                                    |                        (Pulsing Alert)       |\n|                                    v                                              |\n|                        Status: [ QUALIFIED ]                                      |\n|                                    |                                              |\n|                                    v                                              |\n|                        Status: [ TEST_DRIVE_SCHEDULED ]                           |\n|                                    |                                              |\n|                                    v                                              |\n|                        Status: [ NEGOTIATING ]                                    |\n|                                   / \\                                             |\n|                                  /   \\                                            |\n|                                 v     v                                           |\n|                            [ WON ]   [ LOST ]                                     |\n+-----------------------------------------------------------------------------------+\n```"}, {'id': '13', 'title': '13. Dealership Content & Price Governance CMS', 'content': "The platform empowers dealership administrators to manage marketing campaigns, tariffs, and inventory without engineering intervention.\n\n### 13.1 Administrative CMS Capabilities\n- **Vehicle Model & Variant CMS (`/api/admin/cms/models`, `/api/admin/cms/variants`)**: Administrators can create new models, configure powertrain specifications, upload imagery, and soft-deactivate discontinued trims.\n- **Showroom Inventory Management (`/api/admin/cms/inventory`)**: Add, inspect, and update physical stock units assigned to showrooms.\n- **Certified Used Vehicle CMS (`/api/admin/cms/used-vehicles`)**: Provision certified pre-owned stock, manage condition findings, and adjust list prices.\n- **Banners & Promotional Offers (`/api/admin/content/banners`, `/api/admin/content/offers`)**: Configure homepage marketing carousels, festival finance schemes (e.g., *Festive Season Zero Down-Payment Drive*), exchange bonuses, and interest rate subsidies.\n\n### 13.2 Used Car Price Approval Governance & Separation of Duties\nTo protect dealership gross margins and prevent unauthorized price tampering, Aurelia Motors enforces a strict separation-of-duties workflow for certified pre-owned pricing:\n1. **Proposal Submission**: A used car specialist submits a price adjustment proposal (`POST /api/staff/used-vehicles/:id/propose-price`), specifying the target price in integer paise and business justification (e.g., *Market competitive adjustment following 30-day inventory aging*).\n2. **Review & Approval**: The proposed price is held in `PENDING` state. Only a Dealership Administrator can approve or reject the proposal (`POST /api/staff/used-car-pricing/proposals/:id/approve`).\n3. **Drift Protection**: If approved, the vehicle's `pricePaise` is atomically updated, an audit record is sealed, and real-time notifications are dispatched to staff."}, {'id': '14', 'title': '14. Grounded Domain Intelligence Engine Architecture', 'content': 'Aurelia Motors integrates intelligent lead assistance while maintaining strict architectural honesty and data integrity.\n\n### 14.1 Honest Architectural Labelling: Grounded Domain Engine vs External LLM\nMany systems misleadingly label hardcoded templates as "generative AI" or deploy ungrounded external LLMs that hallucinate non-existent car models and false prices. Aurelia Motors takes an honest, robust approach:\n- **Aurelia Grounded Domain Engine**: Powered by an in-process deterministic intelligence engine combining keyword intent extraction, urgency scoring, contextual multi-channel templating, and live PostgreSQL relational stock matching.\n- **Data Privacy & Zero Hallucination**: Operates with zero external LLM dependencies, ensuring that customer personal data never leaves dealership infrastructure (DPDP Act compliance) and eliminating false vehicle specifications or pricing hallucinations.\n- **Provider Transparency**: The API transparently and accurately identifies its provider as `\'Aurelia Grounded Domain Engine\'` across all AI endpoints, regardless of environment configuration.\n\n### 14.2 Grounded Lead Operations Features\n1. **Structured Lead Intent & Urgency Summary (`POST /api/staff/ai/:leadId/summary`)**:\n   - Parses customer notes and enquiry parameters.\n   - Evaluates urgency (`HIGH`, `MEDIUM`, `LOW`) based on customer timing indicators (e.g., wedding, immediate delivery, festival purchase).\n   - Recommends concrete next steps for the assigned sales consultant.\n2. **Human-in-the-Loop Multi-Channel Response Drafts (`POST /api/staff/ai/:leadId/response-draft`)**:\n   - Generates customized drafts tailored for **WhatsApp** (casual greeting with emoji and quick-action link), **Email** (formal quotation and showroom brochure), and **Phone Call Script** (structured discovery guide with opening, probing questions, and appointment close).\n   - Human-in-the-Loop Mandate: Drafts are never sent automatically. They populate an editable textarea in the staff CRM interface, allowing the consultant to review, refine, and approve before communicating.\n3. **Real Stock-Matched Vehicle Recommendations (`POST /api/staff/ai/:leadId/recommendations`)**:\n   - Queries live PostgreSQL inventory rows (`priceEntries` and `usedVehicles`).\n   - Recommends only authentic in-stock models within the customer\'s budget band.\n   - **Zero Hallucination Guarantee**: Prices, specifications, and availability are strictly retrieved from real database records and never hallucinated.'}, {'id': '15', 'title': '15. Notification System & Outbound Communication Boundaries', 'content': 'Effective dealership coordination requires prompt internal staff alerts and clear outbound customer acknowledgements.\n\n### 15.1 Real-Time Staff Notifications Popover\nThe staff operational header features a real-time notification popover backed by the `StaffNotification` entity:\n- **Event Triggers**:\n  - `LEAD_ASSIGNED`: Alerts a sales consultant immediately upon lead allocation.\n  - `PRICE_PROPOSAL_SUBMITTED`: Alerts administrators of pending used car price proposals.\n  - `PRICE_PROPOSAL_DECIDED`: Alerts specialists when their price proposal has been approved or rejected.\n  - `TRADE_IN_EVALUATED`: Alerts consultants when formal trade-in valuation offers are issued.\n- **Notification API**: `GET /api/staff/notifications`, `GET /api/staff/notifications/unread-count`, and `PATCH /api/staff/notifications/:id/read`.\n\n### 15.2 Outbound Customer Communication Boundaries\nCustomer acknowledgements (booking confirmations, cancellation receipts, trade-in valuations) are generated by dedicated notification formatters producing structured plain text and HTML templates with deep-link tokens. In production, these templates plug directly into webhook boundaries. In accordance with honest system boundaries, no commercial third-party SMS or WhatsApp aggregators (e.g., Twilio, Gupshup) are invoked in this offline evaluation build, avoiding unverified paid telecom contracts while preserving end-to-end delivery contracts.'}, {'id': '16', 'title': '16. Comprehensive Data Model & PostgreSQL Architecture', 'content': "The platform is backed by PostgreSQL 18.1 managed through Prisma ORM 6, enforcing strict referential integrity, indexes, and constraints across 28 relational domain entities.\n\n### 16.1 Core Relational Entity Model\n```text\n+-----------------------------------------------------------------------------------+\n|                        CORE RELATIONAL DOMAIN ENTITIES                            |\n+-----------------------------------------------------------------------------------+\n|                                                                                   |\n|   FACILITIES                    VEHICLE CATALOGUE              PRICING            |\n|   +--------------+              +---------------+        +--------------------+   |\n|   |   Showroom   |<---+         | VehicleModel  |        |     PriceBook      |   |\n|   +--------------+    |         +-------+-------+        +---------+----------+   |\n|          ^            |                 | 1:N                      | 1:N          |\n|          | 1:N        |                 v                          v              |\n|   +------+-------+    |         +-------+-------+        +---------+----------+   |\n|   |InventoryUnit |    |         |VehicleVariant |<-------+     PriceEntry     |   |\n|   +--------------+    |         +-------+-------+  N:1   +---------+----------+   |\n|                       |                 |                          | 1:N          |\n|   USED VEHICLES       |                 v                          v              |\n|   +--------------+    |         +---------------+        +---------+----------+   |\n|   |CertifiedCar  +----+         | VariantColour |        |   PriceComponent   |   |\n|   +------+-------+              +---------------+        +--------------------+   |\n|          | 1:1                                                                    |\n|          v                                                                        |\n|   +--------------+              BOOKINGS & WORKSHOPS     CRM & ENQUIRIES          |\n|   | InspectReport|              +---------------+        +--------------------+   |\n|   +--------------+              |   Workshop    |        |      Customer      |   |\n|                                 +-------+-------+        +---------+----------+   |\n|   STAFF & ACCESS                        | 1:N                      | 1:N          |\n|   +--------------+                      v                          v              |\n|   |  StaffUser   |              +---------------+        +---------+----------+   |\n|   +---+------+---+              |ServiceBooking |        |  Enquiry / Lead    |   |\n|       |      |                  +---------------+        +---------+----------+   |\n|   1:N |      | 1:N                                                 | 1:N          |\n|       v      v                  +---------------+                  v              |\n|   +---+--+ +-+----------+       |TestDriveAppt  |        +---------+----------+   |\n|   |Sess'n| |StaffLocat'n|       +---------------+        |LeadActivity & Note |   |\n|   +------+ +------------+                                +--------------------+   |\n+-----------------------------------------------------------------------------------+\n```\n\n### 16.2 Database Entities & Relationships\n1. **Facility Entities**: `Showroom` (3 Lucknow sales facilities) and `Workshop` (2 maintenance workshops with bay capacities).\n2. **Catalogue Entities**: `VehicleModel`, `VehicleVariant`, `VariantSpecificationGroup`, `VariantSpecificationItem`, `VariantColour`, `VehicleImage`, and `InventoryUnit`.\n3. **Pricing Entities**: `PriceBook`, `PriceEntry`, and `PriceComponent` (integer paise).\n4. **Used Car Entities**: `CertifiedUsedVehicle`, `InspectionReport`, `InspectionItem`, and `UsedCarPriceProposal`.\n5. **Booking Entities**: `DemoVehicle`, `TestDriveAppointment`, `WorkshopOperatingHour`, `ServicePackageType`, and `ServiceBooking`.\n6. **CRM & Lead Entities**: `Customer`, `DpdpConsent`, `CustomerEnquiry`, `Lead`, `LeadActivity`, `LeadInternalNote`, `LeadStatusHistory`, and `ImportBatch`.\n7. **Administrative Entities**: `StaffUser`, `StaffSession`, `StaffLocationAssignment`, `AuthAuditLog`, `HomepageBanner`, `PromotionOffer`, `TradeInRequest`, and `StaffNotification`."}, {'id': '17', 'title': '17. Security Architecture & Threat Modeling', 'content': 'Aurelia Motors applies a defense-in-depth posture addressing the OWASP Top 10 vulnerabilities.\n\n### 17.1 Security Controls Matrix\n- **Authentication**: Argon2id password hashing, constant-time verification, session token revocation on logout.\n- **CSRF Protection**: HMAC-SHA256 double-submit tokens validated on all state-altering requests.\n- **Session Transport**: HttpOnly, SameSite=Lax, and Secure cookie flags preventing JavaScript access and cross-site exfiltration.\n- **Access Control (RBAC)**: Dual-layer role and facility location scoping verified in API middleware.\n- **Injection Prevention**: 100% parameterized SQL via Prisma ORM; zero raw string interpolation.\n- **Input Validation**: Strict Zod schemas sanitizing all request parameters before execution.\n- **Rate Limiting**: Express rate limiters protecting public enquiry intake and staff login endpoints.\n- **HTTP Security Headers**: Helmet middleware enforcing strict `Content-Security-Policy`, `X-Frame-Options: SAMEORIGIN`, `X-Content-Type-Options: nosniff`, and `Strict-Transport-Security`.'}, {'id': '18', 'title': '18. Performance Verification & Scalability', 'content': 'Performance testing was benchmarked using Google Chrome Navigation Timing API and direct API profiling under local developer host conditions.\n\n### 18.1 Local Benchmark Profile\n- **Homepage Load Time**: ~1.67 seconds (DOMContentLoaded in 647ms).\n- **Vehicle Catalogue Load Time**: ~1.19 seconds (DOMContentLoaded in 107ms).\n- **On-Road Pricing Computation API**: Response latency < 25 milliseconds.\n- **Lead Ingestion & Routing Latency**: ~301 milliseconds (comfortably within the 25-second API timeout budget).\n\n> **Benchmark Context Note:** These measurements reflect local host execution under developer conditions (Vite preview + local PostgreSQL 18.1). Real-world 4G mobile measurements will naturally fluctuate based on wireless network latency and edge CDN caching. Production builds utilize code-split vendor chunks and Gzip compression to minimize mobile payload footprint.'}, {'id': '19', 'title': '19. Responsive UI Design & Accessibility (a11y)', 'content': 'The digital dealership front-end is crafted with a luxury automotive aesthetic using modern web standards.\n\n### 19.1 Design System & Typography\n- **Display Typography**: **Fraunces Variable**, an elegant optical-size serif font conveying automotive prestige.\n- **Body Typography**: **Manrope Variable**, an ultra-clean geometric sans-serif ensuring crisp legibility.\n- **Palette**: Deep slate (`#0f172a`), refined porcelain (`#f8fafc`), warm amber highlights (`#d97706`), and functional status emeralds/crimsons.\n- **Responsive Layout**: Designed for three primary viewports: Desktop (1440×900), Tablet (768×1024), and Mobile (375×667) with responsive drawer navigation and touch targets.\n- **Accessibility (a11y)**: Adheres to WCAG 2.1 AA guidelines with semantic HTML landmarks, high-contrast color pairings, visible focus indicators, and ARIA attributes for modal dialogs and alert banners.'}, {'id': '20', 'title': '20. Operational Runbook & Reviewer Evaluation Guide', 'content': 'The platform supports immediate evaluation via containerized Docker Compose or native local development.\n\n### 20.1 Option A: Docker Compose (Recommended 1-Click Evaluation)\n```bash\n# 1. Clone or extract repository\ncd aurelia-motors\n\n# 2. Launch database, API, and Web frontend containers\ndocker compose up -d --build\n\n# 3. Verify container health status\ndocker compose ps\ncurl http://localhost:4000/api/health\n```\n\n- Public Web Application: `http://localhost:5173` or `http://localhost`\n- Backend REST API: `http://localhost:4000/api`\n- API Health Status: `http://localhost:4000/api/health`\n- Staff Operations Portal: `http://localhost:5173/staff/login`\n\n### 20.2 Option B: Native Local Evaluation (Node.js & PostgreSQL)\n```bash\n# 1. Install workspace dependencies\nnpm install\n\n# 2. Configure environment\ncp .env.example .env\n\n# 3. Apply database migrations & seed initial dataset\nnpm run db:deploy\nnpm run db:seed\n\n# 4. Start local development servers\nnpm run dev\n```\n\n### 20.3 Pre-Seeded Evaluation Accounts\nAll accounts use the demo password `Aurelia2026!`:\n- Administrator: `admin@aureliamotors.com` (Global dealership access)\n- Sales Consultant (Central): `sales.central@aureliamotors.com` (Scoped to Central Lucknow)\n- Sales Consultant (Gomti Nagar): `sales.gomti@aureliamotors.com` (Scoped to Gomti Nagar)\n- Service Advisor (Gomti Workshop): `service.gomti@aureliamotors.com` (Scoped to Gomti Workshop)\n- Service Advisor (Sushant Golf City Workshop): `service.sgc@aureliamotors.com` (Scoped to SGC Workshop)\n- Used Car Specialist: `usedcars@aureliamotors.com` (Certified Pre-Owned yard)\n\n*Note: The staff login screen includes 1-click quick-fill buttons for instant reviewer credential population.*'}, {'id': '21', 'title': '21. Test Suite & Verification Summary', 'content': 'The codebase has undergone comprehensive automated verification:\n- **Automated Test Results**: **127 passing tests across 15 test suites** executed via Vitest and Supertest:\n  1. `validation.test.ts` (2 tests): Request validation schemas and error envelope formatting.\n  2. `health.test.ts` (7 tests): Database connection health probe and uptime reporting.\n  3. `showrooms.test.ts` (3 tests): Showroom listing, code lookup, and active facility filtering.\n  4. `catalogue.test.ts` (8 tests): Vehicle catalogue discovery, variant specs, and on-road pricing.\n  5. `used-vehicles.test.ts` (5 tests): Pre-owned listings, inspection reports, and masked registration plates.\n  6. `trade-ins.test.ts` (5 tests): Valuation heuristics, DPDP consent enforcement, and trade-in submission.\n  7. `appointments.test.ts` (17 tests): Test-drive capacity, double-booking race condition prevention, workshop bay capacity, token lookup, and cancellation.\n  8. `auth.test.ts` (25 tests): Staff login, Argon2id verification, session revocation, CSRF protection, and location scoping.\n  9. `leads.test.ts` (14 tests): Inbound enquiry intake, deterministic routing, 30-minute response-time tracking, overdue detection, and CSV batch import.\n  10. `cms.test.ts` (7 tests): Vehicle model & variant CMS, showroom inventory stock, price book publishing, and date overlap prevention.\n  11. `content.test.ts` (4 tests): Homepage banners and promotional campaign CMS.\n  12. `notifications.test.ts` (5 tests): Staff notifications popover, unread counts, and mark-as-read workflows.\n  13. `used-car-pricing.test.ts` (6 tests): Separation-of-duties price proposals and approval governance.\n  14. `ai.test.ts` (5 tests): Grounded lead intent summary, multi-channel response drafts, inventory-backed stock recommendations, and engine provider attribution regression test.\n  15. `e2e-journeys.test.ts` (14 tests): Full end-to-end integration journeys across all customer and staff workflows.\n- **Code Quality**: ESLint 9 passing with 0 warnings, Prettier 3 passing with 0 formatting warnings, strict TypeScript passing with 0 compilation errors, and production build succeeded in 810ms.'}, {'id': '22', 'title': '22. Out-of-Scope Boundaries & Honest System Trade-offs', 'content': 'To maintain architectural clarity and focus on the core requirements of Problem 4, the following boundaries were deliberately established:\n1. **Financial Payment Gateway**: Test-drive appointments and workshop service bookings are complimentary in accordance with authorized dealership customer care standards. Online down-payment collection (e.g., Razorpay/Stripe) is outside the scope of Problem 4.\n2. **Third-Party Paid SMS/WhatsApp Gateway**: Outbound messaging is implemented as structured notification templates and webhook boundaries rather than connecting to live paid commercial telecom aggregators.\n3. **AI Integration**: The platform utilizes the in-house deterministic Aurelia Grounded Domain Engine querying live PostgreSQL stock and tariffs, eliminating external LLM dependencies, API costs, latency, and customer data leakage.'}, {'id': '23', 'title': '23. Future Evolution & Roadmap', 'content': 'Key architectural extension points for post-internship production expansion:\n- **Omnichannel Live Chat & WhatsApp Bot**: Integrating conversational AI directly into the customer WhatsApp channel using the existing Grounded Domain Engine.\n- **Automated Service Bay Telemetry**: Connecting IoT OBD-II diagnostic scanners in the workshops directly to vehicle service appointment records.\n- **Dynamic Insurance Premium Calculator**: API integration with Indian general insurance underwriting engines (e.g., ICICI Lombard, Bajaj Allianz) for live quotes based on vehicle IDV.'}, {'id': '24', 'title': '24. Appendix: Complete API Reference & Database Dictionary', 'content': '### 24.1 Complete REST API Endpoint Directory\n\n| Method | Endpoint | Access | Purpose |\n| :--- | :--- | :--- | :--- |\n| `GET` | `/api/health` | Public | Service health & PostgreSQL connectivity probe |\n| `GET` | `/api/showrooms` | Public | Lists active Lucknow showroom facilities |\n| `GET` | `/api/showrooms/:code` | Public | Individual showroom facility detail |\n| `GET` | `/api/catalogue/models` | Public | Model catalogue with filters, search, and starting prices |\n| `GET` | `/api/catalogue/models/:slug` | Public | Complete model detail with specifications and variants |\n| `GET` | `/api/catalogue/variants/:slug/pricing` | Public | Itemized on-road price breakdown with statutory taxes |\n| `GET` | `/api/used-vehicles` | Public | Certified pre-owned vehicle listings with masked plates |\n| `GET` | `/api/used-vehicles/:slug` | Public | Pre-owned detail with 150-point inspection findings |\n| `POST` | `/api/trade-ins/estimate` | Public | Instant trade-in valuation band without registration |\n| `POST` | `/api/trade-ins` | Public | Formal trade-in request with DPDP consent |\n| `GET` | `/api/test-drives/availability` | Public | Real-time demonstrator vehicle slot availability |\n| `POST` | `/api/test-drives` | Public | Concurrency-safe, idempotent test-drive reservation |\n| `GET` | `/api/services/workshops` | Public | Authorized workshop directory and operating schedules |\n| `GET` | `/api/services/types` | Public | Standard maintenance service packages and rates |\n| `GET` | `/api/services/availability` | Public | Capacity-checked workshop bay availability |\n| `POST` | `/api/services/bookings` | Public | Concurrency-safe service appointment booking |\n| `GET` | `/api/bookings/confirmation/:ref` | Public | Booking verification with token-based unmasking |\n| `POST` | `/api/bookings/:ref/cancel` | Public | Self-service cancellation releasing slot capacity |\n| `POST` | `/api/enquiries` | Public | Omnichannel customer enquiry capture with DPDP consent |\n| `POST` | `/api/auth/login` | Public | Rate-limited staff login, issues HttpOnly session cookie |\n| `POST` | `/api/auth/logout` | Staff | Revokes session token in database, clears cookie |\n| `GET` | `/api/auth/me` | Staff | Current authenticated staff user profile & CSRF token |\n| `POST` | `/api/auth/change-password` | Staff | Updates staff password (Argon2id re-hashing) |\n| `GET` | `/api/staff/dashboard` | Staff | Location-scoped real-time operational metrics |\n| `GET` | `/api/staff/appointments` | Staff | Location-scoped test-drive & service appointment queue |\n| `GET` | `/api/staff/leads` | Staff | Location-scoped CRM lead inbox with SLA countdown |\n| `GET` | `/api/staff/leads/metrics` | Staff | Real-time SLA response metrics & compliance rates |\n| `GET` | `/api/staff/leads/:id` | Staff | Complete lead record, customer profile & audit timeline |\n| `PATCH` | `/api/staff/leads/:id/status` | Staff | Audited lead status transition |\n| `POST` | `/api/staff/leads/:id/notes` | Staff | Appends internal private staff consultation note |\n| `POST` | `/api/staff/leads/:id/activities` | Staff | Logs customer outreach & stamps first-human-response SLA |\n| `PATCH` | `/api/staff/leads/:id/assignment` | Admin | Reassigns lead to another sales consultant |\n| `POST` | `/api/staff/leads/import/preview` | Admin | Validates portal CSV rows & detects duplicate contacts |\n| `POST` | `/api/staff/leads/import` | Admin | Executes batch lead ingestion & auto-assignment |\n| `GET` | `/api/staff/leads/imports` | Admin | Audit history of past CSV import batches |\n| `GET` | `/api/admin/cms/models` | Admin | Vehicle model CMS list |\n| `POST` | `/api/admin/cms/models` | Admin | Creates new vehicle model |\n| `PATCH` | `/api/admin/cms/models/:id` | Admin | Updates vehicle model attributes |\n| `DELETE` | `/api/admin/cms/models/:id` | Admin | Soft-deactivates vehicle model |\n| `POST` | `/api/admin/cms/models/:id/variants` | Admin | Creates new variant trim under model |\n| `PATCH` | `/api/admin/cms/variants/:id` | Admin | Updates variant powertrain parameters |\n| `DELETE` | `/api/admin/cms/variants/:id` | Admin | Soft-deactivates variant |\n| `GET` | `/api/admin/cms/inventory` | Admin | Showroom physical inventory stock directory |\n| `POST` | `/api/admin/cms/inventory` | Admin | Provisions physical inventory vehicle to showroom |\n| `PATCH` | `/api/admin/cms/inventory/:id` | Admin | Updates inventory status (AVAILABLE, RESERVED, SOLD) |\n| `GET` | `/api/admin/cms/price-books` | Admin | Versioned price book directory |\n| `POST` | `/api/admin/cms/price-books` | Admin | Creates new draft price book |\n| `POST` | `/api/admin/cms/price-books/:id/publish` | Admin | Publishes price book with overlap validation |\n| `POST` | `/api/staff/used-vehicles/:id/propose-price` | Specialist | Submits certified pre-owned price proposal |\n| `GET` | `/api/staff/used-car-pricing/proposals` | Staff | Lists pending and decided price proposals |\n| `POST` | `/api/staff/used-car-pricing/proposals/:id/approve` | Admin | Approves proposal and atomically updates vehicle price |\n| `POST` | `/api/staff/used-car-pricing/proposals/:id/reject` | Admin | Rejects price adjustment proposal |\n| `GET` | `/api/banners` | Public | Active homepage promotional banners |\n| `GET` | `/api/offers` | Public | Active dealership promotional schemes & finance offers |\n| `POST` | `/api/staff/ai/:leadId/summary` | Staff | Structured lead intent & urgency summary |\n| `POST` | `/api/staff/ai/:leadId/response-draft` | Staff | Human-in-the-loop draft generation (WhatsApp/Email/Phone) |\n| `POST` | `/api/staff/ai/:leadId/recommendations` | Staff | Grounded PostgreSQL stock-matched recommendations |\n| `GET` | `/api/staff/notifications` | Staff | Real-time internal staff alert notifications |\n| `GET` | `/api/staff/notifications/unread-count` | Staff | Count of unread notifications |\n| `PATCH` | `/api/staff/notifications/:id/read` | Staff | Marks individual notification as read |\n| `POST` | `/api/staff/notifications/mark-all-read` | Staff | Marks all notifications as read |\n| `GET` | `/api/admin/staff` | Admin | Staff user directory |\n| `POST` | `/api/admin/staff` | Admin | Provisions new staff user with location assignments |\n| `PATCH` | `/api/admin/staff/:id` | Admin | Updates staff user (with last-admin safeguard) |\n| `POST` | `/api/admin/staff/:id/disable` | Admin | Deactivates staff user and revokes active sessions |'}]

def write_markdown_document(output_path):
    print(f"Writing Markdown TDD to: {output_path}")
    with open(output_path, "w", encoding="utf-8") as f:
        f.write(f"# {TITLE}\n\n")
        f.write(f"## {SUBTITLE}\n\n")
        f.write(f"{METADATA.strip()}\n\n")
        f.write("---\n\n")
        f.write("## Table of Contents\n\n")
        for sec in SECTIONS:
            slug = sec['title'].lower().replace(' ', '-').replace('.', '').replace('&', '').replace('/', '')
            f.write(f"- [{sec['title']}](#{slug})\n")
        f.write("\n---\n\n")
        for sec in SECTIONS:
            f.write(f"## {sec['title']}\n\n")
            f.write(f"{sec['content'].strip()}\n\n")
            f.write("---\n\n")
    print(f"Markdown successfully written ({os.path.getsize(output_path):,} bytes).")

def clean_xml_string(s):
    if not isinstance(s, str):
        return str(s)
    return re.sub(r'[\x00-\x08\x0B\x0C\x0E-\x1F]', '', s)

def format_for_reportlab(text):
    text = clean_xml_string(text)
    # Escape XML special characters
    text = text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
    # Convert markdown formatting
    text = re.sub(r'\*\*(.*?)\*\*', r'<b>\1</b>', text)
    text = re.sub(r'\*(.*?)\*', r'<i>\1</i>', text)
    # Inline code
    text = re.sub(r'`(.*?)`', r'<font name="Courier" color="#0f172a">\1</font>', text)
    return text

def parse_section_blocks(content):
    """
    Parses section content into typed blocks:
    - ('h2', text)
    - ('h3', text)
    - ('table', text)
    - ('code', text)
    - ('formula', text)
    - ('list', [items])
    - ('p', text)
    """
    lines = content.strip().split("\n")
    blocks = []
    i = 0
    n = len(lines)
    
    while i < n:
        line = lines[i].strip()
        if not line:
            i += 1
            continue
            
        # Code block
        if line.startswith("```"):
            lang = line[3:].strip()
            code_lines = []
            i += 1
            while i < n and not lines[i].strip().startswith("```"):
                code_lines.append(lines[i])
                i += 1
            if i < n and lines[i].strip().startswith("```"):
                i += 1
            code_text = "\n".join(code_lines)
            if lang == "formula":
                blocks.append(("formula", clean_xml_string(code_text)))
            else:
                blocks.append(("code", clean_xml_string(code_text)))
            continue
            
        # Heading 2
        if line.startswith("### "):
            blocks.append(("h2", clean_xml_string(line[4:].strip())))
            i += 1
            continue
            
        # Heading 3
        if line.startswith("#### "):
            blocks.append(("h3", clean_xml_string(line[5:].strip())))
            i += 1
            continue
            
        # Table block
        if line.startswith("|") and "|" in line:
            table_lines = []
            while i < n and lines[i].strip().startswith("|"):
                table_lines.append(lines[i].strip())
                i += 1
            blocks.append(("table", clean_xml_string("\n".join(table_lines))))
            continue
            
        # Bullet or numbered list
        if line.startswith("- ") or line.startswith("* ") or re.match(r"^\d+\.\s", line):
            list_items = []
            while i < n:
                cur = lines[i].strip()
                if not cur:
                    break
                if cur.startswith("- ") or cur.startswith("* ") or re.match(r"^\d+\.\s", cur):
                    list_items.append(clean_xml_string(cur))
                    i += 1
                elif cur.startswith("   ") or cur.startswith("\t") or cur.startswith("  "):
                    # Sub-bullet continuation
                    if list_items:
                        list_items[-1] += " " + clean_xml_string(cur.strip())
                    i += 1
                else:
                    break
            blocks.append(("list", list_items))
            continue
            
        # Standard paragraph
        p_lines = []
        while i < n and lines[i].strip() and not lines[i].strip().startswith("###") and not lines[i].strip().startswith("```") and not lines[i].strip().startswith("|") and not lines[i].strip().startswith("- ") and not re.match(r"^\d+\.\s", lines[i].strip()):
            p_lines.append(lines[i].strip())
            i += 1
        blocks.append(("p", clean_xml_string(" ".join(p_lines))))
        
    return blocks

def is_markdown_table_separator(line):
    cells = [c.strip() for c in line.split("|")[1:-1]]
    return len(cells) > 0 and all(re.match(r"^:?-+:?$", c) for c in cells)

def generate_docx_document(output_path):
    print(f"Generating Word DOCX to: {output_path}")
    doc = Document()
    
    for section in doc.sections:
        section.top_margin = Inches(1)
        section.bottom_margin = Inches(1)
        section.left_margin = Inches(1)
        section.right_margin = Inches(1)
        
        # Header & Footer
        header = section.header
        hp = header.paragraphs[0]
        hp.alignment = WD_ALIGN_PARAGRAPH.RIGHT
        hrun = hp.add_run("Aurelia Motors — Technical Design Document")
        hrun.font.name = "Calibri"
        hrun.font.size = Pt(8.5)
        hrun.font.color.rgb = RGBColor(100, 116, 139)
        
        footer = section.footer
        fp = footer.paragraphs[0]
        fp.alignment = WD_ALIGN_PARAGRAPH.LEFT
        frun = fp.add_run("Aurelia Motors — Enterprise Automotive Platform")
        frun.font.name = "Calibri"
        frun.font.size = Pt(8.5)
        frun.font.color.rgb = RGBColor(100, 116, 139)
        
    # Title
    tp = doc.add_paragraph()
    tp.paragraph_format.space_after = Pt(2)
    trun = tp.add_run(TITLE)
    trun.font.name = "Calibri"
    trun.font.size = Pt(18)
    trun.font.bold = True
    trun.font.color.rgb = RGBColor(15, 23, 42)
    
    # Subtitle
    sp = doc.add_paragraph()
    sp.paragraph_format.space_after = Pt(12)
    srun = sp.add_run(SUBTITLE)
    srun.font.name = "Calibri"
    srun.font.size = Pt(11)
    srun.font.color.rgb = RGBColor(100, 116, 139)
    
    # Metadata Table
    meta_table = doc.add_table(rows=5, cols=2)
    meta_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    meta_table.autofit = False
    
    meta_data = [
        ("Project", "Enterprise Automotive Dealership Platform & Operations System"),
        ("Author", "Lochan T N <lochan87@dsce.edu.in>"),
        ("Dealership Topology", "3 Showrooms & 2 Authorized Workshops in Lucknow, UP, India"),
        ("Date & Version", "November 2026 — Version 1.0.0 (127 Automated Tests Passing)"),
        ("GitHub Repository", "https://github.com/lochan87/aurelia-motors (Pending publication)"),
    ]
    
    for r_idx, (k, v) in enumerate(meta_data):
        row = meta_table.rows[r_idx]
        cell_k, cell_v = row.cells[0], row.cells[1]
        cell_k.width = Inches(1.8)
        cell_v.width = Inches(4.7)
        
        pk = cell_k.paragraphs[0]
        pk.paragraph_format.space_after = Pt(2)
        rk = pk.add_run(k)
        rk.font.name = "Calibri"
        rk.font.size = Pt(9)
        rk.font.bold = True
        rk.font.color.rgb = RGBColor(30, 41, 59)
        
        pv = cell_v.paragraphs[0]
        pv.paragraph_format.space_after = Pt(2)
        rv = pv.add_run(v)
        rv.font.name = "Calibri"
        rv.font.size = Pt(9)
        rv.font.color.rgb = RGBColor(51, 65, 85)
        
        for cell in (cell_k, cell_v):
            shd = parse_xml(r'<w:shd {} w:fill="F8FAFC"/>'.format(nsdecls('w')))
            cell._tc.get_or_add_tcPr().append(shd)
            
    doc.add_paragraph().paragraph_format.space_after = Pt(12)
    
    for sec in SECTIONS:
        # Heading 1
        hp = doc.add_paragraph()
        hp.paragraph_format.space_before = Pt(14)
        hp.paragraph_format.space_after = Pt(4)
        hp.paragraph_format.keep_with_next = True
        hrun = hp.add_run(sec["title"])
        hrun.font.name = "Calibri"
        hrun.font.size = Pt(13)
        hrun.font.bold = True
        hrun.font.color.rgb = RGBColor(15, 23, 42)
        
        blocks = parse_section_blocks(sec["content"])
        for b_type, b_content in blocks:
            if b_type == "h2":
                p = doc.add_paragraph()
                p.paragraph_format.space_before = Pt(10)
                p.paragraph_format.space_after = Pt(3)
                p.paragraph_format.keep_with_next = True
                run = p.add_run(b_content)
                run.font.name = "Calibri"
                run.font.size = Pt(11)
                run.font.bold = True
                run.font.color.rgb = RGBColor(30, 41, 59)
            elif b_type == "h3":
                p = doc.add_paragraph()
                p.paragraph_format.space_before = Pt(8)
                p.paragraph_format.space_after = Pt(2)
                p.paragraph_format.keep_with_next = True
                run = p.add_run(b_content)
                run.font.name = "Calibri"
                run.font.size = Pt(10)
                run.font.bold = True
                run.font.color.rgb = RGBColor(51, 65, 85)
            elif b_type == "code":
                ctable = doc.add_table(rows=1, cols=1)
                ctable.alignment = WD_TABLE_ALIGNMENT.CENTER
                cell = ctable.cell(0, 0)
                cell.width = Inches(6.5)
                shd = parse_xml(r'<w:shd {} w:fill="F8FAFC"/>'.format(nsdecls('w')))
                cell._tc.get_or_add_tcPr().append(shd)
                cp = cell.paragraphs[0]
                cp.paragraph_format.space_after = Pt(0)
                crun = cp.add_run(b_content)
                crun.font.name = "Consolas"
                crun.font.size = Pt(8)
                crun.font.color.rgb = RGBColor(15, 23, 42)
                doc.add_paragraph().paragraph_format.space_after = Pt(4)
            elif b_type == "formula":
                ftable = doc.add_table(rows=1, cols=1)
                ftable.alignment = WD_TABLE_ALIGNMENT.CENTER
                cell = ftable.cell(0, 0)
                cell.width = Inches(6.5)
                shd = parse_xml(r'<w:shd {} w:fill="F0F7FF"/>'.format(nsdecls('w')))
                cell._tc.get_or_add_tcPr().append(shd)
                fp = cell.paragraphs[0]
                fp.paragraph_format.space_after = Pt(0)
                frun = fp.add_run(b_content)
                frun.font.name = "Consolas"
                frun.font.size = Pt(8.5)
                frun.font.bold = True
                frun.font.color.rgb = RGBColor(30, 58, 138)
                doc.add_paragraph().paragraph_format.space_after = Pt(4)
            elif b_type == "list":
                for item in b_content:
                    lp = doc.add_paragraph()
                    lp.paragraph_format.left_indent = Inches(0.25)
                    lp.paragraph_format.space_after = Pt(2)
                    clean_item = item.replace("**", "").replace("*", "").replace("`", "")
                    lrun = lp.add_run(clean_item)
                    lrun.font.name = "Calibri"
                    lrun.font.size = Pt(9.5)
                    lrun.font.color.rgb = RGBColor(51, 65, 85)
            elif b_type == "table":
                raw_lines = [l for l in b_content.split("\n") if l.strip() and not is_markdown_table_separator(l)]
                if len(raw_lines) >= 2:
                    rows = [[c.strip() for c in l.split("|")[1:-1]] for l in raw_lines]
                    tbl = doc.add_table(rows=len(rows), cols=len(rows[0]))
                    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
                    for r_i, r in enumerate(rows):
                        for c_i, c in enumerate(r):
                            tcell = tbl.cell(r_i, c_i)
                            tp = tcell.paragraphs[0]
                            tp.paragraph_format.space_after = Pt(1)
                            clean_c = c.replace("**", "").replace("*", "").replace("`", "")
                            trun = tp.add_run(clean_c)
                            trun.font.name = "Calibri"
                            trun.font.size = Pt(8.5)
                            if r_i == 0:
                                trun.font.bold = True
                                trun.font.color.rgb = RGBColor(255, 255, 255)
                                shd = parse_xml(r'<w:shd {} w:fill="0F172A"/>'.format(nsdecls('w')))
                                tcell._tc.get_or_add_tcPr().append(shd)
                            else:
                                trun.font.color.rgb = RGBColor(51, 65, 85)
                                if r_i % 2 == 1:
                                    shd = parse_xml(r'<w:shd {} w:fill="F8FAFC"/>'.format(nsdecls('w')))
                                    tcell._tc.get_or_add_tcPr().append(shd)
                    doc.add_paragraph().paragraph_format.space_after = Pt(4)
            else:
                p = doc.add_paragraph()
                p.paragraph_format.space_after = Pt(4)
                p.paragraph_format.line_spacing = 1.15
                clean_text = b_content.replace("**", "").replace("*", "").replace("`", "")
                run = p.add_run(clean_text)
                run.font.name = "Calibri"
                run.font.size = Pt(9.5)
                run.font.color.rgb = RGBColor(51, 65, 85)
                
    doc.save(output_path)
    print(f"Word DOCX successfully generated ({os.path.getsize(output_path):,} bytes).")

class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            canvas.Canvas.showPage(self)
        canvas.Canvas.save(self)

    def draw_page_decorations(self, page_count):
        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748b"))
        
        # Running Header (pages > 1)
        if self._pageNumber > 1:
            self.drawString(54, 11 * inch - 36, "Aurelia Motors — Technical Design Document")
            self.setStrokeColor(colors.HexColor("#e2e8f0"))
            self.setLineWidth(0.5)
            self.line(54, 11 * inch - 42, 8.5 * inch - 54, 11 * inch - 42)
            
        # Running Footer
        page_str = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(8.5 * inch - 54, 36, page_str)
        self.drawString(54, 36, "Aurelia Motors — Enterprise Automotive Platform")
        self.setStrokeColor(colors.HexColor("#e2e8f0"))
        self.setLineWidth(0.5)
        self.line(54, 46, 8.5 * inch - 54, 46)
        self.restoreState()

def generate_pdf_document(output_path):
    print(f"Generating PDF to: {output_path}")
    doc = SimpleDocTemplate(
        output_path,
        pagesize=letter,
        leftMargin=54,
        rightMargin=54,
        topMargin=54,
        bottomMargin=54,
    )
    
    styles = getSampleStyleSheet()
    
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=18,
        leading=22,
        textColor=colors.HexColor('#0f172a'),
        spaceAfter=3,
    )
    
    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=11,
        leading=15,
        textColor=colors.HexColor('#64748b'),
        spaceAfter=12,
    )
    
    h1_style = ParagraphStyle(
        'Heading1Custom',
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=15,
        textColor=colors.HexColor('#0f172a'),
        spaceBefore=12,
        spaceAfter=4,
        keepWithNext=True,
    )
    
    h2_style = ParagraphStyle(
        'Heading2Custom',
        fontName='Helvetica-Bold',
        fontSize=10,
        leading=13,
        textColor=colors.HexColor('#1e293b'),
        spaceBefore=8,
        spaceAfter=3,
        keepWithNext=True,
    )

    h3_style = ParagraphStyle(
        'Heading3Custom',
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=12,
        textColor=colors.HexColor('#334155'),
        spaceBefore=6,
        spaceAfter=2,
        keepWithNext=True,
    )
    
    body_style = ParagraphStyle(
        'BodyCustom',
        fontName='Helvetica',
        fontSize=8.5,
        leading=11.5,
        textColor=colors.HexColor('#334155'),
        spaceAfter=4,
    )

    list_style = ParagraphStyle(
        'ListCustom',
        fontName='Helvetica',
        fontSize=8.5,
        leading=11.5,
        textColor=colors.HexColor('#334155'),
        leftIndent=12,
        firstLineIndent=-8,
        spaceAfter=2,
    )
    
    code_style = ParagraphStyle(
        'CodeStyle',
        fontName='Courier',
        fontSize=6.8,
        leading=8.6,
        textColor=colors.HexColor('#0f172a'),
    )

    formula_style = ParagraphStyle(
        'FormulaStyle',
        fontName='Courier-Bold',
        fontSize=7.8,
        leading=10.5,
        textColor=colors.HexColor('#1e3a8a'),
    )

    meta_style = ParagraphStyle(
        'MetaStyle',
        fontName='Helvetica',
        fontSize=8,
        leading=10.5,
        textColor=colors.HexColor('#1e293b'),
    )
    
    story = []
    
    # Title & Subtitle
    story.append(Paragraph(TITLE, title_style))
    story.append(Paragraph(SUBTITLE, subtitle_style))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#0f172a"), spaceBefore=0, spaceAfter=8))
    
    # Metadata Table
    meta_rows = [
        [Paragraph("<b>Project:</b>", meta_style), Paragraph("Enterprise Automotive Dealership Platform & Operations System", meta_style)],
        [Paragraph("<b>Author:</b>", meta_style), Paragraph("Lochan T N &lt;lochan87@dsce.edu.in&gt;", meta_style)],
        [Paragraph("<b>Topology:</b>", meta_style), Paragraph("3 Showrooms & 2 Authorized Workshops in Lucknow, UP, India", meta_style)],
        [Paragraph("<b>Release Status:</b>", meta_style), Paragraph("Production Release (v1.0.0) — 127 Passing Automated Tests across 15 Suites", meta_style)],
        [Paragraph("<b>Repository:</b>", meta_style), Paragraph("https://github.com/lochan87/aurelia-motors (Pending publication)", meta_style)],
    ]
    t = Table(meta_rows, colWidths=[1.3*inch, 5.7*inch])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#f8fafc')),
        ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#e2e8f0')),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ('LEFTPADDING', (0,0), (-1,-1), 5),
        ('RIGHTPADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(t)
    story.append(Spacer(1, 10))
    
    # Iterate sections
    for sec in SECTIONS:
        story.append(Paragraph(sec["title"], h1_style))
        story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#cbd5e1"), spaceBefore=1, spaceAfter=5))
        
        blocks = parse_section_blocks(sec["content"])
        for b_type, b_content in blocks:
            if b_type == "h2":
                story.append(Paragraph(b_content, h2_style))
            elif b_type == "h3":
                story.append(Paragraph(b_content, h3_style))
            elif b_type == "code":
                lines = b_content.split("\n")
                cleaned_code = "\n".join(lines)
                code_p = Paragraph(format_for_reportlab(cleaned_code).replace("\n", "<br/>"), code_style)
                code_table = Table([[code_p]], colWidths=[7.0*inch])
                code_table.setStyle(TableStyle([
                    ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#f8fafc')),
                    ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
                    ('TOPPADDING', (0,0), (-1,-1), 4),
                    ('BOTTOMPADDING', (0,0), (-1,-1), 4),
                    ('LEFTPADDING', (0,0), (-1,-1), 6),
                    ('RIGHTPADDING', (0,0), (-1,-1), 6),
                ]))
                story.append(code_table)
                story.append(Spacer(1, 4))
            elif b_type == "formula":
                lines = b_content.split("\n")
                formula_p = Paragraph(format_for_reportlab(b_content).replace("\n", "<br/>"), formula_style)
                ftable = Table([[formula_p]], colWidths=[7.0*inch])
                ftable.setStyle(TableStyle([
                    ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#f0f7ff')),
                    ('LINEBEFORE', (0,0), (0,0), 2.5, colors.HexColor('#2563eb')),
                    ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#bfdbfe')),
                    ('TOPPADDING', (0,0), (-1,-1), 4),
                    ('BOTTOMPADDING', (0,0), (-1,-1), 4),
                    ('LEFTPADDING', (0,0), (-1,-1), 7),
                    ('RIGHTPADDING', (0,0), (-1,-1), 7),
                ]))
                story.append(ftable)
                story.append(Spacer(1, 4))
            elif b_type == "list":
                for item in b_content:
                    # Clean markdown list prefix
                    item_text = re.sub(r'^[\-\+\*]\s+', '&bull;&nbsp;&nbsp;', item)
                    item_text = re.sub(r'^(\d+\.)\s+', r'\1&nbsp;&nbsp;', item_text)
                    story.append(Paragraph(format_for_reportlab(item_text), list_style))
                story.append(Spacer(1, 2))
            elif b_type == "table":
                raw_lines = [l for l in b_content.split("\n") if l.strip() and not is_markdown_table_separator(l)]
                if len(raw_lines) >= 2:
                    rows = [[c.strip() for c in l.split("|")[1:-1]] for l in raw_lines]
                    table_data = []
                    col_count = len(rows[0])
                    
                    # Custom column width profiles
                    if col_count == 4:
                        # Check if API directory table
                        if "Endpoint" in rows[0][1] or "Method" in rows[0][0]:
                            col_widths = [0.65*inch, 2.85*inch, 0.75*inch, 2.75*inch]
                        else:
                            col_widths = [1.50*inch, 1.80*inch, 1.70*inch, 2.00*inch]
                    elif col_count == 2:
                        col_widths = [2.00*inch, 5.00*inch]
                    elif col_count == 3:
                        col_widths = [1.80*inch, 2.20*inch, 3.00*inch]
                    elif col_count == 5:
                        col_widths = [1.40*inch, 1.40*inch, 1.40*inch, 1.40*inch, 1.40*inch]
                    else:
                        col_widths = [7.0*inch / col_count] * col_count
                    
                    for r_idx, r in enumerate(rows):
                        row_cells = []
                        for c_idx, cell_str in enumerate(r):
                            if col_count == 4 and c_idx == 1 and r_idx > 0:
                                clean_val = cell_str.replace("`", "").strip()
                                escaped_val = clean_val.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
                                formatted_val = escaped_val.replace("/", "/<wbr/>").replace(":", ":<wbr/>")
                                cell_style = ParagraphStyle(
                                    f'Cell_{r_idx}_{c_idx}',
                                    fontName='Courier',
                                    fontSize=6.5,
                                    leading=8.0,
                                    textColor=colors.HexColor('#0f172a'),
                                )
                            else:
                                formatted_val = format_for_reportlab(cell_str)
                                if r_idx == 0:
                                    cell_style = ParagraphStyle(
                                        f'Header_{c_idx}',
                                        fontName='Helvetica-Bold',
                                        fontSize=7.5,
                                        leading=9.5,
                                        textColor=colors.HexColor('#ffffff'),
                                    )
                                else:
                                    cell_style = ParagraphStyle(
                                        f'Cell_{r_idx}_{c_idx}',
                                        fontName='Helvetica',
                                        fontSize=7.0,
                                        leading=8.8,
                                        textColor=colors.HexColor('#334155'),
                                    )
                            row_cells.append(Paragraph(formatted_val, cell_style))
                        table_data.append(row_cells)
                    
                    pdf_table = Table(table_data, colWidths=col_widths, repeatRows=1)
                    t_style = [
                        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#0f172a')),
                        ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
                        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#e2e8f0')),
                        ('TOPPADDING', (0,0), (-1,-1), 2.5),
                        ('BOTTOMPADDING', (0,0), (-1,-1), 2.5),
                        ('LEFTPADDING', (0,0), (-1,-1), 3.5),
                        ('RIGHTPADDING', (0,0), (-1,-1), 3.5),
                    ]
                    # Alternating row background
                    for r_i in range(1, len(rows)):
                        if r_i % 2 == 1:
                            t_style.append(('BACKGROUND', (0, r_i), (-1, r_i), colors.HexColor('#f8fafc')))
                    pdf_table.setStyle(TableStyle(t_style))
                    story.append(pdf_table)
                    story.append(Spacer(1, 5))
            else:
                story.append(Paragraph(format_for_reportlab(b_content), body_style))
                
    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"PDF successfully generated ({os.path.getsize(output_path):,} bytes).")

if __name__ == "__main__":
    write_markdown_document(MD_PATH)
    generate_docx_document(DOCX_PATH)
    generate_pdf_document(PDF_PATH)
    print("\nAll 3 documentation formats generated successfully!")

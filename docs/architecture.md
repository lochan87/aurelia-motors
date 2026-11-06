# Architecture

## 1. Purpose and status

Aurelia Motors is a car dealership platform for Lucknow. The current repository contains **Milestone 1 (Foundation)**, **Milestone 2 (Vehicle Catalogue, Inventory & Pricing)**, **Milestone 3 (Bookings & Capacity)**, and **Milestone 4 (Secure Staff Authentication, Role-Based Access Control, and Dealership Operations Dashboard)**.

The architecture is a modular monolith. That is the right amount of structure for one dealership group with a small number of showrooms and workshops: it keeps transactions, capacity rules, and authorization in one place, while preserving clear feature boundaries.

## 2. System context

```text
                    ┌────────────────────────────────────────────────────────┐
                    │ Public Customer & Authenticated Staff Browser          │
                    │ React 19 SPA, Tailwind CSS 4, TanStack Query 5         │
                    └───────────────────────────┬────────────────────────────┘
                                                │ HTTPS / JSON / Cookies
                    ┌───────────────────────────▼────────────────────────────┐
                    │ Express API                                            │
                    │ - Request Context & nosniff / helmet headers           │
                    │ - CORS & Rate Limiting                                 │
                    │ - Cookie Parser & Session Validation                   │
                    │ - CSRF Verification (HMAC-SHA256 double-submit)        │
                    │ - Role-Based Access Control (RBAC) & Location Scoping  │
                    │ - Concurrency-safe transactions (SELECT FOR UPDATE)    │
                    │ - Zod Validation & Standard Response Envelopes         │
                    └───────────────────────────┬────────────────────────────┘
                                                │
                                      Prisma 6 / PostgreSQL
                                                │
                                    ┌───────────▼───────────┐
                                    │ PostgreSQL 18.1       │
                                    │ System of Record      │
                                    └───────────────────────┘
```

## 3. Monorepo boundaries

```text
apps/web        Browser application (Public showroom & Protected Staff Operations Portal).
apps/api        HTTP application, domain rules, Prisma access, authentication & RBAC.
packages/shared Transport contracts, models, money formatting, and isomorphic types.
docs            Architecture, data, plan, assumptions, deployment.
```

Dependency rules:

- `web` and `api` may depend on `shared`.
- `shared` must not depend on either application, Express, React, Prisma, or Node-only APIs.
- `api` owns database access. The web application never imports Prisma.
- `shared` contains serialisable contracts and pure helpers, not business workflow logic.

## 4. Authentication and Access Control Architecture

### 4.1 Threat Model & Security Posture

1. **No `localStorage` for Authentication:** Authentication tokens in `localStorage` are vulnerable to script injection (XSS). Aurelia Motors uses secure, `HttpOnly`, `SameSite=Lax`, `path='/'` cookies (`aurelia_session`).
2. **Hashed Sessions in Database:** The database stores `tokenHash = SHA256(rawSessionToken)`. A database dump or SQL read vulnerability cannot be leveraged to hijack active sessions.
3. **Argon2id Password Storage:** Passwords are never stored in plaintext or MD5/SHA. Argon2id ($m=65536, t=3, p=4$) enforces memory hardness, preventing brute force via ASICs or GPUs.
4. **CSRF Defense (Double-Submit HMAC):** Mutating HTTP methods (`POST`, `PUT`, `PATCH`, `DELETE`) require header `X-CSRF-Token`. The CSRF token is an HMAC-SHA256 signature of the session token. Cross-site scripts cannot read the HttpOnly cookie or forge the HMAC signature.
5. **Rate Limiting:** `/api/auth/login` is protected by `authLoginLimiter` against brute-force attacks.
6. **Audit Trail:** Every login, failed attempt, password change, and logout event is recorded in `AuthenticationAuditEvent`.

### 4.2 Role-Based Access Control (RBAC)

The system defines 4 staff roles:

- `ADMIN`: Global clearance across all 3 showrooms (Central, Gomti Nagar, Sushant Golf City) and 2 workshops. Has exclusive access to `/api/admin/staff` and team user management.
- `SALES_CONSULTANT`: Scoped strictly to the consultant's primary assigned showroom (`LKO-CENTRAL`, `LKO-GOMTI`, `LKO-SGC`). Only test drives and inventory for that showroom are accessible.
- `SERVICE_ADVISOR`: Scoped strictly to the advisor's assigned workshop (`WS-GOMTI`, `WS-SGC`). Only service bookings and bay capacity for that workshop are accessible.
- `USED_CAR_STAFF`: Scoped to certified pre-owned vehicles and inspection audits.

### 4.3 Administrator Safeguard

The system guarantees that the last active administrator cannot be deactivated or demoted (`CANNOT_DEMOTE_LAST_ADMIN`), preventing permanent lockout from the management console.

## 5. Frontend Portal Architecture

- `/staff/login`: Staff login page with demo reviewer quick-fill buttons.
- `/staff/dashboard`: Role-aware operations overview displaying database-backed metrics, location scoping banners, and recent activity.
- `/staff/appointments`: Scoped test drive and workshop booking queue with unmasked customer contact information.
- `/staff/team`: Staff directory and user provisioning dialog (Admin only).
- Global `<AuthProvider>` and `useAuth()` hook providing user context and CSRF coordination.
- `<ProtectedRoute>` enforcing authentication and role clearance with friendly access-denied fallbacks.

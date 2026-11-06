# Architecture

## 1. Purpose and status

Aurelia Motors is a car dealership platform for Lucknow. The current repository is the **foundation
milestone**: brand shell, API conventions, shared contracts, a real PostgreSQL connection, and one
minimal persisted domain table. Business workflows are documented but not implemented.

The architecture is a modular monolith. That is the right amount of structure for one dealership
group with a small number of showrooms and workshops: it keeps transactions and capacity rules in
one place, while preserving clear feature boundaries for later extraction if scale requires it.

## 2. System context

```text
                    ┌─────────────────────────────────────┐
                    │ Public customer / staff browser     │
                    │ React SPA, mobile-first             │
                    └───────────────┬─────────────────────┘
                                    │ HTTPS / JSON
                    ┌───────────────▼─────────────────────┐
                    │ Express API                          │
                    │ validation, auth*, rate limits,      │
                    │ business rules, response envelopes   │
                    └───────┬───────────────────┬─────────┘
                            │                   │
                  Prisma / SQL          future adapters
                            │                   │
                    ┌───────▼──────┐   ┌────────▼─────────────┐
                    │ PostgreSQL   │   │ Email/SMS, storage,  │
                    │ system of    │   │ payments, AI, CRM    │
                    │ record       │   │ integrations*         │
                    └──────────────┘   └──────────────────────┘

* Not implemented in the foundation.
```

### Non-goals for this milestone

- No authentication, staff accounts, or protected routes.
- No catalogue, pricing, inventory, appointments, leads, CMS, or AI.
- No microservices, message broker, cache, or background worker.
- No vendor lock-in in the repository. Deployment is documented portably.

## 3. Monorepo boundaries

```text
apps/web        Browser application. Public UI only at this stage.
apps/api        HTTP application, domain rules, Prisma access.
packages/shared Transport contracts and isomorphic utilities.
docs            Architecture, data, plan, assumptions.
```

Dependency rules:

- `web` and `api` may depend on `shared`.
- `shared` must not depend on either application, Express, React, Prisma, or Node-only APIs.
- `api` owns database access. The web application never imports Prisma.
- `shared` contains serialisable contracts and pure helpers, not business workflow logic.

The shared package is built to `dist` before the API and web builds. It is consumed as a workspace
package, not published to npm.

## 4. Frontend architecture

### Composition

- React 19 with strict TypeScript.
- Vite for development, build, and preview.
- React Router 7 for route composition.
- TanStack Query provider installed and configured. No server queries exist yet.
- Tailwind CSS 4 with CSS-first theme tokens in `src/styles/index.css`.
- Lucide React for a small, tree-shaken icon set.
- Self-hosted Fraunces and Manrope variable fonts through Fontsource.

### Rendering and routing

Routes:

| Path       | Behaviour                         |
| ---------- | --------------------------------- |
| `/`        | Public brand and positioning page |
| `/privacy` | Pre-launch privacy notice         |
| `*`        | Accessible 404 page               |

Pages are lazy-loaded. `PageLayout` supplies the header, footer, skip link, scroll-to-hash
behaviour, and an accessible route-loading fallback. The Vite build splits vendor code into React and
data chunks to avoid a single oversized entry bundle.

### Component layers

```text
pages/                 route-level composition
components/home/       landing-page sections
components/layout/     shell, header, footer, route fallback
components/ui/         container, buttons, form controls, section header, brand mark
lib/                   query client, class-name utility
styles/                design tokens, base styles, motion
```

The UI primitives are deliberately small. Future feature modules should reuse the existing tokens
and accessibility patterns rather than introduce a second design system.

### Design system

- Palette: ink/forest dark surfaces, warm ivory, sand, and brass accents.
- Type: Fraunces display serif, Manrope interface sans.
- Square editorial cards, oversized display type, restrained motion, generous whitespace.
- Brass is decorative on dark surfaces. The darker `brass-500` token is used for text on light
  surfaces so AA contrast is preserved.
- Motion respects `prefers-reduced-motion`.
- Focus-visible outlines, a skip link, semantic landmarks, labelled navigation, and an accessible
  mobile menu are in place.

The brand is temporary. The interface avoids manufacturer logos and manufactured imagery. The hero
photo is a neutral, credited Pexels image.

### Accessibility baseline

- Lighthouse on the built preview: 100 accessibility, 100 best practices, 100 SEO.
- Header navigation is labelled; mobile menu exposes `aria-expanded` and `aria-controls`; Escape
  closes it and returns focus to the trigger.
- 404, privacy, loading, and error states have real text, not empty placeholders.
- Decorative imagery is hidden from assistive technology or has meaningful alternative text.
- Colour and typography are verified against WCAG AA contrast for their rendered sizes.

This baseline must be maintained as features are added. Automated scores are necessary but not
sufficient; future forms and data tables need keyboard and screen-reader testing.

### Environment

`VITE_API_URL` is read at build time and is public. No secret may use a `VITE_*` name. The Vite
development server proxies `/api` to the API target.

## 5. API architecture

### Request lifecycle

```text
request
  → requestContext (request ID)
  → Helmet
  → CORS allow-list
  → JSON / URL-encoded body parsing
  → /api rate limiter
  → route validation (Zod)
  → feature handler
  → response envelope
  → notFound or centralized error handler
```

The request context runs before parsers so malformed JSON still receives a request ID. The error
handler distinguishes known application errors, Zod errors, invalid JSON, and unexpected failures.
Unexpected errors are logged outside tests and returned as a generic `INTERNAL_ERROR`; stack traces
and secrets never reach the client.

### Response conventions

- Success: `{ success: true, data, meta }`
- Failure: `{ success: false, error: { code, message, details? }, meta }`
- `meta.requestId` matches the `X-Request-Id` header.
- `meta.timestamp` is an ISO-8601 UTC timestamp.
- HTTP status codes carry the transport meaning; the envelope carries the application meaning.

The health endpoint is the current exception to generic status use: it returns `503` with a
successful envelope when the service is up but degraded. That is intentional so monitoring can use
the status code while clients can still parse the check details.

### Validation

Zod schemas belong at the route boundary. `validateRequest` parses body, query, and params, mutates
only the body, and stores parsed values on `request.validated`. Express 5 `req.query` is a getter, so
future handlers must read validated query values from `request.validated.query`. Validation failures
become `422 VALIDATION_ERROR` with field-level details.

### Configuration and failure

`src/config/env.ts` loads the repository `.env` for local development and validates:

- `NODE_ENV`
- `API_HOST`
- `API_PORT`
- `CORS_ORIGINS`
- `DATABASE_URL` (must be a PostgreSQL URL)

The process fails fast on invalid configuration. Deployment platforms should inject values directly
and must not rely on a committed file.

### Runtime and shutdown

- Node.js 24, ESM, Express 5.
- Prisma Client is a module singleton, reused across hot reloads outside production.
- The HTTP server handles `SIGINT`/`SIGTERM`, stops accepting new work, disconnects Prisma, and exits.
- A 10-second force-exit guard prevents a stuck shutdown.
- API listens on `API_HOST:API_PORT`.

### Security baseline

- Helmet security headers.
- CORS reflects only configured origins; unknown origins receive no allow-origin header.
- `/api` rate limit: 300 requests per 15 minutes per client in the current configuration.
- JSON body limit: 1 MB; URL-encoded limit: 100 KB.
- `x-powered-by` disabled.
- Request IDs accepted only when they match a safe pattern, otherwise regenerated.
- No authentication is implemented yet, so there are no protected resources to protect.

Rate limiting is process-local. A multi-instance deployment needs a shared store or edge rate
limiter before it can enforce a global limit.

## 6. Data access

Prisma 6 is the only database access layer. The schema currently contains `Showroom` and one
migration. Health performs a real `SELECT 1` through Prisma, not a static flag.

Future feature modules should follow these rules:

- Keep transactions in the API layer, not in React.
- Enforce money in integer paise, never floating point.
- Use database constraints for invariants that must survive concurrency (capacity, uniqueness,
  published price immutability).
- Add migrations with the feature, never edit applied migrations.
- Avoid raw SQL unless a constraint, report, or lock requires it; document it when used.

The planned model is documented in [`database-architecture.md`](database-architecture.md).

## 7. Future feature boundaries

The modular monolith should grow into explicit feature modules rather than one expanding routes
file. A likely shape:

```text
src/modules/
  catalog/          models, variants, colours, media
  pricing/          on-road price versions and components
  inventory/        showroom stock and availability
  used-vehicles/    listings, inspections, reports
  appointments/     test drives, service slots, capacity
  leads/            capture, assignment, response tracking, CSV import
  finance/          EMI calculator and enquiries
  trade-ins/        valuation requests
  cms/              pages, sections, publishing
  ai/               summaries and suggestions, human-in-the-loop
  staff/            authentication and authorization
  audit/            append-only audit trail
```

Each module should own its routes, schemas, service functions, and tests. Cross-module effects
(lead assignment after a test drive, audit after a price publication) should be explicit service
calls inside a transaction, or later an outbox event if asynchronous work is introduced.

### Authentication boundary

Authentication is not in the foundation. Before staff features are added:

- Choose a session model. Prefer secure, HTTP-only, same-site cookies over tokens in browser
  storage.
- Add rate-limited login and a recovery path.
- Add role and permission checks at the API boundary, not only in the UI.
- Add CSRF protection for cookie-authenticated state-changing requests.
- Add audit records for privileged actions.
- Never expose staff routes solely through client-side route guards.

### AI boundary

AI summaries and suggestions must be treatable as untrusted drafts:

- Never send full customer PII to a provider when a redacted version suffices.
- Store the model, prompt version, input reference, output, and reviewer decision.
- Mark output as generated and require human approval before it affects a customer.
- Provide a deterministic fallback when the provider is unavailable.
- Do not use AI for final pricing, credit decisions, or safety-critical inspection outcomes.

## 8. Testing strategy

Current:

- Shared formatting unit tests.
- API integration tests with Supertest for health, errors, CORS, request IDs, malformed JSON, and
  validation.
- Strict typecheck and lint as static gates.
- Live database health smoke test performed against PostgreSQL 18.1.

Next:

- Database integration tests against an ephemeral PostgreSQL database, not mocks, for capacity and
  price invariants.
- Component tests for forms and dialogs.
- End-to-end tests for customer enquiry, test-drive booking, service capacity, and staff response.
- Accessibility checks in CI.
- Contract tests for shared schemas as the API grows.

Tests must not depend on production data. Development seeds, if added, must be clearly labelled and
must never be run automatically in production.

## 9. Observability

Current: request IDs, console logging for server lifecycle and unexpected errors, and a
database-aware health endpoint.

Planned: structured JSON logs with request ID, route, status, latency, and a redacted actor ID;
metrics for latency/error rate/booking conflicts; alerting on health degradation; and error
reporting with PII scrubbing. Do not add client analytics or cookies until the privacy notice and
consent approach are ready.

## 10. Decisions and trade-offs

| Decision                      | Reason                                                                                       |
| ----------------------------- | -------------------------------------------------------------------------------------------- |
| npm workspaces monorepo       | One install, shared contracts, simple evaluation setup                                       |
| Express 5                     | Mature HTTP ergonomics, small surface, easy to test                                          |
| Prisma 6                      | Typed data access, migrations, clear schema for review                                       |
| Modular monolith              | Correct transaction boundaries for capacity/pricing; avoids premature distributed complexity |
| PostgreSQL                    | Relational invariants, transactions, future reporting                                        |
| Integer paise                 | Avoid floating-point money errors; Indian pricing needs exact components                     |
| Shared package                | Prevent API/web contract drift                                                               |
| Temporary brand               | No false manufacturer or legal claims                                                        |
| Lazy routes and vendor chunks | Keep initial payload reasonable and cache vendor code                                        |
| No auth yet                   | Avoid fabricated security; document the boundary before building it                          |

## 11. Known limitations

- No authentication or authorization.
- No CI configuration, container image, or infrastructure-as-code.
- No structured logs, metrics, tracing, or error reporting.
- No production domain, email/SMS, object storage, or payment integration.
- Rate limiting is in-process.
- No database backup automation in the repository.
- Only one domain table exists; all other planned tables are design only.
- The privacy notice is a pre-launch draft and needs legal review against the DPDP Act 2023.

These limitations are expected at the foundation milestone and are tracked in the implementation
plan.

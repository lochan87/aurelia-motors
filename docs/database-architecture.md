# Database architecture

## 1. Current state

The database includes the foundation, Milestone 2 catalogue models, Milestone 3 booking models, and Milestone 4 staff authentication and RBAC models with 5 applied Prisma migrations:

| Migration                                            | Purpose                                                                             |
| ---------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `20261106050109_init`                                | Foundation: `showrooms` table and migration tracking                                |
| `20261106053641_vehicle_catalogue_inventory_pricing` | Catalogue, variant specifications, colours, inventory, price books, and used cars   |
| `20261106054000_price_and_range_constraints`         | Check constraints for non-negative money in paise, positive years, and rating enums |
| `20261106081807_test_drive_and_service_bookings`     | Customers, consents, demo vehicles, workshops, service types, and appointments      |
| `20261106095647_staff_authentication_and_rbac`       | Staff accounts, Argon2id hashes, sessions, RBAC roles, location assignments, audit  |
| `20261106115505_lead_crm_and_enquiries`              | Leads, CRM activities, internal notes, status history, portal CSV import batches    |

### Active Domain Tables

- `showrooms`: Physical locations (Central Lucknow, Gomti Nagar, Sushant Golf City).
- `vehicle_models`: Fictional manufacturer models (Aria, Kestrel, Lumen, Meridian, Solace).
- `vehicle_variants`: Powertrains and trim variants with fuel types and transmissions.
- `vehicle_colours`: Exterior paint choices with hex codes and finish types.
- `vehicle_images`: Primary and secondary SVG illustrations with alt text and dimensions.
- `vehicle_specifications`: Grouped key-value attributes (Engine, Performance, Dimensions, Safety, Comfort, Technology).
- `new_vehicle_inventory`: Concrete inventory units tied to showrooms with stock statuses (`AVAILABLE`, `RESERVED`, `SOLD`, `IN_TRANSIT`).
- `price_books`: Versioned price books with publication status and date boundaries.
- `price_entries`: Variant price associations with ex-showroom paise.
- `price_components`: Itemized line components with calculation rules (fixed paise vs basis points).
- `used_vehicles`: Certified pre-owned vehicle records with masked registration numbers.
- `used_vehicle_inspections`: Versioned inspection audit files with overall scores.
- `used_inspection_items`: Line-by-line inspection audit items with rating (`PASS`, `ATTENTION`, `FAIL`) and notes.
- `customers`: Customer contact records (`fullName`, `phone`, `email`).
- `customer_consents`: DPDP Act 2023 consent audits (`purpose`, `noticeVersion`, `granted`, `ipHash`).
- `demo_vehicles`: Registered test-drive demo fleet stationed across showrooms.
- `test_drive_appointments`: Confirmed customer drive bookings with demo vehicle locks, 45m windows, references, and tokens.
- `workshops`: Authorized service centers (Gomti Nagar & Sushant Golf City) with hourly slot capacities.
- `workshop_operating_hours`: Weekly schedule rules (08:30–18:30 Mon–Sat; Sunday closed).
- `service_types`: Standard packages (Periodic Maintenance, Express Care, etc.) with estimated prices and durations.
- `service_appointments`: Capacity-enforced service bookings with vehicle plates, references, and tokens.
- `staff_users`: Dealership staff accounts (`email`, `passwordHash`, `fullName`, `phone`, `role`, `isActive`).
- `staff_sessions`: Active and revoked sessions (`tokenHash`, `staffUserId`, `expiresAt`, `lastActiveAt`, `ipHash`, `userAgent`).
- `staff_location_assignments`: Multi-location and primary showroom / workshop mappings for staff.
- `authentication_audit_events`: Security audit trail (`eventType`, `email`, `staffUserId`, `ipHash`, `userAgent`, `metadata`).
- `leads`: Inbound customer leads (`leadReference`, `type`, `source`, `status`, `showroomId`, `assignedStaffId`, `firstResponseAt`, `lastContactedAt`).
- `lead_activities`: Recorded customer touchpoints (`activityType`, `summary`, `details`, `staffUserId`).
- `lead_notes`: Private internal consultation notes (`content`, `staffUserId`).
- `lead_status_history`: Complete audit trail of lead status progressions (`fromStatus`, `toStatus`, `reason`, `changedByStaffId`).
- `lead_import_batches`: Batch records for third-party portal CSV uploads (`batchReference`, `filename`, `source`, `totalRows`, `importedRows`, `duplicateRows`).

## 2. Staff Authentication & RBAC Schema Details

```prisma
enum StaffRole {
  ADMIN
  SALES_CONSULTANT
  USED_CAR_STAFF
  SERVICE_ADVISOR
}

model StaffUser {
  id           String    @id @default(cuid())
  email        String    @unique
  passwordHash String
  fullName     String
  phone        String?
  role         StaffRole
  isActive     Boolean   @default(true)
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt

  sessions            StaffSession[]
  locationAssignments StaffLocationAssignment[]
  auditEvents         AuthenticationAuditEvent[]

  @@index([email, isActive])
  @@index([role, isActive])
  @@map("staff_users")
}

model StaffSession {
  id           String    @id @default(cuid())
  tokenHash    String    @unique
  staffUserId  String
  expiresAt    DateTime
  createdAt    DateTime  @default(now())
  lastActiveAt DateTime  @default(now())
  revokedAt    DateTime?
  ipHash       String?
  userAgent    String?

  staffUser StaffUser @relation(fields: [staffUserId], references: [id], onDelete: Cascade)

  @@index([staffUserId, revokedAt])
  @@index([expiresAt])
  @@map("staff_sessions")
}

model StaffLocationAssignment {
  id          String   @id @default(cuid())
  staffUserId String
  showroomId  String?
  workshopId  String?
  isPrimary   Boolean  @default(true)
  createdAt   DateTime @default(now())

  staffUser StaffUser  @relation(fields: [staffUserId], references: [id], onDelete: Cascade)
  showroom  Showroom?  @relation(fields: [showroomId], references: [id], onDelete: Cascade)
  workshop  Workshop?  @relation(fields: [workshopId], references: [id], onDelete: Cascade)

  @@unique([staffUserId, showroomId])
  @@unique([staffUserId, workshopId])
  @@index([staffUserId])
  @@index([showroomId])
  @@index([workshopId])
  @@map("staff_location_assignments")
}

model AuthenticationAuditEvent {
  id          String   @id @default(cuid())
  staffUserId String?
  email       String
  eventType   String
  ipHash      String?
  userAgent   String?
  metadata    Json?
  createdAt   DateTime @default(now())

  staffUser StaffUser? @relation(fields: [staffUserId], references: [id], onDelete: SetNull)

  @@index([staffUserId, createdAt])
  @@index([email, createdAt])
  @@index([eventType, createdAt])
  @@map("authentication_audit_events")
}
```

## 3. Database conventions

These conventions apply to every table across all milestones:

- **Primary keys:** `cuid()` strings by default.
- **Timestamps:** `createdAt` and `updatedAt` in UTC. Business-day calculations use `Asia/Kolkata`.
- **Money:** Integer paise (`BigInt` for aggregates where needed), never floating point.
- **Currency:** INR.
- **Security:**
  - Password hashes use Argon2id with memory cost 65,536 KiB (64 MB), time cost 3, and 4 lanes.
  - Raw session tokens are never stored in the database; only SHA-256 digests are stored in `StaffSession.tokenHash`.
  - Double-submit CSRF HMAC-SHA256 tokens are verified in memory without database roundtrips.
- **Indexes:** Explicit composite indexes covering all lookup paths, foreign keys, and filter permutations.
- **Cascades:** Restrictive foreign keys on business-critical records; cascade on disposable child associations (e.g. sessions on user deletion).
- **Transactions:** Slot allocation, booking reservation, and staff creation run in transactions with concurrency protections.

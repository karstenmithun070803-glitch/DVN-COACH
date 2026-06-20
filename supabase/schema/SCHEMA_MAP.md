# DVN Coach Builders — Supabase Schema Map

**Verified:** 2026-06-20 (queried live Supabase REST API)
**Project URL:** `https://urinaoakbbzoqmsotafp.supabase.co`
**Tables:** 2 (`jobs`, `admin_settings`)

---

## Table: `jobs`

**Purpose:** One row per bus body-building job. Tracks the job from initial customer enquiry through all 5 production stages to delivery.

**Note on column naming:** This table uses camelCase column names (e.g. `customerName`, not `customer_name`). This pre-dates the project naming standard. Do not rename columns without a coordinated migration + application code update.

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| `id` | text | NO | — | Primary key. Format: `job-{timestamp}` (e.g. `job-1779437657203`) |
| `customerName` | text | NO | `''` | Full customer or institution name |
| `jobNo` | text | NO | `''` | Job number entered manually by user in New Job form |
| `chassisNo` | text | NO | `''` | Vehicle chassis number |
| `engineNo` | text | NO | `''` | Vehicle engine number |
| `mobileNo` | text | YES | NULL | Customer contact number |
| `address` | text | YES | NULL | Customer address |
| `model` | text | NO | `''` | Bus model: `Moffusil` / `Town` / `College` / `Staff` / `Kerala Series` |
| `stage` | text | NO | `'Chassis Arrival'` | Current production stage (see check constraint) |
| `startDate` | text | NO | `''` | ISO date string YYYY-MM-DD |
| `selections` | jsonb | YES | NULL | Map of spec field name → selected option values array |
| `fieldNotes` | jsonb | YES | NULL | Map of spec field name → free-text note |
| `seatingCapacity` | jsonb | YES | NULL | Map of seating row id → computed passenger count |
| `totalEstimate` | numeric(14,2) | YES | NULL | Total price estimate in INR |
| `status` | text | NO | `'active'` | Lifecycle: `active` / `archived` / `delivered` |
| `deliveredDate` | text | YES | NULL | ISO date string set when status → `delivered` |
| `createdAt` | timestamptz | NO | `now()` | Row creation timestamp |
| `createdBy` | text | YES | NULL | Username of creator (populated by app when known) |
| `updated_at` | timestamptz | YES | NULL | Auto-updated by trigger on every UPDATE |

**Constraints:**
- `jobs_model_check`: model IN ('Moffusil', 'Town', 'College', 'Staff', 'Kerala Series', '')
- `jobs_stage_check`: stage IN the 5 production stage values
- `jobs_status_check`: status IN ('active', 'archived', 'delivered')

**Indexes:**
- PRIMARY KEY on `id`
- `jobs_status_idx` on `status`
- `jobs_model_idx` on `model`
- `jobs_stage_idx` on `stage`

**RLS:** Enabled. Policies: SELECT/INSERT/UPDATE/DELETE all permissive for anon role (see `supabase/policies/jobs_policies.sql` for detail and hardening roadmap).

**Relationships:** No foreign keys. Standalone table.

**Known gaps:**
- No `updated_by` column — added `createdBy` but updates are anonymous
- `id` is a JS timestamp string, not a UUID — prevents using Supabase's `gen_random_uuid()` default
- camelCase columns violate the project naming standard but cannot be renamed without a full migration

---

## Table: `admin_settings`

**Purpose:** Stores the complete admin configuration for all 5 bus models as a single JSONB blob. This is a **singleton table** — it always has exactly one row with `id = 'singleton'`.

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| `id` | text | NO | — | Primary key. Always `'singleton'` |
| `profiles` | jsonb | NO | `'{}'` | Full map of BaseModels → BusModelProfile (see `src/types/adminTypes.ts`) |
| `updated_at` | timestamptz | YES | NULL | Auto-updated by trigger on every UPDATE |

**RLS:** Enabled. SELECT/INSERT/UPDATE permissive for anon. DELETE blocked entirely (deleting the singleton would break the application).

**Known gaps:**
- No `created_at` column
- No per-model granularity — the entire profiles blob is loaded and saved as one unit; concurrent edits from two devices could cause data loss (last-write-wins)
- Role-based write restriction not enforced at DB level — STAFF users are blocked from writing by the UI only

---

## Entity Relationship Summary

```
jobs  (standalone — no FK relationships)
admin_settings  (standalone singleton — no FK relationships)
```

The two tables are independent. `jobs` stores customer orders. `admin_settings` stores the spec/price configuration used when creating those orders. They are linked only conceptually: the `model` field in `jobs` corresponds to a key in `admin_settings.profiles`.

---

## localStorage Keys (parallel persistence layer)

The application uses Supabase as a cross-device sync layer and `localStorage` as the primary offline store. These keys are not in Supabase:

| Key | Content |
|---|---|
| `dvn-live-floor-jobs` | Full jobs array (mirrors Supabase `jobs` table) |
| `dvn-admin-profiles-v1` | Full admin profiles (mirrors Supabase `admin_settings.profiles`) |
| `dvn-auth-session` | HMAC session token + expiry + role |
| `dvn-new-job-draft` | Draft state for the New Job configurator |
| `dvn-admin-extras-draft-{model}` | Unsaved edits in ExtrasPriceTable per model |
| `dvn-admin-structure-draft-{model}` | Unsaved edits in StructurePriceManager per model |

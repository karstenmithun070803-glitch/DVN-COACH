# DVN Coach Builders CRM — Developer Handoff

**Audit date:** 2026-06-20
**Audited by:** Senior architect audit (Claude Sonnet 4.6)
**Supabase verified:** Yes — schema queried live on 2026-06-20

---

## 1. Product Overview

DVN Coach Builders CRM is an offline-first PWA built for Durga Industries, a bus body-building workshop in Karur, Tamil Nadu. Workshop staff use it to configure complete bus body specifications for customer orders, track each job through five production stages on a Kanban board, archive completed jobs, and print formal spec sheets. A separate admin surface lets management configure base prices, specification options, and seating layouts per bus model. The app runs fully in the browser with no server-side rendering of business logic — Supabase provides cross-device sync and `localStorage` provides offline fallback.

---

## 2. User Roles and Access Model

| Role | Login | Capabilities |
|---|---|---|
| `SUPER_ADMIN` | `AUTH_USERNAME` / `AUTH_PASSWORD` env vars | Full access: create/edit/delete jobs, configure admin settings, all spec/price editing |
| `STAFF` | Entry in `STAFF_CREDENTIALS` env var | View and move Kanban cards; Admin Master page is read-only; cannot delete jobs |

**How it works:**
1. User submits credentials to `POST /api/login`
2. Server verifies against env vars, returns an HMAC-signed token + role
3. Token is stored in `localStorage` under key `dvn-auth-session`
4. `AuthContext` reads the token on mount and sets `isLoggedIn`, `role`, `displayName`
5. `AuthGate` component wraps the app — blocks render and shows login page if not logged in
6. Role-based UI: components read `useAuth().role` to conditionally show/hide admin controls

**Known limitation:** The Supabase client uses the anon key directly from the browser. The custom auth session (HMAC token) is not known to Supabase. This means Supabase cannot enforce role-based access at the database level — all role restrictions are enforced client-side only.

---

## 3. Tech Stack

| Technology | Version | Role |
|---|---|---|
| Next.js | 16.2.2 | App Router framework, API routes |
| React | 19.2.4 | UI rendering |
| TypeScript | 5 | Strict type safety |
| Tailwind CSS | 4 | Styling (PostCSS, `@theme` directive, no config file) |
| Supabase JS | 2.103.0 | Database sync |
| Serwist | 9.5.7 | PWA service worker (disabled in dev) |
| @dnd-kit/core + sortable | 6.3.1 | Kanban drag-and-drop |
| lucide-react | 1.7.0 | Icon set |
| bcryptjs | latest | Staff password hashing |
| clsx + tailwind-merge | latest | Conditional class utility (`cn()`) |

---

## 4. How to Run Locally

```bash
# Prerequisites: Node 18+, npm 9+

git clone <repo-url>
cd "DVN COACH KARUR"
npm install
cp .env.example .env.local
# Fill in .env.local — see section 5
npm run dev
# → http://localhost:3000 (redirects to /vault)
```

To build for production:
```bash
npm run build
npm start
```

---

## 5. Environment Variables

All variables are required for full functionality. The app runs without Supabase (offline-only mode) but sync will be disabled.

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes (for sync) | Supabase project URL — Dashboard → Settings → API |
| `NEXT_PUBLIC_SUPABASE_KEY` | Yes (for sync) | Supabase anon key — Dashboard → Settings → API |
| `AUTH_USERNAME` | Yes | SUPER_ADMIN login username |
| `AUTH_PASSWORD` | Yes | SUPER_ADMIN login password |
| `STAFF_CREDENTIALS` | Yes | JSON array: `[{"u":"username","p":"$2b$10$bcrypt_hash"}]` |
| `SESSION_SECRET` | Yes | 64-char hex string for HMAC token signing |

See `.env.example` for exact format and generation commands.

---

## 6. Folder Structure

```
src/app/              Pages + API routes (Next.js App Router)
  page.tsx            → Redirects to /vault
  vault/page.tsx      → Job archive + quick-view modal (559 lines)
  new-job/page.tsx    → Bus configurator + estimate (1090 lines)
  admin-master/page.tsx → Admin settings panel
  api/login/route.ts  → Auth endpoint (POST only)
  sw.ts               → Serwist service worker entry point
  globals.css         → Tailwind v4 import + CSS variables + print styles

src/components/
  admin/              Admin UI components (price editors, spec manager, seating)
  auth/AuthGate.tsx   → Login wall — wraps entire app
  layout/Navigation.tsx → Top navigation bar
  live-floor/         → Kanban board (Board, Card, Column)
  ui/                 → Shared primitives (Button, Card, Input, Label)

src/context/
  AuthContext.tsx     → Session management, login/logout
  JobsContext.tsx     → Job CRUD, Supabase sync, localStorage fallback
  AdminSettingsContext.tsx → Admin profile CRUD, 9-version migration system

src/data/
  specs.ts            → SPEC_CONFIGURATOR, BUS_MODELS_BASE, STANDARD_VARIATIONS
  mockKanbanData.ts   → JobCard type, ProductionStage type, STAGES, MOCK_JOBS
  translation.ts      → English ↔ Tamil map, t() helper

src/lib/supabase.ts   → Supabase client singleton + isSupabaseConfigured flag
src/types/            → Canonical TypeScript interfaces (added in this audit)
src/utils/cn.ts       → clsx + tailwind-merge utility

supabase/
  migrations/         → SQL migration files (run in Supabase SQL Editor)
  policies/           → RLS policy SQL
  schema/SCHEMA_MAP.md → Full schema documentation
  seed/seed.sql       → Sample data for local dev

scripts/
  hash-staff-passwords.ts → One-time utility: hash plaintext staff passwords

public/
  manifest.json       → PWA manifest
  icons/              → PWA icons (192px, 512px)
  images/             → Bus model images + DVN logo

_archive/             → Retired files (not imported by any active code)
UI/                   → UX inspiration screenshots used during initial build
Spec Sheet.pdf        → Original bus spec sheet used as design reference
```

---

## 7. Database Schema Map

See `supabase/schema/SCHEMA_MAP.md` for the full schema with all columns, constraints, and indexes. Summary:

### `jobs` table
**Purpose:** One row per bus body-building job.
**Key columns:** `id` (text, format `job-{timestamp}`), `customerName`, `jobNo` (manual), `chassisNo`, `engineNo`, `model`, `stage`, `status`, `selections` (jsonb), `totalEstimate`, `createdAt`
**Relationships:** None (standalone)
**RLS:** Enabled. All operations permissive for anon key (see Known Technical Debt).
**Gaps:** camelCase column names (pre-standard); no `updated_by`; id is not a UUID

### `admin_settings` table
**Purpose:** Singleton config store — one row (`id='singleton'`) holding all 5 bus model profiles.
**Key columns:** `id` (text), `profiles` (jsonb — full `BusModelProfile` map)
**Relationships:** None
**RLS:** Enabled. SELECT/INSERT/UPDATE permissive; DELETE blocked.
**Gaps:** No `created_at`; entire blob saved at once (no per-model granularity)

---

## 8. Entity Relationship Summary

**JobCard ↔ BusModelProfile (conceptual, not FK):**
A `JobCard.model` value (e.g. `"College"`) corresponds to a key in `admin_settings.profiles`. When a job is created, the configurator reads the matching `BusModelProfile` to populate spec options and calculate the estimate. After the job is saved, it is independent — changing admin settings does not retroactively change saved jobs.

**Session ↔ Role ↔ UI:**
The `AuthContext` session contains a `role` field. Components read `useAuth().role` to decide what to render. There is no database-level enforcement of role.

---

## 9. Core Data Flow

**Creating a new job:**
1. User opens `/new-job` → `new-job/page.tsx` renders the configurator
2. User selects a bus model → page reads `useAdminSettings().profiles[model]` for spec groups and pricing
3. User selects options across 11 spec groups → `selections` state builds up
4. Price is calculated in real-time from `basePrice` + `optionPricing` deltas + extras
5. User clicks Save → `useJobs().addJob(jobCard)` is called
6. `JobsContext.addJob()` saves to `localStorage` immediately, then calls `supabase.from("jobs").insert()`
7. Job appears in the Vault and on the Kanban board via `useJobs()` context

**Moving a job through production stages:**
1. User opens `/vault` or the Kanban board (accessible from Navigation)
2. Drag card to a new column → `useJobs().moveJob(id, newStage)` is called
3. Updates `localStorage` and Supabase `jobs` table

---

## 10. What Changed in This Audit

| Change | Type | Detail |
|---|---|---|
| `bcryptjs` installed | Dependency | Enables bcrypt hashing for staff passwords |
| `src/app/api/login/route.ts` | Security fix | Removed `?? "fallback"` SESSION_SECRET — now throws if unset. Added bcrypt password comparison with plaintext fallback for migration |
| `src/types/jobTypes.ts` | New file | Canonical TypeScript types for JobCard, JobStatus, ProductionStage — reflects actual live Supabase columns |
| `src/types/adminTypes.ts` | New file | Canonical types for BusModelProfile, BaseModels, SpecCategoryGroup, SeatingRowConfig |
| `src/types/authTypes.ts` | New file | Canonical types for Session, Role, StaffCredential, AuthContextType |
| `supabase/migrations/20260620_001_initial_schema.sql` | New file | Verified schema SQL for `jobs` and `admin_settings` tables |
| `supabase/migrations/20260620_002_updated_at_trigger.sql` | New file | `updated_at` trigger for both tables |
| `supabase/policies/jobs_policies.sql` | New file | RLS policies for `jobs` |
| `supabase/policies/admin_settings_policies.sql` | New file | RLS policies for `admin_settings` (DELETE blocked) |
| `supabase/seed/seed.sql` | New file | 6 sample jobs across all production stages |
| `supabase/schema/SCHEMA_MAP.md` | New file | Full verified schema documentation |
| `scripts/hash-staff-passwords.ts` | New file | One-time utility to hash plaintext staff passwords |
| `.env.example` | New file | Complete environment variable template |
| `README.md` | Replaced | 2-line stub → full developer guide |
| `CLAUDE.md` | Updated | Added SeatingRowsManager, StructurePriceManager; corrected `/` route description |
| `public/sw 2.js` | Archived | Stale service worker file moved to `_archive/` |
| `public/sw 3.js` | Archived | Stale service worker file moved to `_archive/` |
| `out.txt` | Archived | Unknown CLI dump file moved to `_archive/` |

---

## 11. What Was Archived

See `_archive/ARCHIVE_MANIFEST.md` for the full manifest.

| File | Reason |
|---|---|
| `public/sw 2.js` | Stale service worker copy — superseded by Serwist-generated `public/sw.js` |
| `public/sw 3.js` | Same as above |
| `out.txt` | CLI output dump at repo root — not source code |

---

## 12. What Is Missing or Not Yet Built

| Item | Severity | Notes |
|---|---|---|
| Server-side auth validation on Supabase writes | HIGH | All DB writes go through the anon key without the DVN session being verified server-side. A malicious actor with the anon key can write to `jobs` directly. Fix: route writes through Next.js API routes that verify the HMAC token first. |
| `getNextJobNumber()` implementation | LOW | Returns `""` by design — job number is entered manually by the user. The function stub should be removed or documented to avoid confusing future developers. |
| Per-model granularity in admin_settings | LOW | The entire profiles blob saves at once. Two admins editing different models simultaneously will have one overwrite the other. Fix: split into one row per model. |
| `updated_by` column on `jobs` | LOW | `createdBy` exists but edits are anonymous. |

---

## 13. Known Technical Debt and Risks

| Risk | Severity | Detail |
|---|---|---|
| camelCase columns in `jobs` table | MEDIUM | Pre-dates naming standard. Renaming requires a coordinated migration + application code update. Do not rename individual columns without updating all references in `JobsContext.tsx`, `KanbanBoard.tsx`, `vault/page.tsx`, `new-job/page.tsx`. |
| Client-side Supabase writes with anon key | MEDIUM | The anon key is public. Until writes go through authenticated API routes, anyone with the key can insert/update/delete jobs directly via the Supabase REST API. RLS policies are permissive because the app currently requires this. |
| Session token in localStorage | LOW | Vulnerable to XSS in theory. For a workshop-internal tool on trusted devices this is an accepted trade-off. If the app is ever used on public/shared devices, migrate to HTTP-only cookies. |
| Admin settings last-write-wins | LOW | Two devices editing admin settings at the same time will race. Acceptable for a single-location workshop with one admin. Would need optimistic locking or per-model rows if multiple admins edit simultaneously. |
| Staff passwords: plaintext fallback still active | LOW | The login route accepts plaintext passwords for backward compatibility during migration. Once all passwords are hashed (run `scripts/hash-staff-passwords.ts`) the plaintext branch in `route.ts` should be removed. |
| `src/data/mockKanbanData.ts` name | LOW | Contains production types (`JobCard`, `ProductionStage`) but is named "mock". Not renamed to avoid breaking imports — document it clearly for new developers. |

---

## 14. Recommended Next Steps

Priority order for a new developer picking this up:

1. **Hash staff passwords** — Run `npx tsx scripts/hash-staff-passwords.ts` and update `.env.local`. Takes 5 minutes. Eliminates plaintext credential exposure immediately.

2. **Run the migration SQL** — Open Supabase SQL Editor and run both migration files and both policy files. Establishes `updated_at` tracking and documents the schema formally.

3. **Route Supabase writes through API** — Create `/api/jobs` (POST/PATCH/DELETE) routes that verify the HMAC session token before writing to Supabase. This closes the anon-key write vulnerability. Update `JobsContext.tsx` to call these routes instead of Supabase directly.

4. **Remove `getNextJobNumber()` stub** — Either delete the function (job numbers are manual) or rename it to make its purpose clear. The current empty return is confusing.

5. **Add `updated_by` to jobs** — When a job is edited, record who edited it. The `createdBy` field is already there; `updatedBy` completes the audit trail.

6. **Remove plaintext password fallback** — After step 1 is confirmed working in production, delete the `match.p === password` branch from `src/app/api/login/route.ts`.

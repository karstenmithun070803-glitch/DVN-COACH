# DVN Coach Builders CRM

Workshop management PWA for **Durga Industries**, a bus body-building workshop in Karur, Tamil Nadu. Manages the complete job lifecycle: spec configuration → production Kanban board → job archive → spec sheet printing.

---

## Tech Stack

| Technology | Version | Purpose |
|---|---|---|
| Next.js | 16.2.2 | App Router framework |
| React | 19.2.4 | UI |
| TypeScript | 5 | Type safety (strict mode) |
| Tailwind CSS | 4 | Styling (PostCSS-based, no config file) |
| Supabase JS | 2.103.0 | Database sync + cross-device persistence |
| Serwist | 9.5.7 | PWA / service worker |
| @dnd-kit | 6.3.1 | Kanban drag-and-drop |
| lucide-react | 1.7.0 | Icons |
| bcryptjs | latest | Staff password hashing |

---

## Prerequisites

- **Node.js** 18+ (LTS recommended)
- **npm** 9+ (comes with Node)
- A **Supabase** project (free tier is sufficient)

---

## Local Setup

```bash
# 1. Clone the repository
git clone <repo-url>
cd "DVN COACH KARUR"

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase URL, anon key, and credentials
# See Environment Variables section below

# 4. Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The app redirects to `/vault` on first load.

---

## Environment Variables

Copy `.env.example` to `.env.local` and fill in:

| Variable | Where to get it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase dashboard → Settings → API |
| `NEXT_PUBLIC_SUPABASE_KEY` | Supabase dashboard → Settings → API → anon key |
| `AUTH_USERNAME` | Choose a username for the admin account |
| `AUTH_PASSWORD` | Choose a password for the admin account |
| `STAFF_CREDENTIALS` | JSON array of staff users — run `npx tsx scripts/hash-staff-passwords.ts` to hash passwords |
| `SESSION_SECRET` | Run `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"` |

---

## Database Setup

The app uses Supabase as a cross-device sync store. To set up the schema:

1. Open your Supabase project → SQL Editor
2. Run `supabase/migrations/20260620_001_initial_schema.sql`
3. Run `supabase/migrations/20260620_002_updated_at_trigger.sql`
4. Run `supabase/policies/jobs_policies.sql`
5. Run `supabase/policies/admin_settings_policies.sql`
6. (Optional) Run `supabase/seed/seed.sql` for sample data

The app also works fully offline using `localStorage` — Supabase is not required to run the app.

---

## Folder Structure

```
src/
  app/              Next.js App Router pages and API routes
  components/
    admin/          Admin settings UI (prices, specs, seating)
    auth/           Login wall (AuthGate)
    layout/         Navigation header
    live-floor/     Kanban board components
    ui/             Shared primitives (Button, Card, Input, Label)
  context/          React context providers (Auth, Jobs, AdminSettings)
  data/             Static data: spec configurator, translations, Kanban types
  lib/              Supabase client initialisation
  types/            TypeScript interfaces for all entities
  utils/            Pure utility functions (cn)

supabase/
  migrations/       SQL migration files (run in order)
  policies/         RLS policy SQL files (run after migrations)
  schema/           Schema documentation
  seed/             Sample data for local development

scripts/            Developer utilities (not application code)
public/             Static assets, PWA icons, bus model images
_archive/           Retired files — nothing here is imported by the app
UI/                 UX reference screenshots used during initial build
Spec Sheet.pdf      Original spec sheet used as design reference
```

---

## Key Conventions

- **Styling:** Tailwind CSS v4 only. No inline styles, no CSS modules. Use `cn()` from `@/utils/cn` for conditional classes.
- **Components:** PascalCase filenames. Use `"use client"` only when hooks or interactivity are needed.
- **Types:** All entity interfaces live in `src/types/`. Import from there, not from `src/data/`.
- **State:** Job state via `useJobs()`, admin config via `useAdminSettings()`, auth via `useAuth()`.
- **Database:** Supabase for sync, `localStorage` as fallback. The app works fully offline.
- **Comments:** Only for non-obvious WHY — never for WHAT the code does.

---

## Adding a New Feature

1. If it touches jobs → modify `src/context/JobsContext.tsx` and update `src/types/jobTypes.ts`
2. If it touches admin config → modify `src/context/AdminSettingsContext.tsx` and `src/types/adminTypes.ts`
3. If it's a new page → add a folder under `src/app/`
4. If it's a shared UI component → add to `src/components/ui/`
5. If it needs a new database column → create a new migration file in `supabase/migrations/`

---

## Hashing Staff Passwords

Staff passwords in `STAFF_CREDENTIALS` should be stored as bcrypt hashes. To migrate existing plaintext passwords:

```bash
npx tsx scripts/hash-staff-passwords.ts
```

Paste the output into `.env.local`. The login route accepts both bcrypt hashes and legacy plaintext during transition.

---

## Deployment

The app is deployed as a Next.js application. Any platform that supports Node.js works (Vercel recommended).

1. Set all environment variables from `.env.example` in your deployment platform
2. Build: `npm run build`
3. Deploy: platform-specific (Vercel auto-deploys on push to main)

The PWA service worker is disabled in `NODE_ENV=development` and active in production.

---

## Known Issues

- The `jobs` table uses camelCase column names (pre-standard legacy). Do not rename without a full migration.
- Job numbers (`jobNo`) are entered manually — there is no auto-increment.
- Supabase writes use the anon key directly from the client — server-side write validation is not yet implemented.
- Concurrent edits to admin settings from two devices will cause the last-save to win (no conflict resolution).

See [HANDOFF.md](HANDOFF.md) for the full technical debt list and recommended next steps.

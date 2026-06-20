@AGENTS.md

# DVN Coach Karur — CRM & Configurator

## Project Overview
This is an **offline-first PWA** (Next.js 16 + Tailwind CSS v4 + Serwist service worker) for **Durga Industries**, a bus body-builder workshop in Karur, Tamil Nadu. The app manages the full job lifecycle: configure bus specs, track jobs through a production Kanban board, archive records, and print spec sheets.

## Stack
- **Next.js 16.2.2** (App Router) — read `node_modules/next/dist/docs/` before writing Next.js code
- **React 19** — use Server Components by default; add `"use client"` only when interactivity or hooks are needed
- **Tailwind CSS v4** — PostCSS-based; no `tailwind.config.js`; use `@theme` / `@layer` in CSS
- **TypeScript** — strict mode; all new files must be typed
- **Serwist** — service worker via `src/app/sw.ts` and `@serwist/next`
- **@dnd-kit/core + @dnd-kit/sortable** — drag-and-drop for the Kanban board
- **lucide-react v1** — icon library

## Pages & Routes
| Route | File | Description |
|---|---|---|
| `/` | `src/app/page.tsx` | **Redirect** — immediately redirects to `/vault`; the home page is the Vault |
| `/new-job` | `src/app/new-job/page.tsx` | **Configurator** — spec selector with estimate, language toggle, print |
| `/vault` | `src/app/vault/page.tsx` | **The Vault** — searchable archive of all jobs; supports print, edit, clone, delete |
| `/admin-master` | `src/app/admin-master/page.tsx` | **Admin Master** — per-model base prices, spec options, standard selections, extras pricing |

## Key Files & Directories
- `src/context/JobsContext.tsx` — global job state (`JobCard[]`) persisted to `localStorage`; provides `addJob`, `updateJob`, `moveJob`, `archiveJob`, `deleteJobPermanently`, `getNextJobNumber`
- `src/context/AdminSettingsContext.tsx` — per-model `BusModelProfile` (basePrice, specGroups, standardSelections, extrasPricing) persisted to `localStorage`; includes self-healing sync logic
- `src/context/AuthContext.tsx` — session management; reads HMAC token from localStorage; provides `login`, `logout`, `role`, `displayName`
- `src/components/auth/AuthGate.tsx` — login wall; wraps entire app; shows login page if not authenticated
- `src/components/live-floor/KanbanBoard.tsx` — dnd-kit board; renders columns per `ProductionStage`
- `src/components/live-floor/KanbanCard.tsx` — individual job card
- `src/components/live-floor/KanbanColumn.tsx` — droppable column wrapper
- `src/components/admin/ModelPriceEditor.tsx` — base price input per model
- `src/components/admin/SpecMasterManager.tsx` — add/remove spec options, set standard selections
- `src/components/admin/ExtrasPriceTable.tsx` — edit extras pricing per model
- `src/components/admin/SeatingRowsManager.tsx` — configure seating row layout (location, type, multiplier) per model
- `src/components/admin/StructurePriceManager.tsx` — edit structural option price adjustments per model
- `src/components/layout/Navigation.tsx` — top nav: New Job / The Vault / Admin Master
- `src/components/ui/` — shared primitives: Button, Card, Input, Label
- `src/data/specs.ts` — static source of truth: `SPEC_CONFIGURATOR`, `BUS_MODELS_BASE`, `STANDARD_VARIATIONS`, `BaseModels` type
- `src/data/mockKanbanData.ts` — `JobCard` type, `ProductionStage` type, `STAGES` array, `MOCK_JOBS` seed data (note: "mock" prefix is legacy; the types are production-critical)
- `src/data/translation.ts` — English ↔ Tamil map via `t(key, isTamil)` helper
- `src/lib/supabase.ts` — Supabase client singleton + `isSupabaseConfigured` flag
- `src/types/jobTypes.ts` — canonical TypeScript types for `JobCard`, `JobStatus`, `ProductionStage` (source of truth — mirrors live Supabase columns)
- `src/types/adminTypes.ts` — canonical types for `BusModelProfile`, `BaseModels`, `SpecCategoryGroup`
- `src/types/authTypes.ts` — canonical types for `Session`, `Role`, `StaffCredential`
- `src/utils/cn.ts` — `cn()` utility (clsx + tailwind-merge)
- `supabase/schema/SCHEMA_MAP.md` — verified Supabase schema documentation
- `supabase/migrations/` — SQL migration files; run in Supabase SQL Editor in numbered order
- `supabase/policies/` — RLS policy SQL files; run after migrations
- `scripts/hash-staff-passwords.ts` — one-time utility to hash plaintext staff passwords

## Domain Concepts
- **Base Models**: `Moffusil | Town | College | Staff | Kerala Series` — each has a base price in `BUS_MODELS_BASE`
- **BusModelProfile** (AdminSettingsContext): per-model config stored in localStorage — `basePrice`, `specGroups`, `standardSelections`, `extrasPricing`
- **STANDARD_VARIATIONS**: preset field selections per model; `Moffusil` acts as the global base fallback, model-specific values layer on top
- **SPEC_CONFIGURATOR**: array of `SpecCategoryGroup` → each has `groupName` and `fields: Category[]`
- **Category**: `{ id, name, options[] }` — `id` is used for pricing keys (e.g. `"art-work"`), `name` is the selection key in `selections` state
- **extrasPricing**: per-model map of `fieldId → price delta`, stored in `BusModelProfile.extrasPricing`
- **ProductionStage**: `"Chassis Arrival" | "Structure & Framing" | "Paneling & Flooring" | "Painting & Interior" | "Final Inspection & Delivery"`
- **JobCard**: `{ id, customerName, jobNo, chassisNo, engineNo, mobileNo?, address?, model, stage, startDate, selections?, fieldNotes?, seatingCapacity?, totalEstimate?, status, deliveredDate?, createdAt?, createdBy? }`; `status` is `"active" | "archived" | "delivered"` — see `src/types/jobTypes.ts` for canonical definition
- **localStorage keys**: `"dvn-live-floor-jobs"` (jobs), `"dvn-admin-profiles-v1"` (admin profiles)
- **Print view**: Vault and Configurator both render a hidden `print:block` div with the full spec sheet; triggered by `window.print()`
- **Language toggle**: `isTamil` boolean; all labels pass through `t(key, isTamil)` from `translation.ts`

## Coding Conventions
- Use `cn()` from `@/utils/cn` for all conditional class merging
- Tailwind classes are the primary styling mechanism — no inline styles, no CSS modules
- Color palette: primary teal (`teal-500/600/700`), slate grays, `#333333` body text, `#F8FAFC` page bg
- Avoid adding comments unless logic is non-obvious
- Do not add error handling for impossible states
- Do not create helper abstractions for one-off operations

## Context Providers
All three contexts are client-side and wrap the app in `src/app/layout.tsx` (outermost first):
- `AuthProvider` — outermost; provides `useAuth()` — must wrap everything else
- `AdminSettingsProvider` — wraps the whole app; any page can call `useAdminSettings()`
- `JobsProvider` — wraps the whole app; any page can call `useJobs()`

## PWA / Service Worker
- Service worker is registered via Serwist; config lives in `next.config.ts`
- `src/app/sw.ts` is the SW entry point — treat carefully, changes affect offline caching

## Running the App
```bash
npm run dev      # dev server (webpack mode)
npm run build    # production build
npm run lint     # eslint
```

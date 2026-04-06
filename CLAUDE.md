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
| `/` | `src/app/page.tsx` | **Live Floor** — Kanban board of all active jobs across 5 production stages |
| `/new-job` | `src/app/new-job/page.tsx` | **Configurator** — spec selector with estimate, language toggle, print |
| `/vault` | `src/app/vault/page.tsx` | **The Vault** — searchable archive of all jobs; supports print, edit, clone, delete |
| `/admin-master` | `src/app/admin-master/page.tsx` | **Admin Master** — per-model base prices, spec options, standard selections, extras pricing |

## Key Files & Directories
- `src/context/JobsContext.tsx` — global job state (`JobCard[]`) persisted to `localStorage`; provides `addJob`, `updateJob`, `moveJob`, `archiveJob`, `deleteJobPermanently`, `getNextJobNumber`
- `src/context/AdminSettingsContext.tsx` — per-model `BusModelProfile` (basePrice, specGroups, standardSelections, extrasPricing) persisted to `localStorage`; includes self-healing sync logic
- `src/components/live-floor/KanbanBoard.tsx` — dnd-kit board; renders columns per `ProductionStage`
- `src/components/live-floor/KanbanCard.tsx` — individual job card
- `src/components/live-floor/KanbanColumn.tsx` — droppable column wrapper
- `src/components/admin/ModelPriceEditor.tsx` — base price input per model
- `src/components/admin/SpecMasterManager.tsx` — add/remove spec options, set standard selections
- `src/components/admin/ExtrasPriceTable.tsx` — edit extras pricing per model
- `src/components/layout/Navigation.tsx` — top nav: Live Floor / New Job / The Vault / Admin Master
- `src/components/ui/` — shared primitives: Button, Card, Input, Label
- `src/data/specs.ts` — static source of truth: `SPEC_CONFIGURATOR`, `BUS_MODELS_BASE`, `STANDARD_VARIATIONS`, `BaseModels` type
- `src/data/mockKanbanData.ts` — `JobCard` type, `ProductionStage` type, `STAGES` array, `MOCK_JOBS` seed data
- `src/data/translation.ts` — English ↔ Tamil map via `t(key, isTamil)` helper
- `src/utils/cn.ts` — `cn()` utility (clsx + tailwind-merge)

## Domain Concepts
- **Base Models**: `Moffusil | Town | College | Staff` — each has a base price in `BUS_MODELS_BASE`
- **BusModelProfile** (AdminSettingsContext): per-model config stored in localStorage — `basePrice`, `specGroups`, `standardSelections`, `extrasPricing`
- **STANDARD_VARIATIONS**: preset field selections per model; `Moffusil` acts as the global base fallback, model-specific values layer on top
- **SPEC_CONFIGURATOR**: array of `SpecCategoryGroup` → each has `groupName` and `fields: Category[]`
- **Category**: `{ id, name, options[] }` — `id` is used for pricing keys (e.g. `"art-work"`), `name` is the selection key in `selections` state
- **extrasPricing**: per-model map of `fieldId → price delta`, stored in `BusModelProfile.extrasPricing`
- **ProductionStage**: `"Chassis Arrival" | "Structure & Framing" | "Paneling & Flooring" | "Painting & Interior" | "Final Inspection & Delivery"`
- **JobCard**: `{ id, customerName, jobNo, chassisNo, engineNo, mobileNo?, model, stage, startDate, selections?, totalEstimate?, status }`; `status` is `"active" | "archived"`
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
Both contexts are client-side and must wrap the app in `src/app/layout.tsx`:
- `JobsProvider` — wraps the whole app; any page can call `useJobs()`
- `AdminSettingsProvider` — wraps the whole app; any page can call `useAdminSettings()`

## PWA / Service Worker
- Service worker is registered via Serwist; config lives in `next.config.ts`
- `src/app/sw.ts` is the SW entry point — treat carefully, changes affect offline caching

## Running the App
```bash
npm run dev      # dev server (webpack mode)
npm run build    # production build
npm run lint     # eslint
```

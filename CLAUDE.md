@AGENTS.md

# DVN Coach Karur — CRM & Configurator

## Project Overview
This is an **offline-first PWA** (Next.js 16 + Tailwind CSS v4 + Serwist service worker) for **Durga Industries**, a bus body-builder workshop in Karur, Tamil Nadu. The app lets staff configure bus specifications, generate printable spec sheets, and manage jobs.

## Stack
- **Next.js 16.2.2** (App Router) — read `node_modules/next/dist/docs/` before writing Next.js code
- **React 19** — use Server Components by default; add `"use client"` only when interactivity or hooks are needed
- **Tailwind CSS v4** — PostCSS-based; no `tailwind.config.js`; use `@theme` / `@layer` in CSS
- **TypeScript** — strict mode; all new files must be typed
- **Serwist** — service worker via `src/app/sw.ts` and `@serwist/next`
- **lucide-react v1** — icon library

## Key Files & Directories
- `src/app/` — App Router pages and layouts
- `src/app/new-job/page.tsx` — main bus spec configurator (client component)
- `src/app/admin/` — admin panel (placeholder)
- `src/components/layout/Navigation.tsx` — top nav bar
- `src/components/ui/` — shared UI primitives (Button, Card, Input, Label)
- `src/data/specs.ts` — all bus spec data: `SPEC_CONFIGURATOR`, `BUS_MODELS_BASE`, `STANDARD_VARIATIONS`, `BaseModels` type
- `src/data/translation.ts` — English ↔ Tamil translation map via `t(key, isTamil)` helper
- `src/utils/cn.ts` — `cn()` utility (clsx + tailwind-merge)

## Domain Concepts
- **Base Models**: `Moffusil | Town | College | Staff` — each has a base price in `BUS_MODELS_BASE`
- **STANDARD_VARIATIONS**: preset field selections per model; `Moffusil` acts as the global base fallback, model-specific values layer on top
- **SPEC_CONFIGURATOR**: array of `SpecCategoryGroup` → each has `groupName` and `fields: Category[]`
- **Category**: `{ id, name, options[] }` — `id` is used for pricing keys (e.g. `"art-work-Yes"`), `name` is used as the selection key in `selections` state
- **extrasPricing**: hardcoded map of `"${field.id}-${optionValue}"` → price delta (add-ons only)
- **Print view**: a hidden `print:block` div renders the full spec sheet; triggered by `window.print()`
- **Language toggle**: `isTamil` boolean; all labels pass through `t(key, isTamil)` from `translation.ts`

## Coding Conventions
- Use `cn()` from `@/utils/cn` for all conditional class merging
- Tailwind classes are the primary styling mechanism — no inline styles, no CSS modules
- Color palette: primary teal (`teal-500/600/700`), slate grays, `#333333` body text, `#F8FAFC` page bg
- Avoid adding comments unless logic is non-obvious
- Do not add error handling for impossible states
- Do not create helper abstractions for one-off operations

## PWA / Service Worker
- Service worker is registered via Serwist; config lives in `next.config.ts`
- `src/app/sw.ts` is the SW entry point — treat carefully, changes affect offline caching

## Running the App
```bash
npm run dev      # dev server (webpack mode)
npm run build    # production build
npm run lint     # eslint
```

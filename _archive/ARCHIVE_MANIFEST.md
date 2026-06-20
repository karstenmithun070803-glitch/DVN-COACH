# Archive Manifest

Last updated: 2026-06-20
Audited by: Senior architect audit (Claude Sonnet 4.6)

Nothing in this folder is imported by any active application code.
Before permanently deleting any file, confirm with `grep -r "filename" src/` returns no results.

| # | Original path | Archived path | Classification | Reason | Safe to permanently delete after |
|---|---|---|---|---|---|
| 1 | `public/sw 2.js` | `_archive/public/sw 2.js` | STALE | Old service worker file. Superseded by Serwist-generated `public/sw.js` at build time. Spaces in filename make it unloadable as a standard SW path. Not referenced anywhere in the codebase. | After next production deployment confirmed stable |
| 2 | `public/sw 3.js` | `_archive/public/sw 3.js` | STALE | Same as above — another stale SW copy. | After next production deployment confirmed stable |
| 3 | `out.txt` | `_archive/out.txt` | UNKNOWN | CLI output dump found at repository root. Not source code. No application imports it. Content: likely a terminal output log. | Immediately — it is not source code |

## Files NOT archived (kept in repo as reference material)

| File/Folder | Reason kept |
|---|---|
| `UI/` | UX inspiration screenshots used during the initial design and build phase. Kept as design reference for future UI changes. |
| `Spec Sheet.pdf` | Original customer spec sheet that the Configurator was built to replicate. Essential reference if the spec format ever needs to change. |

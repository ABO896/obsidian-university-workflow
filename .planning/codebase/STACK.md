# Technology Stack

**Analysis Date:** 2026-05-14

## Languages

**Primary:**
- JavaScript (CommonJS) — all `_templater_scripts/` user scripts, `tests/universityNoteUtils.test.js`
- Markdown with embedded Templater tags — all `_templates/*.md` files

**Secondary:**
- DataviewJS (inline JavaScript inside Dataview blocks) — dashboard and backlink queries embedded in templates and generated note output

## Runtime

**Environment:**
- Obsidian desktop application (Electron-based). All `tp.user.*` scripts run inside the Obsidian/Electron process.
- Node.js — used for the test suite only (`tests/universityNoteUtils.test.js`); scripts are written to be dual-compatible via `scriptLoader.js`.

**JavaScript module format:**
- CommonJS (`module.exports = ...`, `require(...)`) — enforced across all scripts so they load correctly in both Obsidian (Electron) and Node.js.

**Package Manager:**
- None. No `package.json` or lockfile is present. Dependencies are Obsidian community plugins, not npm packages.

## Frameworks

**Template Engine:**
- Obsidian Templater plugin (≥ 2.16 required for `tp.system.multi_suggester`)
  - Templates use `<%* %>` execution blocks with `tR +=` / `tR =` for output
  - All async Templater APIs are awaited: `tp.file.move`, `tp.file.create_new`, `tp.system.prompt`, `tp.system.suggester`, `tp.system.multi_suggester`
  - Dates use `tp.date.now("YYYY-MM-DD")` (Moment.js format strings); `new Date()` is never used

**Query / Dashboard Layer:**
- Obsidian Dataview plugin (required)
  - `dataview` fenced blocks for simple TABLE/TASK queries
  - `dataviewjs` fenced blocks for programmatic grouping, backlink resolution, and note-health summaries
  - Queries are scoped to `universityRoot` path (e.g., `"Universidad"`) for performance

**Testing:**
- Node.js built-in `node:test` runner — no external test framework
- Node.js built-in `node:assert/strict` — assertion library
- Test file: `tests/universityNoteUtils.test.js`
- Run command: `node --test tests/universityNoteUtils.test.js` (inferred; no npm scripts present)

## Key Dependencies

**Critical (Obsidian community plugins — installed in the user's vault, not in this repo):**
- `Templater` ≥ 2.16 — powers the entire template execution pipeline; provides `tp.*` API surface
- `Dataview` (any recent version) — renders all dashboard tables, backlink queries, and note-health blocks

**Built-in globals available to user scripts at runtime (provided by Obsidian/Electron):**
- `app` — full Obsidian `App` instance (`app.vault`, `app.metadataCache`, `app.fileManager`)
- `moment` — Moment.js instance (globally available inside Obsidian)
- `Notice` — Obsidian UI notification constructor

**Node.js built-ins used in scripts:**
- `path` — `path.join(__dirname, ...)` used by `scriptLoader.js` and scripts that bootstrap via it
- `require` — standard CommonJS module loading

## Configuration

**Single source of truth:**
- `_templater_scripts/universityConfig.js` — exports `universityConfigScript()` which returns the config object. All folder names, labels, canonical years, parcial options, schema types, statuses, review intervals, and feature flags are defined here. Templates and helpers read this at runtime; nothing is hardcoded elsewhere.

**Feature flags in config:**
- `features.parcial` (boolean, default `false`) — controls whether exam-period grouping (Parciales/Semesters folder layer) is active across all templates

**No environment variables, no `.env` files, no build step, no CI configuration.**

**Obsidian plugin settings (external to this repo):**
- Templater: "Template folder" must point to `_templates/`; "Script folder" must point to `_templater_scripts/`
- Dataview: must be enabled for dashboard blocks to render

## Platform Requirements

**Development / Usage:**
- Desktop Obsidian only (macOS, Windows, Linux)
- `tp.user.*` scripts are unavailable on Obsidian mobile — workflow is explicitly desktop-only

**Testing (pure Node.js — no Obsidian required):**
- Node.js (any version supporting `node:test` and `node:assert/strict`, i.e., ≥ 18)
- Only pure helper functions are tested; anything touching `app.*` or `tp.*` is excluded from unit tests

---

*Stack analysis: 2026-05-14*

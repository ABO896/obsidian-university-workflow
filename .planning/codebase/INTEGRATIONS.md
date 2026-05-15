# External Integrations

**Analysis Date:** 2026-05-14

## APIs & External Services

**None.** This project makes no HTTP calls, uses no external APIs, and sends no data outside the local machine. All functionality is local Obsidian vault operations.

## Data Storage

**Vault filesystem (primary store):**
- All notes are Markdown files (`.md`) written to the Obsidian vault via `app.vault.createFolder()`, `tp.file.move()`, and `tp.file.create_new()`
- Folder paths are constructed at runtime from `universityConfig.js` values (e.g., `Universidad/<Year>/<Subject>/Temas/<Tema>/`)
- Helper: `ensureFolderPath` in `_templater_scripts/universityNoteUtils.js` creates missing folders recursively

**Vault metadata cache (read-only):**
- `app.metadataCache.getFileCache(file)` — reads frontmatter and outlinks from `.md` files without opening them
- Used by `getUniversityContext.js` (infer year from frontmatter) and `universityNoteUtils.js` (`listSubjectYears`, concept backlink resolution)

**File Storage:**
- Local filesystem only, via Obsidian's vault abstraction layer (`app.vault.*`)
- No cloud sync is managed by this project (users may run iCloud, Obsidian Sync, etc. independently)

**Caching:**
- None managed by this project. Obsidian's built-in `metadataCache` is read but not written directly.

## Authentication & Identity

**None.** No authentication, sessions, or identity providers.

## Monitoring & Observability

**Error Tracking:**
- None formal. Errors are surfaced to the user via `new Notice("⛔️ ...", 10_000)` (Obsidian toast notifications with 10-second timeout)
- `console.error(...)` is used in `ensureFolderPath` for folder creation failures (visible in Obsidian developer console)

**Logs:**
- No structured logging. `Notice` calls serve as the user-facing feedback mechanism; `console.error` for developer-level diagnostics.

## CI/CD & Deployment

**Hosting:**
- Not applicable — this is a local Obsidian vault plugin configuration, not a deployed service.

**CI Pipeline:**
- None. No GitHub Actions, no CI config files are present.

**"Deployment":**
- Users copy `_templates/` and `_templater_scripts/` into their vault, then configure Templater plugin settings to point at those directories.

## Environment Configuration

**Required env vars:** None.

**Obsidian plugin configuration (external to this repo, set in Obsidian settings UI):**
- Templater → Template folder: `_templates`
- Templater → Script folder: `_templater_scripts`
- Dataview plugin must be enabled

**Secrets location:** Not applicable. No secrets, credentials, or API keys of any kind.

## Webhooks & Callbacks

**Incoming:** None.

**Outgoing:** None.

## Obsidian Plugin API Surface Used

This project integrates deeply with two Obsidian community plugins. The integration points are documented here for reference when modifying templates or scripts:

**Templater plugin (`tp.*` namespace):**
- `tp.config.target_file` — current note being templated
- `tp.config.run_mode` — `0` = "Create new note from template" (used as guard in `templateBootstrap.js`)
- `tp.date.now("YYYY-MM-DD")` — date string using Moment.js format
- `tp.date.now("YYYY-MM-DD", N)` — date N days from now (used for `next_review` in Concept Note)
- `tp.file.cursor(N)` — cursor stop insertion
- `tp.file.selection()` — pre-selected text (used in Lecture Note topic prompt)
- `tp.file.move(path)` — async; moves the current file
- `tp.file.create_new(content, filename, openNewNote, folder)` — async; used by Quick Create Concept
- `tp.system.prompt(label, default)` — async; single text input dialog
- `tp.system.suggester(displayOptions, values, throwOnCancel, placeholder)` — async; single-select dropdown
- `tp.system.multi_suggester(displayOptions, values, throwOnCancel, placeholder)` — async; multi-select (requires Templater ≥ 2.16)
- `tp.app` — Obsidian `App` instance (same as global `app`)
- `tp.user.<scriptName>()` — calls a user script loaded from the configured script folder

**Dataview plugin (query language inside fenced blocks):**
- `dataview` blocks: `TABLE`, `TASK`, `FROM`, `WHERE`, `SORT`, `GROUP BY` DQL syntax
- `dataviewjs` blocks: `dv.current()`, `dv.pages(source)`, `dv.list()`, `dv.paragraph()`, `dv.header()`, `dv.compare()`, `dv.table()`
- Frontmatter fields queried: `type`, `course`, `year`, `tema`, `created`, `date`, `status`, `next_review`, `last_reviewed`, `concepts`

**Obsidian `app` global (used directly in scripts):**
- `app.vault.getAbstractFileByPath(path)` — check if a file/folder exists
- `app.vault.createFolder(path)` — create a folder
- `app.vault.getMarkdownFiles()` — list all `.md` files in the vault
- `app.metadataCache.getFileCache(file)` — read frontmatter + links without opening a file
- `app.fileManager.processFrontMatter(file, fn)` — async; used by Update Note Status to batch-write frontmatter

---

*Integration audit: 2026-05-14*

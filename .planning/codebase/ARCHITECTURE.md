<!-- refreshed: 2026-05-14 -->
# Architecture

**Analysis Date:** 2026-05-14

## System Overview

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                         _templates/ (User Entry Points)                  │
│                                                                          │
│  Lecture Note   Concept Note   Quick Create   General Note   Subject Hub │
│  Parcial Prep   Assign Tema    Link Concepts  Mark Reviewed   Uni Dash   │
│  Update Status  (11 templates total)                                     │
└──────────────────────────────┬──────────────────────────────────────────┘
                               │  await tp.user.templateBootstrap(tp)
                               ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                templateBootstrap.js  (Bootstrap Layer)                   │
│                                                                          │
│  • Guards: target file present, new-file mode check                     │
│  • Loads universityConfig, getUniversityContext, universityNoteUtils    │
│  • Returns ctx = { currentFile, noteUtils, generalLabel, schema,        │
│                     constants, context, config, configLabels }           │
└───────────────────────────────┬────────────────────────────────────────-┘
                                │
              ┌─────────────────┼─────────────────┐
              ▼                 ▼                  ▼
┌─────────────────┐  ┌──────────────────┐  ┌──────────────────────────────┐
│universityConfig │  │getUniversityCtx  │  │  universityNoteUtils.js       │
│     .js         │  │     .js          │  │  (Core Business Logic)        │
│                 │  │                  │  │                               │
│ Single source   │  │ Infers subject / │  │ • resolvePlacement()          │
│ of truth:       │  │ year / parcial   │  │ • resolveSubjectParcialTema() │
│ folders, labels,│  │ from file path   │  │ • ensureFolderPath()          │
│ years, parciales│  │ + frontmatter    │  │ • ensureUniqueFileName()      │
│ schema, features│  │ cache            │  │ • buildConceptBacklinksBlock()│
└────────┬────────┘  └────────┬─────────┘  │ • normalizeYear()             │
         │                    │            │ • normalizeParcial()           │
         │                    │            │ • toSlug(), sanitize*()        │
         └──────▶ scriptLoader.js ◀────────┘ • listSubjects(), buildSubject│
                  (require resolution)         Options(), dedupePreserveOrder│
                                            └──────────────────────────────┘
                                                          │
                                                          ▼
                                          ┌──────────────────────────────┐
                                          │  Obsidian Vault (Output)     │
                                          │  Universidad/                │
                                          │   Year N/                    │
                                          │     Subject/                 │
                                          │       Temas/<Tema>/          │
                                          │         <Note>.md            │
                                          └──────────────────────────────┘
```

## Component Responsibilities

| Component | Responsibility | File |
|-----------|----------------|------|
| Template files | User-facing entry points; orchestrate dialogs + content generation | `_templates/*.md` |
| templateBootstrap | Guard checks + dependency injection; returns shared `ctx` object | `_templater_scripts/templateBootstrap.js` |
| universityConfig | Single source of truth for all folder names, labels, years, parciales, schema, feature flags | `_templater_scripts/universityConfig.js` |
| getUniversityContext | Infers subject, year, parcial from `tp.config.target_file` path and frontmatter cache | `_templater_scripts/getUniversityContext.js` |
| universityNoteUtils | All shared placement logic, vault queries, filesystem utilities, content builders | `_templater_scripts/universityNoteUtils.js` |
| scriptLoader | Cross-environment `require()` helper with Obsidian/Node fallback resolution | `_templater_scripts/scriptLoader.js` |

## Pattern Overview

**Overall:** Config-driven, layered helper pattern with a single bootstrap entry point

**Key Characteristics:**
- Every template starts with the same `await tp.user.templateBootstrap(tp)` call — no template loads its own dependencies
- All string values (folder names, labels, type slugs, statuses) originate from `universityConfig.js` at runtime — never hardcoded in templates
- `universityNoteUtils.js` is a factory function that reads config once and returns a closed-over object of utility functions — templates destructure only what they need
- `tp` (the Templater API object) is threaded explicitly from template → bootstrap → utils; it is never accessed as a global inside scripts
- `app` and `moment` are used directly as globals inside scripts (Obsidian provides them)
- The `features.parcial` flag in config gates entire branches of placement logic — templates check `constants.isParcialEnabled` to branch, they do not re-read config

## Layers

**Template Layer:**
- Purpose: User-facing orchestration — present dialogs, call utils, build note content, move file
- Location: `_templates/`
- Contains: Templater `<%* %>` script blocks; all logic runs inside a single block per template
- Depends on: `templateBootstrap.js` (via `tp.user.templateBootstrap`)
- Used by: Obsidian user via Templater plugin

**Bootstrap Layer:**
- Purpose: Centralize dependency loading and guard conditions so individual templates stay thin
- Location: `_templater_scripts/templateBootstrap.js`
- Contains: Guard logic (target file, new-file mode), loading of context + utils, return of `ctx`
- Depends on: `universityConfig.js`, `getUniversityContext.js`, `universityNoteUtils.js`
- Used by: Every template

**Context Inference Layer:**
- Purpose: Answer "where is this file in the university hierarchy?" without dialog prompts
- Location: `_templater_scripts/getUniversityContext.js`
- Contains: Path-parsing logic, frontmatter cache inspection, year/parcial normalization
- Depends on: `universityConfig.js`, `universityNoteUtils.js` (for normalizers)
- Used by: `templateBootstrap.js`

**Core Utils Layer:**
- Purpose: All shared business logic — placement resolution, vault queries, filesystem operations, content generation
- Location: `_templater_scripts/universityNoteUtils.js`
- Contains: Factory function returning ~25 utilities
- Depends on: `universityConfig.js`
- Used by: `templateBootstrap.js`, `getUniversityContext.js`

**Config Layer:**
- Purpose: Single source of truth; all other layers read from this
- Location: `_templater_scripts/universityConfig.js`
- Contains: Folder names, labels, years array, parciales array, feature flags, schema types and statuses, review intervals
- Depends on: Nothing
- Used by: All script layers

**Module Resolution Layer:**
- Purpose: Resolve sibling script paths in both Obsidian runtime and Node.js test environment
- Location: `_templater_scripts/scriptLoader.js`
- Contains: `requireScript(filename)` with three-candidate fallback chain
- Depends on: Nothing
- Used by: All scripts except `universityConfig.js`

## Data Flow

### New Note Creation (e.g., Lecture Note)

1. User runs template in Obsidian → `_templates/Lecture Note.md` executes
2. `await tp.user.templateBootstrap(tp, { requireNewFile: true })` — `_templater_scripts/templateBootstrap.js`
3. Bootstrap calls `tp.user.getUniversityContext(currentFile)` → infers `{ subject, year, parcial }` from file path
4. Bootstrap calls `tp.user.universityNoteUtils()` → factory returns all utility functions
5. Template calls `resolveSubjectParcialTema(tp, { ... })` → shows interactive year → subject → tema dialog chain using `tp.system.suggester`
6. `ensureFolderPath(targetFolder)` creates vault folder hierarchy via `app.vault.createFolder`
7. Template builds `tR` string (frontmatter + body content)
8. `await tp.file.move(destinationMovePath)` places file at resolved path
9. `new Notice(...)` confirms to user

### Utility Template (no tR, hook-based write)

1. Template runs bootstrap → destructures `ctx`
2. Template calls `tp.system.multi_suggester` or `tp.system.suggester` for selection
3. Template registers `tp.hooks.on_all_templates_executed(async () => { ... })` callback
4. Templater finishes its own write pass (tR is empty — body untouched)
5. Hook fires: `tp.app.fileManager.processFrontMatter(file, (fm) => { ... })` safely mutates frontmatter

Templates using hook pattern: `Assign Tema to Current Note.md`, `Link Concepts to Note.md`, `Quick Create Concept.md` (concepts array update), `Mark Reviewed.md`, `Update Note Status.md`

### Context Inference

1. `getUniversityContext(targetFile)` receives a TFile
2. Splits `targetFile.parent.path` on `/` to get path segments
3. Finds `universityRoot` segment index, takes relative parts after it
4. Checks `app.metadataCache.getFileCache(targetFile)?.frontmatter?.year` — frontmatter year wins
5. Falls back to path-based year detection via `normalizeYear(part, { allowLiteral: false })`
6. Subject = first non-year segment after university root
7. Parcial = only inferred when `features.parcial === true`

**State Management:**
- No persistent module state beyond lazy-initialized singletons in `getUniversityContext.js`
- All config is read once per script instantiation via `universityConfig.js`
- Vault state is queried live via `app.vault` and `app.metadataCache`

## Key Abstractions

**`ctx` object (from templateBootstrap):**
- Purpose: Unified dependency bag injected into every template; eliminates per-template loading boilerplate
- Shape: `{ currentFile, noteUtils, generalLabel, schema, constants, context, config, configLabels }`
- Examples: Used in all 11 templates immediately after the bootstrap call

**`noteUtils` object (from universityNoteUtils factory):**
- Purpose: Closed-over utility suite; carries config constants without re-reading config
- Key methods: `resolveSubjectParcialTema`, `resolvePlacement`, `ensureFolderPath`, `ensureUniqueFileName`, `buildConceptBacklinksBlock`, `toSlug`, `normalizeYear`, `normalizeParcial`
- Pattern: Factory function `universityNoteUtils()` returns a plain object — templates destructure what they need

**`constants` object (from noteUtils):**
- Purpose: Pre-computed, label-normalized config values ready for use in templates without reading raw config
- Key fields: `general`, `final`, `subject`, `year`, `tema`, `parcial`, `universityRoot`, `codeLanguage`, `isParcialEnabled`

**Placement result object:**
- Purpose: Resolved vault path information after all user dialogs complete
- Shape: `{ baseUniversityPath, yearRootPath, subject, subjectFolderName, subjectRootPath, year, parcial, parcialFolderName, targetFolder }`
- Extended by `resolveSubjectParcialTema` with: `tema, temaFolderName, temaContainerPath, temaOptions`

## Entry Points

**`_templates/Lecture Note.md`:**
- Triggers: User applies template to new note
- Responsibilities: Year → subject → tema selection, style picker (quick/theory/stem), concept multi-select, frontmatter + body generation, file placement

**`_templates/Concept Note Template.md`:**
- Triggers: User applies template to existing (named) note
- Responsibilities: Year → subject → tema selection, style picker (concept/technique), frontmatter + Dataview backlinks block, file placement

**`_templates/Quick Create Concept.md`:**
- Triggers: User applies template from within an existing lecture/general note
- Responsibilities: Name prompt, style picker, placement (inherits course from current note), creates new file via `tp.file.create_new`, wires `[[link]]` into current note's `concepts` frontmatter via hook

**`_templates/Subject Hub.md`:**
- Triggers: User applies template to new note
- Responsibilities: Year → subject selection, generates subject-scoped Dataview dashboard with review queue, note health, lectures, concepts, tasks

**`_templates/University Dashboard.md`:**
- Triggers: User applies template to new note
- Responsibilities: Vault-wide dashboard at university root; review queue, status by course, open tasks, orphaned concepts

**`_templates/Parcial Prep Note.md`:**
- Triggers: User applies template to new note
- Responsibilities: Placement (parcial-aware or generic based on `features.parcial`), recall dump prompt before note creation, study guide + Dataview tables

**Utility templates (modify existing notes, no tR):**
- `Assign Tema to Current Note.md` — updates `course`, `year`, `tema` frontmatter + moves file
- `Link Concepts to Note.md` — multi-select wires concept links into `concepts` frontmatter array
- `Quick Create Concept.md` — see above (also a utility when run from within a note)
- `Mark Reviewed.md` — updates `last_reviewed` and `next_review` frontmatter on concept notes
- `Update Note Status.md` — batch-updates `status` across multiple notes

## Architectural Constraints

- **Threading:** Obsidian runs on a single-threaded JS engine. `app.vault.createFolder` and `tp.file.move` are sequential async calls — always `await` them in order
- **Global state:** `getUniversityContext.js` uses module-level lazy-init vars (`_initialized`, `_GENERAL_LABEL`, etc.) — these persist for the Obsidian session lifetime; config changes require vault reload
- **Hook timing:** Frontmatter mutations that must survive Templater's own write pass MUST be deferred to `tp.hooks.on_all_templates_executed()`. Direct `processFrontMatter` calls earlier in a template run risk being overwritten
- **`tp` is not global in scripts:** Scripts cannot access `tp` without receiving it as an argument. `app` and `moment` are available as globals
- **`tR` contract:** Templates that intentionally do not modify the note body must NOT assign to `tR`. Utility templates (Assign Tema, Link Concepts, Mark Reviewed, Update Status) follow this convention

## Anti-Patterns

### Hardcoding config strings in templates

**What happens:** A template contains a literal string like `"Universidad"` or `"Parcial 1"` instead of reading from `constants` or `config`
**Why it's wrong:** The config may be changed to rename folders; the hardcoded string diverges silently and places files in the wrong location
**Do this instead:** Read from `constants.universityRoot`, `schema.types.lecture`, etc., supplied by `templateBootstrap` via `ctx`

### Calling processFrontMatter directly (not in hook) when tR is also set

**What happens:** A template sets `tR` and also calls `app.fileManager.processFrontMatter()` synchronously before the `tR` write
**Why it's wrong:** Templater's write of `tR` can overwrite the frontmatter change, producing a race condition
**Do this instead:** Defer all frontmatter writes to `tp.hooks.on_all_templates_executed()` — see `Assign Tema to Current Note.md` and `Mark Reviewed.md`

### Accessing `tp` as a global in user scripts

**What happens:** A script file does `tp.date.now(...)` without receiving `tp` as a parameter
**Why it's wrong:** `tp` is not a global in CommonJS user scripts; it is only in scope inside `<%* %>` template blocks
**Do this instead:** Accept `tp` as the first argument and call `tp.user.myScript(tp, ...)` from the template

## Error Handling

**Strategy:** Fail fast with `new Notice(...)` and `return` — no silent failures

**Patterns:**
- Bootstrap returns `null` on any guard failure; every template checks `if (!ctx) return;`
- `ensureFolderPath` catches `createFolder` errors, shows a Notice with the path, and re-throws
- `resolveSubjectParcialTema` and `resolvePlacement` return `null` on cancellation; templates check `if (!placement)` or `if (!targetFolder)` before proceeding
- Utility templates (Update Note Status) wrap per-file mutations in `try/catch` so a single failure does not abort the batch; total failures reported in the final Notice

## Cross-Cutting Concerns

**Logging:** `console.error(...)` with a `"Templater: "` prefix for non-fatal errors that should not surface a Notice (e.g., failed folder creation detail)
**Validation:** Input normalization via `normalizeYear`, `normalizeParcial`, `sanitizeFileName`, `sanitizeFolderName`, `toSlug` in `universityNoteUtils.js`
**Dates:** Always `tp.date.now("YYYY-MM-DD")` — never `new Date()` or `Date.toISOString()`
**Feature flags:** `features.parcial` in `universityConfig.js` gates parcial-related prompts and folder logic; `constants.isParcialEnabled` mirrors this for template-level branching without re-reading config

---

*Architecture analysis: 2026-05-14*

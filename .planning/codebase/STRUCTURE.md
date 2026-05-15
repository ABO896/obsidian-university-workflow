# Codebase Structure

**Analysis Date:** 2026-05-14

## Directory Layout

```
project-root/
├── _templates/                    # Templater template files (user-facing entry points)
│   ├── Lecture Note.md            # Creates lecture note; style picker + concept wiring
│   ├── Concept Note Template.md   # Creates concept/technique deep-dive note
│   ├── Quick Create Concept.md    # Creates concept note from within another note
│   ├── General Note.md            # Creates flexible general-purpose note
│   ├── Subject Hub.md             # Creates per-course Dataview dashboard
│   ├── Parcial Prep Note.md       # Creates exam-prep / study guide note
│   ├── University Dashboard.md    # Creates vault-wide Dataview dashboard
│   ├── Assign Tema to Current Note.md  # Utility: updates frontmatter + moves file
│   ├── Link Concepts to Note.md   # Utility: adds concept links to `concepts` array
│   ├── Mark Reviewed.md           # Utility: updates spaced-repetition frontmatter
│   └── Update Note Status.md      # Utility: batch-updates `status` on multiple notes
│
├── _templater_scripts/            # CommonJS user scripts loaded as tp.user.*
│   ├── universityConfig.js        # SINGLE SOURCE OF TRUTH — all config values
│   ├── scriptLoader.js            # requireScript() module loader (Obsidian + Node compat)
│   ├── templateBootstrap.js       # Bootstrap helper: guards + shared ctx object
│   ├── getUniversityContext.js    # Infers subject/year/parcial from active file path
│   └── universityNoteUtils.js     # All shared utilities, placement logic, content builders
│
├── tests/
│   └── universityNoteUtils.test.js  # Jest tests for util functions
│
├── .claude/
│   ├── commands/                  # Custom Claude slash commands
│   ├── plans/                     # Implementation plans
│   ├── skills/
│   │   └── templater-docs/        # Bundled Templater plugin documentation
│   │       ├── SKILL.md           # Skill index
│   │       ├── Templater.pdf      # Official plugin docs (PDF)
│   │       └── templater-api.md   # Extracted API reference
│   └── specs/                     # Design specs
│
├── docs/
│   └── superpowers/
│       └── specs/                 # Ecosystem overhaul design docs
│
├── .planning/
│   └── codebase/                  # Codebase map documents (this directory)
│
├── CLAUDE.md                      # Project instructions for Claude
├── AGENTS.md                      # Agent guidance
└── README.md                      # Project readme
```

## Directory Purposes

**`_templates/`:**
- Purpose: All Templater template files that users run from within Obsidian
- Contains: `.md` files with `<%* %>` Templater script blocks
- Key files: `Lecture Note.md` (most complex), `Concept Note Template.md`, `Quick Create Concept.md`
- Note: File names use Title Case with spaces — this is the display name shown in Obsidian's Templater picker

**`_templater_scripts/`:**
- Purpose: Shared CommonJS modules loaded via Templater's user scripts feature
- Contains: `.js` files using `module.exports = ...` syntax
- Key files: `universityConfig.js` (config), `universityNoteUtils.js` (core logic), `templateBootstrap.js` (bootstrap)
- Loaded as: `tp.user.universityConfig()`, `tp.user.universityNoteUtils()`, etc. — function name matches filename without extension

**`tests/`:**
- Purpose: Unit tests for script utility functions
- Contains: Jest test files
- Key files: `tests/universityNoteUtils.test.js`
- Runs in: Node.js via Jest; `scriptLoader.js` handles path resolution for both environments

**`.claude/skills/templater-docs/`:**
- Purpose: Bundled Templater plugin documentation used as a reference skill
- Contains: `templater-api.md` (authoritative API reference), `Templater.pdf` (official docs), `SKILL.md` (index)
- Generated: No — manually bundled
- Committed: Yes

## Key File Locations

**Entry Points (templates):**
- `_templates/Lecture Note.md`: Most feature-rich creation template
- `_templates/Concept Note Template.md`: Standalone concept note creation
- `_templates/Quick Create Concept.md`: In-context concept creation with parent note wiring
- `_templates/Subject Hub.md`: Per-course dashboard
- `_templates/University Dashboard.md`: Vault-wide dashboard

**Configuration:**
- `_templater_scripts/universityConfig.js`: ALL configuration — folder names, labels, years, parciales, schema types, statuses, review intervals, feature flags. Edit this file to change any string value used across templates or scripts.

**Core Logic:**
- `_templater_scripts/universityNoteUtils.js`: Placement resolution, vault queries, filesystem utilities, content builders — the largest and most critical script
- `_templater_scripts/templateBootstrap.js`: Dependency injection + guard checks called by every template

**Module Loading:**
- `_templater_scripts/scriptLoader.js`: `requireScript(filename)` used by all scripts to load siblings; supports Obsidian vault path and Node.js `__dirname` fallback

**Context Inference:**
- `_templater_scripts/getUniversityContext.js`: Path-based subject/year/parcial inference

**Testing:**
- `tests/universityNoteUtils.test.js`: Unit tests for pure utility functions

## Naming Conventions

**Template files (`_templates/`):**
- Pattern: Title Case, spaces allowed, `.md` extension
- Examples: `Lecture Note.md`, `Concept Note Template.md`, `Quick Create Concept.md`
- Rationale: Obsidian shows filename as the template picker label; spaces read naturally

**Script files (`_templater_scripts/`):**
- Pattern: camelCase, no spaces, `.js` extension
- Examples: `universityConfig.js`, `getUniversityContext.js`, `universityNoteUtils.js`
- Rationale: Loaded as `tp.user.<basename>()` — camelCase matches JS conventions; Templater strips the extension

**Functions inside scripts:**
- Exported function name matches the filename: `universityConfig.js` exports `universityConfigScript`, but scripts import via `requireScript("universityConfig.js")` and call the result as a function
- Internal helpers: camelCase verbs — `ensureFolderPath`, `ensureUniqueFileName`, `listSubjects`, `buildSubjectOptions`

**Variables in templates:**
- Context-derived: `contextSubject`, `contextYear`, `contextParcial` (inferred, pre-dialog)
- Resolved: `resolvedSubject`, `resolvedYear`, `resolvedTema` (after placement dialogs)
- Final: `subject`, `year`, `tema` (coerced, ready for frontmatter)

**Frontmatter keys:**
- All lowercase, snake_case where multi-word: `type`, `course`, `year`, `tema`, `created`, `status`, `aliases`, `concepts`, `next_review`, `last_reviewed`

## Where to Add New Code

**New template (creates a new note type):**
- Add `.md` to `_templates/` with Title Case name
- Start with `await tp.user.templateBootstrap(tp, { requireNewFile: true })` and `if (!ctx) return;`
- Add the new `type` value to `universityConfig.js` → `schema.types`
- Use `resolveSubjectParcialTema` or `resolvePlacement` from `noteUtils` for placement

**New utility template (modifies existing notes, no body change):**
- Add `.md` to `_templates/`
- Do NOT set `tR`
- Use `tp.hooks.on_all_templates_executed()` for all `processFrontMatter` calls

**New utility function:**
- Add inside the `universityNoteUtils()` factory in `_templater_scripts/universityNoteUtils.js`
- Export it in the returned object at the bottom of the factory
- Pure functions (no Obsidian API calls) are testable in `tests/`

**New config value:**
- Add to `_templater_scripts/universityConfig.js` in the appropriate section
- Surface it in `universityNoteUtils.js` `constants` object if templates need it without destructuring `config`

**New test:**
- Add to `tests/universityNoteUtils.test.js` or create a new `tests/<scriptName>.test.js`

## Special Directories

**`_templates/`:**
- Purpose: Obsidian Templater reads this folder to populate the template picker
- Generated: No
- Committed: Yes
- Note: Folder name must match Templater plugin's "Template folder location" setting

**`_templater_scripts/`:**
- Purpose: Obsidian Templater loads these as user scripts (registered under "User script functions" in plugin settings)
- Generated: No
- Committed: Yes
- Note: Folder name must match Templater plugin's "Script files folder location" setting

**`.planning/codebase/`:**
- Purpose: Codebase analysis documents consumed by GSD planning commands
- Generated: Yes (by `/gsd-map-codebase`)
- Committed: Yes

**`.claude/`:**
- Purpose: Claude-specific configuration, skills, commands, and plans
- Generated: Partially (plans generated during sessions)
- Committed: Yes

---

*Structure analysis: 2026-05-14*

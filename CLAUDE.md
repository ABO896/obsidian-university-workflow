# Obsidian University Workflow

A config-driven Obsidian Templater system for university note-taking. Templates capture lectures, concepts, and study guides; helpers handle smart placement, slug generation, and unique naming; Dataview renders dashboards and backlinks.

## Project Structure

```
_templates/                        # Six Templater template files
  Lecture Note.md                  # tp.system.multi_suggester for concepts, tp.file.selection() for topic
  Concept Note Template.md         # concept deep-dives with Dataview backlinks
  General Note.md                  # flexible note + consistent frontmatter
  Subject Hub.md                   # course dashboard with Dataview tables
  Parcial Prep Note.md             # exam-prep with 3 cursor stops
  Assign Tema to Current Note.md   # utility to update existing notes

_templater_scripts/                # CommonJS user scripts loaded via tp.user.*
  universityConfig.js              # SINGLE SOURCE OF TRUTH — folders, labels, years, feature flags
  scriptLoader.js                  # requireScript() module loader helper
  getUniversityContext.js          # infers subject/year from current file path
  universityNoteUtils.js           # resolveSubjectParcialTema, ensureFolderPath,
                                   # ensureUniqueFileName, toSlug, normalizeYear,
                                   # dedupePreserveOrder
```

## Rules for Working on This Project

### Templater API — always read the docs first
- Read `.claude/skills/templater-docs/Templater.pdf` before writing or modifying any template code
- Never use raw JS when a native `tp.*` API exists
- All async Templater functions MUST be awaited: `tp.file.move`, `tp.file.rename`, `tp.file.create_new`, `tp.file.exists`, `tp.file.include`, `tp.system.prompt`, `tp.system.suggester`, `tp.system.multi_suggester`, `tp.system.clipboard`, all `tp.web.*`
- Use `tp.date.now("YYYY-MM-DD")` — never `new Date()` or `Date.toISOString()`
- Use `tp.app.*` — never bare `app.*` in templates
- Use Moment.js format strings for all dates (this project uses `"YYYY-MM-DD"`)

### Config alignment
- Every folder name, label, and year value MUST come from `universityConfig.js` at runtime
- Never hardcode strings that exist in config
- The `features.parcial` flag controls exam-period grouping — templates must respect it

### Frontmatter conventions (from README)
Required keys in this order: `type`, `course`, `year`, `tema`, `created`, `status`, `aliases`
- `created` format: `"YYYY-MM-DD"` via `tp.date.now("YYYY-MM-DD")`
- `status` default: `"draft"`
- `type` values: `lecture`, `concept`, `general`, `subject-hub`, `parcial-prep`

### User scripts
- Scripts are CommonJS modules (`module.exports = ...`)
- Templates import them with `tp.user.universityNoteUtils()` etc.
- Scripts that need Templater APIs must receive `tp` as an argument — they cannot access `tp` as a global
- `app` and `moment` ARE available as globals inside user scripts

### Whitespace control
- Use `-%>` after `<%* if (...) { %>` and `<%* } %>` blocks to prevent blank lines in output
- Use `<%-` to trim newlines before commands when needed

### Do not change
- The architecture (helper pattern, config-driven design, shared utils)
- The Dataview query logic
- The `resolveSubjectParcialTema` / `ensureFolderPath` / `ensureUniqueFileName` design
- The README

## Templater Docs Skill
@.claude/skills/templater-docs/SKILL.md

# Templater Refactor Design — 2026-05-14

## Goal

Reduce repetition across the 9 templates, deduplicate the concept backlinks Dataview block, clarify the utils API, and lay a foundation that makes adding future templates cheap. No behavior changes.

---

## Architecture

Four concrete changes, each independent:

1. New `templateBootstrap.js` user script — eliminates the repeated 25–30 line setup block in every template
2. `buildConceptBacklinksBlock()` in `universityNoteUtils.js` — single source of truth for the concept backlinks Dataview query
3. Rename `resolveSubjectAndParcial` → `resolvePlacement` — name reflects purpose, not inputs
4. Update all 9 templates and add new tests

---

## Component 1 — `templateBootstrap.js`

**New file:** `_templater_scripts/templateBootstrap.js`

Exported as a single async function `templateBootstrap(tp, options)`. Replaces the boilerplate guard + utility loading that is repeated verbatim at the top of every template.

### Options

```js
{
  requireNewFile: boolean  // default: false
}
```

When `requireNewFile: true`, the guard additionally checks that the template runs on a new file: either `tp.config.run_mode === 0` (CreateNewFile) or `currentFile.basename` starts with `"untitled"` or `"sin título"` (case-insensitive). Used by Lecture Note, Parcial Prep Note, and Subject Hub.

### Execution sequence

1. Check `tp.config.target_file` exists → `new Notice(...)` + return `null`
2. If `requireNewFile`, check run_mode/basename → `new Notice(...)` + return `null`
3. Load config: `typeof tp.user.universityConfig === "function" ? await tp.user.universityConfig() : null`
4. Load context: `await tp.user.getUniversityContext(currentFile)`
5. Load utils: `await tp.user.universityNoteUtils()`
6. Null-check utils → `new Notice(...)` + return `null`
7. Extract `generalLabel` from `constants?.general ?? configLabels?.general` → `new Notice(...)` + return `null` if missing
8. Return context object

### Return shape (on success)

```js
{
  currentFile,   // tp.config.target_file
  noteUtils,     // full utils object
  generalLabel,  // e.g. "General"
  schema,        // config.schema
  constants,     // noteUtils.constants
  context,       // { subject, year, parcial } from getUniversityContext
  config,        // raw universityConfig object
  configLabels,  // config.labels
}
```

Returns `null` on any abort. All Notice messages mirror the current wording exactly.

### Call site pattern

```js
const ctx = await tp.user.templateBootstrap(tp, { requireNewFile: true });
if (!ctx) return;
const { currentFile, noteUtils, generalLabel, schema, constants, context } = ctx;
const { ensureFolderPath, ensureUniqueFileName, sanitizeFileName, toSlug,
        resolveSubjectParcialTema } = noteUtils;
const noteTypes = schema?.types ?? {};
// ... template-specific setup continues here
```

### Special case — General Note

General Note has a unique "confirm if not untitled" prompt. The bootstrap runs without `requireNewFile`; the confirm dialog remains in the template body immediately after `if (!ctx) return`.

---

## Component 2 — `buildConceptBacklinksBlock`

**Added to `universityNoteUtils.js`**, exposed on the returned utils object.

The 35-line `dataviewjs` concept backlinks block is currently copy-pasted identically between `Concept Note Template.md` and `Quick Create Concept.md`. This function is the single source of truth.

### Signature

```js
function buildConceptBacklinksBlock({ baseUniversityPath, generalLabel, lectureType }) {
  // JSON.stringify internally
  // returns the full ```dataviewjs ... ``` block as a string
}
```

Callers pass raw values; the function handles `JSON.stringify`:

```js
const backlinksBlock = noteUtils.buildConceptBacklinksBlock({
  baseUniversityPath,
  generalLabel,
  lectureType,
});
```

### Style fix

The two existing copies have inconsistent formatting: `Concept Note Template` uses multi-line `if` bodies; `Quick Create Concept` collapses them. The function uses multi-line style throughout, consistent with the rest of `universityNoteUtils.js`.

---

## Component 3 — Rename `resolveSubjectAndParcial` → `resolvePlacement`

The current name describes inputs. The function's job is to resolve *where a note is placed* — it returns `targetFolder`, `subjectRootPath`, `yearRootPath`, etc. `resolvePlacement` says what it does.

### Changes

- Rename the internal function definition in `universityNoteUtils.js`
- Update the internal delegation call inside `resolveSubjectParcialTema`
- Export both names: `resolvePlacement` (canonical) and `resolveSubjectAndParcial` (deprecated alias pointing to the same function)
- Update the two templates that call it directly: `Parcial Prep Note.md`, `Subject Hub.md`

`resolveSubjectParcialTema` is unchanged — it wraps `resolvePlacement` and adds tema resolution.

---

## Component 4 — Template updates

All 9 templates replace their boilerplate preamble with the bootstrap call. The unique logic in each template (placement resolution, filename construction, content building, file move) is unchanged.

### Files changed

| File | Nature of change |
|------|-----------------|
| `_templates/Lecture Note.md` | Bootstrap (`requireNewFile: true`), remove boilerplate |
| `_templates/Concept Note Template.md` | Bootstrap, remove boilerplate, use `buildConceptBacklinksBlock` |
| `_templates/General Note.md` | Bootstrap (no `requireNewFile`), keep confirm dialog in template |
| `_templates/Subject Hub.md` | Bootstrap (`requireNewFile: true`), use `resolvePlacement` |
| `_templates/Parcial Prep Note.md` | Bootstrap (`requireNewFile: true`), use `resolvePlacement` |
| `_templates/Assign Tema to Current Note.md` | Bootstrap, remove boilerplate |
| `_templates/Quick Create Concept.md` | Bootstrap, remove boilerplate, use `buildConceptBacklinksBlock` |
| `_templates/Link Concepts to Note.md` | Bootstrap, remove boilerplate |
| `_templates/Update Note Status.md` | Bootstrap, remove boilerplate |

---

## Testing

### New tests in `tests/universityNoteUtils.test.js`

**`buildConceptBacklinksBlock`** (pure JS, fully testable in Node):
- Returns a string containing ` ```dataviewjs`
- Returned string contains the `dvSource` value derived from `baseUniversityPath`
- Returned string contains the `lectureType` value
- Returned string contains the `generalLabel` value
- No single-line collapsed `if` bodies (style consistency)

**`resolvePlacement` rename**:
- `utils.resolvePlacement` is a function
- `utils.resolveSubjectAndParcial === utils.resolvePlacement` (alias)

### New smoke test for `templateBootstrap.js`

- Module loads without error
- Exports a function

### What remains untested

The async Obsidian-bound paths in `resolvePlacement`, `resolveSubjectParcialTema`, `ensureFolderPath`, and `ensureUniqueFileName` require a live vault. No change from current coverage.

---

## What does not change

- Vault folder structure and file placement behavior
- All Dataview query logic
- `resolveSubjectParcialTema` signature and behavior
- The `resolveSubjectAndParcial` export (deprecated alias kept)
- The `README.md`
- `universityConfig.js`, `getUniversityContext.js`, `scriptLoader.js`
- Frontmatter conventions and note content structure

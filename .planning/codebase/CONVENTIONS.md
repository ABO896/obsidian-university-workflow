# Coding Conventions

**Analysis Date:** 2026-05-14

## Two Code Surfaces

This project has two distinct code surfaces with different conventions:

1. **Templater templates** — `_templates/*.md` — Obsidian Templater files using `<% %>` syntax
2. **User scripts** — `_templater_scripts/*.js` — CommonJS modules loaded by Templater via `tp.user.*`

---

## Naming Patterns

**Template files (`_templates/`):**
- Title-case with spaces: `Lecture Note.md`, `Concept Note Template.md`, `Quick Create Concept.md`
- Utility templates use imperative verbs: `Assign Tema to Current Note.md`, `Link Concepts to Note.md`, `Mark Reviewed.md`, `Update Note Status.md`

**User script files (`_templater_scripts/`):**
- camelCase, no spaces: `universityConfig.js`, `universityNoteUtils.js`, `getUniversityContext.js`, `scriptLoader.js`, `templateBootstrap.js`

**Functions:**
- camelCase: `ensureFolderPath`, `ensureUniqueFileName`, `resolveSubjectParcialTema`, `buildConceptBacklinksBlock`
- Factory pattern name matches file name: `function universityNoteUtils()` exported from `universityNoteUtils.js`
- Config getter matches file: `function universityConfigScript()` in `universityConfig.js`

**Variables:**
- camelCase for all locals: `targetFolder`, `resolvedSubject`, `contextYear`
- SCREAMING_SNAKE_CASE for module-level constants derived from config:
  ```js
  const GENERAL_LABEL = labels.general;
  const IS_PARCIAL_ENABLED = features.parcial === true;
  const FINAL_LABEL = labels.final ?? ...;
  ```
- Sentinel strings use `__snake_case__` double-underscore pattern:
  ```js
  const NEW_SUBJECT_SENTINEL = "__new_subject__";
  const SKIP_YEAR_SENTINEL = "__skip_year__";
  const NEW_TEMA_SENTINEL = "__new_tema__";
  ```

**Schema/config keys:**
- `kebab-case` for type identifiers: `"subject-hub"`, `"parcial-prep"`, `"university-dashboard"`
- `snake_case` for frontmatter keys: `next_review`, `last_reviewed`

---

## CommonJS Module Pattern

Every script exports a single factory function (not a plain object):

```js
// universityConfig.js
function universityConfigScript() {
  return universityConfig;
}
module.exports = universityConfigScript;

// universityNoteUtils.js
function universityNoteUtils() {
  // ... all private helpers as closures ...
  return { pathJoin, ensureFolderPath, resolveSubjectParcialTema, ... };
}
module.exports = universityNoteUtils;
```

Scripts that need Templater APIs receive `tp` as an argument — never access `tp` as a global:
```js
async function resolvePlacement(tp, { currentFile, ... } = {}) {
  if (!tp) throw new Error("Templater API (tp) is required.");
  // ...
  await tp.system.suggester(...);
}
```

`app` and `moment` are available as Obsidian globals inside user scripts without being passed in.

---

## Template Structure Pattern

All templates follow a numbered section comment layout:

```
<%*
// Depends on: _templater_scripts/templateBootstrap.js
// (optional multi-line purpose/workflow comment)

// --- 0. BOOTSTRAP ---
const ctx = await tp.user.templateBootstrap(tp, { requireNewFile: true });
if (!ctx) return;
const { currentFile, noteUtils, generalLabel, schema, constants, context } = ctx;

// --- 1. RESOLVE PLACEMENT ---
// --- 2. PROMPT FOR ... ---
// --- 3. BUILD CONTENT ---
// --- 4. BUILD ... ---
// --- N. PLACE FILE ---
%>
```

Section numbers are always zero-based and count sequentially. The BOOTSTRAP step is always `0`.

---

## Templater API Conventions

**Always use native `tp.*` APIs — never raw JS equivalents:**

| Forbidden | Use instead |
|-----------|-------------|
| `new Date().toISOString()` | `tp.date.now("YYYY-MM-DD")` |
| `window.prompt(...)` | `await tp.system.prompt(...)` |
| `fetch(...)` | `await tp.web.request(...)` |
| `app.vault.getName()` | `tp.file.folder()` |
| bare `app.*` in templates | `tp.app.*` |

**Async: all Templater async functions must be awaited:**
```js
const placement = await resolveSubjectParcialTema(tp, { ... });
await ensureFolderPath(targetFolder);
await tp.file.move(destinationMovePath);
const today = tp.date.now("YYYY-MM-DD");  // synchronous — no await needed
```

**Date format:** always `"YYYY-MM-DD"` (Moment.js). Never ISO string, never locale format.

**Output assignment:** use `tR =` for the full rendered output, not `tR +=` piecemeal (except utility templates that intentionally do not set `tR` at all):
```js
tR = lines.join("\n");
// or
tR = body;
```

Templates that perform only side effects (updating frontmatter, linking concepts) add this comment and never set `tR`:
```js
// NOTE: This template intentionally does NOT set tR.
```

---

## Whitespace Control

Use `-%>` after `if` blocks to prevent blank lines:
```
<%* if (condition) { -%>
content
<%* } -%>
```

Content is typically built with an array and joined at the end rather than repeated string concatenation:
```js
const lines = [frontmatter, ""];
lines.push(`# 💡 ${finalFileName}`);
lines.push("");
// ...
tR = lines.join("\n");
```

For simpler templates, `tR +=` string concatenation is acceptable.

---

## Frontmatter Conventions

**Required key order** (enforced across all templates):
```yaml
---
type: lecture          # one of: lecture, concept, general, subject-hub, parcial-prep
course: "Subject Name"
year: "Year 1"         # omitted if null/unknown
tema: "General"
created: "2026-05-14"
status: draft          # one of: raw, draft, reviewed, complete
aliases: []
---
```

**Frontmatter is always built as an array then joined:**
```js
const frontmatterLines = [
  "---",
  `type: ${conceptType}`,
  `course: ${JSON.stringify(selectedSubject)}`,
  selectedYear ? `year: ${JSON.stringify(selectedYear)}` : null,
  `tema: ${JSON.stringify(selectedTema)}`,
  `created: ${JSON.stringify(today)}`,
  "status: draft",
  "aliases: []",
  "---",
]
  .filter(Boolean)
  .join("\n");
```

String values are always `JSON.stringify()`-wrapped to handle names with quotes or special characters.

---

## Error Handling

**Guard pattern after bootstrap:**
```js
const ctx = await tp.user.templateBootstrap(tp, { requireNewFile: true });
if (!ctx) return;
```

**Guard pattern after placement resolution:**
```js
if (!targetFolder) {
  new Notice("⛔️ Abort: Could not determine destination folder.", 10_000);
  return;
}
```

**Cancellation pattern** (user dismissed a prompt):
```js
if (!selectedStyle) {
  new Notice("ℹ️ Lecture note creation cancelled.", 5_000);
  return;
}
```

**Notice conventions:**
- `⛔️` prefix for hard aborts (10 second timeout)
- `ℹ️` prefix for soft cancellations (5 second timeout)
- `✅` / emoji prefix for success (5–6 second timeout)
- Timeout values: `5_000` (success/cancel), `6_000` (batch results), `7_000` (empty-results), `10_000` (abort errors)

**try/catch** is used only in places where a single failure must not stop a batch loop:
```js
try {
  await tp.app.fileManager.processFrontMatter(file, (fm) => { fm.status = newStatus; });
  updated++;
} catch (err) {
  console.error(`Templater: Failed to update status for "${file.path}"`, err);
  failed++;
}
```

**Script-level validation** in `universityNoteUtils.js` — config is validated at factory-call time:
```js
if (!labels.general) throw new Error("University config must define labels.general.");
if (!fsConfig.universityRoot) throw new Error("University config must define fs.universityRoot.");
```

---

## Frontmatter Write Pattern

All writes to existing notes' frontmatter go through `tp.hooks.on_all_templates_executed()` to avoid race conditions with Templater's own write pass:

```js
tp.hooks.on_all_templates_executed(async () => {
  const targetFile = tp.app.vault.getAbstractFileByPath(currentFilePath) ?? currentFile;
  await tp.app.fileManager.processFrontMatter(targetFile, (fm) => {
    fm.status = newStatus;
  });
});
```

Direct `processFrontMatter` calls inside the template body are never used.

---

## Import / Dependency Pattern

Scripts declare their Templater dependency in a comment at the top:
```js
// Depends on: _templater_scripts/templateBootstrap.js
```

Scripts load sibling modules via `scriptLoader.js`:
```js
const path = require("path");
const requireScript = require(path.join(__dirname, "scriptLoader.js"));
const getUniversityConfig = requireScript("universityConfig.js");
```

`__dirname` is always used for scriptLoader — never relative `./` paths directly — because Obsidian's module resolution differs from Node.js.

---

## Config-Driven Design Rules

- All folder names, labels, years, and type identifiers MUST come from `universityConfig.js` at runtime
- Never hardcode strings that exist in config (e.g., `"Universidad"`, `"General"`, `"Parcial 1"`)
- Feature flags (`features.parcial`) must be checked before any parcial-related branch:
  ```js
  const effectiveIncludeParcial = includeParcial && IS_PARCIAL_ENABLED;
  ```
- The `schema.types` object is always accessed via optional chaining with a fallback:
  ```js
  const lectureType = schema?.types?.lecture ?? "lecture";
  ```

---

## Comment Style

**Section comments** use em-dash separators:
```js
// --- 0. BOOTSTRAP ---
// --- 1. RESOLVE PLACEMENT ---
```

**Inline rationale comments** explain the *why*, not the *what*:
```js
// Running inside the hook avoids the race condition where Templater's own
// write pass could overwrite a processFrontMatter call made earlier.
```

**File-level block comments** use `/* */` (not `//`):
```js
/*
  universityNoteUtils.js

  Shared helper utilities for Templater scripts...
*/
```

**JSDoc** is not used. Rationale comments are preferred over formal doc blocks.

---

*Convention analysis: 2026-05-14*

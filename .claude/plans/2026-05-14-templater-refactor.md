# Templater Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminate 200+ lines of duplicated boilerplate across 9 Templater templates by introducing a `templateBootstrap.js` helper, deduplicate the concept backlinks Dataview block, and rename `resolveSubjectAndParcial` to `resolvePlacement`.

**Architecture:** A new CommonJS user script (`templateBootstrap.js`) wraps the guard + utility-loading ceremony that is repeated verbatim at the top of every template. A new `buildConceptBacklinksBlock()` function in `universityNoteUtils.js` replaces the copy-pasted 35-line dataviewjs string. All 9 templates are updated to use these; no behavior changes.

**Tech Stack:** Node.js CommonJS modules, Obsidian Templater user script API (`tp.user.*`, `tp.config.*`, `tp.system.*`), Dataview plugin, `node:test` for unit tests.

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `_templater_scripts/templateBootstrap.js` | **Create** | Guard checks + utility loading for all templates |
| `_templater_scripts/universityNoteUtils.js` | **Modify** | Add `buildConceptBacklinksBlock`; rename `resolveSubjectAndParcial` → `resolvePlacement` with alias |
| `tests/universityNoteUtils.test.js` | **Modify** | Tests for `buildConceptBacklinksBlock`, `resolvePlacement` alias, bootstrap smoke |
| `_templates/Lecture Note.md` | **Modify** | Use bootstrap (`requireNewFile: true`) |
| `_templates/Concept Note Template.md` | **Modify** | Use bootstrap + `buildConceptBacklinksBlock` |
| `_templates/General Note.md` | **Modify** | Use bootstrap (no `requireNewFile`); keep confirm dialog |
| `_templates/Subject Hub.md` | **Modify** | Use bootstrap (`requireNewFile: true`) + `resolvePlacement` |
| `_templates/Parcial Prep Note.md` | **Modify** | Use bootstrap (`requireNewFile: true`) + `resolvePlacement` |
| `_templates/Quick Create Concept.md` | **Modify** | Use bootstrap + `buildConceptBacklinksBlock` |
| `_templates/Assign Tema to Current Note.md` | **Modify** | Use bootstrap |
| `_templates/Link Concepts to Note.md` | **Modify** | Use bootstrap |
| `_templates/Update Note Status.md` | **Modify** | Use bootstrap |

---

## Task 1: Add `buildConceptBacklinksBlock` to `universityNoteUtils.js`

**Files:**
- Modify: `_templater_scripts/universityNoteUtils.js`
- Test: `tests/universityNoteUtils.test.js`

- [ ] **Step 1: Write the failing tests**

Add this `describe` block at the bottom of `tests/universityNoteUtils.test.js`, before the closing of the file:

```js
// ---------------------------------------------------------------------------
// buildConceptBacklinksBlock
// ---------------------------------------------------------------------------
describe('buildConceptBacklinksBlock', () => {
  const { buildConceptBacklinksBlock } = utils;

  const defaults = {
    baseUniversityPath: 'Universidad',
    generalLabel: 'General',
    lectureType: 'lecture',
  };

  test('returns a string', () => {
    assert.equal(typeof buildConceptBacklinksBlock(defaults), 'string');
  });

  test('opens with ```dataviewjs fence', () => {
    const result = buildConceptBacklinksBlock(defaults);
    assert.ok(result.startsWith('```dataviewjs'), `expected to start with \`\`\`dataviewjs, got: ${result.slice(0, 30)}`);
  });

  test('closes with ``` fence', () => {
    const result = buildConceptBacklinksBlock(defaults);
    assert.ok(result.trimEnd().endsWith('```'), 'expected to end with ```');
  });

  test('includes JSON-stringified baseUniversityPath as dvSource', () => {
    const result = buildConceptBacklinksBlock(defaults);
    assert.ok(result.includes('"Universidad"'), 'should include JSON-stringified path');
  });

  test('includes JSON-stringified generalLabel', () => {
    const result = buildConceptBacklinksBlock(defaults);
    assert.ok(result.includes('"General"'), 'should include JSON-stringified generalLabel');
  });

  test('includes JSON-stringified lectureType', () => {
    const result = buildConceptBacklinksBlock(defaults);
    assert.ok(result.includes('"lecture"'), 'should include JSON-stringified lectureType');
  });

  test('uses multi-line if bodies — no collapsed "if (!entry) return false;"', () => {
    const result = buildConceptBacklinksBlock(defaults);
    assert.ok(!result.includes('if (!entry) return false;'), 'single-line if found');
    assert.ok(!result.includes('if (!entryValue) return false;'), 'single-line if found');
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
node --test tests/universityNoteUtils.test.js
```

Expected: failures with `TypeError: buildConceptBacklinksBlock is not a function`

- [ ] **Step 3: Implement `buildConceptBacklinksBlock` in `universityNoteUtils.js`**

Add this function inside the `universityNoteUtils()` factory, immediately before the `const codeLanguage = ...` line near the bottom of the file:

```js
function buildConceptBacklinksBlock({ baseUniversityPath, generalLabel: label, lectureType: lType }) {
  const dvSource = JSON.stringify(baseUniversityPath ?? "");
  const generalLiteral = JSON.stringify(label);
  const lectureTypeLiteral = JSON.stringify(lType);

  return [
    "```dataviewjs",
    `const concept = dv.current();`,
    `const targetCourse = concept.course ?? ${generalLiteral};`,
    `const targetName = (concept.file?.name ?? "").toLowerCase();`,
    `const targetPath = concept.file?.path ?? "";`,
    ``,
    `const allowedTypes = new Set([${lectureTypeLiteral}]);`,
    `const sortValue = (page) => page.created ?? page.date ?? page.file?.ctime;`,
    ``,
    `const matches = dv`,
    `  .pages(${dvSource})`,
    `  .where((page) => (page.course ?? ${generalLiteral}) === targetCourse)`,
    `  .where((page) => allowedTypes.has((page.type ?? "").toLowerCase()))`,
    `  .where((page) => {`,
    `    const concepts = Array.isArray(page.concepts) ? page.concepts : [];`,
    `    const conceptMatch = concepts.some((entry) => {`,
    `      if (!entry) {`,
    `        return false;`,
    `      }`,
    ``,
    `      const entryValue = entry.path ?? entry.toString?.() ?? entry;`,
    `      if (!entryValue) {`,
    `        return false;`,
    `      }`,
    ``,
    `      const lowered = entryValue.toString().toLowerCase();`,
    `      return lowered === targetName || lowered === targetPath.toLowerCase();`,
    `    });`,
    ``,
    `    const linkMatch = (page.file?.outlinks ?? []).some((link) => link.path === targetPath);`,
    `    return conceptMatch || linkMatch;`,
    `  })`,
    `  .array()`,
    `  .sort((a, b) => dv.compare(sortValue(a), sortValue(b)));`,
    ``,
    `dv.list(matches.map((page) => page.file.link));`,
    "```",
  ].join("\n");
}
```

Note: the parameter names use local aliases (`label`, `lType`) to avoid shadowing the outer-scope `generalLabel` and other closure variables inside the factory.

- [ ] **Step 4: Export `buildConceptBacklinksBlock` from the returned object**

In the `return { ... }` block at the bottom of `universityNoteUtils()`, add `buildConceptBacklinksBlock` alongside the existing exports:

```js
return {
  // ... existing exports ...
  buildConceptBacklinksBlock,
};
```

- [ ] **Step 5: Run tests to confirm they pass**

```bash
node --test tests/universityNoteUtils.test.js
```

Expected: all `buildConceptBacklinksBlock` tests pass; no regressions.

- [ ] **Step 6: Commit**

```bash
git add _templater_scripts/universityNoteUtils.js tests/universityNoteUtils.test.js
git commit -m "feat(utils): add buildConceptBacklinksBlock to universityNoteUtils"
```

---

## Task 2: Rename `resolveSubjectAndParcial` → `resolvePlacement`

**Files:**
- Modify: `_templater_scripts/universityNoteUtils.js`
- Test: `tests/universityNoteUtils.test.js`

- [ ] **Step 1: Write the failing tests**

Add this `describe` block to `tests/universityNoteUtils.test.js`:

```js
// ---------------------------------------------------------------------------
// resolvePlacement (renamed from resolveSubjectAndParcial)
// ---------------------------------------------------------------------------
describe('resolvePlacement alias', () => {
  test('resolvePlacement is a function', () => {
    assert.equal(typeof utils.resolvePlacement, 'function');
  });

  test('resolveSubjectAndParcial is a deprecated alias pointing to resolvePlacement', () => {
    assert.equal(utils.resolveSubjectAndParcial, utils.resolvePlacement);
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
node --test tests/universityNoteUtils.test.js
```

Expected: failures with `expected 'undefined' to equal 'function'`

- [ ] **Step 3: Rename the function and update the internal call**

In `universityNoteUtils.js`, find the line:

```js
async function resolveSubjectAndParcial(
```

Change it to:

```js
async function resolvePlacement(
```

Then find the single internal call inside `resolveSubjectParcialTema`:

```js
const placement = await resolveSubjectAndParcial(tp, {
```

Change it to:

```js
const placement = await resolvePlacement(tp, {
```

- [ ] **Step 4: Update the exported object to include both names**

In the `return { ... }` block, find:

```js
resolveSubjectAndParcial,
```

Replace with:

```js
resolvePlacement,
resolveSubjectAndParcial: resolvePlacement,
```

- [ ] **Step 5: Run tests to confirm they pass**

```bash
node --test tests/universityNoteUtils.test.js
```

Expected: all `resolvePlacement alias` tests pass; no regressions in the full suite.

- [ ] **Step 6: Commit**

```bash
git add _templater_scripts/universityNoteUtils.js tests/universityNoteUtils.test.js
git commit -m "refactor(utils): rename resolveSubjectAndParcial to resolvePlacement"
```

---

## Task 3: Create `templateBootstrap.js`

**Files:**
- Create: `_templater_scripts/templateBootstrap.js`
- Test: `tests/universityNoteUtils.test.js`

- [ ] **Step 1: Write the smoke test**

Add this `describe` block to `tests/universityNoteUtils.test.js`:

```js
// ---------------------------------------------------------------------------
// templateBootstrap (smoke test — tp.* calls are not testable in Node)
// ---------------------------------------------------------------------------
describe('templateBootstrap', () => {
  const path = require('path');
  const templateBootstrap = require(path.join(__dirname, '../_templater_scripts/templateBootstrap'));

  test('module exports a function', () => {
    assert.equal(typeof templateBootstrap, 'function');
  });
});
```

- [ ] **Step 2: Run the test to confirm it fails**

```bash
node --test tests/universityNoteUtils.test.js
```

Expected: failure — `Cannot find module '../_templater_scripts/templateBootstrap'`

- [ ] **Step 3: Create `_templater_scripts/templateBootstrap.js`**

```js
/*
  templateBootstrap.js

  One-call setup for Templater user scripts. Handles guard checks, loads all
  shared utilities, and returns a ready-to-use context object. Returns null on
  any abort condition — the caller must do `if (!ctx) return;` after the call.

  Usage in templates:
    const ctx = await tp.user.templateBootstrap(tp, { requireNewFile: true });
    if (!ctx) return;
    const { currentFile, noteUtils, generalLabel, schema, constants, context } = ctx;
*/

async function templateBootstrap(tp, { requireNewFile = false } = {}) {
  const currentFile = tp.config.target_file;
  if (!currentFile) {
    new Notice("⛔️ Abort: Templater has no target file.", 10_000);
    return null;
  }

  if (requireNewFile) {
    const isCreatingNewFile = tp.config.run_mode === 0;
    if (!isCreatingNewFile) {
      const basename = (currentFile.basename ?? "").toLowerCase();
      if (!basename.startsWith("untitled") && !basename.startsWith("sin título")) {
        new Notice("⛔️ Abort: Template must be run in a new 'Untitled' note.", 10_000);
        return null;
      }
    }
  }

  const getConfig = tp.user.universityConfig;
  const config = typeof getConfig === "function" ? await getConfig() : null;
  const configLabels = config?.labels ?? {};

  const context = await tp.user.getUniversityContext(currentFile);

  const noteUtils = await tp.user.universityNoteUtils();
  if (!noteUtils) {
    new Notice("⛔️ Abort: University note utilities are unavailable.", 10_000);
    return null;
  }

  const { constants = {}, schema = {} } = noteUtils;
  const generalLabel = constants?.general ?? configLabels?.general;
  if (!generalLabel) {
    new Notice("⛔️ Abort: University general label is not configured.", 10_000);
    return null;
  }

  return {
    currentFile,
    noteUtils,
    generalLabel,
    schema,
    constants,
    context,
    config,
    configLabels,
  };
}

module.exports = templateBootstrap;
```

- [ ] **Step 4: Run the smoke test to confirm it passes**

```bash
node --test tests/universityNoteUtils.test.js
```

Expected: `templateBootstrap > module exports a function` passes; full suite green.

- [ ] **Step 5: Commit**

```bash
git add _templater_scripts/templateBootstrap.js tests/universityNoteUtils.test.js
git commit -m "feat: add templateBootstrap user script"
```

---

## Task 4: Update `Lecture Note.md`

**Files:**
- Modify: `_templates/Lecture Note.md`

- [ ] **Step 1: Replace the guard + load block with the bootstrap call**

Find and replace the entire section from `// --- 0. GUARD` through the line `const contextYear = context?.year ?? tp.frontmatter?.year ?? null;` (the last line before `// --- 2. RESOLVE PLACEMENT`).

Replace with:

```js
// --- 0. BOOTSTRAP ---
const ctx = await tp.user.templateBootstrap(tp, { requireNewFile: true });
if (!ctx) return;
const { currentFile, noteUtils, generalLabel, schema, constants, context } = ctx;
const {
  ensureFolderPath,
  ensureUniqueFileName,
  sanitizeFileName,
  toSlug,
  resolveSubjectParcialTema,
} = noteUtils;

const noteTypes = schema?.types ?? {};
const lectureType = noteTypes.lecture ?? "lecture";
const conceptType = noteTypes.concept ?? "concept";
const codeLanguage = constants?.codeLanguage ?? "";

const contextSubject = context?.subject ?? generalLabel;
const contextYear = context?.year ?? tp.frontmatter?.year ?? null;
```

- [ ] **Step 2: Run tests**

```bash
node --test tests/universityNoteUtils.test.js
```

Expected: full suite green (template changes don't affect Node-runnable tests).

- [ ] **Step 3: Commit**

```bash
git add "_templates/Lecture Note.md"
git commit -m "refactor(template): use templateBootstrap in Lecture Note"
```

---

## Task 5: Update `Concept Note Template.md`

**Files:**
- Modify: `_templates/Concept Note Template.md`

- [ ] **Step 1: Replace the guard + load block with the bootstrap call**

Find and replace from `// --- 0. GUARD` through `const contextYear = context?.year ?? tp.frontmatter?.year ?? null;`:

```js
// --- 0. BOOTSTRAP ---
const ctx = await tp.user.templateBootstrap(tp);
if (!ctx) return;
const { currentFile, noteUtils, generalLabel, schema, constants, context } = ctx;
const {
  ensureFolderPath,
  ensureUniqueFileName,
  resolveSubjectParcialTema,
} = noteUtils;

const noteTypes = schema?.types ?? {};
const conceptType = noteTypes.concept ?? "concept";
const lectureType = noteTypes.lecture ?? "lecture";

const contextSubject = context?.subject ?? generalLabel;
const contextYear = context?.year ?? tp.frontmatter?.year ?? null;
```

- [ ] **Step 2: Replace the Dataview block construction with `buildConceptBacklinksBlock`**

After the `placement` destructuring (which includes `baseUniversityPath`), find and delete these lines:

```js
// Dataview source scoped to the university root for performance.
const dvSource = JSON.stringify(baseUniversityPath ?? "");
const generalLiteral = JSON.stringify(generalLabel);
const lectureTypeLiteral = JSON.stringify(lectureType);

// Dataview JS that finds all lectures/notes referencing this concept by name
// or via an explicit entry in their `concepts` frontmatter array.
const dataviewBlock = [
  "```dataviewjs",
  ... (all 35 lines) ...
  "```",
].join("\n");
```

Replace with:

```js
const dataviewBlock = noteUtils.buildConceptBacklinksBlock({
  baseUniversityPath,
  generalLabel,
  lectureType,
});
```

- [ ] **Step 3: Run tests**

```bash
node --test tests/universityNoteUtils.test.js
```

Expected: full suite green.

- [ ] **Step 4: Commit**

```bash
git add "_templates/Concept Note Template.md"
git commit -m "refactor(template): use templateBootstrap and buildConceptBacklinksBlock in Concept Note"
```

---

## Task 6: Update `General Note.md`

**Files:**
- Modify: `_templates/General Note.md`

- [ ] **Step 1: Replace the guard + load block with the bootstrap call**

Find and replace from `// --- 0. GUARD: verify target file exists ---` through `const generalNoteNoticeLabel = \`${generalLabel} note\`;`:

```js
// --- 0. BOOTSTRAP ---
const ctx = await tp.user.templateBootstrap(tp);
if (!ctx) return;
const { currentFile, noteUtils, generalLabel, schema, context } = ctx;
const {
  ensureFolderPath,
  ensureUniqueFileName,
  sanitizeFileName,
  toSlug,
  resolveSubjectParcialTema,
} = noteUtils;

const noteTypes = schema?.types ?? {};
const generalType = noteTypes.general ?? "general";

const generalNoteTitleLabel = `${generalLabel} Note`;
const generalNoteNoticeLabel = `${generalLabel} note`;
```

The confirm dialog block that follows (`// --- 2. GUARD: confirm before running...`) stays exactly as-is — only rename the section comment from `--- 2.` to `--- 1.` for consistency:

```js
// --- 1. GUARD: confirm before running on an existing (non-Untitled) file ---
```

The `contextSubject` and `contextYear` lines (currently inside `// --- 3. RESOLVE PLACEMENT`) stay unchanged; update their section comment number from `3` to `2`.

- [ ] **Step 2: Run tests**

```bash
node --test tests/universityNoteUtils.test.js
```

Expected: full suite green.

- [ ] **Step 3: Commit**

```bash
git add "_templates/General Note.md"
git commit -m "refactor(template): use templateBootstrap in General Note"
```

---

## Task 7: Update `Subject Hub.md`

**Files:**
- Modify: `_templates/Subject Hub.md`

- [ ] **Step 1: Replace the guard + load block with the bootstrap call**

Find and replace from `// --- 0. GUARD: must run on a fresh note ---` through `const contextSubject = context?.subject ?? generalLabel;`:

```js
// --- 0. BOOTSTRAP ---
const ctx = await tp.user.templateBootstrap(tp, { requireNewFile: true });
if (!ctx) return;
const { currentFile, noteUtils, generalLabel, schema, constants, context, config, configLabels } = ctx;
const {
  sanitizeFileName,
  ensureUniqueFileName,
  ensureFolderPath,
  resolvePlacement,
  toSlug,
  labels: helperLabels,
  fsConfig: helperFsConfig,
} = noteUtils;

const noteTypes = schema?.types ?? {};
const lectureType = noteTypes.lecture ?? "lecture";
const conceptType = noteTypes.concept ?? "concept";
const generalType = noteTypes.general ?? "general";
const hubType = noteTypes["subject-hub"] ?? "subject-hub";

const configFs = config?.fs ?? {};
const labels = helperLabels ?? configLabels;
const fsConfig = helperFsConfig ?? configFs;
const yearLabel = labels?.year ?? "Year";
const temaLabel = labels?.tema ?? "Tema";
const temaContainerName =
  constants?.temaContainer ??
  fsConfig?.temaContainer ??
  configFs?.temaContainer ??
  (typeof temaLabel === "string" ? `${temaLabel}s` : temaLabel);
const temaPluralDisplay =
  typeof temaContainerName === "string" && temaContainerName?.trim()
    ? temaContainerName
    : typeof temaLabel === "string"
    ? `${temaLabel}s`
    : temaLabel;
const noCourseNotesText = "No course notes yet.";
const temaPluralLower =
  typeof temaPluralDisplay === "string" ? temaPluralDisplay.toLowerCase() : "temas";
const noTemasMessage = `No ${temaPluralLower} recorded yet.`;

const contextSubject = context?.subject ?? generalLabel;
```

- [ ] **Step 2: Update the `resolveSubjectAndParcial` call to `resolvePlacement`**

Find:

```js
const placement = await resolveSubjectAndParcial(tp, {
```

Replace with:

```js
const placement = await resolvePlacement(tp, {
```

- [ ] **Step 3: Run tests**

```bash
node --test tests/universityNoteUtils.test.js
```

Expected: full suite green.

- [ ] **Step 4: Commit**

```bash
git add "_templates/Subject Hub.md"
git commit -m "refactor(template): use templateBootstrap and resolvePlacement in Subject Hub"
```

---

## Task 8: Update `Parcial Prep Note.md`

**Files:**
- Modify: `_templates/Parcial Prep Note.md`

- [ ] **Step 1: Replace the guard + load block with the bootstrap call**

Find and replace from `// --- 0. GUARD: must run on a fresh note ---` through `const contextParcial = context?.parcial ?? generalLabel;`:

```js
// --- 0. BOOTSTRAP ---
const ctx = await tp.user.templateBootstrap(tp, { requireNewFile: true });
if (!ctx) return;
const { currentFile, noteUtils, generalLabel, schema, constants, context } = ctx;
const {
  ensureFolderPath,
  ensureUniqueFileName,
  sanitizeFileName,
  toSlug,
  resolvePlacement,
} = noteUtils;

const isParcialEnabled = constants?.isParcialEnabled === true;

const noteTypes = schema?.types ?? {};
const lectureType = noteTypes.lecture ?? "lecture";
const conceptType = noteTypes.concept ?? "concept";
const parcialPrepType = noteTypes["parcial-prep"] ?? "parcial-prep";

const contextSubject = context?.subject ?? generalLabel;
const contextYear = context?.year ?? tp.frontmatter?.year ?? null;
const contextParcial = context?.parcial ?? generalLabel;
```

- [ ] **Step 2: Update the `resolveSubjectAndParcial` call to `resolvePlacement`**

Find:

```js
const placement = await resolveSubjectAndParcial(tp, {
```

Replace with:

```js
const placement = await resolvePlacement(tp, {
```

- [ ] **Step 3: Run tests**

```bash
node --test tests/universityNoteUtils.test.js
```

Expected: full suite green.

- [ ] **Step 4: Commit**

```bash
git add "_templates/Parcial Prep Note.md"
git commit -m "refactor(template): use templateBootstrap and resolvePlacement in Parcial Prep Note"
```

---

## Task 9: Update `Quick Create Concept.md`

**Files:**
- Modify: `_templates/Quick Create Concept.md`

- [ ] **Step 1: Replace the guard + load block with the bootstrap call**

Find and replace from `// --- 1. LOAD UTILITIES ---` (the line after `const currentFile = tp.config.target_file;` guard block) through `const codeLanguage = constants?.codeLanguage ?? "";`. Note: this template starts with just a `target_file` check; replace from that check all the way through the load block:

```js
// --- 0. BOOTSTRAP ---
const ctx = await tp.user.templateBootstrap(tp);
if (!ctx) return;
const { currentFile, noteUtils, generalLabel, schema, constants, context } = ctx;
const {
  ensureFolderPath,
  ensureUniqueFileName,
  sanitizeFileName,
  toSlug,
  resolveSubjectParcialTema,
} = noteUtils;

const noteTypes = schema?.types ?? {};
const conceptType = noteTypes.concept ?? "concept";
const lectureType = noteTypes.lecture ?? "lecture";
const codeLanguage = constants?.codeLanguage ?? "";
```

- [ ] **Step 2: Replace the Dataview block construction with `buildConceptBacklinksBlock`**

After the `placement` destructuring (where `baseUniversityPath` is available), find and delete the lines:

```js
const dvSource = JSON.stringify(baseUniversityPath ?? "");
const generalLiteral = JSON.stringify(generalLabel);
const lectureTypeLiteral = JSON.stringify(lectureType);

// Dataview block identical to the one in Concept Note Template so backlinks
// surface automatically once lectures reference this concept.
const dataviewBlock = [
  "```dataviewjs",
  ... (all 35 lines) ...
  "```",
].join("\n");
```

Replace with:

```js
const dataviewBlock = noteUtils.buildConceptBacklinksBlock({
  baseUniversityPath,
  generalLabel,
  lectureType,
});
```

- [ ] **Step 3: Run tests**

```bash
node --test tests/universityNoteUtils.test.js
```

Expected: full suite green.

- [ ] **Step 4: Commit**

```bash
git add "_templates/Quick Create Concept.md"
git commit -m "refactor(template): use templateBootstrap and buildConceptBacklinksBlock in Quick Create Concept"
```

---

## Task 10: Update `Assign Tema to Current Note.md`, `Link Concepts to Note.md`, and `Update Note Status.md`

These three templates only need the bootstrap swap — no resolver renames or Dataview changes. Each is shown in full below.

**Files:**
- Modify: `_templates/Assign Tema to Current Note.md`
- Modify: `_templates/Link Concepts to Note.md`
- Modify: `_templates/Update Note Status.md`

- [ ] **Step 1: Update `Assign Tema to Current Note.md`**

Find and replace from the opening `<%*` comment block through `const contextYear = contextYearRaw ?? tp.frontmatter?.year ?? null;` (the last line of the setup block, immediately before `// --- 2. RESOLVE PLACEMENT`):

```js
// --- 0. BOOTSTRAP ---
const ctx = await tp.user.templateBootstrap(tp);
if (!ctx) return;
const { currentFile, noteUtils, generalLabel, constants, context } = ctx;
const {
  ensureFolderPath,
  toSlug,
  resolveSubjectParcialTema,
} = noteUtils;

const contextTema = tp.frontmatter?.tema ?? generalLabel;
const contextSubject = context?.subject ?? generalLabel;
const contextYear = context?.year ?? tp.frontmatter?.year ?? null;
```

- [ ] **Step 2: Update `Link Concepts to Note.md`**

Find and replace from `// --- 1. LOAD UTILITIES ---` (the line after the `target_file` guard) through `const conceptType = noteTypes.concept ?? "concept";`:

```js
// --- 0. BOOTSTRAP ---
const ctx = await tp.user.templateBootstrap(tp);
if (!ctx) return;
const { currentFile, noteUtils, generalLabel, schema, context } = ctx;
const { constants } = noteUtils;

const noteTypes = schema?.types ?? {};
const conceptType = noteTypes.concept ?? "concept";
```

Also delete the now-redundant `target_file` guard that was above this block (the 4 lines starting with `const currentFile = tp.config.target_file;`). The bootstrap handles it.

- [ ] **Step 3: Update `Update Note Status.md`**

Find and replace from the `target_file` guard through `const knownTypes = new Set(Object.values(schema?.types ?? {}));` — specifically, replace just the guard + load section up to (and not including) `// --- 2. PICK TARGET STATUS ---`:

```js
// --- 0. BOOTSTRAP ---
const ctx = await tp.user.templateBootstrap(tp);
if (!ctx) return;
const { noteUtils, schema } = ctx;

const statuses = Array.isArray(schema?.statuses) && schema.statuses.length > 0
  ? schema.statuses
  : ["draft", "reviewed", "complete"];

const knownTypes = new Set(Object.values(schema?.types ?? {}));
```

- [ ] **Step 4: Run tests**

```bash
node --test tests/universityNoteUtils.test.js
```

Expected: full suite green.

- [ ] **Step 5: Commit**

```bash
git add "_templates/Assign Tema to Current Note.md" "_templates/Link Concepts to Note.md" "_templates/Update Note Status.md"
git commit -m "refactor(templates): use templateBootstrap in Assign Tema, Link Concepts, Update Note Status"
```

---

## Self-Review Notes

- **Spec coverage:** All four components covered. Component 1 (bootstrap) → Tasks 3–10. Component 2 (Dataview dedup) → Tasks 1, 5, 9. Component 3 (rename) → Task 2. Component 4 (template updates) → Tasks 4–10.
- **No placeholders:** All steps contain actual code.
- **Type consistency:** `buildConceptBacklinksBlock` is defined in Task 1 with params `{ baseUniversityPath, generalLabel, lectureType }` and called with exactly those names in Tasks 5 and 9. `resolvePlacement` is named in Task 2 and used in Tasks 7 and 8. `templateBootstrap` is created in Task 3 and called in Tasks 4–10.
- **Notice wording change:** The bootstrap standardizes the "no target file" Notice to `"⛔️ Abort: Templater has no target file."` Templates that previously had `"⛔️ Abort: No active file."` (Link Concepts, Quick Create Concept, Update Note Status) will now show the standardized message. This is intentional and mentioned in the spec as acceptable.

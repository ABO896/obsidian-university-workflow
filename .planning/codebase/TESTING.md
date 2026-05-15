# Testing Patterns

**Analysis Date:** 2026-05-14

## Test Framework

**Runner:**
- Node.js built-in test runner (`node:test`) — no external test framework
- No `package.json` / no npm install required
- Config: none (run directly with `node`)

**Assertion Library:**
- `node:assert/strict` — strict equality by default

**Run Commands:**
```bash
node tests/universityNoteUtils.test.js        # Run all tests
node --test tests/universityNoteUtils.test.js  # Alternative: TAP reporter
```

No watch mode, no coverage tooling, no CI config detected.

---

## Test File Organization

**Location:**
- Separate `tests/` directory at project root
- Test files are NOT co-located with source scripts

**Naming:**
- `<scriptName>.test.js` — mirrors the source file name
- Current file: `tests/universityNoteUtils.test.js`

**Structure:**
```
tests/
  universityNoteUtils.test.js   # 540 lines — only test file
_templater_scripts/
  universityNoteUtils.js        # source under test
  universityConfig.js
  scriptLoader.js
  getUniversityContext.js
  templateBootstrap.js
```

---

## What Can Be Tested

Only **pure helper functions** that do not touch the Obsidian `app` global are testable in Node.js. The `universityNoteUtils.js` factory exposes two categories of functions:

**Testable (Node.js-safe):**
- `toSlug`, `sanitizeFileName`, `sanitizeFolderName`
- `pathJoin`, `dedupePreserveOrder`, `sortCaseInsensitive`, `reorderWithPreference`
- `normalizeParcial`, `normalizeYear`
- `buildConceptBacklinksBlock`
- `constants` object (reflects config values)

**Not testable in Node.js (requires Obsidian runtime):**
- `ensureFolderPath`, `ensureUniqueFileName` — call `app.vault`
- `resolvePlacement`, `resolveSubjectParcialTema` — call `tp.system.suggester`
- `listSubjects`, `getParcialContext`, `getTemaContext` — call `app.vault`
- All `tp.user.*` calls in templates — require Obsidian Templater

---

## Test Structure

**Suite and Case Organization:**
```js
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');

const createUniversityNoteUtils = require('../_templater_scripts/universityNoteUtils');
const utils = createUniversityNoteUtils();
const { toSlug, normalizeParcial, ... } = utils;

// ---------------------------------------------------------------------------
// toSlug
// ---------------------------------------------------------------------------
describe('toSlug', () => {
  test('returns empty string for null', () => {
    assert.equal(toSlug(null), '');
  });

  test('strips diacritics (NFD normalization)', () => {
    assert.equal(toSlug('Álgebra Lineal'), 'algebra-lineal');
  });
});
```

**Patterns:**
- Factory is called ONCE at module scope: `const utils = createUniversityNoteUtils()`; shared across all describe blocks
- Each `describe` block covers exactly one exported function
- Section separator comments (`// ---`) visually delimit each describe group
- Test names are descriptive sentences in lowercase, not variable names

---

## Mocking

**No mocking framework used.**

**Obsidian globals (`app`) approach:**
- The `universityNoteUtils.js` factory is designed so pure helpers do not call `app`
- The test file calls `createUniversityNoteUtils()` directly — `app` is not defined in Node.js and is never needed for the tested functions
- The `getUniversityContext.js` module has an explicit comment about lazy initialization for this reason:
  ```js
  // Lazy-initialize shared state so the module is safe to require in test
  // environments where `app` may not yet be defined.
  ```

**What NOT to mock:**
- `universityConfig.js` — always loaded for real via `scriptLoader.js`; config values drive normalization behavior

**Smoke tests** cover modules that cannot be fully exercised but can be loaded:
```js
describe('templateBootstrap', () => {
  const templateBootstrap = require('../_templater_scripts/templateBootstrap');
  test('module exports a function', () => {
    assert.equal(typeof templateBootstrap, 'function');
  });
});
```

---

## Test Coverage Approach

**No coverage tooling configured.** Coverage is achieved through explicit enumeration of edge cases rather than automated measurement.

**Each function tested against:**
1. Null / undefined inputs (always first)
2. Empty string inputs
3. Case-insensitive variants (lowercase, uppercase, mixed)
4. Boundary values from config (e.g., `"Year 5"`, `"Final"`)
5. Pattern variants (e.g., `"Year1"` no-space, `"yr 2"` abbreviation, `"2nd year"` ordinal)
6. Completely unrecognised input → fallback value

Example from `normalizeYear`:
```js
test('returns null for null input', ...)
test('returns null for empty string', ...)
test('recognises "Year 1" (exact match)', ...)
test('recognises "year 1" (case-insensitive)', ...)
test('recognises "Year1" (no space)', ...)
test('recognises "yr 2" abbreviation', ...)
test('recognises "2nd year" ordinal form', ...)
test('recognises "ano 3" (Spanish abbreviation)', ...)
test('returns null for allowLiteral:false when input is not a year pattern', ...)
test('returns literal string when allowLiteral:true and no pattern matches', ...)
test('recognises "Año 1" (Spanish with tilde — NFD-normalised to "ano")', ...)
```

---

## Integration / Config Tests

Config-touching tests load `universityConfig.js` directly via `scriptLoader.js` inside the test body:

```js
describe('schema.statuses', () => {
  const path = require('path');
  const requireScript = require(path.join(__dirname, '../_templater_scripts/scriptLoader.js'));

  test('config exposes schema.statuses as an array', () => {
    const getConfig = requireScript('universityConfig.js');
    const config = getConfig();
    assert.ok(Array.isArray(config.schema?.statuses));
  });
});
```

This pattern verifies that:
- `scriptLoader.js` resolution works in Node.js
- `universityConfig.js` values stay in sync with what `universityNoteUtils.js` exposes

---

## Error Path Testing

```js
describe('scriptLoader', () => {
  test('throws a helpful error for a non-existent script', () => {
    assert.throws(
      () => requireScript('does-not-exist.js'),
      (err) => err.message.includes('does-not-exist.js')
    );
  });
});
```

Use `assert.throws(fn, predicateFn)` for error message assertions — never catch and re-throw.

---

## Alias / Compatibility Tests

Deprecated aliases are tested to guarantee they remain pointer-equal:

```js
test('resolveSubjectAndParcial is a deprecated alias pointing to resolvePlacement', () => {
  assert.equal(utils.resolveSubjectAndParcial, utils.resolvePlacement);
});
```

---

## Output Structure Tests (buildConceptBacklinksBlock)

For functions that generate multi-line string output, test structure rather than exact content:

```js
test('opens with ```dataviewjs fence', () => {
  assert.ok(result.startsWith('```dataviewjs'));
});

test('closes with ``` fence', () => {
  assert.ok(result.trimEnd().endsWith('```'));
});

test('includes JSON-stringified baseUniversityPath as dvSource', () => {
  assert.ok(result.includes('"Universidad"'));
});

test('uses multi-line if bodies — no collapsed "if (!entry) return false;"', () => {
  assert.ok(!result.includes('if (!entry) return false;'));
});
```

---

## Adding New Tests

**Where to add:** `tests/universityNoteUtils.test.js`

**When adding a new helper function to `universityNoteUtils.js`:**
1. Add a `describe('<functionName>', () => { ... })` block with a `// ---` separator comment
2. Always test null and empty-string inputs first
3. Test every documented behavior from comments in the source
4. If the function calls `app.*`, document it as "not testable in Node.js" with a smoke test only

**When adding a new script file (`_templater_scripts/*.js`):**
- Add a smoke test in the existing test file: verify `module exports a function`
- Add a `scriptLoader` test to verify it loads via `requireScript`
- If the script exports pure functions, add a new `describe` block for each

**Template files (`_templates/*.md`) are not tested** — Templater's `tp.*` calls have no Node.js equivalent. Manual verification in Obsidian is the only available approach.

---

*Testing analysis: 2026-05-14*

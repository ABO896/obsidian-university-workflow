const { test, describe } = require('node:test');
const assert = require('node:assert/strict');

// scriptLoader is also exercised indirectly — universityNoteUtils uses it to
// load universityConfig.  A direct smoke test lives at the bottom of this file.
const createUniversityNoteUtils = require('../_templater_scripts/universityNoteUtils');

// Factory is called once; all returned functions are pure helpers that don't
// touch the Obsidian `app` global, so they work fine in Node.js.
const utils = createUniversityNoteUtils();
const {
  toSlug,
  normalizeParcial,
  normalizeYear,
  sanitizeFileName,
  sanitizeFolderName,
  pathJoin,
  dedupePreserveOrder,
  sortCaseInsensitive,
  reorderWithPreference,
  constants,
} = utils;

// ---------------------------------------------------------------------------
// toSlug
// ---------------------------------------------------------------------------
describe('toSlug', () => {
  test('returns empty string for null', () => {
    assert.equal(toSlug(null), '');
  });

  test('returns empty string for undefined', () => {
    assert.equal(toSlug(undefined), '');
  });

  test('returns empty string for empty string', () => {
    assert.equal(toSlug(''), '');
  });

  test('lowercases ASCII text', () => {
    assert.equal(toSlug('Hello World'), 'hello-world');
  });

  test('replaces spaces with hyphens', () => {
    assert.equal(toSlug('foo bar baz'), 'foo-bar-baz');
  });

  test('strips diacritics (NFD normalization)', () => {
    assert.equal(toSlug('Álgebra Lineal'), 'algebra-lineal');
  });

  test('strips diacritics — accented e', () => {
    assert.equal(toSlug('Análisis'), 'analisis');
  });

  test('removes characters that are not word chars or spaces/hyphens', () => {
    assert.equal(toSlug('Hello, World!'), 'hello-world');
  });

  test('collapses multiple spaces into a single hyphen', () => {
    assert.equal(toSlug('foo   bar'), 'foo-bar');
  });

  test('trims leading and trailing whitespace', () => {
    assert.equal(toSlug('  foo  '), 'foo');
  });

  test('handles numeric strings', () => {
    assert.equal(toSlug('Year 1'), 'year-1');
  });

  test('handles already-slug strings unchanged', () => {
    assert.equal(toSlug('my-slug'), 'my-slug');
  });

  test('converts underscores to hyphens (same treatment as spaces)', () => {
    assert.equal(toSlug('hello_world'), 'hello-world');
  });

  test('collapses mixed spaces and underscores into a single hyphen', () => {
    assert.equal(toSlug('foo _ bar'), 'foo-bar');
  });
});

// ---------------------------------------------------------------------------
// sanitizeFileName
// ---------------------------------------------------------------------------
describe('sanitizeFileName', () => {
  test('returns empty string for null', () => {
    assert.equal(sanitizeFileName(null), '');
  });

  test('replaces reserved characters with hyphens', () => {
    const result = sanitizeFileName('hello:world/test*file');
    // colons, slashes, asterisks → hyphens
    assert.ok(!result.includes(':'));
    assert.ok(!result.includes('/'));
    assert.ok(!result.includes('*'));
  });

  test('does not alter safe names', () => {
    assert.equal(sanitizeFileName('Lecture 2024-01-01'), 'Lecture 2024-01-01');
  });

  test('trims surrounding whitespace', () => {
    assert.equal(sanitizeFileName('  file  '), 'file');
  });

  test('replaces backslash', () => {
    const result = sanitizeFileName('foo\\bar');
    assert.ok(!result.includes('\\'));
  });
});

// ---------------------------------------------------------------------------
// sanitizeFolderName
// ---------------------------------------------------------------------------
describe('sanitizeFolderName', () => {
  test('returns empty string for null', () => {
    assert.equal(sanitizeFolderName(null), '');
  });

  test('replaces forward slash with hyphen', () => {
    assert.equal(sanitizeFolderName('Matemáticas/Avanzadas'), 'Matemáticas-Avanzadas');
  });

  test('replaces backslash with hyphen', () => {
    assert.equal(sanitizeFolderName('foo\\bar'), 'foo-bar');
  });

  test('trims surrounding whitespace', () => {
    assert.equal(sanitizeFolderName('  folder  '), 'folder');
  });

  test('does not alter safe folder names', () => {
    assert.equal(sanitizeFolderName('Year 1'), 'Year 1');
  });
});

// ---------------------------------------------------------------------------
// pathJoin
// ---------------------------------------------------------------------------
describe('pathJoin', () => {
  test('joins two segments with a slash', () => {
    assert.equal(pathJoin('Universidad', 'Year 1'), 'Universidad/Year 1');
  });

  test('filters out empty and slash-only segments', () => {
    assert.equal(pathJoin('Universidad', '', 'Maths'), 'Universidad/Maths');
  });

  test('trims whitespace from each segment', () => {
    assert.equal(pathJoin(' Universidad ', ' Year 1 '), 'Universidad/Year 1');
  });

  test('handles a single segment', () => {
    assert.equal(pathJoin('Universidad'), 'Universidad');
  });

  test('handles null/undefined segments gracefully (filters them out)', () => {
    assert.equal(pathJoin('Universidad', null, 'Maths'), 'Universidad/Maths');
  });
});

// ---------------------------------------------------------------------------
// dedupePreserveOrder
// ---------------------------------------------------------------------------
describe('dedupePreserveOrder', () => {
  test('removes duplicate strings (case-insensitive)', () => {
    const result = dedupePreserveOrder(['Alpha', 'beta', 'ALPHA']);
    assert.deepEqual(result, ['Alpha', 'beta']);
  });

  test('keeps first occurrence', () => {
    const result = dedupePreserveOrder(['B', 'A', 'B']);
    assert.deepEqual(result, ['B', 'A']);
  });

  test('filters out empty/falsy values', () => {
    const result = dedupePreserveOrder(['A', '', null, undefined, 'B']);
    assert.deepEqual(result, ['A', 'B']);
  });

  test('returns empty array for empty input', () => {
    assert.deepEqual(dedupePreserveOrder([]), []);
  });

  test('returns empty array when called with no arguments', () => {
    assert.deepEqual(dedupePreserveOrder(), []);
  });
});

// ---------------------------------------------------------------------------
// sortCaseInsensitive
// ---------------------------------------------------------------------------
describe('sortCaseInsensitive', () => {
  test('sorts alphabetically ignoring case', () => {
    const result = sortCaseInsensitive(['Zebra', 'apple', 'Mango']);
    assert.deepEqual(result, ['apple', 'Mango', 'Zebra']);
  });

  test('does not mutate original array', () => {
    const original = ['C', 'A', 'B'];
    sortCaseInsensitive(original);
    assert.deepEqual(original, ['C', 'A', 'B']);
  });

  test('returns empty array for empty input', () => {
    assert.deepEqual(sortCaseInsensitive([]), []);
  });

  test('handles single element', () => {
    assert.deepEqual(sortCaseInsensitive(['only']), ['only']);
  });
});

// ---------------------------------------------------------------------------
// reorderWithPreference
// ---------------------------------------------------------------------------
describe('reorderWithPreference', () => {
  const GENERAL = constants.general; // "General"

  test('moves preferred item to front', () => {
    const result = reorderWithPreference(['Alpha', 'Beta', 'Gamma'], 'Beta');
    assert.equal(result[0], 'Beta');
  });

  test('keeps all items (no removal)', () => {
    const result = reorderWithPreference(['Alpha', 'Beta', 'Gamma'], 'Beta');
    assert.equal(result.length, 3);
  });

  test('returns unchanged array when preferred is General (default)', () => {
    const input = ['Alpha', 'Beta'];
    const result = reorderWithPreference(input, GENERAL);
    assert.deepEqual(result, input);
  });

  test('prepends preferred when not already in list', () => {
    const result = reorderWithPreference(['Alpha', 'Beta'], 'Delta');
    assert.equal(result[0], 'Delta');
    assert.equal(result.length, 3);
  });

  test('returns unchanged array when preferred is falsy', () => {
    const input = ['Alpha', 'Beta'];
    assert.deepEqual(reorderWithPreference(input, null), input);
  });
});

// ---------------------------------------------------------------------------
// normalizeParcial
// ---------------------------------------------------------------------------
describe('normalizeParcial', () => {
  const GENERAL = constants.general; // "General"

  test('returns General for null input', () => {
    assert.equal(normalizeParcial(null), GENERAL);
  });

  test('returns General for empty string', () => {
    assert.equal(normalizeParcial(''), GENERAL);
  });

  test('recognises "General" (exact match)', () => {
    assert.equal(normalizeParcial('General'), GENERAL);
  });

  test('recognises "general" (case-insensitive)', () => {
    assert.equal(normalizeParcial('general'), GENERAL);
  });

  test('maps "Parcial 1" to canonical value', () => {
    assert.equal(normalizeParcial('Parcial 1'), 'Parcial 1');
  });

  test('maps "parcial 1" (lowercase) to canonical value', () => {
    assert.equal(normalizeParcial('parcial 1'), 'Parcial 1');
  });

  test('maps "Parcial1" (no space) to canonical value via regex', () => {
    assert.equal(normalizeParcial('Parcial1'), 'Parcial 1');
  });

  test('maps "parcial-2" (hyphen separator) to canonical value', () => {
    assert.equal(normalizeParcial('parcial-2'), 'Parcial 2');
  });

  test('maps "Final" to the canonical final value', () => {
    assert.equal(normalizeParcial('Final'), 'Final');
  });

  test('maps "FINAL" (uppercase) to canonical final value', () => {
    assert.equal(normalizeParcial('FINAL'), 'Final');
  });

  test('returns General for completely unrecognised value', () => {
    assert.equal(normalizeParcial('some-unknown-thing'), GENERAL);
  });
});

// ---------------------------------------------------------------------------
// normalizeYear
// ---------------------------------------------------------------------------
describe('normalizeYear', () => {
  test('returns null for null input', () => {
    assert.equal(normalizeYear(null), null);
  });

  test('returns null for empty string', () => {
    assert.equal(normalizeYear(''), null);
  });

  test('recognises "Year 1" (exact match)', () => {
    assert.equal(normalizeYear('Year 1'), 'Year 1');
  });

  test('recognises "year 1" (case-insensitive)', () => {
    assert.equal(normalizeYear('year 1'), 'Year 1');
  });

  test('recognises "Year1" (no space)', () => {
    assert.equal(normalizeYear('Year1'), 'Year 1');
  });

  test('recognises "yr 2" abbreviation', () => {
    assert.equal(normalizeYear('yr 2'), 'Year 2');
  });

  test('recognises "2nd year" ordinal form', () => {
    assert.equal(normalizeYear('2nd year'), 'Year 2');
  });

  test('recognises "ano 3" (Spanish abbreviation)', () => {
    assert.equal(normalizeYear('ano 3'), 'Year 3');
  });

  test('returns null for allowLiteral:false when input is not a year pattern', () => {
    assert.equal(normalizeYear('Maths', { allowLiteral: false }), null);
  });

  test('returns literal string when allowLiteral:true and no pattern matches', () => {
    assert.equal(normalizeYear('Custom', { allowLiteral: true }), 'Custom');
  });

  test('returns null for "General" when allowLiteral:true (general is excluded)', () => {
    // normalizeYear treats GENERAL_LABEL as non-year even with allowLiteral:true
    assert.equal(normalizeYear(constants.general, { allowLiteral: true }), null);
  });

  test('recognises "Year 5" (boundary of configured years)', () => {
    assert.equal(normalizeYear('Year 5'), 'Year 5');
  });

  test('recognises "Año 1" (Spanish with tilde — NFD-normalised to "ano")', () => {
    assert.equal(normalizeYear('Año 1'), 'Year 1');
  });

  test('recognises "año 3" (lowercase with tilde)', () => {
    assert.equal(normalizeYear('año 3'), 'Year 3');
  });
});

// ---------------------------------------------------------------------------
// features.parcial flag (constants.isParcialEnabled)
// ---------------------------------------------------------------------------
describe('features.parcial flag', () => {
  // Default config has features.parcial = false, so isParcialEnabled should be false.
  test('isParcialEnabled is false by default', () => {
    const defaultUtils = createUniversityNoteUtils();
    assert.equal(defaultUtils.constants.isParcialEnabled, false);
  });

  test('isParcialEnabled is exposed via constants', () => {
    // The value must be a boolean, not undefined.
    assert.equal(typeof constants.isParcialEnabled, 'boolean');
  });

  test('features object is exposed on the returned utils', () => {
    const u = createUniversityNoteUtils();
    assert.ok(u.features && typeof u.features === 'object', 'features should be an object');
  });

  test('config has a features.parcial key', () => {
    const path = require('path');
    const requireScript = require(path.join(__dirname, '../_templater_scripts/scriptLoader.js'));
    const getConfig = requireScript('universityConfig.js');
    const config = getConfig();
    assert.ok('features' in config, 'config should have features key');
    assert.ok('parcial' in config.features, 'features should have parcial key');
    assert.equal(typeof config.features.parcial, 'boolean');
  });
});

// ---------------------------------------------------------------------------
// scriptLoader (smoke test)
// ---------------------------------------------------------------------------
describe('scriptLoader', () => {
  // scriptLoader is loaded indirectly by universityNoteUtils.  We also require
  // it directly here to verify it resolves sibling scripts in Node.js.
  const path = require('path');
  const requireScript = require(path.join(__dirname, '../_templater_scripts/scriptLoader.js'));

  test('loads universityConfig via requireScript', () => {
    const getConfig = requireScript('universityConfig.js');
    assert.equal(typeof getConfig, 'function');
    const config = getConfig();
    assert.ok(config && typeof config === 'object', 'config should be an object');
    assert.ok(config.fs && config.labels, 'config should have fs and labels');
  });

  test('throws a helpful error for a non-existent script', () => {
    assert.throws(
      () => requireScript('does-not-exist.js'),
      (err) => err.message.includes('does-not-exist.js')
    );
  });
});

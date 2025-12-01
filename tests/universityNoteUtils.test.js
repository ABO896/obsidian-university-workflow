const test = require('node:test');
const assert = require('node:assert');

const createUniversityNoteUtils = require('../_templater_scripts/universityNoteUtils');

const { toSlug } = createUniversityNoteUtils();

test('toSlug gracefully handles null input', () => {
  assert.doesNotThrow(() => {
    const result = toSlug(null);
    assert.strictEqual(result, '');
  });
});


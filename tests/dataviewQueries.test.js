// Source-contract tests for Dataview queries emitted by the templates.
// Templates run inside Obsidian, so these check the generated query text
// against the Dataview docs rather than executing it.
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const read = (name) =>
  fs.readFileSync(path.join(__dirname, '../_templates', name), 'utf8');

const TASK_TEMPLATES = ['Subject Hub.md', 'University Dashboard.md', 'Parcial Prep Note.md'];
const REVIEW_TEMPLATES = ['Subject Hub.md', 'University Dashboard.md'];

describe('TASK queries sort by the task-level due field', () => {
  // file.due is not an implicit field; in TASK queries the due date is `due`.
  for (const name of TASK_TEMPLATES) {
    test(`${name} does not sort tasks by file.due`, () => {
      assert.ok(!read(name).includes('SORT file.due'), 'found SORT file.due');
    });
    test(`${name} sorts tasks by due`, () => {
      assert.ok(read(name).includes('SORT due ASC'), 'expected SORT due ASC');
    });
  }
});

describe('Due-for-review queries ignore notes without a next_review date', () => {
  // `null <= date(today)` is true in Dataview, so a missing next_review would
  // otherwise list the note as due.
  for (const name of REVIEW_TEMPLATES) {
    test(`${name} guards date(next_review) with a type check`, () => {
      const whereLines = read(name)
        .split('\n')
        .filter((line) => line.includes('date(next_review) <= date(today)'));
      assert.ok(whereLines.length > 0, 'expected a due-for-review WHERE clause');
      for (const line of whereLines) {
        assert.ok(
          line.includes('typeof(date(next_review)) = "date"'),
          `missing type guard: ${line.trim()}`
        );
      }
    });
  }
});

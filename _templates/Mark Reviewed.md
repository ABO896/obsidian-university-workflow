<%*
// Depends on: _templater_scripts/templateBootstrap.js
//
// Utility template: updates spaced repetition fields on the current concept note.
// Run after reviewing a concept note to record recall quality and schedule the
// next review date. Implements a simple difficulty-based interval system without
// requiring any external plugin.
//
// Workflow:
//   1. Reads reviewIntervals from config (defaults: easy=14, medium=7, hard=3, blank=1).
//   2. Prompts for recall difficulty.
//   3. Sets last_reviewed = today and next_review = today + interval via
//      processFrontMatter inside tp.hooks.on_all_templates_executed (safe write).
//
// NOTE: This template intentionally does NOT set tR — the note body is untouched.

// --- 0. BOOTSTRAP ---
const ctx = await tp.user.templateBootstrap(tp);
if (!ctx) return;
const { currentFile, config } = ctx;

const reviewIntervals = config?.schema?.reviewIntervals ?? { easy: 14, medium: 7, hard: 3, blank: 1 };

// --- 1. PICK DIFFICULTY ---
const difficultyLabels = [
  `Easy — understood on first attempt  →  +${reviewIntervals.easy ?? 14} days`,
  `Medium — needed to think  →  +${reviewIntervals.medium ?? 7} days`,
  `Hard — struggled significantly  →  +${reviewIntervals.hard ?? 3} days`,
  `Blank — could not recall  →  +${reviewIntervals.blank ?? 1} day`,
];
const difficultyKeys = ["easy", "medium", "hard", "blank"];

const difficulty = await tp.system.suggester(
  difficultyLabels,
  difficultyKeys,
  false,
  `How well did you recall "${currentFile.basename}"?`
);

if (!difficulty) {
  new Notice("ℹ️ Mark Reviewed cancelled.", 5_000);
  return;
}

const interval = reviewIntervals[difficulty] ?? 7;
const today = tp.date.now("YYYY-MM-DD");
const nextReview = tp.date.now("YYYY-MM-DD", interval);

// --- 2. UPDATE FRONTMATTER IN HOOK ---
// Running inside the hook avoids the race condition where Templater's own
// write pass could overwrite a processFrontMatter call made earlier.
tp.hooks.on_all_templates_executed(async () => {
  await tp.app.fileManager.processFrontMatter(currentFile, (fm) => {
    fm.last_reviewed = today;
    fm.next_review = nextReview;
  });
});

new Notice(
  `🔔 Next review of "${currentFile.basename}" scheduled for ${nextReview} (${difficulty})`,
  6_000
);
%>

<%*
// Depends on: _templater_scripts/universityNoteUtils.js, _templater_scripts/universityConfig.js
//
// Utility template: bulk-update the `status` frontmatter field across multiple
// university notes in a single operation.
//
// Workflow:
//   1. Reads available statuses from schema.statuses in config.
//   2. Prompts for the target status to assign.
//   3. Discovers all university notes that are NOT already at that status.
//   4. Shows a multi-select with label format:
//        "Note Title [Course] (current_status)"
//   5. Updates each selected note via processFrontMatter inside
//      tp.hooks.on_all_templates_executed (safe post-execution write).
//      Each file is wrapped in try/catch so a single failure does not abort
//      the rest of the batch.
//
// NOTE: This template intentionally does NOT set tR — no note body is modified.
// The active file when the template is triggered is irrelevant; any note works.

const currentFile = tp.config.target_file;
if (!currentFile) {
  new Notice("⛔️ Abort: No active file.", 10_000);
  return;
}

// --- 1. LOAD UTILITIES ---
const noteUtils = await tp.user.universityNoteUtils();
const { constants = {}, schema = {} } = noteUtils ?? {};

if (!noteUtils) {
  new Notice("⛔️ Abort: University note utilities are unavailable.", 10_000);
  return;
}

// Status values come from config so they stay in sync with any customisation.
// Fall back to a sensible default only if the config key is absent.
const statuses = Array.isArray(schema?.statuses) && schema.statuses.length > 0
  ? schema.statuses
  : ["draft", "reviewed", "complete"];

// Use the configured type values to filter for university-style notes.
const knownTypes = new Set(Object.values(schema?.types ?? {}));

// --- 2. PICK TARGET STATUS ---
if (typeof tp.system.multi_suggester !== "function") {
  new Notice("⛔️ Abort: tp.system.multi_suggester requires Templater ≥ 2.16.", 10_000);
  return;
}

const newStatus = await tp.system.suggester(
  statuses,
  statuses,
  false,
  "Set status to"
);

if (!newStatus) {
  new Notice("ℹ️ Status update cancelled.", 5_000);
  return;
}

// --- 3. DISCOVER CANDIDATES ---
// Only show notes that:
//   • have a recognized university type (lecture, concept, general, etc.)
//   • have a status field
//   • are NOT already at the target status
const allFiles = tp.app.vault.getMarkdownFiles?.() ?? [];
const candidates = allFiles
  .filter((f) => {
    const fm = tp.app.metadataCache.getFileCache(f)?.frontmatter;
    if (!fm) return false;
    const hasKnownType = knownTypes.size === 0 || knownTypes.has(fm.type);
    return (
      hasKnownType &&
      typeof fm.status === "string" &&
      fm.status !== newStatus
    );
  })
  .sort((a, b) => a.basename.localeCompare(b.basename));

if (candidates.length === 0) {
  new Notice(`ℹ️ No notes found that aren't already "${newStatus}".`, 7_000);
  return;
}

// Build display labels: "Note Title [Course] (current_status)"
const displayLabels = candidates.map((f) => {
  const fm = tp.app.metadataCache.getFileCache(f)?.frontmatter ?? {};
  const courseTag = fm.course ? ` [${fm.course}]` : "";
  return `${f.basename}${courseTag} (${fm.status})`;
});

// --- 4. MULTI-SELECT ---
const picked = await tp.system.multi_suggester(
  displayLabels,
  candidates,
  false,
  `Mark as "${newStatus}"`
);

if (!Array.isArray(picked) || picked.length === 0) {
  new Notice("ℹ️ No notes selected.", 5_000);
  return;
}

// --- 5. UPDATE FRONTMATTER IN HOOK ---
// Running inside the hook avoids the race condition where Templater's own
// write pass could overwrite a processFrontMatter call made earlier.
tp.hooks.on_all_templates_executed(async () => {
  let updated = 0;
  let failed = 0;

  for (const file of picked) {
    try {
      await tp.app.fileManager.processFrontMatter(file, (fm) => {
        fm.status = newStatus;
      });
      updated++;
    } catch (err) {
      console.error(`Templater: Failed to update status for "${file.path}"`, err);
      failed++;
    }
  }

  const failNote = failed > 0 ? ` (${failed} failed — see console)` : "";
  new Notice(
    `✅ Updated ${updated} note${updated === 1 ? "" : "s"} to "${newStatus}"${failNote}`,
    6_000
  );
});
%>

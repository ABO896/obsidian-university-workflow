<%*
// Depends on: _templater_scripts/getUniversityContext.js, _templater_scripts/universityNoteUtils.js, _templater_scripts/universityConfig.js
//
// Utility template: run on any lecture or general note to retroactively link
// existing concept notes via its `concepts` frontmatter array.
//
// This mirrors the concept multi-select from Lecture Note but can be triggered
// at any time, making it easy to wire up concepts discovered after a lecture.
//
// Workflow:
//   1. Reads the current note's `course` frontmatter to scope the concept list.
//   2. Shows a multi-select of all concept notes for that course.
//      Already-linked concepts are prefixed with "✓" for visibility.
//   3. Appends newly selected links to the `concepts` array via
//      tp.hooks.on_all_templates_executed + processFrontMatter (safe write).
//
// NOTE: This template intentionally does NOT set tR — the note body is untouched.

const currentFile = tp.config.target_file;
if (!currentFile) {
  new Notice("⛔️ Abort: No active file.", 10_000);
  return;
}

// --- 1. LOAD UTILITIES ---
const getConfig = tp.user.universityConfig;
const config = typeof getConfig === "function" ? await getConfig() : null;
const configLabels = config?.labels ?? {};

const context = await tp.user.getUniversityContext(currentFile);

const noteUtils = await tp.user.universityNoteUtils();
const { constants = {}, schema = {} } = noteUtils ?? {};

if (!noteUtils) {
  new Notice("⛔️ Abort: University note utilities are unavailable.", 10_000);
  return;
}

const generalLabel = constants?.general ?? configLabels.general;
if (!generalLabel) {
  new Notice("⛔️ Abort: University general label is not configured.", 10_000);
  return;
}

const noteTypes = schema?.types ?? {};
const conceptType = noteTypes.concept ?? "concept";

// --- 2. RESOLVE COURSE SCOPE ---
// Frontmatter takes precedence over path-inferred context so manual edits
// to the course key are respected.
const course = tp.frontmatter?.course ?? context?.subject ?? generalLabel;

// --- 3. GUARD: multi_suggester is required ---
if (typeof tp.system.multi_suggester !== "function") {
  new Notice("⛔️ Abort: tp.system.multi_suggester requires Templater ≥ 2.16.", 10_000);
  return;
}

// --- 4. DISCOVER CONCEPT NOTES FOR THIS COURSE ---
const allFiles = tp.app.vault.getMarkdownFiles?.() ?? [];
const conceptFiles = allFiles
  .filter((f) => {
    const cache = tp.app.metadataCache.getFileCache(f);
    return (
      cache?.frontmatter?.type === conceptType &&
      (cache?.frontmatter?.course ?? generalLabel) === course
    );
  })
  .sort((a, b) => a.basename.localeCompare(b.basename));

if (conceptFiles.length === 0) {
  new Notice(`ℹ️ No concept notes found for course "${course}".`, 7_000);
  return;
}

// Build a set of already-linked concept names so the picker can mark them.
const existingConcepts = Array.isArray(tp.frontmatter?.concepts)
  ? tp.frontmatter.concepts
  : [];
const existingNames = new Set(
  existingConcepts.map((entry) => {
    // Links may be stored as strings "[[Name]]" or as Obsidian link objects.
    const raw = typeof entry === "object"
      ? (entry?.path ?? "")
      : String(entry ?? "");
    // Strip [[ ]], path separators, and extension to get the bare basename.
    return raw
      .replace(/^\[\[/, "")
      .replace(/\]\]$/, "")
      .split("/")
      .pop()
      ?.replace(/\.md$/, "")
      .toLowerCase() ?? "";
  })
);

// Prefix already-linked concepts with ✓ so the user can see at a glance
// what has been wired up versus what is still pending.
const displayLabels = conceptFiles.map((f) =>
  existingNames.has(f.basename.toLowerCase()) ? `✓ ${f.basename}` : f.basename
);

// --- 5. MULTI-SELECT CONCEPTS ---
const picked = await tp.system.multi_suggester(
  displayLabels,
  conceptFiles,
  false,
  `Link concepts to "${currentFile.basename}" (course: ${course})`
);

if (!Array.isArray(picked) || picked.length === 0) {
  new Notice("ℹ️ No concepts selected.", 5_000);
  return;
}

// --- 6. UPDATE FRONTMATTER ---
const currentFilePath = currentFile.path;
const newLinks = picked.map((f) => `[[${f.basename}]]`);

tp.hooks.on_all_templates_executed(async () => {
  const targetFile = tp.app.vault.getAbstractFileByPath(currentFilePath) ?? currentFile;
  await tp.app.fileManager.processFrontMatter(targetFile, (fm) => {
    const existing = Array.isArray(fm.concepts) ? fm.concepts : [];
    // Build a normalised set of already-present links for deduplication.
    const presentSet = new Set(
      existing.map((entry) => {
        const raw = typeof entry === "object"
          ? (entry?.path ?? "")
          : String(entry ?? "");
        return raw.toLowerCase();
      })
    );
    const toAdd = newLinks.filter((link) => !presentSet.has(link.toLowerCase()));
    if (toAdd.length > 0) {
      fm.concepts = [...existing, ...toAdd];
    }
  });
});

const addedCount = newLinks.length;
new Notice(
  `🔗 Linked ${addedCount} concept${addedCount === 1 ? "" : "s"} to "${currentFile.basename}"`,
  5_000
);
%>

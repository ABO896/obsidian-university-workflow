<%*
// Depends on: _templater_scripts/getUniversityContext.js, _templater_scripts/universityNoteUtils.js, _templater_scripts/universityConfig.js
//
// Utility template: run on any lecture or general note to quickly spin up a
// linked concept note from a text selection (or manual prompt), then wire it
// back into the current note's `concepts` frontmatter array.
//
// Workflow:
//   1. Highlights a term (optional) → pre-fills the concept name prompt.
//   2. Resolves placement — inherits course/year/tema from the current note
//      so dialogs only appear when context is ambiguous.
//   3. Creates the concept note via tp.file.create_new (no file move needed).
//   4. Appends [[link]] at the active editor cursor via tp.file.cursor_append.
//   5. Adds the new link to the current note's `concepts` frontmatter array
//      via tp.hooks.on_all_templates_executed so the write is safe.
//
// NOTE: This template intentionally does NOT set tR — the current note body
// is left untouched; only the cursor position and frontmatter are modified.

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
const {
  ensureFolderPath,
  ensureUniqueFileName,
  sanitizeFileName,
  toSlug,
  resolveSubjectParcialTema,
  constants = {},
  schema = {},
} = noteUtils ?? {};

if (!noteUtils || !resolveSubjectParcialTema) {
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
const lectureType = noteTypes.lecture ?? "lecture";
const codeLanguage = constants?.codeLanguage ?? "";

// --- 2. GET CONCEPT NAME ---
// Pre-fill with any text the user had selected before running the template.
const selectionDefault = tp.file.selection?.() ?? "";
const nameInput = await tp.system.prompt(
  "New concept name",
  selectionDefault || null
);

if (!nameInput?.trim()) {
  new Notice("ℹ️ Concept creation cancelled.", 5_000);
  return;
}

const conceptName = sanitizeFileName(nameInput.trim());
if (!conceptName) {
  new Notice("⛔️ Abort: Invalid concept name.", 10_000);
  return;
}

// --- 3. RESOLVE PLACEMENT ---
// Inherit subject/year/tema from the current note's frontmatter so that
// dialogs only appear when something is genuinely ambiguous.
const contextSubject = tp.frontmatter?.course ?? context?.subject ?? generalLabel;
const contextYear = tp.frontmatter?.year ?? context?.year ?? null;
const contextTema = tp.frontmatter?.tema ?? generalLabel;

const placement = await resolveSubjectParcialTema(tp, {
  currentFile,
  contextSubject,
  contextYear,
  includeParcial: false,
  // Only prompt for year when it cannot be inferred from context, preventing
  // an unnecessary dialog when the lecture note already has year in frontmatter.
  promptYearWhen: "missing",
  contextTema,
});

const {
  targetFolder,
  subject: resolvedSubject = generalLabel,
  year: resolvedYear = null,
  tema: resolvedTema = generalLabel,
  baseUniversityPath,
} = placement ?? {};

if (!targetFolder) {
  new Notice("⛔️ Abort: Could not determine destination folder.", 10_000);
  return;
}

await ensureFolderPath(targetFolder);

const subject = resolvedSubject || generalLabel;
const year = resolvedYear?.toString().trim() || null;
const tema = resolvedTema?.toString().trim() || generalLabel;

// Unique file name to avoid collisions.
const extension = "md";
const finalFileName = ensureUniqueFileName(targetFolder, conceptName, extension);

// --- 4. BUILD CONCEPT NOTE CONTENT ---
// Mirror the structure of Concept Note Template so Dataview queries are compatible.
const today = tp.date.now("YYYY-MM-DD");
const dvSource = JSON.stringify(baseUniversityPath ?? "");
const generalLiteral = JSON.stringify(generalLabel);
const lectureTypeLiteral = JSON.stringify(lectureType);

const frontmatterLines = [
  "---",
  `type: ${conceptType}`,
  `course: ${JSON.stringify(subject)}`,
  year ? `year: ${JSON.stringify(year)}` : null,
  `tema: ${JSON.stringify(tema)}`,
  `created: ${JSON.stringify(today)}`,
  "status: draft",
  "aliases: []",
  `tags: [${conceptType}]`,
  "---",
]
  .filter(Boolean)
  .join("\n");

// Dataview block identical to the one in Concept Note Template so backlinks
// surface automatically once lectures reference this concept.
const dataviewBlock = [
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
  `      if (!entry) return false;`,
  `      const entryValue = entry.path ?? entry.toString?.() ?? entry;`,
  `      if (!entryValue) return false;`,
  `      const lowered = entryValue.toString().toLowerCase();`,
  `      return lowered === targetName || lowered === targetPath.toLowerCase();`,
  `    });`,
  `    const linkMatch = (page.file?.outlinks ?? []).some((link) => link.path === targetPath);`,
  `    return conceptMatch || linkMatch;`,
  `  })`,
  `  .array()`,
  `  .sort((a, b) => dv.compare(sortValue(a), sortValue(b)));`,
  ``,
  `dv.list(matches.map((page) => page.file.link));`,
  "```",
].join("\n");

const conceptContent = [
  frontmatterLines,
  "",
  `# 💡 ${finalFileName}`,
  "",
  "## 📜 Definition",
  "*A formal, textbook-style definition of the concept.*",
  "- ",
  "",
  "## 🧠 Analogy or Metaphor",
  "*How can I explain this concept using a simple, real-world analogy?*",
  "- [ ] ",
  "",
  "## 🧭 Explanation in My Own Words",
  "*The Feynman Technique: Explaining it simply to prove I understand it.*",
  "- [ ] Insight",
  "",
  "---",
  "",
  "## 🔗 Connections",
  "*This concept is mentioned in the following lectures and notes:*",
  "",
  dataviewBlock,
  "",
].join("\n");

// --- 5. CREATE THE CONCEPT NOTE ---
// tp.file.create_new writes the note directly — no move needed since we
// specify the target folder up front.
const tFolder = tp.app.vault.getAbstractFileByPath(targetFolder);
await tp.file.create_new(conceptContent, finalFileName, false, tFolder ?? targetFolder);

// --- 6. WIRE INTO THE CURRENT NOTE ---
// Append [[link]] at the active editor cursor so the student can place it
// exactly where they need it in the lecture note body.
tp.file.cursor_append(`[[${finalFileName}]]`);

// Add the new link to the current note's `concepts` array after Templater
// finishes its own write pass, matching the hook pattern from Assign Tema.
const currentFilePath = currentFile.path;
tp.hooks.on_all_templates_executed(async () => {
  const targetFile = tp.app.vault.getAbstractFileByPath(currentFilePath) ?? currentFile;
  await tp.app.fileManager.processFrontMatter(targetFile, (fm) => {
    const existing = Array.isArray(fm.concepts) ? fm.concepts : [];
    const newLink = `[[${finalFileName}]]`;
    // Skip if a link to this concept already exists in the array.
    const alreadyLinked = existing.some((entry) => {
      const val = typeof entry === "object"
        ? (entry?.path ?? "")
        : String(entry ?? "");
      return val.toLowerCase().includes(finalFileName.toLowerCase());
    });
    if (!alreadyLinked) {
      fm.concepts = [...existing, newLink];
    }
  });
});

new Notice(`💡 Created concept "${finalFileName}" in ${targetFolder}`, 5_000);
%>

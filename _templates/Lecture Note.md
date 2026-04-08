<%*
// Depends on: _templater_scripts/getUniversityContext.js, _templater_scripts/universityNoteUtils.js, _templater_scripts/universityConfig.js

// --- 0. GUARD: must run on a fresh note ---
// RunMode 0 (CreateNewFile) guarantees a brand-new file; skip the basename
// check in that case.  For all other modes (hotkey on existing file, etc.)
// we require the standard "Untitled" starting point.
const currentFile = tp.config.target_file;
if (!currentFile) {
  new Notice("⛔️ Abort: Templater has no target file.", 10_000);
  return;
}

const isCreatingNewFile = tp.config.run_mode === 0;
if (!isCreatingNewFile) {
  const basename = currentFile.basename.toLowerCase();
  if (!basename.startsWith("untitled") && !basename.startsWith("sin título")) {
    new Notice("⛔️ Abort: Template must be run in a new 'Untitled' note.", 10_000);
    return;
  }
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

if (!noteUtils) {
  new Notice("⛔️ Abort: University note utilities are unavailable.", 10_000);
  return;
}

if (!resolveSubjectParcialTema) {
  new Notice("⛔️ Abort: Placement helper is unavailable.", 10_000);
  return;
}

const generalLabel = constants?.general ?? configLabels.general;
if (!generalLabel) {
  new Notice("⛔️ Abort: University general label is not configured.", 10_000);
  return;
}

const noteTypes = schema?.types ?? {};
const lectureType = noteTypes.lecture ?? "lecture";
const conceptType = noteTypes.concept ?? "concept";
const codeLanguage = constants?.codeLanguage ?? "";

const contextSubject = context?.subject ?? generalLabel;
const contextYear = context?.year ?? tp.frontmatter?.year ?? null;

// --- 2. RESOLVE PLACEMENT (shows year → subject → tema dialogs) ---
const placement = await resolveSubjectParcialTema(tp, {
  currentFile,
  contextSubject,
  contextYear,
  includeParcial: false,
  promptYearWhen: "always",
  contextTema: generalLabel,
});

const {
  targetFolder,
  subject: resolvedSubject = generalLabel,
  year: resolvedYear = null,
  tema: resolvedTema = generalLabel,
} = placement ?? {};

const subject = resolvedSubject || generalLabel;
const year = resolvedYear?.toString().trim() || null;
const tema = resolvedTema?.toString().trim() || generalLabel;

if (!targetFolder) {
  new Notice("⛔️ Abort: Could not determine destination folder.", 10_000);
  return;
}

await ensureFolderPath(targetFolder);

// --- 3. PROMPT FOR TOPIC ---
// Pre-fill with any text the user had selected before running the template.
const selectionDefault = tp.file.selection?.() ?? "";
const topicInput = await tp.system.prompt(
  "Lecture Topic (optional)",
  selectionDefault || null
);
const rawTopic = topicInput?.trim();
const safeTopic = sanitizeFileName(rawTopic) || "Untitled Topic";

const today = tp.date.now("YYYY-MM-DD");
const baseTitle = sanitizeFileName(`Lecture ${today}`);
const noteTitle = rawTopic ? sanitizeFileName(`${baseTitle} - ${safeTopic}`) : baseTitle;
const headingTitle = rawTopic ? safeTopic : noteTitle;
const extension = currentFile?.extension ?? "md";
const finalFileName = ensureUniqueFileName(targetFolder, noteTitle, extension);
const destinationFilePath = `${targetFolder}/${finalFileName}.${extension}`;
const destinationMovePath = `${targetFolder}/${finalFileName}`;
const needsMove = currentFile?.path !== destinationFilePath;

// --- 4. MULTI-SELECT CONCEPTS (tp.system.multi_suggester — Templater ≥ 2.16) ---
// Discover concept notes already filed under the same course and offer
// a multi-select so the student can tag which concepts this lecture covers.
// Falls back gracefully when multi_suggester isn't available (older installs).
let conceptLinks = [];
if (typeof tp.system.multi_suggester === "function") {
  const allFiles = tp.app.vault.getMarkdownFiles?.() ?? [];
  const conceptFiles = allFiles
    .filter((f) => {
      const cache = tp.app.metadataCache.getFileCache(f);
      return (
        cache?.frontmatter?.type === conceptType &&
        cache?.frontmatter?.course === subject
      );
    })
    .sort((a, b) => a.basename.localeCompare(b.basename));

  if (conceptFiles.length > 0) {
    const picked = await tp.system.multi_suggester(
      conceptFiles.map((f) => f.basename),
      conceptFiles,
      false,
      "Concepts covered in this lecture (multi-select, optional)"
    );
    if (Array.isArray(picked) && picked.length > 0) {
      conceptLinks = picked.map((f) => `"[[${f.basename}]]"`);
    }
  }
}

// --- 5. BUILD CONTENT ---
const subjectSlug = toSlug(subject);
const temaSlug = toSlug(tema);
const lectureTags =
  [
    subjectSlug && `#${subjectSlug}`,
    temaSlug && temaSlug !== subjectSlug ? `#${temaSlug}` : null,
    "#lecture",
  ]
    .filter(Boolean)
    .join(" ");
const alias = JSON.stringify(headingTitle);
const created = today;
const conceptsLine =
  conceptLinks.length > 0 ? `concepts: [${conceptLinks.join(", ")}]` : "concepts: []";

const frontMatter = [
  "---",
  `type: ${lectureType}`,
  `course: ${JSON.stringify(subject)}`,
  year ? `year: ${JSON.stringify(year)}` : null,
  `tema: ${JSON.stringify(tema)}`,
  `created: ${JSON.stringify(created)}`,
  "status: draft",
  `aliases: [${alias}]`,
  conceptsLine,
  "---",
]
  .filter(Boolean)
  .join("\n");

// Multiple cursors allow Tab-key navigation between the most-edited sections:
//   cursor(1) → first Summary takeaway  (filled during/right after the lecture)
//   cursor(2) → first Definition entry  (terminology captured live)
//   cursor(3) → Questions section       (open questions noted at the end)
let content = `${frontMatter}\n`;
content += lectureTags ? `${lectureTags}\n\n` : "";
content += `# 🧠 ${headingTitle}\n\n`;
content += `## 📜 Summary\n- [ ] ${tp.file.cursor(1)}\n- [ ] Key takeaway 2\n\n`;
content += `## 📚 Definitions\n- [ ] ${tp.file.cursor(2)} :: Definition\n\n`;
content += "## 🧩 Key Concepts\n- [ ] Concept :: Insight\n\n";
content += "## 💡 Examples or Code\n";
content += `\`\`\`${codeLanguage}\n`;
content += `// ${safeTopic}\n`;
content += "```\n\n";
content += "## 🧭 Explanation in My Own Words\n- [ ] Insight\n\n";
content += "## 🔗 Connections\n- [ ] Related topic\n\n";
content += `## 🧠 Questions I Still Have\n- [ ] ${tp.file.cursor(3)}\n`;

tR = content;

// --- 6. PLACE FILE ---
if (needsMove) {
  await tp.file.move(destinationMovePath);
}
new Notice(`📘 Lecture stored in ${targetFolder}`, 5_000);
%>

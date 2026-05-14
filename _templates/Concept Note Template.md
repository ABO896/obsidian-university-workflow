<%*
// Depends on: _templater_scripts/templateBootstrap.js

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

// --- 1. RESOLVE PLACEMENT (shows year → subject → tema dialogs) ---
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
  baseUniversityPath,
} = placement ?? {};

const selectedSubject = resolvedSubject || generalLabel;
const selectedYear = resolvedYear?.toString().trim() || null;
const selectedTema = resolvedTema?.toString().trim() || generalLabel;

if (!targetFolder) {
  new Notice("⛔️ Abort: Could not determine destination folder.", 10_000);
  return;
}

await ensureFolderPath(targetFolder);

// --- 2. PLACE FILE (before writing tR so the file is at its final path) ---
const today = tp.date.now("YYYY-MM-DD");
const extension = currentFile?.extension ?? "md";
const finalFileName = ensureUniqueFileName(targetFolder, currentFile?.basename ?? "Untitled", extension);
const destinationFilePath = `${targetFolder}/${finalFileName}.${extension}`;
const destinationMovePath = `${targetFolder}/${finalFileName}`;
const needsMove = currentFile?.path !== destinationFilePath;

if (needsMove) {
  await tp.file.move(destinationMovePath);
}

// --- 3. BUILD CONTENT ---
const frontmatterLines = [
  "---",
  `type: ${conceptType}`,
  `course: ${JSON.stringify(selectedSubject)}`,
  selectedYear ? `year: ${JSON.stringify(selectedYear)}` : null,
  `tema: ${JSON.stringify(selectedTema)}`,
  `created: ${JSON.stringify(today)}`,
  "status: draft",
  "aliases: []",
  `tags: [${conceptType}]`,
  "---",
]
  .filter(Boolean)
  .join("\n");

const dataviewBlock = noteUtils.buildConceptBacklinksBlock({
  baseUniversityPath,
  generalLabel,
  lectureType,
});

const lines = [
  frontmatterLines,
  "",
  `# 💡 ${finalFileName}`,
  "",
  "## 📜 Definition",
  "*A formal, textbook-style definition of the concept.*",
  `- ${tp.file.cursor(1)}`,
  "",
  "## 🧠 Analogy or Metaphor",
  "*How can I explain this concept using a simple, real-world analogy?*",
  `- [ ] ${tp.file.cursor(2)}`,
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
];

tR = lines.join("\n");
%>

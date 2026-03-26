<%*
// Depends on: _templater_scripts/getUniversityContext.js, _templater_scripts/universityNoteUtils.js, _templater_scripts/universityConfig.js

// --- 0. GUARD: verify target file exists ---
const currentFile = tp.config.target_file;
if (!currentFile) {
  new Notice("⛔️ Abort: Templater has no target file.", 10_000);
  return;
}

// --- 1. LOAD UTILITIES ---
const context = await tp.user.getUniversityContext(currentFile);
const getConfig = tp.user.universityConfig;
const config = typeof getConfig === "function" ? await getConfig() : null;
const configLabels = config?.labels ?? {};

const noteUtils = await tp.user.universityNoteUtils();
const {
  ensureFolderPath,
  ensureUniqueFileName,
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
const conceptType = noteTypes.concept ?? "concept";
const lectureType = noteTypes.lecture ?? "lecture";

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

// --- 3. PLACE FILE (before writing tR so the file is at its final path) ---
const today = tp.date.now("YYYY-MM-DD");
const extension = currentFile?.extension ?? "md";
const finalFileName = ensureUniqueFileName(targetFolder, currentFile?.basename ?? "Untitled", extension);
const destinationFilePath = `${targetFolder}/${finalFileName}.${extension}`;
const destinationMovePath = `${targetFolder}/${finalFileName}`;
const needsMove = currentFile?.path !== destinationFilePath;

if (needsMove) {
  await tp.file.move(destinationMovePath);
}

// --- 4. BUILD CONTENT ---
// Dataview source scoped to the university root for performance.
const dvSource = JSON.stringify(baseUniversityPath ?? "");
const generalLiteral = JSON.stringify(generalLabel);
const lectureTypeLiteral = JSON.stringify(lectureType);

const frontmatterLines = [
  "---",
  `type: ${conceptType}`,
  `tags: [${conceptType}]`,
  `course: ${JSON.stringify(selectedSubject)}`,
  selectedYear ? `year: ${JSON.stringify(selectedYear)}` : null,
  `tema: ${JSON.stringify(selectedTema)}`,
  `created: ${JSON.stringify(today)}`,
  "status: draft",
  "aliases: []",
  "---",
]
  .filter(Boolean)
  .join("\n");

// Dataview JS that finds all lectures/notes referencing this concept by name
// or via an explicit entry in their `concepts` frontmatter array.
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
  `      if (!entry) {`,
  `        return false;`,
  `      }`,
  ``,
  `      const entryValue = entry.path ?? entry.toString?.() ?? entry;`,
  `      if (!entryValue) {`,
  `        return false;`,
  `      }`,
  ``,
  `      const lowered = entryValue.toString().toLowerCase();`,
  `      return lowered === targetName || lowered === targetPath.toLowerCase();`,
  `    });`,
  ``,
  `    const linkMatch = (page.file?.outlinks ?? []).some((link) => link.path === targetPath);`,
  `    return conceptMatch || linkMatch;`,
  `  })`,
  `  .array()`,
  `  .sort((a, b) => dv.compare(sortValue(a), sortValue(b)));`,
  ``,
  `dv.list(matches.map((page) => page.file.link));`,
  "```",
].join("\n");

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

<%*
// Depends on: _templater_scripts/getUniversityContext.js, _templater_scripts/universityNoteUtils.js, _templater_scripts/universityConfig.js

// --- 0. GUARD: must run on a fresh Untitled note ---
const currentFile = tp.config.target_file;
if (!currentFile) {
  new Notice("⛔️ Abort: Templater has no target file.", 10_000);
  return;
}

const basename = currentFile.basename.toLowerCase();
if (!basename.startsWith("untitled") && !basename.startsWith("sin título")) {
  new Notice("⛔️ Abort: Template must be run in a new 'Untitled' note.", 10_000);
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
const codeLanguage = constants?.codeLanguage ?? "";

// Map language identifiers to their single-line comment prefix.
// Defaults to '//' for unknown or empty (generic) code blocks.
const lineCommentPrefix = {
  python: "#", py: "#",
  ruby: "#", rb: "#",
  bash: "#", sh: "#", zsh: "#", shell: "#",
  r: "#", perl: "#",
  lua: "--", sql: "--",
  haskell: "--", hs: "--",
  matlab: "%", m: "%",
}[codeLanguage.toLowerCase()] ?? "//";

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

// --- 3. PROMPT FOR TOPIC & DEFINE FILE NAME ---
const today = tp.date.now("YYYY-MM-DD");
const topicInput = await tp.system.prompt("Lecture Topic (optional)");
const rawTopic = topicInput?.trim();
const safeTopic = sanitizeFileName(rawTopic) || "Untitled Topic";

const baseTitle = sanitizeFileName(`Lecture ${today}`);
const noteTitle = rawTopic ? sanitizeFileName(`${baseTitle} - ${safeTopic}`) : baseTitle;
const headingTitle = rawTopic ? safeTopic : noteTitle;
const extension = currentFile?.extension ?? "md";
const finalFileName = ensureUniqueFileName(targetFolder, noteTitle, extension);
const destinationFilePath = `${targetFolder}/${finalFileName}.${extension}`;
const destinationMovePath = `${targetFolder}/${finalFileName}`;
const needsMove = currentFile?.path !== destinationFilePath;

// --- 4. BUILD CONTENT ---
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

const frontMatter = [
  "---",
  `course: ${JSON.stringify(subject)}`,
  year ? `year: ${JSON.stringify(year)}` : null,
  `tema: ${JSON.stringify(tema)}`,
  `type: ${lectureType}`,
  `created: ${JSON.stringify(created)}`,
  "status: draft",
  `aliases: [${alias}]`,
  "concepts: []",
  "---",
]
  .filter(Boolean)
  .join("\n");

let content = `${frontMatter}\n`;
content += lectureTags ? `${lectureTags}\n\n` : "";
content += `# 🧠 ${headingTitle}\n\n`;
content += "## 📜 Summary\n- [ ] Key takeaway 1\n- [ ] Key takeaway 2\n\n";
content += "## 📚 Definitions\n- [ ] Term :: Definition\n\n";
content += "## 🧩 Key Concepts\n- [ ] Concept :: Insight\n\n";
content += "## 💡 Examples or Code\n";
content += `\`\`\`${codeLanguage}\n`;
content += `${lineCommentPrefix} ${safeTopic}\n`;
content += "```\n\n";
content += "## 🧭 Explanation in My Own Words\n- [ ] Insight\n\n";
content += "## 🔗 Connections\n- [ ] Related topic\n\n";
content += "## 🧠 Questions I Still Have\n- [ ] Open question\n";
content += `\n${tp.file.cursor()}`;

tR = content;

// --- 5. PLACE FILE ---
if (needsMove) {
  await tp.file.move(destinationMovePath);
}
new Notice(`📘 Lecture stored in ${targetFolder}`, 5_000);
%>

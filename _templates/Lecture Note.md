<%*
// --- 0. GET THE TARGET FILE & CONTEXT ---
const currentFile = tp.config.target_file;
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
  normalizeParcial,
  resolveSubjectParcialTema,
  constants = {},
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
const contextSubject = context?.subject ?? generalLabel;
const contextParcialBase = context?.parcial ?? generalLabel;
const contextParcial = normalizeParcial ? normalizeParcial(contextParcialBase) : contextParcialBase;

const placement = await resolveSubjectParcialTema(tp, {
  currentFile,
  contextSubject,
  contextParcial,
  contextTema: generalLabel,
});

const {
  targetFolder,
  subject: resolvedSubject = generalLabel,
  parcial: resolvedParcial = generalLabel,
  tema: resolvedTema = generalLabel,
} = placement ?? {};

const subject = resolvedSubject || generalLabel;
const parcial = normalizeParcial(resolvedParcial);
const tema = resolvedTema?.toString().trim() || generalLabel;

if (!targetFolder) {
  new Notice("⛔️ Abort: Could not determine destination folder.", 10_000);
  return;
}

await ensureFolderPath(targetFolder);

const today = tp.date.now("YYYY-MM-DD");

// --- 1. VALIDATION ---
if (!currentFile) {
  new Notice("⛔️ Abort: Templater has no target file.", 10_000);
  return;
}

const basename = currentFile.basename.toLowerCase();
if (!basename.startsWith("untitled") && !basename.startsWith("sin título")) {
  new Notice("⛔️ Abort: Template must be run in a new 'Untitled' note.", 10_000);
  return;
}

// --- 2. PROMPT FOR TOPIC & DEFINE NAME ---
const topicInput = await tp.system.prompt("Lecture Topic (optional)");
const rawTopic = topicInput?.trim();
const safeTopic = sanitizeFileName(rawTopic) || "Untitled Topic";

const baseTitle = sanitizeFileName(`Lecture ${today}`);
const noteTitle = rawTopic ? sanitizeFileName(`${baseTitle} - ${safeTopic}`) : baseTitle;
const headingTitle = rawTopic ? safeTopic : noteTitle;
const extension = currentFile?.extension ?? "md";
const finalFileName = ensureUniqueFileName(targetFolder, noteTitle, extension);
const destinationPath = `${targetFolder}/${finalFileName}.${extension}`;
const needsMove =
  currentFile?.parent?.path !== targetFolder || (currentFile?.basename ?? "") !== finalFileName;

// --- 3. BUILD THE CONTENT ---
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
const date = today;
const created = today;

const frontMatter = [
  "---",
  `course: ${JSON.stringify(subject)}`,
  `parcial: ${JSON.stringify(parcial)}`,
  `tema: ${JSON.stringify(tema)}`,
  "type: lecture",
  `date: ${JSON.stringify(date)}`,
  `created: ${JSON.stringify(created)}`,
  "status: draft",
  `aliases: [${alias}]`,
  "concepts: []",
  "---",
].join("\n");

let content = `${frontMatter}\n`;
content += lectureTags ? `${lectureTags}\n\n` : "";
content += `# 🧠 ${headingTitle}\n\n`;
content += "## 📜 Summary\n- [ ] Key takeaway 1\n- [ ] Key takeaway 2\n\n";
content += "## 📚 Definitions\n- [ ] Term :: Definition\n\n";
content += "## 🧩 Key Concepts\n- [ ] Concept :: Insight\n\n";
content += "## 💡 Examples or Code\n";
content += "```c\n";
content += `// Code for: ${safeTopic}\n`;
content += "```\n\n";
content += "## 🧭 Explanation in My Own Words\n- [ ] Insight\n\n";
content += "## 🔗 Connections\n- [ ] Related topic\n\n";
content += "## 🧠 Questions I Still Have\n- [ ] Open question\n";

tR = content;

// --- 4. SET CURSOR & PLACE FILE ---
tp.file.cursor();
if (needsMove) {
  await tp.file.move(destinationPath);
}
new Notice(`📘 Lecture stored in ${targetFolder}`, 5_000);
%>

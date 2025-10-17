<%*
// --- 0. GET THE TARGET FILE & CONTEXT ---
const currentFile = tp.config.target_file;
const context = await tp.user.getUniversityContext(currentFile);
const { subject: contextSubject = "General", parcial: contextParcial = "General" } = context ?? {};

const utils = await tp.user.universityNoteUtils();
const {
  pathJoin,
  getBaseUniversityPath,
  listSubjects,
  getParcialContext,
  ensureFolderPath,
  ensureUniqueFileName,
  dedupePreserveOrder,
  sortCaseInsensitive,
  sanitizeFolderName,
} = utils;

const baseUniversityPath = getBaseUniversityPath(currentFile);

const prioritizeOption = (options, preferred) => {
  if (!preferred || preferred === "General") {
    return options;
  }

  const index = options.findIndex((option) => option.toLowerCase() === preferred.toLowerCase());
  if (index === -1) {
    return options;
  }

  const reordered = [...options];
  const [match] = reordered.splice(index, 1);
  return [match, ...reordered];
};

const createSubjectOption = "➕ Create new subject";
const existingSubjects = listSubjects(baseUniversityPath);
let subjectOptions = dedupePreserveOrder([
  ...(contextSubject && contextSubject !== "General" ? [contextSubject] : []),
  ...existingSubjects,
]);

subjectOptions = subjectOptions
  .filter((name) => name.toLowerCase() !== "general")
  .map((name) => name.trim())
  .filter(Boolean);

subjectOptions = [
  "General",
  ...prioritizeOption(sortCaseInsensitive(subjectOptions), contextSubject),
  createSubjectOption,
];

let subject =
  (await tp.system.suggester(subjectOptions, subjectOptions)) ?? contextSubject ?? "General";

if (subject === createSubjectOption) {
  const newSubject = await tp.system.prompt("Subject name");
  subject = newSubject?.trim() || "General";
}

subject = sanitizeFolderName(subject) || "General";

const { containerName: parcialesFolderName, existingParcials } =
  getParcialContext(baseUniversityPath, subject);

const defaultParcials = ["Parcial 1", "Parcial 2", "Parcial 3", "Parcial 4", "Final"];
const createParcialOption = "➕ Create new parcial";
let parcialOptions = dedupePreserveOrder([
  ...(contextParcial && contextParcial !== "General" ? [contextParcial] : []),
  ...existingParcials,
  ...defaultParcials,
]);

parcialOptions = parcialOptions
  .filter((name) => name.toLowerCase() !== "general")
  .map((name) => name.trim())
  .filter(Boolean);

parcialOptions = [
  "General",
  ...prioritizeOption(sortCaseInsensitive(parcialOptions), contextParcial),
  createParcialOption,
];

let parcial =
  (await tp.system.suggester(parcialOptions, parcialOptions)) ?? contextParcial ?? "General";

if (parcial === createParcialOption) {
  const newParcial = await tp.system.prompt("Parcial name");
  parcial = newParcial?.trim() || "General";
}

parcial = sanitizeFolderName(parcial) || "General";

const destinationSegments = [baseUniversityPath];

if (subject && subject !== "General") {
  destinationSegments.push(subject);
}

if (parcial && parcial !== "General") {
  if (parcialesFolderName) {
    destinationSegments.push(parcialesFolderName);
  }

  destinationSegments.push(parcial);
}

const targetFolder = pathJoin(...destinationSegments);
await ensureFolderPath(targetFolder);

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
const date = tp.date.now("YYYY-MM-DD");
const topicInput = await tp.system.prompt("Lecture Topic (optional)");
const safeTopic = topicInput?.trim() || "Untitled Topic";

const baseTitle = `Lecture ${date}`;
const noteTitle = topicInput?.trim() ? `${baseTitle} - ${safeTopic}` : baseTitle;
const headingTitle = topicInput?.trim() ? safeTopic : noteTitle;
const extension = currentFile?.extension ?? "md";
const finalFileName = ensureUniqueFileName(targetFolder, noteTitle, extension);
const destinationPath = `${targetFolder}/${finalFileName}.${extension}`;
const needsMove =
  currentFile?.parent?.path !== targetFolder || (currentFile?.basename ?? "") !== finalFileName;

// --- 3. BUILD THE CONTENT ---
const toSlug = (value = "") =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .toLowerCase();

const subjectSlug = toSlug(subject);
const lectureTags = [subjectSlug && `#${subjectSlug}`, "#lecture"].filter(Boolean).join(" ");
const alias = JSON.stringify(headingTitle);

const frontMatter = [
  "---",
  `course: ${JSON.stringify(subject)}`,
  `parcial: ${JSON.stringify(parcial)}`,
  "type: lecture",
  `date: ${JSON.stringify(date)}`,
  "status: draft",
  `aliases: [${alias}]`,
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


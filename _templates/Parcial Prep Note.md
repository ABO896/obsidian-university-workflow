<%*
// Depends on: _templater_scripts/getUniversityContext.js, _templater_scripts/universityNoteUtils.js, _templater_scripts/universityConfig.js
//
// Creates an exam-prep note anchored to a specific subject + parcial (exam
// period).  It is the only template that uses includeParcial: true, which
// surfaces the year → subject → parcial selection flow and places the note
// inside the Parciales/<Parcial N>/ folder automatically.

// --- 0. GUARD: must run on a fresh Untitled note ---
const currentFile = tp.config.target_file;
if (!currentFile) {
  new Notice("⛔️ Abort: Templater has no target file.", 10_000);
  return;
}

const basename = (currentFile.basename ?? "").toLowerCase();
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
  resolveSubjectAndParcial,
  constants = {},
  schema = {},
} = noteUtils ?? {};

if (!noteUtils) {
  new Notice("⛔️ Abort: University note utilities are unavailable.", 10_000);
  return;
}

if (!resolveSubjectAndParcial) {
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
const generalType = noteTypes.general ?? "general";
const parcialPrepType = noteTypes["parcial-prep"] ?? "parcial-prep";

const contextSubject = context?.subject ?? generalLabel;
const contextYear = context?.year ?? tp.frontmatter?.year ?? null;
const contextParcial = context?.parcial ?? generalLabel;

// --- 2. RESOLVE PLACEMENT (year → subject → parcial dialogs) ---
// includeParcial: true is what distinguishes this template from the others —
// it surfaces the parcial selection step and places the note inside
// Parciales/<Parcial N>/ rather than directly in the subject folder.
const placement = await resolveSubjectAndParcial(tp, {
  currentFile,
  contextSubject,
  contextYear,
  contextParcial,
  includeParcial: true,
  promptYearWhen: "always",
});

const {
  baseUniversityPath,
  targetFolder,
  subject: resolvedSubject = generalLabel,
  year: resolvedYear = null,
  parcial: resolvedParcial = generalLabel,
} = placement ?? {};

const subject = resolvedSubject || generalLabel;
const year = resolvedYear?.toString().trim() || null;
const parcial = resolvedParcial?.toString().trim() || generalLabel;

if (!targetFolder) {
  new Notice("⛔️ Abort: Could not determine destination folder.", 10_000);
  return;
}

await ensureFolderPath(targetFolder);

// --- 3. BUILD FILE NAME ---
const today = tp.date.now("YYYY-MM-DD");
const parcialSuffix = parcial !== generalLabel ? ` - ${parcial}` : "";
const baseTitle = sanitizeFileName(`${subject} Prep${parcialSuffix}`);
const noteTitle = baseTitle || "Parcial Prep";
const extension = currentFile?.extension ?? "md";
const finalFileName = ensureUniqueFileName(targetFolder, noteTitle, extension);
const destinationFilePath = `${targetFolder}/${finalFileName}.${extension}`;
const destinationMovePath = `${targetFolder}/${finalFileName}`;
const needsMove = currentFile?.path !== destinationFilePath;

// --- 4. BUILD CONTENT ---
const frontMatter = [
  "---",
  `type: ${parcialPrepType}`,
  `course: ${JSON.stringify(subject)}`,
  year ? `year: ${JSON.stringify(year)}` : null,
  `parcial: ${JSON.stringify(parcial)}`,
  `created: ${JSON.stringify(today)}`,
  "status: draft",
  "---",
]
  .filter(Boolean)
  .join("\n");

// Scope Dataview queries to the university root for performance.
const dvSource = JSON.stringify(baseUniversityPath ?? "");
const generalLiteral = JSON.stringify(generalLabel);
const courseLiteral = JSON.stringify(subject);
const yearLiteral = year ? JSON.stringify(year) : null;

const headerTitle =
  parcial !== generalLabel
    ? `${subject} — ${parcial} Study Guide`
    : `${subject} — Study Guide`;

const lines = [frontMatter, ""];

lines.push(`# 📚 ${headerTitle}`);
lines.push("");

lines.push("## ✅ Topics to Cover");
lines.push(`- [ ] ${tp.file.cursor(1)}`);
lines.push("- [ ] ");
lines.push("");

lines.push("## 📝 Summary Notes");
lines.push(tp.file.cursor(2));
lines.push("");

// --- Concepts section ---
lines.push("## 💡 Key Concepts");
lines.push("```dataview");
lines.push(`TABLE default(created, default(date, file.ctime)) AS "Created", tema AS "Tema"`);
lines.push(`FROM ${dvSource}`);
lines.push(`WHERE course = ${courseLiteral} AND type = "${conceptType}"`);
if (yearLiteral) {
  lines.push(`AND year = ${yearLiteral}`);
}
lines.push(`SORT default(created, default(date, file.ctime)) ASC`);
lines.push("```");
lines.push("");

// --- Lectures section ---
lines.push("## 📘 Lectures");
lines.push("```dataview");
lines.push(`TABLE tema AS "Tema", default(created, default(date, file.ctime)) AS "Created"`);
lines.push(`FROM ${dvSource}`);
lines.push(`WHERE course = ${courseLiteral} AND type = "${lectureType}"`);
if (yearLiteral) {
  lines.push(`AND year = ${yearLiteral}`);
}
lines.push(`SORT default(created, default(date, file.ctime)) ASC`);
lines.push("```");
lines.push("");

// --- Practice questions ---
lines.push("## ❓ Practice Questions");
lines.push(`- [ ] ${tp.file.cursor(3)}`);
lines.push("");

// --- Formulas / key facts ---
lines.push("## 🔑 Formulas & Key Facts");
lines.push("| Item | Detail |");
lines.push("| --- | --- |");
lines.push("| | |");
lines.push("");

// --- Open tasks across the course ---
lines.push("## ⏳ Open Tasks");
lines.push("```dataview");
lines.push(`TASK FROM ${dvSource}`);
lines.push(`WHERE !completed AND course = ${courseLiteral}`);
lines.push("SORT file.due ASC");
lines.push("```");
lines.push("");

tR = lines.join("\n");

// --- 5. PLACE FILE ---
if (needsMove) {
  await tp.file.move(destinationMovePath);
}
new Notice(`📋 Prep note stored in ${targetFolder}`, 5_000);
%>

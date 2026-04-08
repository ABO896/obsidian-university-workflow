<%*
// Depends on: _templater_scripts/getUniversityContext.js, _templater_scripts/universityNoteUtils.js, _templater_scripts/universityConfig.js
//
// When features.parcial = true  → full parcial selection flow; note placed in
//                                  Parciales/<Parcial N>/
// When features.parcial = false → parcial step is skipped; becomes a generic
//                                  subject-scoped Study Guide at the subject root

// --- 0. GUARD: must run on a fresh note ---
const currentFile = tp.config.target_file;
if (!currentFile) {
  new Notice("⛔️ Abort: Templater has no target file.", 10_000);
  return;
}

const isCreatingNewFile = tp.config.run_mode === 0;
if (!isCreatingNewFile) {
  const basename = (currentFile.basename ?? "").toLowerCase();
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

// Read the feature flag from constants (mirrors config.features.parcial).
const isParcialEnabled = constants?.isParcialEnabled === true;

const noteTypes = schema?.types ?? {};
const lectureType = noteTypes.lecture ?? "lecture";
const conceptType = noteTypes.concept ?? "concept";
const parcialPrepType = noteTypes["parcial-prep"] ?? "parcial-prep";

const contextSubject = context?.subject ?? generalLabel;
const contextYear = context?.year ?? tp.frontmatter?.year ?? null;
const contextParcial = context?.parcial ?? generalLabel;

// --- 2. RESOLVE PLACEMENT ---
// When parcial is enabled: year → subject → parcial dialogs; note goes into
//   Parciales/<Parcial N>/.
// When parcial is disabled: year → subject only; note goes to subject root.
const placement = await resolveSubjectAndParcial(tp, {
  currentFile,
  contextSubject,
  contextYear,
  contextParcial,
  // includeParcial is respected only when features.parcial = true in config;
  // universityNoteUtils gates it automatically via effectiveIncludeParcial.
  includeParcial: isParcialEnabled,
  promptYearWhen: "always",
});

const {
  baseUniversityPath,
  targetFolder,
  subjectRootPath,
  subject: resolvedSubject = generalLabel,
  year: resolvedYear = null,
  parcial: resolvedParcial = generalLabel,
} = placement ?? {};

const subject = resolvedSubject || generalLabel;
const year = resolvedYear?.toString().trim() || null;
const parcial = isParcialEnabled
  ? resolvedParcial?.toString().trim() || generalLabel
  : generalLabel;

// Use subject root when parcial is disabled (avoid placing at university root).
const effectiveFolder = isParcialEnabled
  ? targetFolder
  : (subjectRootPath || targetFolder);

if (!effectiveFolder) {
  new Notice("⛔️ Abort: Could not determine destination folder.", 10_000);
  return;
}

await ensureFolderPath(effectiveFolder);

// --- 3. BUILD FILE NAME ---
const today = tp.date.now("YYYY-MM-DD");
const parcialSuffix =
  isParcialEnabled && parcial !== generalLabel ? ` - ${parcial}` : "";
const baseTitle = sanitizeFileName(`${subject} Prep${parcialSuffix}`);
const noteTitle = baseTitle || "Study Guide";
const extension = currentFile?.extension ?? "md";
const finalFileName = ensureUniqueFileName(effectiveFolder, noteTitle, extension);
const destinationFilePath = `${effectiveFolder}/${finalFileName}.${extension}`;
const destinationMovePath = `${effectiveFolder}/${finalFileName}`;
const needsMove = currentFile?.path !== destinationFilePath;

// --- 4. BUILD CONTENT ---
const parcialFmLine =
  isParcialEnabled && parcial !== generalLabel
    ? `parcial: ${JSON.stringify(parcial)}`
    : null;

const frontMatter = [
  "---",
  `type: ${parcialPrepType}`,
  `course: ${JSON.stringify(subject)}`,
  year ? `year: ${JSON.stringify(year)}` : null,
  parcialFmLine,
  `created: ${JSON.stringify(today)}`,
  "status: draft",
  "aliases: []",
  "---",
]
  .filter(Boolean)
  .join("\n");

// Scope Dataview queries to the university root for performance.
const dvSource = JSON.stringify(baseUniversityPath ?? "");
const courseLiteral = JSON.stringify(subject);
const yearLiteral = year ? JSON.stringify(year) : null;

const headerTitle =
  isParcialEnabled && parcial !== generalLabel
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
if (yearLiteral) lines.push(`AND year = ${yearLiteral}`);
lines.push(`SORT default(created, default(date, file.ctime)) ASC`);
lines.push("```");
lines.push("");

// --- Lectures section ---
lines.push("## 📘 Lectures");
lines.push("```dataview");
lines.push(`TABLE tema AS "Tema", default(created, default(date, file.ctime)) AS "Created"`);
lines.push(`FROM ${dvSource}`);
lines.push(`WHERE course = ${courseLiteral} AND type = "${lectureType}"`);
if (yearLiteral) lines.push(`AND year = ${yearLiteral}`);
lines.push(`SORT default(created, default(date, file.ctime)) ASC`);
lines.push("```");
lines.push("");

// --- Practice questions ---
lines.push("## ❓ Practice Questions");
lines.push(`- [ ] ${tp.file.cursor(3)}`);
lines.push("");

// --- Formulas / key facts table ---
lines.push("## 🔑 Formulas & Key Facts");
lines.push("| Item | Detail |");
lines.push("| --- | --- |");
lines.push("| | |");
lines.push("");

// --- Open tasks ---
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
new Notice(`📋 Study guide stored in ${effectiveFolder}`, 5_000);
%>

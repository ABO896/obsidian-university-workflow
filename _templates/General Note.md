<%*
const currentFile = tp.config.target_file;
const context = await tp.user.getUniversityContext(currentFile);
const {
  subject: contextSubject = "General",
  parcial: contextParcial = "General",
} = context ?? {};

const noteUtils = await tp.user.universityNoteUtils();
const {
  pathJoin,
  getBaseUniversityPath,
  getParcialContext,
  ensureFolderPath,
  ensureUniqueFileName,
  sanitizeFolderName,
  sanitizeFileName,
  reorderOptions,
  buildSubjectOptions,
} = noteUtils ?? {};

if (!noteUtils) {
  new Notice("⛔️ Abort: University note utilities are unavailable.", 10_000);
  return;
}

if (!currentFile) {
  new Notice("⛔️ Abort: Templater has no target file.", 10_000);
  return;
}

const baseUniversityPath = getBaseUniversityPath(currentFile);
const subjectOptions = buildSubjectOptions(baseUniversityPath, contextSubject);
const NEW_SUBJECT_SENTINEL = "__new_subject__";
const subjectSelection =
  (await tp.system.suggester(
    [...subjectOptions, "➕ Create new subject"],
    [...subjectOptions, NEW_SUBJECT_SENTINEL]
  )) ??
  contextSubject ??
  "General";

let selectedSubject = subjectSelection;

if (subjectSelection === NEW_SUBJECT_SENTINEL) {
  const newSubjectInput = await tp.system.prompt("Name for the new subject");
  selectedSubject = newSubjectInput?.trim() || contextSubject || "General";
}

const parcialOptionsBase = [
  "General",
  "Parcial 1",
  "Parcial 2",
  "Parcial 3",
  "Final",
];

const parcialOptions = reorderOptions(parcialOptionsBase, contextParcial);
const selectedParcial =
  (await tp.system.suggester(parcialOptions, parcialOptions)) ??
  contextParcial ??
  "General";

const subjectFolderName =
  selectedSubject && selectedSubject !== "General"
    ? sanitizeFolderName(selectedSubject)
    : null;
const parcialFolderName =
  selectedParcial && selectedParcial !== "General"
    ? sanitizeFolderName(selectedParcial)
    : null;

const { containerPath: parcialContainerPath } = getParcialContext(
  baseUniversityPath,
  subjectFolderName ?? undefined
);

let targetFolder = parcialContainerPath || baseUniversityPath;

if (subjectFolderName && !(targetFolder?.includes(subjectFolderName))) {
  targetFolder = pathJoin(baseUniversityPath, subjectFolderName);
}

if (parcialFolderName) {
  targetFolder = pathJoin(targetFolder, parcialFolderName);
}

if (!targetFolder) {
  targetFolder = baseUniversityPath;
}

await ensureFolderPath(targetFolder);

const basename = (currentFile.basename ?? "").toLowerCase();
if (!basename.startsWith("untitled") && !basename.startsWith("sin título")) {
  const proceedChoice = await tp.system.suggester(
    ["Continue", "Cancel"],
    ["continue", "cancel"],
    "Run General Note on this existing file?"
  );

  if (proceedChoice !== "continue") {
    new Notice("ℹ️ General note creation cancelled.", 5_000);
    return;
  }
}

const titleInput = await tp.system.prompt(
  "Note title",
  currentFile?.basename ?? "General Note"
);

if (titleInput === null) {
  new Notice("ℹ️ General note creation cancelled.", 5_000);
  return;
}

const rawTitle = titleInput?.trim();
const safeTitle =
  sanitizeFileName(rawTitle) ||
  sanitizeFileName(currentFile?.basename) ||
  "General Note";
const extension = currentFile?.extension ?? "md";
const finalFileName = ensureUniqueFileName(targetFolder, safeTitle, extension);
const destinationPath = `${targetFolder}/${finalFileName}.${extension}`;
const needsMove = currentFile?.path !== destinationPath;

const toSlug = (value = "") =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .toLowerCase();

const subjectSlug = toSlug(selectedSubject);
const inlineTags = [subjectSlug && `#${subjectSlug}`, "#general-note"]
  .filter(Boolean)
  .join(" ");

const frontMatter = [
  "---",
  "type: general",
  `course: ${JSON.stringify(selectedSubject)}`,
  `parcial: ${JSON.stringify(selectedParcial)}`,
  "status: draft",
  "---",
  "",
].join("\n");

tR = frontMatter;

if (inlineTags) {
  tR += `${inlineTags}\n\n`;
}

tp.file.cursor({ line: 999, ch: 0 });

if (needsMove) {
  await tp.file.move(destinationPath);
}

new Notice(`📝 General note stored in ${targetFolder}`, 5_000);
%>

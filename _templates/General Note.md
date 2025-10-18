<%*
const currentFile = tp.config.target_file;
const context = await tp.user.getUniversityContext(currentFile);
const {
  subject: contextSubject = "General",
  parcial: contextParcial = "General",
} = context ?? {};

const noteUtils = await tp.user.universityNoteUtils();
const {
  ensureFolderPath,
  ensureUniqueFileName,
  sanitizeFileName,
  toSlug,
  normalizeParcial,
  resolveSubjectParcialTema,
} = noteUtils ?? {};

if (!noteUtils) {
  new Notice("⛔️ Abort: University note utilities are unavailable.", 10_000);
  return;
}

if (!currentFile) {
  new Notice("⛔️ Abort: Templater has no target file.", 10_000);
  return;
}

if (!resolveSubjectParcialTema) {
  new Notice("⛔️ Abort: Placement helper is unavailable.", 10_000);
  return;
}

const placement = await resolveSubjectParcialTema(tp, {
  currentFile,
  contextSubject,
  contextParcial,
  contextTema: "General",
});

const {
  targetFolder,
  subject: resolvedSubject = "General",
  parcial: resolvedParcial = "General",
  tema: resolvedTema = "General",
} = placement ?? {};

const selectedSubject = resolvedSubject || "General";
const selectedParcial = normalizeParcial(resolvedParcial);
const selectedTema = resolvedTema?.toString().trim() || "General";

if (!targetFolder) {
  new Notice("⛔️ Abort: Could not determine destination folder.", 10_000);
  return;
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

const today = tp.date.now("YYYY-MM-DD");
const subjectSlug = toSlug(selectedSubject);
const temaSlug = toSlug(selectedTema);
const inlineTags =
  [
    subjectSlug && `#${subjectSlug}`,
    temaSlug && temaSlug !== subjectSlug ? `#${temaSlug}` : null,
    "#general-note",
  ]
    .filter(Boolean)
    .join(" ");

const aliasValue = JSON.stringify(rawTitle || safeTitle);

const frontMatter = [
  "---",
  "type: general",
  `course: ${JSON.stringify(selectedSubject)}`,
  `parcial: ${JSON.stringify(selectedParcial)}`,
  `tema: ${JSON.stringify(selectedTema)}`,
  `date: ${JSON.stringify(today)}`,
  `created: ${JSON.stringify(today)}`,
  "status: draft",
  `aliases: [${aliasValue}]`,
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

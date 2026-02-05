<%*
// Depends on: _templater_scripts/getUniversityContext.js, _templater_scripts/universityNoteUtils.js, _templater_scripts/universityConfig.js
const currentFile = tp.config.target_file;
if (!currentFile) {
  new Notice("⛔️ Abort: No active file to update.", 10_000);
  return;
}

const context = await tp.user.getUniversityContext(currentFile);
const getConfig = tp.user.universityConfig;
const config = typeof getConfig === "function" ? await getConfig() : null;
const configLabels = config?.labels ?? {};

const { subject: contextSubjectRaw, year: contextYearRaw } = context ?? {};
const contextTemaRaw = tp.frontmatter?.tema;

const noteUtils = await tp.user.universityNoteUtils();
const {
  ensureFolderPath,
  toSlug,
  resolveSubjectParcialTema,
  constants = {},
} = noteUtils ?? {};

if (!noteUtils || !resolveSubjectParcialTema) {
  new Notice("⛔️ Abort: Placement helper unavailable.", 10_000);
  return;
}

const generalLabel = constants?.general ?? configLabels.general;
if (!generalLabel) {
  new Notice("⛔️ Abort: University general label is not configured.", 10_000);
  return;
}
const contextTema = contextTemaRaw ?? generalLabel;
const contextSubject = contextSubjectRaw ?? generalLabel;
const contextYear = contextYearRaw ?? tp.frontmatter?.year ?? null;

const placement = await resolveSubjectParcialTema(tp, {
  currentFile,
  contextSubject,
  contextYear,
  includeParcial: false,
  contextTema,
});

if (!placement) {
  new Notice("ℹ️ Tema assignment cancelled.", 5_000);
  return;
}

const {
  targetFolder,
  subject: resolvedSubject = generalLabel,
  year: resolvedYear = null,
  tema: resolvedTema = generalLabel,
} = placement;

if (!targetFolder) {
  new Notice("⛔️ Abort: Could not resolve destination folder.", 10_000);
  return;
}

await ensureFolderPath(targetFolder);

const tema = resolvedTema?.toString().trim() || generalLabel;
const subject = resolvedSubject || generalLabel;

const extension = currentFile.extension ?? "md";
const destinationFilePath = `${targetFolder}/${currentFile.basename}.${extension}`;
const destinationMovePath = `${targetFolder}/${currentFile.basename}`;
const needsMove = currentFile.path !== destinationFilePath;

if (needsMove) {
  await tp.file.move(destinationMovePath);
}

await app.fileManager.processFrontMatter(currentFile, (frontmatter) => {
  frontmatter.course = subject;
  if (resolvedYear) {
    frontmatter.year = resolvedYear;
  } else {
    delete frontmatter.year;
  }
  frontmatter.tema = tema;
});

const subjectTag = toSlug(subject);
const temaTag = toSlug(tema);
const tagSummary = [
  subjectTag && `#${subjectTag}`,
  temaTag && temaTag !== subjectTag ? `#${temaTag}` : null,
]
  .filter(Boolean)
  .join(" ");

new Notice(
  `🏷️ Assigned ${subject}${resolvedYear ? ` / ${resolvedYear}` : ""} / ${tema}${tagSummary ? ` (${tagSummary})` : ""}`,
  5_000
);
%>

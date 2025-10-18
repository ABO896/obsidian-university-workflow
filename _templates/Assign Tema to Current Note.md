<%*
const currentFile = tp.config.target_file;
if (!currentFile) {
  new Notice("⛔️ Abort: No active file to update.", 10_000);
  return;
}

const context = await tp.user.getUniversityContext(currentFile);
const getConfig = tp.user.universityConfig;
const config = typeof getConfig === "function" ? await getConfig() : null;
const configLabels = config?.labels ?? {};

const { subject: contextSubjectRaw, parcial: contextParcialRaw } = context ?? {};
const contextTemaRaw = tp.frontmatter.tema;

const noteUtils = await tp.user.universityNoteUtils();
const {
  ensureFolderPath,
  toSlug,
  normalizeParcial,
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
const contextParcialBase = contextParcialRaw ?? generalLabel;
const contextParcial = normalizeParcial ? normalizeParcial(contextParcialBase) : contextParcialBase;

const placement = await resolveSubjectParcialTema(tp, {
  currentFile,
  contextSubject,
  contextParcial,
  contextTema,
});

if (!placement) {
  new Notice("ℹ️ Tema assignment cancelled.", 5_000);
  return;
}

const {
  targetFolder,
  subject: resolvedSubject = generalLabel,
  parcial: resolvedParcial = generalLabel,
  tema: resolvedTema = generalLabel,
} = placement;

if (!targetFolder) {
  new Notice("⛔️ Abort: Could not resolve destination folder.", 10_000);
  return;
}

await ensureFolderPath(targetFolder);

const normalizedParcial = normalizeParcial(resolvedParcial);
const tema = resolvedTema?.toString().trim() || generalLabel;
const subject = resolvedSubject || generalLabel;

const extension = currentFile.extension ?? "md";
const destinationPath = `${targetFolder}/${currentFile.basename}.${extension}`;
const needsMove = currentFile.path !== destinationPath;

if (needsMove) {
  await tp.file.move(destinationPath);
}

await app.fileManager.processFrontMatter(currentFile, (frontmatter) => {
  frontmatter.course = subject;
  frontmatter.parcial = normalizedParcial;
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
  `🏷️ Assigned ${subject} / ${normalizedParcial} / ${tema}${tagSummary ? ` (${tagSummary})` : ""}`,
  5_000
);
%>

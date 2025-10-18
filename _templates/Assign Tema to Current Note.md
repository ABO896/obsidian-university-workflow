<%*
const currentFile = tp.config.target_file;
if (!currentFile) {
  new Notice("⛔️ Abort: No active file to update.", 10_000);
  return;
}

const context = await tp.user.getUniversityContext(currentFile);
const { subject: contextSubject = "General", parcial: contextParcial = "General" } = context ?? {};
const contextTema = tp.frontmatter.tema ?? "General";

const noteUtils = await tp.user.universityNoteUtils();
const {
  ensureFolderPath,
  toSlug,
  normalizeParcial,
  resolveSubjectParcialTema,
} = noteUtils ?? {};

if (!noteUtils || !resolveSubjectParcialTema) {
  new Notice("⛔️ Abort: Placement helper unavailable.", 10_000);
  return;
}

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
  subject: resolvedSubject = "General",
  parcial: resolvedParcial = "General",
  tema: resolvedTema = "General",
} = placement;

if (!targetFolder) {
  new Notice("⛔️ Abort: Could not resolve destination folder.", 10_000);
  return;
}

await ensureFolderPath(targetFolder);

const normalizedParcial = normalizeParcial(resolvedParcial);
const tema = resolvedTema?.toString().trim() || "General";
const subject = resolvedSubject || "General";

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

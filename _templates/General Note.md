<%*
// Depends on: _templater_scripts/templateBootstrap.js

// --- 0. BOOTSTRAP ---
const ctx = await tp.user.templateBootstrap(tp);
if (!ctx) return;
const { currentFile, noteUtils, generalLabel, schema, context } = ctx;
const {
  ensureFolderPath,
  ensureUniqueFileName,
  sanitizeFileName,
  toSlug,
  resolveSubjectParcialTema,
} = noteUtils;

const noteTypes = schema?.types ?? {};
const generalType = noteTypes.general ?? "general";

const generalNoteTitleLabel = `${generalLabel} Note`;
const generalNoteNoticeLabel = `${generalLabel} note`;

// --- 1. GUARD: confirm before running on an existing (non-Untitled) file ---
const basename = (currentFile.basename ?? "").toLowerCase();
const isUntitled = basename.startsWith("untitled") || basename.startsWith("sin título");

if (!isUntitled) {
  const proceedChoice = await tp.system.suggester(
    ["Continue", "Cancel"],
    ["continue", "cancel"],
    false,
    `Run ${generalNoteTitleLabel} on this existing file?`
  );

  if (proceedChoice !== "continue") {
    new Notice(`ℹ️ ${generalNoteNoticeLabel} creation cancelled.`, 5_000);
    return;
  }
}

// --- 2. RESOLVE PLACEMENT (shows year → subject → tema dialogs) ---
const contextSubject = context?.subject ?? generalLabel;
const contextYear = context?.year ?? tp.frontmatter?.year ?? null;

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

const selectedSubject = resolvedSubject || generalLabel;
const selectedYear = resolvedYear?.toString().trim() || null;
const selectedTema = resolvedTema?.toString().trim() || generalLabel;

if (!targetFolder) {
  new Notice("⛔️ Abort: Could not determine destination folder.", 10_000);
  return;
}

await ensureFolderPath(targetFolder);

// --- 3. PROMPT FOR TITLE ---
const titleInput = await tp.system.prompt(
  "Note title",
  currentFile?.basename ?? generalNoteTitleLabel
);

if (titleInput === null) {
  new Notice(`ℹ️ ${generalNoteNoticeLabel} creation cancelled.`, 5_000);
  return;
}

const rawTitle = titleInput?.trim();
const safeTitle =
  sanitizeFileName(rawTitle) ||
  sanitizeFileName(currentFile?.basename) ||
  generalNoteTitleLabel;
const extension = currentFile?.extension ?? "md";
const finalFileName = ensureUniqueFileName(targetFolder, safeTitle, extension);
const destinationFilePath = `${targetFolder}/${finalFileName}.${extension}`;
const destinationMovePath = `${targetFolder}/${finalFileName}`;
const needsMove = currentFile?.path !== destinationFilePath;

// --- 4. BUILD CONTENT ---
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
  `type: ${generalType}`,
  `course: ${JSON.stringify(selectedSubject)}`,
  selectedYear ? `year: ${JSON.stringify(selectedYear)}` : null,
  `tema: ${JSON.stringify(selectedTema)}`,
  `created: ${JSON.stringify(today)}`,
  "status: draft",
  `aliases: [${aliasValue}]`,
  "---",
  "",
]
  .filter(Boolean)
  .join("\n");

tR = frontMatter;

if (inlineTags) {
  tR += `${inlineTags}\n\n`;
}

tR += tp.file.cursor();

// --- 5. PLACE FILE ---
if (needsMove) {
  await tp.file.move(destinationMovePath);
}
new Notice(`📝 ${generalNoteNoticeLabel} stored in ${targetFolder}`, 5_000);
%>

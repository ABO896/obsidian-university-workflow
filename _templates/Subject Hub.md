<%*
const currentFile = tp.config.target_file;
const context = await tp.user.getUniversityContext(currentFile);
const { subject: contextSubject = "General", parcial: contextParcial = "General" } = context ?? {};

const noteUtils = await tp.user.universityNoteUtils();

if (!noteUtils) {
  new Notice("⛔️ Abort: University note utilities are unavailable.", 10_000);
  return;
}

const {
  sanitizeFileName,
  ensureUniqueFileName,
  ensureFolderPath,
  resolveSubjectAndParcial,
} = noteUtils ?? {};

if (!resolveSubjectAndParcial) {
  new Notice("⛔️ Abort: Placement helper is unavailable.", 10_000);
  return;
}

if (!currentFile) {
  new Notice("⛔️ Abort: Templater has no target file.", 10_000);
  return;
}

const basename = (currentFile.basename ?? "").toLowerCase();
if (!basename.startsWith("untitled") && !basename.startsWith("sin título")) {
  new Notice("⛔️ Abort: Template must be run in a new 'Untitled' note.", 10_000);
  return;
}

const placement = await resolveSubjectAndParcial(tp, {
  currentFile,
  contextSubject,
  contextParcial,
});

const { subject, subjectRootPath, baseUniversityPath } = placement ?? {};

const targetRoot = subjectRootPath || baseUniversityPath;

if (!targetRoot) {
  new Notice("⛔️ Abort: Could not determine subject destination.", 10_000);
  return;
}

const selectedSubject = subject || "General";

await ensureFolderPath(targetRoot);

const toSlug = (value = "") =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .toLowerCase();

const subjectSlug = toSlug(selectedSubject || "General");
const courseTag = subjectSlug ? `course/${subjectSlug}` : null;

const displayTitle = `${selectedSubject} Hub`;
const safeFileBase = sanitizeFileName(displayTitle) || "Subject Hub";
const extension = currentFile?.extension ?? "md";
const finalFileName = ensureUniqueFileName(targetRoot, safeFileBase, extension);
const destinationPath = `${targetRoot}/${finalFileName}.${extension}`;
const needsMove = currentFile?.path !== destinationPath;

const updated = tp.date.now("YYYY-MM-DD");
const tags = [courseTag, "subject-hub"].filter(Boolean).map((tag) => JSON.stringify(tag));
const tagsLine = `tags: [${tags.join(", ")}]`;

const frontMatter = [
  "---",
  "type: subject-hub",
  `course: ${JSON.stringify(selectedSubject)}`,
  tagsLine,
  "status: draft",
  `updated: ${JSON.stringify(updated)}`,
  "---",
  "",
].join("\n");

const lines = [frontMatter];
lines.push(`# 🧭 ${displayTitle}`);
lines.push("");
lines.push("## ✅ Overview");
lines.push("- [ ] Course summary");
lines.push("- [ ] Key resources");
lines.push("- [ ] Upcoming priorities");
lines.push("");
lines.push("## 📘 Lectures");
lines.push("```dataview");
lines.push('TABLE file.ctime AS "Created", default(parcial, "General") AS "Parcial"');
lines.push('FROM ""');
lines.push('WHERE course = this.course AND type = "lecture"');
lines.push('SORT file.ctime DESC');
lines.push("```");
lines.push("");
lines.push("## 💡 Concepts");
lines.push("```dataview");
lines.push('TABLE file.ctime AS "Created"');
lines.push('FROM ""');
lines.push('WHERE course = this.course AND type = "concept"');
lines.push('SORT file.ctime DESC');
lines.push("```");
lines.push("");
lines.push("## 🗂️ Notes by Parcial");
lines.push("```dataview");
lines.push('TABLE WITHOUT ID rows.file.link AS "Notes"');
lines.push('FROM ""');
lines.push('WHERE course = this.course');
lines.push('GROUP BY default(parcial, "General")');
lines.push("```");
lines.push("");
lines.push("## ⏳ Open Tasks");
lines.push("```dataview");
lines.push('TASK FROM ""');
lines.push('WHERE !completed AND course = this.course');
lines.push('SORT file.due ASC');
lines.push("```");

lines.push("");

tR = lines.join("\n");

const summaryLineIndex = lines.findIndex((line) => line.includes("Course summary"));
const cursorPosition =
  summaryLineIndex >= 0 ? { line: summaryLineIndex, ch: 6 } : { line: 0, ch: 0 };
tp.file.cursor(cursorPosition);

if (needsMove) {
  await tp.file.move(destinationPath);
}

new Notice(`🗂️ Subject hub stored in ${targetRoot}`, 5_000);
%>

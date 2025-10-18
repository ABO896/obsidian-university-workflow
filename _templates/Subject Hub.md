<%*
const currentFile = tp.config.target_file;
const context = await tp.user.getUniversityContext(currentFile);
const getConfig = tp.user.universityConfig;
const config = typeof getConfig === "function" ? await getConfig() : null;
const configLabels = config?.labels ?? {};
const configFs = config?.fs ?? {};

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
  toSlug,
  normalizeParcial,
  labels: helperLabels,
  constants = {},
  fsConfig: helperFsConfig,
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

const generalLabel = constants?.general ?? configLabels.general;
if (!generalLabel) {
  new Notice("⛔️ Abort: University general label is not configured.", 10_000);
  return;
}
const labels = helperLabels ?? configLabels;
const fsConfig = helperFsConfig ?? configFs;
const parcialLabel = labels?.parcial ?? "Parcial";
const temaLabel = labels?.tema ?? "Tema";
const parcialContainerName =
  constants?.parcialContainer ??
  fsConfig?.parcialContainer ??
  configFs?.parcialContainer ??
  (typeof parcialLabel === "string" ? `${parcialLabel}s` : parcialLabel);
const temaContainerName =
  constants?.temaContainer ??
  fsConfig?.temaContainer ??
  configFs?.temaContainer ??
  (typeof temaLabel === "string" ? `${temaLabel}s` : temaLabel);
const temaPluralDisplay =
  typeof temaContainerName === "string" && temaContainerName?.trim()
    ? temaContainerName
    : typeof temaLabel === "string"
    ? `${temaLabel}s`
    : temaLabel;
const noCourseNotesText = "No course notes yet.";
const temaPluralLower =
  typeof temaPluralDisplay === "string" ? temaPluralDisplay.toLowerCase() : "temas";
const noTemasMessage = `No ${temaPluralLower} recorded yet.`;

const contextSubject = context?.subject ?? generalLabel;
const contextParcial = normalizeParcial
  ? normalizeParcial(context?.parcial ?? generalLabel)
  : context?.parcial ?? generalLabel;

const placement = await resolveSubjectAndParcial(tp, {
  currentFile,
  contextSubject,
  contextParcial,
  includeParcial: false,
});

const { subject, subjectRootPath, baseUniversityPath } = placement ?? {};

const targetRoot = subjectRootPath || baseUniversityPath;

if (!targetRoot) {
  new Notice("⛔️ Abort: Could not determine subject destination.", 10_000);
  return;
}

const selectedSubject = subject || generalLabel;

await ensureFolderPath(targetRoot);

const subjectSlug = toSlug(selectedSubject || generalLabel);
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
const generalLiteral = JSON.stringify(generalLabel);
const parcialColumnLabel = JSON.stringify(parcialLabel);
const temaIndexTitle = `${temaContainerName} Index`;
const parcialesToTemasTitle = `${parcialContainerName} → ${temaContainerName}`;

lines.push("## 📘 Lectures");
lines.push("```dataview");
lines.push(`TABLE default(created, date, file.ctime) AS "Created", default(parcial, ${generalLiteral}) AS ${parcialColumnLabel}`);
lines.push('FROM ""');
lines.push('WHERE course = this.course AND type = "lecture"');
lines.push('SORT default(created, date, file.ctime) DESC');
lines.push("```");
lines.push("");
lines.push("## 💡 Concepts");
lines.push("```dataview");
lines.push('TABLE default(created, date, file.ctime) AS "Created"');
lines.push('FROM ""');
lines.push('WHERE course = this.course AND type = "concept"');
lines.push('SORT default(created, date, file.ctime) DESC');
lines.push("```");
lines.push("");
lines.push(`## 🗂️ Notes by ${parcialLabel}`);
lines.push("```dataview");
lines.push('TABLE WITHOUT ID rows.file.link AS "Notes"');
lines.push('FROM ""');
lines.push('WHERE course = this.course AND contains(["lecture", "concept", "general"], type)');
lines.push(`GROUP BY default(parcial, ${generalLiteral})`);
lines.push('SORT key ASC');
lines.push("```");
lines.push("");
lines.push(`## 🧭 ${parcialesToTemasTitle}`);
lines.push("```dataviewjs");
lines.push(String.raw`const current = dv.current();
const targetCourse = current.course ?? ${generalLiteral};
const allowedTypes = new Set(["lecture", "concept", "general"]);
const getSortValue = (page) => page.created ?? page.date ?? page.file?.ctime;

const pages = dv
  .pages("")
  .where((page) => (page.course ?? ${generalLiteral}) === targetCourse)
  .where((page) => allowedTypes.has((page.type ?? "").toLowerCase()))
  .array();

if (pages.length === 0) {
  dv.paragraph(${JSON.stringify(noCourseNotesText)});
} else {
  const groupMap = new Map();

  for (const page of pages) {
    const parcialKey = (page.parcial ?? ${generalLiteral}) || ${generalLiteral};
    const temaKey = (page.tema ?? ${generalLiteral}) || ${generalLiteral};
    const entry = { page, parcialKey, temaKey };
    if (!groupMap.has(parcialKey)) {
      groupMap.set(parcialKey, []);
    }
    groupMap.get(parcialKey).push(entry);
  }

  const parcialKeys = Array.from(groupMap.keys()).sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: "base" })
  );

  for (const parcialKey of parcialKeys) {
    dv.header(3, ${JSON.stringify(`${parcialLabel}: `)} + parcialKey);
    const entries = groupMap.get(parcialKey) ?? [];
    const temaMap = new Map();

    for (const entry of entries) {
      if (!temaMap.has(entry.temaKey)) {
        temaMap.set(entry.temaKey, []);
      }
      temaMap.get(entry.temaKey).push(entry);
    }

    const temaKeys = Array.from(temaMap.keys()).sort((a, b) =>
      a.localeCompare(b, undefined, { sensitivity: "base" })
    );

    for (const temaKey of temaKeys) {
      const temaEntries = (temaMap.get(temaKey) ?? []).slice().sort((a, b) =>
        dv.compare(getSortValue(a.page), getSortValue(b.page))
      );
      dv.paragraph("**" + temaKey + "**");
      dv.list(temaEntries.map((item) => item.page.file.link));
    }
  }
}`);
lines.push("```");
lines.push("");
lines.push(`## 🗒️ ${temaIndexTitle}`);
lines.push("```dataviewjs");
lines.push(String.raw`const targetCourse = dv.current().course ?? ${generalLiteral};
const allowedTypes = new Set(["lecture", "concept", "general"]);
const temasPages = dv
  .pages("")
  .where((page) => (page.course ?? ${generalLiteral}) === targetCourse)
  .where((page) => allowedTypes.has((page.type ?? "").toLowerCase()))
  .array();

const temaSet = new Set(
  temasPages.map((page) => (page.tema ?? ${generalLiteral}) || ${generalLiteral})
);

const temaList = Array.from(temaSet).sort((a, b) =>
  a.localeCompare(b, undefined, { sensitivity: "base" })
);

if (temaList.length === 0) {
  dv.paragraph(${JSON.stringify(noTemasMessage)});
} else {
  dv.list(temaList);
}`);
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

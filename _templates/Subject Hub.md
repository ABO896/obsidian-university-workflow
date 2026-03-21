<%*
// Depends on: _templater_scripts/getUniversityContext.js, _templater_scripts/universityNoteUtils.js, _templater_scripts/universityConfig.js

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
  labels: helperLabels,
  constants = {},
  fsConfig: helperFsConfig,
  schema = {},
} = noteUtils ?? {};

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
const hubType = noteTypes["subject-hub"] ?? "subject-hub";

const labels = helperLabels ?? configLabels;
const fsConfig = helperFsConfig ?? configFs;
const yearLabel = labels?.year ?? "Year";
const temaLabel = labels?.tema ?? "Tema";
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

// --- 2. RESOLVE PLACEMENT (shows year → subject dialogs) ---
const placement = await resolveSubjectAndParcial(tp, {
  currentFile,
  contextSubject,
  includeParcial: false,
  includeYear: true,
  promptYearWhen: "always",
});

const { subject, year, subjectRootPath, baseUniversityPath } = placement ?? {};

const targetRoot = subjectRootPath || baseUniversityPath;

if (!targetRoot) {
  new Notice("⛔️ Abort: Could not determine subject destination.", 10_000);
  return;
}

const selectedSubject = subject || generalLabel;
const selectedYear = year?.toString().trim() || null;

await ensureFolderPath(targetRoot);

// --- 3. BUILD FILE NAME ---
const subjectSlug = toSlug(selectedSubject || generalLabel);
const courseTag = subjectSlug ? `course/${subjectSlug}` : null;

const displayTitle = `${selectedSubject} Hub`;
const safeFileBase = sanitizeFileName(displayTitle) || "Subject Hub";
const extension = currentFile?.extension ?? "md";
const finalFileName = ensureUniqueFileName(targetRoot, safeFileBase, extension);
const destinationFilePath = `${targetRoot}/${finalFileName}.${extension}`;
const destinationMovePath = `${targetRoot}/${finalFileName}`;
const needsMove = currentFile?.path !== destinationFilePath;

// --- 4. BUILD CONTENT ---
const timestamp = tp.date.now("YYYY-MM-DD");
const created = timestamp;
const updated = timestamp;
const tags = [courseTag, hubType].filter(Boolean).map((tag) => JSON.stringify(tag));
const tagsLine = `tags: [${tags.join(", ")}]`;

const frontMatter = [
  "---",
  `type: ${hubType}`,
  `course: ${JSON.stringify(selectedSubject)}`,
  selectedYear ? `year: ${JSON.stringify(selectedYear)}` : null,
  `created: ${JSON.stringify(created)}`,
  tagsLine,
  `updated: ${JSON.stringify(updated)}`,
  "---",
  "",
]
  .filter(Boolean)
  .join("\n");

// Interpolated values used inside Dataview blocks
const generalLiteral = JSON.stringify(generalLabel);
const yearColumnLabel = JSON.stringify(yearLabel);
const temaIndexTitle = `${temaContainerName} Index`;
const yearsToTemasTitle = `${yearLabel} → ${temaContainerName}`;
// Dataview source scoped to the university root for performance (avoids vault-wide scan).
const dvSource = JSON.stringify(baseUniversityPath ?? "");
// Allowed note types filter — built from config so it tracks any type renames.
const allowedTypesLiteral = JSON.stringify([lectureType, conceptType, generalType]);

const lines = [frontMatter];
lines.push(`# 🧭 ${displayTitle}`);
lines.push("");
lines.push("## ✅ Overview");
lines.push(`- [ ] ${tp.file.cursor()}Course summary`);
lines.push("- [ ] Key resources");
lines.push("- [ ] Upcoming priorities");
lines.push("");

lines.push("## 📘 Lectures");
lines.push("```dataview");
lines.push(`TABLE default(created, default(date, file.ctime)) AS "Created", default(year, ${generalLiteral}) AS ${yearColumnLabel}`);
lines.push(`FROM ${dvSource}`);
lines.push(`WHERE course = this.course AND type = "${lectureType}"`);
lines.push('SORT default(created, default(date, file.ctime)) DESC');
lines.push("```");
lines.push("");

lines.push("## 💡 Concepts");
lines.push("```dataview");
lines.push(`TABLE default(created, default(date, file.ctime)) AS "Created", default(year, ${generalLiteral}) AS ${yearColumnLabel}`);
lines.push(`FROM ${dvSource}`);
lines.push(`WHERE course = this.course AND type = "${conceptType}"`);
lines.push('SORT default(created, default(date, file.ctime)) DESC');
lines.push("```");
lines.push("");

lines.push(`## 🗂️ Notes by ${yearLabel}`);
lines.push("```dataview");
lines.push('TABLE WITHOUT ID rows.file.link AS "Notes"');
lines.push(`FROM ${dvSource}`);
lines.push(`WHERE course = this.course AND contains(${allowedTypesLiteral}, type)`);
lines.push(`GROUP BY default(year, ${generalLiteral})`);
lines.push('SORT key ASC');
lines.push("```");
lines.push("");

lines.push(`## 🧭 ${yearsToTemasTitle}`);
lines.push("```dataviewjs");
lines.push(String.raw`const current = dv.current();
const targetCourse = current.course ?? ${generalLiteral};
const allowedTypes = new Set(${allowedTypesLiteral});
const getSortValue = (page) => page.created ?? page.date ?? page.file?.ctime;

const pages = dv
  .pages(${dvSource})
  .where((page) => (page.course ?? ${generalLiteral}) === targetCourse)
  .where((page) => allowedTypes.has((page.type ?? "").toLowerCase()))
  .array();

if (pages.length === 0) {
  dv.paragraph(${JSON.stringify(noCourseNotesText)});
} else {
  const groupMap = new Map();

  for (const page of pages) {
    const yearKey = (page.year ?? ${generalLiteral}) || ${generalLiteral};
    const temaKey = (page.tema ?? ${generalLiteral}) || ${generalLiteral};
    const entry = { page, yearKey, temaKey };
    if (!groupMap.has(yearKey)) {
      groupMap.set(yearKey, []);
    }
    groupMap.get(yearKey).push(entry);
  }

  const yearKeys = Array.from(groupMap.keys()).sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: "base" })
  );

  for (const yearKey of yearKeys) {
    dv.header(3, ${JSON.stringify(`${yearLabel}: `)} + yearKey);
    const entries = groupMap.get(yearKey) ?? [];
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
const allowedTypes = new Set(${allowedTypesLiteral});
const temasPages = dv
  .pages(${dvSource})
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
lines.push(`TASK FROM ${dvSource}`);
lines.push('WHERE !completed AND course = this.course');
lines.push('SORT file.due ASC');
lines.push("```");

lines.push("");

tR = lines.join("\n");

// --- 5. PLACE FILE ---
if (needsMove) {
  await tp.file.move(destinationMovePath);
}

new Notice(`🗂️ Subject hub stored in ${targetRoot}`, 5_000);
%>

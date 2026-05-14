<%*
// Depends on: _templater_scripts/templateBootstrap.js

// --- 0. BOOTSTRAP ---
const ctx = await tp.user.templateBootstrap(tp, { requireNewFile: true });
if (!ctx) return;
const { currentFile, noteUtils, generalLabel, schema, constants, context, config, configLabels } = ctx;
const {
  sanitizeFileName,
  ensureUniqueFileName,
  ensureFolderPath,
  resolvePlacement,
  toSlug,
  labels: helperLabels,
  fsConfig: helperFsConfig,
} = noteUtils;

const noteTypes = schema?.types ?? {};
const lectureType = noteTypes.lecture ?? "lecture";
const conceptType = noteTypes.concept ?? "concept";
const generalType = noteTypes.general ?? "general";
const hubType = noteTypes["subject-hub"] ?? "subject-hub";

const configFs = config?.fs ?? {};
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

// --- 1. RESOLVE PLACEMENT (shows year → subject dialogs) ---
const placement = await resolvePlacement(tp, {
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

// --- 2. BUILD FILE NAME ---
const subjectSlug = toSlug(selectedSubject || generalLabel);
const courseTag = subjectSlug ? `course/${subjectSlug}` : null;

const displayTitle = `${selectedSubject} Hub`;
const safeFileBase = sanitizeFileName(displayTitle) || "Subject Hub";
const extension = currentFile?.extension ?? "md";
const finalFileName = ensureUniqueFileName(targetRoot, safeFileBase, extension);
const destinationFilePath = `${targetRoot}/${finalFileName}.${extension}`;
const destinationMovePath = `${targetRoot}/${finalFileName}`;
const needsMove = currentFile?.path !== destinationFilePath;

// --- 3. BUILD CONTENT ---
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
  "status: draft",
  "aliases: []",
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
lines.push("- [ ] Course summary");
lines.push("- [ ] Key resources");
lines.push("- [ ] Upcoming priorities");
lines.push(`- [ ] ${tp.file.cursor()}`);
lines.push("");

// Due for Review: concept notes whose next_review date has passed.
lines.push("## 🔔 Due for Review");
lines.push("```dataview");
lines.push(`TABLE next_review AS "Due", last_reviewed AS "Last Reviewed"`);
lines.push(`FROM ${dvSource}`);
lines.push(`WHERE course = this.course AND type = "${conceptType}" AND next_review <= date(today)`);
lines.push("SORT next_review ASC");
lines.push("```");
lines.push("");

// Note Health: at-a-glance status distribution so students can see whether notes
// are being processed (raw: 0  draft: 2  reviewed: 8) or piling up unprocessed.
const statusesLiteral = JSON.stringify(
  Array.isArray(schema?.statuses) && schema.statuses.length > 0
    ? schema.statuses
    : ["raw", "draft", "reviewed", "complete"]
);
lines.push("## 📊 Note Health");
lines.push("```dataviewjs");
lines.push(String.raw`const course = dv.current().course ?? ${generalLiteral};
const statuses = ${statusesLiteral};
const pages = dv
  .pages(${dvSource})
  .where((p) => (p.course ?? ${generalLiteral}) === course && p.status)
  .array();
const counts = Object.fromEntries(statuses.map((s) => [s, 0]));
for (const p of pages) {
  if (p.status in counts) counts[p.status]++;
}
dv.paragraph(statuses.map((s) => "**" + s + ":** " + counts[s]).join("  ·  "));`);
lines.push("```");
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

// --- 4. PLACE FILE ---
if (needsMove) {
  await tp.file.move(destinationMovePath);
}

new Notice(`🗂️ Subject hub stored in ${targetRoot}`, 5_000);
%>

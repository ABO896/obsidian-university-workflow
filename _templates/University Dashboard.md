<%*
// Depends on: _templater_scripts/templateBootstrap.js
//
// Vault-wide university dashboard. One note, created at the university root.
// Does not overlap with Subject Hub (per-course) — this is the bird's-eye view
// across all courses: what needs review, how healthy notes are per course,
// what tasks are open, and which concept notes are orphaned (never linked).

// --- 0. BOOTSTRAP ---
const ctx = await tp.user.templateBootstrap(tp, { requireNewFile: true });
if (!ctx) return;
const { currentFile, noteUtils, generalLabel, schema, constants } = ctx;
const {
  ensureFolderPath,
  ensureUniqueFileName,
} = noteUtils;

const noteTypes = schema?.types ?? {};
const conceptType = noteTypes.concept ?? "concept";
const lectureType = noteTypes.lecture ?? "lecture";
const generalType = noteTypes.general ?? "general";
const dashboardType = noteTypes["university-dashboard"] ?? "university-dashboard";

const universityRoot = constants?.universityRoot ?? "Universidad";
const dvSource = JSON.stringify(universityRoot);
const conceptTypeLiteral = JSON.stringify(conceptType);
const allowedTypesLiteral = JSON.stringify([lectureType, conceptType, generalType]);
const statusesLiteral = JSON.stringify(
  Array.isArray(schema?.statuses) && schema.statuses.length > 0
    ? schema.statuses
    : ["raw", "draft", "reviewed", "complete"]
);

await ensureFolderPath(universityRoot);

// --- 1. BUILD FILE NAME ---
const today = tp.date.now("YYYY-MM-DD");
const extension = currentFile?.extension ?? "md";
const baseName = "University Dashboard";
const finalFileName = ensureUniqueFileName(universityRoot, baseName, extension);
const destinationFilePath = `${universityRoot}/${finalFileName}.${extension}`;
const destinationMovePath = `${universityRoot}/${finalFileName}`;
const needsMove = currentFile?.path !== destinationFilePath;

// --- 2. BUILD CONTENT ---
const frontMatter = [
  "---",
  `type: ${dashboardType}`,
  `created: ${JSON.stringify(today)}`,
  "status: draft",
  "aliases: []",
  "---",
].join("\n");

const lines = [frontMatter, ""];
lines.push("# 🏛️ University Dashboard");
lines.push("");

// Review Queue: the first thing a student should see when they open this note.
// Surfaces all concept notes whose next_review date has passed, sorted by how
// overdue they are. Acts as spaced repetition without any plugin.
lines.push("## 🔔 Review Queue");
lines.push("*Concept notes overdue for review — tackle these before new notes.*");
lines.push("```dataview");
lines.push(`TABLE next_review AS "Due", course AS "Course", last_reviewed AS "Last Reviewed"`);
lines.push(`FROM ${dvSource}`);
lines.push(`WHERE type = ${conceptTypeLiteral} AND next_review <= date(today)`);
lines.push("SORT next_review ASC");
lines.push("```");
lines.push("");

// Status by Course: one row per course, one column per status.
// A student can see at a glance which courses are healthy vs. accumulating raw notes.
lines.push("## 📊 Status by Course");
lines.push("```dataviewjs");
lines.push(String.raw`const allowedTypes = new Set(${allowedTypesLiteral});
const statuses = ${statusesLiteral};
const pages = dv
  .pages(${dvSource})
  .where((p) => allowedTypes.has((p.type ?? "").toLowerCase()) && p.course)
  .array();

const courseMap = new Map();
for (const p of pages) {
  const course = p.course;
  if (!courseMap.has(course)) {
    courseMap.set(course, Object.fromEntries(statuses.map((s) => [s, 0])));
  }
  const s = p.status;
  if (s && courseMap.get(course)[s] !== undefined) {
    courseMap.get(course)[s]++;
  }
}

const rows = Array.from(courseMap.entries())
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([course, counts]) => [course, ...statuses.map((s) => counts[s])]);

dv.table(["Course", ...statuses], rows);`);
lines.push("```");
lines.push("");

// Open Tasks: all incomplete tasks across every course, sorted by due date.
lines.push("## ⏳ Open Tasks");
lines.push("```dataview");
lines.push(`TASK FROM ${dvSource}`);
lines.push("WHERE !completed");
lines.push("SORT file.due ASC");
lines.push("```");
lines.push("");

// Orphaned Concepts: concept notes with no incoming links.
// These are the PKM failure-mode signal — notes created but never integrated
// into the knowledge graph. They should be linked from lecture notes.
lines.push("## 🕳️ Orphaned Concepts");
lines.push("*Concept notes with no incoming links — not yet wired into your knowledge graph.*");
lines.push("```dataview");
lines.push(`TABLE course AS "Course", created AS "Created"`);
lines.push(`FROM ${dvSource}`);
lines.push(`WHERE type = ${conceptTypeLiteral} AND length(file.inlinks) = 0`);
lines.push("SORT created ASC");
lines.push("```");
lines.push("");

tR = lines.join("\n");

// --- 3. PLACE FILE ---
if (needsMove) {
  await tp.file.move(destinationMovePath);
}
new Notice(`🏛️ University Dashboard created in ${universityRoot}`, 5_000);
%>

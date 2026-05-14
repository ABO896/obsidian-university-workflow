<%*
// Depends on: _templater_scripts/templateBootstrap.js

// --- 0. BOOTSTRAP ---
const ctx = await tp.user.templateBootstrap(tp);
if (!ctx) return;
const { currentFile, noteUtils, generalLabel, schema, constants, context, config } = ctx;
const {
  ensureFolderPath,
  ensureUniqueFileName,
  resolveSubjectParcialTema,
} = noteUtils;

const noteTypes = schema?.types ?? {};
const conceptType = noteTypes.concept ?? "concept";
const lectureType = noteTypes.lecture ?? "lecture";
const codeLanguage = constants?.codeLanguage ?? "";

const contextSubject = context?.subject ?? generalLabel;
const contextYear = context?.year ?? tp.frontmatter?.year ?? null;

// --- 1. RESOLVE PLACEMENT (shows year → subject → tema dialogs) ---
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
  baseUniversityPath,
} = placement ?? {};

const selectedSubject = resolvedSubject || generalLabel;
const selectedYear = resolvedYear?.toString().trim() || null;
const selectedTema = resolvedTema?.toString().trim() || generalLabel;

if (!targetFolder) {
  new Notice("⛔️ Abort: Could not determine destination folder.", 10_000);
  return;
}

await ensureFolderPath(targetFolder);

// --- 2. PICK STYLE ---
// Concept = idea, term, theory → assertion + analogy + Feynman + self-test.
// Technique = method, algorithm, procedure → when to use + steps + worked example + self-test.
const styleOptions = [
  "💡 Concept — an idea, term, or theory",
  "⚙️ Technique — a method, algorithm, or procedure",
];
const styleKeys = ["concept", "technique"];
const selectedStyle = await tp.system.suggester(styleOptions, styleKeys, false, "Concept style");
if (!selectedStyle) {
  new Notice("ℹ️ Concept note creation cancelled.", 5_000);
  return;
}

// --- 3. PLACE FILE BEFORE WRITING tR ---
const today = tp.date.now("YYYY-MM-DD");
// Default review interval = medium (7 days). Mark Reviewed utility updates this.
const reviewIntervals = config?.schema?.reviewIntervals ?? { easy: 14, medium: 7, hard: 3, blank: 1 };
const nextReview = tp.date.now("YYYY-MM-DD", reviewIntervals.medium ?? 7);

const extension = currentFile?.extension ?? "md";
const finalFileName = ensureUniqueFileName(
  targetFolder,
  currentFile?.basename ?? "Untitled",
  extension
);
const destinationFilePath = `${targetFolder}/${finalFileName}.${extension}`;
const destinationMovePath = `${targetFolder}/${finalFileName}`;
const needsMove = currentFile?.path !== destinationFilePath;

if (needsMove) {
  await tp.file.move(destinationMovePath);
}

// --- 4. BUILD CONTENT ---
const frontmatterLines = [
  "---",
  `type: ${conceptType}`,
  `course: ${JSON.stringify(selectedSubject)}`,
  selectedYear ? `year: ${JSON.stringify(selectedYear)}` : null,
  `tema: ${JSON.stringify(selectedTema)}`,
  `created: ${JSON.stringify(today)}`,
  "status: draft",
  "aliases: []",
  `tags: [${conceptType}]`,
  `next_review: ${JSON.stringify(nextReview)}`,
  "---",
]
  .filter(Boolean)
  .join("\n");

const dataviewBlock = noteUtils.buildConceptBacklinksBlock({
  baseUniversityPath,
  generalLabel,
  lectureType,
});

const lines = [frontmatterLines, ""];

if (selectedStyle === "concept") {
  lines.push(`# 💡 ${finalFileName}`);
  lines.push("");
  // My Assertion replaces "formal textbook-style definition". A declarative sentence
  // of what the student believes this concept IS or DOES forces an active claim
  // instead of passive copying from a source.
  lines.push("> [!abstract] My Assertion");
  lines.push(`> ${tp.file.cursor(1)}`);
  lines.push("");
  lines.push("## 🧠 Analogy");
  lines.push("*Compare it to something you already understand.*");
  lines.push("- ");
  lines.push("");
  lines.push("## 📝 Feynman Explanation");
  lines.push("*Explain this to someone who missed every lecture on it.*");
  lines.push("- ");
  lines.push("");
  lines.push("> [!warning] Common Misunderstanding");
  lines.push("> ");
  lines.push("");
  // Collapsed by default in reading view — forces recall before expanding.
  lines.push("> [!question]- Self-test");
  lines.push(`> ${tp.file.cursor(2)}`);
  lines.push(">");
  lines.push("> **Answer:**");
  lines.push("");
  lines.push("## 🔗 Where This Appears");
  lines.push("*Lectures and notes that cover this concept:*");
  lines.push("");
  lines.push(dataviewBlock);
  lines.push("");
} else {
  lines.push(`# ⚙️ ${finalFileName}`);
  lines.push("");
  lines.push("## 🎯 When to Reach For This");
  lines.push("*What does the problem look like when this technique applies?*");
  lines.push(`${tp.file.cursor(1)}`);
  lines.push("");
  lines.push("## ⚙️ Steps — My Words");
  lines.push("1. ");
  lines.push("");
  lines.push("## 💻 Example I Worked Through");
  lines.push(`\`\`\`${codeLanguage}`);
  lines.push("```");
  lines.push("");
  lines.push("> [!warning] Edge Cases");
  lines.push("> - ");
  lines.push("");
  lines.push("> [!question]- Self-test");
  lines.push(`> ${tp.file.cursor(2)}`);
  lines.push(">");
  lines.push("> **Answer:**");
  lines.push("");
  lines.push("## 🔗 Where This Appears");
  lines.push("*Lectures and notes that use this technique:*");
  lines.push("");
  lines.push(dataviewBlock);
  lines.push("");
}

tR = lines.join("\n");
%>

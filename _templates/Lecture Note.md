<%*
// Depends on: _templater_scripts/templateBootstrap.js

// --- 0. BOOTSTRAP ---
const ctx = await tp.user.templateBootstrap(tp, { requireNewFile: true });
if (!ctx) return;
const { currentFile, noteUtils, generalLabel, schema, constants, context } = ctx;
const {
  ensureFolderPath,
  ensureUniqueFileName,
  sanitizeFileName,
  toSlug,
  resolveSubjectParcialTema,
} = noteUtils;

const noteTypes = schema?.types ?? {};
const lectureType = noteTypes.lecture ?? "lecture";
const conceptType = noteTypes.concept ?? "concept";
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
} = placement ?? {};

const subject = resolvedSubject || generalLabel;
const year = resolvedYear?.toString().trim() || null;
const tema = resolvedTema?.toString().trim() || generalLabel;

if (!targetFolder) {
  new Notice("⛔️ Abort: Could not determine destination folder.", 10_000);
  return;
}

await ensureFolderPath(targetFolder);

// --- 2. PROMPT FOR TOPIC ---
const selectionDefault = tp.file.selection?.() ?? "";
const topicInput = await tp.system.prompt("Lecture Topic (optional)", selectionDefault || null);
const rawTopic = topicInput?.trim();
const safeTopic = sanitizeFileName(rawTopic) || "Untitled Topic";

const today = tp.date.now("YYYY-MM-DD");
const baseTitle = sanitizeFileName(`Lecture ${today}`);
const noteTitle = rawTopic ? sanitizeFileName(`${baseTitle} - ${safeTopic}`) : baseTitle;
const headingTitle = rawTopic ? safeTopic : noteTitle;
const extension = currentFile?.extension ?? "md";
const finalFileName = ensureUniqueFileName(targetFolder, noteTitle, extension);
const destinationFilePath = `${targetFolder}/${finalFileName}.${extension}`;
const destinationMovePath = `${targetFolder}/${finalFileName}`;
const needsMove = currentFile?.path !== destinationFilePath;

// --- 3. PICK STYLE ---
// Quick  = encoding only; process within 24h.
// Theory = humanities / argument-driven lectures; Q/E/C structure.
// STEM   = code, math, algorithms; problem-type + steps + worked example.
const styleOptions = [
  "⚡ Quick — capture now, process later",
  "🧠 Ideas & Theory — arguments, evidence, conclusions",
  "💻 Code & Math — steps, algorithms, worked examples",
];
const styleKeys = ["quick", "theory", "stem"];
const selectedStyle = await tp.system.suggester(styleOptions, styleKeys, false, "Lecture style");
if (!selectedStyle) {
  new Notice("ℹ️ Lecture note creation cancelled.", 5_000);
  return;
}

// --- 4. MULTI-SELECT CONCEPTS (Ideas & Theory + Code & Math only) ---
// Quick notes skip this — concept wiring happens after the note is upgraded.
let conceptLinks = [];
if (selectedStyle !== "quick" && typeof tp.system.multi_suggester === "function") {
  const allFiles = tp.app.vault.getMarkdownFiles?.() ?? [];
  const conceptFiles = allFiles
    .filter((f) => {
      const cache = tp.app.metadataCache.getFileCache(f);
      return (
        cache?.frontmatter?.type === conceptType &&
        cache?.frontmatter?.course === subject
      );
    })
    .sort((a, b) => a.basename.localeCompare(b.basename));

  if (conceptFiles.length > 0) {
    const picked = await tp.system.multi_suggester(
      conceptFiles.map((f) => f.basename),
      conceptFiles,
      false,
      "Concepts covered in this lecture (multi-select, optional)"
    );
    if (Array.isArray(picked) && picked.length > 0) {
      conceptLinks = picked.map((f) => `"[[${f.basename}]]"`);
    }
  }
}

// --- 5. BUILD FRONTMATTER ---
// Quick captures are raw by design; they must be processed within 24h.
const status = selectedStyle === "quick" ? "raw" : "draft";
const subjectSlug = toSlug(subject);
const temaSlug = toSlug(tema);
const lectureTags = [
  subjectSlug && `#${subjectSlug}`,
  temaSlug && temaSlug !== subjectSlug ? `#${temaSlug}` : null,
  "#lecture",
]
  .filter(Boolean)
  .join(" ");
const alias = JSON.stringify(headingTitle);
const conceptsLine =
  conceptLinks.length > 0 ? `concepts: [${conceptLinks.join(", ")}]` : "concepts: []";

const frontMatter = [
  "---",
  `type: ${lectureType}`,
  `course: ${JSON.stringify(subject)}`,
  year ? `year: ${JSON.stringify(year)}` : null,
  `tema: ${JSON.stringify(tema)}`,
  `created: ${JSON.stringify(today)}`,
  `status: ${status}`,
  `aliases: [${alias}]`,
  conceptsLine,
  "---",
]
  .filter(Boolean)
  .join("\n");

// --- 6. BUILD STYLE-SPECIFIC CONTENT ---
let body = `${frontMatter}\n`;
if (lectureTags) body += `${lectureTags}\n\n`;

if (selectedStyle === "quick") {
  // Encoding-only mode. The warning callout is the reminder to process within 24h.
  body += `> [!warning] Encoding Only\n`;
  body += `> Convert within 24h — run *Link Concepts*, then upgrade to Ideas & Theory or Code & Math.\n\n`;
  body += `# ⚡ ${headingTitle}\n\n`;
  body += `${tp.file.cursor(1)}\n\n`;
  body += `## ❓ Questions\n`;
  body += `- ${tp.file.cursor(2)}\n`;

} else if (selectedStyle === "theory") {
  // Q/E/C structure for argument-driven (humanities / social science) lectures.
  // Professors rarely state the main idea explicitly — this structure forces the
  // student to identify the question, evidence, and conclusion themselves.
  body += `# 🧠 ${headingTitle}\n\n`;
  body += `## 🎯 Central Question\n`;
  body += `*What was the lecture actually arguing? The professor's core question or thesis.*\n`;
  body += `${tp.file.cursor(1)}\n\n`;
  body += `## 📝 Evidence & Examples\n`;
  body += `*Key evidence, examples, data. Paraphrase — stop if you're copying.*\n`;
  body += `- \n\n`;
  body += `## 🧠 My Conclusion\n`;
  body += `*In your own words: what does the evidence say? What position does it support?*\n\n`;
  body += `> [!warning] Common Mistake\n`;
  body += `> \n\n`;
  body += `> [!question]- Self-test\n`;
  body += `> ${tp.file.cursor(2)}\n`;
  body += `>\n`;
  body += `> **Answer:**\n\n`;
  body += `## 🔗 Connections\n`;
  body += `- \n\n`;
  body += `## ❓ Open Questions\n`;
  body += `- ${tp.file.cursor(3)}\n`;

} else {
  // Code & Math: problem-pattern + steps + worked example.
  // STEM learning requires repeated problem-solving, not re-reading. Every section
  // here forces production: articulate the pattern, write steps in own words,
  // derive a worked example, surface edge cases.
  body += `# 💻 ${headingTitle}\n\n`;
  body += `## 🎯 Problem Type\n`;
  body += `*When does this apply? What does the problem look like?*\n`;
  body += `${tp.file.cursor(1)}\n\n`;
  body += `## ⚙️ My Approach\n`;
  body += `*Steps in your own words. Not copied.*\n`;
  body += `1. \n\n`;
  body += `## 💻 Example I Worked Out\n`;
  body += `\`\`\`${codeLanguage}\n`;
  body += `// ${safeTopic}\n`;
  body += `\`\`\`\n\n`;
  body += `> [!warning] Edge Cases\n`;
  body += `> - \n\n`;
  body += `> [!question]- Self-test\n`;
  body += `> ${tp.file.cursor(2)}\n`;
  body += `>\n`;
  body += `> **Answer:**\n\n`;
  body += `## 📊 Tradeoffs\n`;
  body += `| | |\n`;
  body += `|---|---|\n`;
  body += `| Time | |\n`;
  body += `| Space | |\n`;
  body += `| Don't use when | |\n\n`;
  body += `## 🔗 Connections\n`;
  body += `- ${tp.file.cursor(3)}\n`;
}

tR = body;

// --- 7. PLACE FILE ---
if (needsMove) {
  await tp.file.move(destinationMovePath);
}
new Notice(`📘 Lecture stored in ${targetFolder}`, 5_000);
%>

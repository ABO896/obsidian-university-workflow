<%*
// Depends on: _templater_scripts/templateBootstrap.js
//
// Utility template: run on any lecture or general note to quickly spin up a
// linked concept note from a text selection or clipboard, then wire it back
// into the current note's `concepts` frontmatter array.
//
// Workflow:
//   1. Pre-fills concept name from selection, then clipboard as fallback.
//   2. Style picker: same options as Concept Note Template (💡 / ⚙️).
//   3. Resolves placement — inherits course/year/tema from the current note.
//   4. Creates the concept note via tp.file.create_new with identical content
//      structure to Concept Note Template.
//   5. Appends [[link]] at the active editor cursor via tp.file.cursor_append.
//   6. Adds the new link to the current note's `concepts` frontmatter array
//      via tp.hooks.on_all_templates_executed (safe post-execution write).
//
// NOTE: This template intentionally does NOT set tR.

// --- 0. BOOTSTRAP ---
const ctx = await tp.user.templateBootstrap(tp);
if (!ctx) return;
const { currentFile, noteUtils, generalLabel, schema, constants, context, config } = ctx;
const {
  ensureFolderPath,
  ensureUniqueFileName,
  sanitizeFileName,
  toSlug,
  resolveSubjectParcialTema,
} = noteUtils;

const noteTypes = schema?.types ?? {};
const conceptType = noteTypes.concept ?? "concept";
const lectureType = noteTypes.lecture ?? "lecture";
const codeLanguage = constants?.codeLanguage ?? "";

// --- 1. GET CONCEPT NAME ---
// Clipboard seeds the prompt when the student has copied a term from a source.
const selectionDefault = tp.file.selection?.() ?? "";
const clipboardDefault = selectionDefault ? "" : ((await tp.system.clipboard()) ?? "");
const nameInput = await tp.system.prompt(
  "New concept name",
  selectionDefault || clipboardDefault || null
);

if (!nameInput?.trim()) {
  new Notice("ℹ️ Concept creation cancelled.", 5_000);
  return;
}

const conceptName = sanitizeFileName(nameInput.trim());
if (!conceptName) {
  new Notice("⛔️ Abort: Invalid concept name.", 10_000);
  return;
}

// --- 2. PICK STYLE ---
const styleOptions = [
  "💡 Concept — an idea, term, or theory",
  "⚙️ Technique — a method, algorithm, or procedure",
];
const styleKeys = ["concept", "technique"];
const selectedStyle = await tp.system.suggester(styleOptions, styleKeys, false, "Concept style");
if (!selectedStyle) {
  new Notice("ℹ️ Concept creation cancelled.", 5_000);
  return;
}

// --- 3. RESOLVE PLACEMENT ---
const contextSubject = tp.frontmatter?.course ?? context?.subject ?? generalLabel;
const contextYear = tp.frontmatter?.year ?? context?.year ?? null;
const contextTema = tp.frontmatter?.tema ?? generalLabel;

const placement = await resolveSubjectParcialTema(tp, {
  currentFile,
  contextSubject,
  contextYear,
  includeParcial: false,
  promptYearWhen: "missing",
  contextTema,
});

const {
  targetFolder,
  subject: resolvedSubject = generalLabel,
  year: resolvedYear = null,
  tema: resolvedTema = generalLabel,
  baseUniversityPath,
} = placement ?? {};

if (!targetFolder) {
  new Notice("⛔️ Abort: Could not determine destination folder.", 10_000);
  return;
}

await ensureFolderPath(targetFolder);

const subject = resolvedSubject || generalLabel;
const year = resolvedYear?.toString().trim() || null;
const tema = resolvedTema?.toString().trim() || generalLabel;

const extension = "md";
const finalFileName = ensureUniqueFileName(targetFolder, conceptName, extension);

// --- 4. BUILD CONCEPT NOTE CONTENT ---
// Mirrors Concept Note Template exactly — same frontmatter schema, same sections,
// same callouts. The only difference: no tp.file.cursor() stops (not supported
// in tp.file.create_new content).
const today = tp.date.now("YYYY-MM-DD");
const reviewIntervals = config?.schema?.reviewIntervals ?? { easy: 14, medium: 7, hard: 3, blank: 1 };
const nextReview = tp.date.now("YYYY-MM-DD", reviewIntervals.medium ?? 7);

const frontmatterLines = [
  "---",
  `type: ${conceptType}`,
  `course: ${JSON.stringify(subject)}`,
  year ? `year: ${JSON.stringify(year)}` : null,
  `tema: ${JSON.stringify(tema)}`,
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

let contentLines = [frontmatterLines, ""];

if (selectedStyle === "concept") {
  contentLines.push(`# 💡 ${finalFileName}`);
  contentLines.push("");
  contentLines.push("> [!abstract] My Assertion");
  contentLines.push("> ");
  contentLines.push("");
  contentLines.push("## 🧠 Analogy");
  contentLines.push("*Compare it to something you already understand.*");
  contentLines.push("- ");
  contentLines.push("");
  contentLines.push("## 📝 Feynman Explanation");
  contentLines.push("*Explain this to someone who missed every lecture on it.*");
  contentLines.push("- ");
  contentLines.push("");
  contentLines.push("> [!warning] Common Misunderstanding");
  contentLines.push("> ");
  contentLines.push("");
  contentLines.push("> [!question]- Self-test");
  contentLines.push("> ");
  contentLines.push(">");
  contentLines.push("> **Answer:**");
  contentLines.push("");
  contentLines.push("## 🔗 Where This Appears");
  contentLines.push("*Lectures and notes that cover this concept:*");
  contentLines.push("");
  contentLines.push(dataviewBlock);
  contentLines.push("");
} else {
  contentLines.push(`# ⚙️ ${finalFileName}`);
  contentLines.push("");
  contentLines.push("## 🎯 When to Reach For This");
  contentLines.push("*What does the problem look like when this technique applies?*");
  contentLines.push("");
  contentLines.push("## ⚙️ Steps — My Words");
  contentLines.push("1. ");
  contentLines.push("");
  contentLines.push("## 💻 Example I Worked Through");
  contentLines.push(`\`\`\`${codeLanguage}`);
  contentLines.push("```");
  contentLines.push("");
  contentLines.push("> [!warning] Edge Cases");
  contentLines.push("> - ");
  contentLines.push("");
  contentLines.push("> [!question]- Self-test");
  contentLines.push("> ");
  contentLines.push(">");
  contentLines.push("> **Answer:**");
  contentLines.push("");
  contentLines.push("## 🔗 Where This Appears");
  contentLines.push("*Lectures and notes that use this technique:*");
  contentLines.push("");
  contentLines.push(dataviewBlock);
  contentLines.push("");
}

const conceptContent = contentLines.join("\n");

// --- 5. CREATE THE CONCEPT NOTE ---
const tFolder = tp.app.vault.getAbstractFileByPath(targetFolder);
await tp.file.create_new(conceptContent, finalFileName, false, tFolder ?? targetFolder);

// --- 6. WIRE INTO THE CURRENT NOTE ---
tp.file.cursor_append(`[[${finalFileName}]]`);

const currentFilePath = currentFile.path;
tp.hooks.on_all_templates_executed(async () => {
  const targetFile = tp.app.vault.getAbstractFileByPath(currentFilePath) ?? currentFile;
  await tp.app.fileManager.processFrontMatter(targetFile, (fm) => {
    const existing = Array.isArray(fm.concepts) ? fm.concepts : [];
    const newLink = `[[${finalFileName}]]`;
    const targetLower = finalFileName.toLowerCase();
    // Exact match only — prevents false positives like "[[Bayes Theorem Advanced]]"
    // being treated as equal to a new "Bayes Theorem" link.
    const alreadyLinked = existing.some((entry) => {
      if (!entry) return false;
      if (typeof entry === "object") {
        const path = String(entry?.path ?? "");
        const basename = (path.split("/").pop() ?? "").replace(/\.md$/i, "");
        return basename.toLowerCase() === targetLower;
      }
      const str = String(entry).trim();
      const wiki = str.match(/^\[\[([^\]|#]+)(?:[|#][^\]]*)?\]\]$/);
      const name = (wiki ? wiki[1] : str).replace(/\.md$/i, "");
      return name.toLowerCase() === targetLower;
    });
    if (!alreadyLinked) {
      fm.concepts = [...existing, newLink];
    }
  });
});

new Notice(`💡 Created concept "${finalFileName}" in ${targetFolder}`, 5_000);
%>

<%*
// --- 0. GET THE TARGET FILE & CONTEXT ---
const currentFile = tp.config.target_file;
const context = await tp.user.getUniversityContext(currentFile);
const { subject = "General", parcial = "General" } = context ?? {};

// --- 1. VALIDATION ---
if (!currentFile) {
  new Notice("⛔️ Abort: Templater has no target file.", 10_000);
  return;
}

const basename = currentFile.basename.toLowerCase();
if (!basename.startsWith("untitled") && !basename.startsWith("sin título")) {
  new Notice("⛔️ Abort: Template must be run in a new 'Untitled' note.", 10_000);
  return;
}

// --- 2. PROMPT FOR TOPIC & DEFINE NAME ---
const date = tp.date.now("YYYY-MM-DD");
const topicInput = await tp.system.prompt("Lecture Topic (optional)");
const safeTopic = topicInput?.trim() || "Untitled Topic";

const baseTitle = `Lecture ${date}`;
const noteTitle = topicInput?.trim() ? `${baseTitle} - ${safeTopic}` : baseTitle;
const headingTitle = topicInput?.trim() ? safeTopic : noteTitle;
let newFileName = noteTitle;
let suffix = 1;
while (app.vault.getAbstractFileByPath(`${currentFile.parent.path}/${newFileName}.md`)) {
  newFileName = `${noteTitle} (${suffix++})`;
}

// --- 3. BUILD THE CONTENT ---
const toSlug = (value = "") =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .toLowerCase();

const subjectSlug = toSlug(subject);
const lectureTags = [subjectSlug && `#${subjectSlug}`, "#lecture"].filter(Boolean).join(" ");
const alias = JSON.stringify(headingTitle);

const frontMatter = [
  "---",
  `course: ${JSON.stringify(subject)}`,
  `parcial: ${JSON.stringify(parcial)}`,
  "type: lecture",
  `date: ${JSON.stringify(date)}`,
  "status: draft",
  `aliases: [${alias}]`,
  "---",
].join("\n");

let content = `${frontMatter}\n`;
content += lectureTags ? `${lectureTags}\n\n` : "";
content += `# 🧠 ${headingTitle}\n\n`;
content += "## 📜 Summary\n- [ ] Key takeaway 1\n- [ ] Key takeaway 2\n\n";
content += "## 📚 Definitions\n- [ ] Term :: Definition\n\n";
content += "## 🧩 Key Concepts\n- [ ] Concept :: Insight\n\n";
content += "## 💡 Examples or Code\n";
content += "```c\n";
content += `// Code for: ${safeTopic}\n`;
content += "```\n\n";
content += "## 🧭 Explanation in My Own Words\n- [ ] Insight\n\n";
content += "## 🔗 Connections\n- [ ] Related topic\n\n";
content += "## 🧠 Questions I Still Have\n- [ ] Open question\n";

tR = content;

// --- 4. SET CURSOR & RENAME FILE ---
tp.file.cursor();
await tp.file.rename(newFileName);
new Notice(`📘 Lecture created for ${subject}!`, 5_000);
%>


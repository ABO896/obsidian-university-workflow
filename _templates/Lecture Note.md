<%*
// --- 0. GET THE TARGET FILE & CONTEXT ---
const currentFile = tp.config.target_file;
const context = await tp.user.getUniversityContext(currentFile); // <-- CALLING YOUR NEW USER SCRIPT
const subject = context.subject;
const parcial = context.parcial;

// --- 1. VALIDATION ---
if (!currentFile) {
    new Notice("⛔️ Abort: Templater has no target file.", 10000);
    return;
}
const basename = currentFile.basename.toLowerCase();
if (!basename.startsWith("untitled") && !basename.startsWith("sin título")) {
    new Notice("⛔️ Abort: Template must be run in a new 'Untitled' note.", 10000);
    return;
}

// --- 2. PROMPT FOR TOPIC & DEFINE NAME ---
const date = tp.date.now("YYYY-MM-DD");
const topic = await tp.system.prompt("Lecture Topic (optional)", "Untitled Topic");

const safeTopic = topic ? topic : "Untitled Topic";
const noteTitle = `Lecture ${date}${topic ? " - " + safeTopic : ""}`;
let newFileName = noteTitle;
let i = 1;
while (app.vault.getAbstractFileByPath(`${currentFile.parent.path}/${newFileName}.md`)) {
    newFileName = `${noteTitle} (${i++})`;
}

// --- 3. BUILD THE CONTENT ---
const tag = subject.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "-");
const safeAlias = topic ? topic.replace(/"/g, '\\"') : "Untitled Topic";
const aliasLine = `aliases: ["${safeAlias}"]\n`;
const h1Title = topic ? safeTopic : newFileName;

let content = "---\n";
content += `course: ${subject}\n`;
content += `parcial: ${parcial}\n`;
content += `type: lecture\n`;
content += `date: ${date}\n`;
content += `status: draft\n`;
content += `${aliasLine}`;
content += "---\n";
content += `#${tag} #lecture\n\n`;
content += `# 🧠 ${h1Title}\n\n`; 
content += `## 📜 Summary\n- \n\n`; 
content += `## 📚 Definitions\n- `; 
content += `\n\n## 🧩 Key Concepts\n- \n\n`;
content += `## 💡 Examples or Code\n`;
content += "```c\n";
content += `// Code for: ${safeTopic}\n\n`;
content += "```\n\n";
content += `## 🧭 Explanation in My Own Words\n- \n\n`;
content += `## 🔗 Connections\n- \n\n`;
content += `## 🧠 Questions I Still Have\n- \n`;

tR = content;

// --- 4. SET CURSOR & RENAME FILE ---
tp.file.cursor(); 
await tp.file.rename(newFileName);
new Notice(`📘 Lecture created for ${subject}!`, 5000);
%>
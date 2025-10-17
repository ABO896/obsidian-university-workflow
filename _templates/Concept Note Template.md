<%*
const currentFile = tp.config.target_file;
const context = await tp.user.getUniversityContext(currentFile);
const {
  subject: contextSubject = "General",
  parcial: contextParcial = "General",
} = context ?? {};

const noteUtils = await tp.user.universityNoteUtils();
const {
  pathJoin,
  getBaseUniversityPath,
  getParcialContext,
  ensureFolderPath,
  ensureUniqueFileName,
  sanitizeFolderName,
  reorderOptions,
  buildSubjectOptions,
} = noteUtils ?? {};

if (!noteUtils) {
  new Notice("⛔️ Abort: University note utilities are unavailable.", 10_000);
  return;
}

const parcialOptionsBase = [
  "General",
  "Parcial 1",
  "Parcial 2",
  "Parcial 3",
  "Final",
];

const baseUniversityPath = getBaseUniversityPath(currentFile);
const subjectOptions = buildSubjectOptions(baseUniversityPath, contextSubject);
const NEW_SUBJECT_SENTINEL = "__new_subject__";
const subjectSelection =
  (await tp.system.suggester(
    [...subjectOptions, "➕ Create new subject"],
    [...subjectOptions, NEW_SUBJECT_SENTINEL]
  )) ??
  contextSubject ??
  "General";

let selectedSubject = subjectSelection;

if (subjectSelection === NEW_SUBJECT_SENTINEL) {
  const newSubjectInput = await tp.system.prompt("Name for the new subject");
  selectedSubject = newSubjectInput?.trim() || contextSubject || "General";
}

const parcialOptions = reorderOptions(parcialOptionsBase, contextParcial);
const selectedParcial =
  (await tp.system.suggester(parcialOptions, parcialOptions)) ?? contextParcial ?? "General";

const subjectFolderName =
  selectedSubject && selectedSubject !== "General" ? sanitizeFolderName(selectedSubject) : null;
const parcialFolderName =
  selectedParcial && selectedParcial !== "General" ? sanitizeFolderName(selectedParcial) : null;

const { containerPath: parcialContainerPath } = getParcialContext(
  baseUniversityPath,
  subjectFolderName ?? undefined
);

let targetFolder = parcialContainerPath || baseUniversityPath;

if (subjectFolderName && !(targetFolder?.includes(subjectFolderName))) {
  targetFolder = pathJoin(baseUniversityPath, subjectFolderName);
}

if (parcialFolderName) {
  targetFolder = pathJoin(targetFolder, parcialFolderName);
}

if (!targetFolder) {
  targetFolder = baseUniversityPath;
}

await ensureFolderPath(targetFolder);

const extension = currentFile?.extension ?? "md";
const finalFileName = ensureUniqueFileName(targetFolder, currentFile?.basename ?? "Untitled", extension);
const destinationPath = `${targetFolder}/${finalFileName}.${extension}`;
const needsMove = currentFile?.path !== destinationPath;

if (needsMove) {
  await tp.file.move(destinationPath);
}

tR += [
  "---",
  "type: concept",
  "tags: [concept]",
  `course: ${JSON.stringify(selectedSubject)}`,
  `parcial: ${JSON.stringify(selectedParcial)}`,
  "status: draft",
  "---",
  "",
].join("\n");
%>

# 💡 <% tp.file.title %>

## 📜 Definition
*A formal, textbook-style definition of the concept.*
<%*
tR += "- ";
tp.file.cursor();
%>

## 🧠 Analogy or Metaphor
*How can I explain this concept using a simple, real-world analogy?*
- [ ] Analogy

## 🧭 Explanation in My Own Words
*The Feynman Technique: Explaining it simply to prove I understand it.*
- [ ] Insight

---

## 🔗 Connections
*This concept is mentioned in the following lectures and notes:*

```dataview
LIST FROM [[<% tp.file.title %>]] AND #lecture
SORT file.ctime ASC
```

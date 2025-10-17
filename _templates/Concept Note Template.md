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
} = noteUtils ?? {};

if (!noteUtils) {
  new Notice("⛔️ Abort: University note utilities are unavailable.", 10_000);
  return;
}

const allCourses = [
  "Fundamentos de la Programacion",
  "Matemáticas",
  "Introducción a la Ciberseguridad",
  "Pensamiento Social Cristiano",
  "Inglés I",
];

const parcialOptionsBase = [
  "General",
  "Parcial 1",
  "Parcial 2",
  "Parcial 3",
  "Final",
];

const reorderWithPreference = (options, preferred) => {
  if (!preferred || preferred === "General") {
    return options;
  }

  const normalizedPreferred = preferred.toLowerCase();
  const index = options.findIndex((option) => option.toLowerCase() === normalizedPreferred);

  if (index === -1) {
    return [preferred, ...options];
  }

  return [options[index], ...options.filter((_, idx) => idx !== index)];
};

const subjectOptions = reorderWithPreference(allCourses, contextSubject);
const selectedSubject =
  (await tp.system.suggester(subjectOptions, subjectOptions)) ?? contextSubject ?? "General";

const parcialOptions = reorderWithPreference(parcialOptionsBase, contextParcial);
const selectedParcial =
  (await tp.system.suggester(parcialOptions, parcialOptions)) ?? contextParcial ?? "General";

const baseUniversityPath = getBaseUniversityPath(currentFile);
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

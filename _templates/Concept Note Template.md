<%*
const currentFile = tp.config.target_file;
const context = await tp.user.getUniversityContext(currentFile);
const {
  subject: contextSubject = "General",
  parcial: contextParcial = "General",
} = context ?? {};

const utils = await tp.user.universityNoteUtils();
const {
  pathJoin,
  getBaseUniversityPath,
  listSubjects,
  getParcialContext,
  ensureFolderPath,
  ensureUniqueFileName,
  dedupePreserveOrder,
  sortCaseInsensitive,
  sanitizeFolderName,
} = utils;

const baseUniversityPath = getBaseUniversityPath(currentFile);

const prioritizeOption = (options, preferred) => {
  if (!preferred || preferred === "General") {
    return options;
  }

  const index = options.findIndex((option) => option.toLowerCase() === preferred.toLowerCase());
  if (index === -1) {
    return options;
  }

  const reordered = [...options];
  const [match] = reordered.splice(index, 1);
  return [match, ...reordered];
};

const createSubjectOption = "➕ Create new subject";
const existingSubjects = listSubjects(baseUniversityPath);
let subjectOptions = dedupePreserveOrder([
  ...(contextSubject && contextSubject !== "General" ? [contextSubject] : []),
  ...existingSubjects,
]);

subjectOptions = subjectOptions
  .filter((name) => name.toLowerCase() !== "general")
  .map((name) => name.trim())
  .filter(Boolean);

subjectOptions = [
  "General",
  ...prioritizeOption(sortCaseInsensitive(subjectOptions), contextSubject),
  createSubjectOption,
];

let selectedSubject =
  (await tp.system.suggester(subjectOptions, subjectOptions)) ?? contextSubject ?? "General";

if (selectedSubject === createSubjectOption) {
  const newSubject = await tp.system.prompt("Subject name");
  selectedSubject = newSubject?.trim() || "General";
}

selectedSubject = sanitizeFolderName(selectedSubject) || "General";

const { containerName: parcialesFolderName, existingParcials } =
  getParcialContext(baseUniversityPath, selectedSubject);

const defaultParcials = ["Parcial 1", "Parcial 2", "Parcial 3", "Parcial 4", "Final"];
const createParcialOption = "➕ Create new parcial";
let parcialOptions = dedupePreserveOrder([
  ...(contextParcial && contextParcial !== "General" ? [contextParcial] : []),
  ...existingParcials,
  ...defaultParcials,
]);

parcialOptions = parcialOptions
  .filter((name) => name.toLowerCase() !== "general")
  .map((name) => name.trim())
  .filter(Boolean);

parcialOptions = [
  "General",
  ...prioritizeOption(sortCaseInsensitive(parcialOptions), contextParcial),
  createParcialOption,
];

let selectedParcial =
  (await tp.system.suggester(parcialOptions, parcialOptions)) ?? contextParcial ?? "General";

if (selectedParcial === createParcialOption) {
  const newParcial = await tp.system.prompt("Parcial name");
  selectedParcial = newParcial?.trim() || "General";
}

selectedParcial = sanitizeFolderName(selectedParcial) || "General";

const destinationSegments = [baseUniversityPath];

if (selectedSubject && selectedSubject !== "General") {
  destinationSegments.push(selectedSubject);
}

if (selectedParcial && selectedParcial !== "General") {
  if (parcialesFolderName) {
    destinationSegments.push(parcialesFolderName);
  }

  destinationSegments.push(selectedParcial);
}

const targetFolder = pathJoin(...destinationSegments);
await ensureFolderPath(targetFolder);

const extension = currentFile?.extension ?? "md";
const baseName = currentFile?.basename ?? "Untitled";
const uniqueName = ensureUniqueFileName(targetFolder, baseName, extension);
const desiredPath = `${targetFolder}/${uniqueName}.${extension}`;
const needsMove =
  currentFile?.parent?.path !== targetFolder || (currentFile?.basename ?? "") !== uniqueName;

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

if (needsMove) {
  await tp.file.move(desiredPath);
  new Notice(`🧠 Concept stored in ${targetFolder}`, 5_000);
}
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

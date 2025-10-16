<%*
const currentFile = tp.config.target_file;
const context = await tp.user.getUniversityContext(currentFile);
const {
  subject: contextSubject = "General",
  parcial: contextParcial = "General",
} = context ?? {};

const pathJoin = (...segments) =>
  segments
    .map((segment) => segment?.toString().trim())
    .filter((segment) => segment && segment !== "/")
    .join("/");

const getBaseUniversityPath = (file) => {
  const parentPath = file?.parent?.path ?? "";
  if (!parentPath) {
    return "Universidad";
  }

  const pathParts = parentPath.split("/").filter(Boolean);
  const uniIndex = pathParts.indexOf("Universidad");

  if (uniIndex === -1) {
    return "Universidad";
  }

  return pathJoin(...pathParts.slice(0, uniIndex + 1));
};

const buildTargetFolder = (basePath, subject, parcial) => {
  const segments = [basePath];

  if (subject && subject !== "General") {
    segments.push(subject);
  }

  if (parcial && parcial !== "General") {
    segments.push(parcial);
  }

  return pathJoin(...segments);
};

const ensureFolderPath = async (folderPath) => {
  if (!folderPath) {
    return;
  }

  const segments = folderPath.split("/").filter(Boolean);
  let cumulative = "";

  for (const segment of segments) {
    cumulative = cumulative ? `${cumulative}/${segment}` : segment;

    if (!app.vault.getAbstractFileByPath(cumulative)) {
      try {
        await app.vault.createFolder(cumulative);
      } catch (error) {
        if (!app.vault.getAbstractFileByPath(cumulative)) {
          console.error(`Templater: Failed to create folder ${cumulative}`, error);
          new Notice(`⛔️ Could not create folder: ${cumulative}`, 10_000);
          throw error;
        }
      }
    }
  }
};

const ensureUniqueFileName = (folderPath, baseName, extension = "md") => {
  let candidate = baseName;
  let suffix = 1;

  while (app.vault.getAbstractFileByPath(`${folderPath}/${candidate}.${extension}`)) {
    candidate = `${baseName} (${suffix++})`;
  }

  return candidate;
};

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
const targetFolder = buildTargetFolder(baseUniversityPath, selectedSubject, selectedParcial);
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

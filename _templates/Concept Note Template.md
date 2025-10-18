<%*
const currentFile = tp.config.target_file;
const context = await tp.user.getUniversityContext(currentFile);
const {
  subject: contextSubject = "General",
  parcial: contextParcial = "General",
} = context ?? {};

const noteUtils = await tp.user.universityNoteUtils();
const {
  ensureFolderPath,
  ensureUniqueFileName,
  normalizeParcial,
  resolveSubjectParcialTema,
} = noteUtils ?? {};

if (!noteUtils) {
  new Notice("⛔️ Abort: University note utilities are unavailable.", 10_000);
  return;
}

if (!resolveSubjectParcialTema) {
  new Notice("⛔️ Abort: Placement helper is unavailable.", 10_000);
  return;
}

const placement = await resolveSubjectParcialTema(tp, {
  currentFile,
  contextSubject,
  contextParcial,
  contextTema: "General",
});

const {
  targetFolder,
  subject: resolvedSubject = "General",
  parcial: resolvedParcial = "General",
  tema: resolvedTema = "General",
} = placement ?? {};

const selectedSubject = resolvedSubject || "General";
const selectedParcial = normalizeParcial(resolvedParcial);
const selectedTema = resolvedTema?.toString().trim() || "General";

if (!targetFolder) {
  new Notice("⛔️ Abort: Could not determine destination folder.", 10_000);
  return;
}

await ensureFolderPath(targetFolder);

const today = tp.date.now("YYYY-MM-DD");

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
  `tema: ${JSON.stringify(selectedTema)}`,
  `date: ${JSON.stringify(today)}`,
  `created: ${JSON.stringify(today)}`,
  "status: draft",
  "aliases: []",
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

```dataviewjs
const concept = dv.current();
const targetCourse = concept.course ?? "General";
const targetName = (concept.file?.name ?? "").toLowerCase();
const targetPath = concept.file?.path ?? "";

const allowedTypes = new Set(["lecture"]);
const sortValue = (page) => page.created ?? page.date ?? page.file?.ctime;

const matches = dv
  .pages("")
  .where((page) => (page.course ?? "General") === targetCourse)
  .where((page) => allowedTypes.has((page.type ?? "").toLowerCase()))
  .where((page) => {
    const concepts = Array.isArray(page.concepts) ? page.concepts : [];
    const conceptMatch = concepts.some((entry) => {
      if (!entry) {
        return false;
      }

      const entryValue = entry.path ?? entry.toString?.() ?? entry;
      if (!entryValue) {
        return false;
      }

      const lowered = entryValue.toString().toLowerCase();
      return lowered === targetName || lowered === targetPath.toLowerCase();
    });

    const linkMatch = (page.file?.outlinks ?? []).some((link) => link.path === targetPath);
    return conceptMatch || linkMatch;
  })
  .array()
  .sort((a, b) => dv.compare(sortValue(a), sortValue(b)));

dv.list(matches.map((page) => page.file.link));
```

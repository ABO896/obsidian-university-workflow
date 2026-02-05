<%*
const currentFile = tp.config.target_file;
const context = await tp.user.getUniversityContext(currentFile);
const getConfig = tp.user.universityConfig;
const config = typeof getConfig === "function" ? await getConfig() : null;
const configLabels = config?.labels ?? {};

const noteUtils = await tp.user.universityNoteUtils();
const {
  ensureFolderPath,
  ensureUniqueFileName,
  resolveSubjectParcialTema,
  constants = {},
} = noteUtils ?? {};

if (!noteUtils) {
  new Notice("⛔️ Abort: University note utilities are unavailable.", 10_000);
  return;
}

if (!resolveSubjectParcialTema) {
  new Notice("⛔️ Abort: Placement helper is unavailable.", 10_000);
  return;
}

const generalLabel = constants?.general ?? configLabels.general;
if (!generalLabel) {
  new Notice("⛔️ Abort: University general label is not configured.", 10_000);
  return;
}
const contextSubject = context?.subject ?? generalLabel;
const contextYear = context?.year ?? tp.frontmatter?.year ?? null;

const placement = await resolveSubjectParcialTema(tp, {
  currentFile,
  contextSubject,
  contextYear,
  includeParcial: false,
  contextTema: generalLabel,
});

const {
  targetFolder,
  subject: resolvedSubject = generalLabel,
  year: resolvedYear = null,
  tema: resolvedTema = generalLabel,
} = placement ?? {};

const selectedSubject = resolvedSubject || generalLabel;
const selectedYear = resolvedYear?.toString().trim() || null;
const selectedTema = resolvedTema?.toString().trim() || generalLabel;

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
  selectedYear ? `year: ${JSON.stringify(selectedYear)}` : null,
  `tema: ${JSON.stringify(selectedTema)}`,
  `created: ${JSON.stringify(today)}`,
  "status: draft",
  "aliases: []",
  "---",
  "",
]
  .filter(Boolean)
  .join("\n");
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
const targetCourse = concept.course ?? <%* tR += JSON.stringify(generalLabel); %>;
const targetName = (concept.file?.name ?? "").toLowerCase();
const targetPath = concept.file?.path ?? "";

const allowedTypes = new Set(["lecture"]);
const sortValue = (page) => page.created ?? page.date ?? page.file?.ctime;

const matches = dv
  .pages("")
  .where((page) => (page.course ?? <%* tR += JSON.stringify(generalLabel); %>) === targetCourse)
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

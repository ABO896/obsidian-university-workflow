## Configuration Guide

`_templater_scripts/universityConfig.js` is the single source of truth for this workflow. Every template reads it at runtime, so editing this one file changes folder names, prompt labels, year options, and exam-period behaviour across the whole system — you never have to touch a template to adapt it to your vocabulary. After editing the file, reload Templater user scripts (command palette → **Templater: Reload scripts**) or restart Obsidian so your changes take effect.

### Anatomy of universityConfig.js

The config is a single JavaScript object with seven top-level groups:

| Group | What it controls |
|-------|-----------------|
| `fs` | Filesystem folder names — where notes land in your vault |
| `labels` | The prompt text shown in pickers when you run a template |
| `years` | The options shown in the year picker |
| `parciales` | The options shown in the exam-period picker |
| `codeLanguage` | The default language identifier for code fences in Lecture Notes |
| `features` | Feature toggles — currently just `parcial`, which enables exam-period grouping |
| `schema` | Note types, workflow statuses, and spaced-repetition review intervals |

### Key Reference

| Key path | Default | What it controls |
|----------|---------|-----------------|
| `fs.universityRoot` | `"Universidad"` | Base folder in vault root where all university notes live |
| `fs.parcialContainer` | `"Parciales"` | Container folder for exam-period subfolders (only used when `features.parcial` is `true`) |
| `fs.temaContainer` | `"Temas"` | Container folder for topic/module subfolders inside each subject |
| `labels.subject` | `"Subject"` | Text shown in the subject picker prompt |
| `labels.year` | `"Year"` | Text shown in the year picker prompt |
| `labels.parcial` | `"Parcial"` | Text shown in the exam-period picker (rename to `"Semester"` or `"Term"` to match your institution) |
| `labels.final` | `"Final"` | Label for the final-exam option in the parcial picker |
| `labels.tema` | `"Tema"` | Text shown in the tema picker (rename to `"Module"`, `"Topic"`, etc.) |
| `labels.general` | `"General"` | Catch-all label used when no specific tema is chosen |
| `years` | `["Year 1", "Year 2", "Year 3", "Year 4", "Year 5"]` | Options shown in the year picker — edit to match your curriculum length |
| `parciales` | `["General", "Parcial 1", "Parcial 2", "Parcial 3", "Final"]` | Options shown in the exam-period picker |
| `codeLanguage` | `""` | Default language for Lecture Note code fences (`""` = language-neutral; set to `"python"`, `"java"`, etc.) |
| `features.parcial` | `false` | When `true`, enables the exam-period prompt and the `Parciales/` folder layer in applicable templates |
| `schema.types` | object (`lecture`, `concept`, `subject-hub`, `parcial-prep`, `general`, `university-dashboard`) | Note type identifiers used in frontmatter and Dataview filters |
| `schema.statuses` | `["raw", "draft", "reviewed", "complete"]` | Workflow stages used by the Update Note Status picker |
| `schema.reviewIntervals` | `{ easy: 14, medium: 7, hard: 3, blank: 1 }` | Days until next review per recall difficulty, used by Mark Reviewed |

### Common Customizations

- **Change the base folder name.** Update `fs.universityRoot` (e.g., `"University"`, `"Academics"`, `"Uni"`). All new notes will be placed inside this folder at the vault root.
- **Rename "Temas".** Update `fs.temaContainer` so the folder hierarchy matches your vocabulary (e.g., `"Topics"`, `"Modules"`). Also update `labels.tema` so the picker prompt uses the same word.
- **Switch labels to a different language.** Edit any value under `labels` — `labels.subject`, `labels.year`, `labels.tema`, `labels.general` — to match your preferred language. The prompts shown when running a template will update immediately after reloading scripts.
- **Adjust the years list.** Edit the `years` array to match your curriculum length (e.g., remove two entries for a 3-year programme, add one for a 6-year programme).
- **Adjust the exam-period options.** Edit the `parciales` array to match your institution's structure (e.g., `["Semester 1", "Semester 2", "Final"]`).
- **Set a default code fence language.** Change `codeLanguage` to any valid identifier (e.g., `"python"`, `"java"`) so Lecture Note code blocks default to syntax highlighting for your main subject.
- **Customise note statuses.** Edit `schema.statuses` if you want different workflow stages. The Update Note Status picker and Dataview filters both read this array.
- **Enable exam-period grouping.** Set `features.parcial: true` to activate the parcial/semester folder layer. When this is `false` (the default), all exam-period prompts and the `Parciales/` folder hierarchy are completely hidden — the Parcial Prep Note becomes a generic study guide without the period selection step. When `true`, the full exam-period prompt appears and notes are filed inside `Parciales/<Parcial N>/`. Rename `labels.parcial` to `"Semester"` or `"Term"` to match your vocabulary.

### Worked Example: English curriculum with semesters

**Scenario:** You are switching from the Spanish defaults to an English vocabulary AND moving from a 5-year curriculum to a 3-year curriculum AND turning on semester-based exam-period grouping.

**Before** (the relevant slices of the default config):

```js
fs: {
  universityRoot: "Universidad",
  // ...
},
labels: {
  // ...
  parcial: "Parcial",
  // ...
  tema: "Tema",
  // ...
},
years: ["Year 1", "Year 2", "Year 3", "Year 4", "Year 5"],
features: {
  parcial: false,
},
```

**After** (the same slices with your new values):

```js
fs: {
  universityRoot: "University",
  // ...
},
labels: {
  // ...
  parcial: "Semester",
  // ...
  tema: "Module",
  // ...
},
years: ["Year 1", "Year 2", "Year 3"],
features: {
  parcial: true,
},
```

**What changes:**

- New notes land under a `University/` root folder instead of `Universidad/`. Any notes you created before this change remain in `Universidad/` — only new notes use the updated path.
- Prompts now say "Module" instead of "Tema" and "Semester" instead of "Parcial" throughout all templates. The subject and year pickers are unaffected.
- Parcial Prep Note now asks you to select the semester and places the file inside `Parciales/<Semester>/`. Note: `fs.parcialContainer` is unchanged in this example, so the container folder is still literally named `Parciales/` in your vault. If you want the folder itself to say "Semesters", also change `fs.parcialContainer` to `"Semesters"`.

After making these edits, reload Templater scripts (command palette → **Templater: Reload scripts**) and run a Lecture Note to confirm the prompts reflect your new values.

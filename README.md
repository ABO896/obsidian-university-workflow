# Obsidian University Workflow

> Streamlined, config-driven Obsidian templates for capturing every class, concept, and course hub without breaking your rhythm.

- [TL;DR](#tldr)
- [Why this exists](#why-this-exists)
- [Features at a glance](#features-at-a-glance)
- [Quick Start](#quick-start)
- [How it works](#how-it-works)
- [Configure & Customize](#configure--customize)
- [Usage](#usage)
  - [Lecture Note](#lecture-note)
  - [Concept Note](#concept-note)
  - [General Note](#general-note)
  - [Subject Hub](#subject-hub)
  - [Parcial Prep Note](#parcial-prep-note)
  - [Assign Tema to Current Note](#assign-tema-to-current-note)
  - [Link Concepts to Note](#link-concepts-to-note)
  - [Quick Create Concept](#quick-create-concept)
  - [Update Note Status](#update-note-status)
- [Repository Layout](#repository-layout)
- [Extending the system](#extending-the-system)
- [Conventions](#conventions)
- [Troubleshooting](#troubleshooting)
- [FAQ](#faq)
- [License](#license)

![MIT License](https://img.shields.io/badge/License-MIT-brightgreen.svg) ![Templater Required](https://img.shields.io/badge/Templater-Required-blueviolet) ![Dataview Required](https://img.shields.io/badge/Dataview-Required-ff69b4)

## TL;DR

- Capture lectures, concepts, and general notes in seconds while helpers file everything for you.
- One config file renames every label and folder so the workflow matches your language and vault.
- Guardrails prevent misplaced notes, duplicate filenames, and missing frontmatter.
- Dataview dashboards auto-populate hubs and concept backlinks once notes exist.
- Shared helpers keep folder placement, slugging, and normalization consistent across templates.
- Works on desktop Obsidian with Templater + Dataview; this workflow is desktop-only because it depends on Templater user functions.

## Why this exists (problem → solution in plain language)

University notes quickly sprawl across random folders, and every template tweak becomes a hunt for strings to rename. This workflow treats Obsidian like a product: you run a command, answer a few prompts, and get a fully organized note with consistent frontmatter, tags, and Dataview-ready metadata. The shared helpers and config file keep everything in sync so you can rename folders, change labels, or add new year options without editing five different templates.

## Features at a glance

- ✨ Config-first design – `_templater_scripts/universityConfig.js` drives folder names, labels, and schema.
- 🧭 Smart placement – helpers resolve subjects/years/temas and build folders on demand.
- 🧩 Safe naming – sanitization + unique name checks prevent collisions and illegal characters.
- 🚀 Dataview-ready – templates ship with tables, dashboards, and backlink queries that populate instantly.
- 📚 Guarded workflows – `tp.config.run_mode` + untitled-note checks prevent accidental overwrites.
- 🔁 Reusable helpers – path logic, slugging, and normalization are shared for any new template you add.
- 🎯 Multi-select concepts – Lecture Note uses `tp.system.multi_suggester` (Templater ≥ 2.16) to pre-tag which concepts a lecture covers.
- 🔀 Optional exam-period grouping – `features.parcial` toggle (default off) enables Parcial/Semester folder organisation without affecting normal note creation.
- 🔗 Retroactive concept linking – **Link Concepts to Note** wires existing concept notes into any lecture's `concepts` array via multi-select.
- ⚡ Quick concept creation – **Quick Create Concept** spins up a concept note from a text selection and links it back to the current note in one step.
- 📊 Batch status updates – **Update Note Status** bulk-changes the `status` field across multiple university notes in a single operation.

## Quick Start

1. Copy `_templates/` and `_templater_scripts/` into your vault root.
2. In Obsidian → *Settings → Templater*, point **Template folder** to `_templates` and **Script folder** to `_templater_scripts`.
3. Reload Templater user scripts so `universityConfig`, `getUniversityContext`, and `universityNoteUtils` register.
4. Enable the Dataview community plugin for dashboards and inline queries to render.
5. Run a template via the command palette **"Templater: Create new note from template"** or open a fresh untitled note and trigger it from there.

> **Tip:** Running templates via **"Create new note from template"** (Templater ≥ 2.1) skips the untitled-note requirement — Templater guarantees a fresh file in that mode (`tp.config.run_mode === 0`).
>
> **Tip:** For the Lecture Note, select relevant text before running the template and it pre-fills the topic prompt automatically (`tp.file.selection()`).
>
> **Requires Templater ≥ 2.16** for the multi-select concept tagging feature in Lecture Note. Older versions fall back gracefully (concepts array starts empty).

## How it works

- Template command →
- Shared helpers (`tp.user.universityNoteUtils`) →
- Placement resolver (subject → tema folders + optional year metadata) →
- Frontmatter builder (type, course, year, tema, timestamps, status, aliases) →
- Dataview surfaces (tables, dashboards, backlinks)

All templates and utilities pull labels, folder names, and canonical years from `_templater_scripts/universityConfig.js`, making it the single source of truth.

## Configure & Customize

The central config, `_templater_scripts/universityConfig.js`, powers every label and folder reference. Change it once and every template reflects your vocabulary.

```js
const universityConfig = {
  fs: {
    universityRoot: “Universidad”,   // rename the base folder here
    parcialContainer: “Parciales”,   // container for exam-period folders
    temaContainer: “Temas”,          // container for topic folders
  },
  labels: {
    subject: “Subject”, // subject picker label
    year: “Year”,       // academic year label
    parcial: “Parcial”, // rename to “Semester” or “Term” when features.parcial is true
    final: “Final”,     // label for the final exam period
    tema: “Tema”,       // rename to “Module”, “Topic”, etc.
    general: “General”, // catch-all label for notes & default tema
  },
  years: [“Year 1”, “Year 2”, “Year 3”, “Year 4”, “Year 5”],
  parciales: [“General”, “Parcial 1”, “Parcial 2”, “Parcial 3”, “Final”],
  codeLanguage: “”,     // default code fence language in Lecture Notes (“python”, “java”, etc.)
  features: {
    parcial: false,     // true = enable exam-period grouping (Parciales / Semesters)
  },
  schema: {
    types: { lecture: “lecture”, concept: “concept”, “subject-hub”: “subject-hub”,
             “parcial-prep”: “parcial-prep”, general: “general” },
    statuses: [“draft”, “reviewed”, “complete”],
  },
};
```

<details>
<summary>Common tweaks</summary>

- **Change the base folder name.** Update `fs.universityRoot` (e.g., `”Academics”`, `”Uni”`).
- **Rename “Temas”.** Modify `fs.temaContainer` so placement helpers use your vocabulary (e.g., `”Topics”`, `”Modules”`).
- **Switch labels in prompts.** Edit `labels.subject`, `labels.year`, `labels.tema`, or `labels.general` for any language.
- **Adjust default years.** Edit the `years` array to match your curriculum length.
- **Adjust parcial options.** Edit the `parciales` array to match your exam periods (e.g., `[“Semester 1”, “Semester 2”, “Final”]`).
- **Set the default code fence language.** Change `codeLanguage` to any valid identifier (e.g., `”python”`, `”java”`) for Lecture Note code blocks; leave empty for a language-neutral block.
- **Customise note types and statuses.** The `schema.types` map drives Dataview filters and the `schema.statuses` array powers the **Update Note Status** picker.
- **Enable exam-period grouping.** Set `features.parcial: true` to activate the Parcial/Semester folder layer. Rename `labels.parcial` to `”Semester”` or `”Term”` to match your institution's vocabulary. With this off (default), all parcial prompts and `Parciales/` folders are invisible.
</details>

Because templates read the config at runtime, you never hard-code translations—just change the config and reload Templater.

## Usage

### Lecture Note

1. Create a new untitled note.
2. Run **Lecture Note**; the helper asks for year first, then subject, then tema.
3. Enter an optional lecture topic; the helper sanitizes it and builds the filename.
4. Optionally multi-select concept notes to pre-tag which concepts this lecture covers.
5. The template moves the file into `<University>/<Year>/<Subject>/<Tema?>`, adds frontmatter, and inserts structured sections.

```md
---
type: lecture
course: "Physics I"
year: "Year 1"
tema: "Waves"
created: "2024-05-03"
status: draft
aliases: ["Lecture 2024-05-03 - Waves"]
concepts: []
---
```

### Concept Note

1. Run **Concept Note Template** from any note (untitled or existing).
2. Select the year, then the subject; create a new one if needed.
3. Choose a tema or skip to keep it general.
4. The helper moves the note into the proper year/subject/tema path.
5. Fill in the definition, analogy, and explanation sections; Dataview shows related lectures automatically.

```md
---
type: concept
course: "Physics I"
year: "Year 1"
tema: "Waves"
created: "2024-05-03"
status: draft
aliases: []
tags: [concept]
---
```

### General Note

1. Run **General Note** from a new or existing note.
2. Confirm if you want to continue when launching from a pre-named file.
3. Pick the year, then the subject, and optional tema.
4. Provide the note title; helpers sanitize and ensure a unique filename.
5. The template moves the note, writes frontmatter, and leaves the cursor ready for free-form content.

```md
---
type: general
course: "Physics I"
year: "Year 1"
tema: "Reference"
created: "2024-05-03"
status: draft
aliases: ["Formula Sheet"]
---
```

### Subject Hub

1. Create a new untitled note at any location.
2. Run **Subject Hub**; the helper asks for year first, then subject.
3. The helper anchors the hub at `<University>/<Year>/<Subject>/` and generates a safe filename.
4. Frontmatter and tags are inserted, along with Dataview dashboards for lectures, concepts, years→temas, and tasks.
5. Review the checklist and fill in the overview to keep your hub current.

```md
---
type: subject-hub
course: "Physics I"
created: "2024-05-03"
status: draft
aliases: []
tags: ["course/physics-i", "subject-hub"]
updated: "2024-05-03"
---
```

### Parcial Prep Note (Study Guide)

1. Create a new untitled note (or run via **"Create new note from template"**).
2. Run **Parcial Prep Note**; the helper walks you through year → subject.
   - When `features.parcial: true`, a third step prompts for the exam period (Parcial 1, Final, etc.) and the note is placed in `Parciales/<Parcial N>/`.
   - When `features.parcial: false` (default), the note is placed at the subject root as a general study guide.
3. Dataview tables surface all lectures and concepts for the selected course/year automatically.
4. Fill in Topics to Cover, Summary Notes, and Practice Questions; the formula table is ready for key facts.
5. Tab through the three cursor stops (topics → notes → questions) for fast entry.

```md
---
type: parcial-prep
course: "Physics I"
year: "Year 1"
parcial: "Parcial 2"   # only present when features.parcial: true
created: "2024-05-03"
status: draft
aliases: []
---
```

### Assign Tema to Current Note

1. Open any note with frontmatter (lecture, concept, or general).
2. Run **Assign Tema to Current Note** to reuse the same placement helper.
3. Select or create the subject/tema combination (with optional year context).
4. The script moves the file if necessary and updates frontmatter.
5. Tags derived from the subject/tema slugs appear in the completion notice.

```md
course: "Physics I"
year: "Year 2"
tema: "Oscillations"
```

### Link Concepts to Note

1. Open any lecture or general note with a `course` in its frontmatter.
2. Run **Link Concepts to Note**; the template discovers all concept notes for that course.
3. Already-linked concepts are prefixed with "✓" in the picker for visibility.
4. Multi-select the concepts to link; the template appends them to the note's `concepts` array.
5. The note body is untouched — only frontmatter is updated.

> **Requires Templater ≥ 2.16** for `tp.system.multi_suggester`.

### Quick Create Concept

1. Highlight a term in any note (optional — pre-fills the concept name prompt).
2. Run **Quick Create Concept**; enter the concept name when prompted.
3. The template inherits course/year/tema from the current note so placement dialogs only appear when context is ambiguous.
4. A new concept note is created at the resolved path via `tp.file.create_new`.
5. A `[[link]]` is appended at the editor cursor, and the new concept is added to the current note's `concepts` frontmatter array.

### Update Note Status

1. Open any note (the active file is irrelevant — the template works vault-wide).
2. Run **Update Note Status**; pick the target status from the configured `schema.statuses` list (e.g., `draft`, `reviewed`, `complete`).
3. A multi-select shows all university notes that are not already at that status, labelled as `"Note Title [Course] (current_status)"`.
4. Select the notes to update; frontmatter is batch-written via `processFrontMatter`.

> **Requires Templater ≥ 2.16** for `tp.system.multi_suggester`.

<details>
<summary>Template prompts quick reference</summary>

| Template | Prompts for subject? | Prompts for year? | Prompts for parcial? | Prompts for tema? |
| --- | --- | --- | --- | --- |
| Lecture Note | ✅ | ✅ | 🚫 | ✅ (with skip option) |
| Concept Note | ✅ | ✅ | 🚫 | ✅ |
| General Note | ✅ | ✅ | 🚫 | ✅ |
| Subject Hub | ✅ | ✅ | 🚫 | 🚫 (hubs stay at subject root) |
| Parcial Prep Note | ✅ | ✅ | ✅ | 🚫 (scoped by parcial, not tema) |
| Assign Tema | ✅ | ✅ | 🚫 | ✅ |
| Link Concepts to Note | 🚫 (reads from frontmatter) | 🚫 | 🚫 | 🚫 |
| Quick Create Concept | ✅ (inherited) | ✅ (when ambiguous) | 🚫 | ✅ (inherited) |
| Update Note Status | 🚫 | 🚫 | 🚫 | 🚫 |
</details>

## Repository Layout

```text
_templates/
  Lecture Note.md              # Guided lecture capture with placement + sections
  Concept Note Template.md     # Concept deep dives with Dataview backlinks
  General Note.md              # Flexible note with consistent metadata
  Subject Hub.md               # Course dashboard anchored at year/subject root
  Parcial Prep Note.md         # Exam-prep dashboard scoped to a parcial period
  Assign Tema to Current Note.md # Utility to update existing notes
  Link Concepts to Note.md     # Retroactively wire concept links into a note
  Quick Create Concept.md      # Create + link a concept note from a selection
  Update Note Status.md        # Batch-update the status field across notes
_templater_scripts/
  universityConfig.js          # Central labels, folders, years, schema
  scriptLoader.js              # Shared module-loading helper (requireScript)
  getUniversityContext.js      # Infers subject/year from current file path
  universityNoteUtils.js       # Shared helpers for placement, slugging, and naming
tests/
  universityNoteUtils.test.js  # Node.js test suite for pure helper functions
AGENTS.md                      # Codex project guidance
CLAUDE.md                      # Claude Code project instructions
LICENSE                        # MIT license
README.md                      # Documentation you are reading
```

## Extending the system

- **Add a new note type.** Start a template in `_templates/`, import `tp.user.universityNoteUtils()`, and call `resolveSubjectParcialTema` (or `resolveSubjectAndParcial`) to reuse placement logic. Follow the existing frontmatter keys so Dataview filters stay compatible.
- **Use placement helpers.** After `resolveSubjectParcialTema`, call `ensureFolderPath` and `ensureUniqueFileName` before moving the file; this avoids duplicating folder math or sanitization.
- **Align frontmatter with Dataview.** New templates should set `type`, `course`, `year`, `tema`, `created`, and `status` (plus `updated` when relevant) so subject hubs and concept queries include them automatically.
- **Lean on utilities.** Functions like `toSlug`, `normalizeYear`, and `dedupePreserveOrder` keep tags, folder names, and prompt options predictable.

## Conventions

| Key | Purpose | Set by |
| --- | --- | --- |
| `type` | Template or note category (`lecture`, `concept`, `general`, `subject-hub`, `parcial-prep`) | Each template / config schema |
| `course` | Human-readable subject name | Placement helper + prompts |
| `year` | Optional academic year label for filtering/grouping | Placement helper |
| `tema` | Optional topic/module label; defaults to general label | Placement helper |
| `created` | Primary timestamp for Dataview sorting (falls back to legacy `date`) | Template runtime |
| `status` | Workflow status (`draft` by default) | Template runtime |
| `aliases` | Alternative names for search/backlinks | Template runtime |
| `tags` | Hubs use `course/<slug>` + `subject-hub`; concept notes use `[concept]` | Subject Hub / Concept Note templates |
| `updated` | Last refresh date (Subject Hub only) | Subject Hub template |
| `concepts` | Lecture note backlinks to concept pages | Lecture Note template |
| `parcial` | Exam period for prep notes (`"Parcial 1"`, `"Final"`, etc.) | Parcial Prep Note template |

- **Legacy compatibility:** Dashboards sort by `created` but automatically fall back to older `date` fields (or `file.ctime`) when that key is missing, so mixed notes continue to render correctly.
- **Tags & slugs:** `toSlug` converts subject/tema names into lowercase hyphenated tags. Inline tags appear in lecture and general notes; hubs store them in `tags`.
- **Years & temas:** `normalizeYear` supports canonical year labels from config and common path variants (e.g., `year-3`). Tema prompts always include a skip option that falls back to the general label.
 
## Troubleshooting

- Template aborts immediately → You likely ran it on a named file; start from an untitled note, or use **"Templater: Create new note from template"** which bypasses that check.
- Helper not found → Re-check Templater script folder settings and reload user scripts.
- Folders didn’t appear → Desktop Obsidian is required for folder creation; confirm filesystem permissions.
- Template fails on mobile → Templater user functions (`tp.user.*`) are not available on Obsidian mobile.
- Wrong year detected → Update frontmatter for that note or adjust `years` in config so normalization matches your naming.
- Dataview outputs are empty → Ensure the plugin is enabled and notes contain the expected `type`, `course`, and tag metadata.
- Tema assignment skipped → Run **Assign Tema** again and make sure you completed the prompts instead of cancelling.
- Concept multi-select not showing → Update Templater to ≥ 2.16 for `tp.system.multi_suggester` support; older versions skip the step and leave `concepts: []`.
- Parcial Prep Note doesn’t ask for a parcial → This is correct when `features.parcial: false` (the default). Set it to `true` in config to enable exam-period grouping.
- Link Concepts / Update Note Status doesn’t appear → Both require Templater ≥ 2.16 for `tp.system.multi_suggester`. Update Templater to use these templates.
- Quick Create Concept places the note in the wrong folder → The template inherits context from the current note’s frontmatter. Ensure `course`, `year`, and `tema` are set correctly on the source note.

## FAQ

**Can I rename folders and labels?** Yes—edit `_templater_scripts/universityConfig.js` and reload Templater.

**Do I need Dataview installed?** Yes, dashboards and concept backlink queries rely on it.

**What about mobile?** This workflow is desktop-only. Templater user functions are unavailable on Obsidian mobile, and all templates here depend on `tp.user.*` scripts.

**Can I add more years or temas?** Absolutely; update the `years` array and the helpers will normalize new values.

**How do I add a new template?** Copy an existing template, keep the helper imports, and reuse `resolveSubjectParcialTema` before you add custom sections.

**Can I avoid extra year prompts?** Yes; once a subject already has a consistent `year` in frontmatter, helpers auto-reuse it and stop asking unless there is ambiguity.

**Do I need to write JavaScript?** Only for advanced extensions—the provided helpers cover placement, slugging, and normalization out of the box.

**Do I need the parcial/semester system?** No — it is off by default (`features.parcial: false`). Enable it in config only if your curriculum uses distinct exam periods that you want to mirror in the folder structure.

**Can I use semesters instead of parciales?** Yes — set `features.parcial: true` and change `labels.parcial` to `"Semester"` (or `"Term"`). Folder names and prompts will use your chosen label.

**The concept multi-select doesn't appear when creating a lecture.** Update Templater to version 2.16 or newer. The feature uses `tp.system.multi_suggester` which was added in that release; older installs fall back silently.

**Can I link concepts to a note after creating it?** Yes — run **Link Concepts to Note** on any note with a `course` in frontmatter. It discovers matching concept notes and lets you multi-select.

**Can I create a concept note without leaving my lecture?** Yes — highlight a term and run **Quick Create Concept**. It creates the concept note, appends a `[[link]]` at your cursor, and wires up the `concepts` frontmatter array.

**Can I batch-update note statuses?** Yes — run **Update Note Status**, pick the target status, then multi-select the notes to update. Statuses are driven by `schema.statuses` in config.

## License

Released under the MIT License. See [`LICENSE`](LICENSE).

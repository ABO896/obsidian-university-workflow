# Obsidian University Workflow

> Streamlined, config-driven Obsidian templates for capturing every class, concept, and course hub without breaking your rhythm.

- [TL;DR](#tldr)
- [Why this exists](#why-this-exists-problem--solution-in-plain-language)
- [Features at a glance](#features-at-a-glance)
- [Setup Guide](#setup-guide)
  - [Prerequisites](#prerequisites)
  - [Step 1: Install Templater](#step-1-install-templater)
  - [Step 2: Install Dataview](#step-2-install-dataview)
  - [Step 3: Copy the workflow files into your vault](#step-3-copy-the-workflow-files-into-your-vault)
  - [Step 4: Configure Templater](#step-4-configure-templater)
  - [Step 5: Reload Templater user scripts](#step-5-reload-templater-user-scripts)
  - [Step 6: Verify the setup](#step-6-verify-the-setup)
  - [Version requirement](#version-requirement)
- [Configuration Guide](#configuration-guide)
  - [Anatomy of universityConfig.js](#anatomy-of-universityconfigjs)
  - [Key Reference](#key-reference)
  - [Common Customizations](#common-customizations)
  - [Worked Example: English curriculum with semesters](#worked-example-english-curriculum-with-semesters)
- [Workflow Walkthrough](#workflow-walkthrough)
  - [Stage 1: In class — capture the lecture](#stage-1-in-class--capture-the-lecture)
  - [Stage 2: Mid-lecture — capture a concept on the fly](#stage-2-mid-lecture--capture-a-concept-on-the-fly)
  - [Stage 3: After class — link the remaining concepts](#stage-3-after-class--link-the-remaining-concepts)
  - [Stage 4: Before the exam — build a parcial prep note](#stage-4-before-the-exam--build-a-parcial-prep-note)
- [Template Reference](#template-reference)
  - [Prompt Quick Reference](#prompt-quick-reference)
  - [Creation Templates](#creation-templates)
    - [Lecture Note](#lecture-note)
    - [Concept Note Template](#concept-note-template)
    - [General Note](#general-note)
    - [Subject Hub](#subject-hub)
    - [Parcial Prep Note](#parcial-prep-note)
  - [Utility Templates](#utility-templates)
    - [Assign Tema to Current Note](#assign-tema-to-current-note)
    - [Link Concepts to Note](#link-concepts-to-note)
    - [Quick Create Concept](#quick-create-concept)
    - [Update Note Status](#update-note-status)
    - [Mark Reviewed](#mark-reviewed)
  - [Dashboards](#dashboards)
    - [University Dashboard](#university-dashboard)
- [How it works](#how-it-works)
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
- ⚙️ Bootstrap helper – a single `tp.user.templateBootstrap(tp)` call replaces the ~30-line guard + utility-loading preamble, keeping every template lean and consistent.
- 🎯 Multi-select concepts – Lecture Note uses `tp.system.multi_suggester` (Templater ≥ 2.16) to pre-tag which concepts a lecture covers.
- 🔀 Optional exam-period grouping – `features.parcial` toggle (default off) enables Parcial/Semester folder organisation without affecting normal note creation.
- 🔗 Retroactive concept linking – **Link Concepts to Note** wires existing concept notes into any lecture's `concepts` array via multi-select.
- ⚡ Quick concept creation – **Quick Create Concept** spins up a concept note from a text selection and links it back to the current note in one step.
- 📊 Batch status updates – **Update Note Status** bulk-changes the `status` field across multiple university notes in a single operation.

## Setup Guide

By the end of this section, you will have installed Templater and Dataview, told Templater where to find this vault's templates and scripts, and verified the setup by creating a test Lecture Note.

### Prerequisites

- **Obsidian desktop.** This workflow is desktop-only because the helper scripts (`tp.user.*`) cannot run on Obsidian mobile — they rely on Obsidian's desktop-only user functions feature.
- **Community plugins enabled.** Open `Settings -> General` and turn on **Community plugins** if you have not done so already.

### Step 1: Install Templater

Open `Settings -> Community Plugins -> Browse`, search for **Templater**, click **Install**, then click **Enable**.

### Step 2: Install Dataview

Open `Settings -> Community Plugins -> Browse`, search for **Dataview**, click **Install**, then click **Enable**.

Dataview renders the course dashboards and backlink tables that appear inside Subject Hub notes and Parcial Prep notes.

### Step 3: Copy the workflow files into your vault

Copy the `_templates/` folder and the `_templater_scripts/` folder into your vault root — the same level as your `.obsidian/` folder. After copying, your vault root should contain at minimum:

```
YourVault/
├── .obsidian/
├── _templates/
└── _templater_scripts/
```

### Step 4: Configure Templater

Open `Settings -> Templater` and set the following two paths:

- **Template folder location:** `_templates`
- **Script files folder location:** `_templater_scripts`

You can also turn on **Trigger Templater on new file creation** if you want templates to run automatically when you create a new note. This is optional but convenient.

### Step 5: Reload Templater user scripts

After setting the Script files folder, Templater needs to load the helper scripts before they are available. Do one of the following:

- Open the command palette (`Ctrl/Cmd + P`) and run **Templater: Replace templates in the active file**.
- Or simply restart Obsidian.

Either action registers the five helper scripts by name: `universityConfig`, `getUniversityContext`, `universityNoteUtils`, `scriptLoader`, and `templateBootstrap`. Once registered, all templates can call them.

### Step 6: Verify the setup

To confirm everything is working:

1. Create a new untitled note in Obsidian.
2. Open the command palette and run **Templater: Create new note from template**.
3. Select **Lecture Note** from the list.
4. If prompts appear asking you to choose a year, subject, and tema, the setup is complete.

If the prompts do not appear, double-check that the `_templater_scripts/` folder is in your vault root and that Step 4 and Step 5 are complete.

### Version requirement

Templater **2.16 or later** is required for the multi-select features (`tp.system.multi_suggester`). These are used by Lecture Note concept tagging, Link Concepts to Note, and Update Note Status. If you are running an older version of Templater, the workflow will partially function but those multi-select steps will be skipped silently.

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

## Workflow Walkthrough

This is what a single study cycle looks like — from sitting down in class to closing the laptop the night before an exam. Each stage uses one template; the running example uses a Year 1 Physics I lecture on the electromagnetic spectrum.

### Stage 1: In class — capture the lecture

1. Open Obsidian and create a new untitled note (or open the command palette and choose **"Templater: Create new note from template"**).
2. Run the **Lecture Note** template.
3. Answer the prompts in this order:
   - **Year** → select `Year 1`
   - **Subject** → select `Physics I`
   - **Tema** → select `Waves`
   - **Topic** → type `Electromagnetic Spectrum`
4. When the concept multi-select appears, optionally pick concept notes you already have in the vault — for example, `Photon` or `Wave-Particle Duality` — to pre-tag which concepts this lecture covers. Press Enter to skip if you have none yet.
5. The template moves the file to `University/Year 1/Physics I/Temas/Waves/Lecture 2026-05-15 - Electromagnetic Spectrum.md` and inserts structured sections with frontmatter already filled in.
6. The cursor lands in the prepared note body so you can start taking notes immediately.

### Stage 2: Mid-lecture — capture a concept on the fly

1. As you write, highlight a term in the lecture note — for example, `Photoelectric Effect`.
2. Run the **Quick Create Concept** template from the command palette.
3. When prompted for the concept name, the highlighted text is already filled in; confirm it or type a new name.
4. The template creates a new concept note at `University/Year 1/Physics I/Temas/Waves/Photoelectric Effect.md`, inserts a `[[Photoelectric Effect]]` link at the cursor in your lecture note, and adds `Photoelectric Effect` to the lecture note's `concepts` frontmatter array.
5. Because the template inherits `course`, `year`, and `tema` from your current note's frontmatter, you are not asked to pick them again — placement is automatic.

### Stage 3: After class — link the remaining concepts

1. Open the lecture note from Stage 1.
2. Run the **Link Concepts to Note** template.
3. A multi-select picker appears listing every concept note filed under Physics I. Concepts already linked to this lecture are shown with a `✓` prefix so you can see at a glance what is already wired up.
4. Select the additional concepts you want to associate with this lecture.
5. The template updates the `concepts` array in the lecture note's frontmatter — the body of the note is left completely untouched.

### Stage 4: Before the exam — build a parcial prep note

1. Create a new untitled note (or use **"Templater: Create new note from template"**).
2. Run the **Parcial Prep Note** template.
3. Answer the prompts:
   - **Year** → `Year 1`
   - **Subject** → `Physics I`
   - If `features.parcial: true` is set in your config, a third prompt appears: pick the exam period, for example `Parcial 2`.
4. The template creates a study guide note with Dataview tables that auto-populate with every lecture and every concept note from Physics I / Year 1 — no manual linking required.
5. Tab through three cursor stops to fill in your study material: **Topics to Cover**, **Summary Notes**, and **Practice Questions**.
6. When `features.parcial: false` (the default), the file is placed directly at the subject root as a general study guide. When `features.parcial: true`, it is placed inside `Parciales/Parcial 2/` so each exam period has its own prep note.

---

The core workflow chains just four templates and one config flag. Once this cycle feels natural, the other templates — **Subject Hub**, **Mark Reviewed**, **Update Note Status**, and the rest — are documented in the Template Reference section that follows.

## Template Reference

This section is a lookup table for all 11 templates. Templates are grouped into three categories: **Creation Templates** (make a new note), **Utility Templates** (operate on existing notes), and **Dashboards** (vault-wide views). Every entry follows the same shape: what the template creates, which prompts it shows, when to reach for it, and any important caveats.

### Prompt Quick Reference

| Template | Prompts for subject? | Prompts for year? | Prompts for parcial? | Prompts for tema? |
| --- | --- | --- | --- | --- |
| Lecture Note | ✅ | ✅ | 🚫 | ✅ (with skip option) |
| Concept Note Template | ✅ | ✅ | 🚫 | ✅ |
| General Note | ✅ | ✅ | 🚫 | ✅ |
| Subject Hub | ✅ | ✅ | 🚫 | 🚫 (hubs stay at subject root) |
| Parcial Prep Note | ✅ | ✅ | ✅ (only when `features.parcial: true`) | 🚫 (scoped by parcial, not tema) |
| Assign Tema to Current Note | ✅ | ✅ | 🚫 | ✅ |
| Link Concepts to Note | 🚫 (reads from frontmatter) | 🚫 | 🚫 | 🚫 |
| Quick Create Concept | ✅ (inherited) | ✅ (when ambiguous) | 🚫 | ✅ (inherited) |
| Update Note Status | 🚫 | 🚫 | 🚫 | 🚫 |
| Mark Reviewed | 🚫 | 🚫 | 🚫 | 🚫 |
| University Dashboard | 🚫 | 🚫 | 🚫 | 🚫 |

---

### Creation Templates

Creation templates make a brand-new structured note. Always start from an untitled note or use **"Templater: Create new note from template"** from the command palette — running a creation template on an existing named note may produce unexpected results.

#### Lecture Note

**Creates:** A structured lecture note with frontmatter, an outline, and a concepts list, placed in the correct year/subject/tema folder.
**Prompts:** Year picker → subject picker → tema picker (with skip option) → lecture topic → optional multi-select of existing concept notes.
**When to use:** During class or immediately after, for any attended lecture.

The template builds the filename from the current date and the topic you enter (e.g., `Lecture 2024-05-03 - Electromagnetic Spectrum.md`) and places the file at `<University>/<Year>/<Subject>/Temas/<Tema>/`. It inserts structured sections for Objectives, Notes, and Questions, and pre-fills the `concepts` frontmatter array with any concept notes you multi-select at creation time.

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

#### Concept Note Template

**Creates:** A concept deep-dive note with definition, analogy, explanation, and a Dataview backlinks section, placed in the correct year/subject/tema folder.
**Prompts:** Year picker → subject picker → tema picker.
**When to use:** When a term or idea from a lecture deserves its own dedicated note.

The template prompts for year, subject, and tema, then moves the note into the matching folder. The Dataview section at the bottom automatically surfaces all lecture notes that reference this concept — so every time you link a concept from a lecture, it appears here without manual updates.

> **Heads up:** Always run this template from an untitled note, or via the command palette **"Templater: Create new note from template"**. Running it on an existing named note will overwrite that file without warning — this is a known issue tracked in AUDIT.md.

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

#### General Note

**Creates:** A flexible note with consistent frontmatter — useful for reference sheets, summaries, and anything that does not fit the lecture or concept mould.
**Prompts:** Year picker → subject picker → optional tema picker → note title.
**When to use:** Reference sheets, formula summaries, meeting notes, or any note that needs to live in the subject folder but is not a lecture or concept.

If you run this template on an already-named note, it will ask you to confirm before continuing. The template sanitizes the title you provide and ensures the filename is unique in the target folder.

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

#### Subject Hub

**Creates:** A course dashboard note with Dataview tables for lectures, concepts, years/temas breakdown, and open tasks, placed at the subject root folder.
**Prompts:** Year picker → subject picker.
**When to use:** Once at the start of each semester, for every course you are taking — this is your at-a-glance view for that course.

The hub lives at `<University>/<Year>/<Subject>/` and acts as the home page for a course. The Dataview tables populate automatically as you add lecture notes and concept notes throughout the semester, so there is nothing to maintain manually.

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

#### Parcial Prep Note

**Creates:** An exam-prep study guide with Dataview tables that automatically surface all lectures and concepts for the selected course and year.
**Prompts:** Year picker → subject picker → (if `features.parcial: true`) exam-period picker.
**When to use:** Before each exam — one note per course per exam period.

When `features.parcial` is set to `false` (the default), the note is placed at the subject root as a general study guide and no exam-period prompt appears. When `features.parcial: true`, a third prompt asks for the exam period (Parcial 1, Parcial 2, Final, etc.) and the note is placed inside a `Parciales/<Period>/` subfolder. The template places three cursor stops — Topics to Cover, Summary Notes, and Practice Questions — so you can tab through the sections for fast entry.

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

---

### Utility Templates

Utility templates operate on notes that already exist. Open the note you want to work with (or just be anywhere in the vault for the vault-wide utilities) and run the template from the command palette.

#### Assign Tema to Current Note

**Creates:** No new note — updates the frontmatter of the currently open note and moves the file to the matching folder.
**Prompts:** Year picker → subject picker → tema picker.
**When to use:** When a note was filed in the wrong place, or when you need to retroactively assign a tema after the fact.

This template re-runs the same placement logic used by the creation templates, so the note ends up exactly where it would have if you had created it with the correct settings from the start. Tags derived from the subject and tema slugs are updated in the completion notice.

```md
course: "Physics I"
year: "Year 2"
tema: "Oscillations"
```

#### Link Concepts to Note

**Creates:** No new note — appends concept note links to the `concepts` frontmatter array of the currently open note.
**Prompts:** Multi-select picker showing all concept notes for the note's course; already-linked concepts are prefixed with "✓".
**When to use:** During a review session, after you have created concept notes from a lecture and want to wire them back to the lecture note.

The template reads the `course` value from the currently open note's frontmatter to narrow the concept picker. The note body is untouched — only the `concepts` array in frontmatter is updated. Requires Templater ≥ 2.16 for the multi-select picker.

#### Quick Create Concept

**Creates:** A new concept note at the resolved path, and inserts a `[[link]]` at the cursor in the originating note.
**Prompts:** Concept name (pre-filled from any highlighted text) → subject/year/tema only when context cannot be inferred from the current note's frontmatter.
**When to use:** Mid-lecture, to capture a new term without leaving the lecture note you are currently editing.

Highlight a term before running the template and the concept name is pre-filled for you. The template inherits course, year, and tema from the current note's frontmatter, so placement dialogs only appear when that context is missing or ambiguous. After creation, a `[[Concept Name]]` link is appended at the editor cursor and the new concept is added to the current note's `concepts` array.

#### Update Note Status

**Creates:** No new note — batch-updates the `status` frontmatter field across multiple notes you select.
**Prompts:** Status picker (one of `raw`, `draft`, `reviewed`, `complete`) → multi-select of all vault notes not already at that status, labelled as `"Note Title [Course] (current status)"`.
**When to use:** At the end of a study session to advance a batch of notes through the review pipeline.

The template works vault-wide — the active file does not matter. Select the target status, then multi-select as many notes as you want to update; the template writes frontmatter in a single batch update for each selected note. Requires Templater ≥ 2.16 for the multi-select picker.

> **Heads up:** If notes with `status: raw` do not appear in the picker, this is a known issue — the fallback status list is missing `"raw"`. As a workaround, update those notes' frontmatter manually until a fix is released. Tracked in AUDIT.md.

#### Mark Reviewed

**Creates:** No new note — updates the `last_reviewed` and `next_review` frontmatter fields on the current concept note.
**Prompts:** Difficulty picker: Easy (+14 days), Medium (+7 days), Hard (+3 days), Blank (+1 day).
**When to use:** After reviewing a concept note in a spaced-repetition session — run it to record your recall quality and schedule the next review.

This template must be run on a concept note (it will display a notice and exit if the current note is not of type `concept`). The intervals come from `schema.reviewIntervals` in `universityConfig.js` (defaults: `easy: 14`, `medium: 7`, `hard: 3`, `blank: 1` days). The note body is never touched — only the two spaced-repetition fields in frontmatter are updated.

---

### Dashboards

#### University Dashboard

**Creates:** A vault-wide dashboard note placed at the university root folder, with four Dataview sections: Review Queue, Status by Course, Open Tasks, and Orphaned Concepts.
**Prompts:** None — no pickers; the template places the note automatically.
**When to use:** Create one at the start of the semester as your bird's-eye view across all courses. Open it at the start of any study session to see what needs attention.

The four sections give you:

- **Review Queue** — concept notes whose `next_review` date has passed, sorted by how overdue they are.
- **Status by Course** — one row per course showing a count of notes at each status (`raw`, `draft`, `reviewed`, `complete`), so you can see at a glance where backlog is accumulating.
- **Open Tasks** — all incomplete task items across the vault, sorted by due date.
- **Orphaned Concepts** — concept notes with no incoming links, which means they were created but never wired into any lecture note.

Unlike **Subject Hub** (which is per-course), University Dashboard spans every course at once. Create only one; the template ensures a unique filename if one already exists.

## How it works

- Template command →
- Bootstrap setup (`tp.user.templateBootstrap` — guards, loads all utilities, returns a ready-to-use context object) →
- Placement resolver (subject → tema folders + optional year metadata) →
- Frontmatter builder (type, course, year, tema, timestamps, status, aliases) →
- Dataview surfaces (tables, dashboards, backlinks)

All templates and utilities pull labels, folder names, and canonical years from `_templater_scripts/universityConfig.js`, making it the single source of truth.

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
  Mark Reviewed.md             # Record spaced-repetition recall and schedule next review
  University Dashboard.md      # Vault-wide dashboard across all courses and statuses
_templater_scripts/
  universityConfig.js          # Central labels, folders, years, schema
  scriptLoader.js              # Shared module-loading helper (requireScript)
  getUniversityContext.js      # Infers subject/year from current file path
  universityNoteUtils.js       # Shared helpers for placement, slugging, and naming
  templateBootstrap.js         # One-call setup: guards + utility loading for all templates
tests/
  universityNoteUtils.test.js  # Node.js test suite for pure helper functions
AGENTS.md                      # Codex project guidance
CLAUDE.md                      # Claude Code project instructions
LICENSE                        # MIT license
README.md                      # Documentation you are reading
```

## Extending the system

- **Add a new note type.** Start a template in `_templates/`, call `await tp.user.templateBootstrap(tp)` to load all utilities in one step, then call `resolveSubjectParcialTema` (or `resolvePlacement`) to reuse placement logic. Follow the existing frontmatter keys so Dataview filters stay compatible.
- **Use placement helpers.** After `resolveSubjectParcialTema`, call `ensureFolderPath` and `ensureUniqueFileName` before moving the file; this avoids duplicating folder math or sanitization.
- **Align frontmatter with Dataview.** New templates should set `type`, `course`, `year`, `tema`, `created`, and `status` (plus `updated` when relevant) so subject hubs and concept queries include them automatically.
- **Lean on utilities.** Functions like `toSlug`, `normalizeYear`, and `dedupePreserveOrder` keep tags, folder names, and prompt options predictable.

## Conventions

| Key | Purpose | Set by |
| --- | --- | --- |
| `type` | Template or note category (`lecture`, `concept`, `general`, `subject-hub`, `parcial-prep`, `university-dashboard`) | Each template / config schema |
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
- Folders didn't appear → Desktop Obsidian is required for folder creation; confirm filesystem permissions.
- Template fails on mobile → Templater user functions (`tp.user.*`) are not available on Obsidian mobile.
- Wrong year detected → Update frontmatter for that note or adjust `years` in config so normalization matches your naming.
- Dataview outputs are empty → Ensure the plugin is enabled and notes contain the expected `type`, `course`, and tag metadata.
- Tema assignment skipped → Run **Assign Tema** again and make sure you completed the prompts instead of cancelling.
- Concept multi-select not showing → Update Templater to ≥ 2.16 for `tp.system.multi_suggester` support; older versions skip the step and leave `concepts: []`.
- Parcial Prep Note doesn't ask for a parcial → This is correct when `features.parcial: false` (the default). Set it to `true` in config to enable exam-period grouping.
- Link Concepts / Update Note Status doesn't appear → Both require Templater ≥ 2.16 for `tp.system.multi_suggester`. Update Templater to use these templates.
- Quick Create Concept places the note in the wrong folder → The template inherits context from the current note's frontmatter. Ensure `course`, `year`, and `tema` are set correctly on the source note.

## FAQ

**Can I rename folders and labels?** Yes—edit `_templater_scripts/universityConfig.js` and reload Templater.

**Do I need Dataview installed?** Yes, dashboards and concept backlink queries rely on it.

**What about mobile?** This workflow is desktop-only. Templater user functions are unavailable on Obsidian mobile, and all templates here depend on `tp.user.*` scripts.

**Can I add more years or temas?** Absolutely; update the `years` array and the helpers will normalize new values.

**How do I add a new template?** Copy an existing template and replace its preamble with `const ctx = await tp.user.templateBootstrap(tp); if (!ctx) return;`. Destructure what you need from `ctx`, then call `resolveSubjectParcialTema` (or `resolvePlacement`) for placement before adding custom sections.

**Can I avoid extra year prompts?** Yes; once a subject already has a consistent `year` in frontmatter, helpers auto-reuse it and stop asking unless there is ambiguity.

**Do I need to write JavaScript?** Only for advanced extensions—the provided helpers cover placement, slugging, and normalization out of the box.

**Do I need the parcial/semester system?** No — it is off by default (`features.parcial: false`). Enable it in config only if your curriculum uses distinct exam periods that you want to mirror in the folder structure.

**Can I use semesters instead of parciales?** Yes — set `features.parcial: true` and change `labels.parcial` to `"Semester"` (or `"Term"`). Folder names and prompts will use your chosen label.

**The concept multi-select doesn't appear when creating a lecture.** Update Templater to version 2.16 or newer. The feature uses `tp.system.multi_suggester` which was added in that release; older installs fall back silently.

**Can I link concepts to a note after creating it?** Yes — run **Link Concepts to Note** on any note with a `course` in frontmatter. It discovers matching concept notes and lets you multi-select.

**Can I create a concept note without leaving my lecture?** Yes — highlight a term and run **Quick Create Concept**. It creates the concept note, appends a `[[link]]` at your cursor, and wires up the `concepts` frontmatter array.

**Can I batch-update note statuses?** Yes — run **Update Note Status**, pick the target status, then multi-select the notes to update. Statuses are driven by `schema.statuses` in config.

**Why don't my notes with status: raw show up in Update Note Status?** This is a known issue — the picker's fallback status list omits "raw". Update the affected notes' frontmatter manually until a fix is released. Tracked in AUDIT.md.

## License

Released under the MIT License. See [`LICENSE`](LICENSE).

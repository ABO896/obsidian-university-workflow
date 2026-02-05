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
  - [Assign Tema to Current Note](#assign-tema-to-current-note)
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
- 📚 Guarded workflows – untitled-note checks and prompts avoid overwriting existing files.
- 🔁 Reusable helpers – path logic, slugging, and normalization are shared for any new template you add.

## Quick Start

1. Copy `_templates/` and `_templater_scripts/` into your vault root.
2. In Obsidian → *Settings → Templater*, point **Template folder** to `_templates` and **Script folder** to `_templater_scripts`.
3. Reload Templater user scripts so `universityConfig`, `getUniversityContext`, and `universityNoteUtils` register.
4. Enable the Dataview community plugin for dashboards and inline queries to render.
5. Run a template (e.g., **Lecture Note**) from a new note and follow the prompts.

> **Heads up:** Lecture notes and subject hubs refuse to run on pre-named files to avoid misfiling. Create a fresh note before launching them.
>
> **Docs source:** `Templater.pdf` in the vault root is the local reference used by this project for Templater behavior and API expectations.

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
    universityRoot: "Universidad", // rename the base folder here
    temaContainer: "Temas", // container for temas
  },
  labels: {
    general: "General", // label for catch-all notes & default tema
    year: "Year", // metadata label for academic year
    tema: "Tema", // rename to "Module" or similar
  },
  years: ["Year 1", "Year 2", "Year 3", "Year 4"], // optional year options
};
```

<details>
<summary>Common tweaks</summary>

- **Change the base folder name.** Update `fs.universityRoot` to whatever root directory you prefer (e.g., `"Academics"`).
- **Rename “Temas”.** Modify `fs.temaContainer` so placement helpers build folders with your terms.
- **Switch labels in prompts.** Edit `labels.subject`, `labels.year`, or `labels.general` so prompts and notices use your language.
- **Adjust default years.** Edit the `years` array so the optional year picker matches your curriculum.
</details>

Because templates read the config at runtime, you never hard-code translations—just change the config and reload Templater.

## Usage

### Lecture Note

1. Create a new untitled note.
2. Run **Lecture Note**; choose or create the subject when prompted.
3. The helper reuses the subject's known year when possible; only prompts for year when missing or ambiguous.
4. Enter an optional lecture topic; the helper sanitizes it and builds the filename.
5. The template moves the file into `<University>/<Subject>/<Tema?>`, adds frontmatter, and inserts structured sections.

```md
---
course: "Physics I"
year: "Year 1"
tema: "Waves"
type: lecture
created: "2024-05-03"
status: draft
aliases: ["Lecture 2024-05-03 - Waves"]
concepts: []
---
```

### Concept Note

1. Run **Concept Note Template** from any note (untitled or existing).
2. Select the subject; create a new one if needed.
3. Choose a tema or skip to keep it general.
4. The helper moves the note into the proper subject/tema path.
5. Fill in the definition, analogy, and explanation sections; Dataview shows related lectures automatically.

```md
---
type: concept
tags: [concept]
course: "Physics I"
year: "Year 1"
tema: "Waves"
created: "2024-05-03"
status: draft
aliases: []
---
```

### General Note

1. Run **General Note** from a new or existing note.
2. Confirm if you want to continue when launching from a pre-named file.
3. Pick or create the subject and optional tema (year is reused or prompted only when needed).
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
2. Run **Subject Hub**; pick or create the subject.
3. The helper anchors the hub at `<University>/<Subject>/` and generates a safe filename.
4. Frontmatter and tags are inserted, along with Dataview dashboards for lectures, concepts, years→temas, and tasks.
5. Review the checklist and fill in the overview to keep your hub current.

```md
---
type: subject-hub
course: "Physics I"
created: "2024-05-03"
tags: ["course/physics-i", "subject-hub"]
updated: "2024-05-03"
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

<details>
<summary>Template prompts quick reference</summary>

| Template | Prompts for subject? | Prompts for year? | Prompts for tema? |
| --- | --- | --- | --- |
| Lecture Note | ✅ | ✅ (only when missing/ambiguous) | ✅ (with skip option) |
| Concept Note | ✅ | ✅ (only when missing/ambiguous) | ✅ |
| General Note | ✅ | ✅ (only when missing/ambiguous) | ✅ |
| Subject Hub | ✅ | 🚫 | 🚫 (hubs stay at subject root) |
| Assign Tema | ✅ | ✅ (only when missing/ambiguous) | ✅ |
</details>

## Repository Layout

```text
_templates/
  Lecture Note.md          # Guided lecture capture with placement + sections
  Concept Note Template.md # Concept deep dives with Dataview backlinks
  General Note.md          # Flexible note with consistent metadata
  Subject Hub.md           # Course dashboard anchored at subject root
  Assign Tema to Current Note.md # Utility to update existing notes
_templater_scripts/
  universityConfig.js      # Central labels, folders, years, schema
  getUniversityContext.js  # Infers subject/year from current file path
  universityNoteUtils.js   # Shared helpers for placement, slugging, and naming
LICENSE                    # MIT license
README.md                  # Documentation you are reading
```

## Extending the system

- **Add a new note type.** Start a template in `_templates/`, import `tp.user.universityNoteUtils()`, and call `resolveSubjectParcialTema` (or `resolveSubjectAndParcial`) to reuse placement logic. Follow the existing frontmatter keys so Dataview filters stay compatible.
- **Use placement helpers.** After `resolveSubjectParcialTema`, call `ensureFolderPath` and `ensureUniqueFileName` before moving the file; this avoids duplicating folder math or sanitization.
- **Align frontmatter with Dataview.** New templates should set `type`, `course`, `year`, `tema`, `created`, and `status` (plus `updated` when relevant) so subject hubs and concept queries include them automatically.
- **Lean on utilities.** Functions like `toSlug`, `normalizeYear`, and `dedupePreserveOrder` keep tags, folder names, and prompt options predictable.

## Conventions

| Key | Purpose | Set by |
| --- | --- | --- |
| `type` | Template or note category (`lecture`, `concept`, `general`, `subject-hub`) | Each template / config schema |
| `course` | Human-readable subject name | Placement helper + prompts |
| `year` | Optional academic year label for filtering/grouping | Placement helper |
| `tema` | Optional topic/module label; defaults to general label | Placement helper |
| `created` | Primary timestamp for Dataview sorting (falls back to legacy `date`) | Template runtime |
| `status` | Workflow status (`draft` by default) | Template runtime |
| `aliases` | Alternative names for search/backlinks | Template runtime |
| `tags` | Only for hubs (array of `course/<slug>`, `subject-hub`) | Subject Hub template |
| `updated` | Last refresh date (Subject Hub only) | Subject Hub template |
| `concepts` | Lecture note backlinks to concept pages | Lecture Note template |

- **Legacy compatibility:** Dashboards sort by `created` but automatically fall back to older `date` fields (or `file.ctime`) when that key is missing, so mixed notes continue to render correctly.
- **Tags & slugs:** `toSlug` converts subject/tema names into lowercase hyphenated tags. Inline tags appear in lecture and general notes; hubs store them in `tags`.
- **Years & temas:** `normalizeYear` supports canonical year labels from config and common path variants (e.g., `year-3`). Tema prompts always include a skip option that falls back to the general label.
 
## Troubleshooting

- Template aborts immediately → You likely ran it on a named file; start from an untitled note for Lecture or Subject Hub.
- Helper not found → Re-check Templater script folder settings and reload user scripts.
- Folders didn’t appear → Desktop Obsidian is required for folder creation; confirm filesystem permissions.
- Template fails on mobile → Templater user functions (`tp.user.*`) are not available on Obsidian mobile.
- Wrong year detected → Update frontmatter for that note or adjust `years` in config so normalization matches your naming.
- Dataview outputs are empty → Ensure the plugin is enabled and notes contain the expected `type`, `course`, and tag metadata.
- Tema assignment skipped → Run **Assign Tema** again and make sure you completed the prompts instead of cancelling.

## FAQ

**Can I rename folders and labels?** Yes—edit `_templater_scripts/universityConfig.js` and reload Templater.

**Do I need Dataview installed?** Yes, dashboards and concept backlink queries rely on it.

**What about mobile?** This workflow is desktop-only. Templater user functions are unavailable on Obsidian mobile, and all templates here depend on `tp.user.*` scripts.

**Can I add more years or temas?** Absolutely; update the `years` array and the helpers will normalize new values.

**How do I add a new template?** Copy an existing template, keep the helper imports, and reuse `resolveSubjectParcialTema` before you add custom sections.

**Can I avoid extra year prompts?** Yes; once a subject already has a consistent `year` in frontmatter, helpers auto-reuse it and stop asking unless there is ambiguity.

**Do I need to write JavaScript?** Only for advanced extensions—the provided helpers cover placement, slugging, and normalization out of the box.

## License

Released under the MIT License. See [`LICENSE`](LICENSE).

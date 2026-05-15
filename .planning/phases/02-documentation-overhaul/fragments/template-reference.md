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

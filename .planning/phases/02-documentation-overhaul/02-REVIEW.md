---
phase: 02-documentation-overhaul
reviewed: 2026-05-15T00:00:00Z
depth: standard
files_reviewed: 1
files_reviewed_list:
  - README.md
findings:
  critical: 0
  warning: 9
  info: 3
  total: 12
status: issues_found
---

# Phase 02: Code Review Report

**Reviewed:** 2026-05-15
**Depth:** standard
**Files Reviewed:** 1
**Status:** issues_found

## Summary

README.md is the primary user-facing documentation for the Obsidian University Workflow. The document was reviewed against every actual template file and the `universityConfig.js` source of truth. Nine warnings and three informational items were found.

The most impactful issues are incorrect prompt-flow descriptions for Lecture Note and Concept Note Template (both omit a newly-added style picker step), an incorrect Parcial Prep Note section inventory (wrong section names, wrong cursor-stop count), and a wrong command in the Step 5 setup instructions that will leave users unable to reload scripts. Several frontmatter examples and the Step 5 script-name list also diverge from the real templates. No critical-severity (security, data-loss, crash) issues were found in a documentation file.

---

## Warnings

### WR-01: Step 5 uses a wrong command to reload scripts

**File:** `README.md:124-126`
**Issue:** The setup guide tells users to run **"Templater: Replace templates in the active file"** to register the helper scripts. That command executes a template — it does not reload user scripts. The correct command is **"Templater: Reload scripts"**. A user following Step 5 verbatim will believe the scripts are loaded when they are not, causing every template to abort with "helper not found" errors.
**Fix:** Replace the bullet with:
```
Open the command palette (`Ctrl/Cmd + P`) and run **Templater: Reload scripts**.
```

---

### WR-02: Lecture Note prompt flow is incomplete — style picker step is undocumented

**File:** `README.md:253-260` (Stage 1 walkthrough) and `README.md:322-326` (Template Reference entry)
**Issue:** The actual Lecture Note template (`_templates/Lecture Note.md`, lines 72-82) shows a **lecture style picker** ("Quick", "Ideas & Theory", "Code & Math") after the topic prompt and before the concept multi-select. This step is completely absent from both the walkthrough and the Template Reference. Users will be surprised by an undocumented prompt, and the walkthrough example of prompts in Step 3 is incorrect.

The style also changes the output structure substantially: "Quick" sets `status: raw` (not `draft`), suppresses the concept multi-select, and produces a minimal encoding-only body. "Ideas & Theory" produces a Q/E/C note. "Code & Math" produces a STEM note with a tradeoffs table. None of this is mentioned in the README.

**Fix:** Add a style-picker step between the topic prompt and the concept multi-select in both the walkthrough and the Template Reference entry. Document the three styles and their output differences. Update the frontmatter example to show that `status` depends on style.

---

### WR-03: Lecture Note frontmatter example always shows `status: draft` — incorrect for Quick style

**File:** `README.md:329-339`
**Issue:** The frontmatter example block shows `status: draft` unconditionally. The actual template (`_templates/Lecture Note.md`, line 114) sets `status: raw` when the user selects the Quick style. A user creating a Quick lecture note will see `status: raw` in their note, contradicting the documented example.
**Fix:** Update the example or add a note explaining that status is `raw` for Quick captures and `draft` for Ideas & Theory / Code & Math.

---

### WR-04: Concept Note Template prompt flow is incomplete — style picker step is undocumented

**File:** `README.md:343-348` (Template Reference entry)
**Issue:** The Concept Note Template (`_templates/Concept Note Template.md`, lines 52-63) presents a **concept style picker** ("Concept — an idea, term, or theory" vs "Technique — a method, algorithm, or procedure") before creating the note. The README's "Prompts" line lists only "Year picker → subject picker → tema picker" and makes no mention of this step. Users will encounter an unexpected style prompt and the two divergent output structures (assertion/analogy/Feynman vs. when-to-use/steps/worked-example) are unmentioned.
**Fix:** Add "→ concept style picker" to the Prompts line and describe the two note structures produced.

---

### WR-05: Parcial Prep Note cursor stop count and section names are wrong

**File:** `README.md:411` and `README.md:285-289`
**Issue:** The README states the template "places three cursor stops — Topics to Cover, Summary Notes, and Practice Questions". The actual template (`_templates/Parcial Prep Note.md`) has only **two** cursor stops (`tp.file.cursor(1)` at line 140 "Gaps I Noticed" and `tp.file.cursor(2)` at line 168 "Practice Questions"). Neither stop is in a "Topics to Cover" or "Summary Notes" section — those sections do not exist in the template. The actual sections after the recall dump are: Gaps I Noticed, Key Concepts (Dataview), Lectures (Dataview), Practice Questions, Formulas & Key Facts, Open Tasks.

Additionally, the recall-dump pre-creation prompt (a dialog that appears before the note is written to disk) is not mentioned anywhere in the README, even though it is a significant UX step the user must interact with.

**Fix:** Correct the cursor stop count to two, update the section names to match the actual template, and add a description of the pre-creation recall-dump prompt.

---

### WR-06: Parcial Prep Note Dataview tables are described as "auto-populating all lectures and concepts" but are filtered by year when year is selected

**File:** `README.md:287`
**Issue:** The README says the study guide note's Dataview tables "auto-populate with every lecture and every concept note from Physics I / Year 1". The actual template (`_templates/Parcial Prep Note.md`, lines 152 and 162) adds `AND year = <year>` to the Dataview query only when a year was provided — so tables are scoped to the selected year, not the entire course. When no year is selected the tables span all years. The README description implies the tables always include all years for a course, which is misleading.
**Fix:** Clarify that the Dataview tables are scoped to the selected year when one is provided, or to the full course when year is omitted.

---

### WR-07: Quick Create Concept pre-fill source is documented as selection only; clipboard fallback is undocumented

**File:** `README.md:264`, `README.md:459`
**Issue:** Both the Stage 2 walkthrough and the Quick Create Concept Template Reference entry state that the concept name is "pre-filled from any highlighted text". The actual template (`_templates/Quick Create Concept.md`, lines 39-44) falls back to **clipboard content** when there is no text selection. This is a meaningful workflow feature (copy a term from a browser or PDF, then run the template) that users will discover by accident rather than by design.
**Fix:** Update both mentions to: "pre-filled from highlighted text, or from the clipboard when no text is selected".

---

### WR-08: Assign Tema to Current Note uses bare `app.*` instead of `tp.app.*`

**File:** `_templates/Assign Tema to Current Note.md:70-71`
**Issue:** The template accesses `app.vault.getAbstractFileByPath` and `app.fileManager.processFrontMatter` directly (bare `app.*`) rather than through `tp.app.*`. CLAUDE.md project conventions explicitly forbid bare `app.*` in templates: "Use `tp.app.*` — never bare `app.*` in templates". All other templates that use the fileManager API use `tp.app.fileManager` consistently.

While bare `app` is a global in Obsidian user scripts and templates, this violates the project convention and creates an inconsistency that the README's documentation implicitly endorses through its code examples showing the template as authoritative. The README does not call this out as a deviation.
**Fix:** Replace `app.vault.getAbstractFileByPath` → `tp.app.vault.getAbstractFileByPath` and `app.fileManager.processFrontMatter` → `tp.app.fileManager.processFrontMatter` in `Assign Tema to Current Note.md` lines 70-71.

---

### WR-09: Subject Hub frontmatter example omits the `year` field

**File:** `README.md:393-403`
**Issue:** The Subject Hub frontmatter example shows no `year` key. The actual template (`_templates/Subject Hub.md`, lines 89-103) conditionally emits `year: <value>` when a year is selected — and it always prompts for year (`promptYearWhen: "always"`). In practice, virtually all notes will have a year. The omission from the example misleads users about the expected frontmatter schema.
**Fix:** Add `year: "Year 1"` to the example block (marked optional with a comment if desired) to match the actual output.

---

## Info

### IN-01: CLAUDE.md template count is stale — says "Six" but there are 11 templates

**File:** `CLAUDE.md:8` (project instructions)
**Issue:** The Project Structure block in CLAUDE.md says "Six Templater template files" but the `_templates/` directory contains 11 files: Lecture Note, Concept Note Template, General Note, Subject Hub, Parcial Prep Note, Assign Tema to Current Note, Link Concepts to Note, Quick Create Concept, Update Note Status, Mark Reviewed, and University Dashboard.
**Fix:** Update the comment to "Eleven Templater template files" and expand the listed files to include the five additions.

---

### IN-02: Step 5 script-name list is incomplete — `templateBootstrap` is missing

**File:** `README.md:127`
**Issue:** Step 5 says scripts are registered as: `universityConfig`, `getUniversityContext`, `universityNoteUtils`, `scriptLoader`, and `templateBootstrap` — counting to five names. The filesystem has exactly five scripts. The sentence is correct but calling `templateBootstrap` out separately at the end reads as if there are four standard scripts plus one special one. No actual bug, but the phrasing is slightly misleading.

More importantly, the actual reload mechanism described in the same step is wrong (see WR-01), so users never get this far successfully.
**Fix:** After fixing WR-01, ensure the script names listed match the five files present and are presented consistently.

---

### IN-03: Repository Layout section documents `AGENTS.md` but does not explain its purpose or audience

**File:** `README.md:531`
**Issue:** The layout table lists `AGENTS.md — Codex project guidance` alongside `CLAUDE.md`. A README reader setting up the workflow has no reason to know what "Codex project guidance" means. The line is harmless but adds noise for end users.
**Fix:** Either omit it from the user-facing layout table (move to a developer/contributor section) or expand the description to "AI agent project instructions — not needed for vault setup".

---

_Reviewed: 2026-05-15_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_

# Obsidian University Workflow

## Project Overview
This vault pack supplies a set of opinionated Obsidian Templater assets for managing university material. It automates folder placement, naming, and frontmatter so lecture captures, concept summaries, and subject hubs land in the right place with consistent metadata, letting you focus on learning rather than vault housekeeping.【F:_templates/Lecture Note.md†L24-L123】【F:_templater_scripts/universityNoteUtils.js†L9-L171】

## What Problems It Solves
- **Scattered course material.** Detects the current subject and parcial (exam period) from your note context or prompts you to pick one, ensuring every file is shelved alongside related coursework.【F:_templater_scripts/getUniversityContext.js†L3-L25】【F:_templates/Concept Note Template.md†L29-L91】
- **Manual folder wrangling.** Creates subject/parcial folders on demand, guides you through placement, and prevents collisions by auto-incrementing duplicate filenames.【F:_templater_scripts/universityNoteUtils.js†L69-L171】【F:_templates/Lecture Note.md†L88-L115】
- **Inconsistent metadata.** Injects canonical frontmatter keys and starter sections tailored to each note type so tags, course names, and statuses stay uniform.【F:_templates/Lecture Note.md†L101-L119】【F:_templates/Subject Hub.md†L69-L117】
- **Context switching during capture.** Uses suggesters and prompts to create new subjects, skip parciales for hubs, and pre-fill Dataview dashboards without leaving the keyboard.【F:_templates/Lecture Note.md†L32-L74】【F:_templates/Subject Hub.md†L29-L113】

## Features
- **Shared placement helper.** `tp.user.universityNoteUtils()` exposes utilities such as `resolveSubjectAndParcial`, `ensureFolderPath`, and `sanitizeFileName` so templates share reliable folder logic and filename hygiene.【F:_templater_scripts/universityNoteUtils.js†L9-L171】
- **Context-aware defaults.** `getUniversityContext` infers subject/parcial from the current path to seed prompts with sensible defaults when launching a template from an existing folder.【F:_templater_scripts/getUniversityContext.js†L3-L25】
- **Lecture note workflow.** Guided prompts choose subject/parcial, create new subjects, and compose lecture-focused frontmatter, tags, and recall checklists in one run.【F:_templates/Lecture Note.md†L32-L126】
- **Concept note workflow.** Builds concept notes with Feynman-style prompts and a Dataview backlink query while relocating files to the proper subject/parcial folder.【F:_templates/Concept Note Template.md†L29-L133】
- **Subject hub dashboard.** Skips parcial selection, anchors hubs at the subject root, and renders Dataview tables for lectures, concepts, parciales, and tasks.【F:_templates/Subject Hub.md†L29-L143】
- **Filename sanitization.** Removes illegal characters, slugifies headings, and appends numeric suffixes to avoid conflicts when notes move into their destination directories.【F:_templater_scripts/universityNoteUtils.js†L113-L171】【F:_templates/Lecture Note.md†L82-L115】

## Repository Layout
- `_templates/` – Obsidian Templater markdown templates for lectures, concept notes, and subject hubs. Each template handles prompts, metadata, and Dataview sections tailored to the note type.【F:_templates/Lecture Note.md†L1-L126】【F:_templates/Concept Note Template.md†L1-L133】【F:_templates/Subject Hub.md†L1-L143】
- `_templater_scripts/` – Shared JavaScript helpers invoked through `tp.user.*`, including context detection and folder utilities used by every template.【F:_templater_scripts/getUniversityContext.js†L3-L25】【F:_templater_scripts/universityNoteUtils.js†L9-L171】
- `AGENTS.md` – Contributor guidance for Codex-powered assistants outlining allowed edit locations and expectations.【F:AGENTS.md†L1-L7】
- `.gitignore` – Ignores personal vault content by default so only the reusable templates and scripts remain under version control.【F:.gitignore†L1-L14】

## Requirements
- Obsidian desktop with the **Templater** community plugin enabled (templates rely on `<%* %>` script blocks and `tp.user.*` helpers).【F:_templates/Lecture Note.md†L1-L126】【F:_templater_scripts/universityNoteUtils.js†L1-L171】
- Templater **Scripts folder** configured to `_templater_scripts/` so the shared utilities auto-load for `tp.user` calls.【F:.codex_kb/30_user_scripts.md†L1-L22】
- Templater **Template folder** pointing to `_templates/` (or merged equivalent) to surface the lecture, concept, and hub commands.
- Dataview plugin enabled for the dashboards embedded in the Concept Note and Subject Hub templates.【F:_templates/Concept Note Template.md†L113-L133】【F:_templates/Subject Hub.md†L101-L135】
- Optional: assign hotkeys to frequently used templates for faster capture.

## Setup / Installation
1. **Add the folders to your vault.** Clone, download, or submodule this repository, then copy `_templates/` and `_templater_scripts/` into the root of your Obsidian vault (merge with existing folders if present). The repo intentionally omits personal content thanks to the blanket `.gitignore`, so you can overlay it safely.【F:.gitignore†L1-L14】
2. **Point Templater to the assets.** In Obsidian → *Settings* → *Templater*:
   - Set **Template folder location** to `_templates`.
   - Set **Script files folder location** to `_templater_scripts` as described in the Templater KB.【F:.codex_kb/30_user_scripts.md†L1-L22】
3. **Reload Templater resources.** Use *Templater → Reload User Scripts* (command palette) so the vault picks up `getUniversityContext` and `universityNoteUtils` after copying them.
4. **Match the expected folder skeleton.** Notes default to a root `Universidad` folder with optional `<Subject>/<Parciales/...>` subfolders; adjust later via customization if your structure differs.【F:_templater_scripts/universityNoteUtils.js†L11-L87】

## Usage
### Lecture Note template
1. Create a fresh, untitled note; the template aborts if run on a pre-named file to avoid renaming the wrong document.【F:_templates/Lecture Note.md†L69-L87】
2. Run **Lecture Note** via the command palette or hotkey. The script loads context, lets you reuse or create subjects, and reorders parcial options around the current course.【F:_templates/Lecture Note.md†L24-L77】
3. Provide an optional lecture topic; the template sanitizes it, builds a dated filename, and ensures uniqueness before moving the note to the subject/parcial folder.【F:_templates/Lecture Note.md†L88-L115】
4. Start writing in the prepared sections—frontmatter captures course, parcial, type, date, status, and aliases, while headings guide summaries, concepts, examples, and open questions.【F:_templates/Lecture Note.md†L101-L126】

### Concept Note template
1. Trigger **Concept Note Template** from a draft or untitled note in any location.
2. Choose or create the subject and parcial when prompted; the script sanitizes folder names, ensures the target directory exists, and moves the note if needed.【F:_templates/Concept Note Template.md†L29-L97】
3. Fill in the guided sections covering formal definitions, analogies, and explanations. A Dataview query automatically lists lectures tagged for the same concept once they exist.【F:_templates/Concept Note Template.md†L101-L133】

### Subject Hub template
1. Launch **Subject Hub** from an untitled note when you need a course dashboard; the helper enforces the untitled guard to protect existing pages.【F:_templates/Subject Hub.md†L21-L41】
2. The placement helper resolves the subject (allowing new subjects) and intentionally skips parcial selection, anchoring hubs at the subject root and generating course-level tags.【F:_templates/Subject Hub.md†L43-L103】
3. Review the generated Dataview tables summarizing lectures, concepts, parciales, and outstanding tasks for that course.【F:_templates/Subject Hub.md†L104-L143】

## Customization
- **Add new subjects or parciales.** Use the built-in prompts; `buildSubjectOptions`, `reorderWithPreference`, and `getParcialContext` automatically surface existing folders and create new ones as needed.【F:_templater_scripts/universityNoteUtils.js†L45-L123】【F:_templates/Lecture Note.md†L32-L77】
- **Adjust folder strategy.** Update `DEFAULT_BASE_PATH` or extend `findParcialesContainer` / `getParcialContext` if your vault uses different roots or nesting. Keep helper usage centralized so templates continue to share the same logic.【F:_templater_scripts/universityNoteUtils.js†L9-L123】
- **Customize frontmatter or sections.** Edit the markdown blocks within each template to match your workflows (e.g., add additional tags or sections). Retain the placement routines at the top to keep automatic moves and sanitization intact.【F:_templates/Lecture Note.md†L1-L126】【F:_templates/Concept Note Template.md†L1-L133】
- **Leverage helper exports in new templates.** Import `tp.user.universityNoteUtils()` and call functions like `resolveSubjectAndParcial`, `sanitizeFileName`, and `ensureUniqueFileName` instead of reimplementing path logic.【F:_templater_scripts/universityNoteUtils.js†L113-L171】
- **What not to change.** Avoid bypassing the shared helpers or moving templates outside `_templates`; doing so breaks the consistent placement guarantees and violates the contributor guidelines captured in `AGENTS.md`.【F:AGENTS.md†L1-L7】

## Conventions
- **Frontmatter keys.** Templates set `type`, `course`, `parcial`, `date`, `status`, `aliases`, `tags`, and `updated` (for hubs) to keep Dataview queries and metadata consistent.【F:_templates/Lecture Note.md†L101-L111】【F:_templates/Concept Note Template.md†L97-L111】【F:_templates/Subject Hub.md†L69-L93】
- **Tagging.** Lecture notes add hashtag tags (e.g., `#course-name` and `#lecture`), while subject hubs attach `course/<slug>` and `subject-hub` for Dataview filtering.【F:_templates/Lecture Note.md†L113-L121】【F:_templates/Subject Hub.md†L57-L93】
- **Naming.** Files default to sanitized, date-based titles with optional topic suffixes; folders replace illegal characters with hyphens via `sanitizeFileName` and `sanitizeFolderName` helpers.【F:_templates/Lecture Note.md†L82-L115】【F:_templater_scripts/universityNoteUtils.js†L105-L171】
- **Folder structure.** Assets assume a `Universidad/<Subject>/Parciales/<Parcial>` hierarchy but degrade gracefully to a flat `Universidad` folder when parciales are omitted.【F:_templater_scripts/universityNoteUtils.js†L11-L123】

## Troubleshooting
- **Template aborts immediately.** Lecture and hub templates require an untitled file; create a new note named `Untitled` (or Obsidian’s locale equivalent) before running them.【F:_templates/Lecture Note.md†L69-L87】【F:_templates/Subject Hub.md†L21-L41】
- **Helper not found errors.** Confirm Templater’s Scripts folder points to `_templater_scripts` and reload user scripts so `getUniversityContext` and `universityNoteUtils` are registered.【F:.codex_kb/30_user_scripts.md†L1-L22】【F:_templates/Lecture Note.md†L24-L40】
- **Folders missing.** The helpers call `ensureFolderPath` before moves; if folders still fail to appear, verify you’re running Obsidian Desktop (required for filesystem writes) and that you have permission to create directories.【F:_templater_scripts/universityNoteUtils.js†L87-L123】
- **Unexpected parcial detection.** Check your folder names: parciales are detected case-insensitively with formats like `Parcial 1` or `Final`; rename folders to match those patterns or adjust `getParcialContext`.【F:_templater_scripts/universityNoteUtils.js†L57-L123】
- **Dataview tables empty.** Ensure Dataview is enabled and your notes carry the expected `type`, `course`, and tag metadata inserted by the templates.【F:_templates/Lecture Note.md†L101-L123】【F:_templates/Subject Hub.md†L101-L143】

## Development
- **Where to contribute.** Place new or updated templates inside `_templates/` and shared JavaScript inside `_templater_scripts/` to keep the vault pack modular.【F:AGENTS.md†L1-L7】
- **Leverage existing helpers.** Import `tp.user.universityNoteUtils()` in new templates so placement and sanitization remain consistent across note types.【F:_templater_scripts/universityNoteUtils.js†L9-L171】
- **Testing checklist.** Run `node --check _templater_scripts/*.js` (or equivalent) to catch syntax issues, then reload user scripts in Obsidian and perform a dry run of the relevant template to confirm prompts, moves, and notices behave as expected.【F:_templates/Lecture Note.md†L24-L126】【F:_templates/Subject Hub.md†L24-L113】
- **Style cues.** Follow the guardrails documented in `AGENTS.md`—avoid relocating files outside the allowed directories and keep shared logic centralized in helpers.【F:AGENTS.md†L1-L7】

## License
Released under the MIT License (see [`LICENSE`](LICENSE)).【F:LICENSE†L1-L19】

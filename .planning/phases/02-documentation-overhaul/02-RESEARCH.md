# Phase 2: Documentation Overhaul - Research

**Researched:** 2026-05-15
**Domain:** Technical writing / Obsidian Templater workflow documentation
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Everything stays in a single `README.md` — no `docs/` sub-pages, no GitHub Wiki. One file = easiest to maintain, works offline in Obsidian, no cross-file sync burden.
- **D-02:** All content is visible top-to-bottom with anchor links for navigation. No `<details>` collapsible sections — a fellow student should be able to read straight through.
- **D-03:** Section order: TL;DR / intro → **Setup** → **Config Guide** → **Walkthrough** → **Template Reference** → Troubleshooting / FAQ. This matches the new-student journey: install first, then configure, then see it in action, then look things up.
- **D-04:** The current "Quick Start" section is **replaced** by a fuller step-by-step Setup Guide (DOCS-01). The terse 5-step list is gone; the new section covers install → Templater folder config → script reload → Dataview enable, exactly as DOCS-01 requires.
- **D-05:** Template reference (DOCS-04) covers all 11 templates: what it creates, what prompts it shows, when to use it. The current README's per-template Usage subsections already have most of this — the rewrite organizes them as a reference, not just a usage narrative.
- **D-06:** Config guide (DOCS-02) includes a concrete before/after worked example. The scenario is open for Claude to choose — pick whichever single scenario best illustrates the most common customization (e.g., renaming labels for a different language, or adapting subjects/years).
- **D-07:** Workflow walkthrough (DOCS-03) shows a concrete end-to-end session: open Obsidian → create a Lecture Note → link concepts during review → run Parcial Prep for exam. Depth and format are left to Claude's discretion — a clear step-by-step sequence is sufficient; a full narrative with mock content is fine too.
- **D-08:** Audit findings are left to Claude's discretion. The two critical violations (Concept Note silently overwrites named files; Update Note Status missing "raw" status) are the most user-visible; minor violations are style/consistency issues that students wouldn't notice. Any references should be brief callouts, not a full "Known Issues" catalogue.

### Claude's Discretion

- Exact structure and wording of the worked config example (D-06) — choose the scenario that best demonstrates the most common customization.
- Whether to include a brief callout in the Concept Note Template section about the overwrite risk (D-08) — apply judgment based on student-reader impact.
- Depth and narrative style of the walkthrough (D-07) — step-list or richer scenario, whichever reads more clearly.
- Whether to preserve or rewrite sections already in the README that are already well-targeted at the student reader (Features at a glance, Why this exists, Extending the system, Conventions, FAQ, License).

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| DOCS-01 | Write step-by-step plugin setup section — exact steps to install Templater and Dataview, configure Templater's Template folder and Script folder to point at `_templates/` and `_templater_scripts/`, and enable Dataview | Current README Quick Start is a 5-item terse list; needs expansion into named-step sequence covering install → folder config → reload → Dataview |
| DOCS-02 | Write configuration guide — how to edit `universityConfig.js` to add subjects, years, folder paths, and toggle `features.parcial`; include a worked before/after example | `universityConfig.js` fully read; all keys, defaults, and flag behavior documented below |
| DOCS-03 | Write workflow walkthrough — a concrete day-in-the-life example: open Obsidian → create a Lecture Note → link concepts during review → run Parcial Prep for exam | Current README has per-template usage steps; needs synthesizing into a linear narrative |
| DOCS-04 | Write template reference — for each of the 11 templates: what it creates, what prompts it shows, and when to use it | All 11 templates enumerated with purpose from existing README Usage sections and `_templates/` directory listing |
| DOCS-05 | Integrate all documentation improvements into `README.md`, structured for a fellow student as the target reader | Current README structure and reusable sections identified below |
</phase_requirements>

---

## Summary

The current README is well-written but thin in exactly the places a new student hits friction first: installation is a 5-line Quick Start list with no screenshots or context; the config guide is buried inside a `<details>` collapsible block (which D-02 bans); and the per-template usage sections are a narrative rather than a scannable reference. The raw material is good — many sections can be preserved or lightly reorganised — but the three major content gaps (setup depth, config guide with worked example, walkthrough synthesis) need net-new prose.

The phase is documentation-only: no code changes, no new files outside `README.md`. All facts to be documented (template behaviour, config key names, Obsidian plugin names) are fully verifiable from the existing codebase. The two critical AUDIT.md violations are worth a one-sentence callout each in the affected template entries — both describe user-visible data-loss or silent-failure risks.

The target reader is "Obsidian-comfortable but unfamiliar with this vault." Technical Obsidian terms (command palette, frontmatter, community plugins) are fine. Developer terms (CommonJS, factory function, module.exports) are not.

**Primary recommendation:** Reorganise the existing README into the D-03 section order, expand Quick Start into a genuine Setup Guide, unwrap the collapsible Config block into a full Config Guide section with worked before/after, write a concise walkthrough narrative, and convert the per-template Usage subsections into a uniform Template Reference table-plus-description format. Preserve FAQ, License, Conventions, and Extending the system largely as-is.

---

## Architectural Responsibility Map

This phase has no tiered architecture — it is a single-file documentation rewrite. The "architecture" is the README section structure mandated by D-03.

| Capability | Primary Owner | Rationale |
|------------|--------------|-----------|
| Plugin install steps | README Setup Guide | DOCS-01 target section |
| Config customisation | README Config Guide | DOCS-02 target section |
| End-to-end usage narrative | README Walkthrough | DOCS-03 target section |
| Per-template reference | README Template Reference | DOCS-04 target section |
| Existing well-targeted sections | README (preserve) | TL;DR, Why, Features, Conventions, Extending, FAQ, License |

---

## Current README Audit

### Sections to PRESERVE (largely intact or minor edits)

| Section | Current State | Action |
|---------|--------------|--------|
| TL;DR | Accurate 6-point summary | Preserve; move to top after heading |
| Why this exists | Clear problem/solution | Preserve |
| Features at a glance | Accurate emoji list | Preserve; verify all 11 templates are represented |
| How it works | Short pipeline description | Preserve or fold into Setup |
| Repository Layout | Accurate file tree | Preserve |
| Extending the system | Developer guidance | Preserve |
| Conventions | Frontmatter key table | Preserve |
| Troubleshooting | 11 bullet items | Preserve; may add 1-2 items from audit findings |
| FAQ | 13 Q&A items | Preserve; may add 1 item about "raw" status |
| License | MIT one-liner | Preserve |

### Sections to REPLACE

| Section | Current State | Action |
|---------|--------------|--------|
| Quick Start | 5-line terse list | Replace entirely with Step-by-Step Setup Guide (DOCS-01) |
| Configure & Customize | Content inside `<details>` collapsible | Unwrap and expand into full Config Guide section (DOCS-02) |
| Usage | Per-template narrative with code blocks | Reorganise as Template Reference (DOCS-04); add Walkthrough above it (DOCS-03) |

### Sections to ADD

| Section | Where | Content |
|---------|-------|---------|
| Step-by-Step Setup Guide | After TL;DR / Why / Features | Install Templater → install Dataview → configure folder paths → reload scripts → test |
| Configuration Guide | After Setup | Anatomy of `universityConfig.js` + worked before/after example |
| Workflow Walkthrough | After Config Guide | Concrete session narrative (lecture → concept link → parcial prep) |
| Template Reference | After Walkthrough | Table + per-template subsection for all 11 templates |

### Collapsible Sections (D-02 violation in current README)

Two `<details>` blocks exist and must be unwrapped:
1. `Configure & Customize` → "Common tweaks" is inside a `<details>` block (line 115). This becomes part of the Config Guide section body.
2. `Usage` → "Template prompts quick reference" table is inside a `<details>` block (line 277). This table becomes a visible subsection in Template Reference.

---

## Template Inventory (Complete — 11 Templates)

All 11 templates confirmed in `_templates/` directory. [VERIFIED: ls _templates/]

| # | Template File | Type | Purpose | When to Use |
|---|--------------|------|---------|-------------|
| 1 | `Lecture Note.md` | Creation | Captures a single lecture with structured sections; prompts year → subject → tema → topic → concepts | During or after a class |
| 2 | `Concept Note Template.md` | Creation | Creates a concept deep-dive with definition, analogy, explanation, Dataview backlinks | When a term needs its own note |
| 3 | `General Note.md` | Creation | Flexible note with consistent frontmatter; prompts year → subject → optional tema → title | Reference sheets, summaries, misc notes |
| 4 | `Subject Hub.md` | Creation | Course dashboard; Dataview tables for lectures, concepts, tasks; placed at year/subject root | Once per course at the start of semester |
| 5 | `Parcial Prep Note.md` | Creation | Exam-prep study guide; tables surface all lectures + concepts for the course automatically | Before each exam |
| 6 | `Assign Tema to Current Note.md` | Utility | Re-assigns tema/subject/year on an existing note and moves the file | Fixing mis-filed notes retroactively |
| 7 | `Link Concepts to Note.md` | Utility | Multi-select concept notes to add to any lecture's `concepts` array | During review, after creating concept notes |
| 8 | `Quick Create Concept.md` | Utility | Creates a concept note from highlighted text and links it back to the current note | Mid-lecture, without leaving the current note |
| 9 | `Update Note Status.md` | Utility | Batch-changes `status` field across multiple notes | End-of-session review workflow |
| 10 | `University Dashboard.md` | Dashboard | Vault-wide view; not listed in README Usage section currently | Course overview / semester planning |
| 11 | `Mark Reviewed.md` | Utility | Sets a concept note as reviewed and schedules next review via `reviewIntervals` | Spaced repetition review workflow |

**Gap discovered:** Templates 10 (`University Dashboard`) and 11 (`Mark Reviewed`) appear in `_templates/` but are NOT in the current README's Usage section. The README Table of Contents lists only 9 templates. D-05 requires all 11 to be covered. The planner must include these two in the Template Reference. [VERIFIED: ls _templates/ + README.md line 14–18]

---

## universityConfig.js — Complete Key Reference

[VERIFIED: direct file read]

All key names, defaults, and behaviours for the Config Guide (DOCS-02):

```
fs.universityRoot        "Universidad"    Base folder in vault root
fs.parcialContainer      "Parciales"      Container for exam-period folders
fs.temaContainer         "Temas"          Container for topic folders within a subject

labels.subject           "Subject"        Label shown in subject picker
labels.year              "Year"           Label shown in year picker
labels.parcial           "Parcial"        Rename to "Semester" or "Term" when features.parcial is true
labels.final             "Final"          Label for the final exam period option
labels.tema              "Tema"           Label shown in tema picker; rename to "Module", "Topic", etc.
labels.general           "General"        Catch-all for notes with no specific tema

years                    ["Year 1", "Year 2", "Year 3", "Year 4", "Year 5"]   Array drives the year picker

parciales                ["General", "Parcial 1", "Parcial 2", "Parcial 3", "Final"]   Drives exam-period picker

codeLanguage             ""               Default code fence language in Lecture Notes; "" = language-neutral

features.parcial         false            false = parcial prompts hidden; true = full parcial folder grouping

schema.types             { lecture, concept, subject-hub, parcial-prep, general, university-dashboard }
schema.statuses          ["raw", "draft", "reviewed", "complete"]   Drives status picker
schema.reviewIntervals   { easy: 14, medium: 7, hard: 3, blank: 1 }   Days until next review
```

**Recommended worked example for D-06:** Rename the system from Spanish defaults to English equivalents AND add a 3-year curriculum. This demonstrates the most common customisation (language + curriculum length) in a single before/after. Specific changes: `fs.universityRoot` "Universidad" → "University", `labels.tema` "Tema" → "Module", `labels.general` "General" → "General" (unchanged), `years` reduced to `["Year 1", "Year 2", "Year 3"]`, `features.parcial` set to `true` with `labels.parcial` changed to "Semester". This single scenario exercises `fs`, `labels`, `years`, and `features` in one sweep. [ASSUMED: "most common customization" — no user data to confirm, but the config comment itself says "Rename to 'Semester' or 'Term'" implying this is a design-intended use case]

---

## Audit Findings — Student-Visible Issues (D-08)

Two critical violations identified in AUDIT.md are worth a brief callout in the Template Reference. [VERIFIED: AUDIT.md]

### Critical Violation 1: Concept Note Template silently overwrites named files

**Location:** `_templates/Concept Note Template.md` — bootstrap called without `{ requireNewFile: true }`

**Student impact:** HIGH. If a student runs "Concept Note Template" on an existing named note (e.g., accidentally triggers it from the command palette while a note is open), the template moves and overwrites that file without warning. Data loss risk.

**Recommended callout location:** Concept Note Template entry in Template Reference.

**Callout text (suggested):** "Always run this template from an untitled note or via **'Templater: Create new note from template'**. Running it on an existing named note will overwrite the file without warning — this is a known bug."

### Critical Violation 2: Update Note Status missing "raw" status

**Location:** `_templates/Update Note Status.md` line 26 — fallback statuses array `["draft", "reviewed", "complete"]` omits `"raw"`

**Student impact:** MEDIUM-HIGH. Quick Capture notes with `status: "raw"` (the first stage in the 4-stage workflow) become invisible to the batch status updater if the config fails to load at runtime. Students who use the raw → draft pipeline will find their captures silently excluded.

**Recommended callout location:** Update Note Status entry in Template Reference, and optionally in the Config Guide where `schema.statuses` is documented.

**Callout text (suggested):** "If notes with `status: raw` don't appear in the picker, this is a known bug. As a workaround, update those notes' frontmatter manually until a fix is released."

### Minor Violations — Not worth surfacing to students

All 22 minor violations are implementation-level (wrong `app.` vs `tp.app.`, redundant awaits, label literal fallbacks). A student using the system as designed will not encounter them. Do not mention in README.

---

## Setup Guide Content (DOCS-01)

The new Setup Guide must cover these exact steps in this order — sourced from the current Quick Start and CLAUDE.md descriptions. [VERIFIED: README.md Quick Start + CLAUDE.md]

**Prerequisites:**
- Obsidian desktop (not mobile — `tp.user.*` unavailable on mobile)
- Community plugins enabled in Obsidian settings

**Step 1: Install Templater**
- Settings → Community Plugins → Browse → search "Templater" → Install → Enable

**Step 2: Install Dataview**
- Settings → Community Plugins → Browse → search "Dataview" → Install → Enable

**Step 3: Copy files into vault**
- Copy `_templates/` and `_templater_scripts/` folders into vault root (alongside `.obsidian/`)

**Step 4: Configure Templater**
- Settings → Templater → Template folder location: `_templates`
- Settings → Templater → Script files folder location: `_templater_scripts`
- Enable "Trigger Templater on new file creation" (optional but recommended)

**Step 5: Reload Templater user scripts**
- Command palette → "Templater: Replace templates in the active file" OR restart Obsidian
- This registers: `universityConfig`, `getUniversityContext`, `universityNoteUtils`, `scriptLoader`, `templateBootstrap`

**Step 6: Verify**
- Create a new untitled note → command palette → "Templater: Create new note from template" → select "Lecture Note"
- If prompts appear for year → subject → tema, setup is complete

**Version requirement:** Templater ≥ 2.16 required for `tp.system.multi_suggester` (Lecture Note concept tagging, Link Concepts to Note, Update Note Status). Older versions will partially work but multi-select features are skipped.

---

## Workflow Walkthrough Content (DOCS-03)

Recommended approach: **step-list with mock content** (not a full narrative essay). 4-stage session covering the exact scenario in D-07:

**Stage 1: Start of class — create a Lecture Note**
- Open Obsidian, create untitled note OR use "Create new note from template"
- Run Lecture Note; select Year 1 → Physics I → Waves → "Electromagnetic Spectrum"
- Optionally select concept notes already in vault (e.g., "Photon", "Wave-Particle Duality")
- Note lands at `University/Year 1/Physics I/Temas/Waves/Lecture 2024-05-03 - Electromagnetic Spectrum.md`
- Fill sections during class

**Stage 2: After class — create concept notes**
- Highlight "Photoelectric Effect" in lecture notes → run Quick Create Concept
- A concept note is created at `University/Year 1/Physics I/Temas/Waves/Photoelectric Effect.md`
- A `[[Photoelectric Effect]]` link appears at cursor; `concepts` frontmatter is updated

**Stage 3: Review session — link remaining concepts**
- Open the lecture note → run Link Concepts to Note
- Multi-select additional concept notes from Physics I to add to `concepts` array
- Concept notes already linked show "✓" prefix in picker

**Stage 4: Exam prep — create Parcial Prep Note**
- Create untitled note → run Parcial Prep Note → Year 1 → Physics I
- (If `features.parcial: true`, also select exam period: "Parcial 2")
- Dataview tables auto-populate with all lectures and concepts from Physics I / Year 1
- Tab through three cursor stops: Topics to Cover → Summary Notes → Practice Questions

---

## Architecture Patterns (Documentation)

### Recommended Section Structure for New README

```
README.md
├── Header (title, badges, ToC)
├── TL;DR
├── Why this exists
├── Features at a glance
├── Setup Guide                     ← DOCS-01 (new, replaces Quick Start)
│   ├── Prerequisites
│   ├── Step 1: Install Templater
│   ├── Step 2: Install Dataview
│   ├── Step 3: Copy files
│   ├── Step 4: Configure Templater
│   ├── Step 5: Reload scripts
│   └── Step 6: Verify
├── Configuration Guide             ← DOCS-02 (new, replaces Configure & Customize)
│   ├── Anatomy of universityConfig.js
│   ├── Key reference table
│   └── Worked example: before/after
├── Workflow Walkthrough            ← DOCS-03 (new)
│   ├── Stage 1: Create lecture note
│   ├── Stage 2: Create concept notes
│   ├── Stage 3: Link concepts
│   └── Stage 4: Exam prep
├── Template Reference              ← DOCS-04 (reorganised from Usage)
│   ├── Prompt quick-reference table (moved out of <details>)
│   ├── Creation Templates
│   │   ├── Lecture Note
│   │   ├── Concept Note Template
│   │   ├── General Note
│   │   ├── Subject Hub
│   │   └── Parcial Prep Note
│   ├── Utility Templates
│   │   ├── Assign Tema to Current Note
│   │   ├── Link Concepts to Note
│   │   ├── Quick Create Concept
│   │   ├── Update Note Status
│   │   └── Mark Reviewed
│   └── Dashboard Templates
│       └── University Dashboard
├── How it works
├── Repository Layout
├── Extending the system
├── Conventions
├── Troubleshooting
├── FAQ
└── License
```

### Template Reference Entry Format

Each of the 11 template entries should follow this uniform structure:

```markdown
### [Template Name]

**Creates:** [what the resulting note contains]
**Prompts:** [year picker → subject picker → tema picker → custom prompt, etc.]
**When to use:** [one sentence]

[2-3 sentence description of the template's behaviour and any important caveats]

[Frontmatter example block if one already exists in README for this template]
```

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead |
|---------|-------------|-------------|
| Anchor links in single-file README | Custom JS / external tool | Standard Markdown `[text](#anchor)` — GitHub and Obsidian both auto-generate anchors from headings |
| Template prompt documentation | Regenerate from source code | Extract from existing README Usage sections — they are accurate |
| Config key documentation | Parse universityConfig.js programmatically | Direct file read already done — all keys documented in this research |

---

## Common Pitfalls

### Pitfall 1: Collapsible sections

**What goes wrong:** Planner adds `<details>` blocks for long sections (config table, prompt reference table).
**Why it happens:** Instinct to keep README "clean" for long tables.
**How to avoid:** D-02 explicitly bans all `<details>` collapsibles. Both existing ones must be unwrapped.
**Warning signs:** Any `<details>` or `<summary>` tag in the output README.

### Pitfall 2: Listing only 9 templates in the reference

**What goes wrong:** Planner writes Template Reference with only the 9 templates from the current README Usage section.
**Why it happens:** Current README lists 9 templates; D-05 requires 11.
**How to avoid:** The two missing templates are `University Dashboard.md` and `Mark Reviewed.md`. Both must have entries.
**Warning signs:** Template Reference section has fewer than 11 subsections.

### Pitfall 3: Wrong config key names in worked example

**What goes wrong:** Worked example uses incorrect key paths (e.g., `config.universityRoot` instead of `fs.universityRoot`).
**Why it happens:** Config is nested; top-level keys are `fs`, `labels`, `years`, `parciales`, `codeLanguage`, `features`, `schema`.
**How to avoid:** Use the key reference table in this research document. Do not guess key names.
**Warning signs:** Any key path not matching the structure in universityConfig.js.

### Pitfall 4: Developer jargon reaching student readers

**What goes wrong:** Template Reference entry mentions "CommonJS module", "factory function", "EROFS", "module.exports".
**Why it happens:** AUDIT.md and source files use these terms correctly; docs writer copies them.
**How to avoid:** CONTEXT.md and CLAUDE.md specify: avoid developer jargon; Obsidian UI terms (command palette, frontmatter, community plugins) are fine.
**Warning signs:** Any of these terms: CommonJS, factory, module.exports, EROFS, async/await, require().

### Pitfall 5: Describing `features.parcial` behaviour inaccurately

**What goes wrong:** Docs say parcial prompts appear when the flag is `false`.
**Why it happens:** The flag is counterintuitive (false = disabled, hidden).
**How to avoid:** When `features.parcial: false` (default), ALL parcial-related prompts and the `Parciales/` folder are invisible. When `true`, parcial selection step appears in Parcial Prep Note. Document this explicitly.
**Warning signs:** Any statement that parcial prompts appear in the default configuration.

---

## Sections Already Well-Targeted (Preserve)

These sections in the current README are accurate and student-appropriate. Preserve with minimal edits:

- **TL;DR** (6 bullets) — accurate, concise, no jargon
- **Why this exists** — clear problem/solution prose
- **Features at a glance** — accurate; verify the 11th/12th features are represented after template count fix
- **How it works** — short pipeline; consider moving after Setup for better flow
- **Repository Layout** — accurate file tree
- **Extending the system** — developer-facing but appropriate
- **Conventions** — frontmatter key table is accurate and well-formatted
- **Troubleshooting** — 11 items; consider adding 1-2 items for the two critical audit violations
- **FAQ** — 13 items; consider adding one about "raw" status and Update Note Status
- **License** — one-liner, keep

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | The "most common customisation" is language-rename + curriculum-length adjustment | Config Guide worked example recommendation | If students more commonly add subjects/temas without renaming labels, a different example scenario would be more illustrative. Low risk — the chosen example still exercises all major config sections. |
| A2 | `University Dashboard.md` and `Mark Reviewed.md` purpose can be described accurately from their filenames + context (not yet read in full) | Template Reference entries for templates 10 and 11 | If either template has non-obvious behaviour, the planner will need to read those template files before writing their Reference entries. Recommend: planner reads both files before writing their sections. |

---

## Open Questions (RESOLVED)

1. **University Dashboard and Mark Reviewed — full behaviour unknown**
   - What we know: Both files exist in `_templates/`. Mark Reviewed is mentioned in Features at a glance ("Spaced repetition review workflow"). University Dashboard is mentioned in Repository Layout.
   - What's unclear: Exact prompts, frontmatter structure, and when-to-use for both. Neither has a Usage subsection in the current README.
   - Recommendation: Planner MUST read `_templates/University Dashboard.md` and `_templates/Mark Reviewed.md` before writing their Template Reference entries.
   - **RESOLVED:** Plan 04 explicitly reads both `_templates/University Dashboard.md` and `_templates/Mark Reviewed.md` in `<read_first>` and provides authoring guidance for each entry in `<action>`.

2. **"How it works" section placement**
   - What we know: D-03 specifies section order ending at Troubleshooting/FAQ; "How it works" is not explicitly placed in D-03's order.
   - What's unclear: Whether "How it works" belongs after Setup (helps students understand why steps matter) or after Template Reference (as a deeper internals section).
   - Recommendation: Place after Setup — it explains the bootstrap pipeline that Setup just configured, and students benefit from understanding the flow before using templates.
   - **RESOLVED:** Plan 05 action step 11 explicitly places "How it works" after Template Reference and before Repository Layout as a deeper-internals section.

---

## Environment Availability

Step 2.6: SKIPPED (no external dependencies — this is a single-file documentation rewrite with no CLI tools, services, or runtimes beyond a text editor).

---

## Sources

### Primary (HIGH confidence)

- `README.md` (current) — full read; all sections inventoried
- `AUDIT.md` — full read; 2 critical violations, 22 minor violations, 9 expansion opportunities documented
- `_templater_scripts/universityConfig.js` — full read; all key names, defaults, nested structure verified
- `_templates/` directory listing — all 11 template filenames confirmed
- `.planning/phases/02-documentation-overhaul/02-CONTEXT.md` — all decisions and constraints read
- `.planning/REQUIREMENTS.md` — DOCS-01 through DOCS-05 exact definitions read
- `.planning/ROADMAP.md` — Phase 2 success criteria (6 items) read

### Secondary (MEDIUM confidence)

- CLAUDE.md (project) — reader persona and jargon rules confirmed
- `.planning/config.json` — `nyquist_validation: false` confirmed (Validation Architecture section omitted)

### Tertiary (LOW confidence — Assumed)

- A1: "Most common customisation" scenario for worked example — training knowledge, no user data

---

## Metadata

**Confidence breakdown:**
- Template inventory: HIGH — verified via directory listing and README cross-reference
- Config key reference: HIGH — verified via direct file read
- Audit violations for D-08: HIGH — verified via AUDIT.md
- Recommended worked example scenario: MEDIUM — rationale is sound but not confirmed by user data
- Template behaviour for University Dashboard and Mark Reviewed: LOW — files not yet read

**Research date:** 2026-05-15
**Valid until:** 2026-06-15 (stable project, no external dependencies)

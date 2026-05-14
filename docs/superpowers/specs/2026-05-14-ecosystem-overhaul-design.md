# Ecosystem Overhaul — Design Spec
_Date: 2026-05-14_

## Problem

The existing templates capture content well but are not designed for how students actually learn. Sections encourage verbatim copying (the textbook-style Definition prompt), passive list-making (Key takeaway 1, Key takeaway 2), and re-reading as a review strategy — which cognitive science research identifies as the least effective study technique. The system is also write-only: notes accumulate with no mechanism to surface what needs review, and the holistic view across courses is absent.

## Guiding Principles

1. **Generation over capture.** Every section should force the student to produce something — paraphrase, invent an example, make a claim — not copy from a source.
2. **Retrieval, not re-reading.** Notes should be structured so returning to them is a retrieval exercise, not a passive scan.
3. **Simple enough to use in a live lecture.** Friction kills adoption. Style selection replaces template proliferation — one template, one decision.
4. **One clear job per template.** Any student should understand the system in under a minute.
5. **Config-driven, no hardcoding.** All labels, folders, and schema values come from `universityConfig.js`.

## Research Foundation

Key findings informing every design decision:

- **Generation effect:** Self-produced content (paraphrase, self-generated examples, analogies) is retained ~50% better than passively received content. This is the mechanism behind Cornell notes, the Feynman technique, and every other effective method.
- **Retrieval practice:** Forcing recall — even imperfect recall — produces dramatically better long-term retention than re-reading. Notes should be structured to enable retrieval, not comfortable re-reading.
- **Elaborative interrogation:** "Why is this true? Where does this break?" consistently outperforms summarization as a learning activity.
- **Reference vs. permanent notes:** A note that states what a source said is a filing cabinet entry. A note that states what YOU understand is a learning artifact. The system should push toward the latter.
- **PKM failure modes:** Template overhead kills capture frequency. Write-only systems (no review mechanism) become junk drawers. The system must be frictionless to create and must surface notes for review automatically.
- **Spaced repetition without apps:** A `next_review` date field + Dataview query surfaces stale notes without any additional plugin.

## Design Language

Applied consistently across every template.

### Callout conventions

```
> [!question]- Self-test     ← collapsed by default in reading view; retrieval practice
> [!warning] Pitfall         ← common mistakes; always visible
> [!abstract] Core idea      ← synthesis / assertion; always visible
```

The `[!question]-` callout (dash = collapsed) is the primary review mechanism. Written during processing while material is fresh; encountered collapsed during every future review. The student recalls before expanding. No plugin required — native Obsidian.

### Emoji system

| Emoji | Consistent meaning |
|---|---|
| 🎯 | Purpose / when to use |
| 📝 | Your own words |
| 🧠 | Deep synthesis |
| ⚙️ | Procedural / steps |
| 💻 | Code / technical |
| 🔗 | Connections to other notes |
| ❓ | Open questions |
| 📊 | Tables / structured data |
| 🔔 | Needs attention / review due |

### Frontmatter schema

```yaml
# All notes
type:     # from schema.types in config
course:   # subject name
year:     # from config.years
tema:     # topic folder name
created:  # YYYY-MM-DD via tp.date.now
status:   # raw | draft | reviewed | complete
aliases:  []

# Lecture notes additionally
concepts: []   # [[Wikilinks]] to concept notes

# Concept notes additionally
next_review: YYYY-MM-DD    # set at creation, updated by Mark Reviewed utility
last_reviewed: YYYY-MM-DD  # set by Mark Reviewed utility; absent until first review
```

`status: raw` is the only new value added to the schema. All existing notes are unaffected.

---

## Template Taxonomy

### Create-note templates

| Template | One job |
|---|---|
| Lecture Note | Capture and process a lecture |
| Concept Note | Explain one concept in your own words |
| General Note | Anything that doesn't fit the above |
| Parcial Prep Note | Study guide for an exam |
| Subject Hub | Dashboard for one course |
| University Dashboard | Vault-wide overview across all courses |

### Utility templates (run on existing notes)

| Template | One job |
|---|---|
| Quick Create Concept | Spin up a concept note without leaving a lecture |
| Link Concepts | Wire concept notes to a lecture after the fact |
| Assign Tema | Move a note to the right folder |
| Update Note Status | Bulk-mark notes as reviewed or complete |
| Mark Reviewed | Update the next-review date on a concept note |

---

## The Flow

```
Lecture Note (Quick) ──► Lecture Note (Deep/STEM) ──► Concept Note
                                  │                         │
                            Subject Hub ◄────────────────────
                                  │
                        Parcial Prep Note
                                  │
                        University Dashboard
```

In one sentence: **Lecture Notes capture → Concept Notes deepen → Subject Hub organizes → Parcial Prep tests → University Dashboard keeps everything visible.**

---

## Template Designs

### 1. Lecture Note

Style picker appears after placement resolves. Labels are self-explanatory — no student should need to think about which to choose.

```
⚡ Quick     — capture now, process later
🧠 Ideas & Theory  — arguments, concepts, context
💻 Code & Math     — algorithms, proofs, techniques
```

**Style: ⚡ Quick** (`status: raw`)

Skips concept multi-select. Two sections only. A `[!warning]` callout at the top signals the note is unprocessed and needs upgrading.

```markdown
> [!warning] Unprocessed — convert within 24h
> Run *Link Concepts* then upgrade to Ideas & Theory or Code & Math.

# ⚡ {topic}

{cursor(1)}

## ❓ Questions
- {cursor(2)}
```

---

**Style: 🧠 Ideas & Theory** (`status: draft`)

Structured around Q/E/C — the three-part argument structure that mirrors how theory and humanities lectures are actually delivered. Professors rarely state the main idea explicitly; the student must identify the central question, the evidence offered for it, and what conclusion the evidence supports. Adds a `[!question]-` self-test callout written during processing.

```markdown
# 🧠 {topic}

## 🎯 Central Question
*What was the lecture actually arguing? The professor's core question or thesis.*
{cursor(1)}

## 📝 Evidence & Examples
*Key evidence, examples, data. Paraphrase — stop if you're copying.*
- 

## 🧠 My Conclusion
*In your own words: what does the evidence say? What position does it support?*

> [!warning] Common Mistake
> 

> [!question]- Self-test
> {cursor(2)}
>
> **Answer:**

## 🔗 Connections
- 

## ❓ Open Questions
- {cursor(3)}
```

---

**Style: 💻 Code & Math** (`status: draft`)

Restructures around procedural understanding: when to use, how to apply, self-generated worked example, where it breaks. Tradeoffs table for STEM contexts.

```markdown
# 💻 {topic}

## 🎯 Problem Type
*When does this apply? What does the problem look like?*
{cursor(1)}

## ⚙️ My Approach
*Steps in your own words. Not copied.*
1. 

## 💻 Example I Worked Out
```{codeLanguage}
// {topic}
```

> [!warning] Edge Cases
> - 

> [!question]- Self-test
> {cursor(2)}
>
> **Answer:**

## 📊 Tradeoffs
| | |
|---|---|
| Time | |
| Space | |
| Don't use when | |

## 🔗 Connections
- {cursor(3)}
```

---

### 2. Concept Note

Style picker:

```
💡 Concept   — an idea, term, or theory
⚙️ Technique — a method, algorithm, or procedure
```

**Style: 💡 Concept** (`status: draft`, has `next_review`)

Removes the "formal, textbook-style definition" instruction entirely — this was the most counterproductive prompt in the system. Replaces it with `[!abstract] My Assertion`: one declarative sentence of what the student believes this concept is or does. The elaboration (Analogy, Feynman) follows from the assertion.

```markdown
# 💡 {concept}

> [!abstract] My Assertion
> {cursor(1)}

## 🧠 Analogy
- 

## 📝 Feynman Explanation
*Explain this to someone who missed every lecture on it.*
- 

> [!warning] Common Misunderstanding
> 

> [!question]- Self-test
> {cursor(2)}
>
> **Answer:**

## 🔗 Where This Appears
{dataview backlinks block}
```

---

**Style: ⚙️ Technique** (`status: draft`, has `next_review`)

Structured around procedural knowledge: when to apply, how to execute, a self-derived example, and where the technique fails. Self-test callout frames a practice problem.

```markdown
# ⚙️ {concept}

## 🎯 When to Reach For This
{cursor(1)}

## ⚙️ Steps — My Words
1. 

## 💻 Example I Worked Through
```{codeLanguage}
```

> [!warning] Edge Cases
> - 

> [!question]- Self-test
> {cursor(2)}
>
> **Answer:**

## 🔗 Where This Appears
{dataview backlinks block}
```

---

### 3. General Note

Deliberately open — the catch-all. Consistent visual language, no forced structure. Connections section preserved because linking is always valuable.

```markdown
# {title}

{cursor(1)}

## 🔗 Connections
- 
```

---

### 4. Parcial Prep Note

Fundamentally redesigned around the most robust finding in study-skills research: retrieval before review. Uses `tp.system.prompt(multiline: true)` — currently unused in the system — to capture a cold recall dump before the student sees any of their notes. The Dataview tables that follow become confirmation and gap-filling, not the primary content.

```markdown
# 📚 {subject} — Study Guide

> [!warning] Do This First
> Write everything you remember **before** scrolling down. No notes, no peeking.

## 🧠 Recall Dump
{multiline prompt output}

## 🕳️ Gaps I Noticed
*What went blank? These are your actual priorities.*
- {cursor(1)}

---

## 💡 Key Concepts
{dataview: concepts for this course/parcial, sorted by created ASC}

## 📘 Lectures
{dataview: lectures for this course/parcial, sorted by created ASC}

## ❓ Practice Questions
- {cursor(2)}

## 🔑 Formulas & Key Facts
| Item | Detail |
|---|---|
| | |

## ⏳ Open Tasks
{dataview: tasks for this course}
```

---

### 5. Subject Hub

Existing Dataview blocks unchanged. Two new sections added at the top where they are most actionable:

**Due for Review** — surfaces concept notes whose `next_review` date has passed.

**Note Health** — a single-line count of notes by status for this course. A student can see immediately whether their notes are being processed (`raw: 0  draft: 2  reviewed: 8  complete: 4`) or accumulating unprocessed (`raw: 14  draft: 0`).

The existing Year → Tema breakdown, Lectures table, Concepts table, Tema Index, and Open Tasks sections remain unchanged below.

---

### 6. University Dashboard _(new)_

A single note created at `Universidad/` root. The only new template. Does not overlap with Subject Hub — Subject Hub is per-course, Dashboard is vault-wide.

Four Dataview blocks:

1. **Review Queue** — all concept notes with `next_review <= date(today)`, sorted by overdue amount. The first thing a student sees when they open the dashboard.
2. **Status by Course** — dataviewjs table: one row per course, columns for each status count. Reveals at a glance which courses are healthy vs. accumulating raw notes.
3. **Open Tasks** — task query across all courses sorted by modification date.
4. **Orphaned Concepts** — concept notes with no incoming links. Direct signal of the PKM failure mode: notes created but never integrated into the knowledge graph.

---

### 7. Quick Create Concept _(coherence fix + clipboard seeding)_

Currently generates a concept note body that differs slightly from what Concept Note Template produces. Fixed: uses the same style selection (💡 Concept / ⚙️ Technique) and generates content with identical structure to the full Concept Note Template. (The mechanics differ — Quick Create uses `tp.file.create_new` rather than running on the current file — but the body sections, callouts, and frontmatter schema are exactly the same.)

Gains clipboard seeding: `await tp.system.clipboard()` pre-fills the note body when the student has copied text from a source before running the template. Shown as the default value in the concept name prompt so it can be accepted or overridden. No dialog added — clipboard content is offered silently as a default.

---

### 8. Mark Reviewed _(new utility)_

Companion to Update Note Status. Prompts difficulty of recall for the current note:

```
Easy   — understood on first attempt     → next_review: today + 14 days
Medium — needed to think                 → next_review: today + 7 days
Hard   — struggled significantly         → next_review: today + 3 days
Blank  — could not recall                → next_review: today + 1 day
```

Sets `last_reviewed: today` and `next_review: calculated date` via `processFrontMatter` in `tp.hooks.on_all_templates_executed`. Same pattern as Assign Tema — proven, safe.

---

### 9. Utility templates (Link Concepts, Assign Tema, Update Note Status)

No structural changes. All three work correctly as-is.

---

## Config Changes

```js
// universityConfig.js additions only — no removals

schema: {
  types: { /* unchanged */ },
  statuses: ["raw", "draft", "reviewed", "complete"],  // raw added
  reviewIntervals: { easy: 14, medium: 7, hard: 3, blank: 1 },  // for Mark Reviewed
},
```

---

## Capability Map

| Templater API | Used by |
|---|---|
| `tp.system.suggester` — style selection | Lecture Note, Concept Note, Quick Create Concept |
| `tp.system.prompt(multiline: true)` | Parcial Prep Note — recall dump |
| `tp.system.clipboard()` | Quick Create Concept — clipboard seeding |
| `tp.hooks.on_all_templates_executed` | Quick Create Concept, Mark Reviewed (existing pattern) |
| `[!question]-` collapsed callout | Lecture Note (Deep/STEM), Concept Note |
| `[!warning]` callout | Lecture Note, Concept Note, Parcial Prep |
| `[!abstract]` callout | Concept Note (Conceptual) |
| Dataview `date()` arithmetic | Subject Hub, University Dashboard |
| `tp.date.now` offset arithmetic | Concept Note Template, Quick Create Concept, Mark Reviewed |
| Dataview task queries | Subject Hub, Parcial Prep, University Dashboard |
| Dataviewjs aggregation | Subject Hub (health), University Dashboard (status by course) |

---

## What Does Not Change

- `templateBootstrap.js` — logic unchanged
- `universityNoteUtils.js` — untouched
- `getUniversityContext.js` — untouched
- `scriptLoader.js` — untouched
- `resolvePlacement` / `resolveSubjectParcialTema` — untouched
- All frontmatter keys — additive only (`raw` status, `next_review`, `last_reviewed`)
- Existing notes — no migration required; new fields are optional

---

## Out of Scope

- Any additional plugin requirements beyond Templater and Dataview
- Calendar integration or scheduling
- Flashcard apps or spaced repetition plugins
- Automated notifications
- Mobile support (Templater user scripts are desktop-only by design)

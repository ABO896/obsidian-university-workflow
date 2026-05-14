# Phase 1: Ethos Audit — Research

**Researched:** 2026-05-14
**Domain:** Obsidian Templater template and script audit — config-driven purity, Templater-native usage, zero-friction UX
**Confidence:** HIGH (all 16 files read directly; findings are code-level observations, not inference)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Primary organization is dimension-first — 3 main sections, one per ethos principle (config-driven purity, Templater-native, zero-friction).
- **D-02:** Each violation entry includes flag + inline fix suggestion: file path + location (line/block), what's wrong, and the specific fix.
- **D-03:** `AUDIT.md` lives at the project root alongside `README.md`.
- **D-04:** Each expansion opportunity: title + description (2–3 sentences). Lightweight.
- **D-05:** Expansion opportunities are a flat list ordered by apparent impact/obviousness. No subcategories.
- **D-06:** Surface anything interesting, including gaps that touch out-of-scope areas, annotated with `(out of scope for this initiative)`.
- **D-07:** Expansion opportunities are a separate section at the end of `AUDIT.md`, after all three violation-dimension sections.

### Claude's Discretion
- Severity thresholds: violations that could cause silent runtime failures or data loss = critical; style/consistency violations = minor.
- Ordering of violations within each dimension section: by severity (critical first), then by file.

### Deferred Ideas (OUT OF SCOPE)
None identified during discussion.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| AUDIT-01 | Audit all templates and scripts for config-purity violations | Pre-scan complete — specific violations identified in every relevant file |
| AUDIT-02 | Audit all templates and scripts for Templater-native violations | Pre-scan complete — raw JS patterns and await omissions catalogued |
| AUDIT-03 | Audit all templates for zero-friction violations | Pre-scan complete — prompt counts and UX issues mapped per template |
| AUDIT-04 | Identify expansion opportunities | 7 concrete gaps identified from codebase patterns |
| AUDIT-05 | Synthesize findings into structured AUDIT.md | Structure, format, and content fully specified below |
</phase_requirements>

---

## Summary

All 16 files (11 templates, 5 scripts) were read in full during this research session. The codebase is architecturally sound: the bootstrap pattern is consistently applied, CommonJS modules are structured correctly, and the config-driven design is well-established in the scripts layer. Violations are present but concentrated — config-purity issues are mostly minor (hardcoded fallback strings that belong in config), Templater-native issues are mostly minor too (one pattern of missing `await` on `getConfig()` and some bare `app.*` usage in a utility template), and zero-friction issues are minimal. There are no critical violations that would cause data loss.

The most significant single finding is in `templateBootstrap.js` line 33: `await getConfig()` — `universityConfig` is a synchronous factory function, not a Promise, so the `await` is harmless but misleading. The inverse of the stated rule (calling await on something synchronous) is the mirror image of the critical "missing await on async calls" rule. Both belong in the Templater-native section.

The `Assign Tema to Current Note.md` template uses bare `app.vault` and `app.fileManager` inside the hook callback (lines 70–79) instead of `tp.app.*`. This is technically inside a `tp.hooks` callback where the template body's `tp` is still in scope, but it deviates from the documented convention that bare `app.*` in templates should be replaced with `tp.app.*`. Severity: minor (it works, because `app` is an Obsidian global), but is a consistency violation.

**Primary recommendation:** Implement the AUDIT.md in a single focused task: read all 16 files, apply the three audit rubrics from CONVENTIONS.md, produce a dimension-first report with severity ordering.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Audit execution (read files, apply rules) | Implementation agent | — | Pure code inspection, no runtime |
| AUDIT.md authoring | Implementation agent | — | File write at project root |
| Ethos rule definitions | CONVENTIONS.md | CONTEXT.md | Canonical rule source exists |
| Violation evidence | Source files | — | All 16 files are the ground truth |

---

## Pre-Scan Findings by Dimension

This section is the core research output. It documents every violation and opportunity found by reading all 16 files. The implementation task should use this as its starting checklist, verify each item against the live files, and add any additional findings during the actual audit pass.

---

### AUDIT-01 Pre-Scan: Config-Purity Violations

**Rule (from CONVENTIONS.md):** All folder names, labels, years, and type identifiers MUST come from `universityConfig.js` at runtime. Never hardcode strings that exist in config.

**Hardcoded fallback strings** are the primary pattern. These exist throughout the codebase as `?? "literal"` fallbacks, which are acceptable when the config value is guaranteed to exist and they merely mirror it — but become violations when the fallback diverges from or pre-empts the config value.

**Confirmed findings:**

| File | Line/Block | Hardcoded Value | Violation Class | Severity |
|------|-----------|-----------------|----------------|----------|
| `universityNoteUtils.js` | Line 47 | `"Subject"` in `SUBJECT_LABEL = labels.subject ?? "Subject"` | Duplicate of config default | Minor |
| `universityNoteUtils.js` | Line 48 | `"Year"` in `YEAR_LABEL = labels.year ?? "Year"` | Duplicate of config default | Minor |
| `universityNoteUtils.js` | Line 49 | `"Tema"` in `TEMA_LABEL = labels.tema ?? "Tema"` | Duplicate of config default | Minor |
| `universityNoteUtils.js` | Line 50 | `"Parcial"` in `PARCIAL_LABEL = labels.parcial ?? "Parcial"` | Duplicate of config default | Minor |
| `universityNoteUtils.js` | Line 53 | `"Parciales"` in `PARCIAL_CONTAINER_NAME = fsConfig.parcialContainer ?? "Parciales"` | Fallback mirrors `universityConfig.js` `fs.parcialContainer` exactly | Minor |
| `University Dashboard.md` | Line 24 | `constants?.universityRoot ?? "Universidad"` | Hardcoded vault root — if config renames root, dashboard breaks silently | Minor |
| `Update Note Status.md` | Line 27 | `["draft", "reviewed", "complete"]` as fallback statuses (excludes `"raw"`) | The schema fallback omits `"raw"` which IS in `universityConfig.js` statuses | **Critical** |
| `Subject Hub.md` | Lines 31–39 | `temaContainerName` resolution chain has 4 fallbacks before reaching a `temaLabel + "s"` construction | Config should always provide `temaContainer`; this chain is overly defensive and constructs a label (`Temas`) that is not in config | Minor |
| `Lecture Note.md` | Line 17 | `noteTypes.lecture ?? "lecture"` and `noteTypes.concept ?? "concept"` | Standard schema fallback pattern — acceptable but should note all templates use this same pattern; if the schema key is ever removed from config, all fallbacks become silent divergences | Minor |
| `Concept Note Template.md` | Line 68 | `{ easy: 14, medium: 7, hard: 3, blank: 1 }` hardcoded inline as `reviewIntervals` fallback | Duplicates `schema.reviewIntervals` from `universityConfig.js`; if config changes interval values, this fallback remains stale | Minor |
| `Quick Create Concept.md` | Line 110 | Same `reviewIntervals` hardcoded fallback as above | Same violation, second location | Minor |
| `Parcial Prep Note.md` | Line 131 | `WHERE type = "${conceptType}"` inside Dataview block — the `"` quoting is correct, but the literal string `conceptType` is runtime-interpolated correctly; **no violation here** | — | — |
| `templateBootstrap.js` | Line 33 | `await getConfig()` — `universityConfig` exports a synchronous function, not a Promise | Misleading `await` on synchronous call; inverse of the "missing await" rule | Minor |

**Nota bene on `Update Note Status.md` line 27:** The fallback array `["draft", "reviewed", "complete"]` omits `"raw"`. The authoritative `universityConfig.js` defines `statuses: ["raw", "draft", "reviewed", "complete"]`. If `schema.statuses` is ever absent (e.g., config error), notes with `status: "raw"` would be invisible to this utility. This is the only critical config-purity violation found.

---

### AUDIT-02 Pre-Scan: Templater-Native Violations

**Rule (from CONVENTIONS.md):** Never use raw JS when a native `tp.*` API exists. All async `tp.*` calls must be awaited. `tp.date.now()` is synchronous (no await). Never use bare `app.*` in templates.

**Confirmed findings:**

| File | Line/Block | Violation | Severity |
|------|-----------|-----------|---------|
| `Assign Tema to Current Note.md` | Line 70 | `app.vault.getAbstractFileByPath(...)` — bare `app.vault` instead of `tp.app.vault` inside hook callback | Minor |
| `Assign Tema to Current Note.md` | Line 71 | `app.fileManager.processFrontMatter(...)` — bare `app.fileManager` instead of `tp.app.fileManager` | Minor |
| `templateBootstrap.js` | Line 33 | `await getConfig()` where `getConfig` is synchronous — spurious `await` | Minor |
| `Subject Hub.md` | Lines 83–84 | `const timestamp = tp.date.now(...)` used as both `created` and `updated` — `updated` is re-assigned the same timestamp, which is correct for creation but `updated` is not a standard frontmatter key defined in CONVENTIONS.md | Minor |
| `Concept Note Template.md` | Line 5 | `await tp.user.templateBootstrap(tp)` — called **without** `{ requireNewFile: true }`. CONVENTIONS.md and CONTEXT.md both specify creation templates call bootstrap with `requireNewFile: true`. Concept Note Template creates a new note and moves it, so it IS a creation template that should enforce the guard | **Critical** |
| `Quick Create Concept.md` | Line 21 | Same as above — bootstrap called without `requireNewFile: true`, but this template does NOT set tR and creates a note via `tp.file.create_new`. The guard is arguably less critical here since it creates a new file rather than overwriting the current one. Still a deviation from the established pattern | Minor |
| `General Note.md` | Line 5 | `await tp.user.templateBootstrap(tp)` — no `requireNewFile: true`, but the template has its own inline guard at lines 23–38 (checks for Untitled basename). This is a redundant parallel guard rather than using the canonical bootstrap guard | Minor |

**No occurrences found:**
- `new Date()` — not present in any file [VERIFIED: full file reads]
- `window.prompt()` — not present in any file [VERIFIED: full file reads]
- `fetch()` — not present in any file [VERIFIED: full file reads]
- `tp.date.now()` with spurious `await` inside templates — not found (only the bootstrap `getConfig` case above)
- Missing `await` on `tp.file.move` — all calls are properly awaited in every template [VERIFIED]
- Missing `await` on `tp.file.create_new` — properly awaited in `Quick Create Concept.md` line 196 [VERIFIED]
- Missing `await` on `tp.system.suggester` / `tp.system.multi_suggester` — all properly awaited [VERIFIED]
- Missing `await` on `tp.system.prompt` — all properly awaited [VERIFIED]
- Missing `await` on `tp.system.clipboard()` — properly awaited in `Quick Create Concept.md` line 40 [VERIFIED]

**Detail on `Concept Note Template.md` critical finding:** The template calls `await tp.user.templateBootstrap(tp)` (no `requireNewFile`) on line 5. It then moves the file at line 82–83 (`await tp.file.move(destinationMovePath)`). The bootstrap guard for `requireNewFile` would have rejected running this template on an existing named note and prevented an accidental overwrite. Without it, running `Concept Note Template` on an existing non-Untitled note will silently proceed, rename and move it, and overwrite its content. This is the clearest critical violation in the Templater-native dimension.

---

### AUDIT-03 Pre-Scan: Zero-Friction Violations

**Rule (from REQUIREMENTS.md AUDIT-03):** Flows requiring more than 1–2 prompts without clear reason, confusing or ambiguous prompt text, or steps that could be automated.

**Prompt counts per creation template:**

| Template | Prompt Steps | Notes |
|----------|-------------|-------|
| `Lecture Note.md` | 5 prompts (year → subject → tema → topic → style → concepts multi-select) | Concept multi-select only appears for theory/STEM styles and only if concept files exist. All prompts have clear purpose. |
| `Concept Note Template.md` | 4 prompts (year → subject → tema → style) | Note title comes from the file name (pre-named by user), not a prompt. All prompts clear. |
| `Quick Create Concept.md` | 4–5 prompts (name → style → year/subject/tema via placement → year prompt conditional) | Name pre-filled from selection/clipboard. Could reduce to 3 if placement inherits fully from current note context. |
| `General Note.md` | 4–5 prompts (optional proceed-guard → year → subject → tema → title) | Proceed-guard only appears on non-Untitled files. Title defaults to current basename, which is good. |
| `Subject Hub.md` | 3 prompts (year → subject → [no title prompt]) | File name auto-generated as `{Subject} Hub`. Clean. |
| `Parcial Prep Note.md` | 3–4 prompts (year → subject → [parcial if enabled] → recall dump) | Recall dump is intentional by design (retrieval practice). Not a friction violation. |
| `University Dashboard.md` | 0 prompts | Fully automated. Excellent. |

**Confirmed zero-friction violations:**

| File | Issue | Severity |
|------|-------|---------|
| `General Note.md` | The template implements its own `basename.startsWith("untitled")` guard (lines 23–38) instead of using bootstrap's `requireNewFile`. This creates a non-standard UX: when run on a named file, the user sees an unexpected `tp.system.suggester` asking "Run General Note on this existing file?" with "Continue" / "Cancel" options. The prompt text is clear but the extra step is avoidable — bootstrap's guard would just abort with a Notice. Minor UX inconsistency. | Minor |
| `Quick Create Concept.md` | Context inheritance is partial: `contextSubject` reads from `tp.frontmatter?.course` (correct), but `contextYear` reads from `tp.frontmatter?.year` (correct), and `contextTema` reads from `tp.frontmatter?.tema` (correct). However, because `promptYearWhen: "missing"` is set, if the current note lacks a year in frontmatter, the user is still prompted for year even when running from within a subject note that would rarely change. Low impact but adds friction in the common "quick concept from current note" workflow. | Minor |
| `Assign Tema to Current Note.md` | Uses `promptYearWhen: "always"` — year is always prompted even when the current note already has a year in frontmatter. For a utility that is re-assigning tema to an existing note, the year is almost certainly not changing. `promptYearWhen: "missing"` would reduce friction substantially. | Minor |
| `Lecture Note.md` | `promptYearWhen: "always"` forces a year prompt even when the note is opened inside a correctly-structured year folder and context is already inferred. The inferred year is shown as the first option, so the user one-taps through it, but it is still a prompt that could be skipped when context is unambiguous. | Minor |
| `Concept Note Template.md` | Same as above — `promptYearWhen: "always"` when `promptYearWhen: "missing"` or `"never"` would be workable in most cases. | Minor |

**No critical zero-friction violations found.** All prompts have clear labels. No prompt text is ambiguous. No step is genuinely redundant beyond the minor cases above.

---

### AUDIT-04 Pre-Scan: Expansion Opportunities

These are gaps where the system's stated purpose is not yet fully served. Each is a concrete proposal.

| # | Title | Description |
|---|-------|-------------|
| E-01 | `Concept Note Template.md` missing `requireNewFile` guard | The bootstrap guard for `requireNewFile: true` is missing, meaning this creation template can silently overwrite a named note. Adding `{ requireNewFile: true }` to the bootstrap call is a one-line fix but prevents a data-loss class of error. |
| E-02 | Shared `reviewIntervals` fallback constant | `Concept Note Template.md` and `Quick Create Concept.md` each hardcode `{ easy: 14, medium: 7, hard: 3, blank: 1 }` as a fallback. This duplicates `universityConfig.js schema.reviewIntervals`. A single access path via `config?.schema?.reviewIntervals` (already used in `Mark Reviewed.md`) would eliminate the duplication. |
| E-03 | `Update Note Status.md` missing `"raw"` in fallback statuses | The fallback array on line 27 omits `"raw"`, which means notes captured in Quick mode (which default to `status: "raw"`) would be invisible to the batch-status utility if `schema.statuses` were ever absent. |
| E-04 | `tp.date.now()` offset form unused in `Quick Create Concept.md` and `Concept Note Template.md` | Both templates compute `nextReview` via `tp.date.now("YYYY-MM-DD", reviewIntervals.medium ?? 7)`. This is the correct idiomatic usage, but the `??` fallback on `reviewIntervals.medium` is redundant if config is always present. Low priority. |
| E-05 | No template for creating a new Subject (folder + hub in one step) | Users currently must: (1) run Subject Hub template, (2) manually select a non-existent subject, (3) type the new subject name. A dedicated `New Subject` template could create the folder, generate the hub note, and optionally open it in a single action. *(Out of scope for this initiative)* |
| E-06 | No `Study Session` or daily-capture template | The system has lecture notes, concept notes, and study guides, but no lightweight "I studied today" journal entry that cross-links to concepts reviewed. `Mark Reviewed` covers the spaced-repetition side, but there is no narrative capture for study sessions. *(Out of scope for this initiative)* |
| E-07 | `getUniversityContext.js` lazy-init state persists for vault lifetime | Module-level `_initialized` flag means config changes (e.g., adding a new year) require an Obsidian vault reload to take effect. This is documented in ARCHITECTURE.md as a known constraint, but it is a real gotcha for users who edit config mid-session. An expansion could add a "Reset context cache" utility template that calls a `reset()` export if `getUniversityContext.js` exposed one. *(Out of scope for this initiative)* |
| E-08 | `Subject Hub.md` `updated` frontmatter key is non-standard | The template generates `updated: "YYYY-MM-DD"` in its frontmatter (lines 84–85, 100), but `updated` is not listed in CONVENTIONS.md's required frontmatter key order. If this key is intentional, it should be added to the conventions; if unintentional, it should be removed. |
| E-09 | Mobile usage blockers not surfaced in templates | `tp.user.*` scripts are unavailable on Obsidian mobile. No template currently shows a user-facing notice when run on mobile. A `mobile` feature flag in `universityConfig.js` plus a bootstrap-level guard could prevent confusing silent failures for mobile users. *(Out of scope for this initiative)* |

---

## Standard Stack

This is a pure Obsidian Templater / Dataview project with no npm dependencies for the runtime. The audit task itself requires no installed tooling — it is a reading and writing task.

| Tool | Version | Purpose |
|------|---------|---------|
| Obsidian Templater plugin | ≥ 2.16 (multi_suggester requirement) | Template execution engine |
| Obsidian Dataview plugin | Any current | Dashboard queries |
| Node.js / Jest | Installed (tests/ present) | Unit testing of scripts |

---

## Architecture Patterns

### How the Audit Task Should Proceed

The audit is a **reading + classification task**, not a code-modification task. The implementation agent should:

1. Re-read each of the 16 files (can use this pre-scan as a starting map, but must verify line numbers against live files).
2. Apply three rubrics in sequence (config-purity, Templater-native, zero-friction) to each file.
3. Produce AUDIT.md at project root using D-01 through D-07 structure.

### AUDIT.md Skeleton (for planner reference)

```markdown
# Ethos Audit

## 1. Config-Driven Purity

### Critical
- **[File] line N:** [what's wrong] → Fix: [specific fix]

### Minor
- **[File] line N:** [what's wrong] → Fix: [specific fix]

## 2. Templater-Native Usage

### Critical
- ...

### Minor
- ...

## 3. Zero Friction

### Minor
- ...

## 4. Expansion Opportunities

1. **[Title]** — [2–3 sentence description]. *(out of scope for this initiative)* if applicable.
```

---

## Don't Hand-Roll

This phase has no library choices — it is a pure audit and report task. No build tooling is involved.

---

## Common Pitfalls for the Audit Task

### Pitfall 1: Treating `?? "fallback"` as always a violation
**What goes wrong:** Every `?? "literal"` in a script gets flagged as a config-purity violation.
**Why it happens:** The rule says "never hardcode strings that exist in config," but defensive fallbacks that mirror the config default (e.g., `labels.subject ?? "Subject"`) are a common pattern. They become actual violations only when the fallback value diverges from config or pre-empts a dynamic lookup.
**How to avoid:** Flag as minor (not critical) unless the fallback diverges from the config value or introduces a new string not present in config at all.

### Pitfall 2: Confusing "synchronous tp.* function called with await" with "missing await"
**What goes wrong:** Flagging `tp.date.now()` without await as a violation (it's actually correct — it's synchronous).
**Why it happens:** The rule says "all async tp.* calls must be awaited." `tp.date.now()` is the explicit exception.
**How to avoid:** CONVENTIONS.md explicitly states `tp.date.now()` is synchronous. The violation pattern is: `await` on a synchronous call (misleading) or no `await` on an async call (broken). Both directions are violations; only the direction differs.

### Pitfall 3: Missing the `Concept Note Template.md` critical finding
**What goes wrong:** The missing `requireNewFile: true` on bootstrap is easy to overlook because the template does work correctly — it's only dangerous when mis-applied to an existing file.
**How to avoid:** Check every creation template (those that call `await tp.file.move` or set `tR`) for the `requireNewFile: true` bootstrap option.

### Pitfall 4: Flagging Dataview query strings as config violations
**What goes wrong:** Seeing `type = "concept"` inside a Dataview query and flagging it as a hardcoded string.
**Why it happens:** Dataview queries are strings; the type value IS interpolated from config variables like `conceptType` in all templates. The strings inside template literals are not hardcoded if the surrounding JS correctly interpolates them.
**How to avoid:** Check whether the string is inside a template literal using a config-derived variable. If yes, it is correctly config-driven.

### Pitfall 5: Line number drift between pre-scan and live files
**What goes wrong:** The pre-scan line numbers in this document drift from the actual files if any edits occurred between research and implementation.
**How to avoid:** Always re-read the file to confirm the line number before writing the AUDIT.md violation entry. The violation descriptions above are more reliable than the exact line numbers.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `tp.date.now()` is synchronous (no await needed) | Templater-native violations | This is documented in CONVENTIONS.md and is the canonical Templater behavior. Risk: none — this is a verified project convention. |
| A2 | `templateBootstrap.js` `await getConfig()` is a spurious await on a sync call | AUDIT-02 findings | `universityConfig.js` exports `universityConfigScript`, a plain sync function. Reading the file confirms it returns `universityConfig` immediately. |
| A3 | `Concept Note Template.md` missing `requireNewFile: true` is a critical violation | AUDIT-02 findings | Based on CONVENTIONS.md and CONTEXT.md specification of the bootstrap pattern. If there is a deliberate reason this template runs on existing files, severity would be downgraded. |

---

## Open Questions

1. **`Subject Hub.md` `updated` frontmatter key**
   - What we know: Template generates `updated: "YYYY-MM-DD"` in frontmatter. This key is not in the CONVENTIONS.md required key order.
   - What's unclear: Is `updated` intentional (for a "last regenerated" timestamp) or an accidental addition?
   - Recommendation: Flag as a minor violation / expansion opportunity. The implementer should note it and let the user decide during fix phase.

2. **`General Note.md` custom Untitled guard vs. `requireNewFile` bootstrap**
   - What we know: The template uses its own basename check instead of `requireNewFile: true` in bootstrap, which gives a "Continue / Cancel" prompt on named files instead of a silent abort.
   - What's unclear: Whether this softer behavior (prompt rather than abort) is intentional — users may want to run General Note on an existing file to add frontmatter.
   - Recommendation: Flag as a minor zero-friction violation and explain both behaviors in the audit.

---

## Environment Availability

Step 2.6: SKIPPED — this phase is a pure reading/writing task with no external tool dependencies. The audit produces a markdown file from reading existing source files.

---

## Sources

### Primary (HIGH confidence)
- All 16 source files read directly in this session — findings are code-level observations
- `.planning/codebase/CONVENTIONS.md` — authoritative audit rulebook
- `.planning/phases/01-ethos-audit/01-CONTEXT.md` — locked decisions and known patterns
- `.planning/REQUIREMENTS.md` — AUDIT-01 through AUDIT-05 definitions

### Secondary (MEDIUM confidence)
- `.planning/codebase/ARCHITECTURE.md` — confirms `getUniversityContext.js` lazy-init behavior
- `CLAUDE.md` — confirms Templater async rules and frontmatter conventions

---

## Metadata

**Confidence breakdown:**
- Pre-scan findings: HIGH — all files read directly, violations are observable code patterns
- Line numbers: MEDIUM — correct at time of reading; should be re-verified during implementation
- Expansion opportunities: HIGH — gaps derived from observable absence in the codebase
- Severity assignments: MEDIUM — applied from CONVENTIONS.md rules + CONTEXT.md guidance; edge cases noted in Open Questions

**Research date:** 2026-05-14
**Valid until:** This research is tied to the codebase snapshot at time of reading. Any edits to source files before AUDIT.md is written require re-verification of affected line numbers.

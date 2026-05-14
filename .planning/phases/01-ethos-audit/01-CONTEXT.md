# Phase 1: Ethos Audit - Context

**Gathered:** 2026-05-14
**Status:** Ready for planning

<domain>
## Phase Boundary

Audit every file in `_templates/` (11 templates) and `_templater_scripts/` (5 scripts) against the three ethos principles — config-driven purity, Templater-native usage, and zero friction — then synthesize findings into a structured `AUDIT.md` at the project root. Expansion opportunities are surfaced as part of the report. No implementation of findings in this phase.

</domain>

<decisions>
## Implementation Decisions

### AUDIT.md Structure
- **D-01:** Primary organization is **dimension-first** — 3 main sections, one per ethos principle (config-driven purity, Templater-native, zero-friction). Easy to answer "how bad is our compliance on dimension X?" at a glance.
- **D-02:** Each violation entry includes **flag + inline fix suggestion**: file path + location (line/block), what's wrong, and the specific fix. Makes the report directly usable as a checklist for future implementation.
- **D-03:** `AUDIT.md` lives at the **project root** alongside `README.md` — immediately visible and easy to reference in commits.

### Expansion Opportunities Format
- **D-04:** Each expansion opportunity: **title + description** (name and 2–3 sentences explaining what's missing and why it fits the system's purpose). Lightweight — the audit surfaces gaps, not scopes them.
- **D-05:** Expansion opportunities are a **flat list** ordered by apparent impact/obviousness. No subcategories.
- **D-06:** **Surface anything** interesting, including gaps that touch out-of-scope areas (e.g., mobile, new template types). Annotate those with `(out of scope for this initiative)` so they're captured without being confused with immediately actionable items.
- **D-07:** Expansion opportunities are a **separate section** at the end of `AUDIT.md`, after all three violation-dimension sections. Clear separation between "what's broken" and "what's missing".

### Claude's Discretion
- Severity thresholds (critical vs. minor) were not discussed — Claude should apply common sense: violations that could cause silent runtime failures or data loss = critical; style/consistency violations = minor.
- Ordering of violations within each dimension section: by severity (critical first), then by file.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Ethos Principles & Convention Rules
- `.planning/codebase/CONVENTIONS.md` — Definitive reference for all three audit dimensions: Templater-native API table (what's forbidden and what to use instead), config-driven design rules, whitespace control patterns, frontmatter conventions. The researcher and planner should treat this as the audit rulebook.

### Files to Audit
- `_templates/Lecture Note.md` — Most complex creation template
- `_templates/Concept Note Template.md` — Standalone concept note creation
- `_templates/Quick Create Concept.md` — In-context concept creation
- `_templates/General Note.md` — Flexible general-purpose note
- `_templates/Subject Hub.md` — Per-course Dataview dashboard
- `_templates/Parcial Prep Note.md` — Exam-prep note
- `_templates/University Dashboard.md` — Vault-wide dashboard
- `_templates/Assign Tema to Current Note.md` — Utility template
- `_templates/Link Concepts to Note.md` — Utility template
- `_templates/Mark Reviewed.md` — Utility template
- `_templates/Update Note Status.md` — Utility template
- `_templater_scripts/universityConfig.js` — Config source of truth
- `_templater_scripts/scriptLoader.js` — Module loader
- `_templater_scripts/templateBootstrap.js` — Bootstrap helper
- `_templater_scripts/getUniversityContext.js` — Context inference
- `_templater_scripts/universityNoteUtils.js` — Core utilities

### Project Requirements
- `.planning/REQUIREMENTS.md` — AUDIT-01 through AUDIT-05 define exact audit dimensions and expected deliverable shape
- `.planning/ROADMAP.md` — Phase 1 success criteria define what "done" looks like

### Templater API Reference
- `.claude/skills/templater-docs/templater-api.md` — Authoritative Templater API reference; needed to judge Templater-native violations correctly

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `_templater_scripts/universityConfig.js`: The reference object for all valid config values — use it to verify that each string in templates/scripts is properly sourced from config at runtime.
- `_templater_scripts/universityNoteUtils.js`: Contains `constants` object that surfaces config values for templates — check whether templates use `constants.*` vs hardcoding.

### Established Patterns
- **Bootstrap pattern**: All creation templates call `await tp.user.templateBootstrap(tp, { requireNewFile: true })` and guard with `if (!ctx) return`. Utility templates do not set `tR`. These are known-correct patterns; deviations are violations.
- **Frontmatter key order**: Enforced as `type → course → year → tema → created → status → aliases`. Deviations in any template are minor violations.
- **Async rules**: `tp.date.now()` is synchronous (no await); all other `tp.*` calls that return Promises must be awaited. Missing await = critical violation (silent failure or undefined value).
- **Whitespace control**: `-%>` required after `if`/`}` blocks. Missing `-%>` causes blank lines in output (minor violation).

### Integration Points
- `AUDIT.md` will be referenced in Phase 2 (Documentation Overhaul) — the researcher for Phase 2 will read it to understand which gaps in the system the docs should address.

</code_context>

<specifics>
## Specific Ideas

No specific references — open to standard approaches within the structure decisions above.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 1-Ethos Audit*
*Context gathered: 2026-05-14*

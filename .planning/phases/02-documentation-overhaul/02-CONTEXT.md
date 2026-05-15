# Phase 2: Documentation Overhaul - Context

**Gathered:** 2026-05-15
**Status:** Ready for planning

<domain>
## Phase Boundary

Rewrite and expand `README.md` so a fellow student — comfortable with Obsidian plugins but unfamiliar with this vault's structure — can install, configure, and use the workflow without reading the source code. No new `docs/` folder; everything lives in a single `README.md`. No implementation of audit findings (audit produces a findings doc; implementation is a separate decision).

</domain>

<decisions>
## Implementation Decisions

### Document Structure
- **D-01:** Everything stays in a single `README.md` — no `docs/` sub-pages, no GitHub Wiki. One file = easiest to maintain, works offline in Obsidian, no cross-file sync burden.
- **D-02:** All content is visible top-to-bottom with anchor links for navigation. No `<details>` collapsible sections — a fellow student should be able to read straight through.
- **D-03:** Section order: TL;DR / intro → **Setup** → **Config Guide** → **Walkthrough** → **Template Reference** → Troubleshooting / FAQ. This matches the new-student journey: install first, then configure, then see it in action, then look things up.
- **D-04:** The current "Quick Start" section is **replaced** by a fuller step-by-step Setup Guide (DOCS-01). The terse 5-step list is gone; the new section covers install → Templater folder config → script reload → Dataview enable, exactly as DOCS-01 requires.

### Content Depth
- **D-05:** Template reference (DOCS-04) covers all 11 templates: what it creates, what prompts it shows, when to use it. The current README's per-template Usage subsections already have most of this — the rewrite organizes them as a reference, not just a usage narrative.
- **D-06:** Config guide (DOCS-02) includes a concrete before/after worked example. The scenario is open for Claude to choose — pick whichever single scenario best illustrates the most common customization (e.g., renaming labels for a different language, or adapting subjects/years).
- **D-07:** Workflow walkthrough (DOCS-03) shows a concrete end-to-end session: open Obsidian → create a Lecture Note → link concepts during review → run Parcial Prep for exam. Depth and format are left to Claude's discretion — a clear step-by-step sequence is sufficient; a full narrative with mock content is fine too.

### Audit Findings Treatment
- **D-08:** Audit findings are left to Claude's discretion. Success criterion #6 says "audit findings referenced where the audit surfaced notable issues" — apply judgment about what's worth flagging for a student reader. The two critical violations (Concept Note silently overwrites named files; Update Note Status missing "raw" status) are the most user-visible; minor violations are style/consistency issues that students wouldn't notice. Any references should be brief callouts, not a full "Known Issues" catalogue.

### Claude's Discretion
- Exact structure and wording of the worked config example (D-06) — choose the scenario that best demonstrates the most common customization.
- Whether to include a brief callout in the Concept Note Template section about the overwrite risk (D-08) — apply judgment based on student-reader impact.
- Depth and narrative style of the walkthrough (D-07) — step-list or richer scenario, whichever reads more clearly.
- Whether to preserve or rewrite sections already in the README that are already well-targeted at the student reader (Features at a glance, Why this exists, Extending the system, Conventions, FAQ, License).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements & Success Criteria
- `.planning/REQUIREMENTS.md` — DOCS-01 through DOCS-05 define the exact documentation deliverables; check these before writing each section.
- `.planning/ROADMAP.md` — Phase 2 success criteria (6 items) define "done"; the planner should verify each criterion is addressed before finishing.

### Audit Findings (for D-08)
- `AUDIT.md` — Phase 1 deliverable: 2 critical violations, 22 minor violations, 9 expansion opportunities. Read Section 1 (Config-Purity), Section 2 (Templater-Native), and Section 3 (Zero Friction) to identify which findings are user-visible enough to reference in docs.

### Existing Documentation (to rewrite/extend, not replace wholesale)
- `README.md` — Current README. Read in full before writing; many sections are already well-targeted (Conventions, FAQ, License, Features at a glance). The rewrite extends and reorganizes, not a blank-slate replacement.

### System Reference
- `_templater_scripts/universityConfig.js` — The config file that DOCS-02 teaches users to edit. Read it to ensure the worked example uses accurate key names and realistic values.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `README.md` (current): Sections to preserve largely intact: "Why this exists", "Features at a glance", "Repository Layout", "Extending the system", "Conventions", "Troubleshooting", "FAQ", "License". The "Usage" subsections (per-template) become the Template Reference section.
- `_templater_scripts/universityConfig.js`: The authoritative source for the config guide. All key names, default values, and the `features.parcial` flag shown in the config example must match this file exactly.

### Established Patterns
- **Target reader**: fellow student — Obsidian-comfortable, not a developer. Avoid jargon like "CommonJS modules", "factory functions", or "EROFS". Technical terms in the Templates section are fine when they name Obsidian UI elements (e.g., "command palette", "frontmatter").
- **Template count**: 11 templates total (9 in Usage section + Mark Reviewed + Update Note Status). All 11 must appear in the Template Reference.

### Integration Points
- `AUDIT.md` → docs: Brief callout opportunity for the two critical violations in the Template Reference (Concept Note section and Update Note Status section), if Claude's discretion determines a student-reader warning is warranted.

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

*Phase: 2-Documentation Overhaul*
*Context gathered: 2026-05-15*

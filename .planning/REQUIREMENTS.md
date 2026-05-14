# Requirements: Obsidian University Workflow — Audit & Docs

**Defined:** 2026-05-14
**Core Value:** Every part of the system should be discoverable — the code lives up to its own principles, and the docs make the workflow obvious to anyone who picks it up.

## v1 Requirements

### Audit

- [ ] **AUDIT-01**: Audit all templates and scripts for config-purity violations — hardcoded strings or values that belong in `universityConfig.js`
- [ ] **AUDIT-02**: Audit all templates and scripts for Templater-native violations — raw JS where a `tp.*` API exists, missing `await` on async Templater calls, `new Date()` instead of `tp.date.now()`
- [ ] **AUDIT-03**: Audit all templates for zero-friction violations — flows requiring more than 1–2 prompts without clear reason, confusing or ambiguous prompt text, or steps that could be automated
- [ ] **AUDIT-04**: Identify expansion opportunities — note types, workflows, or config capabilities the system is clearly missing relative to its stated purpose
- [ ] **AUDIT-05**: Synthesize findings into a structured audit report (`AUDIT.md`) with violations grouped by dimension, severity noted, and expansion opportunities listed as concrete proposals

### Documentation

- [ ] **DOCS-01**: Write step-by-step plugin setup section — exact steps to install Templater and Dataview, configure Templater's Template folder and Script folder to point at `_templates/` and `_templater_scripts/`, and enable Dataview
- [ ] **DOCS-02**: Write configuration guide — how to edit `universityConfig.js` to add subjects, years, folder paths, and toggle `features.parcial`; include a worked before/after example
- [ ] **DOCS-03**: Write workflow walkthrough — a concrete day-in-the-life example: open Obsidian → create a Lecture Note → link concepts during review → run Parcial Prep for exam; show what each step looks like
- [ ] **DOCS-04**: Write template reference — for each of the 11 templates: what it creates, what prompts it shows, and when to use it
- [ ] **DOCS-05**: Integrate all documentation improvements into `README.md` (and `docs/` if longer sections warrant it), structured for a fellow student as the target reader

## v2 Requirements

*(None — the scope of this initiative is the audit and docs only. Implementation of audit findings is a separate project.)*

## Out of Scope

| Feature | Reason |
|---------|--------|
| Implementing audit findings | Audit produces findings doc; implementation is a separate decision |
| Adding new templates | Surfacing gaps is in scope; building templates is not |
| Changing architecture | Bootstrap pattern, helper design, and config structure are preserved as-is |
| Mobile support | System is explicitly desktop-only (tp.user.* scripts unavailable on Obsidian mobile) |
| Automated testing of templates | tp.* APIs cannot run outside Obsidian; test scope stays as-is |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUDIT-01 | Phase 1: Ethos Audit | Pending |
| AUDIT-02 | Phase 1: Ethos Audit | Pending |
| AUDIT-03 | Phase 1: Ethos Audit | Pending |
| AUDIT-04 | Phase 1: Ethos Audit | Pending |
| AUDIT-05 | Phase 1: Ethos Audit | Pending |
| DOCS-01 | Phase 2: Documentation Overhaul | Pending |
| DOCS-02 | Phase 2: Documentation Overhaul | Pending |
| DOCS-03 | Phase 2: Documentation Overhaul | Pending |
| DOCS-04 | Phase 2: Documentation Overhaul | Pending |
| DOCS-05 | Phase 2: Documentation Overhaul | Pending |

**Coverage:**
- v1 requirements: 10 total
- Mapped to phases: 10
- Unmapped: 0 ✓

---
*Requirements defined: 2026-05-14*
*Last updated: 2026-05-14 after initial definition*

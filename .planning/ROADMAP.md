# Roadmap: Obsidian University Workflow — Audit & Docs

**Generated:** 2026-05-14
**Phases:** 2 | **Requirements:** 10 | **Coverage:** 100% ✓

---

### Phase 1: Ethos Audit
**Goal:** Systematically audit every template and script against all three ethos principles — config-driven purity, Templater-native usage, and zero friction — and surface concrete expansion opportunities. Delivers a structured `AUDIT.md` findings report.
**Mode:** mvp

**Requirements covered:** AUDIT-01, AUDIT-02, AUDIT-03, AUDIT-04, AUDIT-05

**Plans:** 2 plans

Plans:
- [x] 01-01-PLAN.md — Read all 16 source files and write AUDIT.md violation sections (Config-Purity, Templater-Native, Zero-Friction)
- [ ] 01-02-PLAN.md — Write Expansion Opportunities section and commit the complete AUDIT.md

**Success Criteria:**
1. Every file in `_templates/` and `_templater_scripts/` has been reviewed against all three ethos dimensions
2. `AUDIT.md` is written with violations grouped by dimension and severity (critical / minor)
3. Each violation has a specific location (file + line or block) and a concrete fix suggestion
4. Expansion opportunities are listed as distinct proposals with enough detail to evaluate later
5. Audit report is committed and reviewable

---

### Phase 2: Documentation Overhaul
**Goal:** Rewrite and expand `README.md` (with supporting `docs/` pages if needed) so a fellow student — comfortable with Obsidian plugins but unfamiliar with this system — can set up, configure, and use the workflow without needing to read the source code.
**Mode:** mvp

**Requirements covered:** DOCS-01, DOCS-02, DOCS-03, DOCS-04, DOCS-05

**Success Criteria:**
1. Plugin setup section exists with exact steps for Templater folder config and Dataview enable
2. Config guide covers editing `universityConfig.js` for custom subjects, years, and folder paths with a worked example
3. Workflow walkthrough shows a concrete end-to-end session (lecture note → concept linking → exam prep)
4. Template reference covers all 11 templates with purpose and when-to-use
5. README reads as a coherent guide for a new student — no prior knowledge of the internals required
6. All docs committed and audit findings referenced where the audit surfaced notable issues

---

## Requirement Traceability

| Requirement | Phase |
|-------------|-------|
| AUDIT-01: Config-purity violations | Phase 1 |
| AUDIT-02: Templater-native violations | Phase 1 |
| AUDIT-03: Zero-friction violations | Phase 1 |
| AUDIT-04: Expansion opportunities | Phase 1 |
| AUDIT-05: Audit report (AUDIT.md) | Phase 1 |
| DOCS-01: Plugin setup steps | Phase 2 |
| DOCS-02: Config customization guide | Phase 2 |
| DOCS-03: Workflow walkthrough | Phase 2 |
| DOCS-04: Template reference | Phase 2 |
| DOCS-05: README integration | Phase 2 |

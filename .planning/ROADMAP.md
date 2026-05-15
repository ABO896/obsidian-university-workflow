# Roadmap: Obsidian University Workflow — Audit & Docs

**Generated:** 2026-05-14
**Phases:** 2 | **Requirements:** 10 | **Coverage:** 100% ✓

---

### Phase 1: Ethos Audit
**Goal:** Systematically audit every template and script against all three ethos principles — config-driven purity, Templater-native usage, and zero friction — and surface concrete expansion opportunities. Delivers a structured `AUDIT.md` findings report.
**Mode:** mvp

**Requirements covered:** AUDIT-01, AUDIT-02, AUDIT-03, AUDIT-04, AUDIT-05

**Plans:** 3 plans

Plans:
- [x] 01-01-PLAN.md — Read all 16 source files and write AUDIT.md violation sections (Config-Purity, Templater-Native, Zero-Friction)
- [x] 01-02-PLAN.md — Write Expansion Opportunities section and commit the complete AUDIT.md
- [x] 01-03-PLAN.md — Gap closure: fix CR-01 (wrong variable `config` → `schema` in fix instructions) and CR-02 (missing Section 3 entry for General Note.md + footer count correction)

**Success Criteria:**
1. Every file in `_templates/` and `_templater_scripts/` has been reviewed against all three ethos dimensions
2. `AUDIT.md` is written with violations grouped by dimension and severity (critical / minor)
3. Each violation has a specific location (file + line or block) and a concrete fix suggestion
4. Expansion opportunities are listed as distinct proposals with enough detail to evaluate later
5. Audit report is committed and reviewable

---

### Phase 2: Documentation Overhaul
**Goal:** Rewrite and expand `README.md` so a fellow student — comfortable with Obsidian plugins but unfamiliar with this system — can set up, configure, and use the workflow without needing to read the source code. Everything lives in a single `README.md` (no `docs/` sub-pages, no `<details>` collapsibles), structured top-to-bottom: TL;DR → Setup → Config Guide → Walkthrough → Template Reference → Troubleshooting/FAQ.
**Mode:** mvp

**Requirements covered:** DOCS-01, DOCS-02, DOCS-03, DOCS-04, DOCS-05

**Plans:** 5 plans

Plans:
- [ ] 02-PLAN-01.md — Write Setup Guide fragment (DOCS-01): install Templater + Dataview, configure Template/Script folders, reload scripts, verify
- [ ] 02-PLAN-02.md — Write Configuration Guide fragment (DOCS-02): anatomy of `universityConfig.js`, key reference table, before/after worked example (English vocabulary + 3-year curriculum + semesters)
- [ ] 02-PLAN-03.md — Write Workflow Walkthrough fragment (DOCS-03): 4-stage Physics I scenario (lecture → quick concept → link concepts → parcial prep)
- [ ] 02-PLAN-04.md — Write Template Reference fragment (DOCS-04): all 11 templates uniformly documented with AUDIT callouts for Concept Note overwrite risk and Update Note Status `raw` gap
- [ ] 02-PLAN-05.md — Assemble README.md (DOCS-05): splice the four fragments in D-03 order, remove `<details>` blocks, drop legacy Quick Start / Configure & Customize / Usage, refresh ToC, add Mark Reviewed + University Dashboard to Repository Layout, add FAQ entry on `raw` status

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

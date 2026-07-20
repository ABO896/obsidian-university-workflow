# Roadmap: Obsidian University Workflow — Audit & Docs

## Milestones

- ✅ **v1.0 Audit & Docs** — Phases 1–2 (shipped 2026-05-15)
- 🚧 **v1.1 Ethos Implementation** — Phases 3–5 (in progress)

## Phases

<details>
<summary>✅ v1.0 Audit & Docs (Phases 1–2) — SHIPPED 2026-05-15</summary>

- [x] Phase 1: Ethos Audit (3/3 plans) — completed 2026-05-14
- [x] Phase 2: Documentation Overhaul (5/5 plans) — completed 2026-05-15

See full details: `.planning/milestones/v1.0-ROADMAP.md`

</details>

### 🚧 v1.1 Ethos Implementation (In Progress)

**Milestone Goal:** Make the codebase live up to its own audit — fix all critical and minor violations catalogued in AUDIT.md.

- [ ] **Phase 3: Critical Violations** - Fix data-unsafe template behavior before any other change lands
- [ ] **Phase 4: Templater-Native and Zero-Friction Fixes** - Correct API misuse and eliminate unnecessary year prompts
- [ ] **Phase 5: Config-Purity Sweep** - Remove all hardcoded literal fallbacks so every value flows from config at runtime

## Phase Details

### Phase 3: Critical Violations
**Goal**: Users are protected from data-unsafe template behavior — Concept Note never silently overwrites an existing note, and Update Note Status never hides notes with `status: raw`
**Depends on**: Phase 2
**Requirements**: CRIT-01, CRIT-02
**Success Criteria** (what must be TRUE):
  1. Running Concept Note Template against an existing named note aborts with a clear message instead of overwriting it
  2. Opening Update Note Status on a note with `status: raw` shows that note in the status list rather than making it invisible
  3. Both fixes are in place with no other template behavior changed
**Plans**: TBD

### Phase 4: Templater-Native and Zero-Friction Fixes
**Goal**: All templates use the Templater API correctly and never prompt for year when the year is already present in frontmatter
**Depends on**: Phase 3
**Requirements**: NAT-01, NAT-02, NAT-03, NAT-04, FRI-01, FRI-02, FRI-03, FRI-04
**Success Criteria** (what must be TRUE):
  1. Assign Tema to Current Note reads and writes vault files exclusively via `tp.app.*` — no bare `app.*` calls remain
  2. `templateBootstrap.js` calls `getConfig()` synchronously with no spurious `await`
  3. Quick Create Concept and General Note each have an explicit, documented stance on the `requireNewFile` guard (either enforced or intentionally omitted with a comment)
  4. All four affected templates (Assign Tema, Concept Note Template, Lecture Note, General Note) prompt for year only when the frontmatter year is absent
**Plans**: TBD

### Phase 5: Config-Purity Sweep
**Goal**: No template or script contains hardcoded string literals that belong in `universityConfig.js` — every value flows from config at runtime
**Depends on**: Phase 4
**Requirements**: CFG-01, CFG-02, CFG-03, CFG-04, CFG-05, CFG-06, CFG-07, CFG-08, CFG-09
**Success Criteria** (what must be TRUE):
  1. `universityNoteUtils.js` contains no hardcoded label or container fallback strings — all label constants and `PARCIAL_CONTAINER_NAME` derive from config with a validation throw on missing keys
  2. `universityConfig.js` exports `reviewIntervals` via the `constants` object and carries an annotation marking `schema.types` keys as template-depended-upon
  3. `Concept Note Template` and `Quick Create Concept` use `config.schema.reviewIntervals` directly with no inline fallback objects
  4. `University Dashboard` and `Subject Hub` contain no hardcoded literal fallbacks for `universityRoot` or `temaContainerName`
  5. CONVENTIONS.md documents the `updated` frontmatter key with its canonical purpose ("last regenerated date") and position in the required key order
**Plans**: TBD

## Progress

**Execution Order:** 3 → 4 → 5

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Ethos Audit | v1.0 | 3/3 | Complete | 2026-05-14 |
| 2. Documentation Overhaul | v1.0 | 5/5 | Complete | 2026-05-15 |
| 3. Critical Violations | v1.1 | 0/TBD | Not started | - |
| 4. Templater-Native and Zero-Friction Fixes | v1.1 | 0/TBD | Not started | - |
| 5. Config-Purity Sweep | v1.1 | 0/TBD | Not started | - |

# Requirements: Obsidian University Workflow — v1.1 Ethos Implementation

**Defined:** 2026-05-15
**Core Value:** Every part of the system should be discoverable — the code lives up to its own principles, and the docs make the workflow obvious to anyone who picks it up.

## v1.1 Requirements

Requirements for this milestone. Each maps to roadmap phases. Source: AUDIT.md findings.

### Critical Violations

- [ ] **CRIT-01**: `Concept Note Template.md` bootstrap call includes `{ requireNewFile: true }` so the template aborts instead of silently overwriting an existing named note (E-01)
- [ ] **CRIT-02**: `Update Note Status.md` fallback statuses array includes `"raw"` (via `schema?.statuses ?? ["raw", "draft", "reviewed", "complete"]`) so notes with `status: raw` are never invisible to the utility (E-02)

### Config-Driven Purity

- [ ] **CFG-01**: `universityNoteUtils.js` label constants (`SUBJECT_LABEL`, `YEAR_LABEL`, `TEMA_LABEL`, `PARCIAL_LABEL`) remove hardcoded string fallbacks — config keys always present after bootstrap
- [ ] **CFG-02**: `universityNoteUtils.js` `PARCIAL_CONTAINER_NAME` adds a validation throw matching the existing `temaContainer` guard, removing the `"Parciales"` literal fallback
- [ ] **CFG-03**: `University Dashboard.md` removes `?? "Universidad"` literal fallback for `universityRoot`
- [ ] **CFG-04**: `Subject Hub.md` `temaContainerName` four-link resolution chain replaced with single `constants.temaContainer` access
- [ ] **CFG-05**: `Concept Note Template.md` inline `reviewIntervals` fallback object removed — `config.schema.reviewIntervals` used directly
- [ ] **CFG-06**: `Quick Create Concept.md` inline `reviewIntervals` fallback object removed — `config.schema.reviewIntervals` used directly
- [ ] **CFG-07**: `universityConfig.js` exports `reviewIntervals` via the `constants` object so it is accessible in templates without inline duplication (E-04)
- [ ] **CFG-08**: `Subject Hub.md` `updated` frontmatter key documented in CONVENTIONS.md with canonical purpose ("last regenerated date") and position in the required key order (E-03)
- [ ] **CFG-09**: `universityConfig.js` annotated with a comment marking `schema.types` keys (`lecture`, `concept`, etc.) as template-depended-upon so they are never silently removed

### Templater-Native Usage

- [ ] **NAT-01**: `Assign Tema to Current Note.md` hook callback uses `tp.app.vault` and `tp.app.fileManager` instead of bare `app.*`
- [ ] **NAT-02**: `templateBootstrap.js` removes spurious `await` from synchronous `getConfig()` call
- [ ] **NAT-03**: `Quick Create Concept.md` bootstrap call adds `{ requireNewFile: true }` or receives an inline comment explicitly documenting why the guard is intentionally omitted for this template
- [ ] **NAT-04**: `General Note.md` documents (via template header comment) its intended scope; if creation-only, replaces the `basename.startsWith("untitled")` custom guard with `{ requireNewFile: true }`; if existing-file-friendly, the current prompt is preserved with an explanatory comment

### Zero Friction

- [ ] **FRI-01**: `Assign Tema to Current Note.md` `promptYearWhen` changed from `"always"` to `"missing"`
- [ ] **FRI-02**: `Concept Note Template.md` `promptYearWhen` changed from `"always"` to `"missing"`
- [ ] **FRI-03**: `Lecture Note.md` `promptYearWhen` changed from `"always"` to `"missing"`
- [ ] **FRI-04**: `General Note.md` `promptYearWhen` changed from `"always"` to `"missing"`

## Future Requirements

Deferred expansion opportunities from AUDIT.md not addressed in v1.1.

### Templates

- **TMPL-01**: New Subject template — create subject folder + hub note in a single action (E-05)
- **TMPL-02**: Study Session / daily-capture template completing the daily workflow loop (E-06)
- **TMPL-03**: Reset context cache utility template (calls `getUniversityContext.reset()`) without vault reload (E-07)

### Mobile

- **MOB-01**: Mobile feature flag in `universityConfig.js` + bootstrap-level guard surfacing a clear error on Obsidian mobile instead of silent failure (E-08)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Implementing E-05 through E-08 | Scoped for a future initiative; v1.1 is audit-fix only |
| Changing architecture (bootstrap pattern, helper design) | Preserve as-is per project constraints |
| New template types | Out of scope for this milestone |
| Mobile Obsidian support | Desktop-only system; full mobile support is a future initiative |
| E-09 redundant `?? 7` fallback | Will be automatically resolved by CFG-05/CFG-06; no separate requirement needed |

## Traceability

Populated by roadmapper.

| Requirement | Phase | Status |
|-------------|-------|--------|
| CRIT-01 | — | Pending |
| CRIT-02 | — | Pending |
| CFG-01 | — | Pending |
| CFG-02 | — | Pending |
| CFG-03 | — | Pending |
| CFG-04 | — | Pending |
| CFG-05 | — | Pending |
| CFG-06 | — | Pending |
| CFG-07 | — | Pending |
| CFG-08 | — | Pending |
| CFG-09 | — | Pending |
| NAT-01 | — | Pending |
| NAT-02 | — | Pending |
| NAT-03 | — | Pending |
| NAT-04 | — | Pending |
| FRI-01 | — | Pending |
| FRI-02 | — | Pending |
| FRI-03 | — | Pending |
| FRI-04 | — | Pending |

**Coverage:**
- v1.1 requirements: 19 total
- Mapped to phases: 0 (roadmapper pending)
- Unmapped: 19 ⚠️

---
*Requirements defined: 2026-05-15*
*Last updated: 2026-05-15 after initial definition*

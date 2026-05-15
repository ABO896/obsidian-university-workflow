# Project Retrospective

*A living document updated after each milestone. Lessons feed forward into future planning.*

---

## Milestone: v1.0 — Audit & Docs

**Shipped:** 2026-05-15
**Phases:** 2 | **Plans:** 8

### What Was Built
- `AUDIT.md` — full ethos audit of 16 source files: 2 critical violations, 19 minor violations, 9 expansion opportunities across config-purity, Templater-native, and zero-friction dimensions
- `README.md` — rewritten as a single student-facing guide (515 lines): Setup Guide, Configuration Guide, Workflow Walkthrough (4-stage Physics I scenario), Template Reference covering all 11 templates
- Gap closure on the audit report: corrected a critical fix instruction (config→schema?.statuses) and filled 5 missing Section 3 entries

### What Worked
- Fragment-assembly approach for Phase 2: writing each README section as an independent fragment, then assembling in plan 05, allowed parallel execution and clean separation of concerns
- Codebase map pre-built before the project initialized — this compressed Phase 1 significantly (no time lost re-reading source files)
- Code review after Phase 1 caught two concrete errors (CR-01, CR-02) before Phase 2 could reference stale findings — gap-closure plan (01-03) was cheap to add
- Yolo mode + coarse granularity: removed friction from per-plan confirmations and kept execution moving

### What Was Inefficient
- Phase 2 plan files were initially named with the wrong convention (`02-PLAN-XX` instead of `02-XX-PLAN`) — required a cleanup commit at the very end; a naming lint check at plan-creation time would catch this
- REQUIREMENTS.md and ROADMAP.md Phase 2 plan markers were never updated to `[x]` during execution — they were still `[ ]` at milestone close time, which created a confusing discrepancy between the working state and the tracking state

### Patterns Established
- **Audit-before-docs**: producing a structured findings document first gives the documentation pass a concrete source of callouts — AUDIT-critical violations surfaced directly in the Template Reference
- **Fragment assembly**: for multi-section document rewrites, write each section as an independent fragment and assemble at the end; easier to verify and parallelize
- **Gap-closure plan**: add a dedicated plan to fix code-review findings rather than re-opening a completed plan or skipping the fix

### Key Lessons
1. Keep ROADMAP.md plan markers (`[ ]` → `[x]`) in sync during execution — stale markers create confusion at milestone close
2. Pre-build the codebase map before initializing a new audit-type project; it pays for itself immediately in Phase 1
3. Fragment assembly is the right pattern for README-scale rewrites; resist writing the final document monolithically in one pass

### Cost Observations
- Sessions: multiple parallel executor worktrees (5 merge commits visible in git log)
- Notable: parallel worktree execution compressed Phase 2 significantly — all 5 plans landed in a short window

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Key Process Change |
|-----------|--------------------|
| v1.0 | Fragment-assembly approach established for large doc rewrites |

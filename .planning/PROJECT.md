# Obsidian University Workflow — Audit & Docs

## What This Is

A config-driven Obsidian Templater system for university note-taking. The project already exists and works; this initiative audits the codebase against its own ethos, surfaces gaps and expansion opportunities, and rewrites the README and setup documentation so a fellow student can get up and running without prior knowledge of the internals.

## Core Value

Every part of the system should be discoverable: the code should live up to its own principles, and the docs should make the workflow obvious to anyone who picks it up.

## Requirements

### Validated

- ✓ 11 templates covering lecture notes, concept notes, subject hubs, exam prep, and utilities — existing
- ✓ Config-driven folder/label/year management via `universityConfig.js` — existing
- ✓ Bootstrap layer (`templateBootstrap.js`) loading helpers consistently across all templates — existing
- ✓ Dataview dashboards for backlinks and subject summaries — existing
- ✓ Node.js test suite for pure helper functions (`universityNoteUtils.test.js`) — existing

### Validated

- ✓ Audit codebase against all three ethos principles: config-driven purity, Templater-native usage, zero friction — Validated in Phase 01: ethos-audit
- ✓ Produce a structured findings document with actionable gaps and expansion opportunities — Validated in Phase 01: ethos-audit (AUDIT.md: 2 critical, 22 minor, 9 expansion opportunities)

### Active
- [ ] Rewrite README for a fellow student as the target reader — comfortable with Obsidian plugins, unfamiliar with this vault structure
- [ ] Add clear setup steps: how to point Templater and Dataview at the correct folders
- [ ] Add a worked example showing the day-to-day workflow (create a lecture note → link concepts → review)
- [ ] Explain `universityConfig.js` customization so users can adapt subjects, years, and folders to their own vault

### Out of Scope

- Implementing audit findings — audit produces a findings doc; implementation is a separate project decision
- Mobile Obsidian support — system is explicitly desktop-only (tp.user.* scripts unavailable on mobile)
- Adding new template types — this project surfaces gaps; building new templates is a future initiative
- Changing the underlying architecture (bootstrap pattern, helper design, config structure) — preserve as-is

## Context

The codebase map (`/.planning/codebase/`) was already built before this project was initialized. Key architectural facts:
- Single source of truth: `_templater_scripts/universityConfig.js` — all folders, labels, years, and feature flags
- Bootstrap pattern: all templates call `await tp.user.templateBootstrap(tp)` to get a unified `ctx` object
- `features.parcial` flag controls exam-period grouping across all templates
- Tests cover pure JS helpers only; anything touching `app.*` or `tp.*` is excluded from unit tests

## Constraints

- **Architecture**: Must preserve the existing bootstrap pattern, config-driven design, and helper structure — no refactoring
- **Scope**: Audit only; do not implement findings in this initiative
- **Target reader for docs**: A fellow student — Obsidian-comfortable but not a developer

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Audit-first, implement separately | Surfacing gaps and deciding which to act on are separate decisions — avoids premature implementation | — Pending |
| Fellow student as README target reader | A developer can follow student-level docs; reverse is harder | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-05-15 — Phase 01 (ethos-audit) complete*

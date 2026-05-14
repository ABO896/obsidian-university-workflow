# Phase 1: Ethos Audit - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-14
**Phase:** 1-Ethos Audit
**Areas discussed:** AUDIT.md structure, Expansion opportunities format

---

## AUDIT.md Structure

| Option | Description | Selected |
|--------|-------------|----------|
| Dimension-first | 3 main sections, one per ethos principle. Easy to answer "how bad is compliance on dimension X?" | ✓ |
| Dimension + file cross-ref | Dimension-first + summary table mapping each file to violated principles | |
| File-first | One section per template/script, listing all violations found | |

**User's choice:** Dimension-first

---

| Option | Description | Selected |
|--------|-------------|----------|
| Flag + inline fix | File + location + what's wrong + the specific fix | ✓ |
| Flag only | File + location + what's wrong + severity. No fix suggestion | |

**User's choice:** Flag + inline fix

---

| Option | Description | Selected |
|--------|-------------|----------|
| Project root | Alongside README.md — immediately visible | ✓ |
| docs/ folder | Keeps root clean; requires creating docs/ | |
| .planning/ folder | Treated as planning artifact, not project artifact | |

**User's choice:** Project root

---

## Expansion Opportunities Format

| Option | Description | Selected |
|--------|-------------|----------|
| Title + description | Name + 2–3 sentences. Lightweight — surfaces gaps without scoping them | ✓ |
| Structured proposal | Name + description + rationale + rough scope + prerequisites | |
| One-liner | Just a label with no detail | |

**User's choice:** Title + description

---

| Option | Description | Selected |
|--------|-------------|----------|
| Flat list | All proposals in one list, ordered by impact/obviousness | ✓ |
| Grouped by category | e.g., "Missing note types", "Workflow automation gaps" | |

**User's choice:** Flat list

---

| Option | Description | Selected |
|--------|-------------|----------|
| Surface anything, annotate OOS | Flag all interesting gaps, annotate out-of-scope ones | ✓ |
| Only in-scope gaps | Only surface opportunities within current project boundaries | |

**User's choice:** Surface anything, annotate OOS

---

| Option | Description | Selected |
|--------|-------------|----------|
| Separate section | Dedicated "Expansion Opportunities" section at the end of AUDIT.md | ✓ |
| Integrated per-dimension | Each dimension section ends with a "Gaps / Opportunities" subsection | |

**User's choice:** Separate section

---

## Claude's Discretion

- **Severity thresholds** (critical vs. minor): not explicitly discussed. Claude to apply common sense — silent runtime failures = critical; style/consistency = minor.
- **Violation ordering within sections**: by severity (critical first), then by file.

## Deferred Ideas

None — discussion stayed within phase scope.

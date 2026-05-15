# Phase 2: Documentation Overhaul - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-15
**Phase:** 2-documentation-overhaul
**Areas discussed:** README vs. docs/ structure, README length handling, Setup section approach, Section order

---

## README vs. docs/ structure

| Option | Description | Selected |
|--------|-------------|----------|
| Single README.md only | Everything in one file — easiest to maintain, works offline in Obsidian, no separate system to keep in sync | ✓ |
| README + docs/ folder | README as overview, longer sections in docs/SETUP.md, docs/WALKTHROUGH.md etc. | |
| README + GitHub Wiki | README as teaser, detailed content in GitHub Wiki (separate git repo) | |

**User's choice:** Single README.md only
**Notes:** User initially raised GitHub Wiki as a possible option, then selected single README after seeing the tradeoffs.

---

## README length handling

| Option | Description | Selected |
|--------|-------------|----------|
| Visible content + anchor links | All content readable top-to-bottom with table of contents | ✓ |
| `<details>` collapsible sections | Longer parts fold into expandable sections | |
| Trim aggressively | Replace existing sections rather than adding; keep it shorter | |

**User's choice:** Keep everything visible, use anchor links for navigation
**Notes:** No hiding content behind collapsibles — fellow student should be able to read straight through.

---

## Setup section approach

| Option | Description | Selected |
|--------|-------------|----------|
| Replace Quick Start with fuller setup guide | One step-by-step section covering install → folder config → script reload → Dataview | ✓ |
| Keep Quick Start + add separate detailed Setup section | Two sections: terse quick-start for experienced users, detailed for new students | |
| You decide | Claude chooses what best serves the target reader | |

**User's choice:** Replace Quick Start with a fuller step-by-step setup guide

---

## Section order

| Option | Description | Selected |
|--------|-------------|----------|
| Setup → Config Guide → Walkthrough → Template Reference → Troubleshooting/FAQ | New-student journey order | ✓ |
| Walkthrough first, then Setup/Config | Marketing framing — lead with appeal | |
| Roughly current order, flesh out each section | Preserve existing structure | |

**User's choice:** Setup → Config Guide → Walkthrough → Template Reference → Troubleshooting/FAQ

---

## Claude's Discretion

- Audit findings treatment: apply judgment about what's worth flagging for a student reader; two critical violations are the most user-visible candidates
- Config guide worked example scenario: choose the scenario that best demonstrates the most common customization
- Walkthrough depth and narrative style: step-list or richer scenario, whichever reads more clearly
- Whether to preserve or rewrite sections already well-targeted at student readers

## Deferred Ideas

None — discussion stayed within phase scope.

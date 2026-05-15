---
phase: 01-ethos-audit
reviewed: 2026-05-15T00:00:00Z
depth: standard
files_reviewed: 2
files_reviewed_list:
  - .gitignore
  - AUDIT.md
findings:
  critical: 2
  warning: 3
  info: 2
  total: 7
status: issues_found
---

# Phase 01: Code Review Report

**Reviewed:** 2026-05-15
**Depth:** standard
**Files Reviewed:** 2
**Status:** issues_found

## Summary

Two files were reviewed: `.gitignore` (modified to allow `AUDIT.md` to be tracked) and `AUDIT.md` (the ethos audit report itself, covering 16 template and script files across three quality dimensions).

The `.gitignore` change is structurally correct. The `AUDIT.md` report is thorough and well-structured, but contains two critical defects: one proposed fix references a variable that does not exist in scope at the point of the fix, and one genuine violation is omitted despite being the same pattern flagged three times elsewhere in the same section. Three warning-level issues cover inconsistency in the fix narrative, a duplicate cross-reference section that is not disclosed as intentional, and a line-count discrepancy in the footer. Two info items cover minor structural observations.

---

## Critical Issues

### CR-01: Fix for Section 1 Critical references `config` which is not in scope

**File:** `AUDIT.md:13`
**Issue:** The proposed fix for `Update Note Status.md` line 26 reads:

> Fix: Replace the hardcoded fallback with `config?.schema?.statuses ?? ["raw", "draft", "reviewed", "complete"]`

`config` is not in scope at that point in the template. The template destructures `const { noteUtils, schema } = ctx;` at line 24 — `config` is not extracted. The correct variable to use is `schema`, which is already destructured and directly holds the config's schema object. Writing `config?.schema?.statuses` would throw a `ReferenceError` at runtime.

Additionally, the fallback literal `["raw", "draft", "reviewed", "complete"]` in the fix is itself still a hardcoded value — which is the root problem being fixed. The pattern already used elsewhere in the codebase (e.g., `Subject Hub.md` lines 137-141, `University Dashboard.md` lines 29-32) is:

```js
Array.isArray(schema?.statuses) && schema.statuses.length > 0
  ? schema.statuses
  : ["raw", "draft", "reviewed", "complete"]
```

The AUDIT fix should match this pattern and reference `schema` (not `config?.schema`), since `schema` is already in scope.

**Fix:** Correct the proposed fix to:
```js
// Replace line 26-28 in Update Note Status.md with:
const statuses =
  Array.isArray(schema?.statuses) && schema.statuses.length > 0
    ? schema.statuses
    : ["raw", "draft", "reviewed", "complete"];
```

---

### CR-02: `General Note.md` `promptYearWhen: "always"` omitted from Section 3 Zero Friction

**File:** `AUDIT.md:65-73` (Section 3 Zero Friction findings)
**Issue:** Section 3 flags `promptYearWhen: "always"` on three templates:

- `Assign Tema to Current Note.md` line 30
- `Concept Note Template.md` line 28
- `Lecture Note.md` line 30

`General Note.md` uses the same pattern at line 49 (`promptYearWhen: "always"` inside the `resolveSubjectParcialTema` call). The AUDIT covers `General Note.md` in Section 3 for its `basename` guard but does not mention the `promptYearWhen: "always"` at line 49, despite it being an identical deviation from the preferred `"missing"` pattern. The omission means a consumer applying the Section 3 findings will fix three templates but leave `General Note.md` with the same friction point.

**Fix:** Add a finding to Section 3:

> **`_templates/General Note.md` line 49:** `promptYearWhen: "always"` — same pattern as Lecture Note, Assign Tema, and Concept Note Template. Year is prompted even when context is unambiguous. Fix: Change to `promptYearWhen: "missing"`.

---

## Warnings

### WR-01: Section 4 "Expansion Opportunities" duplicates two critical findings without disclosure

**File:** `AUDIT.md:79-81` (items 1 and 2 in Section 4)
**Issue:** Expansion items 1 and 2 repeat verbatim the same violations already classified as Critical in Sections 1 and 2. The AUDIT states "This is also documented as a Critical violation in Section X" — but does not explain why the same finding appears twice, or that Section 4 is intentionally a reframing rather than additive coverage. A reader skimming Section 4 may treat it as a separate set of findings, or a reader applying fixes may count violations twice. The AUDIT should clarify that these are cross-references, not additional violations.

**Fix:** Add a note at the top of Section 4 such as:

> Items marked "(see Section X)" are restatements of violations already documented above, included here to surface their highest-impact interpretation. No additional files are affected.

---

### WR-02: Footer violation count does not match findings body

**File:** `AUDIT.md:98`
**Issue:** The footer states "2 critical violations | 19 minor violations". Counting the minor findings in the body:

- Section 1 Minor: 8 items
- Section 2 Minor: 5 items
- Section 3 Minor: 5 items

That sums to 18 minor violations in the body. The footer claims 19. The discrepancy is likely the `General Note.md` `promptYearWhen: "always"` omission identified in CR-02 — if that finding were present in Section 3, the count would be 19. However, as the report stands, the count is 18, not 19, making the footer internally inconsistent with the body.

**Fix:** Either add the missing `General Note.md` Section 3 finding (which would make the count accurate) or correct the footer count to 18.

---

### WR-03: Section 2 Minor finding for `templateBootstrap.js` mischaracterizes `await` on sync function as merely "misleading"

**File:** `AUDIT.md:51`
**Issue:** The AUDIT describes the spurious `await` on `getConfig()` as "harmless (wrapping a non-Promise in `await` is a no-op) but misleading". While technically correct that `await nonPromise` resolves immediately, the characterization undersells the issue. Any future maintainer who makes `getConfig` async (e.g., to support remote config loading) will see the `await` already present and assume the async path was already designed for — this creates a false sense that the async contract is established, when in fact there is no contract, just a stale artefact. The severity classification (Minor) is correct, but the impact description should mention this maintenance risk.

**Fix:** Expand the fix note to mention the maintenance-trap risk:

> Remove the `await`: `const config = typeof getConfig === "function" ? getConfig() : null;` — the spurious `await` implies an async contract that does not exist. If `getConfig` is later made async, the `await` will appear intentional and suppress investigation of whether the async path is handled correctly throughout.

---

## Info

### IN-01: `.gitignore` exception order places `AUDIT.md` after `.planning/` — no functional issue

**File:** `.gitignore:18`
**Issue:** The `!AUDIT.md` exception is placed at line 18, between `!CLAUDE.md` (line 17) and `!docs/` (line 19). Since the gitignore file ignores everything by default (`*` at line 2) and then adds exceptions, order within the exceptions block does not affect correctness — all exceptions apply regardless of their position relative to each other. This is a style observation only.

**Fix:** No action required. The exception is correct and functional.

---

### IN-02: Section 4 items 5-8 are annotated "(out of scope for this initiative)" but mix with actionable items without visual separation

**File:** `AUDIT.md:87-93` (items 5-8)
**Issue:** Items 5-8 are expansion opportunities explicitly marked out of scope. Items 1-4 are actionable fixes. The section presents all nine items in a flat numbered list, making it easy to miss which items are actionable versus deferred. A reader tasked with implementing expansion opportunities may include items 5-8 in scope.

**Fix:** Consider splitting Section 4 into two sub-sections: "Actionable (in scope)" (items 1-4) and "Deferred (out of scope)" (items 5-8), or use a visual separator (e.g., a horizontal rule) between item 4 and item 5 to make the boundary explicit.

---

_Reviewed: 2026-05-15_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_

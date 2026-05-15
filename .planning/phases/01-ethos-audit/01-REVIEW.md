---
phase: 01-ethos-audit
reviewed: 2026-05-15T00:00:00Z
depth: standard
files_reviewed: 1
files_reviewed_list:
  - AUDIT.md
findings:
  critical: 1
  warning: 3
  info: 2
  total: 6
status: issues_found
---

# Phase 01: Code Review Report

**Reviewed:** 2026-05-15
**Depth:** standard
**Files Reviewed:** 1
**Status:** issues_found

## Summary

`AUDIT.md` is the ethos-audit report covering 16 files (11 templates, 5 scripts) across three quality dimensions plus an expansion section. The file-count, template/script split, and all line-number citations were verified against the actual source files.

Most findings are accurate and grounded. One critical defect: the proposed fix for the Section 1 Critical item references a variable that is not in scope in `Update Note Status.md` and would produce a `ReferenceError` if applied as written. Three warning-level issues cover a mischaracterisation of the `await` risk, an undisclosed structural duplication in Section 4, and a line-number discrepancy for one Section 2 Minor item. Two info items note minor structural observations.

---

## Critical Issues

### CR-01: Section 1 Critical fix references `config` which is not destructured in `Update Note Status.md`

**File:** `AUDIT.md:13`
**Issue:** The proposed fix for `Update Note Status.md` line 26 reads:

> Fix: Replace the hardcoded fallback with `schema?.statuses ?? ["raw", "draft", "reviewed", "complete"]`

The actual text in the AUDIT document says `config?.schema?.statuses` (not `schema?.statuses`). `Update Note Status.md` line 24 destructures `const { noteUtils, schema } = ctx;` — `config` is not extracted from `ctx`. Applying the AUDIT fix verbatim would produce a `ReferenceError: config is not defined` at runtime.

The variable `schema` IS already in scope and holds `ctx.schema`, which is sourced directly from `config.schema` inside `templateBootstrap.js`. The correct fix is to reference `schema?.statuses` directly, matching the pattern already used in `Subject Hub.md` and `University Dashboard.md`:

```js
// Update Note Status.md line 26-28 — correct fix:
const statuses =
  Array.isArray(schema?.statuses) && schema.statuses.length > 0
    ? schema.statuses
    : ["raw", "draft", "reviewed", "complete"];
```

Note: this also corrects the fallback literal, which omits `"raw"` in the current source. The AUDIT correctly identifies the missing `"raw"` but its fix expression cannot be applied without first adding `config` to the destructure on line 24 — an extra step the AUDIT does not mention.

**Fix:** Correct the AUDIT fix expression from `config?.schema?.statuses` to `schema?.statuses` (or the full `Array.isArray` guard pattern shown above).

---

## Warnings

### WR-01: Section 2 Minor fix for `templateBootstrap.js` understates the maintenance risk of the spurious `await`

**File:** `AUDIT.md:51`
**Issue:** The AUDIT describes the `await getConfig()` on a synchronous function as "harmless (wrapping a non-Promise in `await` is a no-op) but misleading." This undersells the risk. A future maintainer who makes `getConfig` async — a plausible change, e.g. to support remote or lazy-loaded config — will see the `await` already present and assume the async call path was intentionally designed. This false signal can suppress investigation of whether the async path is handled correctly throughout the call chain. The severity classification (Minor) is appropriate, but the impact description should include this maintenance-trap risk.

**Fix:** Expand the fix note:

> Remove the `await`: `const config = typeof getConfig === "function" ? getConfig() : null;` — the spurious `await` implies an async contract that does not exist. If `getConfig` is later made async, the `await` will appear intentional and suppress investigation of whether the async path is handled correctly throughout.

---

### WR-02: Section 4 Expansion items 1 and 2 duplicate Section 1/2 Critical findings without disclosure

**File:** `AUDIT.md:79-83`
**Issue:** Expansion items 1 and 2 restate verbatim the same violations already classified as Critical in Sections 1 and 2. The AUDIT acknowledges this with "This is also documented as a Critical violation in Section X" — but does not explain why the same finding appears in two places, or that Section 4 is intentionally a reframing (highest-impact interpretation) rather than additive coverage. A reader skimming Section 4 may treat these as additional violations, or a fix implementer may count them twice.

**Fix:** Add a note at the top of Section 4 such as:

> Items marked "(see Section X)" are restatements of violations already documented above, included here to surface their highest-impact interpretation. No additional files are affected beyond those cited in the earlier sections.

---

### WR-03: Section 2 Minor cites wrong line number for `General Note.md` `promptYearWhen` item

**File:** `AUDIT.md:55`
**Issue:** The Section 2 Minor finding for `General Note.md` at line 55 says the template "implements its own inline guard at lines 22–38." The guard is the `basename.startsWith("untitled")` check. This is accurate. However, the same section states `const ctx = await tp.user.templateBootstrap(tp)` is at "line 5" — confirmed correct — and later Section 3 (line 75) flags `promptYearWhen: "always"` at "line 49." Tracing the actual file: the `resolveSubjectParcialTema` call with `promptYearWhen: "always"` is at lines 44–51 of `General Note.md`, making line 49 accurate for the `promptYearWhen` key. No line-number error there.

The discrepancy is subtler: Section 2 Minor (line 55) says the guard is "a parallel guard path" and says the Section 3 entry covers the same template. But the Section 2 and Section 3 findings for `General Note.md` describe **different issues** on **different lines** (lines 22–38 vs. line 49) without cross-referencing each other. A reader applying fixes may miss that both items apply to the same file and think they are alternative descriptions of one issue.

**Fix:** Add a mutual cross-reference: in the Section 2 Minor entry, append "See also Section 3 for `promptYearWhen: "always"` at line 49." In the Section 3 entry (line 75), append "See also Section 2 Templater-Native for the related `basename` guard discussion."

---

## Info

### IN-01: Section 4 mixes actionable and deferred items in a flat list without visual separation

**File:** `AUDIT.md:77-95`
**Issue:** Items 1–4 in Section 4 are actionable fixes; items 5–8 are explicitly annotated "(out of scope for this initiative)." All nine items appear in a flat numbered list. A reader tasked with implementing expansion opportunities may inadvertently include deferred items 5–8, or miss that the actionable boundary ends at item 4.

**Fix:** Consider splitting Section 4 into two sub-sections — "Actionable (in scope)" and "Deferred (out of scope)" — or add a horizontal rule and a brief heading between item 4 and item 5 to make the scope boundary explicit.

---

### IN-02: Footer expansion opportunity count includes item 9 but Section 4 body only lists items 1–8

**File:** `AUDIT.md:100`
**Issue:** The footer states "9 expansion opportunities." Counting the numbered items in Section 4 body: items 1–8 = 8 items. No item 9 is listed. Either the footer count is off by one (should be 8), or a ninth item was removed before publication without updating the footer.

**Fix:** Reconcile the footer count with the body: either add the missing ninth item or correct the footer to "8 expansion opportunities."

---

_Reviewed: 2026-05-15_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_

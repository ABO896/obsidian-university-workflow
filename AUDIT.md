# Ethos Audit

_Templates and scripts audited against three ethos principles: config-driven purity, Templater-native usage, and zero friction._

**Audited:** 2026-05-15 | **Files reviewed:** 16 (11 templates, 5 scripts)

---

## 1. Config-Driven Purity

### Critical

- **`_templates/Update Note Status.md` line 26:** The fallback statuses array `["draft", "reviewed", "complete"]` omits `"raw"`. The authoritative `universityConfig.js` defines `statuses: ["raw", "draft", "reviewed", "complete"]`. If `schema.statuses` is absent at runtime (e.g., config fails to load), notes with `status: "raw"` — the default for Quick Captures — become invisible to this batch-status utility. → **Fix:** Replace the hardcoded fallback with `config?.schema?.statuses ?? ["raw", "draft", "reviewed", "complete"]` so the canonical four-value list is used even when config is absent.

### Minor

- **`_templater_scripts/universityNoteUtils.js` line 47:** `const SUBJECT_LABEL = labels.subject ?? "Subject"` — the literal `"Subject"` duplicates the default value already defined in `universityConfig.js` (`labels.subject: "Subject"`). If the config key is ever renamed, this fallback silently diverges. → **Fix:** Remove the fallback or derive it from the config object before the factory call so no literal is needed.

- **`_templater_scripts/universityNoteUtils.js` line 48:** `const YEAR_LABEL = labels.year ?? "Year"` — same pattern as above. → **Fix:** Same as SUBJECT_LABEL: remove the literal fallback or assert the key is always present.

- **`_templater_scripts/universityNoteUtils.js` line 49:** `const TEMA_LABEL = labels.tema ?? "Tema"` — same pattern. → **Fix:** Remove the literal fallback.

- **`_templater_scripts/universityNoteUtils.js` line 50:** `const PARCIAL_LABEL = labels.parcial ?? "Parcial"` — same pattern. → **Fix:** Remove the literal fallback.

- **`_templater_scripts/universityNoteUtils.js` line 53:** `const PARCIAL_CONTAINER_NAME = fsConfig.parcialContainer ?? "Parciales"` — the fallback `"Parciales"` exactly mirrors `universityConfig.js` `fs.parcialContainer`. The factory already validates `fsConfig.temaContainer` (throws if absent) but not `fsConfig.parcialContainer`, so this fallback is the only runtime guard. → **Fix:** Either add a validation throw for `fsConfig.parcialContainer` (matching the existing pattern for `temaContainer`) and remove the literal, or document this as an intentional permissive default.

- **`_templates/University Dashboard.md` line 24:** `const universityRoot = constants?.universityRoot ?? "Universidad"` — the literal `"Universidad"` is the hardcoded vault root. If `universityConfig.js` is ever updated to rename the root folder, the dashboard silently uses the stale default. → **Fix:** Assert `constants.universityRoot` is always present (bootstrap already validates this via `noteUtils`), and remove the literal fallback.

- **`_templates/Subject Hub.md` lines 29–33:** The `temaContainerName` resolution chain uses four successive fallbacks before constructing a label via `${temaLabel}s` — a string that is not defined in `universityConfig.js`. The chain is: `constants?.temaContainer ?? fsConfig?.temaContainer ?? configFs?.temaContainer ?? (typeof temaLabel === "string" ? \`${temaLabel}s\` : temaLabel)`. The final construction `"Temas"` (derived from `temaLabel + "s"`) is not a config value. → **Fix:** Since `noteUtils` already exposes `constants.temaContainer` (sourced directly from config) and the factory throws if it is absent, replace the entire chain with `constants.temaContainer` and remove the defensive fallbacks.

- **`_templates/Lecture Note.md` lines 17–18:** `noteTypes.lecture ?? "lecture"` and `noteTypes.concept ?? "concept"` — the literal type identifiers duplicate the values already defined in `universityConfig.js` `schema.types`. All creation templates use this same pattern; if the schema key is ever removed from config, all fallbacks become silent divergences. → **Fix:** No immediate action required if `schema.types` is always present, but add a note in `universityConfig.js` that these keys are depended upon by templates as fallbacks.

- **`_templates/Concept Note Template.md` line 68:** `const reviewIntervals = config?.schema?.reviewIntervals ?? { easy: 14, medium: 7, hard: 3, blank: 1 }` — the inline fallback object duplicates `universityConfig.js` `schema.reviewIntervals`. If the config interval values change, this fallback remains stale. → **Fix:** Remove the literal fallback object; `config.schema.reviewIntervals` is always defined when bootstrap succeeds, so an unconditional access suffices. If a safety net is desired, use `config?.schema?.reviewIntervals` without a literal default.

- **`_templates/Quick Create Concept.md` line 110:** Same `reviewIntervals` hardcoded fallback as above — `{ easy: 14, medium: 7, hard: 3, blank: 1 }`. Second location of the same violation. → **Fix:** Same as Concept Note Template.md: remove the literal fallback object.

---

## 2. Templater-Native Usage

### Critical

- **`_templates/Concept Note Template.md` line 5:** `const ctx = await tp.user.templateBootstrap(tp)` — bootstrap is called without `{ requireNewFile: true }`. CONVENTIONS.md and CONTEXT.md both specify that creation templates (those that call `tp.file.move` and set `tR`) must include this guard. Without it, running `Concept Note Template` on an existing named note silently proceeds: the file is renamed, moved, and its content overwritten. The file move at line 82 (`await tp.file.move(destinationMovePath)`) and `tR = lines.join("\n")` at line 170 confirm this is a creation template. → **Fix:** Change line 5 to: `const ctx = await tp.user.templateBootstrap(tp, { requireNewFile: true });`

### Minor

- **`_templates/Assign Tema to Current Note.md` line 70:** `app.vault.getAbstractFileByPath(destinationFilePath)` — bare `app.vault` instead of `tp.app.vault` inside the `tp.hooks.on_all_templates_executed` callback. The `tp` reference from the template outer scope is available inside the callback, so `tp.app.vault` is the correct idiomatic form. → **Fix:** Replace `app.vault` with `tp.app.vault`.

- **`_templates/Assign Tema to Current Note.md` line 71:** `app.fileManager.processFrontMatter(...)` — bare `app.fileManager` instead of `tp.app.fileManager` inside the same hook callback. Works because `app` is an Obsidian global, but deviates from the CONVENTIONS.md rule that bare `app.*` in templates should be replaced with `tp.app.*`. → **Fix:** Replace `app.fileManager` with `tp.app.fileManager`.

- **`_templater_scripts/templateBootstrap.js` line 33:** `const config = typeof getConfig === "function" ? await getConfig() : null;` — spurious `await` on `getConfig()`. `universityConfig.js` exports a synchronous factory function (`function universityConfigScript() { return universityConfig; }`); the `await` is harmless (wrapping a non-Promise in `await` is a no-op) but misleading — it implies an async boundary that does not exist. → **Fix:** Remove the `await`: `const config = typeof getConfig === "function" ? getConfig() : null;`

- **`_templates/Quick Create Concept.md` line 21:** `const ctx = await tp.user.templateBootstrap(tp)` — bootstrap called without `{ requireNewFile: true }`. Severity is lower than `Concept Note Template.md` because this template does NOT move or overwrite the current file — it creates a new note via `tp.file.create_new` (line 196). Running on an existing named file will not overwrite it. The risk is that the utility runs on an unexpected file, but no data loss occurs. Still a deviation from the canonical creation-template pattern. → **Fix:** Add `{ requireNewFile: true }` to align with the pattern, or add a comment explaining why the guard is intentionally omitted.

- **`_templates/General Note.md` line 5:** `const ctx = await tp.user.templateBootstrap(tp)` — no `{ requireNewFile: true }`, but the template implements its own inline guard at lines 22–38: a `basename.startsWith("untitled")` check followed by a `tp.system.suggester` "Continue / Cancel" prompt. This is a parallel guard path rather than the canonical bootstrap guard, which silently aborts. The behavior difference is intentional: General Note is designed to run on existing files (the prompt allows it), while bootstrap's `requireNewFile` would hard-abort. If this softer behavior is deliberate, the deviation is acceptable; if not, using `{ requireNewFile: true }` is cleaner. → **Fix:** If General Note is not intended to run on existing files, replace lines 22–38 with `{ requireNewFile: true }` in the bootstrap call. If it is intended, add a comment in the template header documenting why the canonical guard is not used.

- **`_templates/Subject Hub.md` lines 83–98:** `const updated = timestamp;` followed by `updated: ${JSON.stringify(updated)}` in the frontmatter block — the `updated` key is generated in the template output but is not listed in CONVENTIONS.md's required frontmatter key order (`type → course → year → tema → created → status → aliases`). It also appears after `aliases` in the frontmatter, out of standard order. → **Fix:** Either add `updated` to CONVENTIONS.md as an intentional extension key (document its purpose as "last regenerated date") and standardize its position in the key order, or remove it from the template if it was added unintentionally.

---

## 3. Zero Friction

### Minor

- **`_templates/Assign Tema to Current Note.md` line 30:** `promptYearWhen: "always"` — year is prompted even when the current note already has a year in its frontmatter. For a utility that re-assigns `tema` to an existing note, the year is almost certainly not changing. The prompt forces an unnecessary confirmation step. → **Fix:** Change to `promptYearWhen: "missing"` so the prompt is skipped when year context is already available from the current note.

- **`_templates/Concept Note Template.md` line 28:** `promptYearWhen: "always"` — year is prompted even when running from a note inside a correctly-structured year folder where context can already be inferred. → **Fix:** Change to `promptYearWhen: "missing"` — the inferred year will be pre-selected when available, eliminating the prompt in the common case.

- **`_templates/General Note.md` lines 22–38:** The custom `basename.startsWith("untitled")` guard on named files presents a `tp.system.suggester` "Continue / Cancel" prompt, adding an extra interaction step when running on an existing file. If General Note is not intended for existing files, removing this guard in favor of `{ requireNewFile: true }` in bootstrap would produce a cleaner silent abort. If it is intended, the current prompt is clear but avoidable with `requireNewFile`. See also Section 2 Templater-Native entry. → **Fix:** Decision required: document intent. If General Note is creation-only, use `{ requireNewFile: true }`. If it is a frontmatter-adder for existing files, the prompt is acceptable but should be documented.

- **`_templates/Lecture Note.md` line 30:** `promptYearWhen: "always"` — year is prompted even inside a correctly-structured year folder. The inferred year appears as the first option, so the user taps through it, but the prompt itself is avoidable. → **Fix:** Change to `promptYearWhen: "missing"` to skip the prompt when context is unambiguous.

- **`_templates/Quick Create Concept.md` line 79:** `promptYearWhen: "missing"` is already set (correct), but year is still prompted when the current note lacks a year in frontmatter. This is expected behavior for `"missing"` — when year is truly absent, the prompt appears. Low impact; noted for completeness. → **Fix:** No immediate action required unless the intent is to inherit year from the path even when frontmatter is absent, in which case `promptYearWhen: "never"` would suppress all year prompts.

## 4. Expansion Opportunities

_Gaps where the system's stated purpose is not yet fully served. Ordered by apparent impact. Items marked (out of scope for this initiative) are captured for future consideration but not addressed in this audit cycle._

1. **Concept Note Template missing requireNewFile guard** — `Concept Note Template.md` calls `templateBootstrap` without `{ requireNewFile: true }`, leaving the template able to silently overwrite an existing named note. This is also documented as a Critical violation in Section 2 — the expansion framing is that a one-line fix closes an entire data-loss risk class for all future users of the template. → Add `{ requireNewFile: true }` to the bootstrap call on line 5.

2. **Update Note Status missing "raw" in fallback statuses** — The hardcoded fallback array `["draft", "reviewed", "complete"]` omits `"raw"`, making Quick Capture notes invisible to the batch-status utility when config fails to load. This is also documented as a Critical violation in Section 1 — the expansion framing is that fixing the fallback closes a silent-failure path that would affect every user who starts notes with `status: "raw"`. → Replace the literal array with `config?.schema?.statuses ?? ["raw", "draft", "reviewed", "complete"]`.

3. **Subject Hub non-standard "updated" frontmatter key** — `Subject Hub.md` generates an `updated: YYYY-MM-DD` key in frontmatter that does not appear in CONVENTIONS.md's required key order (`type → course → year → tema → created → status → aliases`). Every Subject Hub note created since the template's introduction carries a key that is either an undocumented extension or an unintentional addition. → Either add `updated` to CONVENTIONS.md with a documented purpose (e.g., "last regenerated date") and a standardized position, or remove it from the template.

4. **Shared reviewIntervals fallback constant** — `Concept Note Template.md` and `Quick Create Concept.md` each hardcode the same fallback object `{ easy: 14, medium: 7, hard: 3, blank: 1 }`. If the config interval values change, both fallbacks become stale independently. → Add `schema.reviewIntervals` as a validated key in the bootstrap layer, or have both templates fall back to a single shared constant defined in `universityConfig.js` and exposed via `constants`.

5. **No template for creating a new Subject (folder + hub in one step)** — Users must currently run `Subject Hub` template, select a non-existent subject name, and manually type the new folder label. A dedicated New Subject template could create the subject folder, generate the hub note, and open it in a single action — matching the zero-friction principle for the most common setup operation. (out of scope for this initiative)

6. **No Study Session or daily-capture template** — The system covers lecture notes, concept notes, and exam prep, but provides no lightweight "I studied today" journal entry that cross-links to concepts reviewed. `Mark Reviewed` handles the spaced-repetition side, but there is no narrative capture for a study session as a whole. A study session template would complete the daily workflow loop. (out of scope for this initiative)

7. **getUniversityContext.js lazy-init state persists for vault lifetime** — The module-level `_initialized` flag means config changes (such as adding a new academic year) require a full Obsidian vault reload to take effect. ARCHITECTURE.md documents this as a known constraint, but a "Reset context cache" utility template that calls a `reset()` export on `getUniversityContext.js` would allow mid-session config edits without a reload. (out of scope for this initiative)

8. **Mobile usage blockers not surfaced in templates** — `tp.user.*` scripts are unavailable on Obsidian mobile, causing all templates that call `tp.user.templateBootstrap` to fail silently. No template currently displays a user-facing notice when run on mobile. A `mobile` feature flag in `universityConfig.js` combined with a bootstrap-level guard could surface a clear error message instead of a confusing silent failure. (out of scope for this initiative)

9. **Redundant fallback on reviewIntervals.medium in date offset** — `Quick Create Concept.md` and `Concept Note Template.md` both use `tp.date.now("YYYY-MM-DD", reviewIntervals.medium ?? 7)`. The `?? 7` guard is redundant when `config.schema.reviewIntervals` is always present after a successful bootstrap. If expansion opportunity E-02 (shared constant) or E-04 (removing the literal fallback object) is implemented, this double-fallback can be cleaned up as part of the same change. Very low impact.

---
_Audit generated: 2026-05-15 | 16 files reviewed | 2 critical violations | 19 minor violations | 9 expansion opportunities_

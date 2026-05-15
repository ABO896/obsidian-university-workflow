# Codebase Concerns

**Analysis Date:** 2026-05-14

---

## Tech Debt

**Duplicate concept-note content generation (Quick Create vs Concept Note Template):**
- Issue: The full body-building logic for concept notes (both "concept" and "technique" styles) is copy-pasted verbatim into two templates. The only structural difference is that `Concept Note Template.md` uses `tp.file.cursor()` stops while `Quick Create Concept.md` cannot (tp.file.create_new does not support them).
- Files: `_templates/Concept Note Template.md` (lines 110–170), `_templates/Quick Create Concept.md` (lines 137–190)
- Impact: Any update to section headings, callout wording, or structural layout must be applied in two places. Drift has already occurred: the cursor stop placeholder (`> ${tp.file.cursor(1)}`) appears in Concept Note Template but Quick Create omits it and leaves the field blank instead. Future additions to the concept note structure (e.g., a new section) will almost certainly be applied to only one template.
- Fix approach: Extract a `buildConceptNoteLines(style, { fileName, codeLanguage, dataviewBlock, includeCursorStops })` helper into `universityNoteUtils.js` (similar to how `buildConceptBacklinksBlock` already lives there), then call it from both templates.

**`resolveSubjectAndParcial` is a deprecated alias kept silently:**
- Issue: `universityNoteUtils.js` (line 853) exports `resolveSubjectAndParcial` pointing at `resolvePlacement`. There is no deprecation warning, no documentation in the exported object, and the test file (`tests/universityNoteUtils.test.js` line 477) labels it "deprecated alias" without any mechanism to surface removal.
- Files: `_templater_scripts/universityNoteUtils.js` (line 853), `tests/universityNoteUtils.test.js` (line 476)
- Impact: Callers could use the old name and there is no signal that it will be removed.
- Fix approach: Add a thin wrapper that logs `console.warn("resolveSubjectAndParcial is deprecated; use resolvePlacement instead.")` before delegating, so Obsidian's DevTools console surfaces the usage.

**No package.json — no declarative way to run tests:**
- Issue: The test suite at `tests/universityNoteUtils.test.js` uses Node's built-in test runner (`node:test`) but there is no `package.json`, `Makefile`, or script to invoke it. The only way to run tests is to know the exact `node --test` incantation.
- Files: `tests/universityNoteUtils.test.js`
- Impact: New contributors (or Claude agents) cannot discover or run the test suite without reading the test file and knowing Node ≥ 18 test runner conventions.
- Fix approach: Add a minimal `package.json` at the repo root with `"scripts": { "test": "node --test tests/universityNoteUtils.test.js" }`.

---

## Known Bugs

**`targetFolder?.includes(subjectFolderName)` is a string substring check, not a path segment check:**
- Symptoms: When a subject folder name is a substring of another segment in the path (e.g., subject "Mat" inside a path containing "Mathematics"), the condition at `universityNoteUtils.js:628` evaluates `true` when it should be `false`, incorrectly skipping the re-append of the subject folder to `targetFolder`.
- Files: `_templater_scripts/universityNoteUtils.js` (line 628)
- Trigger: Run Parcial Prep Note with `features.parcial = true` and a subject whose name is a substring of any other path segment in the vault.
- Workaround: None; notes may land in an incorrect directory in that edge case.
- Fix approach: Replace `targetFolder?.includes(subjectFolderName)` with a proper path-segment check: `targetFolder?.split("/").includes(subjectFolderName)`.

**`getUniversityContext` module-level singleton is never reset:**
- Symptoms: If `universityConfig.js` is edited while Obsidian is running (changing `fs.universityRoot`, `labels.general`, or `features.parcial`), `getUniversityContext` continues to return stale context values for the remainder of the Obsidian session because `_initialized` is never set back to `false`.
- Files: `_templater_scripts/getUniversityContext.js` (lines 17–56)
- Trigger: Edit `universityConfig.js` and run any template without restarting Obsidian.
- Workaround: Restart Obsidian to flush the module cache.
- Fix approach: Either remove the module-level singleton and initialize per-call, or export a `resetForTesting()` function and document that a vault restart is required after config edits (this is likely acceptable given the target use case).

---

## Security Considerations

**None identified:**
- This is a local Obsidian vault with no network calls, no credentials, and no external service integrations. All data stays in the local filesystem.
- Risk: None specific to this codebase.

---

## Performance Bottlenecks

**Vault-wide `getMarkdownFiles()` scan in four separate locations:**
- Problem: Four code paths each call `app.vault.getMarkdownFiles()` (or `tp.app.vault.getMarkdownFiles()`) and iterate the full vault to build lists. In a large vault this is called at template invocation time, blocking the UI.
- Files:
  - `_templates/Lecture Note.md` (line 88) — filters for concept files by course
  - `_templates/Link Concepts to Note.md` (line 39) — same filter
  - `_templates/Update Note Status.md` (line 55) — scans all files with known types
  - `_templater_scripts/universityNoteUtils.js` (line 460) — `listSubjectYears` scans all files for year frontmatter
- Cause: Obsidian's `metadataCache` is used for filtering but the initial list fetch is still the full vault. No caching across calls. Each template invocation does its own full scan.
- Improvement path: Use `app.metadataCache.getCachedFiles()` as a lighter alternative, or scope the initial list to the university root using `app.vault.getAbstractFileByPath(universityRoot)` and walk its children. For `listSubjectYears` specifically, the folder-tree walk already done by `listImmediateFolderNames` could provide year data without a full vault scan.

**`listSubjectYears` in `universityNoteUtils.js` scans both frontmatter and path segments for every file:**
- Problem: The function at line 455 does two passes per file (frontmatter year + every path part) and is called inside `resolvePlacement` which is called on every template invocation.
- Files: `_templater_scripts/universityNoteUtils.js` (lines 455–486)
- Cause: No memoization; result is discarded after each call.
- Improvement path: Memoize per `subjectRootPath` within a single Templater execution context (e.g., store in a closure variable that lives for the duration of one `universityNoteUtils()` call).

---

## Fragile Areas

**`Assign Tema to Current Note.md` uses bare `app.` instead of `tp.app.`:**
- Files: `_templates/Assign Tema to Current Note.md` (lines 70–71)
- Why fragile: The CLAUDE.md project rules explicitly require `tp.app.*` rather than bare `app.*` in templates. The bare `app` global works in Obsidian because the global is injected into the Electron context, but it is inconsistent with the rest of the codebase and could break if Templater's sandboxing model ever changes. It also makes the template harder to reason about and test.
- Safe modification: Replace `app.vault.getAbstractFileByPath(...)` with `tp.app.vault.getAbstractFileByPath(...)` and `app.fileManager.processFrontMatter(...)` with `tp.app.fileManager.processFrontMatter(...)`. Both are already used in `Quick Create Concept.md` (line 203) and `Link Concepts to Note.md` (line 101) via `tp.app`.
- Test coverage: No test covers the `on_all_templates_executed` callback path because `tp` cannot be mocked in the Node.js test environment.

**`templateBootstrap.js` uses magic number `0` for `run_mode`:**
- Files: `_templater_scripts/templateBootstrap.js` (line 22)
- Why fragile: `tp.config.run_mode === 0` checks for "Create New Note" mode using an undocumented integer constant. If Templater changes its internal enum the guard silently breaks, allowing templates marked `requireNewFile: true` to run on existing files.
- Safe modification: Add a named constant `const RunMode = { CreateNewFromTemplate: 0, AppendActiveFile: 1, OverwriteFile: 2, DynamicProcessor: 3 }` (values from Templater source) and use `tp.config.run_mode === RunMode.CreateNewFromTemplate` to make the intent self-documenting.
- Test coverage: Not tested (requires live Templater runtime).

**Hardcoded locale-specific "untitled" strings:**
- Files: `_templater_scripts/templateBootstrap.js` (line 25), `_templates/General Note.md` (line 24)
- Why fragile: The new-file guard checks `basename.startsWith("untitled") || basename.startsWith("sin título")`. Only Spanish and English locales are handled. A user running Obsidian in French ("Sans titre"), German ("Unbenannt"), or any other locale will have new files rejected by the guard, causing those templates to abort instead of continuing.
- Safe modification: Read the default new-file name from `tp.config.target_file.basename` combined with the `run_mode` check already present (mode 0 is always a new file, so the basename check is only needed as a fallback for the `appendActiveFile` case).
- Test coverage: Not tested.

---

## Test Coverage Gaps

**All `tp.*` API calls are untested:**
- What's not tested: Every path that involves `tp.system.prompt`, `tp.system.suggester`, `tp.system.multi_suggester`, `tp.file.move`, `tp.file.create_new`, `tp.file.cursor_append`, `tp.hooks.on_all_templates_executed`, and `tp.app.*` vault/fileManager methods.
- Files: All `_templates/*.md`, `_templater_scripts/templateBootstrap.js`
- Risk: Core template workflows (note creation, file placement, frontmatter updates) have zero automated coverage. Regressions in any template body are only caught manually.
- Priority: High — this is the primary execution path of the entire system.

**`resolvePlacement` and `resolveSubjectParcialTema` are untested:**
- What's not tested: The main orchestration functions in `_templater_scripts/universityNoteUtils.js` (lines 488–757) that call `tp.system.suggester` and drive all placement decisions.
- Files: `_templater_scripts/universityNoteUtils.js`
- Risk: Placement logic changes (year prompt conditions, parcial container detection, tema fallback chains) cannot be validated without a live Obsidian instance.
- Priority: High — the most complex logic in the codebase is entirely outside the test suite.

**`getUniversityContext.js` has no direct tests:**
- What's not tested: Path-segment parsing, frontmatter year precedence, parcial inference, edge cases where the university root is not found in the path.
- Files: `_templater_scripts/getUniversityContext.js`
- Risk: The module is loaded and called at the top of every template via `templateBootstrap`. A regression in context inference degrades every template's pre-fill accuracy.
- Priority: Medium — the pure parsing logic could be extracted and tested in Node without a live `app` global.

**`ensureFolderPath` and `ensureUniqueFileName` have no tests:**
- What's not tested: Folder creation error handling (the catch/re-throw path in `ensureFolderPath`), the collision-counter loop in `ensureUniqueFileName`.
- Files: `_templater_scripts/universityNoteUtils.js` (lines 302–341)
- Risk: The collision counter loop (`suffix++`) has no upper bound and would loop forever if `app.vault.getAbstractFileByPath` always returned a truthy value due to a bug.
- Priority: Medium.

---

## Missing Critical Features

**No upper bound on `ensureUniqueFileName` suffix loop:**
- Problem: The `while` loop at `universityNoteUtils.js:336` increments `suffix` indefinitely until a free filename is found. There is no escape hatch (max iterations, timeout).
- Blocks: In a corrupted vault state where `getAbstractFileByPath` behaves unexpectedly, this could hang the Obsidian UI thread.
- Files: `_templater_scripts/universityNoteUtils.js` (lines 336–340)

**No config-change notification mechanism:**
- Problem: `getUniversityContext` caches config at first call. There is no Obsidian event listener on `universityConfig.js` to invalidate the cache when the file changes.
- Blocks: Users who edit config while Obsidian is open will not see the new config reflected until they restart Obsidian. This is undocumented.
- Files: `_templater_scripts/getUniversityContext.js`

---

*Concerns audit: 2026-05-14*

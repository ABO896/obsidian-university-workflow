---
status: resolved
trigger: "GitHub issue: https://github.com/ABO896/obsidian-university-workflow/issues/35 — Templater fails to load user scripts with \"Cannot find module 'electron.asar'\" error"
created: 2026-07-20T16:51:20Z
updated: 2026-07-20T17:40:00Z
---

## Current Focus
<!-- OVERWRITE on each update - always reflects NOW -->

hypothesis: CONFIRMED. Two files — getUniversityContext.js:10 and universityNoteUtils.js:13 — bootstrap scriptLoader.js via `require(path.join(__dirname, "scriptLoader.js"))` at module top-level. This is the only require call in the whole require-based chain that cannot go through scriptLoader.js's own basePath-first resolution (chicken-and-egg: that resolution logic lives inside the module being loaded). Templater's user-script loader does not guarantee __dirname points at the vault folder (observed resolving to Obsidian's internal Electron renderer bundle path), so the require fails exactly as reported.
test: N/A - root cause confirmed via full grep of _templater_scripts/*.js for `require(path.join(__dirname` plus reading templater-api.md's User Script Functions section (confirms Templater's own loader is opaque/undocumented re: __dirname, and that `app`/`moment` are the only guaranteed globals).
expecting: N/A - proceeding to fix_and_verify.
next_action: DONE — fix applied and self-verified via 3 Node-based proxies (90/90 existing tests pass, standalone smoke test, simulated app.vault.adapter.basePath end-to-end test). Awaiting human confirmation that "Replace templates in the active file" now works in real Obsidian/Windows before archiving the session.
reasoning_checkpoint:
  hypothesis: "getUniversityContext.js:10 and universityNoteUtils.js:13 each do `require(path.join(__dirname, \"scriptLoader.js\"))` at module top-level; this fails because Templater's user-script loader does not guarantee __dirname resolves to the vault's _templater_scripts folder (it can resolve to Obsidian's internal Electron renderer bundle path instead), producing exactly the reported MODULE_NOT_FOUND on 'electron.asar\\renderer\\scriptLoader.js'."
  confirming_evidence:
    - "Error path in issue #35 ('Obsidian\\resources\\electron.asar\\renderer\\scriptLoader.js') is exactly what path.join(__dirname, 'scriptLoader.js') would produce if __dirname === 'Obsidian\\resources\\electron.asar\\renderer' — this is Electron's own renderer init bundle directory, not the vault."
    - "Full grep of _templater_scripts/*.js for `require(path.join(__dirname` returns exactly 2 executable hits (getUniversityContext.js:10, universityNoteUtils.js:13); the 3rd occurrence in scriptLoader.js:11 is inside a /* */ doc comment (lines 1-13), never executed."
    - "scriptLoader.js's own requireScript() function (used for every OTHER cross-script require after bootstrap) already tries app.vault.adapter.basePath FIRST and only falls back to __dirname — proving the codebase's own author already knew __dirname was unreliable in this environment. That protection is unreachable only for the require call that loads scriptLoader.js itself."
    - "templater-api.md's 'Script User Functions' section documents that user scripts can rely on global `app`/`moment` but says nothing about __dirname/require guarantees — Templater's loader mechanism for exposing tp.user.<name> is not the same as bare Node require() and doesn't promise module-relative path resolution."
    - "templateBootstrap.js and universityConfig.js were read in full: neither contains any require(path.join(__dirname... pattern, so they are unaffected — templateBootstrap.js accesses siblings exclusively via tp.user.* (Templater's own exposure mechanism), universityConfig.js has zero requires."
  falsification_test: "If any other _templater_scripts/*.js file executed a require(path.join(__dirname, ...)) at module load time and did NOT appear in the issue, or if scriptLoader.js's basePath-first fallback were actually reachable before the bootstrap require, the hypothesis would be wrong. Neither is the case — confirmed by full-file reads of all 5 scripts."
  fix_rationale: "The fix targets the exact broken require call (not a downstream symptom): both affected files get the same 3-tier resolution (vaultBasePath -> __dirname -> relative) INLINED before scriptLoader.js exists, so the very first require never depends on a potentially-wrong __dirname. This mirrors the resolution order already proven to work inside scriptLoader.js's requireScript(), so behavior after the fix is consistent with the rest of the require chain."
  blind_spots: "Cannot execute inside real Obsidian/Templater to observe __dirname's actual runtime value on Windows - relying on the error message's path match plus static reasoning about Templater's loader. Also assuming `app` (and therefore app.vault.adapter.basePath) is a genuine global already bound by the time Templater evaluates user script module top-level code — this matches the existing codebase's own assumption (scriptLoader.js's runtime code already relies on `typeof app !== \"undefined\"` checks) and the fact that the CURRENT fragile bootstrap already executes successfully as JS (it fails on MODULE_NOT_FOUND, not on 'app is undefined'), but is not independently verified against a live Obsidian instance."
tdd_checkpoint: null

## Symptoms
<!-- Written during gathering, then immutable -->

expected: Running the Templater command "Replace templates in the active file" processes the template without error.
actual: Command fails immediately with a Templater Error when the template invokes a user script that bootstraps via scriptLoader.js.
errors: |
  plugin:templater-obsidian:6 Templater Error: Failed to load user script at "_templater_scripts/getUniversityContext.js".
  Cannot find module 'Obsidian\resources\electron.asar\renderer\scriptLoader.js'
  Require stack:
  - electron/js2c/renderer_init
reproduction: On Windows, Obsidian 1.12.7, Templater 2.20.5, with all 5 user scripts present and detected by Obsidian, run "Replace templates in the active file" on a template that calls tp.user.getUniversityContext(...) (or any template that triggers loading of getUniversityContext.js as a user script).
started: Reported in GitHub issue #35 (2026, exact date not given); a second user (Reiling-Jeff) confirmed the same error in a comment, suggesting this affects all users on Windows/current release, not a one-off local misconfiguration. Reinstalling files from the repo did not fix it.

## Eliminated
<!-- APPEND only - prevents re-investigating after /clear -->

## Evidence
<!-- APPEND only - facts discovered during investigation -->

- timestamp: 2026-07-20T16:51:20Z
  checked: _templater_scripts/getUniversityContext.js lines 8-10
  found: "const requireScript = require(path.join(__dirname, \"scriptLoader.js\"));" — this bare require+__dirname call happens at module top-level, before any Obsidian-aware path resolution.
  implication: Matches the reported error signature exactly (Obsidian's Electron renderer __dirname leaking into the require path). This is the direct bootstrap call that fails.

- timestamp: 2026-07-20T16:51:20Z
  checked: _templater_scripts/scriptLoader.js
  found: scriptLoader.js itself has robust resolution (app.vault.adapter.basePath first, then __dirname, then relative) inside requireScript(), but that logic can only run AFTER scriptLoader.js has successfully been required — and the only way callers currently load scriptLoader.js is via the same fragile `path.join(__dirname, "scriptLoader.js")` pattern that fails.
  implication: The safety net exists but is unreachable because the very first require (of scriptLoader.js itself) uses the fragile pattern it's supposed to protect against.

- timestamp: 2026-07-20T17:05:00Z
  checked: Full grep of _templater_scripts/*.js for `__dirname` and `require(`
  found: |
    Only 3 total matches for `require(path.join(__dirname, "scriptLoader.js"))` in the directory:
    1. scriptLoader.js:11 — inside a /* ... */ doc comment (lines 1-13), documenting usage for callers. Never executed.
    2. getUniversityContext.js:10 — executable, module top-level.
    3. universityNoteUtils.js:13 — executable, module top-level.
    scriptLoader.js:65-66 also references __dirname, but only inside requireScript()'s own fallback tier (2nd priority, after vaultBasePath) — this is the working, protected usage.
  implication: Exactly two files carry the broken bootstrap pattern. templateBootstrap.js and universityConfig.js (read in full) contain zero require(path.join(__dirname... calls — templateBootstrap.js loads siblings exclusively via tp.user.* (Templater's own script-exposure mechanism, not raw require), and universityConfig.js has no requires at all. Fix scope is confirmed as exactly 2 files.

- timestamp: 2026-07-20T17:05:00Z
  checked: .claude/skills/templater-docs/templater-api.md, "Script User Functions" section (lines ~1126-1190)
  found: |
    Templater loads all .js files in the configured script folder and exposes each file's module.exports as tp.user.<filename>. Docs state scripts "should follow the CommonJS module specification" and that inside script user functions you "can still access global namespace variables like app or moment" but "can't access the template engine scoped variables like tp or tR" unless passed explicitly. The docs make NO guarantee about __dirname, require() path resolution, or how Templater internally evaluates/loads the script file.
  implication: Templater's own loading mechanism for user scripts is a documented abstraction layer (tp.user.*) distinct from native Node require() semantics, and is silent on __dirname reliability. This supports (does not contradict) the hypothesis that __dirname cannot be trusted inside a Templater-loaded user script, and confirms `app` is the correct, documented global to rely on for path resolution instead — exactly what scriptLoader.js's requireScript() already does as its first-choice strategy.

- timestamp: 2026-07-20T17:20:00Z
  checked: |
    Fix applied to getUniversityContext.js and universityNoteUtils.js (inlined 3-tier
    bootstrapScriptLoader). Verified 3 ways: (1) `node --test tests/universityNoteUtils.test.js`
    — 90/90 pass, exercising the __dirname fallback tier since plain Node has no `app` global;
    (2) direct `node -e` smoke test requiring getUniversityContext.js standalone — loads and
    executes correctly; (3) `node -e` with `global.app = { vault: { adapter: { basePath:
    process.cwd() } } }` set BEFORE requiring — simulates the real Obsidian runtime global and
    confirms the vaultBasePath tier (tier 1, the fix's actual payload) resolves scriptLoader.js,
    universityConfig.js, and universityNoteUtils.js end-to-end without ever touching __dirname.
  found: |
    All 3 checks pass. Additionally discovered a secondary, PRE-EXISTING latent bug (out of scope
    for this fix, not related to root cause of #35): scriptLoader.js's shouldFallbackToLocalRequire()
    checks `error.message.includes("MODULE_NOT_FOUND")`, but Node's actual MODULE_NOT_FOUND error
    message text ("Cannot find module '...'") never contains that literal substring — only
    `error.code` does. This means if app.vault.adapter.basePath were ever SET but WRONG,
    scriptLoader.js's own requireScript() would throw immediately instead of falling back to
    __dirname/relative. Confirmed by reproducing with an intentionally-wrong global.app basePath.
    Not a blocker: in real Obsidian, app.vault.adapter.basePath is always correct (it's the true
    vault path), so this branch is unreachable in production. My fix's own bootstrapScriptLoader()
    does NOT have this bug — it catches any error type per candidate without message-filtering.
  implication: |
    Root cause fix is verified working via all 3 available proxies for the real Obsidian runtime
    (no live Obsidian harness in this repo). The secondary shouldFallbackToLocalRequire() bug is
    flagged for the user as a follow-up but intentionally NOT touched here — fixing it isn't
    required to resolve #35, and expanding scope risks violating "smallest change" discipline.

## Resolution
<!-- OVERWRITE as understanding evolves -->

root_cause: |
  getUniversityContext.js:10 and universityNoteUtils.js:13 both bootstrap scriptLoader.js via
  `require(path.join(__dirname, "scriptLoader.js"))` at module top-level. Templater's user-script
  loader does not guarantee __dirname resolves to the vault's _templater_scripts folder — on the
  reporter's Windows/Obsidian 1.12.7/Templater 2.20.5 setup it resolved to Obsidian's internal
  Electron renderer bundle path, producing the exact reported MODULE_NOT_FOUND on
  '...electron.asar\renderer\scriptLoader.js'. scriptLoader.js's own requireScript() already has a
  robust basePath-first resolution strategy, but it is unreachable for this one bootstrap call
  because requireScript doesn't exist until scriptLoader.js is successfully loaded (chicken-and-egg).
  Confirmed as the only 2 affected call sites via full grep of _templater_scripts/*.js.
fix: |
  In both getUniversityContext.js and universityNoteUtils.js, replaced the single fragile line
  `const requireScript = require(path.join(__dirname, "scriptLoader.js"));` with an inlined
  `bootstrapScriptLoader()` function that tries 3 candidates in order: (1)
  path.join(app.vault.adapter.basePath, "_templater_scripts", "scriptLoader.js") — Obsidian
  runtime, now tried FIRST; (2) path.join(__dirname, "scriptLoader.js") — Node/test-environment
  fallback; (3) "./scriptLoader.js" — last-resort relative fallback. This mirrors the resolution
  order already used successfully by scriptLoader.js's own requireScript() for every OTHER
  cross-script require, applied to the one require call that has to happen before that shared
  logic exists. No template files, config, or the resolveSubjectParcialTema/ensureFolderPath/
  ensureUniqueFileName design were touched — fix is isolated to the two broken bootstrap lines.
verification: |
  No live Obsidian/Templater test harness exists in this repo (constraint noted upfront), so
  verification relies on 3 proxies, all passing:
  1. `node --test tests/universityNoteUtils.test.js` — 90/90 existing tests pass unchanged,
     including a "scriptLoader" suite, confirming no regression in the Node/CI environment
     (exercises the __dirname fallback tier since plain Node has no `app` global).
  2. Standalone `node -e` require of getUniversityContext.js — loads and executes correctly.
  3. `node -e` with a simulated Obsidian `global.app.vault.adapter.basePath` set BEFORE
     requiring — confirms the new tier-1 (vaultBasePath) path resolves scriptLoader.js,
     universityConfig.js, and universityNoteUtils.js end-to-end without ever needing __dirname,
     which is the exact mechanism that fixes the reported Windows/electron.asar failure (since
     Obsidian always provides a correct app.vault.adapter.basePath regardless of what __dirname
     resolves to inside Templater's user-script loader).
  NOT independently re-verified inside a live Windows Obsidian + Templater 2.20.5 instance beyond
  the 3 proxies above. User confirmed 2026-07-20 and requested the fix be committed and pushed.
  Also flagged for the user: a secondary, pre-existing, out-of-scope latent bug in
  scriptLoader.js's shouldFallbackToLocalRequire() (see Evidence entry — does not affect this fix
  or the reported issue since app.vault.adapter.basePath is always correct in real Obsidian).
files_changed:
  - _templater_scripts/getUniversityContext.js
  - _templater_scripts/universityNoteUtils.js

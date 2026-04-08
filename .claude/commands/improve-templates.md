---
description: "Audit the entire Obsidian Templater project, improve all templates using the official Templater API docs, and propose new features. Runs a full project analysis then uses the templater-docs skill to rewrite templates idiomatically."
---

You are about to do a deep audit and improvement pass on this Obsidian Templater project. Follow every phase in order. Do not skip phases. Do not write any template code until Phase 2.

---

## Phase 1 — Understand the Project

Read and analyse the entire project thoroughly:

1. Read `CLAUDE.md` if it exists
2. Use Glob to find every file in the vault (`**/*.md`, `**/*.js`, `**/*.ts`)
3. Read every template file (look in folders named `Templates`, `templates`, `_templates` or similar)
4. Read every user script (`.js` files in the scripts folder configured in Templater settings)
5. Read the README or any docs files
6. Identify:
   - The **purpose and goal** of this vault/project
   - The **folder structure** and how it's organised
   - Every template and what it does
   - Every Templater user script and what it does
   - Any patterns, workflows, or conventions used across templates
   - Anything that looks broken, inconsistent, or overly complex

Summarise your findings before moving to Phase 2.

---

## Phase 2 — Read the Full Templater Documentation

Read `.claude/skills/templater-docs/templater-api.md` in full using the Read tool.

Do not skip sections. Pay attention to:
- Every module: `tp.date`, `tp.file`, `tp.frontmatter`, `tp.system`, `tp.web`, `tp.app`, `tp.config`, `tp.hooks`, `tp.obsidian`, `tp.user`
- All function signatures and optional arguments
- All command types: `<% %>`, `<%* %>`, `<%+ %>` and whitespace control `-%>` `<%-`
- User script patterns (CommonJS exports, passing `tp` as argument)
- The `tR` output variable and how to use it
- The `tp.hooks.on_all_templates_executed` pattern
- Dynamic commands and their known limitations

Do not proceed to Phase 3 until you have read the full PDF.

---

## Phase 3 — Audit All Templates

Go through every template one by one. For each template, check:

**Raw JS that should be Templater API:**
- Any `new Date()` → should be `tp.date.now()`
- Any `window.prompt()` or `prompt()` → should be `await tp.system.prompt()`
- Any `fetch()` or manual HTTP → should be `await tp.web.request()`
- Any manual frontmatter parsing → should be `tp.frontmatter.key`
- Any `app.*` calls → should use `tp.app.*`
- Any `moment()` calls that could be `tp.date.*`

**Missing Templater best practices:**
- Async functions called without `await`
- Missing whitespace control causing blank lines in output
- Hardcoded paths that should use `tp.file.folder()` or `tp.file.path()`
- Missing `tp.file.cursor()` placement after template insertion
- Frontmatter set manually that could use `tp.app.fileManager.processFrontMatter` via hook
- User scripts that receive no `tp` argument but need it

**Code quality:**
- Overly complex JS that Templater handles natively
- Duplicate logic across templates that could be extracted to a user script
- Inconsistent date formats across templates
- Missing error handling on async calls

List every issue found with the file name and line reference.

---

## Phase 4 — Implement Improvements

Fix every issue identified in Phase 3. For each file you change:

1. Show the before/after diff clearly
2. Explain specifically which Templater API you used and why it's better
3. Preserve all existing functionality — do not remove features, only improve implementation

Apply changes directly to the files.

---

## Phase 5 — Propose New Features

Based on your deep understanding of the project's goals AND the full Templater documentation, propose at least 5 new features or templates. 

For each proposal:
- **Name** — what to call it
- **Problem it solves** — what workflow pain it addresses for this specific project  
- **Templater APIs it uses** — cite the specific `tp.*` functions from the docs that make it possible
- **Sketch** — a rough template implementation showing the key Templater calls

Only propose things grounded in documented Templater capabilities. Do not propose features that require plugins not already in use.

---

## Phase 6 — Summary Report

Write a summary with:
- How many templates were audited
- How many files were changed and what the key improvements were
- The 5+ proposed features listed concisely
- Any follow-up recommendations (e.g. user scripts to extract, settings to configure)

---
name: templater-docs
description: Full Obsidian Templater plugin documentation reference. Use this skill whenever writing, reviewing, improving, or proposing features for any Obsidian Templater templates. Triggers on any tp.* syntax — tp.date, tp.file, tp.frontmatter, tp.system, tp.user, tp.hooks, tp.web, tp.app, tp.config, tp.obsidian. Always read Templater.pdf before writing Templater code. Do NOT write generic JavaScript when Templater has a native API. Use when auditing Obsidian projects, improving templates, or proposing new template features.
---

# Templater Plugin — Full Documentation

## CRITICAL: Read the full docs before writing any code

The complete, official Templater plugin documentation is bundled in this skill:

```
Templater.pdf
```

**Read it fully before writing or modifying any template.** Do not rely on training knowledge — the PDF is authoritative.

## Modules covered in the docs

| Module | Key APIs |
|--------|----------|
| `tp.date` | `now`, `tomorrow`, `yesterday`, `weekday` + Moment.js |
| `tp.file` | `title`, `content`, `folder`, `path`, `cursor`, `create_new`, `move`, `rename`, `include`, `find_tfile`, `exists`, `tags`, `selection`, `creation_date`, `last_modified_date`, `cursor_append` |
| `tp.frontmatter` | Any frontmatter key: `tp.frontmatter.key` or `tp.frontmatter["key with spaces"]` |
| `tp.system` | `prompt`, `suggester`, `multi_suggester`, `clipboard` |
| `tp.web` | `daily_quote`, `random_picture`, `request` |
| `tp.app` | Full Obsidian app instance — vault, fileManager, metadataCache, commands |
| `tp.config` | `active_file`, `run_mode`, `target_file`, `template_file` |
| `tp.hooks` | `on_all_templates_executed` |
| `tp.obsidian` | TFile, TFolder, `normalizePath`, `htmlToMarkdown`, `requestUrl` |
| `tp.user` | Custom JS scripts and system command functions |

## Command types — check the docs for full syntax

| Tag | Behaviour |
|-----|-----------|
| `<% %>` | Output the result |
| `<%* %>` | Execute JS — use `tR +=` to output |
| `<%+ %>` | Dynamic — preview mode only |
| `<% -%>` / `<%- %>` | Trim one newline after/before |
| `<% _%>` / `<%_ %>` | Trim all whitespace after/before |

## Why this matters

Never use raw JS when Templater has a native API. Examples of what NOT to do:

- `new Date().toISOString()` → use `tp.date.now("YYYY-MM-DD")`
- `window.prompt(...)` → use `await tp.system.prompt(...)`
- Manual frontmatter parsing → use `tp.frontmatter.key`
- `fetch(...)` → use `await tp.web.request(...)`
- `app.vault.getName()` → use `tp.file.folder()`

## Async functions — always await

`tp.file.create_new`, `tp.file.move`, `tp.file.rename`, `tp.file.exists`, `tp.file.include`,
`tp.system.prompt`, `tp.system.suggester`, `tp.system.multi_suggester`, `tp.system.clipboard`,
`tp.web.daily_quote`, `tp.web.random_picture`, `tp.web.request`

## Workflow

1. **Read `Templater.pdf`** — the full official docs
2. Identify the exact `tp.*` APIs for the task
3. Write idiomatic Templater code using native calls
4. Audit existing templates for raw JS that can be replaced
5. Propose features grounded in specific documented capabilities

# Codex Project Guidance (Obsidian University Workflow)

You are working inside my Obsidian vault. Be helpful, focused, and careful.

## Scope & Layout

- Repo root **is** the vault root. Respect `.gitignore`.
- Personal notes outside the areas below are **out of scope** unless I ask.

## What You May Edit (balanced)

- `_templates/**` — create/modify/refactor templates.
- `_templater_scripts/**` — create/modify/refactor Templater user scripts.
- Files **directly referenced by those** (e.g., shared helper MD/JSON under the same folders).
- `README.md`, `AGENTS.md` — update docs to explain new templates/scripts.

> You may create new files/folders **inside** `_templates/` and `_templater_scripts/` as needed (e.g., `_templates/daily/…`, `_templater_scripts/utils/…`).

## Knowledge Base

- If present, prefer `.codex_kb/*.md` for canonical rules (naming, frontmatter, date formats, workflows).
- Don’t read or reference personal notes outside `.codex_kb` unless I ask.

## Templater & Scripts

- Use Templater APIs (`tp.file`, `tp.date`, `tp.frontmatter`, `tp.user.*`).
- Keep scripts deterministic and local (no network, no secrets).
- File names: `kebab-case.js`; functions: `camelCase`.
- Add a short top comment for non-obvious scripts (purpose, inputs, outputs).

## Templates

- Put new templates under `_templates/…` with clear names.
- Include minimal frontmatter; never hard-code secrets.
- When a template depends on a script, add a top comment with its path.

## Quality & Safety

- Prefer small, targeted diffs; don’t churn unrelated files.
- If making broad changes, show a brief plan and example output.
- Validate basic Templater rendering (no runtime errors) before proposing.

## Allowed Improvements

- Refactor scripts into shared utilities.
- Extract duplicated template snippets.
- Rename/move **within** the allowed folders to improve organization (update references).

## Hard No’s

- Do not touch personal notes/journals or move files **outside** the allowed folders without my say-so.
- Do not change `.gitignore`, delete user content, or add networked code.
- Do not leak or assume secrets.

## Commit Message Style

- Group related changes; be specific.
- Example: `templates(daily): add review; scripts(date): add week helpers`

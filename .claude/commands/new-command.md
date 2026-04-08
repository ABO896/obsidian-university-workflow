---
description: "Create a new Claude Code slash command by name and description, using the Anthropic API to draft the full command content based on project context."
---

You are creating a new Claude Code slash command for this project. Follow every step below in order.

---

## Step 1 — Gather Inputs

If the user provided arguments, parse them as: `<command-name> <description>`.

If no arguments were provided (or they are incomplete), use the AskUserQuestion tool to ask for:

1. **Command name** — the slash command name (lowercase, kebab-case, no leading slash). Example: `review-config`
2. **Command description** — a one-sentence summary of what the command should do when invoked.

---

## Step 2 — Read Project Context

Read the following files to understand the project deeply:

1. `CLAUDE.md` — project rules, structure, and conventions
2. `.claude/skills/templater-docs/SKILL.md` — Templater docs skill reference
3. All existing commands in `.claude/commands/` — to understand tone, format, and conventions used by existing slash commands in this project

---

## Step 3 — Draft the Command Using the Anthropic API

Use the `claude-api` skill to call the Anthropic API (Claude) with a prompt that includes:

- The full contents of `CLAUDE.md` as project context
- The command name and description from Step 1
- A system prompt instructing the model to generate a well-structured Claude Code slash command in markdown format, following the conventions observed in existing commands (phased structure, clear instructions, grounded in project-specific files and patterns)

The API call should ask the model to produce the **complete markdown body** of the new command file, including:
- YAML frontmatter with a `description` field
- Phased or sectioned instructions that Claude will follow when the command is invoked
- References to specific project files, scripts, or conventions from `CLAUDE.md` where relevant
- Clear, actionable steps — not vague guidance

---

## Step 4 — Save the Command

Write the generated markdown to `.claude/commands/<command-name>.md` where `<command-name>` is the name from Step 1.

After writing, read the file back and display it to the user for review.

---

## Step 5 — Commit and Push

1. Stage only the new command file: `git add .claude/commands/<command-name>.md`
2. Commit with message: `feat: add /<command-name> slash command`
3. Push to the current branch with `git push -u origin <current-branch>`

Report the result to the user.

#!/usr/bin/env bash
# =============================================================================
# setup-templater-skill.sh
#
# Installs the templater-docs Agent Skill into your Obsidian project.
# Bundles the COMPLETE Templater PDF — no distilling, no trimming.
#
# Usage:
#   ./setup-templater-skill.sh /path/to/your/obsidian-project
#   ./setup-templater-skill.sh .   (run from inside your project)
# =============================================================================

set -e

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
BLUE='\033[0;34m'; BOLD='\033[1m'; RESET='\033[0m'

info()    { echo -e "${BLUE}ℹ${RESET}  $*"; }
success() { echo -e "${GREEN}✓${RESET}  $*"; }
warn()    { echo -e "${YELLOW}⚠${RESET}  $*"; }
error()   { echo -e "${RED}✗${RESET}  $*"; exit 1; }
header()  { echo -e "\n${BOLD}$*${RESET}"; }

PROJECT_DIR="${1:-.}"
PROJECT_DIR="$(cd "$PROJECT_DIR" && pwd)"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

header "Validating"
[[ -d "$PROJECT_DIR" ]] || error "Project directory not found: $PROJECT_DIR"
success "Project: $PROJECT_DIR"

# ── Create skill directory ────────────────────────────────────────────────────
header "Creating skill structure"
SKILL_DIR="$PROJECT_DIR/.claude/skills/templater-docs"
mkdir -p "$SKILL_DIR"
success "Created $SKILL_DIR"

# ── Copy SKILL.md ─────────────────────────────────────────────────────────────
SRC_SKILL="$SCRIPT_DIR/templater-docs/SKILL.md"
[[ -f "$SRC_SKILL" ]] || error "Could not find templater-docs/SKILL.md next to this script."
cp "$SRC_SKILL" "$SKILL_DIR/SKILL.md"
success "Copied SKILL.md"

# ── Copy the full Templater PDF ───────────────────────────────────────────────
SRC_PDF="$SCRIPT_DIR/templater-docs/Templater.pdf"
[[ -f "$SRC_PDF" ]] || error "Could not find templater-docs/Templater.pdf next to this script."
cp "$SRC_PDF" "$SKILL_DIR/Templater.pdf"
success "Copied Templater.pdf (full official docs)"

# ── Update or create CLAUDE.md ────────────────────────────────────────────────
header "Updating CLAUDE.md"
CLAUDE_MD="$PROJECT_DIR/CLAUDE.md"
SKILL_IMPORT="@.claude/skills/templater-docs/SKILL.md"

if [[ -f "$CLAUDE_MD" ]]; then
  if grep -qF "$SKILL_IMPORT" "$CLAUDE_MD"; then
    warn "CLAUDE.md already imports the templater-docs skill — skipping"
  else
    cat >> "$CLAUDE_MD" << MDEOF


## Templater Plugin
This project uses the Obsidian Templater plugin. Always consult the templater-docs skill
(reads Templater.pdf) before writing any template code. Never use raw JS when a tp.* API exists.

$SKILL_IMPORT
MDEOF
    success "Updated CLAUDE.md"
  fi
else
  cat > "$CLAUDE_MD" << MDEOF
# Project

This is an Obsidian vault / Templater project.

## Templater Plugin
This project uses the Obsidian Templater plugin. Always consult the templater-docs skill
(reads Templater.pdf) before writing any template code. Never use raw JS when a tp.* API exists.

$SKILL_IMPORT
MDEOF
  success "Created CLAUDE.md"
fi

# ── Summary ───────────────────────────────────────────────────────────────────
header "Done! Installed:"
echo ""
echo -e "  ${GREEN}$SKILL_DIR/${RESET}"
echo -e "  ${GREEN}├── SKILL.md${RESET}          ← skill definition (points Claude to the PDF)"
echo -e "  ${GREEN}└── Templater.pdf${RESET}      ← complete official Templater documentation"
echo ""
echo -e "  ${GREEN}$CLAUDE_MD${RESET}  ← imports the skill"
echo ""
echo -e "${BOLD}Paste this prompt into Claude Code:${RESET}"
echo ""
echo -e "  ${YELLOW}Read over the entire project in depth — understand its goal, purpose, and"
echo -e "  architecture. Then read the full Templater plugin documentation from the"
echo -e "  templater-docs skill (Templater.pdf) before touching any code."
echo -e "  Using that documentation as your reference (not generic JavaScript), audit all"
echo -e "  existing templates and improve them to use idiomatic Templater APIs. Then propose"
echo -e "  5+ new features grounded in specific Templater capabilities from the docs.${RESET}"
echo ""

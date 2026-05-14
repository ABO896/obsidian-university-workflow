/*
  templateBootstrap.js

  One-call setup for Templater user scripts. Handles guard checks, loads all
  shared utilities, and returns a ready-to-use context object. Returns null on
  any abort condition — the caller must do `if (!ctx) return;` after the call.

  Usage in templates:
    const ctx = await tp.user.templateBootstrap(tp, { requireNewFile: true });
    if (!ctx) return;
    const { currentFile, noteUtils, generalLabel, schema, constants, context } = ctx;
*/

async function templateBootstrap(tp, { requireNewFile = false } = {}) {
  const currentFile = tp.config.target_file;
  if (!currentFile) {
    new Notice("⛔️ Abort: Templater has no target file.", 10_000);
    return null;
  }

  if (requireNewFile) {
    const isCreatingNewFile = tp.config.run_mode === 0;
    if (!isCreatingNewFile) {
      const basename = (currentFile.basename ?? "").toLowerCase();
      if (!basename.startsWith("untitled") && !basename.startsWith("sin título")) {
        new Notice("⛔️ Abort: Template must be run in a new 'Untitled' note.", 10_000);
        return null;
      }
    }
  }

  const getConfig = tp.user.universityConfig;
  const config = typeof getConfig === "function" ? await getConfig() : null;
  const configLabels = config?.labels ?? {};

  let context, noteUtils;
  try {
    context = tp.user.getUniversityContext(currentFile);
    noteUtils = tp.user.universityNoteUtils();
  } catch (err) {
    new Notice(`⛔️ Abort: University note utilities are unavailable — ${err.message}`, 10_000);
    return null;
  }

  const { constants = {}, schema = {} } = noteUtils;
  const generalLabel = constants?.general ?? configLabels?.general;
  if (!generalLabel) {
    new Notice("⛔️ Abort: University general label is not configured.", 10_000);
    return null;
  }

  return {
    currentFile,
    noteUtils,
    generalLabel,
    schema,
    constants,
    context,
    config,
    configLabels,
  };
}

module.exports = templateBootstrap;

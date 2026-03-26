/*
  scriptLoader.js

  Shared bootstrapping helper that resolves and loads sibling scripts inside
  the _templater_scripts folder.  Both the Obsidian runtime (uses
  app.vault.adapter.basePath) and Node.js test environments (falls back to
  __dirname / relative require) are supported.

  Usage in other scripts:
    const path = require("path");
    const requireScript = require(path.join(__dirname, "scriptLoader.js"));
    const getUniversityConfig = requireScript("universityConfig.js");
*/

const path = require("path");

/**
 * Returns true when a failed require() should be retried with the next
 * candidate path rather than surfaced as an error.
 */
function shouldFallbackToLocalRequire(error, attemptedPath) {
  if (!error) {
    return false;
  }

  if (error.code && error.code !== "MODULE_NOT_FOUND") {
    return false;
  }

  const message = error.message ?? "";
  if (!message) {
    return true;
  }

  return message.includes("MODULE_NOT_FOUND") && message.includes(attemptedPath);
}

/**
 * Loads a script from _templater_scripts/<scriptFile>.
 *
 * Resolution order:
 *  1. Absolute path via app.vault.adapter.basePath (Obsidian runtime)
 *  2. path.join(__dirname, scriptFile)             (Node.js / Electron)
 *  3. ./<scriptFile>                               (last-resort relative)
 */
function requireScript(scriptFile) {
  const vaultBasePath =
    typeof app !== "undefined" ? app?.vault?.adapter?.basePath : undefined;
  const scriptRelativePath = path.join("_templater_scripts", scriptFile);

  if (vaultBasePath) {
    const absolutePath = path.join(vaultBasePath, scriptRelativePath);

    try {
      return require(absolutePath);
    } catch (error) {
      if (!shouldFallbackToLocalRequire(error, absolutePath)) {
        throw error;
      }
    }
  }

  const localTargets = [];

  if (typeof __dirname === "string" && __dirname) {
    localTargets.push(path.join(__dirname, scriptFile));
  }

  localTargets.push(`./${scriptFile}`);

  for (const target of localTargets) {
    try {
      return require(target);
    } catch (error) {
      if (!shouldFallbackToLocalRequire(error, target)) {
        throw error;
      }
    }
  }

  throw new Error(`Unable to load script: ${scriptFile}`);
}

module.exports = requireScript;

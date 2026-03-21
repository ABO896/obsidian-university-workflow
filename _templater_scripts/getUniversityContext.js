/*
  getUniversityContext.js

  Reusable Templater user script that infers academic context (subject & year)
  from the current file's location inside the vault.
*/

const path = require("path");

function requireScript(scriptFile) {
  const vaultBasePath = typeof app !== "undefined" ? app?.vault?.adapter?.basePath : undefined;
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

const getUniversityConfig = requireScript("universityConfig.js");
const createUniversityNoteUtils = requireScript("universityNoteUtils.js");

// Lazy-initialize shared state so the module is safe to require in test
// environments where `app` may not yet be defined.
let _initialized = false;
let _GENERAL_LABEL;
let _UNIVERSITY_ROOT;
let _normalizeParcial;
let _normalizeYear;

function init() {
  if (_initialized) return;

  const universityConfig = getUniversityConfig();
  const configLabels = universityConfig?.labels ?? {};
  const configFs = universityConfig?.fs ?? {};

  _GENERAL_LABEL =
    configLabels.general ??
    (Array.isArray(universityConfig?.parciales)
      ? universityConfig.parciales.find((value) => /general/i.test(value))
      : undefined);

  if (!_GENERAL_LABEL) {
    throw new Error("University config must define a general label.");
  }

  _UNIVERSITY_ROOT = configFs.universityRoot;

  if (!_UNIVERSITY_ROOT) {
    throw new Error("University config must define fs.universityRoot.");
  }

  const utils = createUniversityNoteUtils();
  _normalizeParcial = utils.normalizeParcial;
  _normalizeYear = utils.normalizeYear;

  _initialized = true;
}

function getUniversityContext(targetFile) {
  init();

  const GENERAL_LABEL = _GENERAL_LABEL;
  const UNIVERSITY_ROOT = _UNIVERSITY_ROOT;
  const normalizeParcial = _normalizeParcial;
  const normalizeYear = _normalizeYear;

  if (!targetFile) {
    return { subject: GENERAL_LABEL, year: null, parcial: GENERAL_LABEL };
  }

  const parentPath = targetFile.parent?.path ?? "";
  if (!parentPath) {
    return { subject: GENERAL_LABEL, year: null, parcial: GENERAL_LABEL };
  }

  const pathParts = parentPath.split("/").filter(Boolean);
  const universityRootLower = UNIVERSITY_ROOT.toLowerCase();
  const uniIndex = pathParts.findIndex((part = "") => part.toLowerCase() === universityRootLower);

  const relativeParts = uniIndex === -1 ? pathParts : pathParts.slice(uniIndex + 1);
  const frontmatterYear = app.metadataCache.getFileCache(targetFile)?.frontmatter?.year;
  const pathYearCandidate = relativeParts.find((part = "") => normalizeYear(part, { allowLiteral: false }));
  const year = normalizeYear(frontmatterYear) ?? normalizeYear(pathYearCandidate, { allowLiteral: false });

  const firstSegment = relativeParts[0] ?? "";
  const firstSegmentIsYear = !!normalizeYear(firstSegment, { allowLiteral: false });

  const subjectCandidate = firstSegmentIsYear ? relativeParts[1] : relativeParts[0];
  const subject = subjectCandidate || GENERAL_LABEL;

  const searchParts = firstSegmentIsYear ? relativeParts.slice(1) : relativeParts;
  const parcialCandidate = searchParts.find((part = "") => normalizeParcial(part) !== GENERAL_LABEL);
  const parcial = normalizeParcial(parcialCandidate);

  return { subject, year, parcial };
}

module.exports = getUniversityContext;

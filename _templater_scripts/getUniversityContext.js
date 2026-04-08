/*
  getUniversityContext.js

  Reusable Templater user script that infers academic context (subject & year)
  from the current file's location inside the vault.
*/

const path = require("path");
// Shared module loader — see scriptLoader.js for the resolution strategy.
const requireScript = require(path.join(__dirname, "scriptLoader.js"));

const getUniversityConfig = requireScript("universityConfig.js");
const createUniversityNoteUtils = requireScript("universityNoteUtils.js");

// Lazy-initialize shared state so the module is safe to require in test
// environments where `app` may not yet be defined.
let _initialized = false;
let _GENERAL_LABEL;
let _UNIVERSITY_ROOT;
let _IS_PARCIAL_ENABLED;
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

  // Mirror the features.parcial flag so context inference skips parcial path
  // scanning when the feature is disabled.
  _IS_PARCIAL_ENABLED = universityConfig?.features?.parcial === true;

  const utils = createUniversityNoteUtils();
  _normalizeParcial = utils.normalizeParcial;
  _normalizeYear = utils.normalizeYear;

  _initialized = true;
}

function getUniversityContext(targetFile) {
  init();

  const GENERAL_LABEL = _GENERAL_LABEL;
  const UNIVERSITY_ROOT = _UNIVERSITY_ROOT;
  const IS_PARCIAL_ENABLED = _IS_PARCIAL_ENABLED;
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

  // Only infer parcial from the file path when the feature is enabled;
  // otherwise always return the general label to keep context clean.
  const searchParts = firstSegmentIsYear ? relativeParts.slice(1) : relativeParts;
  const parcialCandidate = IS_PARCIAL_ENABLED
    ? searchParts.find((part = "") => normalizeParcial(part) !== GENERAL_LABEL)
    : undefined;
  const parcial = normalizeParcial(parcialCandidate);

  return { subject, year, parcial };
}

module.exports = getUniversityContext;

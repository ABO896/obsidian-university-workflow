/*
  getUniversityContext.js

  Reusable Templater user script that infers academic context (subject & parcial)
  from the current file's location inside the vault.
*/

const path = require("path");

function requireScript(scriptFile) {
  const vaultBasePath = app?.vault?.adapter?.basePath;
  if (!vaultBasePath) {
    throw new Error("Unable to resolve vault base path to load user scripts.");
  }

  return require(path.join(vaultBasePath, "_templater_scripts", scriptFile));
}

const getUniversityConfig = requireScript("universityConfig.js");
const createUniversityNoteUtils = requireScript("universityNoteUtils.js");

const universityConfig = getUniversityConfig();
const configLabels = universityConfig?.labels ?? {};
const configFs = universityConfig?.fs ?? {};

const GENERAL_LABEL =
  configLabels.general ??
  (Array.isArray(universityConfig?.parciales)
    ? universityConfig.parciales.find((value) => /general/i.test(value))
    : undefined);

if (!GENERAL_LABEL) {
  throw new Error("University config must define a general label.");
}

const UNIVERSITY_ROOT = configFs.universityRoot;

if (!UNIVERSITY_ROOT) {
  throw new Error("University config must define fs.universityRoot.");
}

const { normalizeParcial } = createUniversityNoteUtils();

function getUniversityContext(targetFile) {
  if (!targetFile) {
    return { subject: GENERAL_LABEL, parcial: GENERAL_LABEL };
  }

  const parentPath = targetFile.parent?.path ?? "";
  if (!parentPath) {
    return { subject: GENERAL_LABEL, parcial: GENERAL_LABEL };
  }

  const pathParts = parentPath.split("/").filter(Boolean);
  const universityRootLower = UNIVERSITY_ROOT.toLowerCase();
  const uniIndex = pathParts.findIndex((part = "") => part.toLowerCase() === universityRootLower);

  const subject =
    uniIndex !== -1 && pathParts[uniIndex + 1] ? pathParts[uniIndex + 1] : GENERAL_LABEL;

  const searchParts = uniIndex === -1 ? pathParts : pathParts.slice(uniIndex + 1);
  const parcialCandidate = searchParts.find((part = "") => normalizeParcial(part) !== GENERAL_LABEL);
  const parcial = normalizeParcial(parcialCandidate);

  return { subject, parcial };
}

module.exports = getUniversityContext;

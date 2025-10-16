/*
  getUniversityContext.js

  Reusable Templater user script that infers academic context (subject & parcial)
  from the current file's location inside the vault.
*/

function getUniversityContext(targetFile) {
  if (!targetFile) {
    return { subject: "General", parcial: "General" };
  }

  const parentPath = targetFile.parent?.path ?? "";
  if (!parentPath) {
    return { subject: "General", parcial: "General" };
  }

  const pathParts = parentPath.split("/").filter(Boolean);

  const uniIndex = pathParts.indexOf("Universidad");
  const subject =
    uniIndex !== -1 && pathParts[uniIndex + 1] ? pathParts[uniIndex + 1] : "General";

  const parcial =
    pathParts.find((part) => /^parcial/i.test(part?.toString())) ?? "General";

  return { subject, parcial };
}

module.exports = getUniversityContext;

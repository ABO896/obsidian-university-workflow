/*
  universityNoteUtils.js

  Shared helper utilities for Templater scripts that manage university note
  destinations. The helpers discover subjects/parcials dynamically based on the
  current vault structure and provide filesystem utilities for moving notes.
*/

function universityNoteUtils() {
  const DEFAULT_BASE_PATH = "Universidad";

  function pathJoin(...segments) {
    return segments
      .map((segment) => segment?.toString().trim())
      .filter((segment) => segment && segment !== "/")
      .join("/");
  }

  function getBaseUniversityPath(file) {
    const parentPath = file?.parent?.path ?? "";
    if (!parentPath) {
      return DEFAULT_BASE_PATH;
    }

    const pathParts = parentPath.split("/").filter(Boolean);
    const uniIndex = pathParts.indexOf(DEFAULT_BASE_PATH);

    if (uniIndex === -1) {
      return DEFAULT_BASE_PATH;
    }

    return pathJoin(...pathParts.slice(0, uniIndex + 1));
  }

  function isFolder(abstractFile) {
    return abstractFile && typeof abstractFile === "object" && Array.isArray(abstractFile.children);
  }

  function getFolder(path) {
    const folder = app.vault.getAbstractFileByPath(path);
    return isFolder(folder) ? folder : null;
  }

  function listImmediateFolderNames(path) {
    const folder = getFolder(path);
    if (!folder) {
      return [];
    }

    return folder.children
      .filter((child) => isFolder(child))
      .map((child) => child.name)
      .filter(Boolean);
  }

  function dedupePreserveOrder(values = []) {
    const seen = new Set();
    const result = [];

    for (const value of values) {
      if (!value) {
        continue;
      }

      const key = value.toLowerCase();
      if (seen.has(key)) {
        continue;
      }

      seen.add(key);
      result.push(value);
    }

    return result;
  }

  function sortCaseInsensitive(values = []) {
    return [...values].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
  }

  function listSubjects(basePath) {
    return sortCaseInsensitive(dedupePreserveOrder(listImmediateFolderNames(basePath)));
  }

  function reorderWithPreference(options = [], preferred = "General") {
    if (!preferred || preferred === "General") {
      return options;
    }

    const normalizedPreferred = preferred.toLowerCase();
    const index = options.findIndex((option) => option.toLowerCase() === normalizedPreferred);

    if (index === -1) {
      return [preferred, ...options];
    }

    return [options[index], ...options.filter((_, idx) => idx !== index)];
  }

  function buildSubjectOptions(basePath, preferredSubject, listSubjectsFn = listSubjects) {
    const discoveredSubjects = listSubjectsFn(basePath);
    const pool = dedupePreserveOrder([
      "General",
      ...(preferredSubject && preferredSubject !== "General" ? [preferredSubject] : []),
      ...discoveredSubjects,
    ]);

    return reorderWithPreference(pool, preferredSubject);
  }

  function findParcialesContainer(path) {
    const subjectFolder = getFolder(path);
    if (!subjectFolder) {
      return { container: null, containerName: null };
    }

    const parcialesFolder = subjectFolder.children?.find(
      (child) => isFolder(child) && /^parciales?$/i.test(child.name ?? "")
    );

    if (parcialesFolder) {
      return { container: parcialesFolder, containerName: parcialesFolder.name };
    }

    return { container: subjectFolder, containerName: null };
  }

  function getParcialContext(basePath, subject) {
    const subjectPath =
      subject && subject !== "General" ? pathJoin(basePath, subject) : basePath;

    let { container, containerName } = findParcialesContainer(subjectPath);
    let containerPath;

    if (container) {
      containerPath = container.path;
    } else if (subject && subject !== "General") {
      containerName = "Parciales";
      containerPath = pathJoin(subjectPath, containerName);
    } else {
      containerPath = subjectPath;
    }

    const existingParcials = listImmediateFolderNames(containerPath);

    return {
      containerPath,
      containerName,
      existingParcials: sortCaseInsensitive(dedupePreserveOrder(existingParcials)),
    };
  }

  async function ensureFolderPath(folderPath) {
    if (!folderPath) {
      return;
    }

    const segments = folderPath.split("/").filter(Boolean);
    let cumulative = "";

    for (const segment of segments) {
      cumulative = cumulative ? `${cumulative}/${segment}` : segment;

      if (!app.vault.getAbstractFileByPath(cumulative)) {
        try {
          await app.vault.createFolder(cumulative);
        } catch (error) {
          if (!app.vault.getAbstractFileByPath(cumulative)) {
            console.error(`Templater: Failed to create folder ${cumulative}`, error);
            new Notice(`⛔️ Could not create folder: ${cumulative}`, 10_000);
            throw error;
          }
        }
      }
    }
  }

  function ensureUniqueFileName(folderPath, baseName, extension = "md") {
    if (!folderPath) {
      return baseName;
    }

    const normalizedBase = baseName?.trim() || "Untitled";
    let candidate = normalizedBase;
    let suffix = 1;

    while (app.vault.getAbstractFileByPath(`${folderPath}/${candidate}.${extension}`)) {
      candidate = `${normalizedBase} (${suffix++})`;
    }

    return candidate;
  }

  function sanitizeFolderName(name) {
    return name?.toString().replace(/[\\/]/g, "-").trim() ?? "";
  }

  function sanitizeFileName(name) {
    return name?.toString().replace(/[\\/:*?"<>|]/g, "-").trim() ?? "";
  }

  async function resolveSubjectAndParcial(tp, {
    currentFile,
    contextSubject = "General",
    contextParcial = "General",
    parcialOptions: parcialOptionsInput,
    allowNewSubject = true,
  } = {}) {
    if (!tp) {
      throw new Error("Templater API (tp) is required to resolve placement.");
    }

    const parcialOptionsBase =
      parcialOptionsInput ?? ["General", "Parcial 1", "Parcial 2", "Parcial 3", "Final"];

    const baseUniversityPath = getBaseUniversityPath(currentFile);
    const subjectOptions = buildSubjectOptions(baseUniversityPath, contextSubject);
    const NEW_SUBJECT_SENTINEL = "__new_subject__";

    let subjectSelection = contextSubject ?? "General";

    if (allowNewSubject || subjectOptions.length > 0) {
      const displayOptions = allowNewSubject
        ? [...subjectOptions, "➕ Create new subject"]
        : subjectOptions;
      const valueOptions = allowNewSubject
        ? [...subjectOptions, NEW_SUBJECT_SENTINEL]
        : subjectOptions;

      subjectSelection =
        (await tp.system.suggester(displayOptions, valueOptions)) ?? contextSubject ?? "General";
    }

    let subject = subjectSelection;

    if (subjectSelection === NEW_SUBJECT_SENTINEL) {
      const newSubjectInput = await tp.system.prompt("Name for the new subject");
      subject = newSubjectInput?.trim() || contextSubject || "General";
    }

    const parcialOptions = reorderWithPreference(parcialOptionsBase, contextParcial);
    const parcial =
      (await tp.system.suggester(parcialOptions, parcialOptions)) ?? contextParcial ?? "General";

    const subjectFolderName = subject && subject !== "General" ? sanitizeFolderName(subject) : null;
    const parcialFolderName = parcial && parcial !== "General" ? sanitizeFolderName(parcial) : null;

    const { containerPath: parcialContainerPath } = getParcialContext(
      baseUniversityPath,
      subjectFolderName ?? undefined
    );

    let targetFolder = parcialContainerPath || baseUniversityPath;

    if (subjectFolderName && !(targetFolder?.includes(subjectFolderName))) {
      targetFolder = pathJoin(baseUniversityPath, subjectFolderName);
    }

    if (parcialFolderName) {
      targetFolder = pathJoin(targetFolder, parcialFolderName);
    }

    if (!targetFolder) {
      targetFolder = baseUniversityPath;
    }

    const subjectRootPath = subjectFolderName
      ? pathJoin(baseUniversityPath, subjectFolderName)
      : baseUniversityPath;

    return {
      baseUniversityPath,
      subject,
      subjectFolderName,
      subjectRootPath,
      parcial,
      parcialFolderName,
      parcialOptions,
      targetFolder,
    };
  }

  return {
    DEFAULT_BASE_PATH,
    pathJoin,
    getBaseUniversityPath,
    listSubjects,
    getParcialContext,
    ensureFolderPath,
    ensureUniqueFileName,
    dedupePreserveOrder,
    sortCaseInsensitive,
    sanitizeFolderName,
    sanitizeFileName,
    reorderWithPreference,
    reorderOptions: reorderWithPreference,
    buildSubjectOptions,
    resolveSubjectAndParcial,
  };
}

module.exports = universityNoteUtils;

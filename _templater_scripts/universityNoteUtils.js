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

  function getTemaContext(basePath, subjectFolderName, parcialFolderName) {
    const subjectPath = subjectFolderName ? pathJoin(basePath, subjectFolderName) : basePath;
    let temaContainerPath = subjectPath;

    if (parcialFolderName) {
      const { containerPath: parcialContainerPath } = getParcialContext(
        basePath,
        subjectFolderName ?? undefined
      );
      const parcialPath = parcialContainerPath || subjectPath;
      temaContainerPath = pathJoin(parcialPath, parcialFolderName);
    }

    const existingTemas = listImmediateFolderNames(temaContainerPath);

    return {
      containerPath: temaContainerPath,
      existingTemas: sortCaseInsensitive(dedupePreserveOrder(existingTemas)),
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

  function toSlug(value = "") {
    return value
      ?.toString()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\w\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .toLowerCase();
  }

  function normalizeParcial(parcial) {
    const value = parcial?.toString().trim();
    if (!value) {
      return "General";
    }

    const lowered = value.toLowerCase();

    if (lowered === "general") {
      return "General";
    }

    if (lowered === "final") {
      return "Final";
    }

    const parcialMatch = lowered.match(/parcial\s*(\d)/);
    if (parcialMatch) {
      const parcialNumber = parcialMatch[1];
      if (["1", "2", "3"].includes(parcialNumber)) {
        return `Parcial ${parcialNumber}`;
      }
    }

    return "General";
  }

  async function resolveSubjectAndParcial(
    tp,
    {
      currentFile,
      contextSubject = "General",
      contextParcial = "General",
      parcialOptions: parcialOptionsInput,
      allowNewSubject = true,
      includeParcial = true,
    } = {}
  ) {
    if (!tp) {
      throw new Error("Templater API (tp) is required to resolve placement.");
    }

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

    const subjectFolderName = subject && subject !== "General" ? sanitizeFolderName(subject) : null;
    const subjectRootPath = subjectFolderName
      ? pathJoin(baseUniversityPath, subjectFolderName)
      : baseUniversityPath;

    let parcialOptions = [];
    let parcial = includeParcial ? contextParcial ?? "General" : null;
    let parcialFolderName = null;
    let targetFolder = subjectRootPath;

    if (includeParcial) {
      const parcialOptionsBase =
        parcialOptionsInput ?? ["General", "Parcial 1", "Parcial 2", "Parcial 3", "Final"];

      parcialOptions = reorderWithPreference(parcialOptionsBase, contextParcial);
      parcial =
        (await tp.system.suggester(parcialOptions, parcialOptions)) ?? contextParcial ?? "General";

      parcialFolderName = parcial && parcial !== "General" ? sanitizeFolderName(parcial) : null;

      const { containerPath: parcialContainerPath } = getParcialContext(
        baseUniversityPath,
        subjectFolderName ?? undefined
      );

      targetFolder = parcialContainerPath || baseUniversityPath;

      if (subjectFolderName && !(targetFolder?.includes(subjectFolderName))) {
        targetFolder = pathJoin(baseUniversityPath, subjectFolderName);
      }

      if (parcialFolderName) {
        targetFolder = pathJoin(targetFolder, parcialFolderName);
      }

      if (!targetFolder) {
        targetFolder = baseUniversityPath;
      }
    }

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

  async function resolveSubjectParcialTema(
    tp,
    {
      includeParcial = true,
      includeTema = true,
      contextTema = "General",
      allowNewTema = true,
      ...rest
    } = {}
  ) {
    const placement = await resolveSubjectAndParcial(tp, {
      ...rest,
      includeParcial,
    });

    if (!includeTema) {
      return placement;
    }

    const {
      baseUniversityPath,
      subjectFolderName,
      parcialFolderName,
      targetFolder: baseTargetFolder,
      subjectRootPath,
    } = placement ?? {};

    const temaContext = getTemaContext(
      baseUniversityPath,
      subjectFolderName ?? undefined,
      includeParcial ? parcialFolderName ?? undefined : undefined
    );

    const temaContainerPath =
      temaContext?.containerPath ||
      baseTargetFolder ||
      subjectRootPath ||
      baseUniversityPath;

    const existingTemas = temaContext?.existingTemas ?? [];
    const NEW_TEMA_SENTINEL = "__new_tema__";
    const SKIP_TEMA_SENTINEL = "__skip_tema__";

    const baseTemaOptions = dedupePreserveOrder([
      "General",
      contextTema && contextTema !== "General" ? contextTema : null,
      ...existingTemas,
    ]).filter(Boolean);

    let temaSelection = contextTema ?? "General";

    if (allowNewTema || baseTemaOptions.length > 0) {
      const displayOptions = [...baseTemaOptions];
      const valueOptions = [...baseTemaOptions];

      if (allowNewTema) {
        displayOptions.push("➕ Create new tema");
        valueOptions.push(NEW_TEMA_SENTINEL);
      }

      displayOptions.push("🚫 Skip tema");
      valueOptions.push(SKIP_TEMA_SENTINEL);

      temaSelection =
        (await tp.system.suggester(displayOptions, valueOptions, "Select tema")) ??
        contextTema ??
        "General";
    }

    let tema = temaSelection;

    if (temaSelection === NEW_TEMA_SENTINEL) {
      const newTemaInput = await tp.system.prompt("Name for the new tema");
      tema = newTemaInput?.trim() || contextTema || "General";
    } else if (temaSelection === SKIP_TEMA_SENTINEL) {
      tema = "General";
    }

    if (!tema) {
      tema = "General";
    }

    const temaFolderName = tema && tema !== "General" ? sanitizeFolderName(tema) : null;
    const targetFolder = temaFolderName
      ? pathJoin(temaContainerPath, temaFolderName)
      : temaContainerPath;

    return {
      ...placement,
      tema,
      temaFolderName,
      temaContainerPath,
      temaOptions: existingTemas,
      targetFolder,
    };
  }

  return {
    DEFAULT_BASE_PATH,
    pathJoin,
    getBaseUniversityPath,
    listSubjects,
    getParcialContext,
    getTemaContext,
    ensureFolderPath,
    ensureUniqueFileName,
    dedupePreserveOrder,
    sortCaseInsensitive,
    sanitizeFolderName,
    sanitizeFileName,
    toSlug,
    normalizeParcial,
    reorderWithPreference,
    reorderOptions: reorderWithPreference,
    buildSubjectOptions,
    resolveSubjectAndParcial,
    resolveSubjectParcialTema,
  };
}

module.exports = universityNoteUtils;

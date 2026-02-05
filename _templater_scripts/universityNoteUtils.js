/*
  universityNoteUtils.js

  Shared helper utilities for Templater scripts that manage university note
  destinations. The helpers discover subjects/years dynamically based on the
  current vault structure and provide filesystem utilities for moving notes.
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

function universityNoteUtils() {
  const config = getUniversityConfig();
  if (!config || typeof config !== "object") {
    throw new Error("University config is required to use note utilities.");
  }

  const fsConfig = config.fs ?? {};
  const labels = config.labels ?? {};
  const years = Array.isArray(config.years) ? [...config.years] : [];
  const parciales = Array.isArray(config.parciales) ? [...config.parciales] : [];
  const schema = config.schema ?? {};

  if (!labels.general) {
    throw new Error("University config must define labels.general.");
  }

  if (!fsConfig.universityRoot) {
    throw new Error("University config must define fs.universityRoot.");
  }

  if (!fsConfig.temaContainer) {
    throw new Error("University config must define fs.temaContainer.");
  }

  const GENERAL_LABEL = labels.general;
  const FINAL_LABEL = labels.final ?? parciales.find((value) => /final/i.test(value)) ?? labels.general;
  const SUBJECT_LABEL = labels.subject ?? "Subject";
  const YEAR_LABEL = labels.year ?? "Year";
  const TEMA_LABEL = labels.tema ?? "Tema";
  const PARCIAL_LABEL = labels.parcial ?? "Parcial";

  const DEFAULT_BASE_PATH = fsConfig.universityRoot;
  const PARCIAL_CONTAINER_NAME = fsConfig.parcialContainer ?? "Parciales";
  const TEMA_CONTAINER_NAME = fsConfig.temaContainer;

  const canonicalParcialesMap = new Map();
  for (const entry of parciales) {
    if (!entry) {
      continue;
    }

    const lowered = entry.toString().toLowerCase();
    canonicalParcialesMap.set(lowered, entry);
  }

  const canonicalYearsMap = new Map();
  for (const entry of years) {
    if (!entry) {
      continue;
    }

    const lowered = entry.toString().toLowerCase();
    canonicalYearsMap.set(lowered, entry);
  }

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

  function reorderWithPreference(options = [], preferred = GENERAL_LABEL) {
    if (!preferred || preferred === GENERAL_LABEL) {
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
      GENERAL_LABEL,
      ...(preferredSubject && preferredSubject !== GENERAL_LABEL ? [preferredSubject] : []),
      ...discoveredSubjects,
    ]);

    return reorderWithPreference(pool, preferredSubject);
  }

  function findParcialesContainer(path) {
    const subjectFolder = getFolder(path);
    if (!subjectFolder) {
      return { container: null, containerName: null };
    }

    const desiredNameLower = (PARCIAL_CONTAINER_NAME ?? "").toLowerCase();
    const parcialesFolder = subjectFolder.children?.find((child) => {
      if (!isFolder(child)) {
        return false;
      }

      const childName = child.name ?? "";
      if (desiredNameLower && childName.toLowerCase() === desiredNameLower) {
        return true;
      }

      return /^parciales?$/i.test(childName);
    });

    if (parcialesFolder) {
      return { container: parcialesFolder, containerName: parcialesFolder.name };
    }

    return { container: subjectFolder, containerName: null };
  }

  function getParcialContext(basePath, subject) {
    const subjectPath =
      subject && subject !== GENERAL_LABEL ? pathJoin(basePath, subject) : basePath;

    let { container, containerName } = findParcialesContainer(subjectPath);
    let containerPath;

    if (container) {
      containerPath = container.path;
    } else if (subject && subject !== GENERAL_LABEL) {
      containerName = PARCIAL_CONTAINER_NAME;
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

    const resolveTemaContainer = (basePathForTemas) => {
      if (!TEMA_CONTAINER_NAME) {
        return basePathForTemas;
      }

      const desiredPath = pathJoin(basePathForTemas, TEMA_CONTAINER_NAME);
      return getFolder(desiredPath) ? desiredPath : basePathForTemas;
    };

    let temaContainerPath = resolveTemaContainer(subjectPath);

    if (parcialFolderName) {
      const { containerPath: parcialContainerPath } = getParcialContext(
        basePath,
        subjectFolderName ?? undefined
      );
      const parcialPath = parcialContainerPath || subjectPath;
      const parcialFolderPath = pathJoin(parcialPath, parcialFolderName);
      temaContainerPath = resolveTemaContainer(parcialFolderPath);
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
    const stringValue = value == null ? "" : String(value);

    return stringValue
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
      return GENERAL_LABEL;
    }

    const lowered = value.toLowerCase();

    if (canonicalParcialesMap.has(lowered)) {
      return canonicalParcialesMap.get(lowered) ?? GENERAL_LABEL;
    }

    if (lowered === FINAL_LABEL.toLowerCase()) {
      return canonicalParcialesMap.get(FINAL_LABEL.toLowerCase()) ?? FINAL_LABEL;
    }

    const parcialMatch = lowered.match(/parcial[\s_-]*(\d+)/);
    if (parcialMatch) {
      const normalizedKey = `parcial ${parcialMatch[1]}`.toLowerCase();
      if (canonicalParcialesMap.has(normalizedKey)) {
        return canonicalParcialesMap.get(normalizedKey) ?? GENERAL_LABEL;
      }
    }

    if (lowered === GENERAL_LABEL.toLowerCase()) {
      return GENERAL_LABEL;
    }

    return GENERAL_LABEL;
  }

  function parseYearCandidate(value) {
    const trimmed = value?.toString().trim();
    if (!trimmed) {
      return null;
    }

    const lowered = trimmed.toLowerCase();

    if (canonicalYearsMap.has(lowered)) {
      return canonicalYearsMap.get(lowered) ?? null;
    }

    const patterns = [
      /(?:year|yr|ano|y)[\s_-]*(\d{1,2})/i,
      /(\d{1,2})(?:st|nd|rd|th)?[\s_-]*(?:year|yr|ano)/i,
    ];

    for (const pattern of patterns) {
      const match = lowered.match(pattern);
      const number = match?.[1];
      if (!number) {
        continue;
      }

      const canonicalKey = `year ${Number.parseInt(number, 10)}`.toLowerCase();
      if (canonicalYearsMap.has(canonicalKey)) {
        return canonicalYearsMap.get(canonicalKey) ?? null;
      }

      return `Year ${Number.parseInt(number, 10)}`;
    }

    return null;
  }

  function normalizeYear(year, { allowLiteral = true } = {}) {
    const parsed = parseYearCandidate(year);
    if (parsed) {
      return parsed;
    }

    const trimmed = year?.toString().trim();
    if (!trimmed) {
      return null;
    }

    if (!allowLiteral || trimmed.toLowerCase() === GENERAL_LABEL.toLowerCase()) {
      return null;
    }

    return trimmed;
  }

  function listSubjectYears(subjectRootPath) {
    if (!subjectRootPath) {
      return [];
    }

    const files = app.vault.getMarkdownFiles?.() ?? [];
    const prefix = `${subjectRootPath}/`;
    const yearValues = [];

    for (const file of files) {
      const filePath = file?.path ?? "";
      if (!filePath || (filePath !== subjectRootPath && !filePath.startsWith(prefix))) {
        continue;
      }

      const cache = app.metadataCache.getFileCache(file);
      const frontmatterYear = normalizeYear(cache?.frontmatter?.year);
      if (frontmatterYear) {
        yearValues.push(frontmatterYear);
      }

      const pathParts = filePath.split("/").filter(Boolean);
      for (const part of pathParts) {
        const pathYear = parseYearCandidate(part);
        if (pathYear) {
          yearValues.push(pathYear);
        }
      }
    }

    return sortCaseInsensitive(dedupePreserveOrder(yearValues));
  }

  async function resolveSubjectAndParcial(
    tp,
    {
      currentFile,
      contextSubject = GENERAL_LABEL,
      contextParcial = GENERAL_LABEL,
      contextYear = null,
      parcialOptions: parcialOptionsInput,
      yearOptions: yearOptionsInput,
      allowNewSubject = true,
      includeParcial = false,
      includeYear = true,
      promptYearWhen = "missing",
    } = {}
  ) {
    if (!tp) {
      throw new Error("Templater API (tp) is required to resolve placement.");
    }

    const baseUniversityPath = getBaseUniversityPath(currentFile);
    const normalizedContextSubject = contextSubject ?? GENERAL_LABEL;
    const subjectOptions = buildSubjectOptions(baseUniversityPath, normalizedContextSubject);
    const NEW_SUBJECT_SENTINEL = "__new_subject__";
    const subjectLabelLower =
      typeof SUBJECT_LABEL === "string" ? SUBJECT_LABEL.toLowerCase() : "subject";

    let subjectSelection = normalizedContextSubject;

    if (allowNewSubject || subjectOptions.length > 0) {
      const displayOptions = allowNewSubject
        ? [...subjectOptions, `➕ Create new ${subjectLabelLower}`]
        : subjectOptions;
      const valueOptions = allowNewSubject
        ? [...subjectOptions, NEW_SUBJECT_SENTINEL]
        : subjectOptions;

      subjectSelection =
        (await tp.system.suggester(displayOptions, valueOptions)) ?? normalizedContextSubject;
    }

    let subject = subjectSelection;

    if (subjectSelection === NEW_SUBJECT_SENTINEL) {
      const newSubjectInput = await tp.system.prompt(`Name for the new ${SUBJECT_LABEL}`);
      subject = newSubjectInput?.trim() || normalizedContextSubject;
    }

    const subjectFolderName =
      subject && subject !== GENERAL_LABEL ? sanitizeFolderName(subject) : null;
    const subjectRootPath = subjectFolderName
      ? pathJoin(baseUniversityPath, subjectFolderName)
      : baseUniversityPath;

    let yearOptions = [];
    let year = includeYear ? normalizeYear(contextYear) : null;

    if (includeYear) {
      const configuredYearOptions = dedupePreserveOrder(
        (Array.isArray(yearOptionsInput) ? yearOptionsInput : years)
          .map((option) => normalizeYear(option))
          .filter(Boolean)
      );
      const discoveredYearOptions = subjectFolderName ? listSubjectYears(subjectRootPath) : [];

      yearOptions = reorderWithPreference(
        dedupePreserveOrder([
          ...(year ? [year] : []),
          ...discoveredYearOptions,
          ...configuredYearOptions,
        ]),
        year || discoveredYearOptions[0]
      );

      if (!year && discoveredYearOptions.length === 1) {
        year = discoveredYearOptions[0];
      }

      const shouldPromptForYear =
        subjectFolderName &&
        (promptYearWhen === "always" ||
          (promptYearWhen !== "never" &&
            !year &&
            ((discoveredYearOptions.length > 1) ||
              (promptYearWhen === "missing" &&
                discoveredYearOptions.length === 0 &&
                yearOptions.length > 0))));

      if (shouldPromptForYear) {
        const SKIP_YEAR_SENTINEL = "__skip_year__";
        const yearLabelLower =
          typeof YEAR_LABEL === "string" ? YEAR_LABEL.toLowerCase() : "year";
        const displayOptions = [...yearOptions, `🚫 Skip ${yearLabelLower}`];
        const valueOptions = [...yearOptions, SKIP_YEAR_SENTINEL];

        const selectedYear = await tp.system.suggester(
          displayOptions,
          valueOptions,
          `Select ${YEAR_LABEL}`
        );

        year = selectedYear === SKIP_YEAR_SENTINEL ? null : normalizeYear(selectedYear);
      }
    }

    let parcialOptions = [];
    let parcial = includeParcial ? normalizeParcial(contextParcial) : null;
    let parcialFolderName = null;
    let targetFolder = subjectRootPath;

    if (includeParcial) {
      const parcialOptionsBase = parcialOptionsInput ?? parciales;

      parcialOptions = reorderWithPreference(parcialOptionsBase, normalizeParcial(contextParcial));
      parcial = normalizeParcial(
        (await tp.system.suggester(parcialOptions, parcialOptions)) ?? contextParcial
      );

      parcialFolderName =
        parcial && parcial !== GENERAL_LABEL ? sanitizeFolderName(parcial) : null;

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
      year,
      yearOptions,
      parcial,
      parcialFolderName,
      parcialOptions,
      targetFolder,
    };
  }

  async function resolveSubjectParcialTema(
    tp,
    {
      includeParcial = false,
      includeTema = true,
      contextTema = GENERAL_LABEL,
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
      GENERAL_LABEL,
      contextTema && contextTema !== GENERAL_LABEL ? contextTema : null,
      ...existingTemas,
    ]).filter(Boolean);

    const temaLabelLower =
      typeof TEMA_LABEL === "string" ? TEMA_LABEL.toLowerCase() : "tema";

    let temaSelection = contextTema ?? GENERAL_LABEL;

    if (allowNewTema || baseTemaOptions.length > 0) {
      const displayOptions = [...baseTemaOptions];
      const valueOptions = [...baseTemaOptions];

      if (allowNewTema) {
        displayOptions.push(`➕ Create new ${temaLabelLower}`);
        valueOptions.push(NEW_TEMA_SENTINEL);
      }

      displayOptions.push(`🚫 Skip ${temaLabelLower}`);
      valueOptions.push(SKIP_TEMA_SENTINEL);

      temaSelection =
        (await tp.system.suggester(displayOptions, valueOptions, `Select ${TEMA_LABEL}`)) ??
        contextTema ??
        GENERAL_LABEL;
    }

    let tema = temaSelection;

    if (temaSelection === NEW_TEMA_SENTINEL) {
      const newTemaInput = await tp.system.prompt(`Name for the new ${TEMA_LABEL}`);
      tema = newTemaInput?.trim() || contextTema || GENERAL_LABEL;
    } else if (temaSelection === SKIP_TEMA_SENTINEL) {
      tema = GENERAL_LABEL;
    }

    if (!tema) {
      tema = GENERAL_LABEL;
    }

    const temaFolderName = tema && tema !== GENERAL_LABEL ? sanitizeFolderName(tema) : null;
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

  const constants = {
    general: GENERAL_LABEL,
    final: FINAL_LABEL,
    subject: SUBJECT_LABEL,
    year: YEAR_LABEL,
    tema: TEMA_LABEL,
    parcial: PARCIAL_LABEL,
    universityRoot: DEFAULT_BASE_PATH,
    parcialContainer: PARCIAL_CONTAINER_NAME,
    temaContainer: TEMA_CONTAINER_NAME,
  };

  return {
    config,
    fsConfig,
    labels,
    years,
    parciales,
    schema,
    constants,
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
    normalizeYear,
    normalizeParcial,
    reorderWithPreference,
    reorderOptions: reorderWithPreference,
    buildSubjectOptions,
    resolveSubjectAndParcial,
    resolveSubjectParcialTema,
  };
}

module.exports = universityNoteUtils;

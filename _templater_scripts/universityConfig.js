/*
  universityConfig.js

  Central configuration for university note scripts and templates. Adjust the
  values here to rename folders, labels, and canonical study metadata.
*/

const universityConfig = {
  fs: {
    universityRoot: "Universidad",
    parcialContainer: "Parciales",
    temaContainer: "Temas",
  },
  labels: {
    subject: "Subject",
    year: "Year",
    // Rename to "Semester" or "Term" when features.parcial is true and your
    // curriculum uses semester-based exam periods instead of parciales.
    parcial: "Parcial",
    final: "Final",
    tema: "Tema",
    general: "General",
  },
  years: ["Year 1", "Year 2", "Year 3", "Year 4", "Year 5"],
  parciales: ["General", "Parcial 1", "Parcial 2", "Parcial 3", "Final"],
  // Language identifier for the default code fence in Lecture Notes.
  // Set to "" for a language-neutral block, or any valid identifier (e.g. "python", "java").
  codeLanguage: "",
  features: {
    // Enable exam-period grouping (Parciales / Semesters).
    // When false (default): all parcial prompts and Parciales/ folder logic are
    //   hidden; Parcial Prep Note becomes a generic subject-scoped Study Guide.
    // When true: the full parcial selection step appears in Parcial Prep Note
    //   and any template that passes includeParcial: true; notes are placed
    //   inside Parciales/<Parcial N>/.
    // Rename labels.parcial to "Semester" or "Term" to match your vocabulary.
    parcial: false,
  },
  schema: {
    types: {
      lecture: "lecture",
      concept: "concept",
      "subject-hub": "subject-hub",
      "parcial-prep": "parcial-prep",
      general: "general",
    },
  },
};

function universityConfigScript() {
  return universityConfig;
}

module.exports = universityConfigScript;

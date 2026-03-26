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

/*
  universityConfig.js

  Central configuration for university note scripts and templates. Adjust the
  values here to rename folders, labels, and canonical parcial values.
*/

const universityConfig = {
  fs: {
    universityRoot: "Universidad",
    parcialContainer: "Parciales",
    temaContainer: "Temas",
  },
  labels: {
    subject: "Subject",
    parcial: "Parcial",
    final: "Final",
    tema: "Tema",
    general: "General",
  },
  parciales: ["General", "Parcial 1", "Parcial 2", "Parcial 3", "Final"],
  schema: {
    types: {
      lecture: "lecture",
      concept: "concept",
      "subject-hub": "subject-hub",
      general: "general",
    },
  },
};

function universityConfigScript() {
  return universityConfig;
}

module.exports = universityConfigScript;

# Obsidian University Workflow

A modular collection of Obsidian Templater scripts and templates for university students. The toolkit automates file naming, metadata, and folder placement so you can focus on learning instead of note management.

---

## 📦 What's Included?

```
.
├── _templater_scripts/
│   ├── getUniversityContext.js   # Detects course & parcial from file location
│   └── universityNoteUtils.js    # Helper utilities for folder discovery & file moves
└── _templates/
    ├── Concept Note Template.md  # Feynman-style concept capture template
    ├── Lecture Note.md           # Smart lecture note workflow
    └── Subject Hub.md            # Placeholder for course dashboards
```

---

## ✨ Key Features

- **Context-aware automation** – Detects the course (`subject`) and exam period (`parcial`) from your vault structure and injects them into frontmatter automatically.【F:_templater_scripts/getUniversityContext.js†L3-L25】
- **Guided folder placement** – Ensures notes land in the correct subject/parcial folder, creating directories on demand and preventing duplicate filenames.【F:_templater_scripts/universityNoteUtils.js†L9-L121】
- **Interactive setup** – Templater prompts let you create new subjects, pick parciales, and provide lecture topics as you create notes.【F:_templates/Lecture Note.md†L32-L87】【F:_templates/Concept Note Template.md†L31-L75】
- **Learning-focused structures** – Templates nudge active recall with sections for summaries, key concepts, open questions, and Dataview-powered backlinks to related lectures.【F:_templates/Lecture Note.md†L97-L123】【F:_templates/Concept Note Template.md†L97-L133】
- **Modular design** – Scripts are reusable across templates, making it simple to add your own note types while keeping behavior consistent.【F:_templater_scripts/universityNoteUtils.js†L1-L147】

---

## ✅ Requirements

- Obsidian v1.5 or newer.
- [Templater](https://github.com/SilentVoid13/Templater) plugin (required).
- [Dataview](https://github.com/blacksmithgu/obsidian-dataview) plugin (used in the Concept Note template and planned Subject Hub dashboards).

This workflow assumes your academic notes live under a folder named `Universidad`, organised as `Universidad/<Subject>/<Parcial>/Note.md`. You can adapt this later—see [Customising the folder logic](#-customising-the-folder-logic).

---

## ⚙️ Installation

1. **Download the repository**
   - Use the green **Code** button → **Download ZIP**, then extract it.
2. **Copy the assets into your vault**
   - Place `_templater_scripts/` and `_templates/` in the root of your Obsidian vault (or merge them with your existing folders of the same name).
3. **Configure Templater**
   - Settings → **Templater** → set **Template folder location** to `_templates`.
   - Set **Script files folder location** to `_templater_scripts`.
   - (Optional) Assign a hotkey to the **Lecture Note** template for rapid capture.
4. **Reload commands** (Templater → **Reload templates**).

---

## 🚀 Using the Templates

### Lecture Note
1. Create a new note (leave the default name such as `Untitled`).
2. Trigger the **Lecture Note** template via command palette or your hotkey.
3. Choose the course and parcial when prompted (or create a new subject on the fly).
4. Enter an optional lecture topic for smart file naming.
5. The template renames and moves the note, adds metadata, inserts active-recall sections, and places your cursor at the summary block ready for input.【F:_templates/Lecture Note.md†L44-L126】

### Concept Note
1. Run the **Concept Note Template** from any concept draft.
2. Pick or create the subject/parcial context via suggesters.
3. The script relocates the file if needed and seeds the page with sections for definitions, analogies, explanations, and a Dataview query linking related lectures.【F:_templates/Concept Note Template.md†L31-L133】

### Subject Hub
- `Subject Hub.md` currently acts as a placeholder for Dataview dashboards. Duplicate it per subject and build out course summaries, progress trackers, or Kanban views to suit your workflow.

---

## 🛠 Customising the Folder Logic

The helper script `universityNoteUtils.js` centralises file-placement rules. Key tweaks you can make:

- **Change the base folder** – Update `DEFAULT_BASE_PATH` if you use a different top-level folder than `Universidad`.
- **Custom parcial detection** – Adjust `getParcialContext` to recognise bespoke exam structures or add automatic folder generation for labs/projects.【F:_templater_scripts/universityNoteUtils.js†L9-L121】
- **Subject discovery** – Modify `listSubjects` and related functions to surface folders from multiple roots or filter archived courses.【F:_templater_scripts/universityNoteUtils.js†L45-L70】

After editing a script, run **Templater → Reload User Scripts** for the changes to take effect.

---

## 🤔 Troubleshooting

- **Template aborts immediately** – Ensure you're running it inside a new note named `Untitled` (required so the script can safely rename it).【F:_templates/Lecture Note.md†L69-L84】
- **Folders aren't created** – Verify Templater has file system access (Desktop app) and that `_templater_scripts` is correctly configured.
- **Dataview results are empty** – Confirm the Dataview plugin is enabled and that your lecture notes carry the `#lecture` tag generated by the template.【F:_templates/Lecture Note.md†L108-L123】

---

## 🤝 Contributing

Pull requests and feature ideas are welcome! Whether you want to add new templates, extend the Subject Hub dashboard, or support different academic structures, feel free to open an issue or PR.

Happy studying! 📚

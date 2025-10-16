# Obsidian University Workflow

A modular Templater system for students. This project provides a set of powerful, context-aware templates and scripts to automate academic note-taking in Obsidian.

It's designed to be dropped into any vault to provide a robust foundation for building a "second brain" for your studies.

---

## ✨ Features

-   **✍️ Interactive Smart Naming:** Prompts for a lecture topic to create clear, scannable filenames like `Lecture 2025-10-16 - Intro to Pointers.md`.
-   **🗂️ Automatic Metadata:** Detects the `course` and `parcial` (exam period) from your folder structure and adds them to your note's properties.
-   **🚀 Frictionless Start:** The cursor is automatically placed where you need to start typing in a new note, saving you clicks and time.
-   **🔧 Modular & Maintainable:** Uses a central User Script (`getUniversityContext.js`) to handle all context detection, making the system easy to adapt and extend.
-   **🏛️ Structured for Deep Learning:** The note layout encourages processing and retention with dedicated sections for `Summary`, `Definitions`, `Key Concepts`, and `Explanation in My Own Words`.

---

## ✅ Prerequisites

This system assumes a basic folder structure for university notes. For the context detection to work, your lecture notes should be inside a path similar to this:
`.../Universidad/[Subject Name]/[Parcial Name]/`

You will also need the following installed in Obsidian:
1.  **Templater Plugin:** The engine that runs all automation.
2.  **Dataview Plugin:** Required for the upcoming "Subject Hub" dashboard template.

---

## ⚙️ How to Install

1.  **Download:** Click the green "Code" button on this page and select "Download ZIP". Unzip the folder.
2.  **Copy Scripts & Templates:**
    -   Copy the `_templater_scripts` folder into the root of your Obsidian vault.
    -   Copy the `templates` folder into the root of your Obsidian vault.
3.  **Configure Templater:**
    -   Go to **Settings -> Templater**.
    -   Set your **"Template folder location"** to the `templates` folder you just copied.
    -   Set your **"Script files folder location"** to the `_templater_scripts` folder.
    -   It is highly recommended to bind the `Lecture Note Template.md` to a hotkey (like `Cmd + M`) for fast creation.

---

## 🚀 Workflow in Action

1.  Navigate to the correct folder for your lecture (e.g., `Universidad/Matemáticas/Parcial 1`).
2.  Press your hotkey (`Cmd + M`).
3.  A prompt will ask for the lecture topic. Type it in and press Enter.
4.  A perfectly named and structured note is instantly created, with your cursor ready to go.

---

## 🔮 Roadmap

This project is the foundation of a larger system. Future planned additions include:

-   **Concept Note Template:** For creating atomic notes on single ideas.
-   **Subject Hub Template:** A dashboard note that will use Dataview to automatically organize all notes for a given course.

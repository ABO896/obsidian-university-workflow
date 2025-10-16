# Obsidian University Workflow Template

A modular, context-aware Templater system designed to automate note-taking for university students. This workflow turns Obsidian into an intelligent "second brain" that automatically organizes lecture notes by subject and exam period.

It's built to be **fast**, **smart**, and **maintainable**, letting you focus on learning, not file management.

---

## ✨ Features

-   **✍️ Interactive Smart Naming:** Prompts you for a lecture topic to create clear, scannable filenames like `Lecture 2025-10-16 - Intro to Pointers.md`.
-   **🗂️ Full Context-Aware Metadata:** Automatically detects the `course` and `parcial` (exam period) from the folder structure and adds them to your note's properties.
-   **🚀 Frictionless Start:** The cursor is automatically placed in the "Definitions" section of a new note, so you can start typing immediately after creation.
-   **🔧 Modular & Maintainable:** Uses a central User Script (`getUniversityContext.js`) to handle all context detection, making the system easy to update and extend (DRY principle).
-   **🏛️ Structured for Deep Learning:** The note layout includes sections for `Summary`, `Definitions`, `Key Concepts`, and `Explanation in My Own Words` to encourage processing and retention over simple transcription.

---

## ✅ Prerequisites

1.  **Obsidian:** You must have Obsidian installed.
2.  **Templater Plugin:** This system relies heavily on the Templater community plugin.
3.  **Crucial Setting:** You **must** configure Obsidian's settings. Go to **Settings -> Files and Links** and set **"Default location for new notes"** to **"Same folder as current file"**.

---

## ⚙️ How to Install

1.  **Download the Repository:** Click the green "Code" button on this page and select "Download ZIP". Unzip the folder.
2.  **Copy the User Script:**
    -   Create a folder in your Obsidian vault named `_templater_scripts` (or whatever you prefer).
    -   Copy the `getUniversityContext.js` file from the repository into your vault's script folder.
3.  **Copy the Template:**
    -   Copy the `Lecture Note Template.md` file into your main Templater folder (e.g., `_templates`).
4.  **Configure Templater:**
    -   Go to **Settings -> Templater**.
    -   Under "Template folder location," make sure you've selected your templates folder (e.g., `_templates`).
    -   Under "User Script Functions," set the "Script files folder location" to the folder you created in step 2 (e.g., `_templater_scripts`).
    -   Bind the `Lecture Note Template.md` to a hotkey (like `Cmd + M` or `Ctrl + M`) for fast creation.

---

## 🚀 Workflow in Action

1.  Navigate to the correct folder for your lecture (e.g., `Universidad/Matemáticas/Parcial 1`).
2.  Press your hotkey (`Cmd + M`).
3.  A prompt will ask for the lecture topic. Type it in and press Enter.
4.  A perfectly named and structured note is instantly created, with your cursor ready to go.

---

## 🔮 Roadmap

This project is the foundation of a larger system. Future planned additions include:

-   **Concept Note Template:** For creating atomic notes on single ideas (e.g., "Pointers," "Recursion").
-   **Subject Hub Template:** A dashboard note that will use the Dataview plugin to automatically organize all lecture and concept notes for a given course.

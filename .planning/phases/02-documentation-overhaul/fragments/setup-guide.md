## Setup Guide

By the end of this section, you will have installed Templater and Dataview, told Templater where to find this vault's templates and scripts, and verified the setup by creating a test Lecture Note.

### Prerequisites

- **Obsidian desktop.** This workflow is desktop-only because the helper scripts (`tp.user.*`) cannot run on Obsidian mobile — they rely on Obsidian's desktop-only user functions feature.
- **Community plugins enabled.** Open `Settings -> General` and turn on **Community plugins** if you have not done so already.

### Step 1: Install Templater

Open `Settings -> Community Plugins -> Browse`, search for **Templater**, click **Install**, then click **Enable**.

### Step 2: Install Dataview

Open `Settings -> Community Plugins -> Browse`, search for **Dataview**, click **Install**, then click **Enable**.

Dataview renders the course dashboards and backlink tables that appear inside Subject Hub notes and Parcial Prep notes.

### Step 3: Copy the workflow files into your vault

Copy the `_templates/` folder and the `_templater_scripts/` folder into your vault root — the same level as your `.obsidian/` folder. After copying, your vault root should contain at minimum:

```
YourVault/
├── .obsidian/
├── _templates/
└── _templater_scripts/
```

### Step 4: Configure Templater

Open `Settings -> Templater` and set the following two paths:

- **Template folder location:** `_templates`
- **Script files folder location:** `_templater_scripts`

You can also turn on **Trigger Templater on new file creation** if you want templates to run automatically when you create a new note. This is optional but convenient.

### Step 5: Reload Templater user scripts

After setting the Script files folder, Templater needs to load the helper scripts before they are available. Do one of the following:

- Open the command palette (`Ctrl/Cmd + P`) and run **Templater: Replace templates in the active file**.
- Or simply restart Obsidian.

Either action registers the five helper scripts by name: `universityConfig`, `getUniversityContext`, `universityNoteUtils`, `scriptLoader`, and `templateBootstrap`. Once registered, all templates can call them.

### Step 6: Verify the setup

To confirm everything is working:

1. Create a new untitled note in Obsidian.
2. Open the command palette and run **Templater: Create new note from template**.
3. Select **Lecture Note** from the list.
4. If prompts appear asking you to choose a year, subject, and tema, the setup is complete.

If the prompts do not appear, double-check that the `_templater_scripts/` folder is in your vault root and that Step 4 and Step 5 are complete.

### Version requirement

Templater **2.16 or later** is required for the multi-select features (`tp.system.multi_suggester`). These are used by Lecture Note concept tagging, Link Concepts to Note, and Update Note Status. If you are running an older version of Templater, the workflow will partially function but those multi-select steps will be skipped silently.

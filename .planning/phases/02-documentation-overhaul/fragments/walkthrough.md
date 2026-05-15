## Workflow Walkthrough

This is what a single study cycle looks like — from sitting down in class to closing the laptop the night before an exam. Each stage uses one template; the running example uses a Year 1 Physics I lecture on the electromagnetic spectrum.

### Stage 1: In class — capture the lecture

1. Open Obsidian and create a new untitled note (or open the command palette and choose **"Templater: Create new note from template"**).
2. Run the **Lecture Note** template.
3. Answer the prompts in this order:
   - **Year** → select `Year 1`
   - **Subject** → select `Physics I`
   - **Tema** → select `Waves`
   - **Topic** → type `Electromagnetic Spectrum`
4. When the concept multi-select appears, optionally pick concept notes you already have in the vault — for example, `Photon` or `Wave-Particle Duality` — to pre-tag which concepts this lecture covers. Press Enter to skip if you have none yet.
5. The template moves the file to `University/Year 1/Physics I/Temas/Waves/Lecture 2026-05-15 - Electromagnetic Spectrum.md` and inserts structured sections with frontmatter already filled in.
6. The cursor lands in the prepared note body so you can start taking notes immediately.

### Stage 2: Mid-lecture — capture a concept on the fly

1. As you write, highlight a term in the lecture note — for example, `Photoelectric Effect`.
2. Run the **Quick Create Concept** template from the command palette.
3. When prompted for the concept name, the highlighted text is already filled in; confirm it or type a new name.
4. The template creates a new concept note at `University/Year 1/Physics I/Temas/Waves/Photoelectric Effect.md`, inserts a `[[Photoelectric Effect]]` link at the cursor in your lecture note, and adds `Photoelectric Effect` to the lecture note's `concepts` frontmatter array.
5. Because the template inherits `course`, `year`, and `tema` from your current note's frontmatter, you are not asked to pick them again — placement is automatic.

### Stage 3: After class — link the remaining concepts

1. Open the lecture note from Stage 1.
2. Run the **Link Concepts to Note** template.
3. A multi-select picker appears listing every concept note filed under Physics I. Concepts already linked to this lecture are shown with a `✓` prefix so you can see at a glance what is already wired up.
4. Select the additional concepts you want to associate with this lecture.
5. The template updates the `concepts` array in the lecture note's frontmatter — the body of the note is left completely untouched.

### Stage 4: Before the exam — build a parcial prep note

1. Create a new untitled note (or use **"Templater: Create new note from template"**).
2. Run the **Parcial Prep Note** template.
3. Answer the prompts:
   - **Year** → `Year 1`
   - **Subject** → `Physics I`
   - If `features.parcial: true` is set in your config, a third prompt appears: pick the exam period, for example `Parcial 2`.
4. The template creates a study guide note with Dataview tables that auto-populate with every lecture and every concept note from Physics I / Year 1 — no manual linking required.
5. Tab through three cursor stops to fill in your study material: **Topics to Cover**, **Summary Notes**, and **Practice Questions**.
6. When `features.parcial: false` (the default), the file is placed directly at the subject root as a general study guide. When `features.parcial: true`, it is placed inside `Parciales/Parcial 2/` so each exam period has its own prep note.

---

The core workflow chains just four templates and one config flag. Once this cycle feels natural, the other templates — **Subject Hub**, **Mark Reviewed**, **Update Note Status**, and the rest — are documented in the Template Reference section that follows.

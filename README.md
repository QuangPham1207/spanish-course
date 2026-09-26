# Spanish — Personal Reading-First Course (A0 → B2)

A self-contained starter project for building a personalized Spanish course in
the same style as the Chinese course it was adapted from. Copy this `Spanish/`
folder out to use it as its own project.

## What's here
- `AGENTS.md` — **the main instruction file.** Every future session reads this
  first. It defines the tutor role, the learner profile, the lesson format and
  the vocabulary-maintenance workflow.
- `syllabus.md` — the full A0 → B2 curriculum, organized into modules and
  numbered lessons, with review lessons at the end of each module.
- `opencode.json` — model/config for opencode sessions.
- `scripts/vocab.mjs` — vocabulary library + CLI (`new`, `lookup`, `stats`,
  `build`). Spanish-adapted: case/accent-insensitive matching.
- `course/` — the lessons live here.
  - `lesson-01.html` — the **canonical lesson template** (fully written).
  - `data/lesson-01.json` — lesson 1 vocabulary (source of truth).
  - `data/vocab-bundle.js` — auto-generated; do not edit.
  - `vocabulary.html` — vocabulary index; open it in a browser.

## How to build the next lesson
1. Read `AGENTS.md` and `syllabus.md`.
2. Draft the reading passage, then check new words:
   `node scripts/vocab.mjs new "<passage>"`
3. Create `course/lesson-XX.html` following `course/lesson-01.html`
   (2-tier blocks: `.es` + `.en`; five parts; no exercises).
4. Create `course/data/lesson-XX.json`.
5. Run `node scripts/vocab.mjs build`.
6. Open `course/vocabulary.html` to confirm the new words appear.

## Key design choices
- Course language: **English explanations**, **Spanish target text**.
- Standard: **neutral Spanish**; Spain vs Latin America differences are noted.
- Format: one self-contained, mobile-friendly HTML file per lesson, dark-mode
  aware, with a two-line phrase block (Spanish then English).
- Method: **reading-first**; no homework, no tests, no submissions.
- Content: daily life at A1-A2, then history / culture / politics / philosophy
  of the Spanish-speaking world at B1-B2.

# Rise Course Translate — Setup Guide

Summary of the risecoursetranslate project and how to use it in Articulate Rise xAPI exports.

---

## What this does

- Adds a language dropdown to Rise courses
- Translates course text via Google Translate (free, no API key)
- Keeps glossary terms **untranslated** in every language (brand names, acronyms, etc.)
- **New in v1.10.0:** translates custom HTML/JavaScript code blocks too, not just Rise's own text and video captions — see the **Code blocks** section below and `CODE-BLOCKS.md`

**GitHub repo:** https://github.com/Moyour/risecoursetranslate

---

## The one line (never change this)

Paste once in **`scormcontent/index.html`**. **Your team does not update this.**

```html
<script src="https://cdn.jsdelivr.net/gh/Moyour/risecoursetranslate@main/risecoursetranslate.js" data-glossary="Translation Glossary.csv" defer></script>
```

`@main` always uses the latest version on GitHub — no new link when we push fixes.

**Optional frozen version** (only change if you choose to upgrade later):

```html
<script src="https://cdn.jsdelivr.net/gh/Moyour/risecoursetranslate@v1.8.7/risecoursetranslate.js" data-glossary="Translation Glossary.csv" defer></script>
```

---

## Current version

**v1.10.0**

---

## For non-technical team members

**They only edit `Translation Glossary.csv` or Excel.** Nothing else.

### Updating the glossary (2 steps)

1. **Edit** the glossary in Excel → save as **`Translation Glossary.csv`**
2. **Double-click** **`Update Glossary.command`**

That copies the CSV into your course and syncs it into `index.html`. **No .js files.**

### One-time setup

1. Copy `glossary-course-folder.example.txt` → rename to `glossary-course-folder.txt`
2. Paste the full path to your `scormcontent` folder
3. Double-click **Update Glossary** after every CSV change

---

## Quick setup (xAPI)

### Step 1 — One line in `index.html`

```html
<script src="https://cdn.jsdelivr.net/gh/Moyour/risecoursetranslate@main/risecoursetranslate.js" data-glossary="Translation Glossary.csv" defer></script>
```

### Step 2 — Run Update Glossary

Double-click **Update Glossary** — it puts **`Translation Glossary.csv`** in `scormcontent/` and syncs it into `index.html`.

### Folder layout

```
scormcontent/
  index.html                  ← script line + embedded glossary (auto)
  Translation Glossary.csv    ← your glossary file
```

### Step 3 — Re-zip and upload

---

## Your glossary file

- **File name:** `Translation Glossary.csv`
- **Columns:** Source content | Target content | Notes
- **Purpose:** Terms listed stay untranslated in every language

### When you update the list

1. Edit CSV or Excel → save as `Translation Glossary.csv`
2. Double-click **Update Glossary**
3. Re-zip and upload

---

## How glossary loads (CSV only)

Update Glossary syncs your CSV into `index.html` as a hidden block. The course reads that — **no .js files**.

You may still see `Glossary fetch failed` for the CSV file — that is OK if you see:

```
Glossary loaded: 49 protected term(s) from embedded-csv
```

---

## Privacy

| Item | Public? |
|------|---------|
| `risecoursetranslate.js` (CDN) | Yes — on GitHub |
| `Translation Glossary.csv` | **No** — stays in your course only |

---

## How to verify it works

| Check | Expected |
|-------|----------|
| `window.__riseTranslateVersion` | `"1.10.0"` |
| `window.__riseGlossaryCount` | `49` (or your term count) |
| Console | `Glossary loaded: X protected term(s)` |

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Glossary count = 0 | Run **Update Glossary** after editing CSV |
| Glossary fetch failed | OK if `embedded-csv` loads — run Update Glossary |
| Re-publish from Rise | Re-run **Update Glossary** (re-embeds CSV into index.html) |

---

## Translating code blocks (new in v1.10.0)

If a lesson has a custom HTML/JavaScript code block (an interaction, diagram,
or form built with custom code — not standard Rise blocks), that content is
**not** translated by the one line above by itself. Add one more line inside
that specific code block, near the bottom of its HTML:

```html
<script src="https://cdn.jsdelivr.net/gh/Moyour/risecoursetranslate@main/translate-core.js" defer></script>
```

That's it — the block then follows the course's language dropdown
automatically. No changes needed to `index.html` for this.

- To keep specific text in English inside a block (code samples, brand
  names), wrap it: `<span data-notranslate>ODA Canvas</span>`
- Full explanation of how this works, troubleshooting, and a worked example
  (`code-block.html`) live in **`CODE-BLOCKS.md`**

---

## Files in this repo

| File | Purpose |
|------|---------|
| `risecoursetranslate.js` | Main translator (CDN) — the course-level bar |
| `translate-core.js` | Translator for individual code blocks (CDN) — one line per block |
| `code-block.html` | Worked example of a code block using `translate-core.js` |
| `Update Glossary.command` | Double-click to sync CSV into course |
| `scripts/update-glossary.py` | Backend for Update Glossary |
| `scripts/verify-glossary.mjs` | Dev check — CSV parses correctly |
| `glossary.example.csv` | Example glossary format |
| `glossary-course-folder.example.txt` | Template for course path |
| `test.html` | Local test page |
| `SETUP-GUIDE.md` | Setup instructions (this file) |
| `CODE-BLOCKS.md` | How code-block translation works, and how to add it |
| `CHAT-SUMMARY.md` | Project history and issues log |

---

## Local test

Open `test.html` in a browser (with a local server if needed for glossary load).

---

*Last updated: July 2026 — merged the code-block translation feature (v1.10.0) into main. See CHAT-SUMMARY.md for full history.*

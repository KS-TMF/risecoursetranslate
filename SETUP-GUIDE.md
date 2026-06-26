# Rise Course Translate — Setup Guide

Summary of the risecoursetranslate project and how to use it in Articulate Rise xAPI exports.

---

## What this does

- Adds a language dropdown to Rise courses
- Translates course text via Google Translate (free, no API key)
- Keeps glossary terms **untranslated** in every language (brand names, acronyms, etc.)

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

**v1.8.9**

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
| `window.__riseTranslateVersion` | `"1.8.9"` |
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

## Files in this repo

| File | Purpose |
|------|---------|
| `risecoursetranslate.js` | Main translator (CDN) |
| `Update Glossary.command` | Double-click to sync CSV into course |
| `glossary.example.csv` | Example format |
| `SETUP-GUIDE.md` | This file |

---

## Local test

Open `test.html` in a browser (with a local server if needed for glossary load).

---

*Last updated: June 2025 — chat summary for Moyour / ODF Awareness course.*

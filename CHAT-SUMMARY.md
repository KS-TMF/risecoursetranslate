# Chat Summary — Rise Course Translate + Glossary

## Project goal

Add translation to Articulate Rise **xAPI** courses via one CDN script line, while keeping a private glossary of terms (ODF, TM Forum, Digital Twin, etc.) **untranslated** in every language, and — as of v1.10.0 — also translating custom HTML/JavaScript **code blocks**, not just Rise's own text and captions.

**Repo:** https://github.com/Moyour/risecoursetranslate  
**Current version:** v1.10.0 (`@main` on CDN)

**Start here if you're new to this project:** read this file top to bottom
for the history, then `SETUP-GUIDE.md` for how to actually use it, then
`CODE-BLOCKS.md` if you're touching the code-block translation feature
specifically.

---

## The one line (set once, never change)

```html
<script src="https://cdn.jsdelivr.net/gh/Moyour/risecoursetranslate@main/risecoursetranslate.js" data-glossary="Translation Glossary.csv" defer></script>
```

Paste in **`scormcontent/index.html`**.

---

## Issues we faced (and fixes)

| # | Issue | Cause | Fix |
|---|--------|--------|-----|
| 1 | Dropdown / placement bugs on Rise cover | Rise DOM, overflow, React re-renders | v1.6.x — smart placement, portaled dropdown |
| 2 | Glossary seemed ignored | Placeholder characters corrupted by Google Translate | v1.8.3 — segment-based protection (skip terms during translation) |
| 3 | Glossary not loading | CSV `fetch()` blocked in xAPI / local `file://` | Tried `.js` fallback — **rejected by user** |
| 4 | CDN link kept changing | Pinned to commit hashes each fix | Switched to stable `@main` URL |
| 5 | Team workflow too technical | Manual CSV → JS conversion, terminal | **Update Glossary.command** — double-click only |
| 6 | Glossary broke again (v1.8.8) | `.js` loader mis-parsed CSV when source URL ended in `.js` | v1.8.8 parse fix |
| 7 | User wants **CSV only**, not `.js` | xAPI blocks CSV fetch even when file is in folder | v1.8.9 — **Update Glossary embeds CSV inside `index.html`**; course reads `embedded-csv` |
| 8 | Dropdown search broke when the panel was portaled to `<body>` (to escape Rise's overflow clipping) | Search filtered options in the wrong DOM location once portaled | v1.9.1 — fixed language search to work against the portaled panel |
| 9 | Custom HTML/JavaScript code blocks were invisible to the translator — only Rise's own text and video captions were covered | Code blocks render in a sandboxed `<iframe>` with arbitrary markup the bar can't safely walk | v1.10.0 — **code blocks now translate.** Prototyped separately (`Rise_Translate_Test_v1.0` repo), then merged into main. See `CODE-BLOCKS.md` for the full mechanism. |

---

## Core problem (still relevant)

**Browsers and xAPI/LMS packages often cannot load `Translation Glossary.csv` via `fetch()`**, even when the file sits next to `index.html` in `scormcontent/`.

**Workaround (v1.8.9):**  
`Update Glossary` copies the CSV into the course **and** embeds the same data in `index.html` as:

```html
<script type="text/plain" id="rise-glossary" data-rise-glossary>
...csv content...
</script>
```

The translator loads **`embedded-csv`** first. You may still see `Glossary fetch failed` for the `.csv` URL — that is expected and OK if embedded load succeeds.

---

## Current workflow (simple)

### Team (non-technical)
1. Edit **`Translation Glossary.csv`** (or Excel → Save As CSV)
2. Double-click **`Update Glossary.command`**

### Publisher (you)
1. Export xAPI from Rise → unzip
2. Ensure script line is in `scormcontent/index.html` (once)
3. Run **Update Glossary** (syncs CSV + embeds into `index.html`)
4. Re-zip → upload to LMS

### One-time setup
- Copy `glossary-course-folder.example.txt` → `glossary-course-folder.txt`
- Add path to your `scormcontent` folder so Update Glossary copies files automatically

---

## xAPI folder layout

```
course-package/
├── scormdriver/              ← do not edit
└── scormcontent/
    ├── index.html              ← CDN script line + embedded glossary block (auto)
    └── Translation Glossary.csv
```

---

## Files involved

### On GitHub (public) — `risecoursetranslate` repo

| File | Purpose |
|------|---------|
| `risecoursetranslate.js` | Main translator (course-level bar) — loaded from CDN |
| `translate-core.js` | Translator for individual code blocks — loaded from CDN, one line per block (v1.10.0+) |
| `code-block.html` | Worked example of a code block wired up with `translate-core.js` |
| `Update Glossary.command` | Double-click to sync glossary into course |
| `scripts/update-glossary.py` | Reads CSV/Excel, copies CSV, embeds in `index.html` |
| `scripts/verify-glossary.mjs` | Dev check — CSV parses correctly |
| `glossary.example.csv` | Example format (fake terms) |
| `glossary-course-folder.example.txt` | Template for course path config |
| `test.html` | Local mock Rise page |
| `SETUP-GUIDE.md` | Setup instructions |
| `CODE-BLOCKS.md` | How the code-block translation feature works, and how to add it to a block |
| `CHAT-SUMMARY.md` | This file |

### On your Mac (private — not on GitHub)

| File | Purpose |
|------|---------|
| `Translation Glossary.xlsx` | Original Excel glossary (your terms) |
| `Translation Glossary.csv` | Saved/exported glossary — team edits this |
| `glossary-course-folder.txt` | Path to your `scormcontent` folder (optional) |

### Inside xAPI package (private — uploaded to LMS)

| File | Purpose |
|------|---------|
| `scormcontent/index.html` | Rise course + CDN script line + embedded glossary |
| `scormcontent/Translation Glossary.csv` | Glossary file in course package |

### Do NOT use (removed from repo)

| Item | Why |
|------|-----|
| `Translation Glossary.js` | Removed — CSV + Update Glossary embed only |
| `scripts/build-glossary-js.mjs` | Removed — obsolete |
| `deepl-proxy.example.mjs` | Removed — not used |
| Commit-pinned CDN URLs | Use `@main` instead |
| Public GitHub hosting of glossary | Privacy — glossary stays in course upload only |

---

## How to verify glossary works

Open course → **F12** → **Console**:

| Check | Expected |
|-------|----------|
| `window.__riseTranslateVersion` | `"1.10.0"` |
| `window.__riseGlossaryCount` | `49` (or your term count) |
| Console message | `Glossary loaded: X protected term(s) from embedded-csv` |

Pick French/Spanish — terms like **ODF**, **TM Forum** should stay in English.

To verify code-block translation specifically, see the checklist in
`CODE-BLOCKS.md`.

---

## Glossary CSV format

```csv
Source content,Target content,Notes (250 character max)
ODF,ODF,
TM Forum,TM Forum,
Digital Twin,Digital Twin,
```

- **Source content** = term to protect  
- Terms stay untranslated in **every** language  
- Not a translation dictionary

---

## Version timeline (key releases)

| Version | Change |
|---------|--------|
| v1.6.x | Rise UI — dropdown, cover vs floating placement |
| v1.8.0–v1.8.3 | Glossary support, Excel format, Rise-safe translation |
| v1.8.4–v1.8.7 | Fetch fallbacks, `.js` workaround (later removed) |
| v1.8.8 | Fix silent glossary parse failure |
| v1.8.9 | **CSV only** — embed via Update Glossary, no `.js` |
| v1.9.1 | Fix language search when the dropdown panel is portaled to `<body>` |
| v1.10.0 | **Code blocks now translate.** Adds `translate-core.js` (loaded per code block) and the broadcast/skip logic in `risecoursetranslate.js` that lets the two talk over `postMessage`. Merged in from the `Rise_Translate_Test_v1.0` prototype repo. Full mechanism in `CODE-BLOCKS.md`. |

---

## Open risks / things to watch

1. **Re-export from Rise** overwrites `index.html` — must re-add script line and re-run **Update Glossary**
2. **Local testing** via double-clicking `index.html` (`file://`) — CSV fetch will fail; embedded glossary should still work after Update Glossary
3. **jsDelivr `@main` cache** — can take a few minutes to serve latest code after git push; hard-refresh browser
4. **Glossary terms split across Rise spans** — long phrases may partially translate if Rise splits text oddly in DOM
5. **Code-block glossary is separate** — `translate-core.js` has its own hardcoded `KEEP` list, not connected to the course glossary CSV. See "Open question" in `CODE-BLOCKS.md` if these need to be unified.
6. **DeepL engine is a stub** in both `translate-core.js` and any future DeepL work on the course bar — needs a server-side proxy before real use, so the API key never ships to the browser.

---

*Summary of chat through v1.10.0 — ODF Awareness / Translation Glossary course, plus the code-block translation merge.*

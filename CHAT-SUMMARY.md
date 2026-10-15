# Chat Summary — Rise Course Translate + Glossary

## Project goal

Add translation to Articulate Rise **xAPI** courses via one CDN script line, while keeping a private glossary of terms (ODF, TM Forum, Digital Twin, etc.) **untranslated** in every language, and — as of v1.10.0 — also translating custom HTML/JavaScript **code blocks**, not just Rise's own text and captions.

**Repo:** https://github.com/KS-TMF/risecoursetranslate  
**Current versions:** live courses v1.10.13 (`@main`), test courses v1.12.9 (`test` branch, via the loader line)

**Start here if you're new to this project:** read this file top to bottom
for the history, then `SETUP-GUIDE.md` for how to actually use it (it also
covers the code-block feature; `CODE-BLOCKS.md` is an older copy).

---

## The one line (set once, never change)

```html
<script src="https://cdn.jsdelivr.net/gh/KS-TMF/risecoursetranslate@main/risecoursetranslate.js" data-glossary="Translation Glossary.csv" defer></script>
```

Paste in **`scormcontent/index.html`**. Test courses use the loader line instead (see "Test branch status").

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
| 9 | Custom HTML/JavaScript code blocks were invisible to the translator — only Rise's own text and video captions were covered | Code blocks render in a sandboxed `<iframe>` with arbitrary markup the bar can't safely walk | v1.10.0 — **code blocks now translate.** Prototyped separately (`Rise_Translate_Test_v1.0` repo), then merged into main. See `SETUP-GUIDE.md` ("Translating code blocks") for the full mechanism. |
| 10 | Video captions (WebVTT) stayed in English | The v1.11.x attempt was reverted to be safe | v1.12.0 (on the `test` branch first) — cue text is translated in place on caption tracks, and caption lines a player draws into the page are swapped as they appear. Track on/off modes are never changed. Test page: `test-captions.html`. |
| 11 | Switching language left the on-screen caption in the old language | Browsers only redraw a caption when the next cue starts | v1.12.1 — active cues are removed and re-added so the caption redraws at once |
| 12 | CC menu still said "English" after picking another language | The only uploaded track is named English | v1.12.6 — the track and the player's menu entry are renamed to the chosen language; Reset restores "English" |
| 13 | Learners didn't know English was the default or how to go back | No English option; Reset only | v1.12.3–1.12.7 — "English (default)" selected at the top of the list, plus a note under the selector on the cover that follows the chosen language ("Reset" kept in English to match the button) |
| 14 | Captions looked huge, then tiny | Browser captions scale with the video; a 70% shrink (v1.12.2) clashed with Rise's player | v1.12.5 — back to the browser's default size; `data-caption-size` is opt-in only |
| 15 | Test course showed old features even after clearing the cache | jsDelivr's `@test` alias lagged hours behind GitHub (served 1.12.3 while test was 1.12.7), and purges got throttled | `test-loader.js` — test courses load it from a fixed commit; it asks GitHub for the newest `test` commit and loads that exact version |
| 16 | Glossary didn't work in the test course | `Translation Glossary.csv` was at the top of the zip, not inside `scormcontent/` | Put the CSV inside `scormcontent/` next to `index.html` (92 terms loaded once moved). From v1.12.9 the top of the zip is checked too |
| 17 | The word "It" stayed in English | Glossary term "IT" matched case-insensitively | v1.12.8 — all-capitals terms (IT, ODF, UML) only match in capitals |
| 18 | Language selector missing on first visit until a refresh | The bar was only drawn after the glossary finished loading; with the CSV outside `scormcontent/`, the script fell back to a first-time jsDelivr request for the new commit, which could take 20s+ | v1.12.9 — bar shows immediately; glossary requests time out after 5s; a glossary next to `scormcontent/` (top of the zip) is found too |

---

## Test branch status (2026-10-15)

All work is on the `test` branch (currently **v1.12.9**). Test courses use the loader line, which always runs the newest `test` commit:

```html
<script src="https://cdn.jsdelivr.net/gh/KS-TMF/risecoursetranslate@d191a1f88aa8d62a8b0de5219c6e72d7dd3007e9/test-loader.js" data-glossary="Translation Glossary.csv" defer></script>
```

Confirmed working in LearnUpon with the loader line: captions translate and switch instantly, CC menu shows the chosen language, English (default) + translated cover note. Glossary works once the CSV is inside `scormcontent/` (or, from v1.12.9, at the top of the zip).

2026-10-15: the user saw the selector missing on a first visit until a refresh. Reproduced on a fresh browser (selector never appeared in 20s, then fine on reloads): the bar waited for the glossary, which fell back to a slow first-time jsDelivr request. Fixed in v1.12.9 (commit ebab8fb). Verified: 5 fresh loads through the real loader line, selector visible in 0.4–0.7s, 92 glossary terms loaded. The loader itself was fine.

CDN facts (checked 2026-10-15): jsDelivr sends `s-maxage=43200` (CDN keeps branch links up to 12h) and `max-age=604800` (browsers up to 7 days). Purging `@test` worked (served 1.12.8 instead of 1.12.3 within seconds). jsDelivr also had a brief `503 No healthy backends` outage for not-yet-cached files; cached files kept working.

Release (prepared 2026-10-15, **on hold — main not changed**): branch `release-1.12.9` (commit 106cbb9) = `main` + the tested v1.12.9 `risecoursetranslate.js` (byte-identical to `test`) + all docs, worded for the state after go-live. Test-only files (`test-loader.js`, caption test pages, caption diagnostic) stay on `test`. Supersedes `release-1.12.8` (v1.12.8 regression check passed: mock course, code blocks, real LearnUpon course, phone size). Rollback point: tag `v1.10.13`. Go-live, when the user says: push `release-1.12.9` to `main`, tag `v1.12.9`, purge jsDelivr `@main`, verify the CDN serves 1.12.9, check a live course shows "English (default)" + the note; rollback = restore `v1.10.13` and purge. If `test` changes again first, rebuild the release branch from it.

How to tell versions apart without the console: "English (default)" + a note under the selector = v1.12.4+; "Select language" with no note = v1.10.13 (the current live version). 2026-10-15: the user saw "Select language" and no note in a course — that course was on the live `@main` line, not the test loader; not a bug.

Still open:
- A glossary term split across two caption lines ("…the Information" / "Framework is…") isn't recognised.
- Plurals aren't covered by singular glossary terms ("frameworks" vs "Framework") — add plural rows.
- Generic glossary rows (e.g. "Model") stop those words translating everywhere — review the CSV.
- Edit `index.html` in a plain-text editor: TextEdit's curly quotes or a pasted `%22` break the script line.
- Before go-live, rebuild the release branch from the current `test` script (v1.12.9).

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
| `glossary.example.csv` / `glossary_example.csv` | Example format (fake terms; identical) |
| `glossary-course-folder.example.txt` / `_example.txt` | Template for course path config (identical) |
| `test.html` | Local mock Rise page |
| `test-loader.js` | Test courses: loads the newest `test` commit |
| `test-captions*.html/.mp4/.vtt` | Caption test pages and sample media |
| `scripts/caption-diagnostic.js` | Developer caption report |
| `SETUP-GUIDE.md` | Setup instructions — the current reference |
| `CODE-BLOCKS.md` | Older standalone copy of the code-block mechanism |
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
| `scormcontent/Translation Glossary.csv` | Glossary file in course package (v1.12.9+ also finds it at the top of the zip) |

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
| `window.__riseTranslateVersion` | `"1.10.13"` live, `"1.12.9"` test |
| `window.__riseGlossaryCount` | Your term count (92 in the ODF course) |
| Console message | `Glossary loaded: X protected term(s) from …` |

Pick French/Spanish — terms like **ODF**, **TM Forum** should stay in English.

To verify code-block translation specifically, see the checklist in
`SETUP-GUIDE.md` ("How to verify it works").

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
| v1.10.0 | **Code blocks now translate.** Adds `translate-core.js` (loaded per code block) and the broadcast/skip logic in `risecoursetranslate.js` that lets the two talk over `postMessage`. Merged in from the `Rise_Translate_Test_v1.0` prototype repo. Full mechanism in `SETUP-GUIDE.md`. |
| v1.10.1–v1.10.13 | Glossary and code-block fixes; skip video-player UI; Rise transcripts and tooltips translate — **current live version (v1.10.13)** |
| v1.11.x | First caption attempt — reverted |
| v1.12.0–v1.12.8 | *(test)* Live video captions, CC menu renamed, English (default) + cover note, caption size back to default, all-capitals glossary terms |
| v1.12.9 | *(test)* Selector shows immediately on first visit; glossary fetch timeout; glossary at the top of the zip found |

---

## Open risks / things to watch

1. **Re-export from Rise** overwrites `index.html` — must re-add script line and re-run **Update Glossary**
2. **Local testing** via double-clicking `index.html` (`file://`) — CSV fetch will fail; embedded glossary should still work after Update Glossary
3. **jsDelivr cache** — branch links (`@main`, `@test`) can lag up to 12h behind GitHub and browsers keep copies up to 7 days; purge after pushing, use the loader line for test courses
4. **Glossary terms split across Rise spans** — long phrases may partially translate if Rise splits text oddly in DOM
5. **Code-block glossary is separate** — `translate-core.js` has its own hardcoded `KEEP` list, not connected to the course glossary CSV. See "Open question" in `SETUP-GUIDE.md` if these need to be unified.
6. **DeepL engine is a stub** in both `translate-core.js` and any future DeepL work on the course bar — needs a server-side proxy before real use, so the API key never ships to the browser.

---

*Summary of chat through v1.12.9 (15 October 2026) — ODF Awareness / Translation Glossary course, code-block translation, video captions on the test branch, and the first-visit selector fix.*

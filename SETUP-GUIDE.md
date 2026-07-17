# Rise Course Translate — Setup Guide

This is the **single source of truth** for the `risecoursetranslate` project:
what it does, how to set it up, how the code-block translation mechanism
works internally, and what every file in the repo is for. It merges what
used to be a separate `CODE-BLOCKS.md`, plus documents files that were
previously untracked (`.gitignore`, `test-code-block.html`, `scripts/`).

For the historical log of issues/fixes that led here, see `CHAT-SUMMARY.md`.
That file is history; this file is current behavior.

**GitHub repo:** https://github.com/KS-TMF/risecoursetranslate

---

## ⚠️ Known documentation/code mismatch (unresolved)

The version numbers previously written in this guide did not match the
actual shipped code. Confirmed by inspecting the files directly:

| File | Docs previously said | Code actually says |
|---|---|---|
| `risecoursetranslate.js` (`window.__riseTranslateVersion`) | `"1.10.4"` | `"1.10.11"` |
| `translate-core.js` (`window.TRANSLATE_CORE_VERSION`) | `"1.0"` | `"1.2"` |

This guide now states the **actual code values**. If you push a new version,
update the table in "How to verify it works" below at the same time — this
has drifted before.

`scripts/update-glossary.py` and `scripts/verify-glossary.mjs` are
referenced throughout this guide but were **not available to review** when
this version of the guide was written — their descriptions below are
carried over from the previous docs, unverified against actual code.

---

## What this does

- Adds a language dropdown to Rise courses
- Translates course text via Google Translate (free, no API key)
- Keeps glossary terms **untranslated** in every language (brand names, acronyms, etc.)
- Translates custom HTML/JavaScript **code blocks** too, not just Rise's own text and video captions — see "Translating code blocks" below

---

## The one line (never change this)

Paste once in **`scormcontent/index.html`**. **Your team does not update this.**

```html
<script src="https://cdn.jsdelivr.net/gh/KS-TMF/risecoursetranslate@main/risecoursetranslate.js" data-glossary="Translation Glossary.csv" defer></script>
```

`@main` always uses the latest version on GitHub — no new link when we push fixes.

**Direct GitHub (bypass CDN cache)** — use this if jsDelivr is serving a stale version:

```html
<script src="https://raw.githubusercontent.com/KS-TMF/risecoursetranslate/main/risecoursetranslate.js" data-glossary="Translation Glossary.csv" defer></script>
```

> Switch back to the jsDelivr URL above once the CDN has caught up — it's faster for end users.

**Optional frozen version** (only change if you choose to upgrade later):

```html
<script src="https://cdn.jsdelivr.net/gh/KS-TMF/risecoursetranslate@v1.8.7/risecoursetranslate.js" data-glossary="Translation Glossary.csv" defer></script>
```

---

## Current version

**v1.10.11** (`risecoursetranslate.js`, confirmed from code) — see the mismatch note above.

---

## For non-technical team members

**They only edit `Translation Glossary.csv` or Excel.** Nothing else.

### Updating the glossary (2 steps)

1. **Edit** the glossary in Excel → save as **`Translation Glossary.csv`**
2. **Double-click** the Update Glossary launcher for your OS:
   - **Mac:** `Update Glossary.command`
   - **Windows:** `Update Glossary.bat`

Both call the same `scripts/update-glossary.py` behind the scenes — same
result either way. That copies the CSV into your course and syncs it into
`index.html`. **No .js files.**

### One-time setup

1. Copy `glossary-course-folder.example.txt` → rename to `glossary-course-folder.txt`
2. Paste the full path to your `scormcontent` folder
3. Double-click **Update Glossary** after every CSV change

---

## Quick setup (xAPI)

### Step 1 — One line in `index.html`

```html
<script src="https://cdn.jsdelivr.net/gh/KS-TMF/risecoursetranslate@main/risecoursetranslate.js" data-glossary="Translation Glossary.csv" defer></script>
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
- **Columns:** Source content | Target content | Notes (250 character max)
- **Purpose:** Terms listed stay untranslated in every language — this is **not** a translation dictionary

Example format (see `glossary_example.csv`):

```csv
Source content,Target content,Notes (250 character max)
ExampleBrand,ExampleBrand,
ACME-0001,ACME-0001,
Digital Twin,Digital Twin,
```

### When you update the list

1. Edit CSV or Excel → save as `Translation Glossary.csv`
2. Double-click **Update Glossary**
3. Re-zip and upload

---

## How glossary loads (CSV only)

Update Glossary syncs your CSV into `index.html` as a hidden block:

```html
<script type="text/plain" id="rise-glossary" data-rise-glossary>
...csv content...
</script>
```

The course reads that — **no .js files**.

You may still see `Glossary fetch failed` for the CSV file — that is OK if you see:

```
Glossary loaded: 49 protected term(s) from embedded-csv
```

---

## Privacy

| Item | Public? |
|------|---------|
| `risecoursetranslate.js` (CDN) | Yes — on GitHub |
| `translate-core.js` (CDN) | Yes — on GitHub |
| `code-block.html`, `test.html`, `test-code-block.html` | Yes — on GitHub (examples/mocks, no real data) |
| `Translation Glossary.csv` | **No** — stays in your course only, kept out of git via `.gitignore` |
| `glossary-course-folder.txt` | **No** — local machine path, kept out of git via `.gitignore` |

---

## How to verify it works

### Course bar

| Check | Expected |
|-------|----------|
| `window.__riseTranslateVersion` | `"1.10.11"` |
| `window.__riseGlossaryCount` | `49` (or your term count) |
| Console | `Glossary loaded: X protected term(s) from embedded-csv` |

Pick French/Spanish — glossary terms like **ODF**, **TM Forum** should stay in English.

### Code blocks

Open the course, open a lesson with a translated code block, then **F12 → Console**:

| Check | Expected |
|---|---|
| `window.TRANSLATE_CORE_VERSION` (run inside the block's iframe context, or select its frame in devtools) | `"1.2"` |
| Switch language in the course dropdown | Code block text changes language within ~1.5s |
| Click Reset | Code block reverts to English |
| Set `window.TC_DEBUG = true` inside the block | Logs `[translate-core] {...}` every 2s with counts of observer fires, cache reapplies, full passes, network fetches — useful for spotting a block that's fighting the engine (fast-climbing `cacheReapplies`) |

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Glossary count = 0 | Run **Update Glossary** after editing CSV |
| Glossary fetch failed | OK if `embedded-csv` loads — run Update Glossary |
| Terms still translate (glossary ignored) | Older versions double-encoded the CSV filename, causing a 404 — make sure you're on `@main`, not a stale pinned tag |
| Re-publish from Rise | Re-run **Update Glossary** (re-embeds CSV into index.html); the script line is also wiped by Rise re-export and must be re-pasted |
| Code block not translating | Confirm the `translate-core.js` line is inside that specific code block's HTML, near the bottom (after your own markup/script) |
| Code block translated twice / garbled | Only load `translate-core.js` once per block; don't also let the course bar try to walk unmanaged content inside it |
| jsDelivr serving old code after a push | `@main` is cached by jsDelivr for a few minutes — hard-refresh, or temporarily switch to the raw.githubusercontent.com URL above |

---

## Translating code blocks — full mechanism

This section is the merged content of the former `CODE-BLOCKS.md`. It
explains **why** code blocks need a second script and **how** the two
scripts talk to each other — read this if you're touching the code-block
feature, not just using it.

### Why there are two files

| File | Lives where | Job |
|---|---|---|
| `risecoursetranslate.js` | One line in `scormcontent/index.html` | The course-level bar. Shows the language dropdown, translates ordinary Rise text, keeps the glossary. |
| `translate-core.js` | One line **inside each code block** you want translated | Translates only what's inside that one code block: text, SVG labels, attributes. |

A Rise code block renders inside its own `<iframe>`, sandboxed from the rest
of the page. The course bar cannot reach into that iframe and translate its
custom HTML the way it translates a normal Rise text block — the content
inside a code block isn't in Rise's DOM structure the bar already knows how
to walk, and every code block author writes different markup.

So instead of teaching the bar to guess at arbitrary custom HTML, each code
block carries its own small, generic translator, and the two talk to each
other over `postMessage`. The bar never looks inside; the block never needs
its own language switcher UI (it inherits the language from the bar).

### How the two talk to each other

1. **The block announces itself.** As soon as `translate-core.js` loads
   inside a code block, and every 1.2 seconds after that, it sends
   `{ type: "rise-ready" }` up to the parent page. This is a poll, not a
   one-off — so if the block finishes loading after the bar already asked
   once, it still gets an answer.
2. **The bar replies with the current language.** `risecoursetranslate.js`
   listens for `rise-ready` and answers with
   `{ type: "rise-lang", lang: "<code>" }`, using whatever language is
   currently active (or `"en"` if none is set).
3. **The bar also broadcasts proactively.** Every 1.5 seconds, and
   immediately whenever the learner changes language or hits Reset, the bar
   pushes `rise-lang` to every iframe on the page (recursively, in case of
   nested iframes). This covers blocks that mount later — lazy-loaded, or
   revealed by scrolling into a new lesson.
4. **The block applies it.** `translate-core.js` receives `rise-lang`,
   translates its own DOM to that language (or restores original English
   text if the language is `"en"`), and ignores repeats of a language it's
   already showing — so the constant polling and broadcasting stays cheap.

### Why the bar skips the block's insides

`translate-core.js` marks its own document with
`documentElement.setAttribute("data-tc-managed", "1")` as soon as it loads.
When the course bar collects text to translate
(`getTranslateRoots()` in `risecoursetranslate.js`), it checks every iframe
for that attribute and skips any that have it. This is the one point of
contact the two files have with each other's internals — everything else is
message-passing. Skipping matters because if both scripts translated the
same text, you'd get double-translated garbage or a fight over which
version wins.

Code blocks that **don't** load `translate-core.js` are completely
unaffected — the bar behaves exactly as before for them, and if they lack
the `data-tc-managed` attribute the bar still tries to walk them the old
way (harmless if they contain plain text, ineffective if they don't).

### Adding translate-core.js to a code block

Inside the Rise code block's HTML, add one line near the bottom (after your
own markup and script, so it can see the finished DOM):

```html
<script src="https://cdn.jsdelivr.net/gh/KS-TMF/risecoursetranslate@main/translate-core.js" defer></script>
```

That's it — the block then follows the course's language dropdown
automatically. No changes needed to `index.html` for this.

See `code-block.html` in this repo for a full worked example — a diagram,
a reveal-on-click scenario, form inputs, and a "keep in English" code
sample, all wired up.

### What gets translated automatically

- All visible text nodes
- SVG `<text>` / `<tspan>` labels
- These attributes, if present: `aria-label`, `title`, `alt`, `placeholder`
- Content revealed later (e.g. after a button click) — a `MutationObserver`
  catches it

### What to exclude from translation

Mark anything that must stay in English — code samples, brand names,
technical identifiers — with `data-notranslate`:

```html
<div class="keep" data-notranslate>intent.set("latency", "&lt; 5ms")</div>
```

or inline:

```html
<span data-notranslate>ODA Canvas</span>
```

There is also a hardcoded `KEEP` list near the top of `translate-core.js`
(`var KEEP = ["TM Forum", "ODA", "AN", "SLA"];`) for terms you want protected
in every block without adding `data-notranslate` each time. This list is
**local to `translate-core.js`** and separate from the course-level glossary
CSV that `risecoursetranslate.js` reads — see "Open question" below.

### Switching translation engine

Both files translate via Google Translate's public endpoint by default (no
API key). `translate-core.js` has its own engine switch, independent of the
course bar:

```js
var ENGINE = "google";   // "google" or "deepl"
```

`deepl` is currently a **stub** (`googleTranslate`/`deeplTranslate`
functions near the top of the file) — wire it to a server-side proxy before
using it in production, so a DeepL API key never ships to the browser. Same
caveat applies to any future DeepL work on the course bar.

### Open question — glossary sharing (not yet built)

Right now there are **two separate protected-term lists**:

1. The course glossary CSV (`Translation Glossary.csv`), read by
   `risecoursetranslate.js`, editable by the team via `Update Glossary`.
2. The hardcoded `KEEP` array inside `translate-core.js`, editable only by
   editing the file.

If code blocks should honor the *same* glossary the rest of the course
uses, that's follow-up work: `translate-core.js` would need to either read
the CSV itself (from inside a sandboxed iframe, which may hit the same
fetch restrictions documented in `CHAT-SUMMARY.md`) or receive the glossary
from the parent bar over `postMessage`, alongside the `rise-lang` message.
Not yet built — flagging here so it isn't lost.

### Feature history

This feature (v1.10.0) was prototyped in a separate test repo
(`Rise_Translate_Test_v1.0`) and merged into the main repo. Files it
touched: `risecoursetranslate.js` gained `broadcastLangToBlocks()`, the
`rise-ready` listener, the `data-tc-managed` skip in `getTranslateRoots()`,
and broadcast calls on language select/reset/init. `translate-core.js` and
`code-block.html` were new files.

---

## Every file in this repo

### Public (on GitHub)

| File | Purpose | Notes |
|------|---------|-------|
| `risecoursetranslate.js` | Main translator (course-level bar) — loaded from CDN via the one script line | `__riseTranslateVersion = "1.10.11"` |
| `translate-core.js` | Translator for individual code blocks — loaded from CDN, one line per block | `TRANSLATE_CORE_VERSION = "1.2"`; has its own hardcoded `KEEP` list and `ENGINE` switch |
| `code-block.html` | Worked example of a code block wired up with `translate-core.js` | Demo content only — diagram, reveal-scenario, form input, `data-notranslate` sample |
| `Update Glossary.command` | Double-click to sync `Translation Glossary.csv` into the course — **Mac only** | Bash script: `cd`s to its own folder, runs `scripts/update-glossary.py`, shows a macOS notification on success via `osascript` |
| `Update Glossary.bat` | Double-click to sync `Translation Glossary.csv` into the course — **Windows only** | Batch script: same job as the `.command` file, calls the same `scripts/update-glossary.py`, no macOS notification, pauses at the end so the window stays open |
| `scripts/update-glossary.py` | Backend for Update Glossary — reads CSV/Excel, copies CSV, embeds it in `index.html` | *Referenced, not included in this upload — unverified* |
| `scripts/verify-glossary.mjs` | Dev check — confirms the CSV parses correctly | *Referenced, not included in this upload — unverified* |
| `glossary_example.csv` | Example glossary format (fake terms: `ExampleBrand`, `ACME-0001`, `Digital Twin`) | Copy this format for your real `Translation Glossary.csv` |
| `glossary-course-folder_example.txt` | Template — copy to `glossary-course-folder.txt` and fill in your `scormcontent` path | One-time setup step |
| `test.html` | Local mock of a Rise cover page + lesson, wired to `risecoursetranslate.js` with an inline embedded glossary | Open directly in a browser to sanity-check the course bar without a real Rise export |
| `test-code-block.html` | Local mock of the **iframe/code-block** flow — a course shell page that builds an iframe via `srcdoc`, loads `translate-core.js` inside it, and confirms the bar's language broadcasts reach the iframe | Use this specifically to test the code-block `postMessage` handshake, separately from the glossary test in `test.html` |
| `SETUP-GUIDE.md` | This file — setup instructions, code-block mechanism, and full file reference | Source of truth |
| `CHAT-SUMMARY.md` | Project history — issues faced and fixes, version timeline | Historical log, not instructions |
| `.gitignore` | Keeps private/local files out of the public repo | Currently ignores `Translation Glossary.csv` and `glossary-course-folder.txt` — i.e. exactly the two files that contain real client data or a local machine path |

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
| Commit-pinned CDN URLs (as the default) | Use `@main` instead; pin only temporarily to freeze a version |
| Public GitHub hosting of the real glossary | Privacy — glossary stays in course upload only |
| Separate `CODE-BLOCKS.md` file | Merged into this guide — don't recreate it as a standalone doc |

---

## Local test

- **Course bar / glossary:** open `test.html` in a browser (use a local server if the glossary embed doesn't load over `file://`)
- **Code-block iframe handshake:** open `test-code-block.html` — confirms `rise-lang` messages reach an iframe running `translate-core.js`

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
| v1.10.0 | **Code blocks now translate.** Adds `translate-core.js` and the broadcast/skip logic described above |
| v1.10.4 (docs) / v1.10.11 (code) | Glossary CSV fetch fix for filenames with spaces — see the mismatch note at the top of this guide |

---

## Open risks / things to watch

1. **Re-export from Rise** overwrites `index.html` — must re-add script line and re-run **Update Glossary**
2. **Local testing** via double-clicking `index.html` (`file://`) — CSV fetch will fail; embedded glossary should still work after Update Glossary
3. **jsDelivr `@main` cache** — can take a few minutes to serve latest code after git push; hard-refresh browser
4. **Glossary terms split across Rise spans** — long phrases may partially translate if Rise splits text oddly in DOM
5. **Code-block glossary is separate** — `translate-core.js`'s `KEEP` list is not connected to the course glossary CSV (see "Open question" above)
6. **DeepL engine is a stub** in both `translate-core.js` and any future DeepL work on the course bar — needs a server-side proxy before real use, so the API key never ships to the browser
7. **Version numbers drift from code** — this guide's numbers were previously wrong for months; re-check `__riseTranslateVersion` / `TRANSLATE_CORE_VERSION` directly in code before publishing a version bump

---

*Last updated: July 2026. Merged `CODE-BLOCKS.md` into this guide, corrected version numbers against actual code, and documented `.gitignore`, `test-code-block.html`, and `scripts/` for the first time. See `CHAT-SUMMARY.md` for full project history.*

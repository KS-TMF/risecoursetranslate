# Translating Rise Code Blocks

This explains the feature added in **v1.10.0**: Rise "code block" interactions
(built with custom HTML/JavaScript) now translate along with the rest of the
course. Before v1.10.0, code blocks were invisible to the translator — the
one-line script only ever translated Rise's own text and video captions.

Read this if you want to know **why** it works this way, not just how to use
it — so anyone can pick this back up later without re-deriving it.

---

## The two files, and why there are two

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

---

## How the two talk to each other

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

## Why the bar skips the block's insides

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
unaffected — the bar behaves exactly as it did before v1.10.0 for them, and
if they lack the `data-tc-managed` attribute the bar still tries to walk
them the old way (harmless if they contain plain text, ineffective if they
don't, same as before this feature existed).

---

## Adding translate-core.js to a code block

Inside the Rise code block's HTML, add one line near the bottom (after your
own markup and script, so it can see the finished DOM):

```html
<script src="https://cdn.jsdelivr.net/gh/Moyour/risecoursetranslate@main/translate-core.js" defer></script>
```

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

There is also a hardcoded `KEEP` list near the top of `translate-core.js`
(`var KEEP = ["TM Forum", "ODA", "AN", "SLA"];`) for terms you want protected
in every block without adding `data-notranslate` each time. This list is
**local to `translate-core.js`** and separate from the course-level glossary
CSV that `risecoursetranslate.js` reads — see **Open question** below.

---

## Switching translation engine

Both files translate via Google Translate's public endpoint by default (no
API key). `translate-core.js` has its own engine switch, independent of the
course bar:

```js
var ENGINE = "google";   // "google" or "deepl"
```

`deepl` is currently a stub (`googleTranslate`/`deeplTranslate` functions
near the top of the file) — wire it to a server-side proxy before using it
in production, so a DeepL API key never ships to the browser.

---

## Verifying it works

Open the course, open a lesson with a translated code block, then **F12 →
Console**:

| Check | Expected |
|---|---|
| `window.TRANSLATE_CORE_VERSION` (run inside the block's iframe context, or check via the block's own console if you can select its frame) | `"1.0"` |
| Switch language in the course dropdown | Code block text changes language within ~1.5s |
| Click Reset | Code block reverts to English |
| Set `window.TC_DEBUG = true` inside the block | Logs `[translate-core] {...}` every 2s with counts of observer fires, cache reapplies, full passes, network fetches — useful for spotting a block that's fighting the engine (fast-climbing `cacheReapplies`) |

---

## Open question — glossary sharing

Right now there are **two separate protected-term lists**:

1. The course glossary CSV (`Translation Glossary.csv`), read by
   `risecoursetranslate.js`, editable by the team via `Update Glossary`.
2. The hardcoded `KEEP` array inside `translate-core.js`, editable only by
   editing the file.

If code blocks should honor the *same* glossary the rest of the course
uses, that's a follow-up piece of work: `translate-core.js` would need to
either read the CSV itself (from inside a sandboxed iframe, which may hit
the same fetch restrictions documented in `CHAT-SUMMARY.md`) or receive the
glossary from the parent bar over `postMessage`, alongside the `rise-lang`
message. Not yet built — flagging here so it isn't lost.

---

## Files this feature touches

| File | What changed |
|---|---|
| `risecoursetranslate.js` | Added `broadcastLangToBlocks()`, the `rise-ready` listener, the `data-tc-managed` skip in `getTranslateRoots()`, and broadcast calls on language select, reset, and init. Everything else unchanged from v1.9.1. |
| `translate-core.js` | New file. Self-contained code-block translator. |
| `code-block.html` | New file. Worked example/demo of a code block using `translate-core.js`. |

*This feature was prototyped in a separate test repo
(`Rise_Translate_Test_v1.0`) and merged into the main repo at v1.10.0.*

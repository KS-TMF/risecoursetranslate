/* =====================================================================
   translate-core.js  -  shared translation engine for Rise code blocks
   ---------------------------------------------------------------------
   v1.0 — merged into the risecoursetranslate repo (was tested standalone
   in Rise_Translate_Test_v1.0). Load from:
     https://cdn.jsdelivr.net/gh/KS-TMF/risecoursetranslate@main/translate-core.js
   Works alongside risecoursetranslate.js v1.10.0+, which broadcasts the
   selected language to any code block loading this file, and skips
   translating this block's insides itself. See CODE-BLOCKS.md.

   One shared file, loaded by every code block through a single script
   tag from the CDN. Change the engine here once and every block that
   loads this file switches with it. You never open the blocks.

   WHAT IT DOES
     - Reads the course language: from the parent course page when
       embedded, or from its own small selector when standalone.
     - Translates all learner-facing text in the block: HTML text,
       SVG <text>/<tspan>, and attributes (aria-label, title, alt,
       placeholder).
     - Catches content revealed later (click to open) with an observer.
     - Caches each phrase so it is fetched once per language.
     - Preserves anything marked data-notranslate, plus the KEEP list.

   ENGINE SWAP -> see the [ENGINE] section. One constant changes it for
   every block in the course.
   ===================================================================== */
(function () {
  "use strict";

  // Mark this document so a course-level bar (risecoursetranslate.js) knows
  // this block manages its own translation, and skips walking its insides.
  try { document.documentElement.setAttribute("data-tc-managed", "1"); } catch (e) {}
  try { window.TRANSLATE_CORE_VERSION = "1.2"; } catch (e) {}
  var STORAGE_KEY = "rise_course_lang";
  var GLOSSARY_STORAGE_KEY = "rise_course_glossary_keep";
  try { window.TC_STATS = window.TC_STATS || { observerFires: 0, cacheReapplies: 0, fullPasses: 0, netFetches: 0 }; } catch (e) {}
  // Set window.TC_DEBUG = true (before or after load) to log the counters
  // every two seconds. A fast-climbing cacheReapplies count means a block is
  // fighting the engine; a near-flat count means it is stable.
  setInterval(function () {
    if (window.TC_DEBUG && window.TC_STATS) {
      try { console.log("[translate-core]", JSON.stringify(window.TC_STATS)); } catch (e) {}
    }
  }, 2000);

  /* ---------------------------- [CONFIG] ---------------------------- */
  var ENGINE = "google";                 // "google" or "deepl"
  var ATTRS  = ["aria-label", "title", "alt", "placeholder"];
  var KEEP   = ["TM Forum", "ODA", "AN", "SLA"];
  var courseKeep = [];

  function trimTerm(t) {
    return String(t).replace(/\u00a0/g, " ").trim();
  }

  function getKeepList() {
    var seen = {};
    var out = [];
    function add(term) {
      term = trimTerm(term);
      if (!term || seen[term]) return;
      seen[term] = true;
      out.push(term);
    }
    KEEP.forEach(add);
    courseKeep.forEach(add);
    out.sort(function (a, b) { return b.length - a.length; });
    return out;
  }

  function syncGlossaryFromStorage() {
    try {
      var raw = sessionStorage.getItem(GLOSSARY_STORAGE_KEY);
      if (!raw) return false;
      var parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return false;
      var next = parsed.map(trimTerm).filter(Boolean);
      var changed = JSON.stringify(next) !== JSON.stringify(courseKeep);
      courseKeep = next;
      if (changed) {
        cache = {};
        lastApplied = null;
        if (currentLang !== "en") setLang(currentLang);
      }
      return true;
    } catch (e) {
      return false;
    }
  }

  function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  function buildTermPattern(term) {
    var escaped = escapeRegex(term);
    var prefix = /^\w/.test(term) ? '\\b' : '';
    var suffix = /\w$/.test(term) ? '\\b' : '';
    return prefix + escaped + suffix;
  }

  function findGlossaryMatches(text, keepList) {
    var all = [];
    var i, term, re, m;
    if (!text || !keepList.length) return [];
    for (i = 0; i < keepList.length; i++) {
      term = keepList[i];
      if (!term) continue;
      re = new RegExp(buildTermPattern(term), "gi");
      while ((m = re.exec(text)) !== null) {
        all.push({ start: m.index, end: m.index + m[0].length });
        if (m[0].length === 0) re.lastIndex++;
      }
    }
    all.sort(function (a, b) {
      var lenDiff = (b.end - b.start) - (a.end - a.start);
      if (lenDiff !== 0) return lenDiff;
      return a.start - b.start;
    });
    var picked = [];
    all.forEach(function (match) {
      var overlaps = picked.some(function (p) {
        return !(match.end <= p.start || match.start >= p.end);
      });
      if (!overlaps) picked.push(match);
    });
    picked.sort(function (a, b) { return a.start - b.start; });
    return picked;
  }

  function buildSegments(text, matches) {
    var segments = [];
    var pos = 0;
    var i, m;
    for (i = 0; i < matches.length; i++) {
      m = matches[i];
      if (m.start > pos) segments.push({ type: "text", value: text.slice(pos, m.start) });
      segments.push({ type: "term", value: text.slice(m.start, m.end) });
      pos = m.end;
    }
    if (pos < text.length) segments.push({ type: "text", value: text.slice(pos) });
    if (!segments.length) segments.push({ type: "text", value: text });
    return segments;
  }

  function assembleFromSegments(segments, translatedParts) {
    var ti = 0;
    return segments.map(function (seg) {
      if (seg.type === "term") return seg.value;
      if (trimTerm(seg.value).length < 2) return seg.value;
      return translatedParts[ti++] || seg.value;
    }).join("");
  }

  function translateProtected(text, target) {
    var src = String(text);
    var keepList = getKeepList();
    var matches = findGlossaryMatches(src, keepList);
    if (!matches.length) return translateText(src, target);
    var segments = buildSegments(src, matches);
    var parts = [];
    segments.forEach(function (seg) {
      if (seg.type === "text" && trimTerm(seg.value).length >= 2) parts.push(seg.value);
    });
    if (!parts.length) return Promise.resolve(src);
    return Promise.all(parts.map(function (part) { return translateText(part, target); }))
      .then(function (translated) { return assembleFromSegments(segments, translated); });
  }
  var LANGS  = [
    { code: "en", name: "English" },
    { code: "fr", name: "French" },
    { code: "de", name: "German" },
    { code: "es", name: "Spanish" },
    { code: "ja", name: "Japanese" },
    { code: "ko", name: "Korean" }
  ];

  /* ---------------------------- [ENGINE] ----------------------------
     The one place to change the provider. Every block using this file
     picks up whatever is set here.
     ------------------------------------------------------------------ */
  function translateText(text, target) {
    if (ENGINE === "deepl") return deeplTranslate(text, target);
    return googleTranslate(text, target);
  }

  function googleTranslate(text, target) {
    var url = "https://translate.googleapis.com/translate_a/single"
      + "?client=gtx&sl=auto&tl=" + encodeURIComponent(target)
      + "&dt=t&q=" + encodeURIComponent(text);
    return fetch(url).then(function (r) {
      if (!r.ok) throw new Error("google " + r.status);
      return r.json();
    }).then(function (d) {
      return d[0].map(function (seg) { return seg[0]; }).join("");
    });
  }

  // Production: replace the body with a fetch to your DeepL proxy so the
  // API key stays server-side. Kept as a visible stub so the engine swap
  // is demonstrable before the proxy exists.
  function deeplTranslate(text, target) {
    return Promise.resolve("\u00BB " + text);   // marker shows the swap took effect
  }

  /* ---------------------------- state ------------------------------- */
  var root = null;
  var cache = {};                    // key: lang|source -> translation
  var originalText = new WeakMap();  // text node -> original value
  var originalAttr = new WeakMap();  // element -> { attr: original value }
  var currentLang = "en";
  var lastApplied = null;
  var applyGen = 0;
  var translating = false;
  var rerunQueued = false;
  var parentControls = false;

  /* ---------------------------- [OBSERVE] --------------------------- */
  var observer = new MutationObserver(function () {
    if (window.TC_STATS) window.TC_STATS.observerFires++;
    if (currentLang === "en") return;
    reapplyFromCache();
    if (translating) { rerunQueued = true; return; }
    clearTimeout(observer._t);
    observer._t = setTimeout(function () { applyLanguage(currentLang); }, 250);
  });

  /* ---------------------------- [REACH] ----------------------------- */
  function collectTextNodes() {
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: function (node) {
        if (!node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
        var p = node.parentElement;
        if (!p) return NodeFilter.FILTER_REJECT;
        var tag = p.tagName.toLowerCase();
        if (tag === "script" || tag === "style") return NodeFilter.FILTER_REJECT;
        if (p.closest("[data-notranslate]")) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    var out = [], n;
    while ((n = walker.nextNode())) out.push(n);
    return out;
  }

  function collectAttrTargets() {
    var out = [];
    root.querySelectorAll("*").forEach(function (el) {
      if (el.closest("[data-notranslate]")) return;
      ATTRS.forEach(function (a) {
        if (el.hasAttribute(a) && el.getAttribute(a).trim()) out.push({ el: el, attr: a });
      });
    });
    return out;
  }

  /* ---------------------------- [APPLY] ----------------------------- */
  function lookup(src, lang) {
    var key = lang + "|" + src;
    if (Object.prototype.hasOwnProperty.call(cache, key)) {
      return Promise.resolve({ value: cache[key], cached: true });
    }
    if (KEEP.indexOf(src) !== -1) {
      cache[key] = src;
      return Promise.resolve({ value: src, cached: false });
    }
    var keepList = getKeepList();
    if (keepList.indexOf(src) !== -1) {
      cache[key] = src;
      return Promise.resolve({ value: src, cached: false });
    }
    if (window.TC_STATS) window.TC_STATS.netFetches++;
    return translateProtected(src, lang).then(function (out) {
      cache[key] = out;
      return { value: out, cached: false };
    });
  }

  function cacheGet(lang, src) {
    var key = lang + "|" + src;
    return Object.prototype.hasOwnProperty.call(cache, key) ? cache[key] : null;
  }
  function langName(lang) {
    for (var i = 0; i < LANGS.length; i++) if (LANGS[i].code === lang) return LANGS[i].name;
    return lang;
  }

  // Instant, cache-only correction. Runs inside the observer callback, which
  // fires before the browser paints, so if a block swaps in text we have
  // already translated (a height measure, a re-render, a settle-back), we
  // snap it to the translation in the same tick and the English never shows.
  // Block-agnostic: no knowledge of the block is needed, and blocks are not
  // edited. Text only, and cache only. Genuinely new text is left for the
  // debounced full pass, which fetches it.
  function reapplyFromCache() {
    if (!root || currentLang === "en") return;
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: function (node) {
        if (!node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
        var p = node.parentElement;
        if (!p) return NodeFilter.FILTER_REJECT;
        var tag = p.tagName.toLowerCase();
        if (tag === "script" || tag === "style") return NodeFilter.FILTER_REJECT;
        if (p.closest("[data-notranslate]")) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    var n;
    while ((n = walker.nextNode())) {
      var original = originalText.has(n) ? originalText.get(n) : n.nodeValue;
      var src = original.trim();
      var val = cacheGet(currentLang, src);
      if (val == null) continue;
      var target = original.replace(src, val);
      if (n.nodeValue !== target) {
        if (!originalText.has(n)) originalText.set(n, n.nodeValue);
        n.nodeValue = target;
        if (window.TC_STATS) window.TC_STATS.cacheReapplies++;
      }
    }
  }

  async function applyLanguage(lang) {
    if (!root) return;
    var myGen = ++applyGen;          // a newer call supersedes this one
    translating = true;
    if (window.TC_STATS) window.TC_STATS.fullPasses++;
    try {
      var nodes = collectTextNodes();
      var attrs = collectAttrTargets();

      // Gather the unique English source strings to translate.
      var uniq = {};
      nodes.forEach(function (node) {
        if (!originalText.has(node)) originalText.set(node, node.nodeValue);
        var s = originalText.get(node).trim();
        if (s) uniq[s] = true;
      });
      attrs.forEach(function (t) {
        if (!originalAttr.has(t.el)) originalAttr.set(t.el, {});
        var store = originalAttr.get(t.el);
        if (store[t.attr] === undefined) store[t.attr] = t.el.getAttribute(t.attr);
        var s = store[t.attr].trim();
        if (s) uniq[s] = true;
      });
      var list = Object.keys(uniq);

      // Translate uniques with limited concurrency, filling the cache.
      var idx = 0, done = 0;
      async function worker() {
        while (idx < list.length) {
          if (myGen !== applyGen) return;
          var s = list[idx++];
          await lookup(s, lang);
          done++;
          setStatus("translating " + done + "/" + list.length);
        }
      }
      var pool = [];
      for (var p = 0; p < 6; p++) pool.push(worker());
      await Promise.all(pool);
      if (myGen !== applyGen) return;   // superseded, do not paint stale text

      // Write everything from cache in one fast pass.
      nodes.forEach(function (node) {
        var original = originalText.get(node);
        var src = original.trim();
        var val = cacheGet(lang, src);
        if (val == null) return;
        var target = original.replace(src, val);
        if (node.nodeValue !== target) node.nodeValue = target;
      });
      attrs.forEach(function (t) {
        var store = originalAttr.get(t.el);
        var src = store[t.attr].trim();
        var val = cacheGet(lang, src);
        if (val != null) t.el.setAttribute(t.attr, val);
      });
      setStatus(langName(lang));
    } finally {
      if (myGen === applyGen) {
        translating = false;
        if (rerunQueued) {
          rerunQueued = false;
          clearTimeout(observer._t);
          observer._t = setTimeout(function () { applyLanguage(currentLang); }, 50);
        }
      }
    }
  }

  function resetAll() {
    if (!root) return;
    translating = true;
    try {
      collectAttrTargets().forEach(function (t) {
        if (originalAttr.has(t.el)) {
          var store = originalAttr.get(t.el);
          if (store[t.attr] !== undefined) t.el.setAttribute(t.attr, store[t.attr]);
        }
      });
      var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
      var n;
      while ((n = walker.nextNode())) {
        if (originalText.has(n)) n.nodeValue = originalText.get(n);
      }
      setStatus("English");
    } finally {
      translating = false;
    }
  }

  /* ---------------------- language selection ------------------------ */
  function setLang(lang) {
    currentLang = lang || "en";
    var sel = document.getElementById("tc-lang");
    if (sel && sel.value !== currentLang) sel.value = currentLang;
    if (currentLang === lastApplied) return;   // already showing this language
    if (currentLang === "en") {
      lastApplied = currentLang;
      resetAll();
      return;
    }
    var pending = currentLang;
    applyLanguage(currentLang).catch(function (e) {
      lastApplied = null;   // allow a retry after a failure
      setStatus("error: " + e.message + " (endpoint blocked or rate limited)");
    }).then(function () {
      if (pending === currentLang) lastApplied = currentLang;
    });
  }

  // Parent course page (the one-liner bar) drives the block.
  var gotLang = false;
  window.addEventListener("message", function (ev) {
    var d = ev.data || {};
    if (d.type === "rise-lang" && typeof d.lang === "string") {
      gotLang = true;
      parentControls = true;
      hideOwnSelector();
      setLang(d.lang);
    }
  });

  // Ask the course bar which language to show. Rise nests code blocks several
  // iframes deep and posting only to window.top often misses the page that
  // loaded risecoursetranslate.js (for example when the LMS wraps the course).
  // Announce to every ancestor window, not just top.
  function announceReady() {
    var w = window;
    while (w) {
      try { w.postMessage({ type: "rise-ready" }, "*"); } catch (e) {}
      if (!w.parent || w.parent === w) break;
      w = w.parent;
    }
  }
  if (window.parent && window.parent !== window) {
    announceReady();
    setInterval(announceReady, 1200);
  }

  // Same-origin fallback when postMessage does not reach the course bar
  // (common in Rise xAPI packages). The bar stores the active language in
  // sessionStorage; the storage event fires in sibling iframes.
  function syncLangFromStorage() {
    var lang;
    try { lang = sessionStorage.getItem(STORAGE_KEY); } catch (e) { return; }
    if (!lang) lang = "en";
    if (lang !== "en") {
      parentControls = true;
      hideOwnSelector();
    }
    setLang(lang);
  }
  window.addEventListener("storage", function (ev) {
    if (ev.key === STORAGE_KEY) {
      parentControls = true;
      hideOwnSelector();
      setLang(ev.newValue || "en");
      return;
    }
    if (ev.key === GLOSSARY_STORAGE_KEY) {
      syncGlossaryFromStorage();
      cache = {};
      lastApplied = null;
      if (currentLang !== "en") setLang(currentLang);
    }
  });

  /* ---------------------- own selector (standalone) ----------------- */
  function buildSelector() {
    var bar = document.createElement("div");
    bar.id = "tc-bar";
    bar.setAttribute("data-notranslate", "");
    bar.style.cssText = "font:14px Aptos,'Segoe UI',Arial,sans-serif;margin:0 0 14px;display:flex;gap:8px;align-items:center;color:#0D0B4D;";
    var label = document.createElement("label");
    label.textContent = "Language";
    label.setAttribute("for", "tc-lang");
    var sel = document.createElement("select");
    sel.id = "tc-lang";
    sel.style.cssText = "font:14px Aptos,'Segoe UI',Arial,sans-serif;padding:6px 10px;border:1px solid #E6E6EE;border-radius:8px;";
    LANGS.forEach(function (l) {
      var o = document.createElement("option");
      o.value = l.code; o.textContent = l.name; sel.appendChild(o);
    });
    sel.addEventListener("change", function () { setLang(sel.value); });
    var status = document.createElement("span");
    status.id = "tc-status";
    status.style.cssText = "color:#545A6E;font-size:12px;";
    bar.appendChild(label); bar.appendChild(sel); bar.appendChild(status);
    document.body.insertBefore(bar, document.body.firstChild);
  }
  function hideOwnSelector() { var b = document.getElementById("tc-bar"); if (b) b.style.display = "none"; }
  function setStatus(m) { var s = document.getElementById("tc-status"); if (s) s.textContent = m; }

  /* ---------------------------- init -------------------------------- */
  function init() {
    root = document.body;
    observer.observe(root, { childList: true, subtree: true });
    // Standalone demo pages get their own selector; embedded Rise blocks
    // inherit the course bar and only show a fallback if nothing connects.
    if (window.parent === window) {
      buildSelector();
    } else {
      syncGlossaryFromStorage();
      syncLangFromStorage();
      setInterval(syncGlossaryFromStorage, 2000);
      setInterval(syncLangFromStorage, 800);
      setTimeout(function () {
        if (!parentControls) buildSelector();
      }, 5000);
    }
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

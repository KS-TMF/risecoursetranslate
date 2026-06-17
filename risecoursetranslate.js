/*!
 * risecoursetranslate.js — Rise & Storyline Course Translator
 * Drop-in: add to index.html:
 *   <script src="https://cdn.jsdelivr.net/gh/Moyour/risecoursetranslate@1.0/risecoursetranslate.js" defer></script>
 * Uses Google Translate (free endpoint). No API key required.
 * v1.0
 */
(function () {
  'use strict';

  /* ── CONFIG ────────────────────────────────────────────────────── */
  var LANGUAGES = [
    { code: 'af', label: '🇿🇦 Afrikaans' },
    { code: 'ar', label: '🇸🇦 Arabic', rtl: true },
    { code: 'zh', label: '🇨🇳 Chinese (Simplified)' },
    { code: 'zh-TW', label: '🇹🇼 Chinese (Traditional)' },
    { code: 'hr', label: '🇭🇷 Croatian' },
    { code: 'cs', label: '🇨🇿 Czech' },
    { code: 'da', label: '🇩🇰 Danish' },
    { code: 'nl', label: '🇳🇱 Dutch' },
    { code: 'fi', label: '🇫🇮 Finnish' },
    { code: 'fr', label: '🇫🇷 French' },
    { code: 'de', label: '🇩🇪 German' },
    { code: 'el', label: '🇬🇷 Greek' },
    { code: 'gu', label: '🇮🇳 Gujarati' },
    { code: 'ha', label: '🇳🇬 Hausa' },
    { code: 'hi', label: '🇮🇳 Hindi' },
    { code: 'hu', label: '🇭🇺 Hungarian' },
    { code: 'id', label: '🇮🇩 Indonesian' },
    { code: 'it', label: '🇮🇹 Italian' },
    { code: 'ja', label: '🇯🇵 Japanese' },
    { code: 'ko', label: '🇰🇷 Korean' },
    { code: 'ms', label: '🇲🇾 Malay' },
    { code: 'mr', label: '🇮🇳 Marathi' },
    { code: 'ne', label: '🇳🇵 Nepali' },
    { code: 'no', label: '🇳🇴 Norwegian' },
    { code: 'fa', label: '🇮🇷 Persian', rtl: true },
    { code: 'pl', label: '🇵🇱 Polish' },
    { code: 'pt', label: '🇧🇷 Portuguese' },
    { code: 'pa', label: '🇮🇳 Punjabi' },
    { code: 'ro', label: '🇷🇴 Romanian' },
    { code: 'ru', label: '🇷🇺 Russian' },
    { code: 'so', label: '🇸🇴 Somali' },
    { code: 'es', label: '🇪🇸 Spanish' },
    { code: 'sw', label: '🇰🇪 Swahili' },
    { code: 'sv', label: '🇸🇪 Swedish' },
    { code: 'tl', label: '🇵🇭 Tagalog' },
    { code: 'ta', label: '🇮🇳 Tamil' },
    { code: 'te', label: '🇮🇳 Telugu' },
    { code: 'th', label: '🇹🇭 Thai' },
    { code: 'tr', label: '🇹🇷 Turkish' },
    { code: 'uk', label: '🇺🇦 Ukrainian' },
    { code: 'ur', label: '🇵🇰 Urdu', rtl: true },
    { code: 'vi', label: '🇻🇳 Vietnamese' },
    { code: 'cy', label: '🏴󠁧󠁢󠁷󠁬󠁳󠁿 Welsh' },
    { code: 'yo', label: '🇳🇬 Yoruba' },
    { code: 'zu', label: '🇿🇦 Zulu' }
  ];

  var STORAGE_KEY = 'rise_course_lang';
  var BAR_ID      = 'rise-translate-bar';
  var cache       = {};          // { langCode: { originalText: translatedText } }
  var originalMap = new Map();   // node → original text

  /* ── BAR STYLES ────────────────────────────────────────────────── */
  var css = [
    '#' + BAR_ID + '{',
    '  position:fixed;top:0;left:0;right:0;z-index:99999;',
    '  display:flex;align-items:center;gap:10px;padding:8px 16px;',
    '  background:#1a1a2e;color:#fff;font-family:sans-serif;font-size:13px;',
    '  box-shadow:0 2px 8px rgba(0,0,0,0.35);',
    '}',
    '#' + BAR_ID + ' label{opacity:.8;white-space:nowrap;user-select:none;}',
    '#' + BAR_ID + ' select{',
    '  background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.25);',
    '  color:#fff;border-radius:5px;padding:5px 8px;font-size:13px;cursor:pointer;',
    '  max-width:220px;',
    '}',
    '#' + BAR_ID + ' select option{background:#1a1a2e;color:#fff;}',
    '#' + BAR_ID + ' .rise-status{font-size:11px;opacity:.55;margin-left:auto;}',
    '#' + BAR_ID + ' .rise-spinner{',
    '  width:14px;height:14px;border:2px solid rgba(255,255,255,.3);',
    '  border-top-color:#fff;border-radius:50%;',
    '  animation:rise-spin .6s linear infinite;display:none;',
    '}',
    '@keyframes rise-spin{to{transform:rotate(360deg)}}',
    'body.rise-has-bar{padding-top:42px !important;margin-top:0 !important;}'
  ].join('\n');

  /* ── INIT ──────────────────────────────────────────────────────── */
  function init() {
    injectStyles();
    injectBar();
    var saved = getSavedLang();
    if (saved) {
      document.getElementById('rise-select').value = saved;
      translatePage(saved);
    }
  }

  function injectStyles() {
    var s = document.createElement('style');
    s.textContent = css;
    document.head.appendChild(s);
  }

  function injectBar() {
    var bar = document.createElement('div');
    bar.id = BAR_ID;

    var label = document.createElement('label');
    label.setAttribute('for', 'rise-select');
    label.textContent = '🌐 Translate:';

    var sel = document.createElement('select');
    sel.id = 'rise-select';
    sel.setAttribute('aria-label', 'Select course language');

    var defaultOpt = new Option('Select language…', '');
    sel.appendChild(defaultOpt);
    LANGUAGES.forEach(function (l) {
      sel.appendChild(new Option(l.label, l.code));
    });

    var spinner = document.createElement('div');
    spinner.className = 'rise-spinner';
    spinner.setAttribute('aria-hidden', 'true');

    var status = document.createElement('span');
    status.className = 'rise-status';
    status.textContent = 'Powered by Google Translate';

    sel.addEventListener('change', function () {
      var lang = this.value;
      if (!lang) {
        restorePage();
        clearSavedLang();
        status.textContent = 'Powered by Google Translate';
        return;
      }
      saveLang(lang);
      translatePage(lang, spinner, status);
    });

    bar.appendChild(label);
    bar.appendChild(sel);
    bar.appendChild(spinner);
    bar.appendChild(status);

    document.body.insertBefore(bar, document.body.firstChild);
    document.body.classList.add('rise-has-bar');
  }

  /* ── TEXT NODE COLLECTION ──────────────────────────────────────── */
  function getTextNodes() {
    var skip  = ['SCRIPT','STYLE','NOSCRIPT','IFRAME','OPTION','SELECT',BAR_ID.toUpperCase()];
    var nodes = [];
    var walk  = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: function (node) {
          var p = node.parentElement;
          if (!p) return NodeFilter.FILTER_REJECT;
          if (p.id === BAR_ID) return NodeFilter.FILTER_REJECT;
          if (p.closest && p.closest('#' + BAR_ID)) return NodeFilter.FILTER_REJECT;
          if (skip.indexOf(p.nodeName) !== -1) return NodeFilter.FILTER_REJECT;
          var txt = node.nodeValue.trim();
          if (!txt || txt.length < 2) return NodeFilter.FILTER_SKIP;
          return NodeFilter.FILTER_ACCEPT;
        }
      }
    );
    var n;
    while ((n = walk.nextNode())) nodes.push(n);
    return nodes;
  }

  /* ── TRANSLATION ───────────────────────────────────────────────── */
  function translatePage(lang, spinner, status) {
    var nodes = getTextNodes();
    var toTranslate = [];

    /* collect original texts & determine what still needs translating */
    nodes.forEach(function (node) {
      if (!originalMap.has(node)) originalMap.set(node, node.nodeValue);
      var orig = originalMap.get(node).trim();
      if (orig.length < 2) return;
      cache[lang] = cache[lang] || {};
      if (!cache[lang][orig]) toTranslate.push(orig);
    });

    toTranslate = unique(toTranslate);

    /* set RTL if needed */
    var langObj = LANGUAGES.find(function (l) { return l.code === lang; });
    document.body.style.direction = (langObj && langObj.rtl) ? 'rtl' : '';

    if (toTranslate.length === 0) {
      applyTranslations(nodes, lang);
      return;
    }

    if (spinner) spinner.style.display = 'block';
    if (status)  status.textContent = 'Translating…';

    batchTranslate(toTranslate, lang, function (err) {
      if (spinner) spinner.style.display = 'none';
      if (err) {
        if (status) status.textContent = 'Translation failed — check console';
        console.warn('[risecoursetranslate] Error:', err);
        return;
      }
      applyTranslations(nodes, lang);
      if (status) status.textContent = 'Translated to ' + (langObj ? langObj.label : lang);
    });
  }

  function applyTranslations(nodes, lang) {
    nodes.forEach(function (node) {
      var orig = originalMap.get(node);
      if (!orig) return;
      var trimmed = orig.trim();
      if (cache[lang] && cache[lang][trimmed]) {
        /* preserve leading/trailing whitespace */
        var lead  = orig.match(/^\s*/)[0];
        var trail = orig.match(/\s*$/)[0];
        node.nodeValue = lead + cache[lang][trimmed] + trail;
      }
    });
  }

  /* ── GOOGLE TRANSLATE (free endpoint, batch) ───────────────────── */
  /*
   * We chunk into batches of 50 strings, joined by \n.
   * Google's free endpoint supports ~5000 chars per request.
   * If you prefer DeepL, swap this function — same signature.
   */
  var CHUNK_SIZE = 50;

  function batchTranslate(texts, lang, done) {
    var chunks = chunkArray(texts, CHUNK_SIZE);
    var pending = chunks.length;
    var errored = null;

    if (pending === 0) return done(null);

    chunks.forEach(function (chunk) {
      googleTranslate(chunk, lang, function (err, results) {
        if (errored) return;
        if (err) { errored = err; return done(err); }
        chunk.forEach(function (orig, i) {
          cache[lang][orig] = results[i] || orig;
        });
        pending--;
        if (pending === 0) done(null);
      });
    });
  }

  function googleTranslate(texts, targetLang, cb) {
    /* join texts with a delimiter unlikely to appear in course text */
    var SEP = '\n||||\n';
    var joined = texts.join(SEP);

    var url = 'https://translate.googleapis.com/translate_a/single'
      + '?client=gtx'
      + '&sl=auto'
      + '&tl=' + encodeURIComponent(targetLang)
      + '&dt=t'
      + '&q=' + encodeURIComponent(joined);

    fetch(url)
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(function (data) {
        /* Google returns [ [[translated, original, ...], ...], ... ] */
        var raw = '';
        if (data && data[0]) {
          data[0].forEach(function (seg) { if (seg && seg[0]) raw += seg[0]; });
        }
        var parts = raw.split('||||').map(function (s) { return s.replace(/^\n|\n$/g, ''); });
        cb(null, parts);
      })
      .catch(function (err) { cb(err, null); });
  }

  /* ── RESTORE ────────────────────────────────────────────────────── */
  function restorePage() {
    originalMap.forEach(function (orig, node) {
      node.nodeValue = orig;
    });
    document.body.style.direction = '';
  }

  /* ── PERSISTENCE ────────────────────────────────────────────────── */
  function saveLang(lang)   { try { sessionStorage.setItem(STORAGE_KEY, lang); } catch(e){} }
  function clearSavedLang() { try { sessionStorage.removeItem(STORAGE_KEY);    } catch(e){} }
  function getSavedLang()   { try { return sessionStorage.getItem(STORAGE_KEY); } catch(e){ return null; } }

  /* ── UTILS ──────────────────────────────────────────────────────── */
  function unique(arr) {
    var seen = {};
    return arr.filter(function (v) { return seen[v] ? false : (seen[v] = true); });
  }
  function chunkArray(arr, size) {
    var out = [];
    for (var i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
    return out;
  }

  /* ── WAIT FOR DOM ────────────────────────────────────────────────── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  /*
   * ── FOR SINGLE-PAGE / RISE SLIDE NAVIGATION ──────────────────────
   * Rise loads content dynamically. We re-scan on URL hash changes
   * and on mutations inside the main content area.
   */
  var activeTranslation = null;

  window.addEventListener('hashchange', function () {
    if (activeTranslation) setTimeout(function () { translatePage(activeTranslation); }, 400);
  });

  var observer = new MutationObserver(function (mutations) {
    if (!activeTranslation) return;
    var relevant = mutations.some(function (m) {
      return m.addedNodes.length > 0 || m.type === 'characterData';
    });
    if (relevant) {
      clearTimeout(observer._t);
      observer._t = setTimeout(function () { translatePage(activeTranslation); }, 600);
    }
  });

  /* start observing after bar is injected */
  document.addEventListener('DOMContentLoaded', function () {
    var target = document.querySelector('#app, #root, .content-wrapper, body') || document.body;
    observer.observe(target, { childList: true, subtree: true, characterData: false });

    /* keep track of current lang for re-scan */
    var sel = document.getElementById('rise-select');
    if (sel) sel.addEventListener('change', function () { activeTranslation = this.value || null; });
  });

})();

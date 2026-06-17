/*!
 * risecoursetranslate.js — Rise & Storyline Course Translator
 * Drop-in — use this one link in your Rise index.html (always latest):
 *   <script src="https://cdn.jsdelivr.net/gh/Moyour/risecoursetranslate@main/risecoursetranslate.js" defer></script>
 */
(function () {
  'use strict';

  /* ── CONFIG ────────────────────────────────────────────────────── */
  var LANGUAGES = [
    { code: 'en', label: '🇬🇧 English' },
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

  var DEEPL_LANG_MAP = {
    ar: 'AR', bg: 'BG', cs: 'CS', da: 'DA', de: 'DE', el: 'EL', en: 'EN-GB',
    es: 'ES', et: 'ET', fi: 'FI', fr: 'FR', hu: 'HU', id: 'ID', it: 'IT',
    ja: 'JA', ko: 'KO', lt: 'LT', lv: 'LV', nl: 'NL', no: 'NB', pl: 'PL',
    pt: 'PT-BR', ro: 'RO', ru: 'RU', sk: 'SK', sl: 'SL', sv: 'SV', th: 'TH',
    tr: 'TR', uk: 'UK', vi: 'VI', zh: 'ZH', 'zh-TW': 'ZH-HANT'
  };

  var STORAGE_KEY = 'rise_course_lang';
  var BAR_ID      = 'rise-translate-bar';
  var cache       = {};          // { langCode: { originalText: translatedText } }
  var originalMap = new Map();   // node → original text

  /* Rise cover Start button selectors (published export) */
  var START_SELECTORS = [
    'a.cover__header-content-action-link',
    '.cover__header-content-action-link',
    'button.cover__header-content-action-link',
    '[class*="cover"][class*="action-link"]'
  ];

  /* ── BAR STYLES ────────────────────────────────────────────────── */
  var css = [
    '#' + BAR_ID + '{',
    '  display:flex;align-items:center;justify-content:center;flex-wrap:wrap;gap:8px 10px;',
    '  width:100%;box-sizing:border-box;margin-top:14px;padding:0;',
    '  font-family:sans-serif;font-size:13px;color:inherit;',
    '}',
    '#' + BAR_ID + '.rise-translate-bar--floating{',
    '  position:fixed;bottom:16px;right:16px;left:auto;top:auto;z-index:99999;',
    '  width:auto;max-width:calc(100vw - 32px);margin-top:0;padding:10px 14px;',
    '  background:rgba(26,26,46,.92);color:#fff;border-radius:10px;',
    '  box-shadow:0 4px 16px rgba(0,0,0,.25);',
    '}',
    '#' + BAR_ID + ' select{',
    '  background:rgba(255,255,255,.92);border:1px solid rgba(0,0,0,.15);',
    '  color:#222;border-radius:6px;padding:6px 8px;font-size:13px;cursor:pointer;',
    '  max-width:220px;',
    '}',
    '#' + BAR_ID + '.rise-translate-bar--floating select{',
    '  background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.25);color:#fff;',
    '}',
    '#' + BAR_ID + ' select option{background:#fff;color:#222;}',
    '#' + BAR_ID + '.rise-translate-bar--floating select option{background:#1a1a2e;color:#fff;}',
    '#' + BAR_ID + ' .rise-status{font-size:11px;opacity:.55;min-height:0;}',
    '#' + BAR_ID + ' .rise-status:empty{display:none;}',
    '#' + BAR_ID + '.rise-translate-bar--floating .rise-status{margin-left:4px;}',
    '#' + BAR_ID + ' .rise-spinner{',
    '  width:14px;height:14px;border:2px solid rgba(0,0,0,.15);',
    '  border-top-color:#333;border-radius:50%;',
    '  animation:rise-spin .6s linear infinite;display:none;flex-shrink:0;',
    '}',
    '#' + BAR_ID + '.rise-translate-bar--floating .rise-spinner{',
    '  border-color:rgba(255,255,255,.3);border-top-color:#fff;',
    '}',
    '@keyframes rise-spin{to{transform:rotate(360deg)}}'
  ].join('\n');

  /* ── INIT ──────────────────────────────────────────────────────── */
  function getConfig() {
    var script = document.currentScript
      || document.querySelector('script[src*="risecoursetranslate"]');
    var provider = (script && script.getAttribute('data-provider')) || 'google';
    return {
      provider: provider === 'deepl' ? 'deepl' : 'google',
      deeplProxyUrl: (script && script.getAttribute('data-deepl-proxy')) || ''
    };
  }

  function mapToDeepLCode(code) {
    return DEEPL_LANG_MAP[code] || null;
  }

  function getLanguages() {
    var cfg = getConfig();
    if (cfg.provider !== 'deepl') return LANGUAGES;
    return LANGUAGES.filter(function (l) {
      return l.code === 'en' || mapToDeepLCode(l.code);
    });
  }

  function isOriginalLanguage(code) {
    return !code || code === 'en';
  }

  function init() {
    injectStyles();
    waitForCourseShell(function () {
      placeBar();
      var saved = getSavedLang();
      if (saved && !isOriginalLanguage(saved)) {
        var sel = document.getElementById('rise-select');
        if (sel) {
          sel.value = saved;
          translatePage(saved);
        }
      }
    });
  }

  function injectStyles() {
    var s = document.createElement('style');
    s.textContent = css;
    document.head.appendChild(s);
  }

  function isVisible(el) {
    if (!el || !el.getBoundingClientRect) return false;
    var rect = el.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  }

  function findStartButton() {
    var i, el, candidates, txt, j;
    for (i = 0; i < START_SELECTORS.length; i++) {
      el = document.querySelector(START_SELECTORS[i]);
      if (el && isVisible(el)) return el;
    }
    candidates = document.querySelectorAll('a, button');
    for (j = 0; j < candidates.length; j++) {
      txt = (candidates[j].textContent || '').trim().toLowerCase();
      if (/^(start|begin|start course|resume|continue)$/.test(txt) && isVisible(candidates[j])) {
        return candidates[j];
      }
    }
    return null;
  }

  function waitForCourseShell(done) {
    var finished = false;
    var observer = null;
    function finish() {
      if (finished) return;
      finished = true;
      if (observer) observer.disconnect();
      done();
    }
    if (findStartButton()) {
      finish();
      return;
    }
    observer = new MutationObserver(function () {
      if (findStartButton()) finish();
    });
    observer.observe(document.body, { childList: true, subtree: true });
    setTimeout(finish, 15000);
  }

  function ensureBar() {
    var bar = document.getElementById(BAR_ID);
    if (bar) return bar;

    bar = document.createElement('div');
    bar.id = BAR_ID;

    var sel = document.createElement('select');
    sel.id = 'rise-select';
    sel.setAttribute('aria-label', 'Select course language');

    getLanguages().forEach(function (l) {
      sel.appendChild(new Option(l.label, l.code));
    });
    sel.value = getSavedLang() || 'en';

    var spinner = document.createElement('div');
    spinner.className = 'rise-spinner';
    spinner.setAttribute('aria-hidden', 'true');

    var status = document.createElement('span');
    status.className = 'rise-status';
    status.textContent = '';

    sel.addEventListener('change', function () {
      var lang = this.value;
      if (isOriginalLanguage(lang)) {
        activeTranslation = null;
        restorePage();
        clearSavedLang();
        status.textContent = '';
        return;
      }
      activeTranslation = lang;
      saveLang(lang);
      translatePage(lang, spinner, status);
    });

    bar.appendChild(sel);
    bar.appendChild(spinner);
    bar.appendChild(status);
    return bar;
  }

  function placeBar() {
    var startBtn = findStartButton();
    var bar = ensureBar();
    if (startBtn) {
      bar.classList.remove('rise-translate-bar--floating');
      if (startBtn.nextElementSibling !== bar) {
        startBtn.insertAdjacentElement('afterend', bar);
      }
      return;
    }
    bar.classList.add('rise-translate-bar--floating');
    document.body.appendChild(bar);
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
      if (status) status.textContent = '';
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

  /* ── TRANSLATION PROVIDERS ─────────────────────────────────────── */
  var CHUNK_SIZE = 50;

  function batchTranslate(texts, lang, done) {
    var cfg = getConfig();
    var translateFn = cfg.provider === 'deepl' ? deeplTranslate : googleTranslate;
    var chunks = chunkArray(texts, CHUNK_SIZE);
    var pending = chunks.length;
    var errored = null;

    if (pending === 0) return done(null);

    chunks.forEach(function (chunk) {
      translateFn(chunk, lang, function (err, results) {
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

  function deeplTranslate(texts, targetLang, cb) {
    var cfg = getConfig();
    var deeplCode = mapToDeepLCode(targetLang);

    if (!cfg.deeplProxyUrl) {
      return cb(new Error('DeepL proxy URL missing — set data-deepl-proxy on the script tag'));
    }
    if (!deeplCode) {
      return cb(new Error('Language not supported by DeepL: ' + targetLang));
    }

    fetch(cfg.deeplProxyUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ texts: texts, target_lang: deeplCode })
    })
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(function (data) {
        var results = (data.translations || []).map(function (item) {
          return typeof item === 'string' ? item : item.text;
        });
        cb(null, results);
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
    placeBar();
    if (activeTranslation) setTimeout(function () { translatePage(activeTranslation); }, 400);
  });

  var contentObserver = new MutationObserver(function (mutations) {
    clearTimeout(contentObserver._placeT);
    contentObserver._placeT = setTimeout(placeBar, 300);

    if (!activeTranslation) return;
    var relevant = mutations.some(function (m) {
      return m.addedNodes.length > 0 || m.type === 'characterData';
    });
    if (relevant) {
      clearTimeout(contentObserver._t);
      contentObserver._t = setTimeout(function () { translatePage(activeTranslation); }, 600);
    }
  });

  document.addEventListener('DOMContentLoaded', function () {
    var target = document.querySelector('#app, #root, .content-wrapper, body') || document.body;
    contentObserver.observe(target, {
      childList: true,
      subtree: true,
      characterData: false,
      attributes: true,
      attributeFilter: ['style', 'class', 'hidden']
    });
  });

})();

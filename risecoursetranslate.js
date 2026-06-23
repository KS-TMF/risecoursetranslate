/*!
 * risecoursetranslate.js — Rise & Storyline Course Translator
 * Drop-in: add <script src="risecoursetranslate.js" defer></script> to index.html
 * Uses Google Translate (free endpoint). No API key required.
 * v1.4 — fixed dropdown snapping shut on mobile/touch (stopPropagation on wrap covers click + touchstart)
 */
(function () {
  'use strict';

  /* ── CONFIG ────────────────────────────────────────────────────── */
  var LANGUAGES = [
    { code: 'af', label: 'Afrikaans' },
    { code: 'ar', label: 'Arabic', rtl: true },
    { code: 'zh', label: 'Chinese (Simplified)' },
    { code: 'zh-TW', label: 'Chinese (Traditional)' },
    { code: 'hr', label: 'Croatian' },
    { code: 'cs', label: 'Czech' },
    { code: 'da', label: 'Danish' },
    { code: 'nl', label: 'Dutch' },
    { code: 'fi', label: 'Finnish' },
    { code: 'fr', label: 'French' },
    { code: 'de', label: 'German' },
    { code: 'el', label: 'Greek' },
    { code: 'gu', label: 'Gujarati' },
    { code: 'ha', label: 'Hausa' },
    { code: 'hi', label: 'Hindi' },
    { code: 'hu', label: 'Hungarian' },
    { code: 'id', label: 'Indonesian' },
    { code: 'it', label: 'Italian' },
    { code: 'ja', label: 'Japanese' },
    { code: 'ko', label: 'Korean' },
    { code: 'ms', label: 'Malay' },
    { code: 'mr', label: 'Marathi' },
    { code: 'ne', label: 'Nepali' },
    { code: 'no', label: 'Norwegian' },
    { code: 'fa', label: 'Persian', rtl: true },
    { code: 'pl', label: 'Polish' },
    { code: 'pt', label: 'Portuguese' },
    { code: 'pa', label: 'Punjabi' },
    { code: 'ro', label: 'Romanian' },
    { code: 'ru', label: 'Russian' },
    { code: 'so', label: 'Somali' },
    { code: 'es', label: 'Spanish' },
    { code: 'sw', label: 'Swahili' },
    { code: 'sv', label: 'Swedish' },
    { code: 'tl', label: 'Tagalog' },
    { code: 'ta', label: 'Tamil' },
    { code: 'te', label: 'Telugu' },
    { code: 'th', label: 'Thai' },
    { code: 'tr', label: 'Turkish' },
    { code: 'uk', label: 'Ukrainian' },
    { code: 'ur', label: 'Urdu', rtl: true },
    { code: 'vi', label: 'Vietnamese' },
    { code: 'cy', label: 'Welsh' },
    { code: 'yo', label: 'Yoruba' },
    { code: 'zu', label: 'Zulu' }
  ];

  var STORAGE_KEY  = 'rise_course_lang';
  var BAR_ID       = 'rise-translate-bar';
  var cache        = {};
  var originalMap  = new Map();
  var isObserving  = false;
  var observer     = null;
  var activeTranslation = null;

  /* ── STYLES ─────────────────────────────────────────────────────── */
  var css = [
    '#' + BAR_ID + '{',
    '  position:fixed;top:0;left:0;right:0;z-index:2147483647;',
    '  display:flex;align-items:center;gap:12px;padding:0 16px;height:48px;',
    '  background:#1e1e2e;color:#fff;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;font-size:13px;',
    '  box-shadow:0 2px 12px rgba(0,0,0,0.4);box-sizing:border-box;',
    '}',
    '#' + BAR_ID + ' .rise-bar-label{opacity:.7;white-space:nowrap;font-size:12px;letter-spacing:.3px;}',
    '#' + BAR_ID + ' .rise-dropdown-wrap{position:relative;}',
    '#' + BAR_ID + ' .rise-trigger{',
    '  display:flex;align-items:center;gap:8px;',
    '  background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.2);',
    '  color:#fff;border-radius:8px;padding:6px 12px;font-size:13px;cursor:pointer;',
    '  min-width:180px;justify-content:space-between;user-select:none;',
    '  transition:background .15s;',
    '}',
    '#' + BAR_ID + ' .rise-trigger:hover{background:rgba(255,255,255,.18);}',
    '#' + BAR_ID + ' .rise-trigger .rise-caret{font-size:10px;opacity:.6;transition:transform .2s;}',
    '#' + BAR_ID + ' .rise-trigger.open .rise-caret{transform:rotate(180deg);}',
    '#' + BAR_ID + ' .rise-panel{',
    '  display:none;position:absolute;top:calc(100% + 6px);left:0;',
    '  background:#1e1e2e;border:1px solid rgba(255,255,255,.2);',
    '  border-radius:10px;width:240px;overflow:hidden;',
    '  box-shadow:0 8px 24px rgba(0,0,0,.5);z-index:2147483647;',
    '}',
    '#' + BAR_ID + ' .rise-panel.open{display:block;}',
    '#' + BAR_ID + ' .rise-search{',
    '  width:100%;box-sizing:border-box;padding:10px 12px;',
    '  background:rgba(255,255,255,.08);border:none;border-bottom:1px solid rgba(255,255,255,.1);',
    '  color:#fff;font-size:13px;outline:none;',
    '}',
    '#' + BAR_ID + ' .rise-search::placeholder{color:rgba(255,255,255,.4);}',
    '#' + BAR_ID + ' .rise-list{max-height:260px;overflow-y:auto;padding:4px 0;}',
    '#' + BAR_ID + ' .rise-list::-webkit-scrollbar{width:4px;}',
    '#' + BAR_ID + ' .rise-list::-webkit-scrollbar-track{background:transparent;}',
    '#' + BAR_ID + ' .rise-list::-webkit-scrollbar-thumb{background:rgba(255,255,255,.2);border-radius:4px;}',
    '#' + BAR_ID + ' .rise-option{',
    '  padding:9px 14px;cursor:pointer;font-size:13px;color:rgba(255,255,255,.85);',
    '  transition:background .1s;',
    '}',
    '#' + BAR_ID + ' .rise-option:hover{background:rgba(255,255,255,.1);}',
    '#' + BAR_ID + ' .rise-option.selected{color:#fff;font-weight:500;background:rgba(255,255,255,.12);}',
    '#' + BAR_ID + ' .rise-option.hidden{display:none;}',
    '#' + BAR_ID + ' .rise-reset{',
    '  background:transparent;border:1px solid rgba(255,255,255,.2);color:rgba(255,255,255,.6);',
    '  border-radius:6px;padding:5px 10px;font-size:12px;cursor:pointer;',
    '  transition:all .15s;white-space:nowrap;',
    '}',
    '#' + BAR_ID + ' .rise-reset:hover{border-color:rgba(255,255,255,.5);color:#fff;}',
    '#' + BAR_ID + ' .rise-status{font-size:11px;opacity:.45;margin-left:auto;white-space:nowrap;}',
    '#' + BAR_ID + ' .rise-spinner{',
    '  width:14px;height:14px;border:2px solid rgba(255,255,255,.25);',
    '  border-top-color:#fff;border-radius:50%;flex-shrink:0;',
    '  animation:rise-spin .6s linear infinite;display:none;',
    '}',
    '@keyframes rise-spin{to{transform:rotate(360deg)}}',
    'body.rise-has-bar{padding-top:48px !important;margin-top:0 !important;}'
  ].join('\n');

  /* ── INIT ──────────────────────────────────────────────────────── */
  function init() {
    injectStyles();
    injectBar();
    var saved = getSavedLang();
    if (saved) {
      setTriggerLabel(saved);
      translatePage(saved);
    }
    initObserver();
  }

  function injectStyles() {
    var s = document.createElement('style');
    s.id = 'rise-translate-styles';
    s.textContent = css;
    document.head.appendChild(s);
  }

  /* ── BAR ─────────────────────────────────────────────────────── */
  function injectBar() {
    var bar = document.createElement('div');
    bar.id = BAR_ID;
    bar.setAttribute('data-rise-bar', '1');

    var label = document.createElement('span');
    label.className = 'rise-bar-label';
    label.textContent = '🌐 Translate:';

    /* dropdown wrapper */
    var wrap = document.createElement('div');
    wrap.className = 'rise-dropdown-wrap';

    var trigger = document.createElement('button');
    trigger.className = 'rise-trigger';
    trigger.setAttribute('aria-haspopup', 'listbox');
    trigger.setAttribute('aria-expanded', 'false');
    trigger.innerHTML = '<span class="rise-trigger-text">Select language</span><span class="rise-caret">▼</span>';

    var panel = document.createElement('div');
    panel.className = 'rise-panel';

    var search = document.createElement('input');
    search.className = 'rise-search';
    search.type = 'text';
    search.placeholder = 'Search language…';
    search.setAttribute('autocomplete', 'off');

    var list = document.createElement('div');
    list.className = 'rise-list';
    list.setAttribute('role', 'listbox');

    LANGUAGES.forEach(function (lang) {
      var opt = document.createElement('div');
      opt.className = 'rise-option';
      opt.textContent = lang.label;
      opt.setAttribute('data-code', lang.code);
      opt.setAttribute('role', 'option');
      opt.addEventListener('mousedown', function (e) {
        e.preventDefault(); /* prevent blur on trigger */
        selectLanguage(lang.code, lang.label);
        closePanel(trigger, panel);
      });
      list.appendChild(opt);
    });

    /* search filter — stopPropagation prevents observer firing */
    search.addEventListener('input', function (e) {
      e.stopPropagation();
      var q = this.value.toLowerCase();
      list.querySelectorAll('.rise-option').forEach(function (opt) {
        var match = opt.textContent.toLowerCase().indexOf(q) !== -1;
        opt.classList.toggle('hidden', !match);
      });
    });

    /* stop ALL clicks/touches inside the whole dropdown wrap from reaching document */
    wrap.addEventListener('click',      function (e) { e.stopPropagation(); });
    wrap.addEventListener('touchstart', function (e) { e.stopPropagation(); }, { passive: true });

    trigger.addEventListener('click', function () {
      var isOpen = panel.classList.contains('open');
      if (isOpen) {
        closePanel(trigger, panel);
      } else {
        openPanel(trigger, panel, search);
      }
    });

    /* close on outside click/touch — wrap's stopPropagation keeps this from firing when inside */
    document.addEventListener('click',      function () { closePanel(trigger, panel); });
    document.addEventListener('touchstart', function () { closePanel(trigger, panel); }, { passive: true });

    panel.appendChild(search);
    panel.appendChild(list);
    wrap.appendChild(trigger);
    wrap.appendChild(panel);

    /* spinner + status */
    var spinner = document.createElement('div');
    spinner.className = 'rise-spinner';
    spinner.id = 'rise-spinner';

    var resetBtn = document.createElement('button');
    resetBtn.className = 'rise-reset';
    resetBtn.textContent = 'Reset';
    resetBtn.style.display = 'none';
    resetBtn.id = 'rise-reset-btn';
    resetBtn.addEventListener('click', function () {
      restorePage();
      clearSavedLang();
      activeTranslation = null;
      setTriggerLabel(null);
      this.style.display = 'none';
      document.getElementById('rise-status').textContent = 'Powered by Google Translate';
      /* clear selected state */
      list.querySelectorAll('.rise-option').forEach(function (o) { o.classList.remove('selected'); });
    });

    var status = document.createElement('span');
    status.className = 'rise-status';
    status.id = 'rise-status';
    status.textContent = 'Powered by Google Translate';

    bar.appendChild(label);
    bar.appendChild(wrap);
    bar.appendChild(spinner);
    bar.appendChild(resetBtn);
    bar.appendChild(status);

    document.body.insertBefore(bar, document.body.firstChild);
    document.body.classList.add('rise-has-bar');

    /* store refs for translatePage to use */
    bar._spinner = spinner;
    bar._status  = status;
    bar._reset   = resetBtn;
    bar._list    = list;
  }

  function openPanel(trigger, panel, search) {
    trigger.classList.add('open');
    trigger.setAttribute('aria-expanded', 'true');
    panel.classList.add('open');
    search.value = '';
    /* show all options */
    panel.querySelectorAll('.rise-option').forEach(function (o) { o.classList.remove('hidden'); });
    setTimeout(function () { search.focus(); }, 50);
  }

  function closePanel(trigger, panel) {
    trigger.classList.remove('open');
    trigger.setAttribute('aria-expanded', 'false');
    panel.classList.remove('open');
  }

  function setTriggerLabel(code) {
    var bar = document.getElementById(BAR_ID);
    if (!bar) return;
    var txt = bar.querySelector('.rise-trigger-text');
    if (!txt) return;
    if (!code) {
      txt.textContent = 'Select language';
      return;
    }
    var lang = LANGUAGES.find(function (l) { return l.code === code; });
    txt.textContent = lang ? lang.label : code;
  }

  function selectLanguage(code, label) {
    var bar = document.getElementById(BAR_ID);
    if (!bar) return;

    setTriggerLabel(code);
    saveLang(code);
    activeTranslation = code;

    /* mark selected */
    if (bar._list) {
      bar._list.querySelectorAll('.rise-option').forEach(function (o) {
        o.classList.toggle('selected', o.getAttribute('data-code') === code);
      });
    }

    translatePage(code, bar._spinner, bar._status, bar._reset);
  }

  /* ── TEXT NODE COLLECTION ──────────────────────────────────────── */
  function getTextNodes() {
    var skip = ['SCRIPT','STYLE','NOSCRIPT','IFRAME','OPTION','SELECT'];
    var nodes = [];
    var walk  = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: function (node) {
          var p = node.parentElement;
          if (!p) return NodeFilter.FILTER_REJECT;
          /* skip the entire bar */
          if (p.closest && p.closest('#' + BAR_ID)) return NodeFilter.FILTER_REJECT;
          if (p.id === BAR_ID) return NodeFilter.FILTER_REJECT;
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
  function translatePage(lang, spinner, status, resetBtn) {
    var nodes = getTextNodes();
    var toTranslate = [];

    nodes.forEach(function (node) {
      if (!originalMap.has(node)) originalMap.set(node, node.nodeValue);
      var orig = originalMap.get(node).trim();
      if (orig.length < 2) return;
      cache[lang] = cache[lang] || {};
      if (!cache[lang][orig]) toTranslate.push(orig);
    });

    toTranslate = unique(toTranslate);

    var langObj = LANGUAGES.find(function (l) { return l.code === lang; });
    document.body.style.direction = (langObj && langObj.rtl) ? 'rtl' : '';

    if (toTranslate.length === 0) {
      applyTranslations(nodes, lang);
      if (resetBtn) resetBtn.style.display = 'inline-block';
      return;
    }

    if (spinner) spinner.style.display = 'block';
    if (status)  status.textContent = 'Translating…';

    /* pause observer while we translate to avoid feedback loop */
    pauseObserver();

    batchTranslate(toTranslate, lang, function (err) {
      if (spinner) spinner.style.display = 'none';
      if (err) {
        if (status) status.textContent = 'Translation failed';
        console.warn('[risecoursetranslate] Error:', err);
        resumeObserver();
        return;
      }
      applyTranslations(nodes, lang);
      if (status)   status.textContent = 'Translated: ' + (langObj ? langObj.label : lang);
      if (resetBtn) resetBtn.style.display = 'inline-block';
      resumeObserver();
    });
  }

  function applyTranslations(nodes, lang) {
    nodes.forEach(function (node) {
      var orig = originalMap.get(node);
      if (!orig) return;
      var trimmed = orig.trim();
      if (cache[lang] && cache[lang][trimmed]) {
        var lead  = orig.match(/^\s*/)[0];
        var trail = orig.match(/\s*$/)[0];
        node.nodeValue = lead + cache[lang][trimmed] + trail;
      }
    });
  }

  /* ── GOOGLE TRANSLATE ──────────────────────────────────────────── */
  var CHUNK_SIZE = 50;

  function batchTranslate(texts, lang, done) {
    var chunks  = chunkArray(texts, CHUNK_SIZE);
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
    var SEP    = '\n||||\n';
    var joined = texts.join(SEP);
    var url    = 'https://translate.googleapis.com/translate_a/single'
      + '?client=gtx&sl=auto&tl=' + encodeURIComponent(targetLang) + '&dt=t'
      + '&q=' + encodeURIComponent(joined);

    fetch(url)
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(function (data) {
        var raw = '';
        if (data && data[0]) data[0].forEach(function (seg) { if (seg && seg[0]) raw += seg[0]; });
        var parts = raw.split('||||').map(function (s) { return s.replace(/^\n|\n$/g, ''); });
        cb(null, parts);
      })
      .catch(function (err) { cb(err, null); });
  }

  /* ── RESTORE ────────────────────────────────────────────────────── */
  function restorePage() {
    originalMap.forEach(function (orig, node) { node.nodeValue = orig; });
    document.body.style.direction = '';
  }

  /* ── OBSERVER (Rise SPA slide changes) ──────────────────────────── */
  function initObserver() {
    observer = new MutationObserver(function (mutations) {
      if (!activeTranslation || !isObserving) return;
      var relevant = mutations.some(function (m) {
        /* ignore mutations inside our own bar */
        if (m.target && m.target.closest && m.target.closest('#' + BAR_ID)) return false;
        if (m.target && m.target.id === BAR_ID) return false;
        return m.addedNodes.length > 0;
      });
      if (relevant) {
        clearTimeout(observer._t);
        observer._t = setTimeout(function () {
          if (activeTranslation) translatePage(activeTranslation);
        }, 700);
      }
    });

    var target = document.querySelector('#app, #root, .content-wrapper') || document.body;
    observer.observe(target, { childList: true, subtree: true });
    isObserving = true;
  }

  function pauseObserver() { isObserving = false; }
  function resumeObserver() { setTimeout(function () { isObserving = true; }, 800); }

  window.addEventListener('hashchange', function () {
    if (activeTranslation) setTimeout(function () { translatePage(activeTranslation); }, 400);
  });

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

  /* ── BOOT ───────────────────────────────────────────────────────── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();

/*!
 * risecoursetranslate.js — Rise & Storyline Course Translator
 * Drop-in: add <script src="risecoursetranslate.js" defer></script> to index.html
 * Uses Google Translate (free endpoint). No API key required.
 * v1.6.5 — portal dropdown to body (Rise overflow), mousedown toggle, no global close
 */
(function () {
  'use strict';

  if (window.__riseTranslateLoaded) return;
  window.__riseTranslateLoaded = true;

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

  var STORAGE_KEY       = 'rise_course_lang';
  var BAR_ID            = 'rise-translate-bar';
  var START_SELECTORS   = [
    'a.cover__header-content-action-link',
    '.cover__header-content-action-link',
    'button.cover__header-content-action-link',
    '[class*="cover"][class*="action-link"]'
  ];
  var cache             = {};
  var originalMap       = new Map();
  var isObserving       = false;
  var observer          = null;
  var activeTranslation = null;
  var panelOpen         = false;
  var focusTimer        = null;
  var placementReady    = false;
  var barRef            = null;
  var placeBarPending   = false;
  var panelWrapRef      = null;

  /* ── STYLES ─────────────────────────────────────────────────────── */
  var css = [
    '#' + BAR_ID + '{',
    '  display:flex;align-items:center;justify-content:center;flex-wrap:wrap;gap:8px 12px;',
    '  box-sizing:border-box;padding:0;',
    '  font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;font-size:13px;',
    '  color:inherit;',
    '}',
    '#' + BAR_ID + '.rise-translate-bar--cover{',
    '  display:flex;flex-direction:column;align-items:stretch;gap:10px;',
    '  width:100%;max-width:320px;margin:16px auto 0;padding:0;',
    '}',
    '#' + BAR_ID + '.rise-translate-bar--cover .rt-wrap{width:100%;}',
    '#' + BAR_ID + '.rise-translate-bar--cover .rt-trigger{width:100%;min-width:0;}',
    '#' + BAR_ID + '.rise-translate-bar--floating{',
    '  position:fixed;bottom:16px;right:16px;left:auto;top:auto;z-index:2147483647;',
    '  width:auto;max-width:calc(100vw - 32px);margin-top:0;padding:10px 14px;',
    '  background:rgba(30,30,46,.94);color:#fff;border-radius:12px;',
    '  box-shadow:0 4px 20px rgba(0,0,0,.35);justify-content:flex-start;',
    '}',
    '#' + BAR_ID + ' .rt-wrap{position:relative;}',
    '#' + BAR_ID + ' .rt-trigger{',
    '  display:flex;align-items:center;gap:8px;',
    '  background:rgba(255,255,255,.92);border:1px solid rgba(0,0,0,.15);',
    '  color:#222;border-radius:8px;padding:6px 12px;font-size:13px;cursor:pointer;',
    '  min-width:180px;justify-content:space-between;user-select:none;',
    '}',
    '#' + BAR_ID + ' .rt-trigger:hover{border-color:rgba(0,0,0,.3);box-shadow:0 0 0 2px rgba(0,0,0,.06);}',
    '#' + BAR_ID + '.rise-translate-bar--floating .rt-trigger{',
    '  background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.2);color:#fff;',
    '}',
    '#' + BAR_ID + '.rise-translate-bar--floating .rt-trigger:hover{background:rgba(255,255,255,.18);box-shadow:none;}',
    '#' + BAR_ID + ' .rt-caret{font-size:10px;opacity:.6;transition:transform .2s;display:inline-block;}',
    '#' + BAR_ID + ' .rt-panel{',
    '  visibility:hidden;opacity:0;',
    '  position:absolute;left:0;width:240px;overflow:hidden;',
    '  background:#fff;border:1px solid rgba(0,0,0,.12);color:#222;',
    '  border-radius:10px;box-shadow:0 8px 24px rgba(0,0,0,.15);z-index:2147483647;',
    '  pointer-events:none;',
    '}',
    '#' + BAR_ID + ' .rt-panel.rt-panel--down{top:calc(100% + 6px);bottom:auto;}',
    '#' + BAR_ID + ' .rt-panel.rt-panel--up{bottom:calc(100% + 6px);top:auto;}',
    '#' + BAR_ID + ' .rt-panel.rt-open{visibility:visible;opacity:1;pointer-events:all;transition:opacity .15s;}',
    '#' + BAR_ID + '.rise-translate-bar--floating .rt-panel{',
    '  background:#1e1e2e;border:1px solid rgba(255,255,255,.2);color:#fff;',
    '  box-shadow:0 8px 24px rgba(0,0,0,.5);',
    '}',
    '#' + BAR_ID + ' .rt-search{',
    '  width:100%;box-sizing:border-box;padding:10px 12px;',
    '  background:transparent;border:none;border-bottom:1px solid rgba(0,0,0,.08);',
    '  color:inherit;font-size:13px;outline:none;',
    '}',
    '#' + BAR_ID + '.rise-translate-bar--floating .rt-search{',
    '  background:rgba(255,255,255,.08);border-bottom-color:rgba(255,255,255,.1);color:#fff;',
    '}',
    '#' + BAR_ID + ' .rt-search::placeholder{opacity:.45;}',
    '#' + BAR_ID + ' .rt-list{max-height:260px;overflow-y:auto;padding:4px 0;}',
    '#' + BAR_ID + ' .rt-list::-webkit-scrollbar{width:4px;}',
    '#' + BAR_ID + ' .rt-list::-webkit-scrollbar-thumb{background:rgba(127,127,127,.35);border-radius:4px;}',
    '#' + BAR_ID + ' .rt-option{',
    '  padding:9px 14px;cursor:pointer;font-size:13px;opacity:.85;',
    '}',
    '#' + BAR_ID + ' .rt-option:hover{background:rgba(0,0,0,.06);}',
    '#' + BAR_ID + '.rise-translate-bar--floating .rt-option:hover{background:rgba(255,255,255,.1);}',
    '#' + BAR_ID + ' .rt-option.rt-selected{font-weight:500;opacity:1;background:rgba(0,0,0,.08);}',
    '#' + BAR_ID + '.rise-translate-bar--floating .rt-option.rt-selected{background:rgba(255,255,255,.12);color:#fff;}',
    '#' + BAR_ID + ' .rt-option.rt-hidden{display:none;}',
    '#' + BAR_ID + ' .rt-reset{',
    '  background:transparent;border:1px solid rgba(127,127,127,.35);opacity:.7;',
    '  border-radius:6px;padding:5px 10px;font-size:12px;cursor:pointer;white-space:nowrap;color:inherit;',
    '}',
    '#' + BAR_ID + ' .rt-reset:hover{opacity:1;}',
    '#' + BAR_ID + '.rise-translate-bar--floating .rt-reset{',
    '  border-color:rgba(255,255,255,.2);color:rgba(255,255,255,.6);',
    '}',
    '#' + BAR_ID + '.rise-translate-bar--floating .rt-reset:hover{border-color:rgba(255,255,255,.5);color:#fff;}',
    '#' + BAR_ID + ' .rt-spinner{',
    '  width:14px;height:14px;border:2px solid rgba(127,127,127,.3);',
    '  border-top-color:currentColor;border-radius:50%;flex-shrink:0;',
    '  animation:rt-spin .6s linear infinite;display:none;',
    '}',
    '#' + BAR_ID + '.rise-translate-bar--floating .rt-spinner{',
    '  border-color:rgba(255,255,255,.25);border-top-color:#fff;',
    '}',
    /* portaled panel (moved to body while open — escapes Rise overflow clipping) */
    '.rt-panel.rt-panel--portaled{',
    '  visibility:hidden;opacity:0;position:fixed;width:240px;overflow:hidden;',
    '  background:#fff;border:1px solid rgba(0,0,0,.12);color:#222;',
    '  border-radius:10px;box-shadow:0 8px 24px rgba(0,0,0,.15);',
    '  z-index:2147483647;pointer-events:none;',
    '  font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;font-size:13px;',
    '}',
    '.rt-panel.rt-panel--portaled.rt-open{visibility:visible;opacity:1;pointer-events:all;}',
    '.rt-panel.rt-panel--portaled.rt-panel--dark{',
    '  background:#1e1e2e;border-color:rgba(255,255,255,.2);color:#fff;',
    '  box-shadow:0 8px 24px rgba(0,0,0,.5);',
    '}',
    '.rt-panel.rt-panel--portaled .rt-search{',
    '  width:100%;box-sizing:border-box;padding:10px 12px;',
    '  background:transparent;border:none;border-bottom:1px solid rgba(0,0,0,.08);',
    '  color:inherit;font-size:13px;outline:none;',
    '}',
    '.rt-panel.rt-panel--portaled.rt-panel--dark .rt-search{',
    '  background:rgba(255,255,255,.08);border-bottom-color:rgba(255,255,255,.1);color:#fff;',
    '}',
    '.rt-panel.rt-panel--portaled .rt-option{padding:9px 14px;cursor:pointer;opacity:.85;}',
    '.rt-panel.rt-panel--portaled .rt-option:hover{background:rgba(0,0,0,.06);}',
    '.rt-panel.rt-panel--portaled.rt-panel--dark .rt-option:hover{background:rgba(255,255,255,.1);}',
    '.rt-panel.rt-panel--portaled .rt-option.rt-selected{font-weight:500;opacity:1;background:rgba(0,0,0,.08);}',
    '.rt-panel.rt-panel--portaled.rt-panel--dark .rt-option.rt-selected{background:rgba(255,255,255,.12);color:#fff;}',
    '.rt-panel.rt-panel--portaled .rt-list{max-height:260px;overflow-y:auto;padding:4px 0;}',
    '@keyframes rt-spin{to{transform:rotate(360deg)}}'
  ].join('\n');

  /* ── INIT ──────────────────────────────────────────────────────── */
  function init() {
    injectStyles();
    if (!document.getElementById(BAR_ID)) injectBar();
    waitForCourseShell(function () {
      placeBar();
      scheduleCoverPlacementRetries();
      var saved = getSavedLang();
      if (saved) {
        setTriggerLabel(saved);
        translatePage(saved);
      }
      initObserver();
    });
    initPlacementObserver();
  }

  function injectStyles() {
    if (document.getElementById('rise-translate-styles')) return;
    var s = document.createElement('style');
    s.id = 'rise-translate-styles';
    s.textContent = css;
    document.head.appendChild(s);
  }

  /* ── BAR ────────────────────────────────────────────────────────── */
  function injectBar() {
    if (barRef) return barRef;
    var existing = document.getElementById(BAR_ID);
    if (existing) { barRef = existing; return barRef; }

    var bar = document.createElement('div');
    bar.id = BAR_ID;

    /* wrap holds trigger + panel */
    var wrap = document.createElement('div');
    wrap.className = 'rt-wrap';

    /* trigger button */
    var trigger = document.createElement('button');
    trigger.className = 'rt-trigger';
    trigger.type = 'button';
    trigger.innerHTML = '<span class="rt-trigger-text">Select language</span><span class="rt-caret">▼</span>';

    /* panel */
    var panel = document.createElement('div');
    panel.className = 'rt-panel rt-panel--down';

    /* search input inside panel */
    var search = document.createElement('input');
    search.className = 'rt-search';
    search.type = 'text';
    search.placeholder = 'Search language…';
    search.setAttribute('autocomplete', 'off');

    /* language list */
    var list = document.createElement('div');
    list.className = 'rt-list';

    LANGUAGES.forEach(function (lang) {
      var opt = document.createElement('div');
      opt.className = 'rt-option';
      opt.textContent = lang.label;
      opt.setAttribute('data-code', lang.code);
      /* use mousedown so it fires before blur */
      opt.addEventListener('mousedown', function (e) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        selectLanguage(lang.code, list);
        closePanel(trigger, panel);
      });
      list.appendChild(opt);
    });

    search.addEventListener('input', function () {
      var q = this.value.toLowerCase();
      list.querySelectorAll('.rt-option').forEach(function (o) {
        o.classList.toggle('rt-hidden', o.textContent.toLowerCase().indexOf(q) === -1);
      });
    });

    function stopRiseBubble(e) {
      e.stopPropagation();
      e.stopImmediatePropagation();
    }

    panel.addEventListener('mousedown', stopRiseBubble, true);
    panel.addEventListener('click', stopRiseBubble, true);
    panel.addEventListener('touchstart', stopRiseBubble, true);
    search.addEventListener('mousedown', stopRiseBubble, true);
    search.addEventListener('click', stopRiseBubble, true);
    search.addEventListener('touchstart', stopRiseBubble, true);

    trigger.addEventListener('mousedown', function (e) {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      if (panel.classList.contains('rt-open')) {
        closePanel(trigger, panel);
      } else {
        openPanel(trigger, panel, search);
      }
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && panelOpen) closePanel(trigger, panel);
    });

    window.addEventListener('scroll', function () {
      if (panelOpen) positionPortaledPanel(trigger, panel);
    }, true);
    window.addEventListener('resize', function () {
      if (panelOpen) positionPortaledPanel(trigger, panel);
    });

    panel.appendChild(search);
    panel.appendChild(list);
    wrap.appendChild(trigger);
    wrap.appendChild(panel);

    /* spinner */
    var spinner = document.createElement('div');
    spinner.className = 'rt-spinner';

    /* reset button */
    var resetBtn = document.createElement('button');
    resetBtn.className = 'rt-reset';
    resetBtn.type = 'button';
    resetBtn.textContent = 'Reset';
    resetBtn.style.display = 'none';
    resetBtn.addEventListener('mousedown', function (e) {
      e.preventDefault();
      restorePage();
      clearSavedLang();
      activeTranslation = null;
      setTriggerLabel(null);
      resetBtn.style.display = 'none';
      list.querySelectorAll('.rt-option').forEach(function (o) { o.classList.remove('rt-selected'); });
    });

    bar.appendChild(wrap);
    bar.appendChild(spinner);
    bar.appendChild(resetBtn);

    bar._trigger = trigger;
    bar._panel   = panel;
    bar._wrap    = wrap;
    bar._spinner = spinner;
    bar._reset   = resetBtn;
    bar._list    = list;
    barRef = bar;
    panelWrapRef = wrap;
    return bar;
  }

  function positionPortaledPanel(trigger, panel) {
    var bar, r, w, h, top, openUp;
    if (!trigger || !panel || !panel.classList.contains('rt-panel--portaled')) return;
    bar = barRef;
    r = trigger.getBoundingClientRect();
    w = Math.max(Math.round(r.width), 240);
    panel.style.position = 'fixed';
    panel.style.width = w + 'px';
    panel.style.left = Math.max(8, Math.min(r.left, window.innerWidth - w - 8)) + 'px';
    panel.style.bottom = 'auto';
    h = panel.offsetHeight || 300;
    openUp = bar && bar.classList.contains('rise-translate-bar--floating');
    if (!openUp && r.bottom + h + 8 > window.innerHeight && r.top > h + 8) openUp = true;
    top = openUp ? r.top - h - 6 : r.bottom + 6;
    panel.style.top = Math.max(8, Math.min(top, window.innerHeight - h - 8)) + 'px';
  }

  function portalPanel(bar, wrap, trigger, panel) {
    var dark = bar.classList.contains('rise-translate-bar--floating');
    panel.classList.add('rt-panel--portaled');
    panel.classList.toggle('rt-panel--dark', dark);
    document.body.appendChild(panel);
    positionPortaledPanel(trigger, panel);
  }

  function unportalPanel(wrap, panel) {
    panel.classList.remove('rt-panel--portaled', 'rt-panel--dark');
    panel.style.top = '';
    panel.style.left = '';
    panel.style.width = '';
    panel.style.bottom = '';
    panel.style.position = '';
    if (wrap && panel.parentElement !== wrap) wrap.appendChild(panel);
  }

  function isPanelOpen() {
    return panelOpen;
  }

  function isBarPlacedOnCover(startBtn, bar) {
    var container;
    if (!startBtn || !bar) return false;
    if (startBtn.nextElementSibling === bar) return true;
    container = startBtn.closest('.cover__header-content, [class*="cover__header"]');
    return !!(container && container.contains(bar));
  }

  function schedulePlaceBar() {
    if (isPanelOpen()) {
      placeBarPending = true;
      return;
    }
    placeBar();
  }

  function isVisible(el) {
    if (!el || !el.getBoundingClientRect) return false;
    var rect = el.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  }

  function findStartButton() {
    var i, el, candidates, txt, j, cover;
    cover = document.querySelector('#app .cover, .cover, [class*="cover-page"]');
    if (cover) {
      for (i = 0; i < START_SELECTORS.length; i++) {
        el = cover.querySelector(START_SELECTORS[i]);
        if (el && isVisible(el)) return el;
      }
    }
    for (i = 0; i < START_SELECTORS.length; i++) {
      el = document.querySelector(START_SELECTORS[i]);
      if (el && isVisible(el)) return el;
    }
    candidates = document.querySelectorAll('a, button');
    for (j = 0; j < candidates.length; j++) {
      txt = (candidates[j].textContent || '').trim().toLowerCase();
      if (/^(start|begin|resume|continue)(\s+(course|lesson))?$/i.test(txt) && isVisible(candidates[j])) {
        return candidates[j];
      }
    }
    return null;
  }

  function scheduleCoverPlacementRetries() {
    var attempts = 0;
    var timer = setInterval(function () {
      var bar = barRef;
      var startBtn = findStartButton();
      var placed = bar && (startBtn
        ? isBarPlacedOnCover(startBtn, bar)
        : bar.parentElement === document.body);
      if (!placed) schedulePlaceBar();
      attempts++;
      if (placed || attempts >= 30) clearInterval(timer);
    }, 400);
  }

  function waitForCourseShell(done) {
    var finished = false;
    var shellObserver = null;
    function finish() {
      if (finished) return;
      finished = true;
      if (shellObserver) shellObserver.disconnect();
      done();
    }
    if (findStartButton()) {
      finish();
      return;
    }
    shellObserver = new MutationObserver(function () {
      if (findStartButton()) finish();
    });
    shellObserver.observe(document.body, { childList: true, subtree: true });
    setTimeout(finish, 15000);
  }

  function placeBar() {
    var bar = barRef || document.getElementById(BAR_ID);
    if (!bar) return;
    if (isPanelOpen()) {
      placeBarPending = true;
      return;
    }

    var panel   = bar._panel   || bar.querySelector('.rt-panel');
    var startBtn = findStartButton();
    var needsMove = false;
    var needsModeSwitch = false;

    if (startBtn) {
      needsMove = !isBarPlacedOnCover(startBtn, bar);
      needsModeSwitch = bar.classList.contains('rise-translate-bar--floating');
      if (!needsMove && !needsModeSwitch) return;
      bar.classList.remove('rise-translate-bar--floating');
      bar.classList.add('rise-translate-bar--cover');
      if (panel) {
        panel.classList.remove('rt-panel--up');
        panel.classList.add('rt-panel--down');
      }
      if (needsMove) startBtn.insertAdjacentElement('afterend', bar);
      return;
    }

    needsMove = bar.parentElement !== document.body;
    needsModeSwitch = bar.classList.contains('rise-translate-bar--cover');
    if (!needsMove && !needsModeSwitch) return;
    bar.classList.remove('rise-translate-bar--cover');
    bar.classList.add('rise-translate-bar--floating');
    if (panel) {
      panel.classList.remove('rt-panel--down');
      panel.classList.add('rt-panel--up');
    }
    if (needsMove) document.body.appendChild(bar);
  }

  function initPlacementObserver() {
    if (placementReady) return;
    placementReady = true;

    window.addEventListener('hashchange', function () {
      schedulePlaceBar();
      if (activeTranslation) setTimeout(function () { translatePage(activeTranslation); }, 400);
    });

    var placementObserver = new MutationObserver(function (mutations) {
      if (isPanelOpen()) return;
      var relevant = mutations.some(function (m) {
        var t = m.target;
        if (t && t.closest && (t.closest('#' + BAR_ID) || t.closest('.rt-panel'))) return false;
        return true;
      });
      if (!relevant) return;
      clearTimeout(placementObserver._t);
      placementObserver._t = setTimeout(schedulePlaceBar, 300);
    });
    placementObserver.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'class', 'hidden', 'aria-hidden']
    });
  }

  function openPanel(trigger, panel, search) {
    var bar = barRef;
    var wrap = (bar && bar._wrap) || panelWrapRef;
    if (focusTimer) { clearTimeout(focusTimer); focusTimer = null; }
    panelOpen = true;
    panel.classList.add('rt-open');
    trigger.querySelector('.rt-caret').style.transform = 'rotate(180deg)';
    search.value = '';
    panel.querySelectorAll('.rt-option').forEach(function (o) { o.classList.remove('rt-hidden'); });
    if (bar && wrap) portalPanel(bar, wrap, trigger, panel);
    focusTimer = setTimeout(function () {
      focusTimer = null;
      if (panelOpen) {
        positionPortaledPanel(trigger, panel);
        search.focus({ preventScroll: true });
      }
    }, 50);
  }

  function closePanel(trigger, panel) {
    var wrap = (barRef && barRef._wrap) || panelWrapRef;
    if (focusTimer) { clearTimeout(focusTimer); focusTimer = null; }
    panelOpen = false;
    panel.classList.remove('rt-open');
    trigger.querySelector('.rt-caret').style.transform = '';
    unportalPanel(wrap, panel);
    var search = panel.querySelector('.rt-search');
    if (search && document.activeElement === search) search.blur();
    if (placeBarPending) {
      placeBarPending = false;
      setTimeout(placeBar, 0);
    }
  }

  function setTriggerLabel(code) {
    var bar = document.getElementById(BAR_ID);
    if (!bar) return;
    var txt = bar.querySelector('.rt-trigger-text');
    if (!txt) return;
    if (!code) { txt.textContent = 'Select language'; return; }
    var lang = LANGUAGES.find(function (l) { return l.code === code; });
    txt.textContent = lang ? lang.label : code;
  }

  function selectLanguage(code, list) {
    var bar = document.getElementById(BAR_ID);
    if (!bar) return;
    setTriggerLabel(code);
    saveLang(code);
    activeTranslation = code;
    list.querySelectorAll('.rt-option').forEach(function (o) {
      o.classList.toggle('rt-selected', o.getAttribute('data-code') === code);
    });
    translatePage(code, bar._spinner, null, bar._reset);
  }

  /* ── TEXT NODES ─────────────────────────────────────────────────── */
  function getTextNodes() {
    var skip  = ['SCRIPT','STYLE','NOSCRIPT','IFRAME','OPTION','SELECT'];
    var nodes = [];
    var walk  = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode: function (node) {
        var p = node.parentElement;
        if (!p) return NodeFilter.FILTER_REJECT;
        if (p.closest && (p.closest('#' + BAR_ID) || p.closest('.rt-panel'))) return NodeFilter.FILTER_REJECT;
        if (skip.indexOf(p.nodeName) !== -1) return NodeFilter.FILTER_REJECT;
        var txt = node.nodeValue.trim();
        if (!txt || txt.length < 2) return NodeFilter.FILTER_SKIP;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    var n;
    while ((n = walk.nextNode())) nodes.push(n);
    return nodes;
  }

  /* ── TRANSLATION ─────────────────────────────────────────────────── */
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
        node.nodeValue = orig.match(/^\s*/)[0] + cache[lang][trimmed] + orig.match(/\s*$/)[0];
      }
    });
  }

  /* ── GOOGLE TRANSLATE ────────────────────────────────────────────── */
  function batchTranslate(texts, lang, done) {
    var chunks = chunkArray(texts, 50);
    var pending = chunks.length;
    var errored = null;
    if (!pending) return done(null);
    chunks.forEach(function (chunk) {
      googleTranslate(chunk, lang, function (err, results) {
        if (errored) return;
        if (err) { errored = err; return done(err); }
        chunk.forEach(function (orig, i) { cache[lang][orig] = results[i] || orig; });
        if (--pending === 0) done(null);
      });
    });
  }

  function googleTranslate(texts, targetLang, cb) {
    var SEP = '\n||||\n';
    var url = 'https://translate.googleapis.com/translate_a/single'
      + '?client=gtx&sl=auto&tl=' + encodeURIComponent(targetLang) + '&dt=t'
      + '&q=' + encodeURIComponent(texts.join(SEP));
    fetch(url)
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(function (data) {
        var raw = '';
        if (data && data[0]) data[0].forEach(function (s) { if (s && s[0]) raw += s[0]; });
        cb(null, raw.split('||||').map(function (s) { return s.replace(/^\n|\n$/g, ''); }));
      })
      .catch(function (e) { cb(e, null); });
  }

  /* ── RESTORE ─────────────────────────────────────────────────────── */
  function restorePage() {
    originalMap.forEach(function (orig, node) { node.nodeValue = orig; });
    document.body.style.direction = '';
  }

  /* ── OBSERVER ────────────────────────────────────────────────────── */
  function initObserver() {
    observer = new MutationObserver(function (mutations) {
      if (!activeTranslation || !isObserving) return;
      var relevant = mutations.some(function (m) {
        if (m.target && m.target.closest && m.target.closest('#' + BAR_ID)) return false;
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

  function pauseObserver()  { isObserving = false; }
  function resumeObserver() { setTimeout(function () { isObserving = true; }, 800); }

  /* ── PERSISTENCE ─────────────────────────────────────────────────── */
  function saveLang(l)    { try { sessionStorage.setItem(STORAGE_KEY, l); }    catch(e){} }
  function clearSavedLang(){ try { sessionStorage.removeItem(STORAGE_KEY); }   catch(e){} }
  function getSavedLang() { try { return sessionStorage.getItem(STORAGE_KEY); } catch(e){ return null; } }

  /* ── UTILS ───────────────────────────────────────────────────────── */
  function unique(arr) { var s={}; return arr.filter(function(v){ return s[v]?false:(s[v]=true); }); }
  function chunkArray(arr, n) { var o=[]; for(var i=0;i<arr.length;i+=n) o.push(arr.slice(i,i+n)); return o; }

  /* ── BOOT ────────────────────────────────────────────────────────── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();

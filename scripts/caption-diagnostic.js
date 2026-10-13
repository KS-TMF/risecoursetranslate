/* Caption diagnostic for risecoursetranslate.
 * Load from the browser console while a caption is on screen:
 *   var s=document.createElement('script');s.src='https://cdn.jsdelivr.net/gh/KS-TMF/risecoursetranslate@test/scripts/caption-diagnostic.js';document.head.appendChild(s)
 * Shows a box with a report to copy. Contains class names and short caption
 * text only. */
(function () {
  var WORD = '';
  try { WORD = (window.prompt('Type one word you can see in the caption on screen (or leave blank):') || '').trim(); } catch (e) {}
  var out = { frames: [] };
  try { out.lang = sessionStorage.getItem('rise_course_lang'); } catch (e) {}

  function path(el) {
    var p = [];
    while (el && el.nodeType === 1 && p.length < 10) {
      var cls = typeof el.className === 'string' && el.className.trim() ? '.' + el.className.trim().split(/\s+/).join('.') : '';
      p.push(el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + cls + (el.getAttribute('role') ? '[role=' + el.getAttribute('role') + ']' : ''));
      el = el.parentElement;
    }
    return p.join(' < ');
  }

  function scan(w) {
    var d;
    try { d = w.document; d.body.tagName; } catch (e) { out.frames.push({ crossOrigin: true }); return; }
    var f = {
      url: String(w.location.href).slice(0, 140),
      scriptVer: w.__riseTranslateVersion || null,
      scripts: Array.prototype.map.call(d.querySelectorAll('script[src*="risecoursetranslate"]'), function (x) { return x.src; }),
      bars: d.querySelectorAll('#rise-translate-bar').length,
      savedLang: (function () { try { return w.sessionStorage.getItem('rise_course_lang'); } catch (e) { return null; } })(),
      storyline: !!(w.DS || w.globalProvideData || d.querySelector('#slide, .slide-container, [class*="slide-layer"]')),
      videos: [], iframes: [], captionClassEls: [], wordEls: []
    };
    d.querySelectorAll('video').forEach(function (v) {
      var t = [];
      for (var i = 0; i < (v.textTracks || []).length; i++) {
        var tt = v.textTracks[i], c = null;
        try { c = tt.cues; } catch (e) {}
        var a = null;
        try { a = tt.activeCues; } catch (e) {}
        t.push({ kind: tt.kind, mode: tt.mode, label: tt.label, cues: c ? c.length : null,
                 first: c && c[0] ? String(c[0].text).slice(0, 80) : null,
                 active: a && a[0] ? String(a[0].text).slice(0, 80) : null,
                 rtHooked: !!tt.__rtHooked, rtLang: tt.__rtLang || null, rtBusy: tt.__rtBusy || null,
                 firstOrig: c && c[0] && c[0].__rtOrig !== undefined ? String(c[0].__rtOrig).slice(0, 80) : null });
      }
      f.videos.push({ src: String(v.currentSrc || v.src).slice(-70), trackEls: v.querySelectorAll('track').length, tracks: t, path: path(v) });
    });
    d.querySelectorAll('iframe').forEach(function (i) { f.iframes.push(String(i.src).slice(0, 120)); });
    d.querySelectorAll('[class*="caption" i],[class*="subtitle" i],[class*="cc-" i],[id*="caption" i]').forEach(function (el) {
      if (f.captionClassEls.length < 12) f.captionClassEls.push({ text: (el.textContent || '').trim().slice(0, 80), path: path(el) });
    });
    if (WORD) {
      var tw = d.createTreeWalker(d.body, 4), n;
      while ((n = tw.nextNode())) {
        if (f.wordEls.length < 8 && n.nodeValue.toLowerCase().indexOf(WORD.toLowerCase()) > -1) {
          f.wordEls.push({ text: n.nodeValue.trim().slice(0, 100), path: path(n.parentElement) });
        }
      }
    }
    out.frames.push(f);
    for (var k = 0; k < w.frames.length; k++) scan(w.frames[k]);
  }

  try { scan(window.top); } catch (e) { scan(window); }
  var report = JSON.stringify(out, null, 1);
  console.log(report);

  var box = document.createElement('div');
  box.style.cssText = 'position:fixed;inset:5% 10%;z-index:2147483647;background:#fff;color:#000;border:2px solid #333;border-radius:8px;padding:12px;display:flex;flex-direction:column;gap:8px;font:13px system-ui,sans-serif;box-shadow:0 8px 40px rgba(0,0,0,.4)';
  box.innerHTML = '<strong>Caption report: copy all of this and send it back</strong>';
  var ta = document.createElement('textarea');
  ta.value = report;
  ta.style.cssText = 'flex:1;font:12px monospace;width:100%;box-sizing:border-box';
  var btn = document.createElement('button');
  btn.textContent = 'Copy and close';
  btn.onclick = function () {
    ta.select();
    try { document.execCommand('copy'); } catch (e) {}
    try { navigator.clipboard.writeText(report); } catch (e) {}
    box.remove();
  };
  box.appendChild(ta);
  box.appendChild(btn);
  document.body.appendChild(box);
  ta.select();
})();

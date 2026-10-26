/*!
 * risecoursetranslate.js — PAUSED on test (2026-10-26, at the user's request;
 * main has been paused since 2026-10-21)
 *
 * Test courses (test-loader.js) show no language selector and send nothing
 * to Google.
 *
 * To turn test back on: restore the v1.12.9 script
 *   git checkout v1.12.9 -- risecoursetranslate.js
 * commit, push to test, then purge
 *   https://purge.jsdelivr.net/gh/KS-TMF/risecoursetranslate@test/risecoursetranslate.js
 */
(function () {
  if (window.__riseTranslateLoaded) return;
  window.__riseTranslateLoaded = true;
  window.__riseTranslateVersion = 'paused';

  // Forget any language a learner chose earlier in this browser session, so
  // code blocks don't pick it up from storage.
  try { sessionStorage.removeItem('rise_course_lang'); } catch (e) {}

  // Code blocks (translate-core.js) ask the course page which language to
  // show and build their own selector if nobody answers. Answer "English" so
  // they stay in English and hide their selector.
  window.addEventListener('message', function (ev) {
    var d = ev.data || {};
    if (d && d.type === 'rise-ready' && ev.source) {
      try { ev.source.postMessage({ type: 'rise-lang', lang: 'en' }, '*'); } catch (e) {}
    }
  });
})();

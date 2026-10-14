/*!
 * test-loader.js — always runs the newest commit on the `test` branch.
 * jsDelivr can keep serving an old copy of `@test` for hours, so a test course
 * loads this file from a fixed commit instead; it asks GitHub for the latest
 * `test` commit and loads risecoursetranslate.js at exactly that commit.
 * Any data-* attributes on this script tag (data-glossary, data-caption-size)
 * are passed through. If GitHub can't be reached it falls back to @test.
 * For TEST courses only; live courses keep using @main.
 */
(function () {
  var self = document.currentScript;
  var BASE = 'https://cdn.jsdelivr.net/gh/KS-TMF/risecoursetranslate@';

  function load(ref) {
    var s = document.createElement('script');
    s.src = BASE + ref + '/risecoursetranslate.js';
    if (self) {
      for (var i = 0; i < self.attributes.length; i++) {
        var a = self.attributes[i];
        if (a.name.indexOf('data-') === 0) s.setAttribute(a.name, a.value);
      }
    }
    (document.head || document.documentElement).appendChild(s);
  }

  fetch('https://api.github.com/repos/KS-TMF/risecoursetranslate/commits/test', {
    headers: { Accept: 'application/vnd.github.sha' },
    cache: 'no-store'
  })
    .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.text(); })
    .then(function (sha) {
      sha = String(sha).trim();
      if (!/^[0-9a-f]{40}$/.test(sha)) throw new Error('bad sha');
      load(sha);
    })
    .catch(function (e) {
      console.warn('[risecoursetranslate] test-loader: using @test (' + e.message + ')');
      load('test');
    });
})();

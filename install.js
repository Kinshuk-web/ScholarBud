/* ============================================================
   ScholarBud — install helper (PWA + store routing)
   ------------------------------------------------------------
   Drop this on any page:   <script src="install.js"></script>
   Then wire a button:      ScholarBudInstall.mount('#install-btn');
   ============================================================ */
(function () {
  var deferredPrompt = null;

  function ua() { return navigator.userAgent || ''; }

  function isStandalone() {
    return (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) ||
           (window.matchMedia && window.matchMedia('(display-mode: fullscreen)').matches) ||
           window.navigator.standalone === true;
  }
  function isAndroid() { return /android/i.test(ua()); }
  function isIOS() {
    if (/iPad|iPhone|iPod/.test(ua())) return true;
    // iPadOS 13+ reports itself as a Mac
    return navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
  }
  function isMobile() { return isAndroid() || isIOS(); }

  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault();
    deferredPrompt = e;
    document.dispatchEvent(new CustomEvent('sbi:installable'));
  });

  window.addEventListener('appinstalled', function () {
    deferredPrompt = null;
    document.dispatchEvent(new CustomEvent('sbi:installed'));
  });

  function iosHelp() {
    var el = document.getElementById('sbi-ios-help');
    if (el) { el.style.display = 'flex'; return; }
    el = document.createElement('div');
    el.id = 'sbi-ios-help';
    el.setAttribute('style', 'position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:99999;display:flex;align-items:flex-end;justify-content:center;padding:16px');
    el.innerHTML =
      '<div style="background:#fff;color:#17171a;border-radius:18px;padding:20px;max-width:430px;width:100%;' +
      'font:600 13px/1.6 Inter,system-ui,-apple-system,sans-serif;box-shadow:0 20px 60px rgba(0,0,0,.3)">' +
        '<div style="font-weight:800;font-size:16px;margin-bottom:6px">Install ScholarBud on your iPhone</div>' +
        '<div style="color:#6b7280;font-size:12px;margin-bottom:12px">iOS installs apps from Safari, not Chrome.</div>' +
        '<ol style="margin:0;padding-left:18px">' +
          '<li>Tap the <b>Share</b> button at the bottom of Safari (square with an up arrow).</li>' +
          '<li>Scroll down and tap <b>Add to Home Screen</b>.</li>' +
          '<li>Tap <b>Add</b> — ScholarBud lands on your home screen.</li>' +
        '</ol>' +
        '<button style="margin-top:16px;width:100%;padding:13px;border:0;border-radius:12px;' +
        'background:#bc2a2a;color:#fff;font-weight:800;font-size:13px;cursor:pointer" ' +
        'onclick="document.getElementById(\'sbi-ios-help\').style.display=\'none\'">Got it</button>' +
      '</div>';
    el.addEventListener('click', function (e) { if (e.target === el) el.style.display = 'none'; });
    document.body.appendChild(el);
  }

  var API = {
    isStandalone: isStandalone,
    isAndroid: isAndroid,
    isIOS: isIOS,
    isMobile: isMobile,

    // 'installed' | 'promptable' | 'ios-manual' | 'unsupported'
    state: function () {
      if (isStandalone()) return 'installed';
      if (deferredPrompt) return 'promptable';
      if (isIOS()) return 'ios-manual';
      return 'unsupported';
    },

    // Call from your own click handler.
    prompt: function () {
      if (!deferredPrompt) return Promise.resolve('unavailable');
      deferredPrompt.prompt();
      return deferredPrompt.userChoice.then(function (c) {
        deferredPrompt = null;
        return c && c.outcome;      // 'accepted' | 'dismissed'
      });
    },

    /* Wire a button. Options:
         { storeUrl, apkUrl, fallbackUrl, onInstalled }
       Behaviour by platform:
         installed   -> hide the button
         promptable  -> native install prompt
         iOS         -> show "Add to Home Screen" instructions
         Android     -> storeUrl / apkUrl if set, else nothing
    */
    mount: function (selector, opts) {
      opts = opts || {};
      var el = typeof selector === 'string' ? document.querySelector(selector) : selector;
      if (!el) return;

      function refresh() {
        var st = API.state();
        el.dataset.state = st;
        el.style.display = (st === 'installed') ? 'none' : '';
      }

      el.addEventListener('click', function (ev) {
        ev.preventDefault();
        var st = API.state();
        if (st === 'promptable') {
          API.prompt().then(function (outcome) {
            if (outcome === 'accepted' && opts.onInstalled) opts.onInstalled();
          });
        } else if (st === 'ios-manual') {
          iosHelp();
        } else if (isAndroid() && (opts.storeUrl || opts.apkUrl)) {
          window.location.href = opts.storeUrl || opts.apkUrl;
        } else if (opts.fallbackUrl) {
          window.location.href = opts.fallbackUrl;
        } else {
          iosHelp();
        }
      });

      document.addEventListener('sbi:installable', refresh);
      document.addEventListener('sbi:installed', refresh);
      refresh();
    }
  };

  window.ScholarBudInstall = API;
})();

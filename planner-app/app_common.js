(function (window) {
  'use strict';

  function escHtml(s) {
    if (s === null || s === undefined) return '';
    return String(s).replace(/[&<>"']/g, function (m) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m];
    });
  }

  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  }

  function getSessionUser() {
    var s = localStorage.getItem('gtk_session');
    if (s && s !== 'null' && s !== 'undefined') return s;
    if (localStorage.getItem('gtk_guest_mode') === '1') {
      localStorage.setItem('gtk_session', 'guest');
      return 'guest';
    }
    return null;
  }

  function isGuestMode() {
    return localStorage.getItem('gtk_guest_mode') === '1' || getSessionUser() === 'guest';
  }

  function getProfile() {
    var raw = null;
    try {
      raw = JSON.parse(localStorage.getItem('gtk_profile') || 'null');
    } catch (e) {
      raw = null;
    }
    if (!raw || typeof raw !== 'object') return null;

    var fn = (raw.fn || '').trim();
    var ln = (raw.ln || '').trim();
    if (!fn && raw.name) {
      var parts = String(raw.name).trim().split(/\s+/);
      fn = parts[0] || '';
      ln = parts.slice(1).join(' ') || '';
    }
    return {
      fn: fn,
      ln: ln,
      bd: raw.bd || raw.dob || '',
      email: raw.email || '',
      bio: raw.bio || '',
      avColor: typeof raw.avColor === 'number' ? raw.avColor : 0
    };
  }

  function saveProfile(updates) {
    var cur = getProfile() || { fn: '', ln: '', bd: '', email: '', bio: '', avColor: 0 };
    var next = Object.assign({}, cur, updates || {});
    localStorage.setItem('gtk_profile', JSON.stringify(next));
    return next;
  }

  function getProfileDisplayName(prof) {
    var p = prof || getProfile();
    if (!p) return 'Kullanıcı';
    var full = ((p.fn || '') + ' ' + (p.ln || '')).trim();
    return full || p.email || getSessionUser() || 'Kullanıcı';
  }

  function getProfileInitials(prof) {
    var p = prof || getProfile();
    if (!p) return '?';
    var a = (p.fn || '').trim().charAt(0);
    var b = (p.ln || '').trim().charAt(0);
    var ini = (a + b).toUpperCase();
    if (ini) return ini;
    var fallback = (p.email || getSessionUser() || '?').charAt(0).toUpperCase();
    return fallback || '?';
  }

  function isLightColor(hex) {
    if (!hex || typeof hex !== 'string') return false;
    var h = hex.trim().replace('#', '');
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    if (h.length !== 6) return false;
    var r = parseInt(h.slice(0, 2), 16);
    var g = parseInt(h.slice(2, 4), 16);
    var b = parseInt(h.slice(4, 6), 16);
    if (isNaN(r) || isNaN(g) || isNaN(b)) return false;
    var lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return lum > 0.6;
  }

  function applyTheme(explicitTheme) {
    var u = getSessionUser();
    var t = explicitTheme || null;
    if (!t && u) {
      try {
        t = JSON.parse(localStorage.getItem('gtk_theme_' + u) || 'null');
      } catch (e) {
        t = null;
      }
    }
    var r = document.documentElement;
    var isLight = false;

    if (t && t.vars) {
      Object.keys(t.vars).forEach(function (k) {
        r.style.setProperty(k, t.vars[k]);
      });
      if (t.id === 'light' || isLightColor(t.vars['--bg'])) {
        isLight = true;
      }
    }

    r.setAttribute('data-theme', isLight ? 'light' : 'dark');

    if (isLight) {
      r.style.setProperty('--sb-bg', 'rgba(248,248,254,0.98)');
      r.style.setProperty('--sb-border', 'rgba(0,0,0,0.09)');
      r.style.setProperty('--modal-bg', '#ffffff');
      r.style.setProperty('--toast-bg', '#ffffff');
      r.style.setProperty('--input-bg', 'rgba(0,0,0,0.045)');
      r.style.setProperty('--tooltip-bg', 'rgba(255,255,255,0.97)');
      r.style.setProperty('--canvas-grid', 'rgba(0,0,0,0.06)');
      r.style.setProperty('--canvas-axis', 'rgba(26,26,46,0.48)');
      r.style.setProperty('--canvas-zero', 'rgba(26,26,46,0.20)');
      r.style.setProperty('--canvas-empty', 'rgba(26,26,46,0.35)');
      r.style.setProperty('--canvas-dot-border', 'rgba(255,255,255,0.95)');
      r.style.setProperty('--paper', 'rgba(255,252,244,0.95)');
      r.style.setProperty('--paper2', 'rgba(255,255,255,0.92)');
      r.style.setProperty('--ink', '#1f1c18');
      r.style.setProperty('--journal-placeholder', 'rgba(31,28,24,0.35)');
      r.style.setProperty('--journal-line', 'rgba(217,119,6,0.12)');
    } else {
      r.style.setProperty('--sb-bg', 'rgba(9,9,22,0.98)');
      r.style.setProperty('--sb-border', 'rgba(255,255,255,0.09)');
      r.style.setProperty('--modal-bg', '#12122a');
      r.style.setProperty('--toast-bg', '#1a1a36');
      r.style.setProperty('--input-bg', 'rgba(255,255,255,0.05)');
      r.style.setProperty('--tooltip-bg', 'rgba(18,18,42,0.95)');
      r.style.setProperty('--canvas-grid', 'rgba(255,255,255,0.035)');
      r.style.setProperty('--canvas-axis', 'rgba(255,255,255,0.22)');
      r.style.setProperty('--canvas-zero', 'rgba(255,255,255,0.14)');
      r.style.setProperty('--canvas-empty', 'rgba(255,255,255,0.14)');
      r.style.setProperty('--canvas-dot-border', 'rgba(9,9,22,0.85)');
      r.style.setProperty('--paper', 'rgba(255,248,230,0.04)');
      r.style.setProperty('--paper2', 'rgba(255,248,230,0.07)');
      r.style.setProperty('--ink', '#f5f0e8');
      r.style.setProperty('--journal-placeholder', 'rgba(255,248,230,0.22)');
      r.style.setProperty('--journal-line', 'rgba(245,158,11,0.06)');
    }

    if (t && t.fontSize === 'lg') r.style.fontSize = '17px';
    else if (t && t.fontSize === 'sm') r.style.fontSize = '13px';
    else r.style.fontSize = '';

    return isLight;
  }

  var _toastTimer = null;
  function toast(msg, dur) {
    var el = document.getElementById('toast');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('show');
    if (_toastTimer) clearTimeout(_toastTimer);
    _toastTimer = setTimeout(function () {
      el.classList.remove('show');
    }, dur || 2700);
  }

  function renderModeBadge() {
    var sbBody = document.querySelector('.sb-body');
    if (!sbBody || document.getElementById('gtkModePill')) return;
    var guest = isGuestMode();
    var pill = document.createElement('div');
    pill.id = 'gtkModePill';
    pill.style.cssText =
      'margin-top:14px;padding:9px 12px;border-radius:10px;font-size:11px;font-weight:700;' +
      'display:flex;align-items:center;justify-content:space-between;gap:8px;' +
      (guest
        ? 'background:rgba(255,205,71,0.10);border:1px solid rgba(255,205,71,0.28);color:var(--yellow);'
        : 'background:rgba(0,229,160,0.10);border:1px solid rgba(0,229,160,0.25);color:var(--green);');
    pill.innerHTML = guest
      ? '<span>💾 Yerel (Misafir) Mod</span><a href="auth.html" style="color:var(--cyan);text-decoration:none;font-weight:800;">Giriş Yap →</a>'
      : '<span>☁️ Bulut Senkron Aktif</span><span style="opacity:.75;font-size:10px;">Firestore</span>';
    sbBody.appendChild(pill);
  }

  function bindGlobalShortcuts() {
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape') return;
      var openOverlay = document.querySelector('.overlay:not(.hidden)');
      if (openOverlay) {
        openOverlay.classList.add('hidden');
        return;
      }
      var sb = document.getElementById('sidebar');
      if (sb && sb.classList.contains('open')) {
        if (typeof window.closeSidebar === 'function') window.closeSidebar();
        else {
          sb.classList.remove('open');
          var bd = document.getElementById('sbBackdrop');
          if (bd) bd.classList.remove('open');
        }
      }
    });
  }

  // Apply theme immediately to prevent FOUC
  applyTheme();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      bindGlobalShortcuts();
      renderModeBadge();
    });
  } else {
    bindGlobalShortcuts();
    renderModeBadge();
  }

  window.GTK = {
    escHtml: escHtml,
    uid: uid,
    getSessionUser: getSessionUser,
    isGuestMode: isGuestMode,
    getProfile: getProfile,
    saveProfile: saveProfile,
    getProfileDisplayName: getProfileDisplayName,
    getProfileInitials: getProfileInitials,
    applyTheme: applyTheme,
    isLightColor: isLightColor,
    toast: toast,
    renderModeBadge: renderModeBadge
  };
})(window);

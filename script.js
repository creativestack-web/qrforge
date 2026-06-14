'use strict';

var currentType = 'url';
var currentSize = 256;
var qrGenerated = false;
var qrInstance  = null;

/* ═══════════════════════════════════════
   INIT ON DOM READY
═══════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', function () {
  initNavbar();
  initReveal();
  initTypeTabs();
  initSizeTabs();
  initColorPickers();
  initGenerateBtn();
  initDownloadBtns();
  initCopyBtn();
  initResetBtn();
  initContactForm();
  checkInitialReveal();
});

/* ═══════════════════════════════════════
   NAVBAR
═══════════════════════════════════════ */
function initNavbar() {
  var hamburger = document.getElementById('hamburger');
  var mobileNav = document.getElementById('mobile-nav');
  var navbar    = document.getElementById('navbar');
  if (!hamburger || !mobileNav) return;

  hamburger.addEventListener('click', function () {
    var open = mobileNav.classList.contains('open');
    mobileNav.classList.toggle('open', !open);
    hamburger.classList.toggle('open', !open);
    hamburger.setAttribute('aria-expanded', String(!open));
  });

  var links = mobileNav.querySelectorAll('a');
  for (var i = 0; i < links.length; i++) {
    links[i].addEventListener('click', function () {
      mobileNav.classList.remove('open');
      hamburger.classList.remove('open');
      hamburger.setAttribute('aria-expanded', 'false');
    });
  }

  document.addEventListener('click', function (e) {
    if (mobileNav.classList.contains('open') &&
        !mobileNav.contains(e.target) &&
        !hamburger.contains(e.target)) {
      mobileNav.classList.remove('open');
      hamburger.classList.remove('open');
      hamburger.setAttribute('aria-expanded', 'false');
    }
  });

  if (navbar) {
    window.addEventListener('scroll', function () {
      navbar.style.paddingTop    = window.pageYOffset > 50 ? '8px' : '14px';
      navbar.style.paddingBottom = window.pageYOffset > 50 ? '8px' : '14px';
    }, { passive: true });
  }

  /* Smooth scroll */
  var anchors = document.querySelectorAll('a[href^="#"]');
  for (var a = 0; a < anchors.length; a++) {
    anchors[a].addEventListener('click', function (e) {
      var href = this.getAttribute('href');
      if (!href || href === '#') return;
      var target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        window.scrollTo({ top: target.getBoundingClientRect().top + window.pageYOffset - 90, behavior: 'smooth' });
      }
    });
  }
}

/* ═══════════════════════════════════════
   SCROLL REVEAL
═══════════════════════════════════════ */
function initReveal() {
  var els = document.querySelectorAll('.reveal');
  if (!('IntersectionObserver' in window)) {
    for (var i = 0; i < els.length; i++) els[i].classList.add('visible');
    return;
  }
  var obs = new IntersectionObserver(function (entries) {
    for (var e = 0; e < entries.length; e++) {
      if (entries[e].isIntersecting) {
        entries[e].target.classList.add('visible');
        obs.unobserve(entries[e].target);
      }
    }
  }, { threshold: 0.1, rootMargin: '0px 0px -30px 0px' });
  for (var j = 0; j < els.length; j++) obs.observe(els[j]);
}

function checkInitialReveal() {
  var els = document.querySelectorAll('.reveal');
  var wh  = window.innerHeight;
  for (var i = 0; i < els.length; i++) {
    if (els[i].getBoundingClientRect().top < wh * 0.95) {
      els[i].classList.add('visible');
    }
  }
}

/* ═══════════════════════════════════════
   TYPE TABS
═══════════════════════════════════════ */
function initTypeTabs() {
  var tabs = document.querySelectorAll('.type-tab');
  for (var i = 0; i < tabs.length; i++) {
    tabs[i].addEventListener('click', function () {
      currentType = this.getAttribute('data-type');
      var all = document.querySelectorAll('.type-tab');
      for (var t = 0; t < all.length; t++) all[t].classList.remove('active');
      this.classList.add('active');
      var types = ['url','text','email','phone','wifi','vcard'];
      for (var g = 0; g < types.length; g++) {
        var el = document.getElementById('input-' + types[g]);
        if (el) el.classList.toggle('hidden', types[g] !== currentType);
      }
      resetOutput();
    });
  }
}

/* ═══════════════════════════════════════
   SIZE TABS
═══════════════════════════════════════ */
function initSizeTabs() {
  var tabs = document.querySelectorAll('.size-tab');
  for (var i = 0; i < tabs.length; i++) {
    tabs[i].addEventListener('click', function () {
      var all = document.querySelectorAll('.size-tab');
      for (var t = 0; t < all.length; t++) all[t].classList.remove('active');
      this.classList.add('active');
      currentSize = parseInt(this.getAttribute('data-size'), 10);
    });
  }
}

/* ═══════════════════════════════════════
   COLOR PICKERS
═══════════════════════════════════════ */
function initColorPickers() {
  var d = document.getElementById('qr-dark');
  var l = document.getElementById('qr-light');
  var dv = document.getElementById('qr-dark-val');
  var lv = document.getElementById('qr-light-val');
  if (d && dv) d.addEventListener('input', function () { dv.textContent = this.value.toUpperCase(); });
  if (l && lv) l.addEventListener('input', function () { lv.textContent = this.value.toUpperCase(); });
}

/* ═══════════════════════════════════════
   BUILD QR DATA
═══════════════════════════════════════ */
function buildData() {
  var d = '';
  switch (currentType) {
    case 'url':
      d = val('qr-url');
      if (!d) { toast('⚠️ Please enter a URL'); return null; }
      if (!/^https?:\/\//i.test(d)) d = 'https://' + d;
      break;
    case 'text':
      d = val('qr-text');
      if (!d) { toast('⚠️ Please enter some text'); return null; }
      break;
    case 'email':
      var em = val('qr-email');
      if (!em) { toast('⚠️ Please enter an email address'); return null; }
      var sub = val('qr-email-sub');
      var bod = val('qr-email-body');
      d = 'mailto:' + em;
      var params = [];
      if (sub) params.push('subject=' + encodeURIComponent(sub));
      if (bod) params.push('body=' + encodeURIComponent(bod));
      if (params.length) d += '?' + params.join('&');
      break;
    case 'phone':
      var ph = val('qr-phone');
      if (!ph) { toast('⚠️ Please enter a phone number'); return null; }
      d = 'tel:' + ph.replace(/\s/g,'');
      break;
    case 'wifi':
      var ss = val('qr-wifi-ssid');
      if (!ss) { toast('⚠️ Please enter WiFi network name'); return null; }
      var wp = val('qr-wifi-pass');
      var ws = val('qr-wifi-sec') || 'WPA';
      d = 'WIFI:T:' + ws + ';S:' + ss + ';P:' + wp + ';;';
      break;
    case 'vcard':
      var vn = val('qr-vcard-name');
      if (!vn) { toast('⚠️ Please enter a name'); return null; }
      d = 'BEGIN:VCARD\nVERSION:3.0\nFN:' + vn;
      var vp = val('qr-vcard-phone');
      var ve = val('qr-vcard-email');
      var vo = val('qr-vcard-org');
      var vw = val('qr-vcard-web');
      var va = val('qr-vcard-addr');
      if (vp) d += '\nTEL:' + vp;
      if (ve) d += '\nEMAIL:' + ve;
      if (vo) d += '\nORG:' + vo;
      if (vw) d += '\nURL:' + vw;
      if (va) d += '\nADR:;;' + va + ';;;;';
      d += '\nEND:VCARD';
      break;
    default:
      d = val('qr-url') || 'https://qrforge.io';
  }
  return d;
}

/* ═══════════════════════════════════════
   GENERATE QR
═══════════════════════════════════════ */
function initGenerateBtn() {
  var btn = document.getElementById('gen-btn');
  if (!btn) return;
  btn.addEventListener('click', generateQR);

  var inputs = document.querySelectorAll('.gen-input');
  for (var i = 0; i < inputs.length; i++) {
    inputs[i].addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey) generateQR();
    });
  }
}

function generateQR() {
  var data = buildData();
  if (!data) return;

  var darkColor  = document.getElementById('qr-dark')  ? document.getElementById('qr-dark').value  : '#A855F7';
  var lightColor = document.getElementById('qr-light') ? document.getElementById('qr-light').value : '#ffffff';
  var eclVal     = document.getElementById('qr-ecl')   ? document.getElementById('qr-ecl').value   : 'M';
  var ecl        = eclVal === 'L' ? QRCode.CorrectLevel.L : eclVal === 'H' ? QRCode.CorrectLevel.H : QRCode.CorrectLevel.M;
  var renderSize = Math.min(currentSize, 280);

  /* Loading */
  var btnText = document.getElementById('gen-btn-text');
  var btn     = document.getElementById('gen-btn');
  if (btnText) btnText.textContent = '⏳ Generating...';
  if (btn)     btn.disabled = true;

  /* Clear old */
  var out   = document.getElementById('qr-output');
  var empty = document.getElementById('qr-empty-state');
  if (out)   out.innerHTML = '';
  if (empty) empty.style.display = 'flex';

  setTimeout(function () {
    try {
      qrInstance = new QRCode(out, {
        text: data,
        width: renderSize,
        height: renderSize,
        colorDark: darkColor,
        colorLight: lightColor,
        correctLevel: ecl
      });

      if (empty)  empty.style.display = 'none';

      /* Download area */
      var dlArea = document.getElementById('download-area');
      if (dlArea) dlArea.style.display = 'block';

      var preview = document.getElementById('qr-data-preview');
      if (preview) preview.textContent = data.length > 60 ? data.substring(0, 57) + '...' : data;

      /* Hero preview */
      updateHeroPreview(data, darkColor, lightColor);

      qrGenerated = true;
      toast('✅ QR Code ready! Download below.');

    } catch (err) {
      toast('❌ Error. Try a shorter input or different settings.');
      if (empty) empty.style.display = 'flex';
    }

    if (btnText) btnText.textContent = '⚡ Generate QR Code';
    if (btn)     btn.disabled = false;
  }, 250);
}

/* ═══════════════════════════════════════
   HERO PREVIEW UPDATE
═══════════════════════════════════════ */
function updateHeroPreview(data, dark, light) {
  var wrap = document.getElementById('hero-qr-wrap');
  if (!wrap) return;
  wrap.innerHTML = '';
  try {
    new QRCode(wrap, { text: data, width: 160, height: 160, colorDark: dark, colorLight: light, correctLevel: QRCode.CorrectLevel.M });
  } catch (e) { /* silent */ }
}

/* ═══════════════════════════════════════
   DOWNLOAD PNG
═══════════════════════════════════════ */
function initDownloadBtns() {
  var pngBtn = document.getElementById('dl-png');
  var svgBtn = document.getElementById('dl-svg');
  if (pngBtn) pngBtn.addEventListener('click', downloadPNG);
  if (svgBtn) svgBtn.addEventListener('click', downloadSVG);
}

function downloadPNG() {
  if (!qrGenerated) { toast('⚠️ Generate a QR code first!'); return; }
  var out = document.getElementById('qr-output');
  if (!out) return;
  var canvas = out.querySelector('canvas');
  if (!canvas) {
    var img = out.querySelector('img');
    if (img) { triggerDownload(img.src, 'qrforge-qrcode.png'); toast('✅ PNG Downloaded!'); return; }
    toast('⚠️ Please generate a QR code first!'); return;
  }
  if (currentSize > 280) {
    var hi = document.createElement('canvas');
    hi.width = hi.height = currentSize;
    hi.getContext('2d').drawImage(canvas, 0, 0, currentSize, currentSize);
    triggerDownload(hi.toDataURL('image/png'), 'qrforge-' + currentSize + 'px.png');
  } else {
    triggerDownload(canvas.toDataURL('image/png'), 'qrforge-qrcode.png');
  }
  toast('✅ PNG Downloaded!');
}

function downloadSVG() {
  if (!qrGenerated) { toast('⚠️ Generate a QR code first!'); return; }
  var out = document.getElementById('qr-output');
  if (!out) return;
  var canvas = out.querySelector('canvas');
  if (!canvas) { toast('⚠️ Please generate a QR code first!'); return; }
  var imgData = canvas.toDataURL('image/png');
  var s = currentSize;
  var lightColor = document.getElementById('qr-light') ? document.getElementById('qr-light').value : '#ffffff';
  var svg = '<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="' + s + '" height="' + s + '" viewBox="0 0 ' + s + ' ' + s + '">\n<rect width="' + s + '" height="' + s + '" fill="' + lightColor + '"/>\n<image href="' + imgData + '" width="' + s + '" height="' + s + '"/>\n</svg>';
  var blob = new Blob([svg], { type: 'image/svg+xml' });
  var url  = URL.createObjectURL(blob);
  triggerDownload(url, 'qrforge-qrcode.svg');
  URL.revokeObjectURL(url);
  toast('✅ SVG Downloaded!');
}

function triggerDownload(href, filename) {
  var a = document.createElement('a');
  a.href = href;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

/* ═══════════════════════════════════════
   COPY BUTTON
═══════════════════════════════════════ */
function initCopyBtn() {
  var btn = document.getElementById('btn-copy');
  if (!btn) return;
  btn.addEventListener('click', function () {
    if (!qrGenerated) { toast('⚠️ Generate a QR code first!'); return; }
    var data = buildData();
    if (!data) return;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(data).then(function () { toast('📋 Copied to clipboard!'); }).catch(function () { fallbackCopy(data); });
    } else { fallbackCopy(data); }
  });
}

function fallbackCopy(text) {
  var ta = document.createElement('textarea');
  ta.value = text;
  ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0;';
  document.body.appendChild(ta);
  ta.focus(); ta.select();
  try { document.execCommand('copy'); toast('📋 Copied!'); } catch (e) { toast('❌ Could not copy.'); }
  document.body.removeChild(ta);
}

/* ═══════════════════════════════════════
   RESET BUTTON
═══════════════════════════════════════ */
function initResetBtn() {
  var btn = document.getElementById('btn-reset');
  if (!btn) return;
  btn.addEventListener('click', function () {
    /* Reset all inputs */
    var inputs = document.querySelectorAll('.gen-input');
    for (var i = 0; i < inputs.length; i++) inputs[i].value = '';

    /* Reset color pickers */
    var darkPicker  = document.getElementById('qr-dark');
    var lightPicker = document.getElementById('qr-light');
    var darkVal     = document.getElementById('qr-dark-val');
    var lightVal    = document.getElementById('qr-light-val');
    if (darkPicker)  { darkPicker.value  = '#A855F7'; if (darkVal)  darkVal.textContent  = '#A855F7'; }
    if (lightPicker) { lightPicker.value = '#ffffff'; if (lightVal) lightVal.textContent = '#FFFFFF'; }

    /* Reset to URL tab */
    currentType = 'url';
    var allTabs = document.querySelectorAll('.type-tab');
    for (var t = 0; t < allTabs.length; t++) allTabs[t].classList.remove('active');
    var urlTab = document.querySelector('.type-tab[data-type="url"]');
    if (urlTab) urlTab.classList.add('active');

    var types = ['url','text','email','phone','wifi','vcard'];
    for (var g = 0; g < types.length; g++) {
      var el = document.getElementById('input-' + types[g]);
      if (el) el.classList.toggle('hidden', types[g] !== 'url');
    }

    /* Reset size */
    currentSize = 256;
    var sizeTabs = document.querySelectorAll('.size-tab');
    for (var s = 0; s < sizeTabs.length; s++) {
      sizeTabs[s].classList.toggle('active', sizeTabs[s].getAttribute('data-size') === '256');
    }

    resetOutput();
    toast('🔄 Reset complete!');
  });
}

function resetOutput() {
  var out   = document.getElementById('qr-output');
  var empty = document.getElementById('qr-empty-state');
  var dlArea = document.getElementById('download-area');
  if (out)    out.innerHTML = '';
  if (empty)  empty.style.display = 'flex';
  if (dlArea) dlArea.style.display = 'none';

  /* Reset hero preview */
  var heroWrap = document.getElementById('hero-qr-wrap');
  if (heroWrap) {
    heroWrap.innerHTML = '<div class="hero-qr-placeholder"><svg width="50" height="50" viewBox="0 0 24 24" fill="none" stroke="#A855F7" stroke-width="1.5"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="3" height="3"/><rect x="18" y="14" width="3" height="3"/><rect x="14" y="18" width="3" height="3"/><rect x="18" y="18" width="3" height="3"/></svg><p>Your QR appears here</p></div>';
  }

  qrGenerated = false;
  qrInstance  = null;
}

/* ═══════════════════════════════════════
   FAQ ACCORDION
═══════════════════════════════════════ */
window.toggleFaq = function (el) {
  var isOpen = el.classList.contains('open');
  var all = document.querySelectorAll('.faq-item');
  for (var i = 0; i < all.length; i++) all[i].classList.remove('open');
  if (!isOpen) el.classList.add('open');
};

/* ═══════════════════════════════════════
   CONTACT FORM
═══════════════════════════════════════ */
function initContactForm() {
  var form = document.getElementById('contact-form');
  if (!form) return;
  form.addEventListener('submit', handleContact);
}

window.handleContact = function (e) {
  e.preventDefault();
  var name    = val('c-name');
  var email   = val('c-email');
  var subject = val('c-subject');
  var message = val('c-message');
  var errEl   = document.getElementById('c-error');
  var btn     = document.getElementById('c-btn');
  var btnText = document.getElementById('c-btn-text');

  if (!name || !email || !subject || !message) {
    showErr('c-error', 'Please fill in all required fields.');
    return;
  }
  if (!validEmail(email)) {
    showErr('c-error', 'Please enter a valid email address.');
    return;
  }
  if (message.length < 20) {
    showErr('c-error', 'Message must be at least 20 characters.');
    return;
  }

  if (btnText) btnText.textContent = 'Sending...';
  if (btn)     btn.disabled = true;

  setTimeout(function () {
    var formEl = document.getElementById('contact-form');
    var successEl = document.getElementById('contact-success');
    if (formEl)    formEl.style.display = 'none';
    if (successEl) successEl.style.display = 'block';
    if (btnText)   btnText.textContent = 'Send Message →';
    if (btn)       btn.disabled = false;
  }, 1200);
};

window.resetContactForm = function () {
  var formEl    = document.getElementById('contact-form');
  var successEl = document.getElementById('contact-success');
  if (formEl)    { formEl.reset(); formEl.style.display = 'block'; }
  if (successEl) successEl.style.display = 'none';
};

/* ═══════════════════════════════════════
   HELPERS
═══════════════════════════════════════ */
function val(id) {
  var el = document.getElementById(id);
  return el ? el.value.trim() : '';
}

function validEmail(e) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
}

function showErr(id, msg) {
  var el = document.getElementById(id);
  if (!el) return;
  el.textContent = msg;
  el.classList.add('show');
  setTimeout(function () { el.classList.remove('show'); }, 4000);
}

function toast(msg) {
  var t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(function () { t.classList.remove('show'); }, 3000);
}
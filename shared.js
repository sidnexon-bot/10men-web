// shared.js – injects nav, lang switcher, footer into every page
// Usage: <script src="/shared.js"></script> in every HTML file

(function () {

// ── Which page are we on? ──
const segments = location.pathname.split('/').filter(Boolean);
const lastSegment = segments[segments.length - 1] || '';
const isIndexLike = lastSegment === '' || lastSegment.endsWith('/') || !lastSegment.includes('.');

// ── Language from URL path ──
function getLangFromPath() {
const first = segments[0];
if (['en', 'de', 'es'].includes(first)) return first;
return 'cs';
}
const lang = getLangFromPath();

// ── Map URL segment → canonical page key ──
const segmentToKey = {
// cs
'koncerty':         'events',
'kontakt':          'contact',
'o-nas':            'about',
// en
'events':           'events',
'contact':          'contact',
'about':            'about',
// de
'konzerte':         'events',
'uber-uns':         'about',
// es
'conciertos':       'events',
'contacto':         'contact',
'sobre-nosotros':   'about',
// legacy .html filenames (fallback)
'kalendar.html':    'events',
'kontakt.html':     'contact',
'o-nas.html':       'about',
'index.html':       'home',
};

function getCurrentKey() {
for (const seg of [...segments].reverse()) {
if (segmentToKey[seg]) return segmentToKey[seg];
}
return 'home';
}
const currentKey = getCurrentKey();

// ── URL map per language ──
const urls = {
cs: { home: '/',          events: '/koncerty/', contact: '/kontakt/', about: '/o-nas/' },
en: { home: '/en/',       events: '/en/events/', contact: '/en/contact/', about: '/en/about/' },
de: { home: '/de/',       events: '/de/konzerte/', contact: '/de/kontakt/', about: '/de/uber-uns/' },
es: { home: '/es/',       events: '/es/conciertos/', contact: '/es/contacto/', about: '/es/sobre-nosotros/' },
};

function navHref(key) {
return urls[lang][key] || '/';
}

function langSwitchHref(targetLang) {
return urls[targetLang][currentKey] || urls[targetLang]['home'];
}

function isActive(key) {
return currentKey === key ? 'active' : '';
}

// ── Translations ──
const t = {
cs: {
nav_home: '\u00davod', nav_about: 'O n\u00e1s', nav_events: 'Koncerty', nav_contact: 'Kontakt', theme: 'P\u0159epnout tmav\u00fd a sv\u011btl\u00fd re\u017eim', menu: 'Menu', language: 'Jazyk',
addr_label: 'Adresa', social_label: 'Soci\u00e1ln\u00ed s\u00edt\u011b',
footer_copy: '\u00a9 ' + new Date().getFullYear() + ' Vok\u00e1ln\u00ed skupina 10men, z.\u00a0s.', cookies: 'Cookies', privacy: 'Ochrana osobn\u00edch \u00fadaj\u016f',
},
en: {
nav_home: 'Home', nav_about: 'About', nav_events: 'Events', nav_contact: 'Contact', theme: 'Switch dark and light mode', menu: 'Menu', language: 'Language',
addr_label: 'Address', social_label: 'Social Media',
footer_copy: '\u00a9 ' + new Date().getFullYear() + ' Vok\u00e1ln\u00ed skupina 10men, z.\u00a0s.', cookies: 'Cookies', privacy: 'Privacy Policy',
},
de: {
nav_home: 'Startseite', nav_about: '\u00dcber uns', nav_events: 'Konzerte', nav_contact: 'Kontakt', theme: 'Dunkel- und Hellmodus wechseln', menu: 'Men\u00fc', language: 'Sprache',
addr_label: 'Adresse', social_label: 'Soziale Netzwerke',
footer_copy: '\u00a9 ' + new Date().getFullYear() + ' Vok\u00e1ln\u00ed skupina 10men, z.\u00a0s.', cookies: 'Cookies', privacy: 'Datenschutz',
},
es: {
nav_home: 'Inicio', nav_about: 'Sobre nosotros', nav_events: 'Conciertos', nav_contact: 'Contacto', theme: 'Cambiar modo oscuro y claro', menu: 'Men\u00fa', language: 'Idioma',
addr_label: 'Direcci\u00f3n', social_label: 'Redes sociales',
footer_copy: '\u00a9 ' + new Date().getFullYear() + ' Vok\u00e1ln\u00ed skupina 10men, z.\u00a0s.', cookies: 'Cookies', privacy: 'Pol\u00edtica de privacidad',
}
};

function tr(key) { return t[lang][key] || key; }

// ── Render nav ──
function renderNav() {
const depth = location.pathname.split('/').filter(Boolean).length;
const imgBase = '../'.repeat(depth);
const LANG_NAMES = { cs: ['CZ', '\u010ce\u0161tina'], en: ['EN', 'English'], de: ['DE', 'Deutsch'], es: ['ES', 'Espa\u00f1ol'] };
const link = (k) => `<a href="${navHref(k)}" class="${isActive(k)}" data-i18n="nav_${k === 'home' ? 'home' : k}">${tr('nav_' + k)}</a>`;
const keys = ['home', 'about', 'events', 'contact'];
return `<header class="site-header"><div class="nav-inner">
<a href="${navHref('home')}" class="nav-logo" aria-label="10men"><img src="${imgBase}images/logo.jpg" alt="10men" width="143" height="34"></a>
<ul class="nav-links">${keys.map((k) => `<li>${link(k)}</li>`).join('')}</ul>
<div class="nav-tools">
<details class="lang"><summary aria-label="${tr('language')}">${LANG_NAMES[lang][0]}</summary><div class="lang-menu">${Object.keys(LANG_NAMES).map((l) => `<a href="${langSwitchHref(l)}" hreflang="${l}" class="${lang === l ? 'active' : ''}">${LANG_NAMES[l][1]}<span>${LANG_NAMES[l][0]}</span></a>`).join('')}</div></details>
<button type="button" class="icon-btn theme-btn" aria-label="${tr('theme')}" onclick="toggleTheme()"><svg class="i-moon" viewBox="0 0 24 24"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg><svg class="i-sun" viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg></button>
<button type="button" class="icon-btn nav-toggle" aria-label="${tr('menu')}" onclick="toggleMobileNav()"><svg viewBox="0 0 24 24"><path d="M4 7h16M4 12h16M4 17h16"/></svg></button>
</div></div>
<nav class="nav-mobile" id="nav-mobile" aria-label="${tr('menu')}">${keys.map(link).join('')}</nav></header>`;
}

// ── Render footer ──
function renderFooter() {
return `<footer><div class="footer-inner">
<div class="footer-brand"><strong>Vok\u00e1ln\u00ed skupina 10men, z.\u00a0s.</strong><address>Smetanovo n\u00e1b\u0159e\u017e\u00ed 330/16, 110\u00a000 Praha<br>I\u010c 21194297 \u00b7 <a href="mailto:info@10men.cz">info@10men.cz</a></address></div>
<div class="footer-social"><a href="https://www.facebook.com/band10men" target="_blank" rel="noopener" aria-label="Facebook"> <svg viewBox="0 0 24 24"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg> </a> <a href="https://www.instagram.com/band10men" target="_blank" rel="noopener" aria-label="Instagram"> <svg viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" fill="none" stroke="currentColor" stroke-width="1.5"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" stroke="currentColor" stroke-width="2"/></svg> </a> <a href="https://discord.gg/ney4BgmEWB" target="_blank" rel="noopener" aria-label="Discord"> <svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.002.022.015.043.03.056a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/></svg> </a></div>
</div>
<div class="footer-bottom"><span data-i18n="footer_copy">${tr('footer_copy')}</span><span><a href="/cookies.html" data-i18n="cookies">${tr('cookies')}</a> &nbsp;&middot;&nbsp; <a href="/gdpr.html" data-i18n="privacy">${tr('privacy')}</a></span></div>
</footer>`;
}

// ── Mount ──
document.addEventListener('DOMContentLoaded', () => {
const navEl = document.getElementById('nav-placeholder');
const footerEl = document.getElementById('footer-placeholder');
document.documentElement.setAttribute('data-page', currentKey);
if (navEl) navEl.outerHTML = renderNav();
if (footerEl) footerEl.outerHTML = renderFooter();
document.addEventListener('click', (e) => { const d = document.querySelector('.lang[open]'); if (d && !d.contains(e.target)) d.removeAttribute('open'); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { const d = document.querySelector('.lang[open]'); if (d) d.removeAttribute('open'); } });
// plynulé objevování sekcí
const targets = document.querySelectorAll('.sec-in > *, .hero2-text, .next, .stats-in, .cards > *, .event-card, .past-year-group, .tl-item, .award-card, .about-body > *, .contact-body > *, .book-in');
if ('IntersectionObserver' in window && targets.length && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
  document.documentElement.classList.add('reveal-on');
  const io = new IntersectionObserver((es) => es.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } }), { rootMargin: '0px 0px -8% 0px' });
  targets.forEach((t) => { t.classList.add('reveal'); io.observe(t); });
}
});

// ── Global helpers ──
window.setLang = function (l) {
window.location.href = langSwitchHref(l);
};

window.toggleMobileNav = function () {
const m = document.getElementById('nav-mobile');
if (m) m.classList.toggle('open');
};

window.getCurrentLang = function () { return lang; };

// ── Typografie: osamocená jednopísmenná slova na konci řádku ──
// Za v, k, s, z, o, u, a, i, e, y a za dnem v datu (27. listopadu) se mezera změní na pevnou. Běží po načtení stránky, tedy i po dosazení překladů.
(function () {
  const SINGLE = /(?<=^|[\s(\u201e\u201c"'])([KkSsVvZzOoUuAaIiEeYy])[ \t]+(?=\S)/gu, DAY = /(?<![\p{L}\p{N}])(\d{1,2}\.)[ \t]+(?=\p{L})/gu;
  function fix(root) {
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, { acceptNode: (n) => (n.parentElement && n.parentElement.closest('script,style,textarea,input,code,pre,[contenteditable]')) || !/[ \t]/.test(n.nodeValue) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT });
    const nodes = []; while (w.nextNode()) nodes.push(w.currentNode);
    nodes.forEach((n) => { const v = n.nodeValue.replace(SINGLE, '$1\u00a0').replace(DAY, '$1\u00a0'); if (v !== n.nodeValue) n.nodeValue = v; });
  }
  window.fixTypography = fix;
  window.addEventListener('load', () => fix(document.body));
})();

})();

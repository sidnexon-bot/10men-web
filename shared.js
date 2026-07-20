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

// ── Slideshow ──
const images = document.querySelectorAll('.photo-strip img');
let i = 0;
if (images.length) {
setInterval(() => {
images[i].classList.remove('active');
i = (i + 1) % images.length;
images[i].classList.add('active');
}, 4000);
}

// ── Translations ──
const t = {
cs: {
nav_home: '\u00davod', nav_about: 'O n\u00e1s', nav_events: 'Koncerty', nav_contact: 'Kontakt',
addr_label: 'Adresa', social_label: 'Soci\u00e1ln\u00ed s\u00edt\u011b',
footer_copy: '\u00a9 2025 Vok\u00e1ln\u00ed skupina 10men, z.\u00a0s.', cookies: 'Cookies', privacy: 'Ochrana osobn\u00edch \u00fadaj\u016f',
},
en: {
nav_home: 'Home', nav_about: 'About', nav_events: 'Events', nav_contact: 'Contact',
addr_label: 'Address', social_label: 'Social Media',
footer_copy: '\u00a9 2025 Vok\u00e1ln\u00ed skupina 10men, z.\u00a0s.', cookies: 'Cookies', privacy: 'Privacy Policy',
},
de: {
nav_home: 'Startseite', nav_about: '\u00dcber uns', nav_events: 'Konzerte', nav_contact: 'Kontakt',
addr_label: 'Adresse', social_label: 'Soziale Netzwerke',
footer_copy: '\u00a9 2025 Vok\u00e1ln\u00ed skupina 10men, z.\u00a0s.', cookies: 'Cookies', privacy: 'Datenschutz',
},
es: {
nav_home: 'Inicio', nav_about: 'Sobre nosotros', nav_events: 'Conciertos', nav_contact: 'Contacto',
addr_label: 'Direcci\u00f3n', social_label: 'Redes sociales',
footer_copy: '\u00a9 2025 Vok\u00e1ln\u00ed skupina 10men, z.\u00a0s.', cookies: 'Cookies', privacy: 'Pol\u00edtica de privacidad',
}
};

function tr(key) { return t[lang][key] || key; }

// ── Render nav ──
function renderNav() {
const depth = location.pathname.split('/').filter(Boolean).length;
const imgBase = '../'.repeat(depth);
return ` <div class="lang-bar"> <a href="${langSwitchHref('cs')}" class="lang-btn ${lang === 'cs' ? 'active' : ''}">&#127464;&#127487; CZ</a> <a href="${langSwitchHref('en')}" class="lang-btn ${lang === 'en' ? 'active' : ''}">&#127468;&#127463; EN</a> <a href="${langSwitchHref('de')}" class="lang-btn ${lang === 'de' ? 'active' : ''}">&#127465;&#127466; DE</a> <a href="${langSwitchHref('es')}" class="lang-btn ${lang === 'es' ? 'active' : ''}">&#127466;&#127480; ES</a> </div> <nav> <div class="nav-inner"> <a href="${navHref('home')}" class="nav-logo" aria-label="10men"> <img src="${imgBase}images/logo.jpg" alt="10men logo"> <div class="nav-logo-text"> <span>Vok\u00e1ln\u00ed skupina</span> <strong>10men</strong> </div> </a> <ul class="nav-links"> <li><a href="${navHref('home')}"   class="${isActive('home')}"   data-i18n="nav_home">${tr('nav_home')}</a></li> <li><a href="${navHref('about')}"  class="${isActive('about')}"  data-i18n="nav_about">${tr('nav_about')}</a></li> <li><a href="${navHref('events')}" class="${isActive('events')}" data-i18n="nav_events">${tr('nav_events')}</a></li> <li><a href="${navHref('contact')}" class="${isActive('contact')}" data-i18n="nav_contact">${tr('nav_contact')}</a></li> </ul> <button class="nav-toggle" aria-label="Menu" onclick="toggleMobileNav()"> <span></span><span></span><span></span> </button> </div> <div class="nav-mobile" id="nav-mobile"> <a href="${navHref('home')}"   class="${isActive('home')}"   data-i18n="nav_home">${tr('nav_home')}</a> <a href="${navHref('about')}"  class="${isActive('about')}"  data-i18n="nav_about">${tr('nav_about')}</a> <a href="${navHref('events')}" class="${isActive('events')}" data-i18n="nav_events">${tr('nav_events')}</a> <a href="${navHref('contact')}" class="${isActive('contact')}" data-i18n="nav_contact">${tr('nav_contact')}</a> </div> </nav>`;
}

// ── Render footer ──
function renderFooter() {
return ` <footer> <div class="footer-inner"> <div> <h4 data-i18n="addr_label">${tr('addr_label')}</h4> <address> Vok\u00e1ln\u00ed skupina 10men, z.\u00a0s.<br> Smetanovo n\u00e1b\u0159e\u017e\u00ed 330/16<br> 110\u00a000 Praha<br> I\u010c 21194297 </address> </div> <div> <h4>E-mail</h4> <p><a href="mailto:info@10men.cz">info@10men.cz</a></p> </div> <div> <h4 data-i18n="social_label">${tr('social_label')}</h4> <div class="footer-social"> <a href="https://www.facebook.com/band10men" target="_blank" rel="noopener" aria-label="Facebook"> <svg viewBox="0 0 24 24"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg> </a> <a href="https://www.instagram.com/band10men" target="_blank" rel="noopener" aria-label="Instagram"> <svg viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" fill="none" stroke="currentColor" stroke-width="1.5"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" stroke="currentColor" stroke-width="2"/></svg> </a> <a href="https://discord.gg/ney4BgmEWB" target="_blank" rel="noopener" aria-label="Discord"> <svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.002.022.015.043.03.056a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/></svg> </a> </div> </div> </div> <div class="footer-bottom"> <span data-i18n="footer_copy">${tr('footer_copy')}</span> <span> <a href="/cookies.html" data-i18n="cookies">${tr('cookies')}</a> &nbsp;&middot;&nbsp; <a href="/gdpr.html" data-i18n="privacy">${tr('privacy')}</a> </span> </div> </footer>`;
}

// ── Mount ──
document.addEventListener('DOMContentLoaded', () => {
const navEl = document.getElementById('nav-placeholder');
const footerEl = document.getElementById('footer-placeholder');
if (navEl) navEl.outerHTML = renderNav();
if (footerEl) footerEl.outerHTML = renderFooter();
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

})();

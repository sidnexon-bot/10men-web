// shared.js – injects nav, lang switcher, footer into every page
// Usage: <script src="shared.js"></script> at top of <body>

(function () {
// ── Which page are we on? ──
const path = location.pathname.split(’/’).pop() || ‘index.html’;
const active = (href) => path === href ? ‘active’ : ‘’;
const images = document.querySelectorAll(’.photo-strip img’);
let i = 0;
if (images.length) {
setInterval(() => {
images[i].classList.remove(‘active’);
i = (i + 1) % images.length;
images[i].classList.add(‘active’);
}, 4000);
}

// ── Language from URL path ──
function getLangFromPath() {
const first = location.pathname.split(’/’)[1];
if ([‘en’, ‘de’, ‘es’].includes(first)) return first;
return ‘cs’;
}
let lang = getLangFromPath();

// ── Lang switcher href: přesměruje na stejnou stránku v jiném jazyce ──
function langSwitchHref(targetLang) {
const file = path || ‘index.html’;
if (targetLang === ‘cs’) {
return file === ‘index.html’ ? ‘/’ : ‘/’ + file;
}
return ‘/’ + targetLang + ‘/’ + (file === ‘index.html’ ? ‘’ : file);
}

// ── Nav links pro aktuální jazyk ──
function navHref(file) {
if (lang === ‘cs’) {
return file === ‘index.html’ ? ‘/’ : ‘/’ + file;
}
return ‘/’ + lang + ‘/’ + (file === ‘index.html’ ? ‘’ : file);
}

// ── Translations ──
const t = {
cs: {
nav_home: ‘Úvod’, nav_about: ‘O nás’, nav_events: ‘Koncerty’, nav_contact: ‘Kontakt’,
addr_label: ‘Adresa’, social_label: ‘Sociální sítě’, follow: ‘Sledujte nás’,
footer_copy: ‘© 2025 Vokální skupina 10men, z. s.’, cookies: ‘Cookies’, privacy: ‘Ochrana osobních údajů’,
},
en: {
nav_home: ‘Home’, nav_about: ‘About’, nav_events: ‘Events’, nav_contact: ‘Contact’,
addr_label: ‘Address’, social_label: ‘Social Media’, follow: ‘Follow us’,
footer_copy: ‘© 2025 Vokální skupina 10men, z. s.’, cookies: ‘Cookies’, privacy: ‘Privacy Policy’,
},
de: {
nav_home: ‘Startseite’, nav_about: ‘Über uns’, nav_events: ‘Konzerte’, nav_contact: ‘Kontakt’,
addr_label: ‘Adresse’, social_label: ‘Soziale Netzwerke’, follow: ‘Folgen Sie uns’,
footer_copy: ‘© 2025 Vokální skupina 10men, z. s.’, cookies: ‘Cookies’, privacy: ‘Datenschutz’,
},
es: {
nav_home: ‘Inicio’, nav_about: ‘Sobre nosotros’, nav_events: ‘Conciertos’, nav_contact: ‘Contacto’,
addr_label: ‘Dirección’, social_label: ‘Redes sociales’, follow: ‘Síguenos’,
footer_copy: ‘© 2025 Vokální skupina 10men, z. s.’, cookies: ‘Cookies’, privacy: ‘Política de privacidad’,
}
};

function tr(key) { return t[lang][key] || key; }

// ── Inject lang bar + nav ──
function renderNav() {
const imgBase = lang === ‘cs’ ? ‘’ : ‘../’;
return ` <div class="lang-bar"> <a href="${langSwitchHref('cs')}" class="lang-btn ${lang==='cs'?'active':''}">🇨🇿 CZ</a> <a href="${langSwitchHref('en')}" class="lang-btn ${lang==='en'?'active':''}">🇬🇧 EN</a> <a href="${langSwitchHref('de')}" class="lang-btn ${lang==='de'?'active':''}">🇩🇪 DE</a> <a href="${langSwitchHref('es')}" class="lang-btn ${lang==='es'?'active':''}">🇪🇸 ES</a> </div> <nav> <div class="nav-inner"> <a href="${navHref('index.html')}" class="nav-logo" aria-label="10men – domů"> <img src="${imgBase}images/logo.jpg" alt="10men logo"> <div class="nav-logo-text"> <span>Vokální skupina</span> <strong>10men</strong> </div> </a> <ul class="nav-links"> <li><a href="${navHref('index.html')}" class="${active('index.html')}" data-i18n="nav_home">${tr('nav_home')}</a></li> <li><a href="${navHref('o-nas.html')}" class="${active('o-nas.html')}" data-i18n="nav_about">${tr('nav_about')}</a></li> <li><a href="${navHref('kalendar.html')}" class="${active('kalendar.html')}" data-i18n="nav_events">${tr('nav_events')}</a></li> <li><a href="${navHref('kontakt.html')}" class="${active('kontakt.html')}" data-i18n="nav_contact">${tr('nav_contact')}</a></li> </ul> <button class="nav-toggle" aria-label="Menu" onclick="toggleMobileNav()"> <span></span><span></span><span></span> </button> </div> <div class="nav-mobile" id="nav-mobile"> <a href="${navHref('index.html')}" class="${active('index.html')}" data-i18n="nav_home">${tr('nav_home')}</a> <a href="${navHref('o-nas.html')}" class="${active('o-nas.html')}" data-i18n="nav_about">${tr('nav_about')}</a> <a href="${navHref('kalendar.html')}" class="${active('kalendar.html')}" data-i18n="nav_events">${tr('nav_events')}</a> <a href="${navHref('kontakt.html')}" class="${active('kontakt.html')}" data-i18n="nav_contact">${tr('nav_contact')}</a> </div> </nav>`;
}

function renderFooter() {
const imgBase = lang === ‘cs’ ? ‘’ : ‘../’;
return ` <footer> <div class="footer-inner"> <div> <h4 data-i18n="addr_label">${tr('addr_label')}</h4> <address> Vokální skupina 10men, z. s.<br> Smetanovo nábřeží 330/16<br> 110 00 Praha<br> IČ 21194297 </address> </div> <div> <h4>E-mail</h4> <p><a href="mailto:info@10men.cz">info@10men.cz</a></p> </div> <div> <h4 data-i18n="social_label">${tr('social_label')}</h4> <div class="footer-social"> <a href="https://www.facebook.com/band10men" target="_blank" rel="noopener" aria-label="Facebook"> <svg viewBox="0 0 24 24"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg> </a> <a href="https://www.instagram.com/band10men" target="_blank" rel="noopener" aria-label="Instagram"> <svg viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" fill="none" stroke="currentColor" stroke-width="1.5"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" stroke="currentColor" stroke-width="2"/></svg> </a> </div> </div> </div> <div class="footer-bottom"> <span data-i18n="footer_copy">${tr('footer_copy')}</span> <span> <a href="cookies.html" data-i18n="cookies">${tr('cookies')}</a> &nbsp;·&nbsp; <a href="gdpr.html" data-i18n="privacy">${tr('privacy')}</a> </span> </div> </footer>`;
}

// ── Mount ──
document.addEventListener(‘DOMContentLoaded’, () => {
const navPlaceholder = document.getElementById(‘nav-placeholder’);
const footerPlaceholder = document.getElementById(‘footer-placeholder’);
if (navPlaceholder) navPlaceholder.outerHTML = renderNav();
if (footerPlaceholder) footerPlaceholder.outerHTML = renderFooter();
if (lang === ‘cs’) fixCzechTypography();
});

// ── Global helpers ──
window.setLang = function (l) {
window.location.href = langSwitchHref(l);
};

window.toggleMobileNav = function () {
const m = document.getElementById(‘nav-mobile’);
if (m) m.classList.toggle(‘open’);
};

window.getCurrentLang = function () { return lang; };
})();

function fixCzechTypography(root = document) {
const regex = /(\s|^)([aioukvszAIUOKVSZ])\s+(?=\S)/g;
root.querySelectorAll(’[data-i18n]’).forEach(el => {
el.innerHTML = el.innerHTML.replace(regex, ‘$1$2 ’);
});
}

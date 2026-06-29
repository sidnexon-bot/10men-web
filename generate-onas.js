/**
 * generate-onas.js
 * Čte dokument `pages/o-nas` z Firestore a přegeneruje sekce
 * stránky O nás ve všech 4 jazykových mutacích.
 *
 * Spouštění:
 *   node scripts/generate-onas.js   (lokálně, FIREBASE_SERVICE_ACCOUNT v .env.local)
 *   (automaticky přes GitHub Actions)
 */

require('dotenv').config({ path: '.env.local' });
const admin = require('firebase-admin');
const fs    = require('fs');
const path  = require('path');

admin.initializeApp({
  credential: admin.credential.cert(
    JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
  )
});
const db = admin.firestore();

// ── Cesty k souborům ─────────────────────────────────────────────────────────
const FILES = {
  cs: 'o-nas/index.html',
  en: 'en/about/index.html',
  de: 'de/uber-uns/index.html',
  es: 'es/sobre-nosotros/index.html',
};

// ── Fixní UI popisky (neměnné, jen přeložené) ────────────────────────────────
const LABELS = {
  cs: {
    about_subtitle: 'Náš příběh', about_h1: 'O nás',
    hist_label: 'Významné momenty v historii skupiny', hist_title: 'Naše cesta',
    awards_label: 'Úspěchy', awards_title: 'Ocenění & soutěže',
    conductor_label: 'Umělecký vedoucí',
  },
  en: {
    about_subtitle: 'Our story', about_h1: 'About us',
    hist_label: 'Key milestones in our history', hist_title: 'Our journey',
    awards_label: 'Achievements', awards_title: 'Awards & competitions',
    conductor_label: 'Artistic director',
  },
  de: {
    about_subtitle: 'Unsere Geschichte', about_h1: 'Über uns',
    hist_label: 'Wichtige Meilensteine unserer Geschichte', hist_title: 'Unser Weg',
    awards_label: 'Erfolge', awards_title: 'Auszeichnungen & Wettbewerbe',
    conductor_label: 'Künstlerischer Leiter',
  },
  es: {
    about_subtitle: 'Nuestra historia', about_h1: 'Sobre nosotros',
    hist_label: 'Momentos clave en nuestra historia', hist_title: 'Nuestro camino',
    awards_label: 'Logros', awards_title: 'Premios y concursos',
    conductor_label: 'Director artístico',
  },
};

// ── Pomocné funkce ────────────────────────────────────────────────────────────
// Escapování pro JS string literal se single quotes
function esc(s) {
  return (s || '')
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/\r?\n/g, '\\n');
}

function get(obj, lang) {
  return (obj && obj[lang]) || '';
}

// ── Generování i18n script bloku (společný pro všechny 4 soubory) ─────────────
function buildI18nBlock(data) {
  const tl = (data.timeline || []).sort((a, b) => a.year - b.year);
  const aw = data.awards || [];
  const a  = data.about || {};
  const c  = data.conductor || {};

  const langBlocks = ['cs', 'en', 'de', 'es'].map(lang => {
    const keys = {
      ...LABELS[lang],
      about_lead: get(a.lead, lang),
      about_p1:   get(a.p1,   lang),
      about_p2:   get(a.p2,   lang),
      about_p3:   get(a.p3,   lang),
      conductor_name: c.name || '',
      conductor_p:    get(c.bio, lang),
    };

    tl.forEach(item => {
      keys[`tl_${item.year}_h`] = get(item.h, lang);
      keys[`tl_${item.year}_p`] = get(item.p, lang);
    });

    aw.forEach(award => {
      keys[`award_${award.id}`] = get(award.desc, lang);
    });

    const entries = Object.entries(keys)
      .map(([k, v]) => `      ${k}: '${esc(v)}'`)
      .join(',\n');

    return `  ${lang}: {\n${entries}\n  }`;
  }).join(',\n');

  // applyI18n a DOMContentLoaded listener zůstávají stejné jako v originále
  return `<script>
  const i18n = {
${langBlocks}
  };

  window.applyI18n = function(lang) {
    Object.keys(i18n[lang]).forEach(key => {
      document.querySelectorAll('[data-i18n="' + key + '"]').forEach(el => {
        el.textContent = i18n[lang][key];
      });
    });
  };
  document.addEventListener('DOMContentLoaded', () => {
    window.applyI18n(window.getCurrentLang ? window.getCurrentLang() : 'cs');
  });
</script>`;
}

// ── Generování HTML pro timeline ──────────────────────────────────────────────
function buildTimeline(timeline) {
  const items = (timeline || []).sort((a, b) => a.year - b.year);
  if (items.length === 0) return '';
  return items.map(item => `    <div class="tl-item">
      <div class="tl-year">${item.year}</div>
      <div class="tl-content">
        <h3 data-i18n="tl_${item.year}_h"></h3>
        <p data-i18n="tl_${item.year}_p"></p>
      </div>
    </div>`).join('\n');
}

// ── Generování HTML pro ocenění ───────────────────────────────────────────────
function buildAwards(awards) {
  if (!awards || awards.length === 0) return '';
  return awards.map(award => `    <div class="award-card">
      <div class="award-year">${award.years || ''}</div>
      <h3>${award.name || ''}</h3>
      <p data-i18n="award_${award.id}"></p>
    </div>`).join('\n');
}

// ── Nahrazení obsahu mezi značkami ───────────────────────────────────────────
function replaceSection(html, marker, content) {
  const start = `<!-- GEN:${marker}:START -->`;
  const end   = `<!-- GEN:${marker}:END -->`;
  const re    = new RegExp(`${start}[\\s\\S]*?${end}`);
  if (!re.test(html)) {
    throw new Error(`Značka ${start} nebyla nalezena! Přidej ji do HTML.`);
  }
  return html.replace(re, `${start}\n${content}\n  ${end}`);
}

// ── Hlavní logika ─────────────────────────────────────────────────────────────
async function generate() {
  console.log('📥 Načítám data O nás z Firestore…');
  const snap = await db.collection('pages').doc('o-nas').get();

  if (!snap.exists) {
    console.error('❌ Dokument pages/o-nas neexistuje. Nejprve ho vytvoř v adminu nebo spusť init-onas.js.');
    process.exit(1);
  }

  const data = snap.data();
  console.log(`   Timeline: ${(data.timeline || []).length} položek, Ocenění: ${(data.awards || []).length} karet\n`);

  const i18nBlock    = buildI18nBlock(data);
  const timelineHtml = buildTimeline(data.timeline);
  const awardsHtml   = buildAwards(data.awards);

  for (const [lang, filePath] of Object.entries(FILES)) {
    const fullPath = path.join(__dirname, '..', filePath);
    if (!fs.existsSync(fullPath)) {
      console.warn(`⚠️  Soubor nenalezen, přeskakuji: ${fullPath}`);
      continue;
    }

    let html = fs.readFileSync(fullPath, 'utf8');
    html = replaceSection(html, 'ONAS-I18N',      i18nBlock);
    html = replaceSection(html, 'ONAS-TIMELINE',  timelineHtml);
    html = replaceSection(html, 'ONAS-AWARDS',    awardsHtml);
    fs.writeFileSync(fullPath, html, 'utf8');
    console.log(`✓  ${lang.toUpperCase()}: ${filePath}`);
  }

  console.log('\n✅ Hotovo!');
  process.exit(0);
}

generate().catch(err => {
  console.error('❌ Chyba:', err.message);
  process.exit(1);
});

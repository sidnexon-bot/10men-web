/**
 * generate-concerts.js
 * Čte kolekci `concerts` z Firestore a přegeneruje sekce
 * nadcházejících i proběhlých akcí ve všech 4 jazykových mutacích.
 *
 * Spouštění:
 *   node scripts/generate-concerts.js          (lokálně, FIREBASE_SERVICE_ACCOUNT v .env)
 *   (automaticky přes GitHub Actions)
 */

require('dotenv').config({ path: '.env.local' }); // jen pro lokální testování
const admin = require('firebase-admin');
const fs    = require('fs');
const path  = require('path');

// ── Firebase init ────────────────────────────────────────────────────────────
admin.initializeApp({
  credential: admin.credential.cert(
    JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
  )
});
const db = admin.firestore();

// ── Cesty k souborům ─────────────────────────────────────────────────────────
// Ověř, že odpovídají skutečným názvům složek v repozitáři!
const FILES = {
  cs: 'koncerty/index.html',
  en: 'en/events/index.html',
  de: 'de/konzerte/index.html',
  es: 'es/conciertos/index.html',
};

// ── Překlady ─────────────────────────────────────────────────────────────────
const MONTH_SHORT = {
  cs: ['Led','Úno','Bře','Dub','Kvě','Čvn','Čvc','Srp','Zář','Říj','Lis','Pro'],
  en: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
  de: ['Jan','Feb','Mär','Apr','Mai','Jun','Jul','Aug','Sep','Okt','Nov','Dez'],
  es: ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'],
};

const MONTH_LONG = {
  cs: ['ledna','února','března','dubna','května','června','července','srpna','září','října','listopadu','prosince'],
  en: ['January','February','March','April','May','June','July','August','September','October','November','December'],
  de: ['Januar','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember'],
  es: ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'],
};

const NO_UPCOMING = {
  cs: 'Momentálně neplánujeme žádné akce. Sledujte nás na Facebooku.',
  en: 'No upcoming events at the moment. Follow us on Facebook.',
  de: 'Derzeit sind keine Veranstaltungen geplant. Folge uns auf Facebook.',
  es: 'Sin eventos próximos. Síguenos en Facebook.',
};

const TIME_TBC = {
  cs: 'čas bude upřesněn',
  en: 'time TBC',
  de: 'Zeit folgt',
  es: 'hora por confirmar',
};

// ── SVG ikony (inline, stejné jako v originále) ───────────────────────────────
const SVG_PIN     = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>`;
const SVG_CLOCK   = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`;
const SVG_CHEVRON = `<svg viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg>`;

// ── Formátování datumu pro archiv ─────────────────────────────────────────────
// Pokud má akce pole `dateDisplay` (objekt {cs,en,de,es}), použije se to
// (pro rozsahy jako "4.–6. října 2024"). Jinak se formátuje z Timestamp.
function formatDatePast(concert, lang) {
  if (concert.dateDisplay && concert.dateDisplay[lang]) {
    return concert.dateDisplay[lang];
  }
  const d = concert.date.toDate();
  const day   = d.getDate();
  const month = d.getMonth();
  const year  = d.getFullYear();
  switch (lang) {
    case 'cs': return `${day}. ${MONTH_LONG.cs[month]} ${year}`;
    case 'en': return `${MONTH_LONG.en[month]} ${day}, ${year}`;
    case 'de': return `${day}. ${MONTH_LONG.de[month]} ${year}`;
    case 'es': return `${day} de ${MONTH_LONG.es[month]} de ${year}`;
  }
}

// ── Generování: nadcházející akce ─────────────────────────────────────────────
function buildUpcomingCards(concerts, lang) {
  if (concerts.length === 0) {
    return `    <p class="event-desc" style="color:var(--gray-text)">${NO_UPCOMING[lang]}</p>`;
  }

  const delays = ['delay-1', 'delay-2', 'delay-3'];

  return concerts.map((c, i) => {
    const d      = c.date.toDate();
    const day    = d.getDate();
    const month  = MONTH_SHORT[lang][d.getMonth()];
    const desc   = c[`desc_${lang}`] || c.desc_cs || '';
    const delay  = delays[i] || '';

    const attrMaps    = c.mapsUrl    ? ` data-maps="${c.mapsUrl}"`       : '';
    const attrFb      = c.fbUrl      ? ` data-fb="${c.fbUrl}"`           : ' data-fb=""';
    const attrTickets = c.ticketsUrl ? ` data-tickets="${c.ticketsUrl}"` : ' data-tickets=""';
    const time        = c.time || TIME_TBC[lang];

    return `    <div class="event-card fade-up ${delay}"${attrMaps}${attrFb}${attrTickets}>
      <div class="event-header">
        <div class="event-date">
          <div class="day">${day}</div>
          <div class="month">${month}</div>
        </div>
        <div class="event-info">
          <h3>${c.title}</h3>
          <div class="event-meta">
            <span>${SVG_PIN} ${c.venue}</span>
            <span>${SVG_CLOCK} ${time}</span>
          </div>
        </div>
        <div class="event-toggle">${SVG_CHEVRON}</div>
      </div>
      <div class="event-body">
        <p class="event-desc">${desc}</p>
        <div class="event-links"></div>
      </div>
    </div>`;
  }).join('\n\n');
}

// ── Generování: proběhlé akce (seskupené po letech) ───────────────────────────
function buildPastSection(concerts, lang) {
  // Seskup po letech
  const byYear = {};
  concerts.forEach(c => {
    const year = c.date.toDate().getFullYear();
    if (!byYear[year]) byYear[year] = [];
    byYear[year].push(c);
  });

  // Roky sestupně
  return Object.keys(byYear)
    .sort((a, b) => b - a)
    .map((year, yi) => {
      const openClass = yi === 0 ? ' open' : ''; // první rok vždy rozbalený
      const rows = byYear[year].map(c => {
        const dateStr    = formatDatePast(c, lang);
        const nameInner  = c.highlight ? `<strong>${c.title}</strong>` : c.title;
        const photosAttr = c.photosUrl ? ` data-photos="${c.photosUrl}"` : '';
        return `      <div class="past-event"${photosAttr}><div class="past-event-date">${dateStr}</div><div class="past-event-name">${nameInner}</div></div>`;
      }).join('\n');

      return `  <div class="past-year-group${openClass}">
    <button class="past-year-label">${year}</button>
    <div class="past-year-content">
${rows}
    </div>
  </div>`;
    }).join('\n\n');
}

// ── Nahrazení obsahu mezi značkami ───────────────────────────────────────────
function replaceSection(html, marker, content) {
  const start = `<!-- GEN:${marker}:START -->`;
  const end   = `<!-- GEN:${marker}:END -->`;
  const re    = new RegExp(`${start}[\\s\\S]*?${end}`);
  if (!re.test(html)) {
    throw new Error(`Značka ${start} nebyla nalezena! Přidej ji do HTML.`);
  }
  return html.replace(re, `${start}\n${content}\n    ${end}`);
}

// ── Hlavní logika ─────────────────────────────────────────────────────────────
async function generate() {
  console.log('📥 Načítám koncerty z Firestore…');
  const snapshot = await db.collection('concerts').orderBy('date', 'desc').get();
  const all = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  console.log(`   Nalezeno ${all.length} záznamů.`);

  const now      = new Date();
  const upcoming = all
    .filter(c => c.type === 'upcoming')
    .sort((a, b) => a.date.toMillis() - b.date.toMillis());
  const past     = all
    .filter(c => c.type === 'past')
    .sort((a, b) => b.date.toMillis() - a.date.toMillis());

  console.log(`   Nadcházející: ${upcoming.length}, Proběhlé: ${past.length}`);
  console.log('');

  for (const lang of Object.keys(FILES)) {
    const filePath = path.join(__dirname, '..', FILES[lang]);

    if (!fs.existsSync(filePath)) {
      console.warn(`⚠️  Soubor nenalezen, přeskakuji: ${filePath}`);
      continue;
    }

    let html = fs.readFileSync(filePath, 'utf8');
    html = replaceSection(html, 'UPCOMING', buildUpcomingCards(upcoming, lang));
    html = replaceSection(html, 'PAST',     buildPastSection(past, lang));
    fs.writeFileSync(filePath, html, 'utf8');
    console.log(`✓  ${lang.toUpperCase()}: ${FILES[lang]}`);
  }

  console.log('\n✅ Hotovo!');
  process.exit(0);
}

generate().catch(err => {
  console.error('❌ Chyba:', err.message);
  process.exit(1);
});

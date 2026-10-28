#!/usr/bin/env node
/**
 * build-site.js – generátor webu 10men.cz (nahrazuje generate-concerts.js, generate-onas.js a translate.js).
 *
 * Zdroj dat je zveřejněný snímek z admin portálu (/web/published v realtime databázi 10men, čitelný veřejně, bez klíče):
 *   WEB_PUBLISHED_URL   adresa snímku (výchozí: produkční databáze)
 *   --data soubor.json  místo adresy použije lokální soubor (testy)
 *   --root složka       kořen repozitáře webu (výchozí: nadřazená složka skriptu)
 *   --today RRRR-MM-DD  „dnešek“ pro rozdělení na nadcházející a proběhlé (testy)
 *   --check             nic nezapisuje; skončí chybou, když by se něco změnilo
 *
 * Co generuje: akce (nadcházející i archiv + strukturovaná data), stránku „O nás“, čísla na úvodní stránce a ve všech 16 stránkách
 * jazyk dokumentu, titulek, popis, canonical, hreflang a Open Graph; texty se předvykreslí do HTML (funguje i bez JavaScriptu)
 * a nakonec se přegeneruje sitemap.xml. Všechny texty z dat se escapují. Běh je idempotentní.
 */
const fs = require("fs"), path = require("path"), vm = require("vm");

const arg = (n, d) => { const i = process.argv.indexOf("--" + n); return i >= 0 ? process.argv[i + 1] : d; };
const ROOT = path.resolve(arg("root", path.join(__dirname, "..")));
const CHECK = process.argv.includes("--check");
const LANGS = ["cs", "en", "de", "es"], SITE = "https://10men.cz";
const URL_DEFAULT = "https://base-39f52-default-rtdb.europe-west1.firebasedatabase.app/web/published.json";
const pragueToday = () => new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Prague", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
const TODAY = arg("today", pragueToday());

// ── stránky a adresy (shodné se shared.js) ──
const PAGES = {
  home:    { cs: "index.html", en: "en/index.html", de: "de/index.html", es: "es/index.html" },
  events:  { cs: "koncerty/index.html", en: "en/events/index.html", de: "de/konzerte/index.html", es: "es/conciertos/index.html" },
  about:   { cs: "o-nas/index.html", en: "en/about/index.html", de: "de/uber-uns/index.html", es: "es/sobre-nosotros/index.html" },
  contact: { cs: "kontakt/index.html", en: "en/contact/index.html", de: "de/kontakt/index.html", es: "es/contacto/index.html" },
};
const PATHS = { home: { cs: "/", en: "/en/", de: "/de/", es: "/es/" }, events: { cs: "/koncerty/", en: "/en/events/", de: "/de/konzerte/", es: "/es/conciertos/" }, about: { cs: "/o-nas/", en: "/en/about/", de: "/de/uber-uns/", es: "/es/sobre-nosotros/" }, contact: { cs: "/kontakt/", en: "/en/contact/", de: "/de/kontakt/", es: "/es/contacto/" } };
const SEO = {
  home: { cs: ["Vokální skupina 10men – mužská a cappella z Prahy", "Jsme 10men, pražská mužská vokální skupina. Zpíváme pop, jazz, swing a klasiku. Sledujte nás a přijďte na koncert!"], en: ["10men Vocal Group – male a cappella from Prague", "We are 10men, a male vocal group from Prague singing pop, jazz, swing and classics. Follow us and come to a concert!"], de: ["10men Vokalgruppe – Männer-A-cappella aus Prag", "Wir sind 10men, eine Männer-Vokalgruppe aus Prag. Wir singen Pop, Jazz, Swing und Klassik. Folgen Sie uns und kommen Sie zum Konzert!"], es: ["10men Grupo vocal – a cappella masculino de Praga", "Somos 10men, un grupo vocal masculino de Praga. Cantamos pop, jazz, swing y clásica. ¡Síguenos y ven a un concierto!"] },
  events: { cs: ["Koncerty a akce – 10men", "Nadcházející koncerty a archiv vystoupení pražské vokální skupiny 10men."], en: ["Concerts and events – 10men", "Upcoming concerts and archive of performances by the Prague vocal group 10men."], de: ["Konzerte und Termine – 10men", "Kommende Konzerte und Archiv der Auftritte der Prager Vokalgruppe 10men."], es: ["Conciertos y eventos – 10men", "Próximos conciertos y archivo de actuaciones del grupo vocal 10men de Praga."] },
  about: { cs: ["O nás – 10men", "Historie, úspěchy a umělecký vedoucí pražské mužské vokální skupiny 10men."], en: ["About us – 10men", "History, achievements and artistic director of the Prague male vocal group 10men."], de: ["Über uns – 10men", "Geschichte, Erfolge und künstlerischer Leiter der Prager Männer-Vokalgruppe 10men."], es: ["Sobre nosotros – 10men", "Historia, logros y director artístico del grupo vocal masculino 10men de Praga."] },
  contact: { cs: ["Kontakt – 10men", "Napište nám kvůli vystoupení nebo spolupráci. Vokální skupina 10men, Praha."], en: ["Contact – 10men", "Write to us about a performance or collaboration. Vocal group 10men, Prague."], de: ["Kontakt aufnehmen – 10men", "Schreiben Sie uns wegen eines Auftritts oder einer Zusammenarbeit. Vokalgruppe 10men, Prag."], es: ["Contacto – 10men", "Escríbenos para actuaciones o colaboraciones. Grupo vocal 10men, Praga."] },
};
const OG_LOCALE = { cs: "cs_CZ", en: "en_US", de: "de_DE", es: "es_ES" };
const SITEMAP = { home: ["monthly", "1.0"], events: ["weekly", "0.9"], about: ["monthly", "0.8"], contact: ["yearly", "0.7"] };

// ── překlady pevných textů ──
const MONTH_SHORT = { cs: ["Led", "Úno", "Bře", "Dub", "Kvě", "Čvn", "Čvc", "Srp", "Zář", "Říj", "Lis", "Pro"], en: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"], de: ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"], es: ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"] };
const MONTH_LONG = { cs: ["ledna", "února", "března", "dubna", "května", "června", "července", "srpna", "září", "října", "listopadu", "prosince"], en: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"], de: ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"], es: ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"] };
const NO_UPCOMING = { cs: "Momentálně neplánujeme žádné akce. Sledujte nás na Facebooku.", en: "No upcoming events at the moment. Follow us on Facebook.", de: "Derzeit sind keine Veranstaltungen geplant. Folge uns auf Facebook.", es: "Sin eventos próximos. Síguenos en Facebook." };
const TIME_TBC = { cs: "čas bude upřesněn", en: "time TBC", de: "Zeit folgt", es: "hora por confirmar" };
const LABELS = {
  cs: { about_subtitle: "Náš příběh", about_h1: "O nás", hist_label: "Významné momenty v historii skupiny", hist_title: "Naše cesta", awards_label: "Úspěchy", awards_title: "Ocenění & soutěže", conductor_label: "Umělecký vedoucí" },
  en: { about_subtitle: "Our story", about_h1: "About us", hist_label: "Key milestones in our history", hist_title: "Our journey", awards_label: "Achievements", awards_title: "Awards & competitions", conductor_label: "Artistic director" },
  de: { about_subtitle: "Unsere Geschichte", about_h1: "Über uns", hist_label: "Wichtige Meilensteine unserer Geschichte", hist_title: "Unser Weg", awards_label: "Erfolge", awards_title: "Auszeichnungen & Wettbewerbe", conductor_label: "Künstlerischer Leiter" },
  es: { about_subtitle: "Nuestra historia", about_h1: "Sobre nosotros", hist_label: "Momentos clave en nuestra historia", hist_title: "Nuestro camino", awards_label: "Logros", awards_title: "Premios y concursos", conductor_label: "Director artístico" },
};
const SVG_PIN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>';
const SVG_CLOCK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>';
const SVG_CHEVRON = '<svg viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg>';

// ── bezpečnost výstupu ──
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const safeUrl = (u) => { try { const x = new URL(String(u)); return x.protocol === "https:" ? x.toString() : ""; } catch { return ""; } };
const jsStr = (s) => JSON.stringify(String(s ?? "")).replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/&/g, "\\u0026").replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");
const ldJson = (o) => JSON.stringify(o).replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/&/g, "\\u0026");
const L = (obj, lang) => (obj && (obj[lang] || obj.cs)) || "";

// ── obsah akcí ──
function dayParts(date) { const [y, m, d] = date.split("-").map(Number); return { y, m: m - 1, d }; }
function formatDatePast(c, lang) {
  if (c.dateDisplay && c.dateDisplay[lang]) return c.dateDisplay[lang];
  const { y, m, d } = dayParts(c.date);
  return lang === "en" ? `${MONTH_LONG.en[m]} ${d}, ${y}` : lang === "es" ? `${d} de ${MONTH_LONG.es[m]} de ${y}` : `${d}. ${MONTH_LONG[lang][m]} ${y}`;
}
function buildUpcoming(list, lang) {
  if (!list.length) return `    <p class="event-desc" style="color:var(--gray-text)">${esc(NO_UPCOMING[lang])}</p>`;
  const delays = ["delay-1", "delay-2", "delay-3"];
  const cards = list.map((c, i) => {
    const { m, d } = dayParts(c.date), maps = safeUrl(c.mapsUrl), fb = safeUrl(c.fbUrl), tix = safeUrl(c.ticketsUrl);
    const attrs = `${maps ? ` data-maps="${esc(maps)}"` : ""} data-fb="${esc(fb)}" data-tickets="${esc(tix)}"`;
    return `    <div class="event-card fade-up ${delays[i] || ""}"${attrs}>
      <div class="event-header">
        <div class="event-date">
          <div class="day">${d}</div>
          <div class="month">${MONTH_SHORT[lang][m]}</div>
        </div>
        <div class="event-info">
          <h3>${esc(L(c.title, lang))}</h3>
          <div class="event-meta">
            <span>${SVG_PIN} ${esc(L(c.venue, lang))}</span>
            <span>${SVG_CLOCK} ${esc(c.time || TIME_TBC[lang])}</span>
          </div>
        </div>
        <div class="event-toggle">${SVG_CHEVRON}</div>
      </div>
      <div class="event-body">
        <p class="event-desc">${esc(L(c.desc, lang))}</p>
        <div class="event-links"></div>
      </div>
    </div>`;
  }).join("\n\n");
  const ld = list.map((c) => ({ "@context": "https://schema.org", "@type": "MusicEvent", name: L(c.title, lang), startDate: c.time ? `${c.date}T${c.time}` : c.date, eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode", eventStatus: "https://schema.org/EventScheduled", location: { "@type": "Place", name: L(c.venue, lang), address: L(c.venue, lang) }, performer: { "@type": "MusicGroup", name: "10men", url: SITE + "/" }, description: L(c.desc, lang), ...(safeUrl(c.ticketsUrl) ? { offers: { "@type": "Offer", url: safeUrl(c.ticketsUrl) } } : {}) }));
  return `${cards}\n    <script type="application/ld+json">${ldJson(ld)}</script>`;
}
function buildPast(list, lang) {
  const byYear = {}; list.forEach((c) => { (byYear[c.date.slice(0, 4)] = byYear[c.date.slice(0, 4)] || []).push(c); });
  return Object.keys(byYear).sort((a, b) => b - a).map((year, yi) => {
    const rows = byYear[year].map((c) => {
      const photos = safeUrl(c.photosUrl), title = esc(L(c.title, lang));
      return `      <div class="past-event"${photos ? ` data-photos="${esc(photos)}"` : ""}><div class="past-event-date">${esc(formatDatePast(c, lang))}</div><div class="past-event-name">${c.highlight ? `<strong>${title}</strong>` : title}</div></div>`;
    }).join("\n");
    return `  <div class="past-year-group${yi === 0 ? " open" : ""}">\n    <button class="past-year-label">${esc(year)}</button>\n    <div class="past-year-content">\n${rows}\n    </div>\n  </div>`;
  }).join("\n\n");
}
// ── O nás ──
function buildOnasDict(d, lang) {
  const k = { ...LABELS[lang], about_lead: L((d.about || {}).lead, lang), about_p1: L((d.about || {}).p1, lang), about_p2: L((d.about || {}).p2, lang), about_p3: L((d.about || {}).p3, lang), conductor_name: (d.conductor || {}).name || "", conductor_p: L((d.conductor || {}).bio, lang) };
  (d.timeline || []).forEach((t) => { k[`tl_${t.year}_h`] = L(t.h, lang); k[`tl_${t.year}_p`] = L(t.p, lang); });
  (d.awards || []).forEach((a) => { k[`award_${a.id}`] = L(a.desc, lang); });
  return k;
}
const buildTimeline = (tl) => (tl || []).map((t) => `    <div class="tl-item">\n      <div class="tl-year">${esc(t.year)}</div>\n      <div class="tl-content">\n        <h3 data-i18n="tl_${esc(t.year)}_h"></h3>\n        <p data-i18n="tl_${esc(t.year)}_p"></p>\n      </div>\n    </div>`).join("\n");
const buildAwards = (aw) => (aw || []).map((a) => `    <div class="award-card">\n      <div class="award-year">${esc(a.years || "")}</div>\n      <h3>${esc(a.name || "")}</h3>\n      <p data-i18n="award_${esc(a.id)}"></p>\n    </div>`).join("\n");
function buildI18nBlock(d) {
  const langBlocks = LANGS.map((l) => `  ${l}: {\n${Object.entries(buildOnasDict(d, l)).map(([k, v]) => `      ${k}: ${jsStr(v)}`).join(",\n")}\n  }`).join(",\n");
  return `<script>\n  const i18n = {\n${langBlocks}\n  };\n\n  window.applyI18n = function(lang) {\n    Object.keys(i18n[lang]).forEach(key => {\n      document.querySelectorAll('[data-i18n="' + key + '"]').forEach(el => {\n        el.textContent = i18n[lang][key];\n      });\n    });\n  };\n  document.addEventListener('DOMContentLoaded', () => {\n    window.applyI18n(window.getCurrentLang ? window.getCurrentLang() : 'cs');\n  });\n</script>`;
}

// ── práce s HTML ──
function replaceSection(html, marker, content, file) {
  const start = `<!-- GEN:${marker}:START -->`, end = `<!-- GEN:${marker}:END -->`, i = html.indexOf(start), j = html.indexOf(end);
  if (i < 0 || j < i) throw new Error(`${file}: chybí značka ${start}`);
  return html.slice(0, i) + `${start}\n${content}\n  ${end}` + html.slice(j + end.length);
}
function loadI18nObject(html) {
  const m = /const i18n = \{[\s\S]*?\n\s*\};/.exec(html); if (!m) return null;
  const ctx = {}; vm.createContext(ctx); try { vm.runInContext(m[0].replace("const i18n =", "__i18n ="), ctx, { timeout: 1000 }); } catch { return null; } return ctx.__i18n;
}
// textové uzly s data-i18n se předvykreslí do jazyka stránky (jen čistý text, bez vnořených značek)
function prerender(html, lang) {
  const dict = (loadI18nObject(html) || {})[lang]; if (!dict) return { html, n: 0 };
  let n = 0;
  const out = html.replace(/<(\w+)([^>]*?)\sdata-i18n="([\w-]+)"([^>]*)>([^<]*)<\/\1>/g, (all, tag, a1, key, a2, inner) => {
    const v = dict[key]; if (typeof v !== "string" || /[<>]/.test(v) || !v.trim()) return all;
    const rep = `<${tag}${a1} data-i18n="${key}"${a2}>${esc(v)}</${tag}>`;
    if (rep !== all) n++;
    return rep;
  });
  return { html: out, n };
}
function headBlock(page, lang) {
  const [title, desc] = SEO[page][lang], url = SITE + PATHS[page][lang];
  const alt = LANGS.map((l) => `    <link rel="alternate" hreflang="${l}" href="${SITE + PATHS[page][l]}">`).join("\n") + `\n    <link rel="alternate" hreflang="x-default" href="${SITE + PATHS[page].cs}">`;
  return `    <title>${esc(title)}</title>
    <meta name="description" content="${esc(desc)}">
    <link rel="canonical" href="${url}">
${alt}
    <meta property="og:type" content="website">
    <meta property="og:site_name" content="10men">
    <meta property="og:locale" content="${OG_LOCALE[lang]}">
    <meta property="og:title" content="${esc(title)}">
    <meta property="og:description" content="${esc(desc)}">
    <meta property="og:url" content="${url}">
    <meta property="og:image" content="${SITE}/images/foto_01.jpg">
    <meta name="twitter:card" content="summary_large_image">`;
}
function applyHead(html, page, lang, file) {
  html = html.replace(/<html[^>]*>/, `<html lang="${lang}">`);
  const block = `<!-- GEN:HEAD:START -->\n${headBlock(page, lang)}\n    <!-- GEN:HEAD:END -->`;
  if (html.includes("<!-- GEN:HEAD:START -->")) return replaceHeadMarkers(html, block);
  // první běh: staré značky title, description a hreflang nahradí společný blok
  html = html.replace(/\s*<title>[\s\S]*?<\/title>/i, "").replace(/\s*<meta\s+name="description"[^>]*>/i, "").replace(/\s*<link\s+rel="alternate"\s+hreflang[^>]*>/gi, "");
  const m = /<meta\s+name="viewport"[^>]*>/i.exec(html); if (!m) throw new Error(`${file}: chybí meta viewport`);
  return html.slice(0, m.index + m[0].length) + "\n    " + block + html.slice(m.index + m[0].length);
}
const replaceHeadMarkers = (html, block) => html.replace(/<!-- GEN:HEAD:START -->[\s\S]*?<!-- GEN:HEAD:END -->/, () => block);

// ── hlavní běh ──
async function loadData() {
  const file = arg("data");
  if (file) return JSON.parse(fs.readFileSync(file, "utf8"));
  const r = await fetch(process.env.WEB_PUBLISHED_URL || URL_DEFAULT);
  if (!r.ok) throw new Error(`Snímek webu se nepodařilo stáhnout (HTTP ${r.status}).`);
  return r.json();
}
async function main() {
  const data = await loadData();
  const concerts = Array.isArray(data && data.concerts) ? data.concerts : Object.values((data && data.concerts) || {});
  const read = (f) => fs.readFileSync(path.join(ROOT, f), "utf8"), changed = [], writes = {};
  const put = (f, html) => { if (read(f) !== html) { changed.push(f); writes[f] = html; } };
  if (!data || (!concerts.length && !data.pages)) throw new Error("Zveřejněný snímek je prázdný, web se nepřepíše (nejdřív zveřejněte změny v admin portálu).");
  const upcoming = concerts.filter((c) => c.date >= TODAY).sort((a, b) => a.date.localeCompare(b.date) || String(a.time).localeCompare(String(b.time)));
  const past = concerts.filter((c) => c.date < TODAY).sort((a, b) => b.date.localeCompare(a.date));
  const onas = data.pages && data.pages["o-nas"], site = data.site;
  let pre = 0; const untranslated = [];
  for (const [page, files] of Object.entries(PAGES)) for (const lang of LANGS) {
    const f = files[lang]; let html = read(f);
    if (page === "events" && concerts.length) { html = replaceSection(html, "UPCOMING", buildUpcoming(upcoming, lang), f); html = replaceSection(html, "PAST", buildPast(past, lang), f); }
    if (page === "about" && onas) { html = replaceSection(html, "ONAS-I18N", buildI18nBlock(onas), f); html = replaceSection(html, "ONAS-TIMELINE", buildTimeline(onas.timeline), f); html = replaceSection(html, "ONAS-AWARDS", buildAwards(onas.awards), f); }
    if (page === "home" && site) {
      let i = 0; const vals = [String(site.facts.founded), String(site.facts.awards), L(site.facts.concerts, lang) || "50+"];
      html = html.replace(/(<div class="fact-num">)([^<]*)(<\/div>)/g, (m, a, v, c) => (i < 3 ? `${a}${esc(vals[i++])}${c}` : m));
    }
    html = applyHead(html, page, lang, f);
    const r = prerender(html, lang); pre += r.n; html = r.html;
    if (lang !== "cs") { const d = (loadI18nObject(html) || {})[lang] || {}; const miss = [...html.matchAll(/<\w+[^>]*\sdata-i18n="([\w-]+)"[^>]*>([^<]*)</g)].filter((x) => x[2].trim() && !(typeof d[x[1]] === "string" && d[x[1]].trim())).map((x) => x[1]); if (miss.length) untranslated.push(`${f}: ${miss.length} (${miss.slice(0, 4).join(", ")}${miss.length > 4 ? ", …" : ""})`); }
    put(f, html);
  }
  // sitemap
  const urls = Object.keys(PAGES).flatMap((page) => LANGS.map((lang) => [page, lang]));
  const sm = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n        xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls.map(([page, lang]) => `  <url>\n    <loc>${SITE + PATHS[page][lang]}</loc>\n    <lastmod>${TODAY}</lastmod>\n    <changefreq>${SITEMAP[page][0]}</changefreq>\n    <priority>${lang === "cs" ? SITEMAP[page][1] : (parseFloat(SITEMAP[page][1]) - 0.1).toFixed(1)}</priority>\n${LANGS.map((l) => `    <xhtml:link rel="alternate" hreflang="${l}" href="${SITE + PATHS[page][l]}"/>`).join("\n")}\n    <xhtml:link rel="alternate" hreflang="x-default" href="${SITE + PATHS[page].cs}"/>\n  </url>`).join("\n")}\n</urlset>\n`;
  put("sitemap.xml", sm);
  if (untranslated.length) { console.log("Pozor: texty bez překladu (zůstane česky):"); untranslated.forEach((u) => console.log("  -", u)); }
  console.log(`Akce: ${upcoming.length} nadcházejících, ${past.length} v archivu. Texty předvykreslené do HTML: ${pre}. Změněno souborů: ${changed.length}${CHECK ? " (--check: nic se nezapisuje)" : ""}.`);
  if (CHECK) { changed.forEach((f) => console.log("  změna:", f)); process.exit(changed.length ? 1 : 0); }
  for (const [f, html] of Object.entries(writes)) fs.writeFileSync(path.join(ROOT, f), html, "utf8");
  changed.forEach((f) => console.log("  zapsáno:", f));
}
main().catch((e) => { console.error("Chyba:", e.message); process.exit(1); });

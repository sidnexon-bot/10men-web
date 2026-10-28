// Převede aktuální podobu webu (vygenerované HTML ve všech 4 jazycích) na data nového adminu (/web/…).
// Použití: node extract-current.js <složka-s-repem-10men-web> [výstup.json]
// Výstup obsahuje koncepty akcí (zveřejněné, s automaticky potvrzenou kontrolou: obsah už je veřejný), stránku „O nás“ a základní údaje.
const fs = require("fs"), path = require("path"), vm = require("vm");
const W = require("../../functions/webContent");
const root = path.resolve(process.argv[2] || "."), outFile = process.argv[3] || path.join(__dirname, "..", "migrace", "web-data.json");
const rd = (f) => fs.readFileSync(path.join(root, f), "utf8");
const KONCERTY = { cs: "koncerty/index.html", en: "en/events/index.html", de: "de/konzerte/index.html", es: "es/conciertos/index.html" };
const decode = (s) => s.replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
const MONTHS = ["ledna", "února", "března", "dubna", "května", "června", "července", "srpna", "září", "října", "listopadu", "prosince"];
const problems = [];
const MONTH_LONG = { en: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"], de: ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"], es: ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"] };
const fixes = [];
// české názvy měsíců v cizojazyčném datu (chyba ve stávajících datech) se opraví
function fixCzechMonths(text, lang, ctx) {
  let t = text; MONTHS.forEach((cz, i) => { const re = new RegExp(`(?<![\\p{L}])${cz}(?![\\p{L}])`, "iu"); if (re.test(t)) t = t.replace(re, MONTH_LONG[lang][i]); });
  if (t !== text) fixes.push(`${ctx}: „${text}“ → „${t}“`); return t;
}

// i18n objekt ze skriptu stránky (bez spouštění stránky)
function loadI18n(html) {
  const m = /<script>\s*(?:\/\/[^\n]*\n\s*)?const i18n = \{[\s\S]*?\n\s*\};/.exec(html) || /const i18n = \{[\s\S]*?\n\s*\};/.exec(html);
  if (!m) return null;
  const code = m[0].replace(/^<script>\s*/, "").replace("const i18n =", "globalThis.__i18n =");
  const ctx = { globalThis: {} }; vm.createContext(ctx); vm.runInContext(code.replace("globalThis.__i18n", "__i18n"), ctx); return ctx.__i18n;
}

// ── akce ──
function parsePast(html) {
  const block = /<!-- GEN:PAST:START -->([\s\S]*?)<!-- GEN:PAST:END -->/.exec(html); if (!block) return [];
  const out = [], re = /<div class="past-event"([^>]*)><div class="past-event-date">([\s\S]*?)<\/div><div class="past-event-name">([\s\S]*?)<\/div><\/div>/g; let m;
  while ((m = re.exec(block[1]))) { const photos = /data-photos="([^"]+)"/.exec(m[1]); out.push({ dateText: decode(m[2]), title: decode(m[3]), highlight: /<strong>/.test(m[3]), photosUrl: photos ? photos[1] : "" }); }
  return out;
}
function isoFromCs(t) {
  const m = /(\d{1,2})\.\s*(?:[–-]\s*\d{1,2}\.\s*)?(?:(\d{1,2})\.\s*)?([a-zěščřžýáíéúůďťň]+)?\s*(\d{4})/i.exec(t.replace(/ /g, " "));
  if (!m) return null; const mi = m[3] ? MONTHS.indexOf(m[3].toLowerCase()) + 1 : +m[2]; if (!mi) return null;
  return `${m[4]}-${String(mi).padStart(2, "0")}-${String(+m[1]).padStart(2, "0")}`;
}
const pages = Object.fromEntries(Object.entries(KONCERTY).map(([l, f]) => [l, parsePast(rd(f))]));
const concerts = {};
pages.cs.forEach((e, i) => {
  const date = isoFromCs(e.dateText); if (!date) { problems.push(`Datum nelze přečíst: „${e.dateText}“ (${e.title})`); return; }
  const title = { cs: e.title }, dateDisplay = {};
  for (const l of ["en", "de", "es"]) { const o = pages[l][i]; if (!o) { problems.push(`Chybí ${l} verze akce ${e.title}`); continue; } if (o.title && o.title !== e.title) title[l] = o.title; if (/[–-]/.test(e.dateText)) dateDisplay[l] = fixCzechMonths(o.dateText, l, `${date} ${l.toUpperCase()}`); }
  if (/[–-]/.test(e.dateText)) dateDisplay.cs = e.dateText;
  const id = `m${date.replace(/-/g, "")}${String(i).padStart(2, "0")}`;
  concerts[id] = { date, time: "", status: "zverejneno", highlight: e.highlight, akceId: null, title, venue: {}, desc: {}, dateDisplay, mapsUrl: "", fbUrl: "", ticketsUrl: "", photosUrl: e.photosUrl };
});
// ── O nás ──
const onasHtml = rd("o-nas/index.html"), d = loadI18n(onasHtml);
const loc = (key) => Object.fromEntries(["cs", "en", "de", "es"].filter((l) => d[l] && d[l][key]).map((l) => [l, d[l][key]]));
const years = [...new Set(Object.keys(d.cs).map((k) => /^tl_(\d{4})_h$/.exec(k)).filter(Boolean).map((m) => +m[1]))].sort();
const awards = []; { const re = /<div class="award-card">\s*<div class="award-year">([\s\S]*?)<\/div>\s*<h3>([\s\S]*?)<\/h3>\s*<p data-i18n="award_([\w-]+)"><\/p>/g; let m; while ((m = re.exec(onasHtml))) awards.push({ id: m[3], name: decode(m[2]), years: decode(m[1]), desc: loc("award_" + m[3]) }); }
const onas = { about: { lead: loc("about_lead"), p1: loc("about_p1"), p2: loc("about_p2"), p3: loc("about_p3") }, conductor: { name: d.cs.conductor_name || "", bio: loc("conductor_p") }, timeline: years.map((y) => ({ year: y, h: loc(`tl_${y}_h`), p: loc(`tl_${y}_p`) })), awards };
// ── základní údaje z úvodní stránky ──
const home = rd("index.html"), facts = [...home.matchAll(/<div class="fact-num">([^<]+)<\/div>/g)].map((m) => m[1].trim());
const hd = loadI18n(home), conc = Object.fromEntries(["cs", "en", "de", "es"].map((l) => [l, null]));
for (const l of ["cs", "en", "de", "es"]) { const h = rd(l === "cs" ? "index.html" : `${l}/index.html`), m = [...h.matchAll(/<div class="fact-num">([^<]+)<\/div>/g)].map((x) => x[1].trim()); conc[l] = m[2] || facts[2]; }
const site = { facts: { founded: parseInt(facts[0], 10) || 2015, awards: parseInt(facts[1], 10) || 0, concerts: conc }, email: "info@10men.cz" };

// ── ověření novým modelem; kontrola je potvrzena automaticky (obsah už je na webu veřejný) ──
const out = { concerts: {}, pages: { "o-nas": W.normalizeOnas(onas) }, site: W.normalizeSite(site) }, acked = [];
for (const [id, c] of Object.entries(concerts)) {
  const n = W.normalizeConcert(c), f = W.leakScan(n);
  if (f.some((x) => x.severity === "block")) { problems.push(`Blokující nález u akce „${n.title.cs}“: ${f.filter((x) => x.severity === "block").map((x) => x.match).join(", ")}`); continue; }
  f.forEach((x) => acked.push(`${n.date} „${n.title.cs}“: ${x.label} („${x.match}“)`));
  out.concerts[id] = { ...n, review: W.buildReview(n, f.map((x) => x.id), {}, { uid: "migrace", name: "Převod stávajícího webu" }, Date.now()), version: 1, createdBy: { uid: "migrace", name: "Převod stávajícího webu" }, createdAt: Date.now(), updatedBy: { uid: "migrace", name: "Převod stávajícího webu" }, updatedAt: Date.now() };
}
fs.mkdirSync(path.dirname(outFile), { recursive: true }); fs.writeFileSync(outFile, JSON.stringify(out, null, 1));
const byYear = {}; Object.values(out.concerts).forEach((c) => { byYear[c.date.slice(0, 4)] = (byYear[c.date.slice(0, 4)] || 0) + 1; });
console.log(`Akce: ${Object.keys(out.concerts).length} (z toho ${Object.values(out.concerts).filter((c) => Object.keys(c.dateDisplay).length).length} s rozsahem data, ${Object.values(out.concerts).filter((c) => c.photosUrl).length} s fotkami, ${Object.values(out.concerts).filter((c) => c.highlight).length} zvýrazněných)`, JSON.stringify(byYear));
console.log(`O nás: ${out.pages["o-nas"].timeline.length} událostí (${years.join(", ")}), ${out.pages["o-nas"].awards.length} ocenění, vedoucí ${out.pages["o-nas"].conductor.name}`);
console.log(`Údaje: založeno ${out.site.facts.founded}, ocenění ${out.site.facts.awards}, koncertů ${JSON.stringify(out.site.facts.concerts)}`);
if (fixes.length) { console.log(`Opraveno ve stávajících datech: ${fixes.length}`); fixes.forEach((x) => console.log('   -', x)); }
console.log(`Automaticky odsouhlasená upozornění (obsah je už veřejný): ${acked.length}`); acked.slice(0, 12).forEach((a) => console.log("   -", a));
if (problems.length) { console.log("\nPROBLÉMY:"); problems.forEach((p) => console.log("   !", p)); process.exit(1); }
console.log("\nZapsáno:", outFile);

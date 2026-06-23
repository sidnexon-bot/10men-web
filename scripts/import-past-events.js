/**
 * import-past-events.js
 * Jednorázový import všech proběhlých akcí do Firestore.
 * Spusť jako GitHub Action (viz níže) — stačí jednou.
 */

const admin = require('firebase-admin');
const path  = require('path');
const data  = require('./past-events-import.json');

admin.initializeApp({
  credential: admin.credential.cert(
    JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
  )
});
const db = admin.firestore();

async function importEvents() {
  console.log(`📥 Importuji ${data.length} proběhlých akcí…\n`);
  const col = db.collection('concerts');
  let ok = 0;

  for (const event of data) {
    const doc = {
      type:      'past',
      title:     event.title,
      date:      admin.firestore.Timestamp.fromDate(new Date(event.date)),
      photosUrl: event.photosUrl || '',
      highlight: event.highlight || false,
    };
    if (event.dateDisplay) doc.dateDisplay = event.dateDisplay;

    await col.add(doc);
    console.log(`  ✓ ${event.date}  ${event.title.slice(0, 55)}…`);
    ok++;
  }

  console.log(`\n✅ Hotovo — importováno ${ok} záznamů.`);
  process.exit(0);
}

importEvents().catch(err => {
  console.error('❌ Chyba:', err.message);
  process.exit(1);
});

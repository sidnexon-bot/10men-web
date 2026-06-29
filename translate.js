/**
 * translate.js
 * Přečte pending překlad z Firestore, přeloží přes DeepL API
 * a výsledek uloží zpět do Firestore.
 */

require('dotenv').config({ path: '.env.local' });
const admin = require('firebase-admin');

admin.initializeApp({
  credential: admin.credential.cert(
    JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
  )
});
const db = admin.firestore();

const DEEPL_KEY  = process.env.DEEPL_API_KEY;
const LANG_MAP   = { en: 'EN', de: 'DE', es: 'ES' };

async function translateText(text, targetLang) {
  const res = await fetch('https://api-free.deepl.com/v2/translate', {
    method: 'POST',
    headers: {
      'Authorization': `DeepL-Auth-Key ${DEEPL_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text: [text],
      source_lang: 'CS',
      target_lang: LANG_MAP[targetLang],
    }),
  });

  if (!res.ok) throw new Error(`DeepL chyba ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.translations[0].text;
}

async function run() {
  console.log('📥 Načítám pending překlad z Firestore…');
  const snap = await db.collection('_translate').doc('pending').get();

  if (!snap.exists) {
    console.error('❌ Dokument _translate/pending nenalezen.');
    process.exit(1);
  }

  const { text, requestId } = snap.data();
  if (!text) { console.error('❌ Chybí text k překladu.'); process.exit(1); }

  console.log(`   Text (${text.length} znaků): "${text.slice(0, 60)}…"`);
  console.log('🌐 Překládám do EN, DE, ES…');

  const [en, de, es] = await Promise.all([
    translateText(text, 'en'),
    translateText(text, 'de'),
    translateText(text, 'es'),
  ]);

  console.log('💾 Ukládám výsledek do Firestore…');
  await db.collection('_translate').doc('result').set({
    requestId,
    en, de, es,
    completedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  console.log('✅ Hotovo!');
  process.exit(0);
}

run().catch(err => {
  console.error('❌ Chyba:', err.message);
  process.exit(1);
});

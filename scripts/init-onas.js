/**
 * init-onas.js
 * Jednorázový import stávajícího obsahu stránky O nás do Firestore.
 * Spusť jako GitHub Action — jen jednou!
 */

const admin = require('firebase-admin');

admin.initializeApp({
  credential: admin.credential.cert(
    JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
  )
});
const db = admin.firestore();

const DATA = {
  about: {
    lead: {
      cs: 'Jsme 10men – pražská mužská vokální skupina, která od roku 2015 ohromuje publikum na české i světové sborové scéně.',
      en: 'We are 10men, a Prague-based male vocal group that has been captivating audiences since 2015, both in the Czech vocal scene and beyond.',
      de: 'Wir sind 10men – eine Prager Männer-Vokalgruppe, die seit 2015 ihr Publikum begeistert, sowohl auf der tschechischen Chorszene als auch darüber hinaus.',
      es: 'Somos 10men, un grupo vocal masculino de Praga que desde 2015 cautiva al público dentro y fuera de la escena coral checa.',
    },
    p1: {
      cs: 'Název skupiny odkazuje na počet zakládajících členů – deset gymnaziálních nadšenců do sborového zpěvu, kteří se rozhodli vydat vlastní cestou. Počet aktivních členů se v průběhu let proměňoval, energie a vášeň pro hudbu však zůstávají.',
      en: 'Our name refers to the number of founding members – ten high school choir enthusiasts who decided to create their own ensemble. While the number of active members has evolved over time, the energy and passion for music have remained constant.',
      de: 'Unser Name verweist auf die Anzahl der Gründer – zehn ehemalige Schüler und Chorsänger, die beschlossen haben, ihren eigenen Weg zu gehen. Die Zahl der aktiven Mitglieder hat sich im Laufe der Jahre verändert, doch Energie und Leidenschaft für Musik sind geblieben.',
      es: 'Nuestro nombre hace referencia al número de fundadores: diez jóvenes cantantes de coro que decidieron crear su propio camino musical. El número de miembros activos ha ido cambiando con los años, pero la energía y la pasión por la música siguen intactas.',
    },
    p2: {
      cs: 'Repertoár skupiny sahá od popových hitů a jazzu přes swing až po klasickou hudbu. Zpíváme převážně a cappella – tedy pouze lidskými hlasy, bez instrumentálního doprovodu.',
      en: 'Our repertoire ranges from pop hits and jazz to swing, and on special occasions, we also perform classical music. We primarily sing a cappella – using only the human voice, without instrumental accompaniment.',
      de: 'Unser Repertoire reicht von Pop-Hits und Jazz bis hin zu Swing, und bei besonderen Anlässen auch zu klassischer Musik. Wir singen überwiegend a cappella – nur mit unseren Stimmen, ohne instrumentale Begleitung.',
      es: 'Nuestro repertorio abarca desde pop y jazz hasta swing, y en ocasiones especiales también música clásica. Cantamos principalmente a cappella, es decir, solo con nuestras voces, sin acompañamiento instrumental.',
    },
    p3: {
      cs: 'Skupina pravidelně pracuje pod vedením uměleckého vedoucího Karla Špinky. Pod jeho taktovkou jsme se zúčastnili prestižních soutěží a vystoupení v ČR i zahraničí.',
      en: 'The group is regularly prepared under the direction of artistic director Karel Špinka. Under his leadership, we have taken part in prestigious competitions and performances both in the Czech Republic and abroad.',
      de: 'Die Gruppe arbeitet regelmäßig unter der Leitung des künstlerischen Leiters Karel Špinka. Unter seiner Führung haben wir an renommierten Wettbewerben und Auftritten im In- und Ausland teilgenommen.',
      es: 'El grupo trabaja regularmente bajo la dirección artística de Karel Špinka. Bajo su liderazgo, hemos participado en prestigiosos concursos y actuaciones tanto en la República Checa como en el extranjero.',
    },
  },

  timeline: [
    {
      year: 2015,
      h: { cs: 'Vznik skupiny', en: 'Foundation of the group', de: 'Gründung der Gruppe', es: 'Fundación del grupo' },
      p: {
        cs: '10men vznikli z iniciativy deseti členů sboru Pueri gaudentes. Proběhly první zkoušky a debutové vystoupení.',
        en: '10men was founded by ten members of the Pueri gaudentes male choir. The first rehearsals and debut performance soon followed.',
        de: '10men entstand aus der Initiative von zehn Mitgliedern des Chors Pueri gaudentes. Es folgten erste Proben und ein Debütauftritt.',
        es: '10men nació de la iniciativa de diez miembros del coro Pueri gaudentes. Poco después llegaron los primeros ensayos y el debut en concierto.',
      },
    },
    {
      year: 2016,
      h: { cs: 'První soutěž a zlaté pásmo', en: 'First competition and gold award', de: 'Erster Wettbewerb und Goldauszeichnung', es: 'Primer concurso y premio de oro' },
      p: {
        cs: 'První účast na soutěži Jirkovský Písňovar, odkud si skupina odváží své první zlaté pásmo.',
        en: 'First participation in the Jirkovský Písňovar competition, where the group received its first gold award.',
        de: 'Erste Teilnahme am Wettbewerb Jirkovský Písňovar, bei dem die Gruppe ihre erste Goldauszeichnung erhielt.',
        es: 'Primera participación en el concurso Jirkovský Písňovar, donde el grupo obtuvo su primer premio de oro.',
      },
    },
    {
      year: 2020,
      h: { cs: 'Povstání z popela', en: 'Rise from the ashes', de: 'Neustart', es: 'Renacer' },
      p: {
        cs: 'Obnovení koncertní činnosti a zisk zlatého pásma na Jirkovském Písňovaru s postupem do Grand Prix.',
        en: 'Concert activity resumed, bringing a gold award at Jirkovský Písňovar and qualification for the Grand Prix.',
        de: 'Wiederaufnahme der Konzerttätigkeit und Gewinn einer Goldauszeichnung beim Jirkovský Písňovar mit Einzug ins Grand Prix.',
        es: 'Regreso a la actividad concertística y obtención de un premio de oro en Jirkovský Písňovar con clasificación para el Grand Prix.',
      },
    },
    {
      year: 2022,
      h: { cs: 'Vznik projektu LAMEN', en: 'LAMEN project launched', de: 'Entstehung des Projekts LAMEN', es: 'Nacimiento del proyecto LAMEN' },
      p: {
        cs: 'Spojení se skupinou Lamas a vznik projektu LAMEN, představeného na koncertech v Praze a Rokycanech. Zároveň zisk stříbrného pásma na Musica Orbis Gloria.',
        en: 'Collaboration with the female group Lamas led to the creation of the LAMEN project, introduced in concerts in Prague and Rokycany. 10men also received a silver award at Musica Orbis Gloria.',
        de: 'Zusammenarbeit mit der Gruppe Lamas und Gründung des gemischten A-cappella-Projekts LAMEN. Gleichzeitig Silberauszeichnung beim Wettbewerb Musica Orbis Gloria.',
        es: 'Colaboración con el grupo femenino Lamas y creación del proyecto a cappella mixto LAMEN. Además, premio de plata en Musica Orbis Gloria.',
      },
    },
    {
      year: 2023,
      h: { cs: 'První zahraniční vystoupení', en: 'First international performance', de: 'Erster internationaler Auftritt', es: 'Primera actuación internacional' },
      p: {
        cs: 'Hostování na adventním koncertě v německém Zschopau a další zlaté pásmo na Jirkovském Písňovaru.',
        en: 'Guest performance at an Advent concert in Zschopau, Germany, along with another gold award at Jirkovský Písňovar.',
        de: 'Gastauftritt bei einem Adventskonzert im deutschen Zschopau sowie eine weitere Goldauszeichnung beim Jirkovský Písňovar.',
        es: 'Participación como invitados en un concierto de Adviento en Zschopau (Alemania) y otro premio de oro en Jirkovský Písňovar.',
      },
    },
    {
      year: 2024,
      h: { cs: 'Mezinárodní úspěch', en: 'International success', de: 'Internationaler Erfolg', es: 'Éxito internacional' },
      p: {
        cs: 'Účast na HARMONIE Festivalu v Německu – zlaté i stříbrné pásmo. Rozvoj projektu LAMEN a celovečerní koncerty.',
        en: 'Participation in the HARMONIE Festival in Germany, earning both gold and silver awards. Continued development of the LAMEN project and full-length concerts.',
        de: 'Teilnahme am HARMONIE Festival in Deutschland – Auszeichnungen in Gold und Silber. Weiterentwicklung des Projekts LAMEN und abendfüllende Konzerte.',
        es: 'Participación en el HARMONIE Festival en Alemania, con premios de oro y plata. Desarrollo continuo del proyecto LAMEN y conciertos completos.',
      },
    },
    {
      year: 2025,
      h: { cs: '10 let 10men', en: '10 years of 10men', de: '10 Jahre 10men', es: '10 años de 10men' },
      p: {
        cs: 'Výroční koncert k 10 letům existence skupiny a další koncertní činnost doma i v zahraničí.',
        en: 'Anniversary concert celebrating 10 years of the group, along with continued concert activity in the Czech Republic and abroad.',
        de: 'Jubiläumskonzert zum 10-jährigen Bestehen sowie weitere Konzertaktivitäten im In- und Ausland.',
        es: 'Concierto aniversario celebrando los 10 años del grupo y nuevas actuaciones en la República Checa y en el extranjero.',
      },
    },
  ],

  awards: [
    {
      id: 'jirkov',
      name: 'Jirkovský Písňovar',
      years: '2016, 2017, 2021, 2023, 2024',
      desc: {
        cs: 'Jedno z nejprestižnějších sborových klání v ČR. Opakovaná účast a ocenění.',
        en: 'One of the most prestigious choral competitions in the Czech Republic, with repeated participation and awards.',
        de: 'Einer der renommiertesten Chorwettbewerbe in Tschechien mit wiederholter Teilnahme und Auszeichnungen.',
        es: 'Uno de los concursos corales más prestigiosos de la República Checa, con participaciones y premios repetidos.',
      },
    },
    {
      id: 'mog',
      name: 'Musica Orbis Gloria',
      years: '2022',
      desc: {
        cs: 'Mezinárodně uznávaná soutěž sborového a vokálního umění.',
        en: 'An internationally recognized competition of choral and vocal music.',
        de: 'International anerkannter Wettbewerb für Chor- und Vokalmusik.',
        es: 'Concurso internacional reconocido de música coral y vocal.',
      },
    },
    {
      id: 'harmonie',
      name: 'HARMONIE Festival',
      years: '2024',
      desc: {
        cs: 'Mezinárodní festival v Německu – ocenění od zahraniční poroty.',
        en: 'An international festival in Germany, with awards from an international jury.',
        de: 'Internationales Festival in Deutschland mit Auszeichnungen durch eine internationale Jury.',
        es: 'Festival internacional en Alemania con premios otorgados por un jurado internacional.',
      },
    },
  ],

  conductor: {
    name: 'Karel Špinka',
    bio: {
      cs: 'Karel Špinka je uměleckým vedoucím skupiny 10men. Pod jeho vedením skupina rozvíjí repertoár a připravuje se na koncerty, soutěžní i jiná vystoupení.',
      en: 'Karel Špinka is the artistic director of 10men. Under his leadership, the group develops its repertoire and prepares for concerts, competitions, and other performances.',
      de: 'Karel Špinka ist der künstlerische Leiter von 10men. Unter seiner Leitung entwickelt die Gruppe ihr Repertoire und bereitet sich auf Konzerte, Wettbewerbe und weitere Auftritte vor.',
      es: 'Karel Špinka es el director artístico de 10men. Bajo su dirección, el grupo desarrolla su repertorio y se prepara para conciertos, concursos y otros proyectos.',
    },
  },
};

async function init() {
  console.log('📥 Inicializuji pages/o-nas ve Firestore…');
  await db.collection('pages').doc('o-nas').set(DATA);
  console.log('✅ Hotovo!');
  process.exit(0);
}

init().catch(err => {
  console.error('❌ Chyba:', err.message);
  process.exit(1);
});

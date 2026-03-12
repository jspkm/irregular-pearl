/**
 * Searches Internet Archive for MP3 versions of our classical tracks.
 * Uses the IA Advanced Search API + Metadata API.
 * Usage: npx tsx scripts/find-ia-mp3s.ts
 */

const DELAY_MS = 1200;
const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

interface TrackQuery {
  id: string; // reference key
  composer: string;
  piece: string; // search-friendly piece name
  iaQuery: string; // custom IA search query
}

const TRACKS: TrackQuery[] = [
  // BEETHOVEN
  { id: "fur-elise", composer: "Beethoven", piece: "Fur Elise", iaQuery: "title:(fur elise OR für elise) AND subject:classical" },
  { id: "beethoven-sym5-i", composer: "Beethoven", piece: "Symphony 5 mvt 1", iaQuery: "title:(beethoven symphony 5) AND subject:classical" },
  { id: "beethoven-sym5-iv", composer: "Beethoven", piece: "Symphony 5 mvt 4", iaQuery: "title:(beethoven symphony 5) AND subject:classical" },
  { id: "moonlight-i", composer: "Beethoven", piece: "Moonlight Sonata mvt 1", iaQuery: "title:(moonlight sonata) AND subject:classical" },
  { id: "moonlight-iii", composer: "Beethoven", piece: "Moonlight Sonata mvt 3", iaQuery: "title:(moonlight sonata) AND subject:classical" },
  { id: "pathetique-ii", composer: "Beethoven", piece: "Pathetique mvt 2", iaQuery: "title:(pathetique) AND creator:(beethoven)" },
  { id: "32-variations", composer: "Beethoven", piece: "32 Variations C minor", iaQuery: "title:(32 variations) AND creator:(beethoven)" },
  { id: "emperor-ii", composer: "Beethoven", piece: "Emperor Concerto", iaQuery: "title:(emperor concerto OR piano concerto 5) AND creator:(beethoven)" },
  { id: "ode-to-joy", composer: "Beethoven", piece: "Symphony 9 Ode to Joy", iaQuery: "title:(symphony 9 OR ode to joy) AND creator:(beethoven)" },

  // CHOPIN
  { id: "nocturne-op9-2", composer: "Chopin", piece: "Nocturne Op 9 No 2", iaQuery: "title:(nocturne op 9) AND creator:(chopin)" },
  { id: "ballade-1", composer: "Chopin", piece: "Ballade No 1", iaQuery: "title:(ballade) AND creator:(chopin)" },
  { id: "etude-op10-3", composer: "Chopin", piece: "Etude Op 10 No 3", iaQuery: "title:(etude op 10) AND creator:(chopin)" },
  { id: "minute-waltz", composer: "Chopin", piece: "Minute Waltz", iaQuery: "title:(minute waltz OR waltz op 64) AND creator:(chopin)" },
  { id: "raindrop", composer: "Chopin", piece: "Raindrop Prelude", iaQuery: "title:(raindrop OR prelude op 28) AND creator:(chopin)" },
  { id: "heroic-polonaise", composer: "Chopin", piece: "Heroic Polonaise", iaQuery: "title:(polonaise op 53 OR heroic polonaise) AND creator:(chopin)" },
  { id: "fantaisie-impromptu", composer: "Chopin", piece: "Fantaisie-Impromptu", iaQuery: "title:(fantaisie impromptu OR fantasy impromptu) AND creator:(chopin)" },
  { id: "nocturne-csharp", composer: "Chopin", piece: "Nocturne C# minor posth", iaQuery: "title:(nocturne c sharp minor) AND creator:(chopin)" },
  { id: "scherzo-2", composer: "Chopin", piece: "Scherzo No 2", iaQuery: "title:(scherzo) AND creator:(chopin)" },
  { id: "winter-wind", composer: "Chopin", piece: "Winter Wind Etude", iaQuery: "title:(winter wind OR etude op 25 no 11) AND creator:(chopin)" },

  // DEBUSSY
  { id: "clair-de-lune", composer: "Debussy", piece: "Clair de lune", iaQuery: "title:(clair de lune) AND creator:(debussy)" },
  { id: "arabesque-1", composer: "Debussy", piece: "Arabesque No 1", iaQuery: "title:(arabesque) AND creator:(debussy)" },
  { id: "reverie", composer: "Debussy", piece: "Reverie", iaQuery: "title:(reverie) AND creator:(debussy)" },
  { id: "apres-midi", composer: "Debussy", piece: "Prelude apres-midi faune", iaQuery: "title:(apres midi OR afternoon faun) AND creator:(debussy)" },

  // BACH
  { id: "toccata-fugue", composer: "Bach", piece: "Toccata Fugue D minor", iaQuery: "title:(toccata fugue d minor)" },
  { id: "air-g-string", composer: "Bach", piece: "Air on G String", iaQuery: "title:(air g string OR air bach)" },
  { id: "cello-suite-1", composer: "Bach", piece: "Cello Suite 1 Prelude", iaQuery: "title:(cello suite 1 OR cello suite prelude) AND creator:(bach)" },
  { id: "brandenburg-3", composer: "Bach", piece: "Brandenburg 3", iaQuery: "title:(brandenburg concerto 3) AND creator:(bach)" },
  { id: "wtc-prelude-1", composer: "Bach", piece: "WTC Prelude 1 C major", iaQuery: "title:(well tempered clavier prelude) AND creator:(bach)" },
  { id: "badinerie", composer: "Bach", piece: "Badinerie", iaQuery: "title:(badinerie)" },
  { id: "goldberg-aria", composer: "Bach", piece: "Goldberg Aria", iaQuery: "title:(goldberg variations)" },
  { id: "passacaglia", composer: "Bach", piece: "Passacaglia C minor", iaQuery: "title:(passacaglia) AND creator:(bach)" },
  { id: "chaconne", composer: "Bach", piece: "Chaconne", iaQuery: "title:(chaconne OR partita 2) AND creator:(bach)" },

  // MOZART
  { id: "eine-kleine-i", composer: "Mozart", piece: "Eine kleine Nachtmusik I", iaQuery: "title:(eine kleine nachtmusik)" },
  { id: "turkish-march", composer: "Mozart", piece: "Turkish March", iaQuery: "title:(turkish march OR rondo alla turca)" },
  { id: "symphony-40-i", composer: "Mozart", piece: "Symphony 40 I", iaQuery: "title:(symphony 40) AND creator:(mozart)" },
  { id: "lacrimosa", composer: "Mozart", piece: "Requiem Lacrimosa", iaQuery: "title:(requiem lacrimosa OR requiem) AND creator:(mozart)" },
  { id: "piano-concerto-21", composer: "Mozart", piece: "Piano Concerto 21 II", iaQuery: "title:(piano concerto 21) AND creator:(mozart)" },
  { id: "figaro-overture", composer: "Mozart", piece: "Marriage of Figaro Overture", iaQuery: "title:(figaro overture OR nozze di figaro)" },
  { id: "eine-kleine-ii", composer: "Mozart", piece: "Eine kleine Nachtmusik II", iaQuery: "title:(eine kleine nachtmusik)" },
  { id: "sonata-k545", composer: "Mozart", piece: "Piano Sonata K545", iaQuery: "title:(sonata k 545 OR sonata 16 c major) AND creator:(mozart)" },

  // TCHAIKOVSKY
  { id: "swan-lake", composer: "Tchaikovsky", piece: "Swan Lake Scene", iaQuery: "title:(swan lake)" },
  { id: "sugar-plum", composer: "Tchaikovsky", piece: "Sugar Plum Fairy", iaQuery: "title:(sugar plum fairy OR nutcracker)" },
  { id: "waltz-flowers", composer: "Tchaikovsky", piece: "Waltz of Flowers", iaQuery: "title:(waltz flowers OR nutcracker)" },
  { id: "1812", composer: "Tchaikovsky", piece: "1812 Overture", iaQuery: "title:(1812 overture)" },
  { id: "tchaikovsky-pc1", composer: "Tchaikovsky", piece: "Piano Concerto 1", iaQuery: "title:(piano concerto 1) AND creator:(tchaikovsky)" },
  { id: "sleeping-beauty", composer: "Tchaikovsky", piece: "Sleeping Beauty Waltz", iaQuery: "title:(sleeping beauty waltz)" },

  // VIVALDI
  { id: "spring-i", composer: "Vivaldi", piece: "Four Seasons Spring", iaQuery: "title:(four seasons spring OR vivaldi spring)" },
  { id: "summer-iii", composer: "Vivaldi", piece: "Four Seasons Summer", iaQuery: "title:(four seasons summer OR vivaldi summer)" },
  { id: "autumn-i", composer: "Vivaldi", piece: "Four Seasons Autumn", iaQuery: "title:(four seasons autumn OR vivaldi autumn)" },
  { id: "winter-ii", composer: "Vivaldi", piece: "Four Seasons Winter", iaQuery: "title:(four seasons winter OR vivaldi winter)" },
  { id: "winter-i", composer: "Vivaldi", piece: "Four Seasons Winter I", iaQuery: "title:(four seasons winter OR vivaldi winter)" },

  // LISZT
  { id: "hungarian-rhapsody-2", composer: "Liszt", piece: "Hungarian Rhapsody 2", iaQuery: "title:(hungarian rhapsody 2)" },
  { id: "liebestraum", composer: "Liszt", piece: "Liebestraum 3", iaQuery: "title:(liebestraum)" },
  { id: "la-campanella", composer: "Liszt", piece: "La Campanella", iaQuery: "title:(la campanella)" },
  { id: "consolation-3", composer: "Liszt", piece: "Consolation 3", iaQuery: "title:(consolation) AND creator:(liszt)" },

  // SCHUBERT
  { id: "ave-maria", composer: "Schubert", piece: "Ave Maria", iaQuery: "title:(ave maria) AND creator:(schubert)" },
  { id: "serenade", composer: "Schubert", piece: "Serenade Standchen", iaQuery: "title:(serenade OR standchen) AND creator:(schubert)" },
  { id: "trout-quintet", composer: "Schubert", piece: "Trout Quintet", iaQuery: "title:(trout quintet)" },
  { id: "impromptu-90-3", composer: "Schubert", piece: "Impromptu Op 90 No 3", iaQuery: "title:(impromptu op 90) AND creator:(schubert)" },

  // RACHMANINOFF
  { id: "rach-pc2-i", composer: "Rachmaninoff", piece: "Piano Concerto 2 I", iaQuery: "title:(piano concerto 2) AND creator:(rachmaninoff OR rachmaninov)" },
  { id: "rach-prelude", composer: "Rachmaninoff", piece: "Prelude C# minor", iaQuery: "title:(prelude c sharp minor) AND creator:(rachmaninoff OR rachmaninov)" },
  { id: "vocalise", composer: "Rachmaninoff", piece: "Vocalise", iaQuery: "title:(vocalise) AND creator:(rachmaninoff OR rachmaninov)" },
  { id: "rach-rhapsody", composer: "Rachmaninoff", piece: "Rhapsody Paganini Var 18", iaQuery: "title:(rhapsody paganini) AND creator:(rachmaninoff OR rachmaninov)" },

  // DVOŘÁK
  { id: "new-world-ii", composer: "Dvorak", piece: "New World Symphony II", iaQuery: "title:(new world symphony OR symphony 9) AND creator:(dvorak)" },
  { id: "new-world-iv", composer: "Dvorak", piece: "New World Symphony IV", iaQuery: "title:(new world symphony OR symphony 9) AND creator:(dvorak)" },
  { id: "humoresque", composer: "Dvorak", piece: "Humoresque", iaQuery: "title:(humoresque) AND creator:(dvorak)" },

  // GRIEG
  { id: "morning-mood", composer: "Grieg", piece: "Morning Mood", iaQuery: "title:(morning mood OR peer gynt)" },
  { id: "mountain-king", composer: "Grieg", piece: "Hall Mountain King", iaQuery: "title:(hall mountain king OR peer gynt)" },
  { id: "grieg-pc-i", composer: "Grieg", piece: "Piano Concerto A minor", iaQuery: "title:(piano concerto) AND creator:(grieg)" },

  // SATIE
  { id: "gymnopedie-1", composer: "Satie", piece: "Gymnopedie 1", iaQuery: "title:(gymnopedie 1) AND creator:(satie)" },
  { id: "gymnopedie-3", composer: "Satie", piece: "Gymnopedie 3", iaQuery: "title:(gymnopedie 3) AND creator:(satie)" },
  { id: "gnossienne-1", composer: "Satie", piece: "Gnossienne 1", iaQuery: "title:(gnossienne 1) AND creator:(satie)" },

  // BRAHMS
  { id: "hungarian-dance-5", composer: "Brahms", piece: "Hungarian Dance 5", iaQuery: "title:(hungarian dance 5) AND creator:(brahms)" },
  { id: "brahms-lullaby", composer: "Brahms", piece: "Lullaby Wiegenlied", iaQuery: "title:(lullaby OR wiegenlied) AND creator:(brahms)" },
  { id: "brahms-sym3-iii", composer: "Brahms", piece: "Symphony 3 III", iaQuery: "title:(symphony 3) AND creator:(brahms)" },
  { id: "brahms-intermezzo", composer: "Brahms", piece: "Intermezzo A major Op 118", iaQuery: "title:(intermezzo) AND creator:(brahms)" },

  // HANDEL
  { id: "alla-hornpipe", composer: "Handel", piece: "Water Music Alla Hornpipe", iaQuery: "title:(water music)" },
  { id: "hallelujah", composer: "Handel", piece: "Hallelujah Chorus", iaQuery: "title:(hallelujah chorus OR messiah hallelujah)" },
  { id: "sarabande", composer: "Handel", piece: "Sarabande D minor", iaQuery: "title:(sarabande) AND creator:(handel)" },

  // MENDELSSOHN
  { id: "wedding-march", composer: "Mendelssohn", piece: "Wedding March", iaQuery: "title:(wedding march) AND creator:(mendelssohn)" },
  { id: "mendelssohn-violin", composer: "Mendelssohn", piece: "Violin Concerto E minor", iaQuery: "title:(violin concerto) AND creator:(mendelssohn)" },

  // STRAUSS
  { id: "blue-danube", composer: "Strauss", piece: "Blue Danube", iaQuery: "title:(blue danube)" },
  { id: "radetzky", composer: "Strauss", piece: "Radetzky March", iaQuery: "title:(radetzky march)" },

  // PACHELBEL
  { id: "canon-d", composer: "Pachelbel", piece: "Canon in D", iaQuery: "title:(canon d major OR pachelbel canon)" },

  // SAINT-SAËNS
  { id: "the-swan", composer: "Saint-Saens", piece: "The Swan", iaQuery: "title:(swan carnival animals) AND creator:(saint-saens)" },
  { id: "danse-macabre", composer: "Saint-Saens", piece: "Danse macabre", iaQuery: "title:(danse macabre)" },

  // MUSSORGSKY
  { id: "great-gate", composer: "Mussorgsky", piece: "Great Gate of Kiev", iaQuery: "title:(pictures exhibition OR great gate kiev)" },
  { id: "bald-mountain", composer: "Mussorgsky", piece: "Night on Bald Mountain", iaQuery: "title:(night bald mountain OR night bare mountain)" },

  // RAVEL
  { id: "bolero", composer: "Ravel", piece: "Bolero", iaQuery: "title:(bolero) AND creator:(ravel)" },
  { id: "pavane-ravel", composer: "Ravel", piece: "Pavane pour une infante defunte", iaQuery: "title:(pavane infante) AND creator:(ravel)" },

  // SCHUMANN
  { id: "traumerei", composer: "Schumann", piece: "Traumerei", iaQuery: "title:(traumerei OR kinderszenen)" },
  { id: "schumann-pc", composer: "Schumann", piece: "Piano Concerto A minor", iaQuery: "title:(piano concerto) AND creator:(schumann)" },

  // WAGNER
  { id: "ride-valkyries", composer: "Wagner", piece: "Ride of the Valkyries", iaQuery: "title:(ride valkyries)" },
  { id: "bridal-chorus", composer: "Wagner", piece: "Bridal Chorus", iaQuery: "title:(bridal chorus OR lohengrin)" },

  // VERDI
  { id: "la-traviata", composer: "Verdi", piece: "La Traviata Prelude", iaQuery: "title:(la traviata prelude)" },
  { id: "aida-march", composer: "Verdi", piece: "Aida Triumphal March", iaQuery: "title:(aida march OR aida triumphal)" },

  // ELGAR
  { id: "pomp", composer: "Elgar", piece: "Pomp and Circumstance", iaQuery: "title:(pomp circumstance) AND creator:(elgar)" },

  // HOLST
  { id: "jupiter", composer: "Holst", piece: "Jupiter Planets", iaQuery: "title:(planets jupiter) AND creator:(holst)" },

  // BIZET
  { id: "habanera", composer: "Bizet", piece: "Carmen Habanera", iaQuery: "title:(carmen habanera)" },
  { id: "farandole", composer: "Bizet", piece: "Farandole", iaQuery: "title:(farandole OR arlesienne) AND creator:(bizet)" },

  // ROSSINI
  { id: "william-tell", composer: "Rossini", piece: "William Tell Overture", iaQuery: "title:(william tell overture)" },
  { id: "barber-seville", composer: "Rossini", piece: "Barber of Seville Overture", iaQuery: "title:(barber seville overture)" },

  // GERSHWIN
  { id: "rhapsody-blue", composer: "Gershwin", piece: "Rhapsody in Blue", iaQuery: "title:(rhapsody blue)" },

  // ALBINONI
  { id: "adagio-g", composer: "Albinoni", piece: "Adagio G minor", iaQuery: "title:(adagio g minor) AND creator:(albinoni)" },

  // TARTINI
  { id: "devils-trill", composer: "Tartini", piece: "Devils Trill", iaQuery: "title:(devil trill)" },

  // PURCELL
  { id: "didos-lament", composer: "Purcell", piece: "Didos Lament", iaQuery: "title:(dido lament OR dido aeneas)" },

  // BORODIN
  { id: "steppes", composer: "Borodin", piece: "Steppes of Central Asia", iaQuery: "title:(steppes central asia)" },

  // RIMSKY-KORSAKOV
  { id: "bumblebee", composer: "Rimsky-Korsakov", piece: "Flight of Bumblebee", iaQuery: "title:(flight bumblebee)" },
  { id: "scheherazade", composer: "Rimsky-Korsakov", piece: "Scheherazade", iaQuery: "title:(scheherazade)" },

  // OFFENBACH
  { id: "can-can", composer: "Offenbach", piece: "Can-Can Orpheus", iaQuery: "title:(can can orpheus OR galop infernal)" },
  { id: "barcarolle", composer: "Offenbach", piece: "Barcarolle Hoffmann", iaQuery: "title:(barcarolle hoffmann) AND creator:(offenbach)" },

  // MASSENET
  { id: "thais-meditation", composer: "Massenet", piece: "Thais Meditation", iaQuery: "title:(thais meditation)" },

  // FAURÉ
  { id: "faure-pavane", composer: "Faure", piece: "Pavane", iaQuery: "title:(pavane) AND creator:(faure)" },
  { id: "faure-sicilienne", composer: "Faure", piece: "Sicilienne", iaQuery: "title:(sicilienne) AND creator:(faure)" },

  // PAGANINI
  { id: "caprice-24", composer: "Paganini", piece: "Caprice 24", iaQuery: "title:(caprice 24) AND creator:(paganini)" },
];

async function searchIA(query: string): Promise<string[]> {
  const url = `https://archive.org/advancedsearch.php?q=${encodeURIComponent(query)}&fl[]=identifier&fl[]=title&fl[]=creator&rows=5&output=json&sort[]=downloads+desc`;
  try {
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    return (data.response?.docs || []).map((d: any) => d.identifier);
  } catch {
    return [];
  }
}

async function getMP3FromItem(identifier: string): Promise<{ url: string; filename: string; size: number } | null> {
  try {
    const res = await fetch(`https://archive.org/metadata/${identifier}/files`);
    if (!res.ok) return null;
    const data = await res.json();
    const files: any[] = data.result || [];

    // Prefer VBR MP3, then any MP3
    const mp3Files = files.filter((f: any) =>
      f.name?.toLowerCase().endsWith(".mp3") && f.format?.includes("MP3")
    );

    if (mp3Files.length === 0) return null;

    // Pick the largest MP3 (likely highest quality)
    const best = mp3Files.reduce((a: any, b: any) =>
      (parseInt(a.size || "0") > parseInt(b.size || "0")) ? a : b
    );

    return {
      url: `https://archive.org/download/${identifier}/${encodeURIComponent(best.name)}`,
      filename: best.name,
      size: parseInt(best.size || "0"),
    };
  } catch {
    return null;
  }
}

async function main() {
  console.log(`Searching Internet Archive for MP3 versions of ${TRACKS.length} tracks...\n`);

  const results: Record<string, { url: string; filename: string; identifier: string }> = {};
  const notFound: string[] = [];

  for (let i = 0; i < TRACKS.length; i++) {
    const track = TRACKS[i];
    process.stdout.write(`[${i + 1}/${TRACKS.length}] ${track.composer} - ${track.piece}... `);

    const identifiers = await searchIA(track.iaQuery);
    await delay(DELAY_MS);

    let found = false;
    for (const id of identifiers) {
      const mp3 = await getMP3FromItem(id);
      await delay(500);

      if (mp3) {
        console.log(`FOUND: ${id} → ${mp3.filename} (${Math.round(mp3.size / 1024 / 1024 * 10) / 10}MB)`);
        results[track.id] = { url: mp3.url, filename: mp3.filename, identifier: id };
        found = true;
        break;
      }
    }

    if (!found) {
      console.log("NOT FOUND");
      notFound.push(`${track.composer} - ${track.piece}`);
    }
  }

  console.log(`\n\n=== SUMMARY ===`);
  console.log(`Found MP3: ${Object.keys(results).length}`);
  console.log(`Not found: ${notFound.length}`);

  if (notFound.length > 0) {
    console.log(`\n=== NOT FOUND ===`);
    notFound.forEach((t) => console.log(`  - ${t}`));
  }

  console.log(`\n=== JSON RESULTS ===`);
  console.log(JSON.stringify(results, null, 2));
}

main().catch(console.error);

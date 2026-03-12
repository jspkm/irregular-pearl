/**
 * Targeted search for verified MP3 files on Internet Archive.
 * Uses stricter matching: prefers items with single pieces, checks filenames.
 * Also searches Wikimedia Commons for MP3/FLAC alternatives.
 *
 * Usage: npx tsx scripts/find-verified-mp3s.ts
 */

const DELAY_MS = 800;
const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

interface TrackSearch {
  id: string;
  title: string; // for display
  wmFilename: string; // current Wikimedia filename
  iaSearchQueries: string[]; // multiple queries to try on IA
  keywords: string[]; // keywords that should appear in a valid MP3 filename
  wmSearchTerms?: string; // for Wikimedia MP3 search
}

const TRACKS: TrackSearch[] = [
  // BEETHOVEN
  {
    id: "fur-elise",
    title: "Für Elise",
    wmFilename: "For Elise (Für Elise) Beethoven JMC Han.ogg",
    iaSearchQueries: ["title:(fur elise) AND mediatype:audio AND format:(MP3)"],
    keywords: ["fur elise", "für elise", "fuer elise"],
    wmSearchTerms: "Für Elise Beethoven mp3",
  },
  {
    id: "beethoven-sym5-i",
    title: "Symphony No. 5 – I. Allegro con brio",
    wmFilename: "Ludwig van Beethoven - symphony no. 5 in c minor, op. 67 - i. allegro con brio.ogg",
    iaSearchQueries: ["title:(beethoven symphony 5) AND mediatype:audio"],
    keywords: ["symphony", "5", "allegro con brio", "first movement", "1st"],
  },
  {
    id: "beethoven-sym5-iv",
    title: "Symphony No. 5 – IV. Allegro",
    wmFilename: "Ludwig van Beethoven - symphony no. 5 in c minor, op. 67 - iv. allegro.ogg",
    iaSearchQueries: ["title:(beethoven symphony 5) AND mediatype:audio"],
    keywords: ["symphony", "5", "iv", "fourth", "4th", "finale"],
  },
  {
    id: "moonlight-i",
    title: "Moonlight Sonata – I. Adagio sostenuto",
    wmFilename: "Beethoven Moonlight 1st movement.ogg",
    iaSearchQueries: [
      "title:(moonlight sonata adagio) AND mediatype:audio",
      "title:(moonlight sonata 1st) AND mediatype:audio",
    ],
    keywords: ["moonlight", "adagio", "1st", "first", "movement 1"],
  },
  {
    id: "moonlight-iii",
    title: "Moonlight Sonata – III. Presto agitato",
    wmFilename: "Beethoven Moonlight 3rd movement.ogg",
    iaSearchQueries: [
      "title:(moonlight sonata presto) AND mediatype:audio",
      "title:(moonlight sonata 3rd) AND mediatype:audio",
    ],
    keywords: ["moonlight", "presto", "3rd", "third", "movement 3"],
  },
  {
    id: "pathetique-ii",
    title: "Pathétique – II. Adagio cantabile",
    wmFilename: "Beethoven, Sonata No. 8 in C Minor Pathetique, Op. 13 - II. Adagio cantabile.ogg",
    iaSearchQueries: ["title:(pathetique adagio) AND mediatype:audio"],
    keywords: ["pathetique", "adagio", "cantabile"],
  },
  {
    id: "32-variations",
    title: "32 Variations in C minor",
    wmFilename: "Beethoven - 32 Variations in C Minor, WoO 80.ogg",
    iaSearchQueries: ["title:(beethoven 32 variations) AND mediatype:audio"],
    keywords: ["32 variations", "woo 80"],
  },
  {
    id: "emperor-ii",
    title: "Emperor Concerto – II. Adagio",
    wmFilename: "Beethoven Piano Concerto No 5 Movement 1.ogg",
    iaSearchQueries: ["title:(beethoven emperor concerto) AND mediatype:audio", "title:(beethoven piano concerto 5) AND mediatype:audio"],
    keywords: ["emperor", "concerto", "piano concerto 5", "adagio"],
  },
  {
    id: "ode-to-joy",
    title: "Symphony No. 9 – Ode to Joy",
    wmFilename: "Ludwig van Beethoven - Symphonie 5 c-moll - 1. Allegro con brio.ogg",
    iaSearchQueries: ["title:(beethoven symphony 9 ode joy) AND mediatype:audio", "title:(ode to joy beethoven) AND mediatype:audio"],
    keywords: ["ode to joy", "symphony 9", "choral"],
  },
  // CHOPIN
  {
    id: "nocturne-op9-2",
    title: "Nocturne in E-flat major, Op. 9 No. 2",
    wmFilename: "Frederic Chopin - Nocturne Eb major Opus 9, number 2.ogg",
    iaSearchQueries: ["title:(chopin nocturne op 9 no 2) AND mediatype:audio"],
    keywords: ["nocturne", "op 9", "no 2", "e flat", "e-flat"],
  },
  {
    id: "ballade-1",
    title: "Ballade No. 1 in G minor",
    wmFilename: "Frederic Chopin - ballade no. 1 in g minor, op. 23.ogg",
    iaSearchQueries: ["title:(chopin ballade 1 g minor) AND mediatype:audio"],
    keywords: ["ballade", "no 1", "g minor"],
  },
  {
    id: "etude-op10-3",
    title: "Étude Op. 10, No. 3 'Tristesse'",
    wmFilename: "Frederic_Chopin_-_Opus_10_-_Twelve_Grand_Etudes_-_E_Major.ogg",
    iaSearchQueries: ["title:(chopin etude op 10 no 3) AND mediatype:audio", "title:(chopin tristesse) AND mediatype:audio"],
    keywords: ["etude", "op 10", "no 3", "tristesse"],
  },
  {
    id: "minute-waltz",
    title: "Minute Waltz",
    wmFilename: "Chopin Minute Waltz.ogg",
    iaSearchQueries: ["title:(chopin minute waltz) AND mediatype:audio"],
    keywords: ["minute waltz", "op 64 no 1", "waltz d flat"],
  },
  {
    id: "raindrop",
    title: "Raindrop Prelude",
    wmFilename: "Chopin_Prelude_Op_28_N_15_Giorgi_Latsabidze_performs.ogg",
    iaSearchQueries: ["title:(chopin raindrop prelude) AND mediatype:audio", "title:(chopin prelude op 28 no 15) AND mediatype:audio"],
    keywords: ["raindrop", "prelude", "op 28", "no 15"],
  },
  {
    id: "heroic-polonaise",
    title: "Heroic Polonaise",
    wmFilename: "Chopin_-_Polonaise_Op._53.oga",
    iaSearchQueries: ["title:(chopin polonaise op 53) AND mediatype:audio", "title:(chopin heroic polonaise) AND mediatype:audio"],
    keywords: ["polonaise", "op 53", "heroic"],
  },
  {
    id: "fantaisie-impromptu",
    title: "Fantaisie-Impromptu",
    wmFilename: "Frederic Chopin - Fantasy Impromptu Opus 66.ogg",
    iaSearchQueries: ["title:(chopin fantaisie impromptu) AND mediatype:audio"],
    keywords: ["fantaisie", "impromptu", "op 66"],
  },
  {
    id: "nocturne-csharp",
    title: "Nocturne C# minor posth",
    wmFilename: "Chopin, Nocturne in C-sharp minor, Op. Posth.ogg",
    iaSearchQueries: ["title:(chopin nocturne c sharp minor posthumous) AND mediatype:audio"],
    keywords: ["nocturne", "c sharp", "c-sharp", "posth"],
  },
  {
    id: "scherzo-2",
    title: "Scherzo No. 2",
    wmFilename: "Frederic Chopin - scherzo no. 2 in b flat minor, op. 31.ogg",
    iaSearchQueries: ["title:(chopin scherzo no 2) AND mediatype:audio"],
    keywords: ["scherzo", "no 2", "b flat minor", "op 31"],
  },
  {
    id: "winter-wind",
    title: "Winter Wind Étude",
    wmFilename: "Chopin_op25_No_11.ogg",
    iaSearchQueries: ["title:(chopin winter wind) AND mediatype:audio", "title:(chopin etude op 25 no 11) AND mediatype:audio"],
    keywords: ["winter wind", "op 25", "no 11"],
  },
  // DEBUSSY
  {
    id: "clair-de-lune",
    title: "Clair de lune",
    wmFilename: "Clair de lune (Claude Debussy) Suite bergamasque.ogg",
    iaSearchQueries: ["title:(debussy clair de lune) AND mediatype:audio"],
    keywords: ["clair de lune"],
  },
  {
    id: "arabesque-1",
    title: "Arabesque No. 1",
    wmFilename: "Debussy - Arabesque No. 1 in E major.ogg",
    iaSearchQueries: ["title:(debussy arabesque 1) AND mediatype:audio"],
    keywords: ["arabesque", "no 1"],
  },
  {
    id: "reverie",
    title: "Rêverie",
    wmFilename: "Reverie.ogg",
    iaSearchQueries: ["title:(debussy reverie) AND mediatype:audio"],
    keywords: ["reverie", "rêverie"],
  },
  {
    id: "apres-midi",
    title: "Prélude à l'après-midi d'un faune",
    wmFilename: "Claude Debussy - Prélude à l'après-midi d'un faune.ogg",
    iaSearchQueries: ["title:(debussy prelude apres midi) AND mediatype:audio", "title:(debussy afternoon faun) AND mediatype:audio"],
    keywords: ["apres-midi", "afternoon", "faune", "faun"],
  },
  // BACH
  {
    id: "toccata-fugue",
    title: "Toccata and Fugue in D minor",
    wmFilename: "J.S. Bach - Toccata and Fugue in D minor BWV 565.ogg",
    iaSearchQueries: ["title:(toccata fugue d minor bwv 565) AND mediatype:audio"],
    keywords: ["toccata", "fugue", "d minor", "bwv 565"],
  },
  {
    id: "air-g-string",
    title: "Air on the G String",
    wmFilename: "Air (Bach).ogg",
    iaSearchQueries: ["title:(bach air g string) AND mediatype:audio"],
    keywords: ["air", "g string"],
  },
  {
    id: "cello-suite-1",
    title: "Cello Suite No. 1 – Prélude",
    wmFilename: "Bach - Cello Suite no. 1 in G major, BWV 1007 - I. Prélude.ogg",
    iaSearchQueries: ["title:(bach cello suite 1 prelude) AND mediatype:audio"],
    keywords: ["cello suite", "prelude", "bwv 1007"],
  },
  {
    id: "brandenburg-3",
    title: "Brandenburg Concerto No. 3",
    wmFilename: "Bach - Brandenburg Concerto No. 3 - 1. Allegro.ogg",
    iaSearchQueries: ["title:(bach brandenburg concerto 3) AND mediatype:audio"],
    keywords: ["brandenburg", "concerto", "no 3"],
  },
  {
    id: "wtc-prelude-1",
    title: "WTC Prelude No. 1 in C major",
    wmFilename: "Kimiko Ishizaka - Bach - Well-Tempered Clavier, Book 1 - 01 Prelude No. 1 in C major, BWV 846.ogg",
    iaSearchQueries: ["title:(bach well tempered clavier prelude c major) AND mediatype:audio"],
    keywords: ["well-tempered", "prelude", "c major", "bwv 846"],
  },
  {
    id: "badinerie",
    title: "Badinerie",
    wmFilename: "JS Bach - Orchestral Suite in B minor BWV 1067 - 7 Badinerie.ogg",
    iaSearchQueries: ["title:(bach badinerie) AND mediatype:audio"],
    keywords: ["badinerie"],
  },
  {
    id: "goldberg-aria",
    title: "Goldberg Variations – Aria",
    wmFilename: "J.S.Bach - Goldberg Variations - 01 - Aria.ogg",
    iaSearchQueries: ["title:(bach goldberg variations aria) AND mediatype:audio"],
    keywords: ["goldberg", "aria"],
  },
  {
    id: "passacaglia",
    title: "Passacaglia and Fugue BWV 582",
    wmFilename: "J.S. Bach - Passacaglia and Fugue in C minor, BWV 582.ogg",
    iaSearchQueries: ["title:(bach passacaglia fugue c minor) AND mediatype:audio"],
    keywords: ["passacaglia", "bwv 582"],
  },
  {
    id: "chaconne",
    title: "Chaconne from Partita No. 2",
    wmFilename: "Johann Sebastian Bach - Partita for Violin no. 2, BWV 1004 - V - Chaconne.ogg",
    iaSearchQueries: ["title:(bach chaconne partita) AND mediatype:audio"],
    keywords: ["chaconne", "partita"],
  },
  // MOZART
  {
    id: "eine-kleine-i",
    title: "Eine kleine Nachtmusik – I",
    wmFilename: "Mozart - Eine kleine Nachtmusik - 1. Allegro.ogg",
    iaSearchQueries: ["title:(mozart eine kleine nachtmusik allegro) AND mediatype:audio"],
    keywords: ["eine kleine", "nachtmusik", "allegro"],
  },
  {
    id: "turkish-march",
    title: "Turkish March",
    wmFilename: "Mozart - Piano Sonata No. 11 in A major - III. Allegro (Turkish March).ogg",
    iaSearchQueries: ["title:(mozart turkish march) AND mediatype:audio", "title:(mozart rondo alla turca) AND mediatype:audio"],
    keywords: ["turkish march", "rondo alla turca"],
  },
  {
    id: "symphony-40-i",
    title: "Symphony No. 40 – I",
    wmFilename: "Mozart - Symphony No. 40 in G minor, K. 550 - I. Molto allegro.ogg",
    iaSearchQueries: ["title:(mozart symphony 40 g minor) AND mediatype:audio"],
    keywords: ["symphony 40", "g minor", "molto allegro"],
  },
  {
    id: "lacrimosa",
    title: "Requiem – Lacrimosa",
    wmFilename: "W. A. Mozart - Requiem - 8. Lacrimosa (Herbert von Karajan, Wiener Philharmoniker, Wiener Singverein, 1960).ogg",
    iaSearchQueries: ["title:(mozart requiem lacrimosa) AND mediatype:audio"],
    keywords: ["lacrimosa"],
  },
  {
    id: "piano-concerto-21",
    title: "Piano Concerto No. 21 – II",
    wmFilename: "Mozart Piano Concerto No 21 - II - Andante.ogg",
    iaSearchQueries: ["title:(mozart piano concerto 21 andante) AND mediatype:audio"],
    keywords: ["piano concerto 21", "andante"],
  },
  {
    id: "figaro-overture",
    title: "Marriage of Figaro Overture",
    wmFilename: "Le nozze di Figaro overture - Vienna Philharmonic - Bruno Walter (1937).ogg",
    iaSearchQueries: ["title:(mozart marriage figaro overture) AND mediatype:audio", "title:(nozze figaro overture) AND mediatype:audio"],
    keywords: ["figaro", "overture"],
  },
  {
    id: "eine-kleine-ii",
    title: "Eine kleine Nachtmusik – II",
    wmFilename: "Mozart - Eine kleine Nachtmusik - 2. Romanze.ogg",
    iaSearchQueries: ["title:(mozart eine kleine nachtmusik romanze) AND mediatype:audio"],
    keywords: ["eine kleine", "romanze"],
  },
  {
    id: "sonata-k545",
    title: "Piano Sonata K545 – I",
    wmFilename: "Mozart - Piano Sonata No. 16 in C major - I. Allegro.ogg",
    iaSearchQueries: ["title:(mozart sonata k 545 c major) AND mediatype:audio"],
    keywords: ["sonata", "k 545", "c major"],
  },
  // TCHAIKOVSKY
  {
    id: "swan-lake",
    title: "Swan Lake – Scene",
    wmFilename: "Pyotr Ilyich Tchaikovsky - Swan Lake - 01 - Scene.ogg",
    iaSearchQueries: ["title:(tchaikovsky swan lake scene) AND mediatype:audio"],
    keywords: ["swan lake", "scene"],
  },
  {
    id: "sugar-plum",
    title: "Sugar Plum Fairy",
    wmFilename: "Tchaikovsky- The Nutcracker - Act II - No.14c - Variation 2 - Dance of the Sugar-Plum Fairy.ogg",
    iaSearchQueries: ["title:(tchaikovsky sugar plum fairy) AND mediatype:audio", "title:(nutcracker sugar plum) AND mediatype:audio"],
    keywords: ["sugar plum", "nutcracker"],
  },
  {
    id: "waltz-flowers",
    title: "Waltz of the Flowers",
    wmFilename: "Tchaikovsky- The Nutcracker - Act II - No.13 - Waltz of the Flowers.ogg",
    iaSearchQueries: ["title:(tchaikovsky waltz flowers) AND mediatype:audio", "title:(nutcracker waltz flowers) AND mediatype:audio"],
    keywords: ["waltz", "flowers", "nutcracker"],
  },
  {
    id: "1812",
    title: "1812 Overture",
    wmFilename: "Pyotr Ilyich Tchaikovsky - 1812 overture.ogg",
    iaSearchQueries: ["title:(tchaikovsky 1812 overture) AND mediatype:audio"],
    keywords: ["1812", "overture"],
  },
  {
    id: "tchaikovsky-pc1",
    title: "Piano Concerto No. 1",
    wmFilename: "Tchaikovsky-2 Piano concerto Nro1 mov1.ogg",
    iaSearchQueries: ["title:(tchaikovsky piano concerto 1 b flat) AND mediatype:audio"],
    keywords: ["piano concerto", "b flat", "b-flat"],
  },
  {
    id: "sleeping-beauty",
    title: "Sleeping Beauty Waltz",
    wmFilename: "Tchaikovsky - The Sleeping Beauty - Waltz.ogg",
    iaSearchQueries: ["title:(tchaikovsky sleeping beauty waltz) AND mediatype:audio"],
    keywords: ["sleeping beauty", "waltz"],
  },
  // VIVALDI
  {
    id: "spring-i",
    title: "Four Seasons – Spring I",
    wmFilename: "01 - Vivaldi Spring mvt 1 Allegro - John Harrison violin.ogg",
    iaSearchQueries: ["title:(vivaldi four seasons spring allegro) AND mediatype:audio"],
    keywords: ["spring", "allegro"],
  },
  {
    id: "summer-iii",
    title: "Four Seasons – Summer III",
    wmFilename: "06 - Vivaldi Summer mvt 3 Presto - John Harrison violin.ogg",
    iaSearchQueries: ["title:(vivaldi four seasons summer presto) AND mediatype:audio"],
    keywords: ["summer", "presto"],
  },
  {
    id: "autumn-i",
    title: "Four Seasons – Autumn I",
    wmFilename: "07 - Vivaldi Autumn mvt 1 Allegro - John Harrison violin.ogg",
    iaSearchQueries: ["title:(vivaldi four seasons autumn allegro) AND mediatype:audio"],
    keywords: ["autumn", "allegro"],
  },
  {
    id: "winter-ii",
    title: "Four Seasons – Winter II",
    wmFilename: "11 - Vivaldi Winter mvt 2 Largo - John Harrison violin.ogg",
    iaSearchQueries: ["title:(vivaldi four seasons winter largo) AND mediatype:audio"],
    keywords: ["winter", "largo"],
  },
  {
    id: "winter-i",
    title: "Four Seasons – Winter I",
    wmFilename: "10 - Vivaldi Winter mvt 1 Allegro non molto - John Harrison violin.ogg",
    iaSearchQueries: ["title:(vivaldi four seasons winter allegro) AND mediatype:audio"],
    keywords: ["winter", "allegro non molto"],
  },
];

// More tracks can be added similarly...

interface IAFileInfo {
  name: string;
  format: string;
  size: string;
}

async function searchIA(query: string): Promise<{ identifier: string; title: string }[]> {
  const url = `https://archive.org/advancedsearch.php?q=${encodeURIComponent(query)}&fl[]=identifier&fl[]=title&rows=10&output=json&sort[]=downloads+desc`;
  try {
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    return (data.response?.docs || []).map((d: any) => ({ identifier: d.identifier, title: d.title }));
  } catch {
    return [];
  }
}

async function getMP3sFromItem(identifier: string): Promise<IAFileInfo[]> {
  try {
    const res = await fetch(`https://archive.org/metadata/${identifier}/files`);
    if (!res.ok) return [];
    const data = await res.json();
    const files: any[] = data.result || [];
    return files
      .filter((f: any) => f.name?.toLowerCase().endsWith(".mp3"))
      .map((f: any) => ({ name: f.name, format: f.format || "", size: f.size || "0" }));
  } catch {
    return [];
  }
}

function matchesKeywords(filename: string, keywords: string[]): boolean {
  const lower = filename.toLowerCase();
  return keywords.some((kw) => lower.includes(kw.toLowerCase()));
}

async function findBestMP3(track: TrackSearch): Promise<{ url: string; identifier: string; filename: string } | null> {
  for (const query of track.iaSearchQueries) {
    const items = await searchIA(query);
    await delay(DELAY_MS);

    for (const item of items.slice(0, 5)) {
      const mp3s = await getMP3sFromItem(item.identifier);
      await delay(400);

      if (mp3s.length === 0) continue;

      // If there's only one MP3 file, it's likely the whole piece
      if (mp3s.length === 1 && mp3s[0].name.toLowerCase().endsWith(".mp3")) {
        return {
          url: `https://archive.org/download/${item.identifier}/${encodeURIComponent(mp3s[0].name)}`,
          identifier: item.identifier,
          filename: mp3s[0].name,
        };
      }

      // If multiple MP3s, try to match by keywords
      for (const mp3 of mp3s) {
        if (matchesKeywords(mp3.name, track.keywords)) {
          return {
            url: `https://archive.org/download/${item.identifier}/${encodeURIComponent(mp3.name)}`,
            identifier: item.identifier,
            filename: mp3.name,
          };
        }
      }

      // Check if item title matches keywords (single-piece items)
      if (matchesKeywords(item.title, track.keywords) && mp3s.length <= 3) {
        // Pick the largest MP3 (likely highest quality)
        const best = mp3s.reduce((a, b) =>
          parseInt(a.size) > parseInt(b.size) ? a : b
        );
        return {
          url: `https://archive.org/download/${item.identifier}/${encodeURIComponent(best.name)}`,
          identifier: item.identifier,
          filename: best.name,
        };
      }
    }
  }

  return null;
}

async function main() {
  console.log(`Searching for verified MP3s for ${TRACKS.length} tracks...\n`);

  const results: Record<string, { url: string; identifier: string; filename: string }> = {};
  const notFound: string[] = [];

  for (let i = 0; i < TRACKS.length; i++) {
    const track = TRACKS[i];
    process.stdout.write(`[${i + 1}/${TRACKS.length}] ${track.title}... `);

    const result = await findBestMP3(track);

    if (result) {
      console.log(`FOUND: ${result.identifier} → ${result.filename}`);
      results[track.id] = result;
    } else {
      console.log("NOT FOUND");
      notFound.push(track.title);
    }
  }

  console.log(`\n=== SUMMARY ===`);
  console.log(`Found: ${Object.keys(results).length}/${TRACKS.length}`);
  console.log(`Not found: ${notFound.length}`);

  if (notFound.length > 0) {
    console.log(`\nNot found:`);
    notFound.forEach((t) => console.log(`  - ${t}`));
  }

  console.log(`\n=== RESULTS JSON ===`);
  console.log(JSON.stringify(results, null, 2));
}

main().catch(console.error);

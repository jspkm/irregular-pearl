/**
 * Validates all audio URLs from seed-tracks.ts by checking HTTP status
 * and Content-Type headers. Identifies broken links and OGG files.
 *
 * Usage: npx tsx scripts/validate-audio-urls.ts
 */

const TRACKS = [
  { title: "Für Elise", url: "https://commons.wikimedia.org/wiki/Special:FilePath/For%20Elise%20(F%C3%BCr%20Elise)%20Beethoven%20JMC%20Han.ogg" },
  { title: "Symphony No. 5 – I", url: "https://commons.wikimedia.org/wiki/Special:FilePath/Ludwig%20van%20Beethoven%20-%20symphony%20no.%205%20in%20c%20minor%2C%20op.%2067%20-%20i.%20allegro%20con%20brio.ogg" },
  { title: "Symphony No. 5 – IV", url: "https://commons.wikimedia.org/wiki/Special:FilePath/Ludwig%20van%20Beethoven%20-%20symphony%20no.%205%20in%20c%20minor%2C%20op.%2067%20-%20iv.%20allegro.ogg" },
  { title: "Moonlight Sonata – I", url: "https://commons.wikimedia.org/wiki/Special:FilePath/Beethoven%20Moonlight%201st%20movement.ogg" },
  { title: "Moonlight Sonata – III", url: "https://commons.wikimedia.org/wiki/Special:FilePath/Beethoven%20Moonlight%203rd%20movement.ogg" },
  { title: "Pathétique – II", url: "https://commons.wikimedia.org/wiki/Special:FilePath/Beethoven%2C%20Sonata%20No.%208%20in%20C%20Minor%20Pathetique%2C%20Op.%2013%20-%20II.%20Adagio%20cantabile.ogg" },
  { title: "32 Variations", url: "https://commons.wikimedia.org/wiki/Special:FilePath/Beethoven%20-%2032%20Variations%20in%20C%20Minor%2C%20WoO%2080.ogg" },
  { title: "Emperor Concerto – II", url: "https://commons.wikimedia.org/wiki/Special:FilePath/Beethoven%20Piano%20Concerto%20No%205%20Movement%201.ogg" },
  { title: "Symphony No. 9 – Ode to Joy", url: "https://commons.wikimedia.org/wiki/Special:FilePath/Ludwig%20van%20Beethoven%20-%20Symphonie%205%20c-moll%20-%201.%20Allegro%20con%20brio.ogg" },
  { title: "Nocturne Op. 9 No. 2", url: "https://commons.wikimedia.org/wiki/Special:FilePath/Frederic%20Chopin%20-%20Nocturne%20Eb%20major%20Opus%209%2C%20number%202.ogg" },
  { title: "Ballade No. 1", url: "https://commons.wikimedia.org/wiki/Special:FilePath/Frederic%20Chopin%20-%20ballade%20no.%201%20in%20g%20minor%2C%20op.%2023.ogg" },
  { title: "Étude Op. 10 No. 3", url: "https://commons.wikimedia.org/wiki/Special:FilePath/Frederic_Chopin_-_Opus_10_-_Twelve_Grand_Etudes_-_E_Major.ogg" },
  { title: "Minute Waltz", url: "https://commons.wikimedia.org/wiki/Special:FilePath/Chopin%20Minute%20Waltz.ogg" },
  { title: "Raindrop Prelude", url: "https://commons.wikimedia.org/wiki/Special:FilePath/Chopin_Prelude_Op_28_N_15_Giorgi_Latsabidze_performs.ogg" },
  { title: "Heroic Polonaise", url: "https://commons.wikimedia.org/wiki/Special:FilePath/Chopin_-_Polonaise_Op._53.oga" },
  { title: "Fantaisie-Impromptu", url: "https://commons.wikimedia.org/wiki/Special:FilePath/Frederic%20Chopin%20-%20Fantasy%20Impromptu%20Opus%2066.ogg" },
  { title: "Nocturne C# minor posth", url: "https://commons.wikimedia.org/wiki/Special:FilePath/Chopin%2C%20Nocturne%20in%20C-sharp%20minor%2C%20Op.%20Posth.ogg" },
  { title: "Scherzo No. 2", url: "https://commons.wikimedia.org/wiki/Special:FilePath/Frederic%20Chopin%20-%20scherzo%20no.%202%20in%20b%20flat%20minor%2C%20op.%2031.ogg" },
  { title: "Winter Wind", url: "https://commons.wikimedia.org/wiki/Special:FilePath/Chopin_op25_No_11.ogg" },
  { title: "Clair de lune", url: "https://commons.wikimedia.org/wiki/Special:FilePath/Clair%20de%20lune%20(Claude%20Debussy)%20Suite%20bergamasque.ogg" },
  { title: "Arabesque No. 1", url: "https://commons.wikimedia.org/wiki/Special:FilePath/Debussy%20-%20Arabesque%20No.%201%20in%20E%20major.ogg" },
  { title: "Rêverie", url: "https://commons.wikimedia.org/wiki/Special:FilePath/Reverie.ogg" },
  { title: "Prélude à l'après-midi", url: "https://commons.wikimedia.org/wiki/Special:FilePath/Claude%20Debussy%20-%20Pr%C3%A9lude%20%C3%A0%20l%27apr%C3%A8s-midi%20d%27un%20faune.ogg" },
  { title: "Toccata and Fugue", url: "https://commons.wikimedia.org/wiki/Special:FilePath/J.S.%20Bach%20-%20Toccata%20and%20Fugue%20in%20D%20minor%20BWV%20565.ogg" },
  { title: "Air on G String", url: "https://commons.wikimedia.org/wiki/Special:FilePath/Air%20(Bach).ogg" },
  { title: "Cello Suite No. 1", url: "https://commons.wikimedia.org/wiki/Special:FilePath/Bach%20-%20Cello%20Suite%20no.%201%20in%20G%20major%2C%20BWV%201007%20-%20I.%20Pr%C3%A9lude.ogg" },
  { title: "Brandenburg 3 – I", url: "https://commons.wikimedia.org/wiki/Special:FilePath/Bach%20-%20Brandenburg%20Concerto%20No.%203%20-%201.%20Allegro.ogg" },
  { title: "WTC Prelude 1", url: "https://commons.wikimedia.org/wiki/Special:FilePath/Kimiko%20Ishizaka%20-%20Bach%20-%20Well-Tempered%20Clavier%2C%20Book%201%20-%2001%20Prelude%20No.%201%20in%20C%20major%2C%20BWV%20846.ogg" },
  { title: "Badinerie", url: "https://commons.wikimedia.org/wiki/Special:FilePath/JS%20Bach%20-%20Orchestral%20Suite%20in%20B%20minor%20BWV%201067%20-%207%20Badinerie.ogg" },
  { title: "Goldberg Aria", url: "https://commons.wikimedia.org/wiki/Special:FilePath/J.S.Bach%20-%20Goldberg%20Variations%20-%2001%20-%20Aria.ogg" },
  { title: "Passacaglia BWV 582", url: "https://commons.wikimedia.org/wiki/Special:FilePath/J.S.%20Bach%20-%20Passacaglia%20and%20Fugue%20in%20C%20minor%2C%20BWV%20582.ogg" },
  { title: "Chaconne", url: "https://commons.wikimedia.org/wiki/Special:FilePath/Johann%20Sebastian%20Bach%20-%20Partita%20for%20Violin%20no.%202%2C%20BWV%201004%20-%20V%20-%20Chaconne.ogg" },
  { title: "Eine kleine – I", url: "https://commons.wikimedia.org/wiki/Special:FilePath/Mozart%20-%20Eine%20kleine%20Nachtmusik%20-%201.%20Allegro.ogg" },
  { title: "Turkish March", url: "https://commons.wikimedia.org/wiki/Special:FilePath/Mozart%20-%20Piano%20Sonata%20No.%2011%20in%20A%20major%20-%20III.%20Allegro%20(Turkish%20March).ogg" },
  { title: "Symphony 40 – I", url: "https://commons.wikimedia.org/wiki/Special:FilePath/Mozart%20-%20Symphony%20No.%2040%20in%20G%20minor%2C%20K.%20550%20-%20I.%20Molto%20allegro.ogg" },
  { title: "Lacrimosa", url: "https://commons.wikimedia.org/wiki/Special:FilePath/W.%20A.%20Mozart%20-%20Requiem%20-%208.%20Lacrimosa%20(Herbert%20von%20Karajan%2C%20Wiener%20Philharmoniker%2C%20Wiener%20Singverein%2C%201960).ogg" },
  { title: "Piano Concerto 21 – II", url: "https://commons.wikimedia.org/wiki/Special:FilePath/Mozart%20Piano%20Concerto%20No%2021%20-%20II%20-%20Andante.ogg" },
  { title: "Figaro Overture", url: "https://commons.wikimedia.org/wiki/Special:FilePath/Le%20nozze%20di%20Figaro%20overture%20-%20Vienna%20Philharmonic%20-%20Bruno%20Walter%20(1937).ogg" },
  { title: "Eine kleine – II", url: "https://commons.wikimedia.org/wiki/Special:FilePath/Mozart%20-%20Eine%20kleine%20Nachtmusik%20-%202.%20Romanze.ogg" },
  { title: "Sonata K545 – I", url: "https://commons.wikimedia.org/wiki/Special:FilePath/Mozart%20-%20Piano%20Sonata%20No.%2016%20in%20C%20major%20-%20I.%20Allegro.ogg" },
  { title: "Swan Lake", url: "https://commons.wikimedia.org/wiki/Special:FilePath/Pyotr%20Ilyich%20Tchaikovsky%20-%20Swan%20Lake%20-%2001%20-%20Scene.ogg" },
  { title: "Sugar Plum Fairy", url: "https://commons.wikimedia.org/wiki/Special:FilePath/Tchaikovsky-%20The%20Nutcracker%20-%20Act%20II%20-%20No.14c%20-%20Variation%202%20-%20Dance%20of%20the%20Sugar-Plum%20Fairy.ogg" },
  { title: "Waltz of Flowers", url: "https://commons.wikimedia.org/wiki/Special:FilePath/Tchaikovsky-%20The%20Nutcracker%20-%20Act%20II%20-%20No.13%20-%20Waltz%20of%20the%20Flowers.ogg" },
  { title: "1812 Overture", url: "https://commons.wikimedia.org/wiki/Special:FilePath/Pyotr%20Ilyich%20Tchaikovsky%20-%201812%20overture.ogg" },
  { title: "Tchaikovsky Piano 1 – I", url: "https://commons.wikimedia.org/wiki/Special:FilePath/Tchaikovsky-2%20Piano%20concerto%20Nro1%20mov1.ogg" },
  { title: "Sleeping Beauty Waltz", url: "https://commons.wikimedia.org/wiki/Special:FilePath/Tchaikovsky%20-%20The%20Sleeping%20Beauty%20-%20Waltz.ogg" },
  { title: "Spring – I", url: "https://commons.wikimedia.org/wiki/Special:FilePath/01%20-%20Vivaldi%20Spring%20mvt%201%20Allegro%20-%20John%20Harrison%20violin.ogg" },
  { title: "Summer – III", url: "https://commons.wikimedia.org/wiki/Special:FilePath/06%20-%20Vivaldi%20Summer%20mvt%203%20Presto%20-%20John%20Harrison%20violin.ogg" },
  { title: "Autumn – I", url: "https://commons.wikimedia.org/wiki/Special:FilePath/07%20-%20Vivaldi%20Autumn%20mvt%201%20Allegro%20-%20John%20Harrison%20violin.ogg" },
  { title: "Winter – II", url: "https://commons.wikimedia.org/wiki/Special:FilePath/11%20-%20Vivaldi%20Winter%20mvt%202%20Largo%20-%20John%20Harrison%20violin.ogg" },
  { title: "Winter – I", url: "https://commons.wikimedia.org/wiki/Special:FilePath/10%20-%20Vivaldi%20Winter%20mvt%201%20Allegro%20non%20molto%20-%20John%20Harrison%20violin.ogg" },
  { title: "Hungarian Rhapsody 2", url: "https://commons.wikimedia.org/wiki/Special:FilePath/Hungarian%20Rhapsody%20No%202.ogg" },
  { title: "Liebestraum 3", url: "https://commons.wikimedia.org/wiki/Special:FilePath/Franz%20Liszt%20-%20Liebestraum%2C%20Ab%20Major.ogg" },
  { title: "La Campanella", url: "https://commons.wikimedia.org/wiki/Special:FilePath/Liszt-La%20Campanella-Greiss.ogg" },
  { title: "Consolation 3", url: "https://commons.wikimedia.org/wiki/Special:FilePath/Consolation%20No.%203%20in%20D-flat%20major.ogg" },
  { title: "Ave Maria", url: "https://commons.wikimedia.org/wiki/Special:FilePath/Franz%20Schubert%20-%20Ave%20Maria.ogg" },
  { title: "Serenade", url: "https://commons.wikimedia.org/wiki/Special:FilePath/St%C3%A4ndchen%20(Schubert)-Serenade%20D957%20No.4%2C%20Player%20Jason%2C%20Han.ogg" },
  { title: "Trout Quintet – IV", url: "https://commons.wikimedia.org/wiki/Special:FilePath/Schubert%20-%20Piano%20Quintet%20-%20The%20Trout%20-%20IV.%20Theme%20and%20Variations.ogg" },
  { title: "Impromptu Op. 90 No. 3", url: "https://commons.wikimedia.org/wiki/Special:FilePath/Schubert%20Impromptu%20op.%2090%20n.%203.ogg" },
  { title: "Rach Piano Concerto 2 – I", url: "https://commons.wikimedia.org/wiki/Special:FilePath/Rachmaninoff%20-%20Piano%20Concerto%20No.%202%2C%20Opus%2018%20-%20I.%20Moderato.ogg" },
  { title: "Rach Prelude C# minor", url: "https://commons.wikimedia.org/wiki/Special:FilePath/Sergei%20Rachmaninoff%20performs%20Rachmaninoff%27s%20Prelude%20in%20C%20sharp%20minor%2C%20Op.%203.ogg" },
  { title: "Vocalise", url: "https://commons.wikimedia.org/wiki/Special:FilePath/Rachmaninov%20-%20Vocalise.ogg" },
  { title: "Rach Rhapsody Var 18", url: "https://commons.wikimedia.org/wiki/Special:FilePath/Rachmaninoff%20-%20Rhapsody%20on%20a%20Theme%20of%20Paganini%2C%20Variation%2018.ogg" },
  { title: "New World – II", url: "https://commons.wikimedia.org/wiki/Special:FilePath/Dvorak%20-%20Symphony%20No.9%20-%202%20-%20Largo.ogg" },
  { title: "New World – IV", url: "https://commons.wikimedia.org/wiki/Special:FilePath/Antonin%20Dvorak%20-%20symphony%20no.%209%20in%20e%20minor%20%27from%20the%20new%20world%27%2C%20op.%2095%20-%20iv.%20allegro%20con%20fuoco.ogg" },
  { title: "Humoresque", url: "https://commons.wikimedia.org/wiki/Special:FilePath/Dvo%C5%99%C3%A1k%20-%20Humoresque%20Op.%20101%20No.%207.ogg" },
  { title: "Morning Mood", url: "https://commons.wikimedia.org/wiki/Special:FilePath/Henrik%20Ibsen%2C%20Edvard%20Grieg%20-%20Morgenstemning%20(Morning%20Mood).ogg" },
  { title: "Mountain King", url: "https://commons.wikimedia.org/wiki/Special:FilePath/In%20the%20Hall%20of%20the%20Mountain%20King.ogg" },
  { title: "Grieg Piano Concerto – I", url: "https://commons.wikimedia.org/wiki/Special:FilePath/Edvard%20Grieg%20-%20piano%20concerto%20in%20a%20minor%2C%20op.%2016%20-%20i.%20allegro%20molto%20moderato.ogg" },
  { title: "Gymnopédie 1", url: "https://commons.wikimedia.org/wiki/Special:FilePath/Erik%20Satie%20-%20gymnopedies%20-%20la%201%20ere.%20lent%20et%20douloureux.ogg" },
  { title: "Gymnopédie 3", url: "https://commons.wikimedia.org/wiki/Special:FilePath/Gymnop%C3%A9die%20no.3.ogg" },
  { title: "Gnossienne 1", url: "https://commons.wikimedia.org/wiki/Special:FilePath/Satie%20Gnossienne%20no.%201.ogg" },
  { title: "Hungarian Dance 5", url: "https://commons.wikimedia.org/wiki/Special:FilePath/Brahms%20-%20Hungarian%20Dance%20No.%205.ogg" },
  { title: "Brahms Lullaby", url: "https://commons.wikimedia.org/wiki/Special:FilePath/Brahms%20-%20Wiegenlied.ogg" },
  { title: "Brahms Symphony 3 – III", url: "https://commons.wikimedia.org/wiki/Special:FilePath/Brahms%20Symphony%203%20Movement%203.ogg" },
  { title: "Brahms Intermezzo", url: "https://commons.wikimedia.org/wiki/Special:FilePath/Brahms%20-%20Intermezzo%20in%20A%20major%2C%20Op.118%2C%20No.2.ogg" },
  { title: "Alla Hornpipe", url: "https://commons.wikimedia.org/wiki/Special:FilePath/Georg_Friedrich_Haendel_-_Water_Music_Suite_No._2_-_05_-_Alla_Hornpipe.ogg" },
  { title: "Hallelujah Chorus", url: "https://commons.wikimedia.org/wiki/Special:FilePath/Handel%20-%20Messiah%20-%20Hallelujah.ogg" },
  { title: "Sarabande", url: "https://commons.wikimedia.org/wiki/Special:FilePath/Handel%20-%20Sarabande%20in%20D%20minor.ogg" },
  { title: "Wedding March", url: "https://commons.wikimedia.org/wiki/Special:FilePath/Mendelssohn%20-%20Wedding%20March.ogg" },
  { title: "Mendelssohn Violin – I", url: "https://commons.wikimedia.org/wiki/Special:FilePath/Mendelssohn%20violin%20concerto%20e-minor%201st%20movement.ogg" },
  { title: "Blue Danube", url: "https://commons.wikimedia.org/wiki/Special:FilePath/Strauss%20Blue%20Danube.ogg" },
  { title: "Radetzky March", url: "https://commons.wikimedia.org/wiki/Special:FilePath/Radetzky%20March.ogg" },
  { title: "Canon in D", url: "https://commons.wikimedia.org/wiki/Special:FilePath/Pachelbel%20-%20Canon%20in%20D.ogg" },
  { title: "The Swan", url: "https://commons.wikimedia.org/wiki/Special:FilePath/Saint-Sa%C3%ABns%20-%20The%20Swan.ogg" },
  { title: "Danse macabre", url: "https://commons.wikimedia.org/wiki/Special:FilePath/Saint-Saens%20-%20Danse%20Macabre.ogg" },
  { title: "Great Gate of Kiev", url: "https://commons.wikimedia.org/wiki/Special:FilePath/Mussorgsky%20-%20Pictures%20at%20an%20Exhibition%20-%20The%20Great%20Gate%20of%20Kiev.ogg" },
  { title: "Night on Bald Mountain", url: "https://commons.wikimedia.org/wiki/Special:FilePath/Mussorgsky%20-%20Night%20on%20Bald%20Mountain.ogg" },
  { title: "Boléro", url: "https://commons.wikimedia.org/wiki/Special:FilePath/Ravel%20Bolero.ogg" },
  { title: "Pavane Ravel", url: "https://commons.wikimedia.org/wiki/Special:FilePath/Ravel%20-%20Pavane%20pour%20une%20infante%20defunte.ogg" },
  { title: "Träumerei", url: "https://commons.wikimedia.org/wiki/Special:FilePath/Schumann%20-%20Tr%C3%A4umerei.ogg" },
  { title: "Schumann Piano Concerto – I", url: "https://commons.wikimedia.org/wiki/Special:FilePath/Schumann-PianoConcerto-1.ogg" },
  { title: "Ride of Valkyries", url: "https://commons.wikimedia.org/wiki/Special:FilePath/Richard%20Wagner%20-%20Ride%20of%20the%20Valkyries.ogg" },
  { title: "Bridal Chorus", url: "https://commons.wikimedia.org/wiki/Special:FilePath/Wagner%20-%20Bridal%20Chorus.ogg" },
  { title: "La Traviata Prelude", url: "https://commons.wikimedia.org/wiki/Special:FilePath/Verdi%20-%20La%20Traviata%20-%20Prelude.ogg" },
  { title: "Aida March", url: "https://commons.wikimedia.org/wiki/Special:FilePath/Verdi%20-%20Aida%20-%20Grand%20March.ogg" },
  { title: "Pomp and Circumstance", url: "https://commons.wikimedia.org/wiki/Special:FilePath/Elgar%20-%20Pomp%20and%20Circumstance%20March%20no.%201.ogg" },
  { title: "Jupiter", url: "https://commons.wikimedia.org/wiki/Special:FilePath/Holst%20-%20The%20Planets%2C%20Jupiter.ogg" },
  { title: "Habanera", url: "https://commons.wikimedia.org/wiki/Special:FilePath/Bizet-Carmen-Habanera.ogg" },
  { title: "Farandole", url: "https://commons.wikimedia.org/wiki/Special:FilePath/Bizet%20-%20L%27arlesienne%20suite%202%20-%20Farandole.ogg" },
  { title: "William Tell Finale", url: "https://commons.wikimedia.org/wiki/Special:FilePath/Rossini%20-%20William%20Tell%20Overture.ogg" },
  { title: "Barber of Seville", url: "https://commons.wikimedia.org/wiki/Special:FilePath/Rossini%20-%20The%20Barber%20of%20Seville%20Overture.ogg" },
  { title: "Rhapsody in Blue", url: "https://commons.wikimedia.org/wiki/Special:FilePath/Gershwin%20-%20Rhapsody%20in%20Blue%20(1924).ogg" },
  { title: "Adagio G minor", url: "https://commons.wikimedia.org/wiki/Special:FilePath/Albinoni%20-%20Adagio%20in%20G%20minor.ogg" },
  { title: "Devil's Trill", url: "https://commons.wikimedia.org/wiki/Special:FilePath/Tartini%20-%20Devils%20trill%20sonata.ogg" },
  { title: "Dido's Lament", url: "https://commons.wikimedia.org/wiki/Special:FilePath/Purcell%20Dido%27s%20Lament.ogg" },
  { title: "Steppes Central Asia", url: "https://commons.wikimedia.org/wiki/Special:FilePath/Borodin%20-%20In%20the%20Steppes%20of%20Central%20Asia.ogg" },
  { title: "Flight of Bumblebee", url: "https://commons.wikimedia.org/wiki/Special:FilePath/Rimsky-Korsakov_-_Flight_of_the_Bumblebee.ogg" },
  { title: "Scheherazade – III", url: "https://commons.wikimedia.org/wiki/Special:FilePath/Rimsky%20Korsakov%20Scheherazade%20Movement%203.ogg" },
  { title: "Can-Can", url: "https://commons.wikimedia.org/wiki/Special:FilePath/Offenbach%20-%20Orphee%20aux%20enfers%20-%20Can%20Can.ogg" },
  { title: "Barcarolle", url: "https://commons.wikimedia.org/wiki/Special:FilePath/Offenbach%20-%20Barcarolle.ogg" },
  { title: "Thaïs Méditation", url: "https://commons.wikimedia.org/wiki/Special:FilePath/Massenet%20-%20Thais%20-%20Meditation.ogg" },
  { title: "Fauré Pavane", url: "https://commons.wikimedia.org/wiki/Special:FilePath/Faur%C3%A9%20-%20Pavane.ogg" },
  { title: "Fauré Sicilienne", url: "https://commons.wikimedia.org/wiki/Special:FilePath/Faur%C3%A9%20-%20Sicilienne.ogg" },
  { title: "Caprice 24", url: "https://commons.wikimedia.org/wiki/Special:FilePath/Paganini%20-%20Caprice%20no%2024.ogg" },
];

async function checkUrl(url: string): Promise<{ status: number; contentType: string; finalUrl: string; ok: boolean }> {
  try {
    const res = await fetch(url, { method: "HEAD", redirect: "follow" });
    return {
      status: res.status,
      contentType: res.headers.get("content-type") || "unknown",
      finalUrl: res.url,
      ok: res.ok,
    };
  } catch (e: any) {
    return { status: 0, contentType: "error: " + e.message, finalUrl: url, ok: false };
  }
}

async function main() {
  console.log(`Validating ${TRACKS.length} audio URLs...\n`);

  const broken: { title: string; url: string; status: number; contentType: string }[] = [];
  const ogg: { title: string; url: string }[] = [];
  const working: { title: string; url: string; contentType: string }[] = [];

  // Process in batches of 5 to avoid overwhelming servers
  for (let i = 0; i < TRACKS.length; i += 5) {
    const batch = TRACKS.slice(i, i + 5);
    const results = await Promise.all(
      batch.map(async (track) => {
        const result = await checkUrl(track.url);
        return { track, result };
      })
    );

    for (const { track, result } of results) {
      if (!result.ok) {
        broken.push({ title: track.title, url: track.url, status: result.status, contentType: result.contentType });
        console.log(`  ✗ [${result.status}] ${track.title}`);
      } else {
        const isOgg = result.contentType.includes("ogg") || result.finalUrl.endsWith(".ogg") || result.finalUrl.endsWith(".oga");
        if (isOgg) {
          ogg.push({ title: track.title, url: track.url });
        }
        working.push({ title: track.title, url: track.url, contentType: result.contentType });
        console.log(`  ✓ ${track.title} (${result.contentType})`);
      }
    }

    // Small delay between batches
    await new Promise((r) => setTimeout(r, 500));
  }

  console.log(`\n=== SUMMARY ===`);
  console.log(`Total: ${TRACKS.length}`);
  console.log(`Working: ${working.length}`);
  console.log(`Broken: ${broken.length}`);
  console.log(`OGG format (Safari concern): ${ogg.length}`);

  if (broken.length > 0) {
    console.log(`\n=== BROKEN URLS ===`);
    for (const b of broken) {
      console.log(`  ${b.title}: HTTP ${b.status} (${b.contentType})`);
    }
  }

  console.log(`\n=== JSON ===`);
  console.log(JSON.stringify({ broken, ogg, workingCount: working.length }, null, 2));
}

main().catch(console.error);

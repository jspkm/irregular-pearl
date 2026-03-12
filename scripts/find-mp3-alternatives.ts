/**
 * Searches Wikimedia Commons for MP3 alternatives to our OGG tracks.
 * Usage: npx tsx scripts/find-mp3-alternatives.ts
 */

const SEARCH_DELAY_MS = 1500; // avoid rate limits

interface TrackSearch {
  title: string;
  searchTerms: string;
  currentFilename: string;
}

// Each track with search terms to find MP3 equivalents
const TRACKS: TrackSearch[] = [
  { title: "Für Elise", searchTerms: "Für Elise Beethoven", currentFilename: "For Elise (Für Elise) Beethoven JMC Han.ogg" },
  { title: "Symphony No. 5 – I", searchTerms: "Beethoven Symphony 5 allegro con brio", currentFilename: "Ludwig van Beethoven - symphony no. 5 in c minor, op. 67 - i. allegro con brio.ogg" },
  { title: "Symphony No. 5 – IV", searchTerms: "Beethoven Symphony 5 allegro iv", currentFilename: "Ludwig van Beethoven - symphony no. 5 in c minor, op. 67 - iv. allegro.ogg" },
  { title: "Moonlight Sonata – I", searchTerms: "Beethoven Moonlight Sonata adagio", currentFilename: "Beethoven Moonlight 1st movement.ogg" },
  { title: "Moonlight Sonata – III", searchTerms: "Beethoven Moonlight Sonata presto", currentFilename: "Beethoven Moonlight 3rd movement.ogg" },
  { title: "Pathétique – II", searchTerms: "Beethoven Pathetique adagio cantabile", currentFilename: "Beethoven, Sonata No. 8 in C Minor Pathetique, Op. 13 - II. Adagio cantabile.ogg" },
  { title: "32 Variations", searchTerms: "Beethoven 32 Variations C Minor WoO 80", currentFilename: "Beethoven - 32 Variations in C Minor, WoO 80.ogg" },
  { title: "Emperor Concerto", searchTerms: "Beethoven Piano Concerto 5 Emperor", currentFilename: "Beethoven Piano Concerto No 5 Movement 1.ogg" },
  { title: "Symphony No. 9 – Ode to Joy", searchTerms: "Beethoven Symphony 9 Ode Joy", currentFilename: "Ludwig van Beethoven - Symphonie 5 c-moll - 1. Allegro con brio.ogg" },
  { title: "Nocturne Op. 9 No. 2", searchTerms: "Chopin Nocturne E-flat Op 9 No 2", currentFilename: "Frederic Chopin - Nocturne Eb major Opus 9, number 2.ogg" },
  { title: "Ballade No. 1", searchTerms: "Chopin Ballade G minor Op 23", currentFilename: "Frederic Chopin - ballade no. 1 in g minor, op. 23.ogg" },
  { title: "Étude Op. 10 No. 3", searchTerms: "Chopin Etude Op 10 No 3", currentFilename: "Frederic_Chopin_-_Opus_10_-_Twelve_Grand_Etudes_-_E_Major.ogg" },
  { title: "Minute Waltz", searchTerms: "Chopin Minute Waltz Op 64", currentFilename: "Chopin Minute Waltz.ogg" },
  { title: "Raindrop Prelude", searchTerms: "Chopin Prelude Op 28 No 15 Raindrop", currentFilename: "Chopin_Prelude_Op_28_N_15_Giorgi_Latsabidze_performs.ogg" },
  { title: "Heroic Polonaise", searchTerms: "Chopin Polonaise A-flat Op 53", currentFilename: "Chopin_-_Polonaise_Op._53.oga" },
  { title: "Fantaisie-Impromptu", searchTerms: "Chopin Fantaisie Impromptu Op 66", currentFilename: "Frederic Chopin - Fantasy Impromptu Opus 66.ogg" },
  { title: "Nocturne C# minor posth", searchTerms: "Chopin Nocturne C-sharp minor posthumous", currentFilename: "Chopin, Nocturne in C-sharp minor, Op. Posth.ogg" },
  { title: "Scherzo No. 2", searchTerms: "Chopin Scherzo No 2 B-flat minor Op 31", currentFilename: "Frederic Chopin - scherzo no. 2 in b flat minor, op. 31.ogg" },
  { title: "Winter Wind", searchTerms: "Chopin Etude Op 25 No 11 Winter Wind", currentFilename: "Chopin_op25_No_11.ogg" },
  { title: "Clair de lune", searchTerms: "Debussy Clair de lune Suite bergamasque", currentFilename: "Clair de lune (Claude Debussy) Suite bergamasque.ogg" },
  { title: "Arabesque No. 1", searchTerms: "Debussy Arabesque No 1 E major", currentFilename: "Debussy - Arabesque No. 1 in E major.ogg" },
  { title: "Rêverie", searchTerms: "Debussy Rêverie Reverie", currentFilename: "Reverie.ogg" },
  { title: "Prélude à l'après-midi", searchTerms: "Debussy Prélude après-midi faune", currentFilename: "Claude Debussy - Prélude à l'après-midi d'un faune.ogg" },
  { title: "Toccata and Fugue", searchTerms: "Bach Toccata Fugue D minor BWV 565", currentFilename: "J.S. Bach - Toccata and Fugue in D minor BWV 565.ogg" },
  { title: "Air on G String", searchTerms: "Bach Air G String", currentFilename: "Air (Bach).ogg" },
  { title: "Cello Suite No. 1", searchTerms: "Bach Cello Suite 1 G major Prelude BWV 1007", currentFilename: "Bach - Cello Suite no. 1 in G major, BWV 1007 - I. Prélude.ogg" },
  { title: "Brandenburg 3 – I", searchTerms: "Bach Brandenburg Concerto 3 Allegro", currentFilename: "Bach - Brandenburg Concerto No. 3 - 1. Allegro.ogg" },
  { title: "WTC Prelude 1", searchTerms: "Bach Well-Tempered Clavier Prelude C major BWV 846", currentFilename: "Kimiko Ishizaka - Bach - Well-Tempered Clavier, Book 1 - 01 Prelude No. 1 in C major, BWV 846.ogg" },
  { title: "Badinerie", searchTerms: "Bach Badinerie Orchestral Suite B minor BWV 1067", currentFilename: "JS Bach - Orchestral Suite in B minor BWV 1067 - 7 Badinerie.ogg" },
  { title: "Goldberg Aria", searchTerms: "Bach Goldberg Variations Aria BWV 988", currentFilename: "J.S.Bach - Goldberg Variations - 01 - Aria.ogg" },
  { title: "Passacaglia BWV 582", searchTerms: "Bach Passacaglia Fugue C minor BWV 582", currentFilename: "J.S. Bach - Passacaglia and Fugue in C minor, BWV 582.ogg" },
  { title: "Chaconne", searchTerms: "Bach Chaconne Partita 2 D minor BWV 1004", currentFilename: "Johann Sebastian Bach - Partita for Violin no. 2, BWV 1004 - V - Chaconne.ogg" },
  { title: "Eine kleine – I", searchTerms: "Mozart Eine kleine Nachtmusik Allegro", currentFilename: "Mozart - Eine kleine Nachtmusik - 1. Allegro.ogg" },
  { title: "Turkish March", searchTerms: "Mozart Turkish March Rondo alla Turca", currentFilename: "Mozart - Piano Sonata No. 11 in A major - III. Allegro (Turkish March).ogg" },
  { title: "Symphony 40 – I", searchTerms: "Mozart Symphony 40 G minor Molto allegro", currentFilename: "Mozart - Symphony No. 40 in G minor, K. 550 - I. Molto allegro.ogg" },
  { title: "Lacrimosa", searchTerms: "Mozart Requiem Lacrimosa", currentFilename: "W. A. Mozart - Requiem - 8. Lacrimosa (Herbert von Karajan, Wiener Philharmoniker, Wiener Singverein, 1960).ogg" },
  { title: "Piano Concerto 21 – II", searchTerms: "Mozart Piano Concerto 21 Andante", currentFilename: "Mozart Piano Concerto No 21 - II - Andante.ogg" },
  { title: "Figaro Overture", searchTerms: "Mozart Marriage Figaro Overture", currentFilename: "Le nozze di Figaro overture - Vienna Philharmonic - Bruno Walter (1937).ogg" },
  { title: "Eine kleine – II", searchTerms: "Mozart Eine kleine Nachtmusik Romanze", currentFilename: "Mozart - Eine kleine Nachtmusik - 2. Romanze.ogg" },
  { title: "Sonata K545 – I", searchTerms: "Mozart Piano Sonata 16 C major K 545 Allegro", currentFilename: "Mozart - Piano Sonata No. 16 in C major - I. Allegro.ogg" },
  { title: "Swan Lake", searchTerms: "Tchaikovsky Swan Lake Scene", currentFilename: "Pyotr Ilyich Tchaikovsky - Swan Lake - 01 - Scene.ogg" },
  { title: "Sugar Plum Fairy", searchTerms: "Tchaikovsky Nutcracker Sugar Plum Fairy", currentFilename: "Tchaikovsky- The Nutcracker - Act II - No.14c - Variation 2 - Dance of the Sugar-Plum Fairy.ogg" },
  { title: "Waltz of Flowers", searchTerms: "Tchaikovsky Nutcracker Waltz Flowers", currentFilename: "Tchaikovsky- The Nutcracker - Act II - No.13 - Waltz of the Flowers.ogg" },
  { title: "1812 Overture", searchTerms: "Tchaikovsky 1812 Overture", currentFilename: "Pyotr Ilyich Tchaikovsky - 1812 overture.ogg" },
  { title: "Tchaikovsky Piano 1 – I", searchTerms: "Tchaikovsky Piano Concerto 1 B-flat minor", currentFilename: "Tchaikovsky-2 Piano concerto Nro1 mov1.ogg" },
  { title: "Sleeping Beauty Waltz", searchTerms: "Tchaikovsky Sleeping Beauty Waltz", currentFilename: "Tchaikovsky - The Sleeping Beauty - Waltz.ogg" },
  { title: "Spring – I", searchTerms: "Vivaldi Four Seasons Spring Allegro", currentFilename: "01 - Vivaldi Spring mvt 1 Allegro - John Harrison violin.ogg" },
  { title: "Summer – III", searchTerms: "Vivaldi Four Seasons Summer Presto", currentFilename: "06 - Vivaldi Summer mvt 3 Presto - John Harrison violin.ogg" },
  { title: "Autumn – I", searchTerms: "Vivaldi Four Seasons Autumn Allegro", currentFilename: "07 - Vivaldi Autumn mvt 1 Allegro - John Harrison violin.ogg" },
  { title: "Winter – II", searchTerms: "Vivaldi Four Seasons Winter Largo", currentFilename: "11 - Vivaldi Winter mvt 2 Largo - John Harrison violin.ogg" },
  { title: "Winter – I", searchTerms: "Vivaldi Four Seasons Winter Allegro non molto", currentFilename: "10 - Vivaldi Winter mvt 1 Allegro non molto - John Harrison violin.ogg" },
  { title: "Hungarian Rhapsody 2", searchTerms: "Liszt Hungarian Rhapsody 2", currentFilename: "Hungarian Rhapsody No 2.ogg" },
  { title: "Liebestraum 3", searchTerms: "Liszt Liebestraum No 3 A-flat", currentFilename: "Franz Liszt - Liebestraum, Ab Major.ogg" },
  { title: "La Campanella", searchTerms: "Liszt La Campanella Paganini", currentFilename: "Liszt-La Campanella-Greiss.ogg" },
  { title: "Consolation 3", searchTerms: "Liszt Consolation 3 D-flat", currentFilename: "Consolation No. 3 in D-flat major.ogg" },
  { title: "Ave Maria Schubert", searchTerms: "Schubert Ave Maria", currentFilename: "Franz Schubert - Ave Maria.ogg" },
  { title: "Serenade Schubert", searchTerms: "Schubert Serenade Ständchen", currentFilename: "Ständchen (Schubert)-Serenade D957 No.4, Player Jason, Han.ogg" },
  { title: "Trout Quintet – IV", searchTerms: "Schubert Trout Quintet theme variations", currentFilename: "Schubert - Piano Quintet - The Trout - IV. Theme and Variations.ogg" },
  { title: "Impromptu Op. 90 No. 3", searchTerms: "Schubert Impromptu Op 90 No 3", currentFilename: "Schubert Impromptu op. 90 n. 3.ogg" },
  { title: "Rach Piano Concerto 2 – I", searchTerms: "Rachmaninoff Piano Concerto 2 Moderato", currentFilename: "Rachmaninoff - Piano Concerto No. 2, Opus 18 - I. Moderato.ogg" },
  { title: "Rach Prelude C# minor", searchTerms: "Rachmaninoff Prelude C-sharp minor Op 3", currentFilename: "Sergei Rachmaninoff performs Rachmaninoff's Prelude in C sharp minor, Op. 3.ogg" },
  { title: "Vocalise", searchTerms: "Rachmaninoff Vocalise", currentFilename: "Rachmaninov - Vocalise.ogg" },
  { title: "Rach Rhapsody Var 18", searchTerms: "Rachmaninoff Rhapsody Paganini Variation 18", currentFilename: "Rachmaninoff - Rhapsody on a Theme of Paganini, Variation 18.ogg" },
  { title: "New World – II", searchTerms: "Dvorak Symphony 9 New World Largo", currentFilename: "Dvorak - Symphony No.9 - 2 - Largo.ogg" },
  { title: "New World – IV", searchTerms: "Dvorak Symphony 9 New World Allegro con fuoco", currentFilename: "Antonin Dvorak - symphony no. 9 in e minor 'from the new world', op. 95 - iv. allegro con fuoco.ogg" },
  { title: "Humoresque", searchTerms: "Dvorak Humoresque Op 101 No 7", currentFilename: "Dvořák - Humoresque Op. 101 No. 7.ogg" },
  { title: "Morning Mood", searchTerms: "Grieg Morning Mood Peer Gynt", currentFilename: "Henrik Ibsen, Edvard Grieg - Morgenstemning (Morning Mood).ogg" },
  { title: "Mountain King", searchTerms: "Grieg Hall Mountain King Peer Gynt", currentFilename: "In the Hall of the Mountain King.ogg" },
  { title: "Grieg Piano Concerto – I", searchTerms: "Grieg Piano Concerto A minor Op 16", currentFilename: "Edvard Grieg - piano concerto in a minor, op. 16 - i. allegro molto moderato.ogg" },
  { title: "Gymnopédie 1", searchTerms: "Satie Gymnopédie 1", currentFilename: "Erik Satie - gymnopedies - la 1 ere. lent et douloureux.ogg" },
  { title: "Gymnopédie 3", searchTerms: "Satie Gymnopédie 3", currentFilename: "Gymnopédie no.3.ogg" },
  { title: "Gnossienne 1", searchTerms: "Satie Gnossienne 1", currentFilename: "Satie Gnossienne no. 1.ogg" },
  { title: "Hungarian Dance 5", searchTerms: "Brahms Hungarian Dance 5", currentFilename: "Brahms - Hungarian Dance No. 5.ogg" },
  { title: "Brahms Lullaby", searchTerms: "Brahms Lullaby Wiegenlied", currentFilename: "Brahms - Wiegenlied.ogg" },
  { title: "Brahms Symphony 3 – III", searchTerms: "Brahms Symphony 3 Poco allegretto", currentFilename: "Brahms Symphony 3 Movement 3.ogg" },
  { title: "Brahms Intermezzo", searchTerms: "Brahms Intermezzo A major Op 118 No 2", currentFilename: "Brahms - Intermezzo in A major, Op.118, No.2.ogg" },
  { title: "Alla Hornpipe", searchTerms: "Handel Water Music Alla Hornpipe", currentFilename: "Georg_Friedrich_Haendel_-_Water_Music_Suite_No._2_-_05_-_Alla_Hornpipe.ogg" },
  { title: "Hallelujah Chorus", searchTerms: "Handel Messiah Hallelujah", currentFilename: "Handel - Messiah - Hallelujah.ogg" },
  { title: "Sarabande D minor", searchTerms: "Handel Sarabande D minor", currentFilename: "Handel - Sarabande in D minor.ogg" },
  { title: "Wedding March", searchTerms: "Mendelssohn Wedding March", currentFilename: "Mendelssohn - Wedding March.ogg" },
  { title: "Mendelssohn Violin – I", searchTerms: "Mendelssohn Violin Concerto E minor", currentFilename: "Mendelssohn violin concerto e-minor 1st movement.ogg" },
  { title: "Blue Danube", searchTerms: "Strauss Blue Danube Waltz", currentFilename: "Strauss Blue Danube.ogg" },
  { title: "Radetzky March", searchTerms: "Strauss Radetzky March", currentFilename: "Radetzky March.ogg" },
  { title: "Canon in D", searchTerms: "Pachelbel Canon D major", currentFilename: "Pachelbel - Canon in D.ogg" },
  { title: "The Swan", searchTerms: "Saint-Saëns Swan Carnival Animals", currentFilename: "Saint-Saëns - The Swan.ogg" },
  { title: "Danse macabre", searchTerms: "Saint-Saëns Danse macabre", currentFilename: "Saint-Saens - Danse Macabre.ogg" },
  { title: "Great Gate of Kiev", searchTerms: "Mussorgsky Pictures Exhibition Great Gate Kiev", currentFilename: "Mussorgsky - Pictures at an Exhibition - The Great Gate of Kiev.ogg" },
  { title: "Night on Bald Mountain", searchTerms: "Mussorgsky Night Bald Mountain", currentFilename: "Mussorgsky - Night on Bald Mountain.ogg" },
  { title: "Boléro", searchTerms: "Ravel Bolero", currentFilename: "Ravel Bolero.ogg" },
  { title: "Pavane Ravel", searchTerms: "Ravel Pavane infante défunte", currentFilename: "Ravel - Pavane pour une infante defunte.ogg" },
  { title: "Träumerei", searchTerms: "Schumann Träumerei Kinderszenen", currentFilename: "Schumann - Träumerei.ogg" },
  { title: "Schumann Piano Concerto – I", searchTerms: "Schumann Piano Concerto A minor", currentFilename: "Schumann-PianoConcerto-1.ogg" },
  { title: "Ride of Valkyries", searchTerms: "Wagner Ride Valkyries", currentFilename: "Richard Wagner - Ride of the Valkyries.ogg" },
  { title: "Bridal Chorus", searchTerms: "Wagner Bridal Chorus Lohengrin", currentFilename: "Wagner - Bridal Chorus.ogg" },
  { title: "La Traviata Prelude", searchTerms: "Verdi La Traviata Prelude", currentFilename: "Verdi - La Traviata - Prelude.ogg" },
  { title: "Aida March", searchTerms: "Verdi Aida Triumphal March", currentFilename: "Verdi - Aida - Grand March.ogg" },
  { title: "Pomp and Circumstance", searchTerms: "Elgar Pomp Circumstance March", currentFilename: "Elgar - Pomp and Circumstance March no. 1.ogg" },
  { title: "Jupiter", searchTerms: "Holst Planets Jupiter", currentFilename: "Holst - The Planets, Jupiter.ogg" },
  { title: "Habanera", searchTerms: "Bizet Carmen Habanera", currentFilename: "Bizet-Carmen-Habanera.ogg" },
  { title: "Farandole", searchTerms: "Bizet L'Arlésienne Farandole", currentFilename: "Bizet - L'arlesienne suite 2 - Farandole.ogg" },
  { title: "William Tell Finale", searchTerms: "Rossini William Tell Overture", currentFilename: "Rossini - William Tell Overture.ogg" },
  { title: "Barber of Seville", searchTerms: "Rossini Barber Seville Overture", currentFilename: "Rossini - The Barber of Seville Overture.ogg" },
  { title: "Rhapsody in Blue", searchTerms: "Gershwin Rhapsody Blue", currentFilename: "Gershwin - Rhapsody in Blue (1924).ogg" },
  { title: "Adagio G minor", searchTerms: "Albinoni Adagio G minor", currentFilename: "Albinoni - Adagio in G minor.ogg" },
  { title: "Devil's Trill", searchTerms: "Tartini Devil's Trill Sonata", currentFilename: "Tartini - Devils trill sonata.ogg" },
  { title: "Dido's Lament", searchTerms: "Purcell Dido's Lament", currentFilename: "Purcell Dido's Lament.ogg" },
  { title: "Steppes Central Asia", searchTerms: "Borodin Steppes Central Asia", currentFilename: "Borodin - In the Steppes of Central Asia.ogg" },
  { title: "Flight Bumblebee", searchTerms: "Rimsky-Korsakov Flight Bumblebee", currentFilename: "Rimsky-Korsakov_-_Flight_of_the_Bumblebee.ogg" },
  { title: "Scheherazade – III", searchTerms: "Rimsky-Korsakov Scheherazade", currentFilename: "Rimsky Korsakov Scheherazade Movement 3.ogg" },
  { title: "Can-Can", searchTerms: "Offenbach Orpheus Underworld Can-Can galop", currentFilename: "Offenbach - Orphee aux enfers - Can Can.ogg" },
  { title: "Barcarolle", searchTerms: "Offenbach Tales Hoffmann Barcarolle", currentFilename: "Offenbach - Barcarolle.ogg" },
  { title: "Thaïs Méditation", searchTerms: "Massenet Thaïs Meditation", currentFilename: "Massenet - Thais - Meditation.ogg" },
  { title: "Fauré Pavane", searchTerms: "Fauré Pavane Op 50", currentFilename: "Fauré - Pavane.ogg" },
  { title: "Fauré Sicilienne", searchTerms: "Fauré Sicilienne Op 78", currentFilename: "Fauré - Sicilienne.ogg" },
  { title: "Caprice 24", searchTerms: "Paganini Caprice 24 A minor", currentFilename: "Paganini - Caprice no 24.ogg" },
];

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function searchWikimediaForMp3(query: string): Promise<{ filename: string; url: string } | null> {
  const apiUrl = `https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query + " filetype:audio")}&srnamespace=6&srlimit=10&format=json`;

  try {
    const res = await fetch(apiUrl);
    if (!res.ok) return null;
    const data = await res.json();
    const results = data?.query?.search || [];

    // Look for MP3 files first, then FLAC, then WAV
    for (const preferred of [".mp3", ".flac", ".wav"]) {
      for (const r of results) {
        const title: string = r.title;
        if (title.toLowerCase().endsWith(preferred)) {
          const filename = title.replace(/^File:/, "");
          return {
            filename,
            url: `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(filename)}`,
          };
        }
      }
    }
    return null;
  } catch {
    return null;
  }
}

async function main() {
  console.log(`Searching Wikimedia Commons for MP3 alternatives for ${TRACKS.length} tracks...\n`);

  const found: { title: string; currentFilename: string; mp3Filename: string; mp3Url: string }[] = [];
  const notFound: string[] = [];

  for (let i = 0; i < TRACKS.length; i++) {
    const track = TRACKS[i];
    process.stdout.write(`[${i + 1}/${TRACKS.length}] ${track.title}... `);

    const result = await searchWikimediaForMp3(track.searchTerms);

    if (result) {
      console.log(`FOUND: ${result.filename}`);
      found.push({
        title: track.title,
        currentFilename: track.currentFilename,
        mp3Filename: result.filename,
        mp3Url: result.url,
      });
    } else {
      console.log("no MP3 found");
      notFound.push(track.title);
    }

    await delay(SEARCH_DELAY_MS);
  }

  console.log(`\n\n=== SUMMARY ===`);
  console.log(`Found MP3: ${found.length}`);
  console.log(`No MP3: ${notFound.length}`);

  if (found.length > 0) {
    console.log(`\n=== MP3 ALTERNATIVES ===`);
    for (const f of found) {
      console.log(`\n  ${f.title}:`);
      console.log(`    OGG: ${f.currentFilename}`);
      console.log(`    MP3: ${f.mp3Filename}`);
    }
  }

  if (notFound.length > 0) {
    console.log(`\n=== NO MP3 FOUND ===`);
    for (const t of notFound) {
      console.log(`  - ${t}`);
    }
  }

  // Output JSON for easy processing
  console.log(`\n=== JSON OUTPUT ===`);
  console.log(JSON.stringify({ found, notFound }, null, 2));
}

main().catch(console.error);

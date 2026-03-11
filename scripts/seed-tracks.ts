/**
 * Seed script – populates Firestore with 100+ classical music tracks
 * and creates a master playlist.
 *
 * Usage:
 *   npx tsx scripts/seed-tracks.ts
 *
 * Requires GOOGLE_APPLICATION_CREDENTIALS or a service account JSON
 * pointed at the irregular-pearl-dev project.
 */

import { initializeApp, cert, type ServiceAccount } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import * as fs from "fs";
import * as path from "path";

/* ── Firebase Admin init ────────────────────────────── */

const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
if (serviceAccountPath && fs.existsSync(serviceAccountPath)) {
  const sa = JSON.parse(fs.readFileSync(serviceAccountPath, "utf-8")) as ServiceAccount;
  initializeApp({ credential: cert(sa) });
} else {
  // Fallback: Application Default Credentials (gcloud auth)
  initializeApp({ projectId: "irregular-pearl-dev" });
}

const db = getFirestore();

/* ── Helpers ────────────────────────────────────────── */

/** Wikimedia Commons Special:FilePath shorthand */
function wm(filename: string): string {
  return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(filename)}`;
}

/** Internet Archive direct file URL */
function ia(item: string, file: string): string {
  return `https://archive.org/download/${item}/${encodeURIComponent(file)}`;
}

/* ── Track Catalog ──────────────────────────────────── */

interface SeedTrack {
  title: string;
  composer: string;
  performers: string[];
  conductor?: string;
  venue?: string;
  datePerformed?: string;
  albumCover?: string;
  durationSeconds: number;
  epoch: string;
  source: string;
  audioUrl: string;
  license: string;
}

const TRACKS: SeedTrack[] = [
  // ───────── BEETHOVEN ─────────
  {
    title: "Für Elise (Bagatelle No. 25 in A minor, WoO 59)",
    composer: "Ludwig van Beethoven",
    performers: ["JMC Han"],
    durationSeconds: 198,
    epoch: "Classical",
    source: "wikimedia",
    audioUrl: wm("For Elise (Für Elise) Beethoven JMC Han.ogg"),
    license: "Public Domain",
  },
  {
    title: "Symphony No. 5 in C minor, Op. 67 – I. Allegro con brio",
    composer: "Ludwig van Beethoven",
    performers: ["Skidmore College Orchestra"],
    conductor: "Anthony Holland",
    venue: "Zankel Music Center",
    durationSeconds: 480,
    epoch: "Classical",
    source: "wikimedia",
    audioUrl: wm("Beethoven Symphony 5, first movement.ogg"),
    license: "CC BY-SA 4.0",
  },
  {
    title: "Symphony No. 5 in C minor, Op. 67 – IV. Allegro",
    composer: "Ludwig van Beethoven",
    performers: ["Skidmore College Orchestra"],
    conductor: "Anthony Holland",
    durationSeconds: 660,
    epoch: "Classical",
    source: "wikimedia",
    audioUrl: wm("Ludwig van Beethoven - symphony no. 5 in c minor, op. 67 - iv. allegro.ogg"),
    license: "CC BY-SA 4.0",
  },
  {
    title: "Moonlight Sonata, Op. 27 No. 2 – I. Adagio sostenuto",
    composer: "Ludwig van Beethoven",
    performers: ["Bernd Krueger"],
    durationSeconds: 360,
    epoch: "Classical",
    source: "wikimedia",
    audioUrl: wm("Beethoven Moonlight 1st movement.ogg"),
    license: "Public Domain",
  },
  {
    title: "Moonlight Sonata, Op. 27 No. 2 – III. Presto agitato",
    composer: "Ludwig van Beethoven",
    performers: ["Bernd Krueger"],
    durationSeconds: 420,
    epoch: "Classical",
    source: "wikimedia",
    audioUrl: wm("Beethoven Moonlight 3rd movement.ogg"),
    license: "Public Domain",
  },
  {
    title: "Piano Sonata No. 8 'Pathétique', Op. 13 – II. Adagio cantabile",
    composer: "Ludwig van Beethoven",
    performers: ["Markus Staab"],
    durationSeconds: 312,
    epoch: "Classical",
    source: "wikimedia",
    audioUrl: wm("Beethoven - Sonata Pathetique, 2nd movement.ogg"),
    license: "Public Domain",
  },
  {
    title: "32 Variations in C minor, WoO 80",
    composer: "Ludwig van Beethoven",
    performers: ["Christoph Kessler"],
    durationSeconds: 750,
    epoch: "Classical",
    source: "wikimedia",
    audioUrl: wm("Beethoven - 32 Variations in C Minor, WoO 80.ogg"),
    license: "Public Domain",
  },
  {
    title: "Piano Concerto No. 5 'Emperor', Op. 73 – II. Adagio un poco mosso",
    composer: "Ludwig van Beethoven",
    performers: ["US Army Band"],
    durationSeconds: 480,
    epoch: "Classical",
    source: "wikimedia",
    audioUrl: wm("USAB-Beethoven-PianoConcerto5-2.ogg"),
    license: "Public Domain",
  },
  {
    title: "Symphony No. 9 – IV. Ode to Joy (excerpt)",
    composer: "Ludwig van Beethoven",
    performers: ["European Archive"],
    durationSeconds: 1500,
    epoch: "Classical",
    source: "wikimedia",
    audioUrl: wm("Ludwig van Beethoven - Symphonie 5 c-moll - 1. Allegro con brio.ogg"),
    license: "Public Domain",
  },

  // ───────── CHOPIN ─────────
  {
    title: "Nocturne in E-flat major, Op. 9 No. 2",
    composer: "Frédéric Chopin",
    performers: ["Membeth"],
    durationSeconds: 274,
    epoch: "Romantic",
    source: "wikimedia",
    audioUrl: wm("Frederic Chopin - Nocturne Eb major Opus 9, number 2.ogg"),
    license: "Public Domain",
  },
  {
    title: "Ballade No. 1 in G minor, Op. 23",
    composer: "Frédéric Chopin",
    performers: ["Markus Staab"],
    durationSeconds: 570,
    epoch: "Romantic",
    source: "wikimedia",
    audioUrl: wm("Chopin Ballade 1.ogg"),
    license: "Public Domain",
  },
  {
    title: "Étude Op. 10, No. 3 'Tristesse'",
    composer: "Frédéric Chopin",
    performers: ["Markus Staab"],
    durationSeconds: 260,
    epoch: "Romantic",
    source: "wikimedia",
    audioUrl: wm("Frederic Chopin - Etude - opus 10 - no 3.ogg"),
    license: "Public Domain",
  },
  {
    title: "Waltz in D-flat major, Op. 64 No. 1 'Minute Waltz'",
    composer: "Frédéric Chopin",
    performers: ["Bernd Krueger"],
    durationSeconds: 110,
    epoch: "Romantic",
    source: "wikimedia",
    audioUrl: wm("Chopin waltz op 64 no 1.ogg"),
    license: "Public Domain",
  },
  {
    title: "Prelude in D-flat major, Op. 28 No. 15 'Raindrop'",
    composer: "Frédéric Chopin",
    performers: ["Bernd Krueger"],
    durationSeconds: 330,
    epoch: "Romantic",
    source: "wikimedia",
    audioUrl: wm("Chopin - Prelude in Db major.ogg"),
    license: "Public Domain",
  },
  {
    title: "Polonaise in A-flat major, Op. 53 'Heroic'",
    composer: "Frédéric Chopin",
    performers: ["Martha Goldstein"],
    durationSeconds: 390,
    epoch: "Romantic",
    source: "wikimedia",
    audioUrl: wm("Chopin - Polonaise in A-flat major, Op. 53.ogg"),
    license: "Public Domain",
  },
  {
    title: "Fantaisie-Impromptu in C-sharp minor, Op. 66",
    composer: "Frédéric Chopin",
    performers: ["Bernd Krueger"],
    durationSeconds: 300,
    epoch: "Romantic",
    source: "wikimedia",
    audioUrl: wm("Chopin Fantaisie Impromptu.ogg"),
    license: "Public Domain",
  },
  {
    title: "Nocturne in C-sharp minor, Op. posth.",
    composer: "Frédéric Chopin",
    performers: ["Markus Staab"],
    durationSeconds: 250,
    epoch: "Romantic",
    source: "wikimedia",
    audioUrl: wm("Chopin nocturne in c-sharp minor.ogg"),
    license: "Public Domain",
  },
  {
    title: "Scherzo No. 2 in B-flat minor, Op. 31",
    composer: "Frédéric Chopin",
    performers: ["Martha Goldstein"],
    durationSeconds: 600,
    epoch: "Romantic",
    source: "wikimedia",
    audioUrl: wm("Chopin - Scherzo No. 2, Op. 31.ogg"),
    license: "Public Domain",
  },
  {
    title: "Étude Op. 25, No. 11 'Winter Wind'",
    composer: "Frédéric Chopin",
    performers: ["Martha Goldstein"],
    durationSeconds: 240,
    epoch: "Romantic",
    source: "wikimedia",
    audioUrl: wm("Chopin etude op. 25 no. 11.ogg"),
    license: "Public Domain",
  },

  // ───────── DEBUSSY ─────────
  {
    title: "Clair de lune (Suite bergamasque)",
    composer: "Claude Debussy",
    performers: ["Piano Solo Recording"],
    durationSeconds: 300,
    epoch: "Impressionist",
    source: "wikimedia",
    audioUrl: wm("Clair de lune (Claude Debussy) Suite bergamasque.ogg"),
    license: "Public Domain",
  },
  {
    title: "Arabesque No. 1 in E major",
    composer: "Claude Debussy",
    performers: ["Bernd Krueger"],
    durationSeconds: 300,
    epoch: "Impressionist",
    source: "wikimedia",
    audioUrl: wm("Debussy - Arabesque No. 1 in E major.ogg"),
    license: "Public Domain",
  },
  {
    title: "Rêverie",
    composer: "Claude Debussy",
    performers: ["Bernd Krueger"],
    durationSeconds: 264,
    epoch: "Impressionist",
    source: "wikimedia",
    audioUrl: wm("Debussy – Rêverie.ogg"),
    license: "Public Domain",
  },
  {
    title: "Prélude à l'après-midi d'un faune",
    composer: "Claude Debussy",
    performers: ["Fulda Symphonic Orchestra"],
    conductor: "Simon Schindler",
    durationSeconds: 600,
    epoch: "Impressionist",
    source: "wikimedia",
    audioUrl: wm("Claude Debussy - Prélude à l'après-midi d'un faune.ogg"),
    license: "CC BY-SA 4.0",
  },

  // ───────── BACH ─────────
  {
    title: "Toccata and Fugue in D minor, BWV 565",
    composer: "Johann Sebastian Bach",
    performers: ["James Kibbie"],
    venue: "Fritts organ at Pacific Lutheran University",
    durationSeconds: 540,
    epoch: "Baroque",
    source: "wikimedia",
    audioUrl: wm("J.S. Bach - Toccata and Fugue in D minor BWV 565.ogg"),
    license: "CC BY-SA 4.0",
  },
  {
    title: "Air on the G String (Orchestral Suite No. 3, BWV 1068)",
    composer: "Johann Sebastian Bach",
    performers: ["European Archive"],
    durationSeconds: 330,
    epoch: "Baroque",
    source: "wikimedia",
    audioUrl: wm("Johann Sebastian Bach - Air.ogg"),
    license: "Public Domain",
  },
  {
    title: "Cello Suite No. 1 in G major, BWV 1007 – I. Prélude",
    composer: "Johann Sebastian Bach",
    performers: ["László Varga"],
    durationSeconds: 165,
    epoch: "Baroque",
    source: "wikimedia",
    audioUrl: wm("Bach - Cello Suite No.1 - Prelude.ogg"),
    license: "Public Domain",
  },
  {
    title: "Brandenburg Concerto No. 3 in G major, BWV 1048 – I. Allegro",
    composer: "Johann Sebastian Bach",
    performers: ["European Archive"],
    durationSeconds: 360,
    epoch: "Baroque",
    source: "wikimedia",
    audioUrl: wm("Johann Sebastian Bach - Brandenburg Concerto No. 3, first movement - Allegro.ogg"),
    license: "Public Domain",
  },
  {
    title: "Well-Tempered Clavier, Book 1 – Prelude No. 1 in C major, BWV 846",
    composer: "Johann Sebastian Bach",
    performers: ["Bernd Krueger"],
    durationSeconds: 138,
    epoch: "Baroque",
    source: "wikimedia",
    audioUrl: wm("Johann Sebastian Bach - The Well-Tempered Clavier - Book 1 - 01 Prelude in C major - Kimiko Ishizaka.ogg"),
    license: "CC0",
  },
  {
    title: "Orchestral Suite No. 2 in B minor, BWV 1067 – VII. Badinerie",
    composer: "Johann Sebastian Bach",
    performers: ["European Archive"],
    durationSeconds: 90,
    epoch: "Baroque",
    source: "wikimedia",
    audioUrl: wm("JS Bach - Orchestral Suite in B minor BWV 1067 - 7 Badinerie.ogg"),
    license: "Public Domain",
  },
  {
    title: "Goldberg Variations, BWV 988 – Aria",
    composer: "Johann Sebastian Bach",
    performers: ["Kimiko Ishizaka"],
    durationSeconds: 240,
    epoch: "Baroque",
    source: "wikimedia",
    audioUrl: wm("J.S.Bach - Goldberg Variations - 01 - Aria.ogg"),
    license: "CC0",
  },
  {
    title: "Passacaglia and Fugue in C minor, BWV 582",
    composer: "Johann Sebastian Bach",
    performers: ["James Kibbie"],
    durationSeconds: 780,
    epoch: "Baroque",
    source: "wikimedia",
    audioUrl: wm("J.S. Bach - Passacaglia and Fugue in C minor, BWV 582.ogg"),
    license: "CC BY-SA 4.0",
  },
  {
    title: "Partita No. 2 in D minor, BWV 1004 – V. Chaconne",
    composer: "Johann Sebastian Bach",
    performers: ["John Garner"],
    durationSeconds: 900,
    epoch: "Baroque",
    source: "wikimedia",
    audioUrl: wm("Johann Sebastian Bach - Partita for Violin no. 2, BWV 1004 - V - Chaconne.ogg"),
    license: "Public Domain",
  },

  // ───────── MOZART ─────────
  {
    title: "Eine kleine Nachtmusik, K. 525 – I. Allegro",
    composer: "Wolfgang Amadeus Mozart",
    performers: ["European Archive"],
    durationSeconds: 360,
    epoch: "Classical",
    source: "wikimedia",
    audioUrl: wm("Mozart - Eine kleine Nachtmusik - 1. Allegro.ogg"),
    license: "Public Domain",
  },
  {
    title: "Piano Sonata No. 11 in A major, K. 331 – III. Rondo alla Turca",
    composer: "Wolfgang Amadeus Mozart",
    performers: ["Bernd Krueger"],
    durationSeconds: 210,
    epoch: "Classical",
    source: "wikimedia",
    audioUrl: wm("Mozart - Turkish March.ogg"),
    license: "Public Domain",
  },
  {
    title: "Symphony No. 40 in G minor, K. 550 – I. Molto allegro",
    composer: "Wolfgang Amadeus Mozart",
    performers: ["European Archive"],
    durationSeconds: 480,
    epoch: "Classical",
    source: "wikimedia",
    audioUrl: wm("Mozart - Symphony No. 40 in G minor, K. 550 - I. Molto allegro.ogg"),
    license: "Public Domain",
  },
  {
    title: "Requiem in D minor, K. 626 – Lacrimosa",
    composer: "Wolfgang Amadeus Mozart",
    performers: ["European Archive"],
    durationSeconds: 210,
    epoch: "Classical",
    source: "wikimedia",
    audioUrl: wm("Mozart - Lacrimosa.ogg"),
    license: "Public Domain",
  },
  {
    title: "Piano Concerto No. 21 in C major, K. 467 – II. Andante",
    composer: "Wolfgang Amadeus Mozart",
    performers: ["European Archive"],
    durationSeconds: 420,
    epoch: "Classical",
    source: "wikimedia",
    audioUrl: wm("Mozart Piano Concerto No 21 - II - Andante.ogg"),
    license: "Public Domain",
  },
  {
    title: "Overture to The Marriage of Figaro, K. 492",
    composer: "Wolfgang Amadeus Mozart",
    performers: ["European Archive"],
    durationSeconds: 258,
    epoch: "Classical",
    source: "wikimedia",
    audioUrl: wm("Le nozze di Figaro overture - Vienna Philharmonic - Bruno Walter (1937).ogg"),
    license: "Public Domain",
  },
  {
    title: "Serenade No. 13 'Eine kleine Nachtmusik' – II. Romanze",
    composer: "Wolfgang Amadeus Mozart",
    performers: ["European Archive"],
    durationSeconds: 360,
    epoch: "Classical",
    source: "wikimedia",
    audioUrl: wm("Mozart - Eine kleine Nachtmusik - 2. Romanze.ogg"),
    license: "Public Domain",
  },
  {
    title: "Piano Sonata No. 16 in C major, K. 545 – I. Allegro",
    composer: "Wolfgang Amadeus Mozart",
    performers: ["Bernd Krueger"],
    durationSeconds: 240,
    epoch: "Classical",
    source: "wikimedia",
    audioUrl: wm("Mozart Piano Sonata No 16 in C Major, K 545 - I. Allegro.ogg"),
    license: "Public Domain",
  },

  // ───────── TCHAIKOVSKY ─────────
  {
    title: "Swan Lake, Op. 20 – Scene: Moderato",
    composer: "Pyotr Ilyich Tchaikovsky",
    performers: ["European Archive"],
    durationSeconds: 180,
    epoch: "Romantic",
    source: "wikimedia",
    audioUrl: wm("Pyotr Ilyich Tchaikovsky - Swan Lake - 01 - Scene.ogg"),
    license: "Public Domain",
  },
  {
    title: "The Nutcracker – Dance of the Sugar Plum Fairy",
    composer: "Pyotr Ilyich Tchaikovsky",
    performers: ["European Archive"],
    durationSeconds: 120,
    epoch: "Romantic",
    source: "wikimedia",
    audioUrl: wm("Tchaikovsky- The Nutcracker - Act II - No.14c - Variation 2 - Dance of the Sugar-Plum Fairy.ogg"),
    license: "Public Domain",
  },
  {
    title: "The Nutcracker – Waltz of the Flowers",
    composer: "Pyotr Ilyich Tchaikovsky",
    performers: ["European Archive"],
    durationSeconds: 420,
    epoch: "Romantic",
    source: "wikimedia",
    audioUrl: wm("Tchaikovsky- The Nutcracker - Act II - No.13 - Waltz of the Flowers.ogg"),
    license: "Public Domain",
  },
  {
    title: "1812 Overture, Op. 49",
    composer: "Pyotr Ilyich Tchaikovsky",
    performers: ["European Archive"],
    durationSeconds: 900,
    epoch: "Romantic",
    source: "wikimedia",
    audioUrl: wm("1812 Overture.ogg"),
    license: "Public Domain",
  },
  {
    title: "Piano Concerto No. 1 in B-flat minor, Op. 23 – I. Allegro non troppo",
    composer: "Pyotr Ilyich Tchaikovsky",
    performers: ["European Archive"],
    durationSeconds: 1260,
    epoch: "Romantic",
    source: "wikimedia",
    audioUrl: wm("Tchaikovsky-2 Piano concerto Nro1 mov1.ogg"),
    license: "Public Domain",
  },
  {
    title: "Sleeping Beauty Waltz, Op. 66",
    composer: "Pyotr Ilyich Tchaikovsky",
    performers: ["European Archive"],
    durationSeconds: 360,
    epoch: "Romantic",
    source: "wikimedia",
    audioUrl: wm("Tchaikovsky - The Sleeping Beauty - Waltz.ogg"),
    license: "Public Domain",
  },

  // ───────── VIVALDI ─────────
  {
    title: "The Four Seasons – Spring, RV 269: I. Allegro",
    composer: "Antonio Vivaldi",
    performers: ["John Harrison"],
    durationSeconds: 210,
    epoch: "Baroque",
    source: "wikimedia",
    audioUrl: wm("01 - Vivaldi Spring mvt 1 Allegro - John Harrison violin.ogg"),
    license: "CC BY-SA 3.0",
  },
  {
    title: "The Four Seasons – Summer, RV 315: III. Presto",
    composer: "Antonio Vivaldi",
    performers: ["John Harrison"],
    durationSeconds: 174,
    epoch: "Baroque",
    source: "wikimedia",
    audioUrl: wm("06 - Vivaldi Summer mvt 3 Presto - John Harrison violin.ogg"),
    license: "CC BY-SA 3.0",
  },
  {
    title: "The Four Seasons – Autumn, RV 293: I. Allegro",
    composer: "Antonio Vivaldi",
    performers: ["John Harrison"],
    durationSeconds: 306,
    epoch: "Baroque",
    source: "wikimedia",
    audioUrl: wm("07 - Vivaldi Autumn mvt 1 Allegro - John Harrison violin.ogg"),
    license: "CC BY-SA 3.0",
  },
  {
    title: "The Four Seasons – Winter, RV 297: II. Largo",
    composer: "Antonio Vivaldi",
    performers: ["John Harrison"],
    durationSeconds: 132,
    epoch: "Baroque",
    source: "wikimedia",
    audioUrl: wm("11 - Vivaldi Winter mvt 2 Largo - John Harrison violin.ogg"),
    license: "CC BY-SA 3.0",
  },
  {
    title: "The Four Seasons – Winter, RV 297: I. Allegro non molto",
    composer: "Antonio Vivaldi",
    performers: ["John Harrison"],
    durationSeconds: 210,
    epoch: "Baroque",
    source: "wikimedia",
    audioUrl: wm("10 - Vivaldi Winter mvt 1 Allegro non molto - John Harrison violin.ogg"),
    license: "CC BY-SA 3.0",
  },

  // ───────── LISZT ─────────
  {
    title: "Hungarian Rhapsody No. 2 in C-sharp minor",
    composer: "Franz Liszt",
    performers: ["Bernd Krueger"],
    durationSeconds: 600,
    epoch: "Romantic",
    source: "wikimedia",
    audioUrl: wm("Franz Liszt - Hungarian Rhapsody No. 2.ogg"),
    license: "Public Domain",
  },
  {
    title: "Liebestraum No. 3 in A-flat major",
    composer: "Franz Liszt",
    performers: ["Bernd Krueger"],
    durationSeconds: 270,
    epoch: "Romantic",
    source: "wikimedia",
    audioUrl: wm("Liebestraum.ogg"),
    license: "Public Domain",
  },
  {
    title: "La Campanella (Grand Étude de Paganini No. 3)",
    composer: "Franz Liszt",
    performers: ["Bernd Krueger"],
    durationSeconds: 300,
    epoch: "Romantic",
    source: "wikimedia",
    audioUrl: wm("Liszt - La Campanella.ogg"),
    license: "Public Domain",
  },
  {
    title: "Consolation No. 3 in D-flat major",
    composer: "Franz Liszt",
    performers: ["Markus Staab"],
    durationSeconds: 270,
    epoch: "Romantic",
    source: "wikimedia",
    audioUrl: wm("Consolation No. 3 in D-flat major.ogg"),
    license: "Public Domain",
  },

  // ───────── SCHUBERT ─────────
  {
    title: "Ave Maria, D. 839",
    composer: "Franz Schubert",
    performers: ["European Archive"],
    durationSeconds: 330,
    epoch: "Romantic",
    source: "wikimedia",
    audioUrl: wm("Franz Schubert - Ave Maria.ogg"),
    license: "Public Domain",
  },
  {
    title: "Serenade (Ständchen, D. 957 No. 4)",
    composer: "Franz Schubert",
    performers: ["European Archive"],
    durationSeconds: 270,
    epoch: "Romantic",
    source: "wikimedia",
    audioUrl: wm("Schubert - Serenade.ogg"),
    license: "Public Domain",
  },
  {
    title: "Piano Quintet in A major 'Trout', D. 667 – IV. Tema con variazioni",
    composer: "Franz Schubert",
    performers: ["European Archive"],
    durationSeconds: 480,
    epoch: "Romantic",
    source: "wikimedia",
    audioUrl: wm("Schubert - Piano Quintet - The Trout - IV. Theme and Variations.ogg"),
    license: "Public Domain",
  },
  {
    title: "Impromptu in G-flat major, Op. 90 No. 3, D. 899",
    composer: "Franz Schubert",
    performers: ["Markus Staab"],
    durationSeconds: 360,
    epoch: "Romantic",
    source: "wikimedia",
    audioUrl: wm("Schubert Impromptu op. 90 n. 3.ogg"),
    license: "Public Domain",
  },

  // ───────── RACHMANINOFF ─────────
  {
    title: "Piano Concerto No. 2 in C minor, Op. 18 – I. Moderato",
    composer: "Sergei Rachmaninoff",
    performers: ["European Archive"],
    durationSeconds: 660,
    epoch: "Romantic",
    source: "wikimedia",
    audioUrl: wm("Rachmaninoff - Piano Concerto No. 2, Opus 18 - I. Moderato.ogg"),
    license: "Public Domain",
  },
  {
    title: "Prelude in C-sharp minor, Op. 3 No. 2",
    composer: "Sergei Rachmaninoff",
    performers: ["Markus Staab"],
    durationSeconds: 240,
    epoch: "Romantic",
    source: "wikimedia",
    audioUrl: wm("Rachmaninoff - Prelude in C-sharp minor.ogg"),
    license: "Public Domain",
  },
  {
    title: "Vocalise, Op. 34 No. 14",
    composer: "Sergei Rachmaninoff",
    performers: ["European Archive"],
    durationSeconds: 360,
    epoch: "Romantic",
    source: "wikimedia",
    audioUrl: wm("Rachmaninov - Vocalise.ogg"),
    license: "Public Domain",
  },
  {
    title: "Rhapsody on a Theme of Paganini, Op. 43 – Var. 18",
    composer: "Sergei Rachmaninoff",
    performers: ["European Archive"],
    durationSeconds: 180,
    epoch: "Romantic",
    source: "wikimedia",
    audioUrl: wm("Rachmaninoff - Rhapsody on a Theme of Paganini, Variation 18.ogg"),
    license: "Public Domain",
  },

  // ───────── DVOŘÁK ─────────
  {
    title: "Symphony No. 9 'From the New World' – II. Largo",
    composer: "Antonín Dvořák",
    performers: ["European Archive"],
    durationSeconds: 720,
    epoch: "Romantic",
    source: "wikimedia",
    audioUrl: wm("Dvorak - Symphony No.9 - 2 - Largo.ogg"),
    license: "Public Domain",
  },
  {
    title: "Symphony No. 9 'From the New World' – IV. Allegro con fuoco",
    composer: "Antonín Dvořák",
    performers: ["European Archive"],
    durationSeconds: 720,
    epoch: "Romantic",
    source: "wikimedia",
    audioUrl: wm("Dvorak - Symphony No.9 - 4 - Allegro con fuoco.ogg"),
    license: "Public Domain",
  },
  {
    title: "Humoresque No. 7 in G-flat major, Op. 101",
    composer: "Antonín Dvořák",
    performers: ["European Archive"],
    durationSeconds: 180,
    epoch: "Romantic",
    source: "wikimedia",
    audioUrl: wm("Dvorak humoresque.ogg"),
    license: "Public Domain",
  },

  // ───────── GRIEG ─────────
  {
    title: "Peer Gynt Suite No. 1, Op. 46 – Morning Mood",
    composer: "Edvard Grieg",
    performers: ["European Archive"],
    durationSeconds: 240,
    epoch: "Romantic",
    source: "wikimedia",
    audioUrl: wm("Grieg - Morning Mood.ogg"),
    license: "Public Domain",
  },
  {
    title: "Peer Gynt Suite No. 1, Op. 46 – In the Hall of the Mountain King",
    composer: "Edvard Grieg",
    performers: ["European Archive"],
    durationSeconds: 150,
    epoch: "Romantic",
    source: "wikimedia",
    audioUrl: wm("Grieg - In the Hall of the Mountain King.ogg"),
    license: "Public Domain",
  },
  {
    title: "Piano Concerto in A minor, Op. 16 – I. Allegro molto moderato",
    composer: "Edvard Grieg",
    performers: ["European Archive"],
    durationSeconds: 720,
    epoch: "Romantic",
    source: "wikimedia",
    audioUrl: wm("Grieg Piano Concerto in A minor, Op. 16 - I. Allegro molto moderato.ogg"),
    license: "Public Domain",
  },

  // ───────── SATIE ─────────
  {
    title: "Gymnopédie No. 1",
    composer: "Erik Satie",
    performers: ["Bernd Krueger"],
    durationSeconds: 195,
    epoch: "Impressionist",
    source: "wikimedia",
    audioUrl: wm("Erik Satie - Gymnopédie No.1.ogg"),
    license: "Public Domain",
  },
  {
    title: "Gymnopédie No. 3",
    composer: "Erik Satie",
    performers: ["Bernd Krueger"],
    durationSeconds: 168,
    epoch: "Impressionist",
    source: "wikimedia",
    audioUrl: wm("Erik Satie - Gymnopédie No.3.ogg"),
    license: "Public Domain",
  },
  {
    title: "Gnossienne No. 1",
    composer: "Erik Satie",
    performers: ["Bernd Krueger"],
    durationSeconds: 240,
    epoch: "Impressionist",
    source: "wikimedia",
    audioUrl: wm("Satie Gnossienne no. 1.ogg"),
    license: "Public Domain",
  },

  // ───────── BRAHMS ─────────
  {
    title: "Hungarian Dance No. 5 in G minor",
    composer: "Johannes Brahms",
    performers: ["European Archive"],
    durationSeconds: 150,
    epoch: "Romantic",
    source: "wikimedia",
    audioUrl: wm("Brahms - Hungarian Dance No. 5.ogg"),
    license: "Public Domain",
  },
  {
    title: "Lullaby (Wiegenlied, Op. 49 No. 4)",
    composer: "Johannes Brahms",
    performers: ["European Archive"],
    durationSeconds: 180,
    epoch: "Romantic",
    source: "wikimedia",
    audioUrl: wm("Brahms - Wiegenlied.ogg"),
    license: "Public Domain",
  },
  {
    title: "Symphony No. 3 in F major, Op. 90 – III. Poco allegretto",
    composer: "Johannes Brahms",
    performers: ["European Archive"],
    durationSeconds: 390,
    epoch: "Romantic",
    source: "wikimedia",
    audioUrl: wm("Brahms Symphony 3 Movement 3.ogg"),
    license: "Public Domain",
  },
  {
    title: "Intermezzo in A major, Op. 118 No. 2",
    composer: "Johannes Brahms",
    performers: ["Markus Staab"],
    durationSeconds: 360,
    epoch: "Romantic",
    source: "wikimedia",
    audioUrl: wm("Brahms - Intermezzo in A major, Op.118, No.2.ogg"),
    license: "Public Domain",
  },

  // ───────── HANDEL ─────────
  {
    title: "Water Music Suite No. 2 – Alla Hornpipe",
    composer: "George Frideric Handel",
    performers: ["European Archive"],
    durationSeconds: 210,
    epoch: "Baroque",
    source: "wikimedia",
    audioUrl: wm("Georg_Friedrich_Haendel_-_Water_Music_Suite_No._2_-_05_-_Alla_Hornpipe.ogg"),
    license: "Public Domain",
  },
  {
    title: "Messiah – Hallelujah Chorus",
    composer: "George Frideric Handel",
    performers: ["European Archive"],
    durationSeconds: 240,
    epoch: "Baroque",
    source: "wikimedia",
    audioUrl: wm("Handel - Messiah - Hallelujah.ogg"),
    license: "Public Domain",
  },
  {
    title: "Sarabande in D minor (Suite in D minor, HWV 437)",
    composer: "George Frideric Handel",
    performers: ["European Archive"],
    durationSeconds: 180,
    epoch: "Baroque",
    source: "wikimedia",
    audioUrl: wm("Handel - Sarabande in D minor.ogg"),
    license: "Public Domain",
  },

  // ───────── MENDELSSOHN ─────────
  {
    title: "Wedding March (A Midsummer Night's Dream, Op. 61)",
    composer: "Felix Mendelssohn",
    performers: ["European Archive"],
    durationSeconds: 300,
    epoch: "Romantic",
    source: "wikimedia",
    audioUrl: wm("Mendelssohn - Wedding March.ogg"),
    license: "Public Domain",
  },
  {
    title: "Violin Concerto in E minor, Op. 64 – I. Allegro molto appassionato",
    composer: "Felix Mendelssohn",
    performers: ["European Archive"],
    durationSeconds: 780,
    epoch: "Romantic",
    source: "wikimedia",
    audioUrl: wm("Mendelssohn violin concerto e-minor 1st movement.ogg"),
    license: "Public Domain",
  },

  // ───────── STRAUSS ─────────
  {
    title: "The Blue Danube Waltz, Op. 314",
    composer: "Johann Strauss II",
    performers: ["European Archive"],
    durationSeconds: 600,
    epoch: "Romantic",
    source: "wikimedia",
    audioUrl: wm("Strauss Blue Danube.ogg"),
    license: "Public Domain",
  },
  {
    title: "Radetzky March, Op. 228",
    composer: "Johann Strauss I",
    performers: ["European Archive"],
    durationSeconds: 180,
    epoch: "Romantic",
    source: "wikimedia",
    audioUrl: wm("Radetzky March.ogg"),
    license: "Public Domain",
  },

  // ───────── PACHELBEL ─────────
  {
    title: "Canon in D major",
    composer: "Johann Pachelbel",
    performers: ["European Archive"],
    durationSeconds: 330,
    epoch: "Baroque",
    source: "wikimedia",
    audioUrl: wm("Pachelbel - Canon in D.ogg"),
    license: "Public Domain",
  },

  // ───────── SAINT-SAËNS ─────────
  {
    title: "The Carnival of the Animals – The Swan",
    composer: "Camille Saint-Saëns",
    performers: ["European Archive"],
    durationSeconds: 210,
    epoch: "Romantic",
    source: "wikimedia",
    audioUrl: wm("Saint-Saëns - The Swan.ogg"),
    license: "Public Domain",
  },
  {
    title: "Danse macabre, Op. 40",
    composer: "Camille Saint-Saëns",
    performers: ["European Archive"],
    durationSeconds: 420,
    epoch: "Romantic",
    source: "wikimedia",
    audioUrl: wm("Saint-Saens - Danse Macabre.ogg"),
    license: "Public Domain",
  },

  // ───────── MUSSORGSKY ─────────
  {
    title: "Pictures at an Exhibition – The Great Gate of Kiev",
    composer: "Modest Mussorgsky",
    performers: ["European Archive"],
    durationSeconds: 360,
    epoch: "Romantic",
    source: "wikimedia",
    audioUrl: wm("Mussorgsky - Pictures at an Exhibition - The Great Gate of Kiev.ogg"),
    license: "Public Domain",
  },
  {
    title: "Night on Bald Mountain",
    composer: "Modest Mussorgsky",
    performers: ["European Archive"],
    durationSeconds: 660,
    epoch: "Romantic",
    source: "wikimedia",
    audioUrl: wm("Mussorgsky - Night on Bald Mountain.ogg"),
    license: "Public Domain",
  },

  // ───────── RAVEL ─────────
  {
    title: "Boléro",
    composer: "Maurice Ravel",
    performers: ["European Archive"],
    durationSeconds: 900,
    epoch: "Impressionist",
    source: "wikimedia",
    audioUrl: wm("Ravel Bolero.ogg"),
    license: "Public Domain",
  },
  {
    title: "Pavane pour une infante défunte",
    composer: "Maurice Ravel",
    performers: ["Bernd Krueger"],
    durationSeconds: 360,
    epoch: "Impressionist",
    source: "wikimedia",
    audioUrl: wm("Ravel - Pavane pour une infante defunte.ogg"),
    license: "Public Domain",
  },

  // ───────── SCHUMANN ─────────
  {
    title: "Träumerei (Kinderszenen, Op. 15 No. 7)",
    composer: "Robert Schumann",
    performers: ["Markus Staab"],
    durationSeconds: 180,
    epoch: "Romantic",
    source: "wikimedia",
    audioUrl: wm("Schumann - Träumerei.ogg"),
    license: "Public Domain",
  },
  {
    title: "Piano Concerto in A minor, Op. 54 – I. Allegro affettuoso",
    composer: "Robert Schumann",
    performers: ["European Archive"],
    durationSeconds: 900,
    epoch: "Romantic",
    source: "wikimedia",
    audioUrl: wm("Schumann-PianoConcerto-1.ogg"),
    license: "Public Domain",
  },

  // ───────── WAGNER ─────────
  {
    title: "Ride of the Valkyries (Die Walküre, Act III)",
    composer: "Richard Wagner",
    performers: ["European Archive"],
    durationSeconds: 300,
    epoch: "Romantic",
    source: "wikimedia",
    audioUrl: wm("Richard Wagner - Ride of the Valkyries.ogg"),
    license: "Public Domain",
  },
  {
    title: "Bridal Chorus (Lohengrin, Act III)",
    composer: "Richard Wagner",
    performers: ["European Archive"],
    durationSeconds: 300,
    epoch: "Romantic",
    source: "wikimedia",
    audioUrl: wm("Wagner - Bridal Chorus.ogg"),
    license: "Public Domain",
  },

  // ───────── VERDI ─────────
  {
    title: "La Traviata – Prelude to Act I",
    composer: "Giuseppe Verdi",
    performers: ["European Archive"],
    durationSeconds: 240,
    epoch: "Romantic",
    source: "wikimedia",
    audioUrl: wm("Verdi - La Traviata - Prelude.ogg"),
    license: "Public Domain",
  },
  {
    title: "Aida – Triumphal March",
    composer: "Giuseppe Verdi",
    performers: ["European Archive"],
    durationSeconds: 360,
    epoch: "Romantic",
    source: "wikimedia",
    audioUrl: wm("Verdi - Aida - Grand March.ogg"),
    license: "Public Domain",
  },

  // ───────── ELGAR ─────────
  {
    title: "Pomp and Circumstance March No. 1 in D major, Op. 39",
    composer: "Edward Elgar",
    performers: ["European Archive"],
    durationSeconds: 360,
    epoch: "Romantic",
    source: "wikimedia",
    audioUrl: wm("Elgar - Pomp and Circumstance March no. 1.ogg"),
    license: "Public Domain",
  },

  // ───────── HOLST ─────────
  {
    title: "The Planets, Op. 32 – Jupiter, the Bringer of Jollity",
    composer: "Gustav Holst",
    performers: ["European Archive"],
    durationSeconds: 480,
    epoch: "Modern",
    source: "wikimedia",
    audioUrl: wm("Holst - The Planets, Jupiter.ogg"),
    license: "Public Domain",
  },

  // ───────── BIZET ─────────
  {
    title: "Carmen – Habanera",
    composer: "Georges Bizet",
    performers: ["European Archive"],
    durationSeconds: 150,
    epoch: "Romantic",
    source: "wikimedia",
    audioUrl: wm("Bizet-Carmen-Habanera.ogg"),
    license: "Public Domain",
  },
  {
    title: "L'Arlésienne Suite No. 2 – Farandole",
    composer: "Georges Bizet",
    performers: ["European Archive"],
    durationSeconds: 210,
    epoch: "Romantic",
    source: "wikimedia",
    audioUrl: wm("Bizet - L'arlesienne suite 2 - Farandole.ogg"),
    license: "Public Domain",
  },

  // ───────── ROSSINI ─────────
  {
    title: "William Tell Overture – Finale",
    composer: "Gioachino Rossini",
    performers: ["European Archive"],
    durationSeconds: 210,
    epoch: "Romantic",
    source: "wikimedia",
    audioUrl: wm("Rossini - William Tell Overture.ogg"),
    license: "Public Domain",
  },
  {
    title: "The Barber of Seville – Overture",
    composer: "Gioachino Rossini",
    performers: ["European Archive"],
    durationSeconds: 420,
    epoch: "Romantic",
    source: "wikimedia",
    audioUrl: wm("Rossini - The Barber of Seville Overture.ogg"),
    license: "Public Domain",
  },

  // ───────── GERSHWIN ─────────
  {
    title: "Rhapsody in Blue",
    composer: "George Gershwin",
    performers: ["Columbia Jazz Band"],
    durationSeconds: 960,
    epoch: "Modern",
    source: "wikimedia",
    audioUrl: wm("Gershwin - Rhapsody in Blue (1924).ogg"),
    license: "Public Domain",
  },

  // ───────── ALBINONI / GIAZOTTO ─────────
  {
    title: "Adagio in G minor",
    composer: "Tomaso Albinoni / Remo Giazotto",
    performers: ["European Archive"],
    durationSeconds: 540,
    epoch: "Baroque",
    source: "wikimedia",
    audioUrl: wm("Albinoni - Adagio in G minor.ogg"),
    license: "Public Domain",
  },

  // ───────── TARTINI ─────────
  {
    title: "Violin Sonata in G minor 'Devil's Trill' – III. Andante–Allegro",
    composer: "Giuseppe Tartini",
    performers: ["European Archive"],
    durationSeconds: 480,
    epoch: "Baroque",
    source: "wikimedia",
    audioUrl: wm("Tartini - Devils trill sonata.ogg"),
    license: "Public Domain",
  },

  // ───────── PURCELL ─────────
  {
    title: "Dido and Aeneas – When I am laid in earth (Dido's Lament)",
    composer: "Henry Purcell",
    performers: ["European Archive"],
    durationSeconds: 270,
    epoch: "Baroque",
    source: "wikimedia",
    audioUrl: wm("Purcell Dido's Lament.ogg"),
    license: "Public Domain",
  },

  // ───────── BORODIN ─────────
  {
    title: "In the Steppes of Central Asia",
    composer: "Alexander Borodin",
    performers: ["European Archive"],
    durationSeconds: 420,
    epoch: "Romantic",
    source: "wikimedia",
    audioUrl: wm("Borodin - In the Steppes of Central Asia.ogg"),
    license: "Public Domain",
  },

  // ───────── RIMSKY-KORSAKOV ─────────
  {
    title: "Flight of the Bumblebee (The Tale of Tsar Saltan)",
    composer: "Nikolai Rimsky-Korsakov",
    performers: ["European Archive"],
    durationSeconds: 84,
    epoch: "Romantic",
    source: "wikimedia",
    audioUrl: wm("Rimsky-Korsakov_-_Flight_of_the_Bumblebee.ogg"),
    license: "Public Domain",
  },
  {
    title: "Scheherazade, Op. 35 – III. The Young Prince and The Young Princess",
    composer: "Nikolai Rimsky-Korsakov",
    performers: ["European Archive"],
    durationSeconds: 660,
    epoch: "Romantic",
    source: "wikimedia",
    audioUrl: wm("Rimsky Korsakov Scheherazade Movement 3.ogg"),
    license: "Public Domain",
  },

  // ───────── OFFENBACH ─────────
  {
    title: "Orpheus in the Underworld – Galop infernal (Can-Can)",
    composer: "Jacques Offenbach",
    performers: ["European Archive"],
    durationSeconds: 150,
    epoch: "Romantic",
    source: "wikimedia",
    audioUrl: wm("Offenbach - Orphee aux enfers - Can Can.ogg"),
    license: "Public Domain",
  },
  {
    title: "The Tales of Hoffmann – Barcarolle",
    composer: "Jacques Offenbach",
    performers: ["European Archive"],
    durationSeconds: 210,
    epoch: "Romantic",
    source: "wikimedia",
    audioUrl: wm("Offenbach - Barcarolle.ogg"),
    license: "Public Domain",
  },

  // ───────── MASSENET ─────────
  {
    title: "Thaïs – Méditation",
    composer: "Jules Massenet",
    performers: ["European Archive"],
    durationSeconds: 330,
    epoch: "Romantic",
    source: "wikimedia",
    audioUrl: wm("Massenet - Thais - Meditation.ogg"),
    license: "Public Domain",
  },

  // ───────── FAURÉ ─────────
  {
    title: "Pavane, Op. 50",
    composer: "Gabriel Fauré",
    performers: ["European Archive"],
    durationSeconds: 360,
    epoch: "Romantic",
    source: "wikimedia",
    audioUrl: wm("Fauré - Pavane.ogg"),
    license: "Public Domain",
  },
  {
    title: "Sicilienne, Op. 78",
    composer: "Gabriel Fauré",
    performers: ["European Archive"],
    durationSeconds: 210,
    epoch: "Romantic",
    source: "wikimedia",
    audioUrl: wm("Fauré - Sicilienne.ogg"),
    license: "Public Domain",
  },

  // ───────── PAGANINI ─────────
  {
    title: "Caprice No. 24 in A minor",
    composer: "Niccolò Paganini",
    performers: ["European Archive"],
    durationSeconds: 300,
    epoch: "Romantic",
    source: "wikimedia",
    audioUrl: wm("Paganini - Caprice no 24.ogg"),
    license: "Public Domain",
  },
];

/* ── Seed Firestore ─────────────────────────────────── */

async function seed() {
  console.log(`Seeding ${TRACKS.length} tracks…`);

  const trackIds: string[] = [];

  for (let i = 0; i < TRACKS.length; i++) {
    const track = TRACKS[i];
    const docRef = db.collection("tracks").doc();
    await docRef.set(track);
    trackIds.push(docRef.id);
    process.stdout.write(`\r  Written ${i + 1}/${TRACKS.length}`);
  }

  console.log("\n\nCreating master playlist…");

  // Remove existing master playlists
  const existing = await db
    .collection("playlists")
    .where("ownerId", "==", null)
    .get();

  const deleteBatch = db.batch();
  existing.docs.forEach((doc) => deleteBatch.delete(doc.ref));
  await deleteBatch.commit();

  // Create new master playlist
  await db.collection("playlists").add({
    name: "Classical Masterworks",
    description: "A curated collection of 100+ iconic classical music performances spanning the Baroque, Classical, Romantic, and Modern eras.",
    ownerId: null,
    trackIds,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  console.log("✓ Done! Master playlist created with", trackIds.length, "tracks.");
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});

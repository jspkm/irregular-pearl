/**
 * Patch script – updates ONLY the broken audioUrl fields in existing
 * Firestore "tracks" documents. Matches tracks by title and updates
 * the audioUrl from old (broken) → new (correct).
 *
 * Usage:
 *   npx tsx scripts/patch-audio-urls.ts
 */

import { initializeApp, cert, type ServiceAccount } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import * as fs from "fs";

/* ── Firebase Admin init ────────────────────────────── */

const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
const envProjectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID;

if (serviceAccountPath && fs.existsSync(serviceAccountPath)) {
  const sa = JSON.parse(fs.readFileSync(serviceAccountPath, "utf-8")) as ServiceAccount;
  initializeApp({ credential: cert(sa) });
} else {
  initializeApp({ projectId: envProjectId || "irregular-pearl-dev" });
}

const db = getFirestore();

/* ── Helpers ────────────────────────────────────────── */

function wm(filename: string): string {
  return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(filename)}`;
}

/* ── URL Fixes: old broken URL → new correct URL ──── */

const URL_FIXES: { title: string; oldUrl: string; newUrl: string }[] = [
  // BEETHOVEN
  {
    title: "Symphony No. 5 in C minor, Op. 67 – I. Allegro con brio",
    oldUrl: wm("Beethoven Symphony 5, first movement.ogg"),
    newUrl: wm("Ludwig van Beethoven - symphony no. 5 in c minor, op. 67 - i. allegro con brio.ogg"),
  },
  {
    title: "Piano Sonata No. 8 'Pathétique', Op. 13 – II. Adagio cantabile",
    oldUrl: wm("Beethoven - Sonata Pathetique, 2nd movement.ogg"),
    newUrl: wm("Beethoven, Sonata No. 8 in C Minor Pathetique, Op. 13 - II. Adagio cantabile.ogg"),
  },
  {
    title: "Piano Concerto No. 5 'Emperor', Op. 73 – II. Adagio un poco mosso",
    oldUrl: wm("USAB-Beethoven-PianoConcerto5-2.ogg"),
    newUrl: wm("Beethoven Piano Concerto No 5 Movement 1.ogg"),
  },

  // CHOPIN
  {
    title: "Ballade No. 1 in G minor, Op. 23",
    oldUrl: wm("Chopin Ballade 1.ogg"),
    newUrl: wm("Frederic Chopin - ballade no. 1 in g minor, op. 23.ogg"),
  },
  {
    title: "Waltz in D-flat major, Op. 64 No. 1 'Minute Waltz'",
    oldUrl: wm("Chopin waltz op 64 no 1.ogg"),
    newUrl: wm("Chopin Minute Waltz.ogg"),
  },
  {
    title: "Fantaisie-Impromptu in C-sharp minor, Op. 66",
    oldUrl: wm("Chopin Fantaisie Impromptu.ogg"),
    newUrl: wm("Frederic Chopin - Fantasy Impromptu Opus 66.ogg"),
  },
  {
    title: "Nocturne in C-sharp minor, Op. posth.",
    oldUrl: wm("Chopin nocturne in c-sharp minor.ogg"),
    newUrl: wm("Chopin, Nocturne in C-sharp minor, Op. Posth.ogg"),
  },
  {
    title: "Scherzo No. 2 in B-flat minor, Op. 31",
    oldUrl: wm("Chopin - Scherzo No. 2, Op. 31.ogg"),
    newUrl: wm("Frederic Chopin - scherzo no. 2 in b flat minor, op. 31.ogg"),
  },

  // DEBUSSY
  {
    title: "Rêverie",
    oldUrl: wm("Debussy – Rêverie.ogg"),
    newUrl: wm("Reverie.ogg"),
  },

  // BACH
  {
    title: "Air on the G String (Orchestral Suite No. 3, BWV 1068)",
    oldUrl: wm("Johann Sebastian Bach - Air.ogg"),
    newUrl: wm("Air (Bach).ogg"),
  },
  {
    title: "Cello Suite No. 1 in G major, BWV 1007 – I. Prélude",
    oldUrl: wm("Bach - Cello Suite No.1 - Prelude.ogg"),
    newUrl: wm("Bach - Cello Suite no. 1 in G major, BWV 1007 - I. Prélude.ogg"),
  },
  {
    title: "Brandenburg Concerto No. 3 in G major, BWV 1048 – I. Allegro",
    oldUrl: wm("Johann Sebastian Bach - Brandenburg Concerto No. 3, first movement - Allegro.ogg"),
    newUrl: wm("Bach - Brandenburg Concerto No. 3 - 1. Allegro.ogg"),
  },
  {
    title: "Well-Tempered Clavier, Book 1 – Prelude No. 1 in C major, BWV 846",
    oldUrl: wm("Johann Sebastian Bach - The Well-Tempered Clavier - Book 1 - 01 Prelude in C major - Kimiko Ishizaka.ogg"),
    newUrl: wm("Kimiko Ishizaka - Bach - Well-Tempered Clavier, Book 1 - 01 Prelude No. 1 in C major, BWV 846.ogg"),
  },

  // MOZART
  {
    title: "Piano Sonata No. 11 in A major, K. 331 – III. Rondo alla Turca",
    oldUrl: wm("Mozart - Turkish March.ogg"),
    newUrl: wm("Mozart - Piano Sonata No. 11 in A major - III. Allegro (Turkish March).ogg"),
  },
  {
    title: "Requiem in D minor, K. 626 – Lacrimosa",
    oldUrl: wm("Mozart - Lacrimosa.ogg"),
    newUrl: wm("W. A. Mozart - Requiem - 8. Lacrimosa (Herbert von Karajan, Wiener Philharmoniker, Wiener Singverein, 1960).ogg"),
  },
  {
    title: "Piano Sonata No. 16 in C major, K. 545 – I. Allegro",
    oldUrl: wm("Mozart Piano Sonata No 16 in C Major, K 545 - I. Allegro.ogg"),
    newUrl: wm("Mozart - Piano Sonata No. 16 in C major - I. Allegro.ogg"),
  },

  // TCHAIKOVSKY
  {
    title: "1812 Overture, Op. 49",
    oldUrl: wm("1812 Overture.ogg"),
    newUrl: wm("Pyotr Ilyich Tchaikovsky - 1812 overture.ogg"),
  },

  // LISZT
  {
    title: "Hungarian Rhapsody No. 2 in C-sharp minor",
    oldUrl: wm("Franz Liszt - Hungarian Rhapsody No. 2.ogg"),
    newUrl: wm("Hungarian Rhapsody No 2.ogg"),
  },
  {
    title: "Liebestraum No. 3 in A-flat major",
    oldUrl: wm("Liebestraum.ogg"),
    newUrl: wm("Franz Liszt - Liebestraum, Ab Major.ogg"),
  },
  {
    title: "La Campanella (Grand Étude de Paganini No. 3)",
    oldUrl: wm("Liszt - La Campanella.ogg"),
    newUrl: wm("Liszt-La Campanella-Greiss.ogg"),
  },

  // SCHUBERT
  {
    title: "Serenade (Ständchen, D. 957 No. 4)",
    oldUrl: wm("Schubert - Serenade.ogg"),
    newUrl: wm("Ständchen (Schubert)-Serenade D957 No.4, Player Jason, Han.ogg"),
  },

  // RACHMANINOFF
  {
    title: "Prelude in C-sharp minor, Op. 3 No. 2",
    oldUrl: wm("Rachmaninoff - Prelude in C-sharp minor.ogg"),
    newUrl: wm("Sergei Rachmaninoff performs Rachmaninoff's Prelude in C sharp minor, Op. 3.ogg"),
  },

  // DVOŘÁK
  {
    title: "Symphony No. 9 'From the New World' – IV. Allegro con fuoco",
    oldUrl: wm("Dvorak - Symphony No.9 - 4 - Allegro con fuoco.ogg"),
    newUrl: wm("Antonin Dvorak - symphony no. 9 in e minor 'from the new world', op. 95 - iv. allegro con fuoco.ogg"),
  },
  {
    title: "Humoresque No. 7 in G-flat major, Op. 101",
    oldUrl: wm("Dvorak humoresque.ogg"),
    newUrl: wm("Dvořák - Humoresque Op. 101 No. 7.ogg"),
  },

  // GRIEG
  {
    title: "Peer Gynt Suite No. 1, Op. 46 – Morning Mood",
    oldUrl: wm("Grieg - Morning Mood.ogg"),
    newUrl: wm("Henrik Ibsen, Edvard Grieg - Morgenstemning (Morning Mood).ogg"),
  },
  {
    title: "Peer Gynt Suite No. 1, Op. 46 – In the Hall of the Mountain King",
    oldUrl: wm("Grieg - In the Hall of the Mountain King.ogg"),
    newUrl: wm("In the Hall of the Mountain King.ogg"),
  },
  {
    title: "Piano Concerto in A minor, Op. 16 – I. Allegro molto moderato",
    oldUrl: wm("Grieg Piano Concerto in A minor, Op. 16 - I. Allegro molto moderato.ogg"),
    newUrl: wm("Edvard Grieg - piano concerto in a minor, op. 16 - i. allegro molto moderato.ogg"),
  },

  // SATIE
  {
    title: "Gymnopédie No. 1",
    oldUrl: wm("Erik Satie - Gymnopédie No.1.ogg"),
    newUrl: wm("Erik Satie - gymnopedies - la 1 ere. lent et douloureux.ogg"),
  },
  {
    title: "Gymnopédie No. 3",
    oldUrl: wm("Erik Satie - Gymnopédie No.3.ogg"),
    newUrl: wm("Gymnopédie no.3.ogg"),
  },
];

/* ── Patch Logic ────────────────────────────────────── */

async function patchUrls() {
  console.log(`\nPatching ${URL_FIXES.length} broken audio URLs in Firestore...\n`);

  const tracksRef = db.collection("tracks");
  const snapshot = await tracksRef.get();

  if (snapshot.empty) {
    console.log("❌ No tracks found in Firestore. Run seed-tracks.ts first.");
    return;
  }

  console.log(`Found ${snapshot.size} tracks in Firestore.\n`);

  let patched = 0;
  let skipped = 0;
  let notFound = 0;

  for (const fix of URL_FIXES) {
    // Find the track by title
    const matchingDocs = snapshot.docs.filter(
      (doc) => doc.data().title === fix.title
    );

    if (matchingDocs.length === 0) {
      console.log(`⚠️  Not found: "${fix.title}"`);
      notFound++;
      continue;
    }

    for (const doc of matchingDocs) {
      const currentUrl = doc.data().audioUrl;

      if (currentUrl === fix.newUrl) {
        console.log(`⏭️  Already fixed: "${fix.title}"`);
        skipped++;
        continue;
      }

      if (currentUrl !== fix.oldUrl) {
        console.log(`⚠️  URL mismatch for "${fix.title}" — current URL doesn't match expected old URL, patching anyway`);
      }

      await doc.ref.update({ audioUrl: fix.newUrl });
      console.log(`✅ Patched: "${fix.title}"`);
      patched++;
    }
  }

  console.log(`\n═══════════════════════════════`);
  console.log(`✅ Patched: ${patched}`);
  console.log(`⏭️  Already OK: ${skipped}`);
  console.log(`⚠️  Not found: ${notFound}`);
  console.log(`═══════════════════════════════\n`);
}

patchUrls().catch(console.error);

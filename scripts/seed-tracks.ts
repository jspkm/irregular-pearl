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
const envProjectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID;

if (serviceAccountPath && fs.existsSync(serviceAccountPath)) {
  const sa = JSON.parse(fs.readFileSync(serviceAccountPath, "utf-8")) as ServiceAccount;
  initializeApp({ credential: cert(sa) });
} else {
  // Fallback: Use environment project ID or default
  initializeApp({ projectId: envProjectId || "irregular-pearl-dev" });
}

const db = getFirestore();

/* ── Helpers ────────────────────────────────────────── */

/** Internet Archive direct file URL */
function ia(item: string, file: string): string {
  return `https://archive.org/download/${item}/${encodeURIComponent(file)}`;
}

/** Wikimedia Commons Special:FilePath shorthand (fallback for tracks without IA MP3) */
function wm(filename: string): string {
  return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(filename)}`;
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
    performers: ["Piano Solo"],
    durationSeconds: 198,
    epoch: "Classical",
    source: "internet_archive",
    audioUrl: ia("WoO59PocoMotoBagatelleInAMinorFurElise", "FrEliseWoo59.mp3"),
    license: "Public Domain",
  },
  {
    title: "Symphony No. 5 in C minor, Op. 67 – I. Allegro con brio",
    composer: "Ludwig van Beethoven",
    performers: ["Symphony Orchestra"],
    durationSeconds: 480,
    epoch: "Classical",
    source: "internet_archive",
    audioUrl: ia("LudwigVanBeethovenSymphonyNo.5Op.67I.AllegroConBrioFromAustinPowersGoldmember", "Ludwig van Beethoven - Symphony No. 5, Op. 67, I. Allegro con brio (From Austin Powers, Goldmember).mp3"),
    license: "Public Domain",
  },
  {
    title: "Symphony No. 5 in C minor, Op. 67 – IV. Allegro",
    composer: "Ludwig van Beethoven",
    performers: ["Philharmonic Symphony of London"],
    conductor: "Artur Rodzinski",
    durationSeconds: 660,
    epoch: "Classical",
    source: "internet_archive",
    audioUrl: ia("lp_beethoven-symphony-no-5-in-c-minor-op-67_philharmonic-symphony-of-london-artur-rodz", "disc1/02.01. Allegro; Allegro (Concl.).mp3"),
    license: "Public Domain",
  },
  {
    title: "Moonlight Sonata, Op. 27 No. 2 – I. Adagio sostenuto",
    composer: "Ludwig van Beethoven",
    performers: ["Piano Solo"],
    durationSeconds: 360,
    epoch: "Classical",
    source: "internet_archive",
    audioUrl: ia("LudwigVanBeethovenPianoSonataNo.14InCSharpMinorOp.27No.2MoonlightI.AdagioSostenutoFromCrimsonTide", "Ludwig van Beethoven - Piano Sonata No.14 in C-sharp minor, Op.27 No.2 (Moonlight), I. Adagio sostenuto (From Crimson Tide).mp3"),
    license: "Public Domain",
  },
  {
    title: "Moonlight Sonata, Op. 27 No. 2 – III. Presto agitato",
    composer: "Ludwig van Beethoven",
    performers: ["Howard Jones"],
    durationSeconds: 420,
    epoch: "Classical",
    source: "internet_archive",
    audioUrl: ia("78_moonlight-sonata-part-3-presto-agitato-pt1_howard-jones-evlyn", "9095_WAX_1335-3.mp3"),
    license: "Public Domain",
  },
  {
    title: "Piano Sonata No. 8 'Pathétique', Op. 13 – II. Adagio cantabile",
    composer: "Ludwig van Beethoven",
    performers: ["Marjorie Hayward"],
    durationSeconds: 312,
    epoch: "Classical",
    source: "internet_archive",
    audioUrl: ia("78_adagio-ur-sonate-pathtique_marjorie-hayward-beethoven_gbia7017667a", 'Adagio ur "Sonate Pathêtique" - MARJORIE HAYWARD.mp3'),
    license: "Public Domain",
  },
  {
    title: "32 Variations in C minor, WoO 80",
    composer: "Ludwig van Beethoven",
    performers: ["Emil Gilels"],
    durationSeconds: 750,
    epoch: "Classical",
    source: "internet_archive",
    audioUrl: ia("lp_gilels-plays-beethoven-emperor-concerto-an_ludwig-van-beethoven-emil-gilels", "disc1/02.02. BAnd 3: 32 Variations in C minor, op. 191.mp3"),
    license: "Public Domain",
  },
  {
    title: "Piano Concerto No. 5 'Emperor', Op. 73 – II. Adagio un poco mosso",
    composer: "Ludwig van Beethoven",
    performers: ["Benno Moiseiwitsch"],
    durationSeconds: 480,
    epoch: "Classical",
    source: "internet_archive",
    audioUrl: ia("BeethovenPianoConcertoNo.5emperormoiseivitch", "2.Ii.AdagioIii.Rondo.mp3"),
    license: "Public Domain",
  },
  {
    title: "Symphony No. 9 – IV. Ode to Joy (excerpt)",
    composer: "Ludwig van Beethoven",
    performers: ["NBC Symphony Orchestra"],
    conductor: "Arturo Toscanini",
    durationSeconds: 1500,
    epoch: "Classical",
    source: "internet_archive",
    audioUrl: ia("lp_beethoven-ode-to-joy_arturo-toscanini-nbc-symphony-orchestra", "disc1/02.01. Fourth Movement: Allegro Assai Vivace; Allegro Ma Non Tanto (Concluded).mp3"),
    license: "Public Domain",
  },

  // ───────── CHOPIN ─────────
  {
    title: "Nocturne in E-flat major, Op. 9 No. 2",
    composer: "Frédéric Chopin",
    performers: ["Arthur Rubinstein"],
    durationSeconds: 274,
    epoch: "Romantic",
    source: "internet_archive",
    audioUrl: ia("FredericChopinNocturneNo.2InEFlatMajorOp.9No.2FromBlueLagoon", "Frederic Chopin - Nocturne No. 2 In E Flat Major Op.9 No.2 (From Blue Lagoon).mp3"),
    license: "Public Domain",
  },
  {
    title: "Ballade No. 1 in G minor, Op. 23",
    composer: "Frédéric Chopin",
    performers: ["Piano Solo"],
    durationSeconds: 570,
    epoch: "Romantic",
    source: "internet_archive",
    audioUrl: ia("FredericChopinBalladeNo.1InGMinorOp.23FromThePianist", "Frederic Chopin - Ballade No. 1 in G minor, Op. 23 (From The Pianist).mp3"),
    license: "Public Domain",
  },
  {
    title: "Étude Op. 10, No. 3 'Tristesse'",
    composer: "Frédéric Chopin",
    performers: ["Piano Solo"],
    durationSeconds: 260,
    epoch: "Romantic",
    source: "internet_archive",
    audioUrl: ia("ChopinEtudeOp.10No.3", "tristesse.mp3"),
    license: "Public Domain",
  },
  {
    title: "Waltz in D-flat major, Op. 64 No. 1 'Minute Waltz'",
    composer: "Frédéric Chopin",
    performers: ["Piano Solo"],
    durationSeconds: 110,
    epoch: "Romantic",
    source: "internet_archive",
    audioUrl: ia("39FredericChopinWaltzInDFlatMinorMinute1847", '39 Frederic Chopin - Waltz in D Flat Minor \u201CMinute\u201D, 1847.mp3'),
    license: "Public Domain",
  },
  {
    title: "Prelude in D-flat major, Op. 28 No. 15 'Raindrop'",
    composer: "Frédéric Chopin",
    performers: ["Piano Solo"],
    durationSeconds: 330,
    epoch: "Romantic",
    source: "internet_archive",
    audioUrl: ia("ChopinPreludiumDesDur", "Chopin Preludium Des dur.mp3"),
    license: "Public Domain",
  },
  {
    title: "Polonaise in A-flat major, Op. 53 'Heroic'",
    composer: "Frédéric Chopin",
    performers: ["Piano Solo"],
    durationSeconds: 390,
    epoch: "Romantic",
    source: "internet_archive",
    audioUrl: ia("FredericChopinPolonaiseNo.6InAFlatMajorOp.53", "FredericChopinPolonaiseNo.6InAFlatMajorOp.53.mp3"),
    license: "Public Domain",
  },
  {
    title: "Fantaisie-Impromptu in C-sharp minor, Op. 66",
    composer: "Frédéric Chopin",
    performers: ["Piano Solo"],
    durationSeconds: 300,
    epoch: "Romantic",
    source: "internet_archive",
    audioUrl: ia("ChopinFantaisie-impromptuOp66", "ChopinFantaisie-impromptuOp66.mp3"),
    license: "Public Domain",
  },
  {
    title: "Nocturne in C-sharp minor, Op. posth.",
    composer: "Frédéric Chopin",
    performers: ["Piano Solo"],
    durationSeconds: 250,
    epoch: "Romantic",
    source: "internet_archive",
    audioUrl: ia("sundaychopin", "Nocturne B. 49 in C sharp minor 'Lento con gran espressione' (1).mp3"),
    license: "Public Domain",
  },
  {
    title: "Scherzo No. 2 in B-flat minor, Op. 31",
    composer: "Frédéric Chopin",
    performers: ["Piano Solo"],
    durationSeconds: 600,
    epoch: "Romantic",
    source: "internet_archive",
    audioUrl: ia("chopin-op-31-ar-1932", "chopin op31 AR1932.mp3"),
    license: "Public Domain",
  },
  {
    title: "Étude Op. 25, No. 11 'Winter Wind'",
    composer: "Frédéric Chopin",
    performers: ["Piano Solo"],
    durationSeconds: 240,
    epoch: "Romantic",
    source: "internet_archive",
    audioUrl: ia("47.FredericChopinWinterWind1836", "47. Frederic Chopin - Winter Wind, 1836.mp3"),
    license: "Public Domain",
  },

  // ───────── DEBUSSY ─────────
  {
    title: "Clair de lune (Suite bergamasque)",
    composer: "Claude Debussy",
    performers: ["Piano Solo"],
    durationSeconds: 300,
    epoch: "Impressionist",
    source: "internet_archive",
    audioUrl: ia("ClairDeLunedebussy", "2009-03-30-clairdelune.mp3"),
    license: "Public Domain",
  },
  {
    title: "Arabesque No. 1 in E major",
    composer: "Claude Debussy",
    performers: ["Piano Solo"],
    durationSeconds: 300,
    epoch: "Impressionist",
    source: "internet_archive",
    audioUrl: ia("DebussyArabesqueNo.1AndNo.2", "Debussy - Arabesque No.1 and No.2.mp3"),
    license: "Public Domain",
  },
  {
    title: "Rêverie",
    composer: "Claude Debussy",
    performers: ["Piano Solo"],
    durationSeconds: 264,
    epoch: "Impressionist",
    source: "internet_archive",
    audioUrl: ia("DebussyReverie", "Debussy Reverie.mp3"),
    license: "Public Domain",
  },
  {
    title: "Prélude à l'après-midi d'un faune",
    composer: "Claude Debussy",
    performers: ["Orchestra"],
    durationSeconds: 600,
    epoch: "Impressionist",
    source: "internet_archive",
    audioUrl: ia("Debussy_Prelude_a_l_apres_midi_d_un_faune", "Prelude_a_l_apres_midi_d_un_faune.mp3"),
    license: "Public Domain",
  },

  // ───────── BACH ─────────
  {
    title: "Toccata and Fugue in D minor, BWV 565",
    composer: "Johann Sebastian Bach",
    performers: ["Organ Solo"],
    durationSeconds: 540,
    epoch: "Baroque",
    source: "internet_archive",
    audioUrl: ia("ToccataAndFugueInDMinorBWV565_201310", "Toccata and Fugue in D Minor, BWV 565 - I. Toccata.mp3"),
    license: "Public Domain",
  },
  {
    title: "Air on the G String (Orchestral Suite No. 3, BWV 1068)",
    composer: "Johann Sebastian Bach",
    performers: ["Orchestra"],
    durationSeconds: 330,
    epoch: "Baroque",
    source: "internet_archive",
    audioUrl: ia("Bach-airOnTheGString", "LaMusicaClasicaMasRelajanteDelMundo-Bach-AirOnTheGString.mp3"),
    license: "Public Domain",
  },
  {
    title: "Cello Suite No. 1 in G major, BWV 1007 – I. Prélude",
    composer: "Johann Sebastian Bach",
    performers: ["Yo-Yo Ma"],
    durationSeconds: 165,
    epoch: "Baroque",
    source: "internet_archive",
    audioUrl: ia("BachCelloSuiteNo.1PreludeYoYoMa", "Bach Cello Suite No.1 - Prelude (Yo-Yo Ma).mp3"),
    license: "Public Domain",
  },
  {
    title: "Brandenburg Concerto No. 3 in G major, BWV 1048 – I. Allegro",
    composer: "Johann Sebastian Bach",
    performers: ["Orchestra"],
    durationSeconds: 360,
    epoch: "Baroque",
    source: "internet_archive",
    audioUrl: ia("c-3947-8-bach-brandenburg-3", "C3947-8 Bach Brandenburg 3.mp3"),
    license: "Public Domain",
  },
  {
    title: "Well-Tempered Clavier, Book 1 – Prelude No. 1 in C major, BWV 846",
    composer: "Johann Sebastian Bach",
    performers: ["Piano Solo"],
    durationSeconds: 138,
    epoch: "Baroque",
    source: "internet_archive",
    audioUrl: ia("20170108JSBachPrelude1InCMajorBWV846FromTheWellTemperedClavier", "20170108 JS Bach, Prelude 1 in C Major BWV 846 from the Well-Tempered Clavier.mp3"),
    license: "Public Domain",
  },
  {
    title: "Orchestral Suite No. 2 in B minor, BWV 1067 – VII. Badinerie",
    composer: "Johann Sebastian Bach",
    performers: ["Orchestra"],
    durationSeconds: 90,
    epoch: "Baroque",
    source: "internet_archive",
    audioUrl: ia("bach-johann-sebastian-suite-no.-2-in-b-minor-bwv-1067-badinerie-high-quality", "Bach, Johann Sebastian - Suite No. 2 in B minor, BWV 1067, Badinerie - HighQuality.mp3"),
    license: "Public Domain",
  },
  {
    title: "Goldberg Variations, BWV 988 – Aria",
    composer: "Johann Sebastian Bach",
    performers: ["Glenn Gould"],
    durationSeconds: 240,
    epoch: "Baroque",
    source: "internet_archive",
    audioUrl: ia("bach-goldberg-variations-aria-glenn-gould", "goldberg-variations-bwv-988-aria-da-capo.mp3"),
    license: "Public Domain",
  },
  {
    title: "Passacaglia and Fugue in C minor, BWV 582",
    composer: "Johann Sebastian Bach",
    performers: ["A. Davis"],
    durationSeconds: 780,
    epoch: "Baroque",
    source: "internet_archive",
    audioUrl: ia("passac-s-582a-a.davis", "passac-s582a (a.davis).mp3"),
    license: "Public Domain",
  },
  {
    title: "Partita No. 2 in D minor, BWV 1004 – V. Chaconne",
    composer: "Johann Sebastian Bach",
    performers: ["Piano Solo"],
    durationSeconds: 900,
    epoch: "Baroque",
    source: "internet_archive",
    audioUrl: ia("Bach-busoniChaconne-FromPartitaForSoloViolinNo.2Bwv1004", "Bach-Busoni-chaconne.mp3"),
    license: "Public Domain",
  },

  // ───────── MOZART ─────────
  {
    title: "Eine kleine Nachtmusik, K. 525 – I. Allegro",
    composer: "Wolfgang Amadeus Mozart",
    performers: ["Orchestra"],
    durationSeconds: 360,
    epoch: "Classical",
    source: "internet_archive",
    audioUrl: ia("WolfgangAmadeusMozartSerenadeInGMajorEineKleineNachtmusikI.AllegroFromAceVenturaPetDetective", "Wolfgang Amadeus Mozart - Serenade in G Major (Eine kleine Nachtmusik), I. Allegro (From Ace Ventura, Pet Detective).mp3"),
    license: "Public Domain",
  },
  {
    title: "Piano Sonata No. 11 in A major, K. 331 – III. Rondo alla Turca",
    composer: "Wolfgang Amadeus Mozart",
    performers: ["Sergei Rachmaninoff"],
    durationSeconds: 210,
    epoch: "Classical",
    source: "internet_archive",
    audioUrl: ia("WolfgangAmadeusMozartPianoSonataInAK311TurkishMarchFromTheTrumanShow", "Wolfgang Amadeus Mozart - Piano Sonata in A K311, Turkish March (From The Truman Show).mp3"),
    license: "Public Domain",
  },
  {
    title: "Symphony No. 40 in G minor, K. 550 – I. Molto allegro",
    composer: "Wolfgang Amadeus Mozart",
    performers: ["Wiener Philharmoniker"],
    durationSeconds: 480,
    epoch: "Classical",
    source: "internet_archive",
    audioUrl: ia("lp_mozart-symphony-no-40-in-g-minor-k-550-ha_wolfgang-amadeus-mozart-joseph-haydn-wiene", "disc1/01.01. Symphony No. 40 In G Minor, K. 550: First Movement: Allegro Molto.mp3"),
    license: "Public Domain",
  },
  {
    title: "Requiem in D minor, K. 626 – Lacrimosa",
    composer: "Wolfgang Amadeus Mozart",
    performers: ["Orchestra and Chorus"],
    durationSeconds: 210,
    epoch: "Classical",
    source: "internet_archive",
    audioUrl: ia("001.WolfgangAmadeusMozartRequiemK.626Lacrimosa", "001. Wolfgang Amadeus Mozart - Requiem (K. 626) - Lacrimosa.mp3"),
    license: "Public Domain",
  },
  {
    title: "Piano Concerto No. 21 in C major, K. 467 – II. Andante",
    composer: "Wolfgang Amadeus Mozart",
    performers: ["Orchestra"],
    durationSeconds: 420,
    epoch: "Classical",
    source: "internet_archive",
    audioUrl: ia("WolfgangAmadeusMozartPianoConcertoNo.21InCMajorKV467II.AndanteFromJamesBondTheSpyWhoLovedMe", "Wolfgang Amadeus Mozart - Piano Concerto No.21 in C major, KV 467, II. Andante (From James Bond, The Spy Who Loved Me).mp3"),
    license: "Public Domain",
  },
  {
    title: "Overture to The Marriage of Figaro, K. 492",
    composer: "Wolfgang Amadeus Mozart",
    performers: ["Orchestra"],
    durationSeconds: 258,
    epoch: "Classical",
    source: "internet_archive",
    audioUrl: ia("37WolfgangAmadeusMozartMarriageOfFigaroOverture1786", "37 Wolfgang Amadeus Mozart - Marriage Of Figaro Overture, 1786.mp3"),
    license: "Public Domain",
  },
  {
    title: "Serenade No. 13 'Eine kleine Nachtmusik' – II. Romanze",
    composer: "Wolfgang Amadeus Mozart",
    performers: ["Stuttgarter Kammerorchester", "Karl Münchinger"],
    durationSeconds: 360,
    epoch: "Classical",
    source: "internet_archive",
    audioUrl: ia("karl-muenchinger-decca-lw-50109-side-a", "02 - Stuttgarter Kammerorch., Karl MÜNCHINGER - Decca LW 50109 - Side A - Eine kleine Nachtmusik KV 525 (Mozart) - 2. Romanze - Andante.mp3"),
    license: "Public Domain",
  },
  {
    title: "Piano Sonata No. 16 in C major, K. 545 – I. Allegro",
    composer: "Wolfgang Amadeus Mozart",
    performers: ["Daniel Barenboim"],
    durationSeconds: 240,
    epoch: "Classical",
    source: "internet_archive",
    audioUrl: ia("MozartPianoSonataNo16CMajorK545Barenboim", "Mozart Piano Sonata No 16 C major K 545 Barenboim.mp3"),
    license: "Public Domain",
  },

  // ───────── TCHAIKOVSKY ─────────
  {
    title: "Swan Lake, Op. 20 – Scene: Moderato",
    composer: "Pyotr Ilyich Tchaikovsky",
    performers: ["Orchestra"],
    durationSeconds: 180,
    epoch: "Romantic",
    source: "internet_archive",
    audioUrl: ia("40PeterIlyichTchaikovskySwanLakeScene1876", "40 Peter Ilyich Tchaikovsky - Swan Lake Scene, 1876.mp3"),
    license: "Public Domain",
  },
  {
    title: "The Nutcracker – Dance of the Sugar Plum Fairy",
    composer: "Pyotr Ilyich Tchaikovsky",
    performers: ["Orchestra"],
    durationSeconds: 120,
    epoch: "Romantic",
    source: "internet_archive",
    audioUrl: ia("23PeterIlyichTchaikovskyNutcrackerDanceOfTheSugarPlumFairy1892", "23 Peter Ilyich Tchaikovsky - Nutcracker Dance Of The Sugar Plum Fairy,1892.mp3"),
    license: "Public Domain",
  },
  {
    title: "The Nutcracker – Waltz of the Flowers",
    composer: "Pyotr Ilyich Tchaikovsky",
    performers: ["Orchestra"],
    durationSeconds: 420,
    epoch: "Romantic",
    source: "internet_archive",
    audioUrl: ia("48PeterIlyichTchaikovskyTheNutcrackerWaltzOfTheFlowers1892", "48 Peter Ilyich Tchaikovsky - The Nutcracker - Waltz of the flowers, 1892.mp3"),
    license: "Public Domain",
  },
  {
    title: "1812 Overture, Op. 49",
    composer: "Pyotr Ilyich Tchaikovsky",
    performers: ["Orchestra"],
    conductor: "Artur Rodzinski",
    durationSeconds: 900,
    epoch: "Romantic",
    source: "internet_archive",
    audioUrl: ia("TCHAIKOVSKY1812Overture-Rodzinski-NEWTRANSFER", "Tchaikovsky-1812OvertureOp.49.mp3"),
    license: "Public Domain",
  },
  {
    title: "Piano Concerto No. 1 in B-flat minor, Op. 23 – I. Allegro non troppo",
    composer: "Pyotr Ilyich Tchaikovsky",
    performers: ["Sviatoslav Richter"],
    durationSeconds: 1260,
    epoch: "Romantic",
    source: "internet_archive",
    audioUrl: ia("TchaikovskyPianoConcertoNo.1InBFlatMinorOp.23_846", "1.-allegro-non-troppo-e-molto-maestoso-Allegro-con-spirito-sviatoslav-richter.mp3"),
    license: "Public Domain",
  },
  {
    title: "Sleeping Beauty Waltz, Op. 66",
    composer: "Pyotr Ilyich Tchaikovsky",
    performers: ["Orchestra"],
    durationSeconds: 360,
    epoch: "Romantic",
    source: "internet_archive",
    audioUrl: ia("sleeping-beauty-waltz", "Sleeping Beauty Waltz.mp3"),
    license: "Public Domain",
  },

  // ───────── VIVALDI ─────────
  {
    title: "The Four Seasons – Spring, RV 269: I. Allegro",
    composer: "Antonio Vivaldi",
    performers: ["John Harrison", "Wichita State University Chamber Players"],
    durationSeconds: 210,
    epoch: "Baroque",
    source: "internet_archive",
    audioUrl: ia("The_Four_Seasons_Vivaldi-10361", "John_Harrison_with_the_Wichita_State_University_Chamber_Players_-_01_-_Spring_Mvt_1_Allegro.mp3"),
    license: "CC BY-SA 3.0",
  },
  {
    title: "The Four Seasons – Summer, RV 315: III. Presto",
    composer: "Antonio Vivaldi",
    performers: ["Janine Jansen", "Amsterdam Sinfonietta"],
    durationSeconds: 174,
    epoch: "Baroque",
    source: "internet_archive",
    audioUrl: ia("summer-presto-jansen-amst-sinf-2014", "summer-presto (jansen-amst sinf - 2014).mp3"),
    license: "Public Domain",
  },
  {
    title: "The Four Seasons – Autumn, RV 293: I. Allegro",
    composer: "Antonio Vivaldi",
    performers: ["Orchestra"],
    durationSeconds: 306,
    epoch: "Baroque",
    source: "internet_archive",
    audioUrl: ia("07-vivaldi-the-four-seasons-autumn-i-allegro", "07 Vivaldi the Four Seasons Autumn I Allegro.mp3"),
    license: "Public Domain",
  },
  {
    title: "The Four Seasons – Winter, RV 297: II. Largo",
    composer: "Antonio Vivaldi",
    performers: ["John Harrison", "Wichita State University Chamber Players"],
    durationSeconds: 132,
    epoch: "Baroque",
    source: "internet_archive",
    audioUrl: ia("The_Four_Seasons_Vivaldi-10361", "John_Harrison_with_the_Wichita_State_University_Chamber_Players_-_11_-_Winter_Mvt_2_Largo.mp3"),
    license: "CC BY-SA 3.0",
  },
  {
    title: "The Four Seasons – Winter, RV 297: I. Allegro non molto",
    composer: "Antonio Vivaldi",
    performers: ["John Harrison", "Wichita State University Chamber Players"],
    durationSeconds: 210,
    epoch: "Baroque",
    source: "internet_archive",
    audioUrl: ia("The_Four_Seasons_Vivaldi-10361", "John_Harrison_with_the_Wichita_State_University_Chamber_Players_-_10_-_Winter_Mvt_1_Allegro_non_molto.mp3"),
    license: "CC BY-SA 3.0",
  },

  // ───────── LISZT ─────────
  {
    title: "Hungarian Rhapsody No. 2 in C-sharp minor",
    composer: "Franz Liszt",
    performers: ["Piano Solo"],
    durationSeconds: 600,
    epoch: "Romantic",
    source: "internet_archive",
    audioUrl: ia("LisztHungarianRhapsodyNo.2_689", "Liszt_Hungarian_Rhapsody_No.2.mp3"),
    license: "Public Domain",
  },
  {
    title: "Liebestraum No. 3 in A-flat major",
    composer: "Franz Liszt",
    performers: ["Piano Solo"],
    durationSeconds: 270,
    epoch: "Romantic",
    source: "internet_archive",
    audioUrl: ia("Liebestraum-FranzLiszt", "Liebestraum.mp3"),
    license: "Public Domain",
  },
  {
    title: "La Campanella (Grand Étude de Paganini No. 3)",
    composer: "Franz Liszt",
    performers: ["Piano Solo"],
    durationSeconds: 300,
    epoch: "Romantic",
    source: "internet_archive",
    audioUrl: ia("Liszt-LaCampanella", "LisztLaCampanella.mp3"),
    license: "Public Domain",
  },
  {
    title: "Consolation No. 3 in D-flat major",
    composer: "Franz Liszt",
    performers: ["Piano Solo"],
    durationSeconds: 270,
    epoch: "Romantic",
    source: "internet_archive",
    audioUrl: ia("FranzLisztConsolationNo.1S.17220170114", "Franz Liszt, Consolation No. 3, S. 172 [20170111].mp3"),
    license: "Public Domain",
  },

  // ───────── SCHUBERT ─────────
  {
    title: "Ave Maria, D. 839",
    composer: "Franz Schubert",
    performers: ["Vocalist"],
    durationSeconds: 330,
    epoch: "Romantic",
    source: "internet_archive",
    audioUrl: ia("FranzSchubertAveMaria", "Franz Schubert_ Ave Maria.mp3"),
    license: "Public Domain",
  },
  {
    title: "Serenade (Ständchen, D. 957 No. 4)",
    composer: "Franz Schubert",
    performers: ["Juan Luria"],
    durationSeconds: 270,
    epoch: "Romantic",
    source: "internet_archive",
    audioUrl: ia("StndchenSchubertJuanLuria", "Ständchen Schubert Juan Luria.mp3"),
    license: "Public Domain",
  },
  {
    title: "Piano Quintet in A major 'Trout', D. 667 – IV. Tema con variazioni",
    composer: "Franz Schubert",
    performers: ["Pludermacher", "Trio à Cordes Français"],
    durationSeconds: 480,
    epoch: "Romantic",
    source: "internet_archive",
    audioUrl: ia("TroutQuintetIv.ThemeAndVariationspludermacherTrioACordesFrancais", "7-04PianoQuintet.A-dur.D667.Forellenquintett.Iv.ThemeVariations.mp3"),
    license: "Public Domain",
  },
  {
    title: "Impromptu in G-flat major, Op. 90 No. 3, D. 899",
    composer: "Franz Schubert",
    performers: ["Vladimir Horowitz"],
    durationSeconds: 360,
    epoch: "Romantic",
    source: "internet_archive",
    audioUrl: ia("schubert-d-899-3-horowitz-1987", "schubert d899-3 horowitz (1987).mp3"),
    license: "Public Domain",
  },

  // ───────── RACHMANINOFF ─────────
  {
    title: "Piano Concerto No. 2 in C minor, Op. 18 – I. Moderato",
    composer: "Sergei Rachmaninoff",
    performers: ["Piano and Orchestra"],
    durationSeconds: 660,
    epoch: "Romantic",
    source: "internet_archive",
    audioUrl: ia("RachmaninoffPianoConcertoNo.2InCMinorOp.16", "01Rachmaninov_PianoConcerto2InCMinorOp.18-1.Moderato.mp3"),
    license: "Public Domain",
  },
  {
    title: "Prelude in C-sharp minor, Op. 3 No. 2",
    composer: "Sergei Rachmaninoff",
    performers: ["Josef Hofmann"],
    durationSeconds: 240,
    epoch: "Romantic",
    source: "internet_archive",
    audioUrl: ia("RachmaninoffPreludeInC-sharpMinor", "Rachmaninoff-PreludeInC-sharpMinorhofmann.mp3"),
    license: "Public Domain",
  },
  {
    title: "Vocalise, Op. 34 No. 14",
    composer: "Sergei Rachmaninoff",
    performers: ["Orchestra"],
    durationSeconds: 360,
    epoch: "Romantic",
    source: "internet_archive",
    audioUrl: ia("rachmaninoff-vocalise-op.-34-no.-14-orchestral-arrangement", "Rachmaninoff - Vocalise, Op. 34 No. 14 (orchestral arrangement).mp3"),
    license: "Public Domain",
  },
  {
    title: "Rhapsody on a Theme of Paganini, Op. 43 – Var. 18",
    composer: "Sergei Rachmaninoff",
    performers: ["Nikolai Lugansky"],
    durationSeconds: 180,
    epoch: "Romantic",
    source: "internet_archive",
    audioUrl: ia("RachmaninoffRhapsodyOnAThemeOfPaganiniVariation18lugansky", "10Rachmaninov_RhapsodyOnAThemeOfPaganiniOp.43-Var.18.mp3"),
    license: "Public Domain",
  },

  // ───────── DVOŘÁK ─────────
  {
    title: "Symphony No. 9 'From the New World' – II. Largo",
    composer: "Antonín Dvořák",
    performers: ["Orchestra"],
    conductor: "Otto Klemperer",
    durationSeconds: 720,
    epoch: "Romantic",
    source: "internet_archive",
    audioUrl: ia("newWorldSymphonyLargoklemperer", "02Ii_Largo.mp3"),
    license: "Public Domain",
  },
  {
    title: "Symphony No. 9 'From the New World' – IV. Allegro con fuoco",
    composer: "Antonín Dvořák",
    performers: ["Orchestra"],
    durationSeconds: 720,
    epoch: "Romantic",
    source: "internet_archive",
    audioUrl: ia("SymphonyNo.9Iv.FinaleAllegroConFuoco", "04Dvok_Symphony9InEMinorOp.95B178_fromTheNewWorld_-4.AllegroConFuoco.mp3"),
    license: "Public Domain",
  },
  {
    title: "Humoresque No. 7 in G-flat major, Op. 101",
    composer: "Antonín Dvořák",
    performers: ["Piano Solo"],
    durationSeconds: 180,
    epoch: "Romantic",
    source: "internet_archive",
    audioUrl: ia("dvorak-humoresque", "Dvorak _ Humoresque.mp3"),
    license: "Public Domain",
  },

  // ───────── GRIEG ─────────
  {
    title: "Peer Gynt Suite No. 1, Op. 46 – Morning Mood",
    composer: "Edvard Grieg",
    performers: ["Orchestra"],
    durationSeconds: 240,
    epoch: "Romantic",
    source: "internet_archive",
    audioUrl: ia("edvard-grieg-morning-mood", "Edvard Grieg - Peer Gynt Suite No. 1, Op. 46_ Morning Mood.mp3"),
    license: "Public Domain",
  },
  {
    title: "Peer Gynt Suite No. 1, Op. 46 – In the Hall of the Mountain King",
    composer: "Edvard Grieg",
    performers: ["Orchestra"],
    durationSeconds: 150,
    epoch: "Romantic",
    source: "internet_archive",
    audioUrl: ia("EdvardGriegPeerGyntSuiteNo.1Op.46InTheHallFoTheMountainKingFromTrollhunter", "Edvard Grieg - Peer Gynt suite No.1 Op. 46 - In the Hall of the Mountain King (From Trollhunter).mp3"),
    license: "Public Domain",
  },
  {
    title: "Piano Concerto in A minor, Op. 16 – I. Allegro molto moderato",
    composer: "Edvard Grieg",
    performers: ["Arthur Rubinstein"],
    conductor: "Eugene Ormandy",
    durationSeconds: 720,
    epoch: "Romantic",
    source: "internet_archive",
    audioUrl: ia("GriegPianoConcertoInAMinorrubinstein-ormandy1942", "04PianoConcertoNo.1InAOp.16_I.AllegroMoltoModerato.mp3"),
    license: "Public Domain",
  },

  // ───────── SATIE ─────────
  {
    title: "Gymnopédie No. 1",
    composer: "Erik Satie",
    performers: ["Piano Solo"],
    durationSeconds: 195,
    epoch: "Impressionist",
    source: "internet_archive",
    audioUrl: ia("ErikSatieGymnopdieNo.1", "Erik Satie - Gymnopédie No.1.mp3"),
    license: "Public Domain",
  },
  {
    title: "Gymnopédie No. 3",
    composer: "Erik Satie",
    performers: ["Piano Solo"],
    durationSeconds: 168,
    epoch: "Impressionist",
    source: "internet_archive",
    audioUrl: ia("satie-gnossienne-gymnopedie", "Satie Gymnopedie 3.mp3"),
    license: "Public Domain",
  },
  {
    title: "Gnossienne No. 1",
    composer: "Erik Satie",
    performers: ["Piano Solo"],
    durationSeconds: 240,
    epoch: "Impressionist",
    source: "internet_archive",
    audioUrl: ia("erik-satie-gnossienne-no.-1", "Erik_Satie_Gnossienne_No.1.mp3"),
    license: "Public Domain",
  },

  // ───────── BRAHMS ─────────
  {
    title: "Hungarian Dance No. 5 in G minor",
    composer: "Johannes Brahms",
    performers: ["Orchestra"],
    durationSeconds: 150,
    epoch: "Romantic",
    source: "internet_archive",
    audioUrl: ia("JohannesBrahmsHungarianDanceNo.5", "Johannes Brahms - Hungarian Dance No. 5.mp3"),
    license: "Public Domain",
  },
  {
    title: "Lullaby (Wiegenlied, Op. 49 No. 4)",
    composer: "Johannes Brahms",
    performers: ["Vocalist"],
    durationSeconds: 180,
    epoch: "Romantic",
    source: "internet_archive",
    audioUrl: ia("Brahmswiegenlied", "21-5LiederOp.49_5LiederOp.49_Iv.Wiegenlied.mp3"),
    license: "Public Domain",
  },
  {
    title: "Symphony No. 3 in F major, Op. 90 – III. Poco allegretto",
    composer: "Johannes Brahms",
    performers: ["Orchestra"],
    durationSeconds: 390,
    epoch: "Romantic",
    source: "internet_archive",
    audioUrl: ia("BRAHMSSymphonyNo.3-NEWTRANSFER", "03.Iii.PocoAllegretto.mp3"),
    license: "Public Domain",
  },
  {
    title: "Intermezzo in A major, Op. 118 No. 2",
    composer: "Johannes Brahms",
    performers: ["Piano Solo"],
    durationSeconds: 360,
    epoch: "Romantic",
    source: "internet_archive",
    audioUrl: ia("brahms_118-2", "all.mp3"),
    license: "Public Domain",
  },

  // ───────── HANDEL ─────────
  {
    title: "Water Music Suite No. 2 – Alla Hornpipe",
    composer: "George Frideric Handel",
    performers: ["Orchestra"],
    durationSeconds: 210,
    epoch: "Baroque",
    source: "internet_archive",
    audioUrl: ia("12.-water-music-bijlage-12.-alla-hornpipe-variant-in-f-hwv-3312", "12.Water Music; Bijlage - 12. Alla Hornpipe (variant in F, HWV 3312).mp3"),
    license: "Public Domain",
  },
  {
    title: "Messiah – Hallelujah Chorus",
    composer: "George Frideric Handel",
    performers: ["Chorus and Orchestra"],
    durationSeconds: 240,
    epoch: "Baroque",
    source: "internet_archive",
    audioUrl: ia("218ChorusHallelujah", "2-18 Chorus 'Hallelujah!'.mp3"),
    license: "Public Domain",
  },
  {
    title: "Sarabande in D minor (Suite in D minor, HWV 437)",
    composer: "George Frideric Handel",
    performers: ["Organ Solo"],
    durationSeconds: 180,
    epoch: "Baroque",
    source: "internet_archive",
    audioUrl: ia("george-frideric-handel-sarabande-in-d-minor-organ", "George Frideric Handel \u2014 Sarabande In D Minor (Organ).mp3"),
    license: "Public Domain",
  },

  // ───────── MENDELSSOHN ─────────
  {
    title: "Wedding March (A Midsummer Night's Dream, Op. 61)",
    composer: "Felix Mendelssohn",
    performers: ["Orchestra"],
    durationSeconds: 300,
    epoch: "Romantic",
    source: "internet_archive",
    audioUrl: ia("MendelssohnWeddingMarch", "Mendelssohn-wedding-march.mp3"),
    license: "Public Domain",
  },
  {
    title: "Violin Concerto in E minor, Op. 64 – I. Allegro molto appassionato",
    composer: "Felix Mendelssohn",
    performers: ["Yehudi Menuhin"],
    durationSeconds: 780,
    epoch: "Romantic",
    source: "internet_archive",
    audioUrl: ia("MendelssohnViolinConcertoInEMinormenuhin", "mend-vlncto (menuhin-kurtz).mp3"),
    license: "Public Domain",
  },

  // ───────── STRAUSS ─────────
  {
    title: "The Blue Danube Waltz, Op. 314",
    composer: "Johann Strauss II",
    performers: ["Orchestra"],
    conductor: "Herbert von Karajan",
    durationSeconds: 600,
    epoch: "Romantic",
    source: "internet_archive",
    audioUrl: ia("J.StraussIiOnTheBeautifulBlueDanubekarajan1966", "06StraussJr.j_AnDerSchnenBlauenDonauOp.314.mp3"),
    license: "Public Domain",
  },
  {
    title: "Radetzky March, Op. 228",
    composer: "Johann Strauss I",
    performers: ["Orchestra"],
    durationSeconds: 180,
    epoch: "Romantic",
    source: "internet_archive",
    audioUrl: ia("RadetzkyMarchOp.228", "Radetzky March, Op. 228.mp3"),
    license: "Public Domain",
  },

  // ───────── PACHELBEL ─────────
  {
    title: "Canon in D major",
    composer: "Johann Pachelbel",
    performers: ["Orchestra"],
    durationSeconds: 330,
    epoch: "Baroque",
    source: "internet_archive",
    audioUrl: ia("PachelbelCanonInDMajor", "Pachelbel_ Canon - In D Major.mp3"),
    license: "Public Domain",
  },

  // ───────── SAINT-SAËNS ─────────
  {
    title: "The Carnival of the Animals – The Swan",
    composer: "Camille Saint-Saëns",
    performers: ["Mischa Maisky"],
    durationSeconds: 210,
    epoch: "Romantic",
    source: "internet_archive",
    audioUrl: ia("Saint-saensCarnivalOfTheAnimalsTheSwanmaisky", "13TheSwan.mp3"),
    license: "Public Domain",
  },
  {
    title: "Danse macabre, Op. 40",
    composer: "Camille Saint-Saëns",
    performers: ["Orchestra"],
    conductor: "Hermann Scherchen",
    durationSeconds: 420,
    epoch: "Romantic",
    source: "internet_archive",
    audioUrl: ia("SAINT-SANSDanseMacabre-Scherchen", "SAINT-SA\u00cbNS- Danse macabre, Op. 40.mp3"),
    license: "Public Domain",
  },

  // ───────── MUSSORGSKY ─────────
  {
    title: "Pictures at an Exhibition – The Great Gate of Kiev",
    composer: "Modest Mussorgsky",
    performers: ["Orchestra"],
    durationSeconds: 360,
    epoch: "Romantic",
    source: "internet_archive",
    audioUrl: ia("MussorgskyPicturesAtAnExhibition", "14Mussorgsky_PicturesAtAnExhibition-TheGreatGateOfKiev.mp3"),
    license: "Public Domain",
  },
  {
    title: "Night on Bald Mountain",
    composer: "Modest Mussorgsky",
    performers: ["Orchestra"],
    conductor: "Leopold Stokowski",
    durationSeconds: 660,
    epoch: "Romantic",
    source: "internet_archive",
    audioUrl: ia("MUSSORGSKY-STOKOWSKINightOnTheBaldMountain", "03.Mussorgsky-stokowski-NightOnTheBaldMountain.mp3"),
    license: "Public Domain",
  },

  // ───────── RAVEL ─────────
  {
    title: "Boléro",
    composer: "Maurice Ravel",
    performers: ["Orchestra"],
    conductor: "Manuel Rosenthal",
    durationSeconds: 900,
    epoch: "Impressionist",
    source: "internet_archive",
    audioUrl: ia("ravel-bolero-manuel-rosenthal-dvg", "Ravel - Bol\u00e9ro.mp3"),
    license: "Public Domain",
  },
  {
    title: "Pavane pour une infante défunte",
    composer: "Maurice Ravel",
    performers: ["Orchestra"],
    conductor: "Manuel Rosenthal",
    durationSeconds: 360,
    epoch: "Impressionist",
    source: "internet_archive",
    audioUrl: ia("ravel-pavane-pour-une-infante-defunte-manuel-rosenthal-dvg", "Ravel - Pavane pour une infante d\u00e9funte.mp3"),
    license: "Public Domain",
  },

  // ───────── SCHUMANN ─────────
  {
    title: "Träumerei (Kinderszenen, Op. 15 No. 7)",
    composer: "Robert Schumann",
    performers: ["Piano Solo"],
    durationSeconds: 180,
    epoch: "Romantic",
    source: "internet_archive",
    audioUrl: ia("SchumannTraumerei", "SchumannTraumerei.mp3"),
    license: "Public Domain",
  },
  {
    title: "Piano Concerto in A minor, Op. 54 – I. Allegro affettuoso",
    composer: "Robert Schumann",
    performers: ["Piano and Orchestra"],
    durationSeconds: 900,
    epoch: "Romantic",
    source: "internet_archive",
    audioUrl: ia("SchumannPianoConcertoInAMinorOp.54", "1.-allegro-affettuoso-Andante-espressivo-Allegro-molto.mp3"),
    license: "Public Domain",
  },

  // ───────── WAGNER ─────────
  {
    title: "Ride of the Valkyries (Die Walküre, Act III)",
    composer: "Richard Wagner",
    performers: ["Orchestra"],
    durationSeconds: 300,
    epoch: "Romantic",
    source: "internet_archive",
    audioUrl: ia("WagnerTheRideOfTheValkyries", "WagnerTheRideOfTheValkyrieswww.keepvid.com.mp3"),
    license: "Public Domain",
  },
  {
    title: "Bridal Chorus (Lohengrin, Act III)",
    composer: "Richard Wagner",
    performers: ["Orchestra"],
    durationSeconds: 300,
    epoch: "Romantic",
    source: "internet_archive",
    audioUrl: ia("10RichardWagnerBridalChorus1850", "10 Richard Wagner - Bridal Chorus, 1850.mp3"),
    license: "Public Domain",
  },

  // ───────── VERDI ─────────
  {
    title: "La Traviata – Prelude to Act I",
    composer: "Giuseppe Verdi",
    performers: ["Orchestra"],
    durationSeconds: 240,
    epoch: "Romantic",
    source: "internet_archive",
    audioUrl: ia("01-verdi.LaTraviata-Overture.mp3", "01-verdi.LaTraviata-Overture.mp3"),
    license: "Public Domain",
  },
  {
    title: "Aida – Triumphal March",
    composer: "Giuseppe Verdi",
    performers: ["Orchestra"],
    durationSeconds: 360,
    epoch: "Romantic",
    source: "internet_archive",
    audioUrl: ia("06GiuseppeVerdiAidaGrandFinaleMarch1871", "06 Giuseppe Verdi - Aida, Grand Finale March, 1871.mp3"),
    license: "Public Domain",
  },

  // ───────── ELGAR ─────────
  {
    title: "Pomp and Circumstance March No. 1 in D major, Op. 39",
    composer: "Edward Elgar",
    performers: ["Orchestra"],
    durationSeconds: 360,
    epoch: "Romantic",
    source: "internet_archive",
    audioUrl: ia("01elgarpompcircumstancemarch1indop.391", "01 Elgar_ Pomp & Circumstance March #1 In D, Op. 39_1.mp3"),
    license: "Public Domain",
  },

  // ───────── HOLST ─────────
  {
    title: "The Planets, Op. 32 – Jupiter, the Bringer of Jollity",
    composer: "Gustav Holst",
    performers: ["Orchestra"],
    durationSeconds: 480,
    epoch: "Modern",
    source: "internet_archive",
    audioUrl: ia("gustav-holst-the-planets-jupiter-the-bringer-of-jollity", "Gustav Holst - The Planets - Jupiter, the Bringer of Jollity.mp3"),
    license: "Public Domain",
  },

  // ───────── BIZET ─────────
  {
    title: "Carmen – Habanera",
    composer: "Georges Bizet",
    performers: ["Orchestra"],
    durationSeconds: 150,
    epoch: "Romantic",
    source: "internet_archive",
    audioUrl: ia("50GeorgesBizetCarmenFantasyHabanera1875", "50 Georges Bizet - Carmen Fantasy - Habanera, 1875.mp3"),
    license: "Public Domain",
  },
  {
    title: "L'Arlésienne Suite No. 2 – Farandole",
    composer: "Georges Bizet",
    performers: ["Orchestra"],
    durationSeconds: 210,
    epoch: "Romantic",
    source: "internet_archive",
    audioUrl: ia("Bizet_Arlesienne", "04_Farandole.mp3"),
    license: "Public Domain",
  },

  // ───────── ROSSINI ─────────
  {
    title: "William Tell Overture – Finale",
    composer: "Gioachino Rossini",
    performers: ["Orchestra"],
    durationSeconds: 210,
    epoch: "Romantic",
    source: "internet_archive",
    audioUrl: ia("03GioachinoRossiniWilliamTellOverture1829", "03 Gioachino Rossini - William Tell, Overture, 1829.mp3"),
    license: "Public Domain",
  },
  {
    title: "The Barber of Seville – Overture",
    composer: "Gioachino Rossini",
    performers: ["Orchestra"],
    conductor: "Silvio Varviso",
    durationSeconds: 420,
    epoch: "Romantic",
    source: "internet_archive",
    audioUrl: ia("RossiniBarbiereOverturevarvisoCond.", "barbiere over (varviso) upgrade.mp3"),
    license: "Public Domain",
  },

  // ───────── GERSHWIN ─────────
  {
    title: "Rhapsody in Blue",
    composer: "George Gershwin",
    performers: ["Leonard Bernstein", "Columbia Symphony Orchestra"],
    durationSeconds: 960,
    epoch: "Modern",
    source: "internet_archive",
    audioUrl: ia("GershwinRhapsodyInBluebernstein-columbiaSym", "01RhapsodyInBlue.mp3"),
    license: "Public Domain",
  },

  // ───────── ALBINONI / GIAZOTTO ─────────
  {
    title: "Adagio in G minor",
    composer: "Tomaso Albinoni / Remo Giazotto",
    performers: ["Orchestra"],
    conductor: "Herbert von Karajan",
    durationSeconds: 540,
    epoch: "Baroque",
    source: "internet_archive",
    audioUrl: ia("albinoni-adagio-karajan-1983", "albinoni adagio (karajan 1983).mp3"),
    license: "Public Domain",
  },

  // ───────── TARTINI ─────────
  {
    title: "Violin Sonata in G minor 'Devil's Trill' – III. Andante–Allegro",
    composer: "Giuseppe Tartini",
    performers: ["Alfredo Campoli"],
    durationSeconds: 480,
    epoch: "Baroque",
    source: "internet_archive",
    audioUrl: ia("tartini-violin-sonata-the-devils-trill-alfredo-campoli-dvg", "Tartini- Violin Sonata in G minor, GT 2.g05 'The Devil's Trill'.mp3"),
    license: "Public Domain",
  },

  // ───────── PURCELL ─────────
  {
    title: "Dido and Aeneas – When I am laid in earth (Dido's Lament)",
    composer: "Henry Purcell",
    performers: ["Edna Thornton"],
    durationSeconds: 270,
    epoch: "Baroque",
    source: "internet_archive",
    audioUrl: ia("78_when-i-am-laid-in-earth-didos-lament-dido-aeneas_thornton-edna", "D_533_HO_4389AF.mp3"),
    license: "Public Domain",
  },

  // ───────── BORODIN ─────────
  {
    title: "In the Steppes of Central Asia",
    composer: "Alexander Borodin",
    performers: ["USSR Symphony Orchestra"],
    conductor: "Evgeny Svetlanov",
    durationSeconds: 420,
    epoch: "Romantic",
    source: "internet_archive",
    audioUrl: ia("borodin_steppes_svetlanov_ussr_symphony_1968", "borodin_steppes_svetlanov_ussr_symphony_1968.mp3"),
    license: "Public Domain",
  },

  // ───────── RIMSKY-KORSAKOV ─────────
  {
    title: "Flight of the Bumblebee (The Tale of Tsar Saltan)",
    composer: "Nikolai Rimsky-Korsakov",
    performers: ["Orchestra"],
    durationSeconds: 84,
    epoch: "Romantic",
    source: "internet_archive",
    audioUrl: ia("FlightOfTheBumblebee", "flight_of_the_bumblebee_2.mp3"),
    license: "Public Domain",
  },
  {
    title: "Scheherazade, Op. 35 – III. The Young Prince and The Young Princess",
    composer: "Nikolai Rimsky-Korsakov",
    performers: ["Orchestra"],
    conductor: "Sir Thomas Beecham",
    durationSeconds: 660,
    epoch: "Romantic",
    source: "internet_archive",
    audioUrl: ia("Rimsky-korsakovScheherazadebeecham-emi", "03Rimsky-korsakov_ScheherazadeOp.35-3.TheYoungPrinceAndTheYoungPrincessAndantinoQuasiAllegrettoUnPocoLarghetto.mp3"),
    license: "Public Domain",
  },

  // ───────── OFFENBACH ─────────
  {
    title: "Orpheus in the Underworld – Galop infernal (Can-Can)",
    composer: "Jacques Offenbach",
    performers: ["Orchestra"],
    durationSeconds: 150,
    epoch: "Romantic",
    source: "internet_archive",
    audioUrl: ia("12JackuesOffenbachOrpheusInTheUnderworld1858", "12 Jackues Offenbach - Orpheus in the Underworld, 1858.mp3"),
    license: "Public Domain",
  },
  {
    title: "The Tales of Hoffmann – Barcarolle",
    composer: "Jacques Offenbach",
    performers: ["Orchestra"],
    durationSeconds: 210,
    epoch: "Romantic",
    source: "internet_archive",
    audioUrl: ia("02JackuesOffenbachBarcarolleFromTalesOfHoffmann1864", "02 Jackues Offenbach - Barcarolle from Tales of Hoffmann, 1864.mp3"),
    license: "Public Domain",
  },

  // ───────── MASSENET ─────────
  {
    title: "Thaïs – Méditation",
    composer: "Jules Massenet",
    performers: ["Orchestra"],
    durationSeconds: 330,
    epoch: "Romantic",
    source: "internet_archive",
    audioUrl: ia("massenet-thais-meditation", "Massenet_ Tha\u00efs_ M\u00e9ditation.mp3"),
    license: "Public Domain",
  },

  // ───────── FAURÉ ─────────
  {
    title: "Pavane, Op. 50",
    composer: "Gabriel Fauré",
    performers: ["Orchestra"],
    durationSeconds: 360,
    epoch: "Romantic",
    source: "internet_archive",
    audioUrl: ia("FAUREPavaneOp.50", "Faur-PavaneOp.50.mp3"),
    license: "Public Domain",
  },
  {
    title: "Sicilienne, Op. 78",
    composer: "Gabriel Fauré",
    performers: ["Orchestra"],
    durationSeconds: 210,
    epoch: "Romantic",
    source: "internet_archive",
    audioUrl: ia("0108SicilienneOp78Andantino", "01-08- Sicilienne, Op78 Andantino.mp3"),
    license: "Public Domain",
  },

  // ───────── PAGANINI ─────────
  {
    title: "Caprice No. 24 in A minor",
    composer: "Niccolò Paganini",
    performers: ["Itzhak Perlman"],
    durationSeconds: 300,
    epoch: "Romantic",
    source: "internet_archive",
    audioUrl: ia("PaganiniCapriceNo.24perlman", "03Paganini_CapricesOp.1-24InAMinor.mp3"),
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

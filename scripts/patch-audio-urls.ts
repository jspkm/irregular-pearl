/**
 * Patch script – updates ALL audioUrl fields in existing Firestore "tracks"
 * documents to use Internet Archive MP3 URLs instead of Wikimedia OGG.
 * Matches tracks by title and updates audioUrl + source.
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

/** Internet Archive direct file URL */
function ia(item: string, file: string): string {
  return `https://archive.org/download/${item}/${encodeURIComponent(file)}`;
}

/** Wikimedia Commons Special:FilePath shorthand */
function wm(filename: string): string {
  return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(filename)}`;
}

/* ── Canonical URL map: title → { audioUrl, source } ── */

const CANONICAL: Record<string, { audioUrl: string; source: string }> = {
  // ───────── BEETHOVEN ─────────
  "Für Elise (Bagatelle No. 25 in A minor, WoO 59)": {
    audioUrl: ia("WoO59PocoMotoBagatelleInAMinorFurElise", "FrEliseWoo59.mp3"),
    source: "internet_archive",
  },
  "Symphony No. 5 in C minor, Op. 67 – I. Allegro con brio": {
    audioUrl: ia("LudwigVanBeethovenSymphonyNo.5Op.67I.AllegroConBrioFromAustinPowersGoldmember", "Ludwig van Beethoven - Symphony No. 5, Op. 67, I. Allegro con brio (From Austin Powers, Goldmember).mp3"),
    source: "internet_archive",
  },
  "Symphony No. 5 in C minor, Op. 67 – IV. Allegro": {
    audioUrl: ia("lp_beethoven-symphony-no-5-in-c-minor-op-67_philharmonic-symphony-of-london-artur-rodz", "disc1/02.01. Allegro; Allegro (Concl.).mp3"),
    source: "internet_archive",
  },
  "Moonlight Sonata, Op. 27 No. 2 – I. Adagio sostenuto": {
    audioUrl: ia("LudwigVanBeethovenPianoSonataNo.14InCSharpMinorOp.27No.2MoonlightI.AdagioSostenutoFromCrimsonTide", "Ludwig van Beethoven - Piano Sonata No.14 in C-sharp minor, Op.27 No.2 (Moonlight), I. Adagio sostenuto (From Crimson Tide).mp3"),
    source: "internet_archive",
  },
  "Moonlight Sonata, Op. 27 No. 2 – III. Presto agitato": {
    audioUrl: ia("78_moonlight-sonata-part-3-presto-agitato-pt1_howard-jones-evlyn", "9095_WAX_1335-3.mp3"),
    source: "internet_archive",
  },
  "Piano Sonata No. 8 'Pathétique', Op. 13 – II. Adagio cantabile": {
    audioUrl: ia("78_adagio-ur-sonate-pathtique_marjorie-hayward-beethoven_gbia7017667a", 'Adagio ur "Sonate Pathêtique" - MARJORIE HAYWARD.mp3'),
    source: "internet_archive",
  },
  "32 Variations in C minor, WoO 80": {
    audioUrl: ia("lp_gilels-plays-beethoven-emperor-concerto-an_ludwig-van-beethoven-emil-gilels", "disc1/02.02. BAnd 3: 32 Variations in C minor, op. 191.mp3"),
    source: "internet_archive",
  },
  "Piano Concerto No. 5 'Emperor', Op. 73 – II. Adagio un poco mosso": {
    audioUrl: ia("BeethovenPianoConcertoNo.5emperormoiseivitch", "2.Ii.AdagioIii.Rondo.mp3"),
    source: "internet_archive",
  },
  "Symphony No. 9 – IV. Ode to Joy (excerpt)": {
    audioUrl: ia("lp_beethoven-ode-to-joy_arturo-toscanini-nbc-symphony-orchestra", "disc1/02.01. Fourth Movement: Allegro Assai Vivace; Allegro Ma Non Tanto (Concluded).mp3"),
    source: "internet_archive",
  },

  // ───────── CHOPIN ─────────
  "Nocturne in E-flat major, Op. 9 No. 2": {
    audioUrl: ia("FredericChopinNocturneNo.2InEFlatMajorOp.9No.2FromBlueLagoon", "Frederic Chopin - Nocturne No. 2 In E Flat Major Op.9 No.2 (From Blue Lagoon).mp3"),
    source: "internet_archive",
  },
  "Ballade No. 1 in G minor, Op. 23": {
    audioUrl: ia("FredericChopinBalladeNo.1InGMinorOp.23FromThePianist", "Frederic Chopin - Ballade No. 1 in G minor, Op. 23 (From The Pianist).mp3"),
    source: "internet_archive",
  },
  "Étude Op. 10, No. 3 'Tristesse'": {
    audioUrl: ia("ChopinEtudeOp.10No.3", "tristesse.mp3"),
    source: "internet_archive",
  },
  "Waltz in D-flat major, Op. 64 No. 1 'Minute Waltz'": {
    audioUrl: ia("39FredericChopinWaltzInDFlatMinorMinute1847", '39 Frederic Chopin - Waltz in D Flat Minor \u201CMinute\u201D, 1847.mp3'),
    source: "internet_archive",
  },
  "Prelude in D-flat major, Op. 28 No. 15 'Raindrop'": {
    audioUrl: ia("ChopinPreludiumDesDur", "Chopin Preludium Des dur.mp3"),
    source: "internet_archive",
  },
  "Polonaise in A-flat major, Op. 53 'Heroic'": {
    audioUrl: ia("FredericChopinPolonaiseNo.6InAFlatMajorOp.53", "FredericChopinPolonaiseNo.6InAFlatMajorOp.53.mp3"),
    source: "internet_archive",
  },
  "Fantaisie-Impromptu in C-sharp minor, Op. 66": {
    audioUrl: ia("ChopinFantaisie-impromptuOp66", "ChopinFantaisie-impromptuOp66.mp3"),
    source: "internet_archive",
  },
  "Nocturne in C-sharp minor, Op. posth.": {
    audioUrl: ia("sundaychopin", "Nocturne B. 49 in C sharp minor 'Lento con gran espressione' (1).mp3"),
    source: "internet_archive",
  },
  "Scherzo No. 2 in B-flat minor, Op. 31": {
    audioUrl: ia("chopin-op-31-ar-1932", "chopin op31 AR1932.mp3"),
    source: "internet_archive",
  },
  "Étude Op. 25, No. 11 'Winter Wind'": {
    audioUrl: ia("47.FredericChopinWinterWind1836", "47. Frederic Chopin - Winter Wind, 1836.mp3"),
    source: "internet_archive",
  },

  // ───────── DEBUSSY ─────────
  "Clair de lune (Suite bergamasque)": {
    audioUrl: ia("ClairDeLunedebussy", "2009-03-30-clairdelune.mp3"),
    source: "internet_archive",
  },
  "Arabesque No. 1 in E major": {
    audioUrl: ia("DebussyArabesqueNo.1AndNo.2", "Debussy - Arabesque No.1 and No.2.mp3"),
    source: "internet_archive",
  },
  "Rêverie": {
    audioUrl: ia("DebussyReverie", "Debussy Reverie.mp3"),
    source: "internet_archive",
  },
  "Prélude à l'après-midi d'un faune": {
    audioUrl: ia("Debussy_Prelude_a_l_apres_midi_d_un_faune", "Prelude_a_l_apres_midi_d_un_faune.mp3"),
    source: "internet_archive",
  },

  // ───────── BACH ─────────
  "Toccata and Fugue in D minor, BWV 565": {
    audioUrl: ia("ToccataAndFugueInDMinorBWV565_201310", "Toccata and Fugue in D Minor, BWV 565 - I. Toccata.mp3"),
    source: "internet_archive",
  },
  "Air on the G String (Orchestral Suite No. 3, BWV 1068)": {
    audioUrl: ia("Bach-airOnTheGString", "LaMusicaClasicaMasRelajanteDelMundo-Bach-AirOnTheGString.mp3"),
    source: "internet_archive",
  },
  "Cello Suite No. 1 in G major, BWV 1007 – I. Prélude": {
    audioUrl: ia("BachCelloSuiteNo.1PreludeYoYoMa", "Bach Cello Suite No.1 - Prelude (Yo-Yo Ma).mp3"),
    source: "internet_archive",
  },
  "Brandenburg Concerto No. 3 in G major, BWV 1048 – I. Allegro": {
    audioUrl: ia("c-3947-8-bach-brandenburg-3", "C3947-8 Bach Brandenburg 3.mp3"),
    source: "internet_archive",
  },
  "Well-Tempered Clavier, Book 1 – Prelude No. 1 in C major, BWV 846": {
    audioUrl: ia("20170108JSBachPrelude1InCMajorBWV846FromTheWellTemperedClavier", "20170108 JS Bach, Prelude 1 in C Major BWV 846 from the Well-Tempered Clavier.mp3"),
    source: "internet_archive",
  },
  "Orchestral Suite No. 2 in B minor, BWV 1067 – VII. Badinerie": {
    audioUrl: ia("bach-johann-sebastian-suite-no.-2-in-b-minor-bwv-1067-badinerie-high-quality", "Bach, Johann Sebastian - Suite No. 2 in B minor, BWV 1067, Badinerie - HighQuality.mp3"),
    source: "internet_archive",
  },
  "Goldberg Variations, BWV 988 – Aria": {
    audioUrl: ia("bach-goldberg-variations-aria-glenn-gould", "goldberg-variations-bwv-988-aria-da-capo.mp3"),
    source: "internet_archive",
  },
  "Passacaglia and Fugue in C minor, BWV 582": {
    audioUrl: ia("passac-s-582a-a.davis", "passac-s582a (a.davis).mp3"),
    source: "internet_archive",
  },
  "Partita No. 2 in D minor, BWV 1004 – V. Chaconne": {
    audioUrl: ia("Bach-busoniChaconne-FromPartitaForSoloViolinNo.2Bwv1004", "Bach-Busoni-chaconne.mp3"),
    source: "internet_archive",
  },

  // ───────── MOZART ─────────
  "Eine kleine Nachtmusik, K. 525 – I. Allegro": {
    audioUrl: ia("WolfgangAmadeusMozartSerenadeInGMajorEineKleineNachtmusikI.AllegroFromAceVenturaPetDetective", "Wolfgang Amadeus Mozart - Serenade in G Major (Eine kleine Nachtmusik), I. Allegro (From Ace Ventura, Pet Detective).mp3"),
    source: "internet_archive",
  },
  "Piano Sonata No. 11 in A major, K. 331 – III. Rondo alla Turca": {
    audioUrl: ia("WolfgangAmadeusMozartPianoSonataInAK311TurkishMarchFromTheTrumanShow", "Wolfgang Amadeus Mozart - Piano Sonata in A K311, Turkish March (From The Truman Show).mp3"),
    source: "internet_archive",
  },
  "Symphony No. 40 in G minor, K. 550 – I. Molto allegro": {
    audioUrl: ia("lp_mozart-symphony-no-40-in-g-minor-k-550-ha_wolfgang-amadeus-mozart-joseph-haydn-wiene", "disc1/01.01. Symphony No. 40 In G Minor, K. 550: First Movement: Allegro Molto.mp3"),
    source: "internet_archive",
  },
  "Requiem in D minor, K. 626 – Lacrimosa": {
    audioUrl: ia("001.WolfgangAmadeusMozartRequiemK.626Lacrimosa", "001. Wolfgang Amadeus Mozart - Requiem (K. 626) - Lacrimosa.mp3"),
    source: "internet_archive",
  },
  "Piano Concerto No. 21 in C major, K. 467 – II. Andante": {
    audioUrl: ia("WolfgangAmadeusMozartPianoConcertoNo.21InCMajorKV467II.AndanteFromJamesBondTheSpyWhoLovedMe", "Wolfgang Amadeus Mozart - Piano Concerto No.21 in C major, KV 467, II. Andante (From James Bond, The Spy Who Loved Me).mp3"),
    source: "internet_archive",
  },
  "Overture to The Marriage of Figaro, K. 492": {
    audioUrl: ia("37WolfgangAmadeusMozartMarriageOfFigaroOverture1786", "37 Wolfgang Amadeus Mozart - Marriage Of Figaro Overture, 1786.mp3"),
    source: "internet_archive",
  },
  "Serenade No. 13 'Eine kleine Nachtmusik' – II. Romanze": {
    audioUrl: ia("karl-muenchinger-decca-lw-50109-side-a", "02 - Stuttgarter Kammerorch., Karl MÜNCHINGER - Decca LW 50109 - Side A - Eine kleine Nachtmusik KV 525 (Mozart) - 2. Romanze - Andante.mp3"),
    source: "internet_archive",
  },
  "Piano Sonata No. 16 in C major, K. 545 – I. Allegro": {
    audioUrl: ia("MozartPianoSonataNo16CMajorK545Barenboim", "Mozart Piano Sonata No 16 C major K 545 Barenboim.mp3"),
    source: "internet_archive",
  },

  // ───────── TCHAIKOVSKY ─────────
  "Swan Lake, Op. 20 – Scene: Moderato": {
    audioUrl: ia("40PeterIlyichTchaikovskySwanLakeScene1876", "40 Peter Ilyich Tchaikovsky - Swan Lake Scene, 1876.mp3"),
    source: "internet_archive",
  },
  "The Nutcracker – Dance of the Sugar Plum Fairy": {
    audioUrl: ia("23PeterIlyichTchaikovskyNutcrackerDanceOfTheSugarPlumFairy1892", "23 Peter Ilyich Tchaikovsky - Nutcracker Dance Of The Sugar Plum Fairy,1892.mp3"),
    source: "internet_archive",
  },
  "The Nutcracker – Waltz of the Flowers": {
    audioUrl: ia("48PeterIlyichTchaikovskyTheNutcrackerWaltzOfTheFlowers1892", "48 Peter Ilyich Tchaikovsky - The Nutcracker - Waltz of the flowers, 1892.mp3"),
    source: "internet_archive",
  },
  "1812 Overture, Op. 49": {
    audioUrl: ia("TCHAIKOVSKY1812Overture-Rodzinski-NEWTRANSFER", "Tchaikovsky-1812OvertureOp.49.mp3"),
    source: "internet_archive",
  },
  "Piano Concerto No. 1 in B-flat minor, Op. 23 – I. Allegro non troppo": {
    audioUrl: ia("TchaikovskyPianoConcertoNo.1InBFlatMinorOp.23_846", "1.-allegro-non-troppo-e-molto-maestoso-Allegro-con-spirito-sviatoslav-richter.mp3"),
    source: "internet_archive",
  },
  "Sleeping Beauty Waltz, Op. 66": {
    audioUrl: ia("sleeping-beauty-waltz", "Sleeping Beauty Waltz.mp3"),
    source: "internet_archive",
  },

  // ───────── VIVALDI ─────────
  "The Four Seasons – Spring, RV 269: I. Allegro": {
    audioUrl: ia("The_Four_Seasons_Vivaldi-10361", "John_Harrison_with_the_Wichita_State_University_Chamber_Players_-_01_-_Spring_Mvt_1_Allegro.mp3"),
    source: "internet_archive",
  },
  "The Four Seasons – Summer, RV 315: III. Presto": {
    audioUrl: ia("summer-presto-jansen-amst-sinf-2014", "summer-presto (jansen-amst sinf - 2014).mp3"),
    source: "internet_archive",
  },
  "The Four Seasons – Autumn, RV 293: I. Allegro": {
    audioUrl: ia("07-vivaldi-the-four-seasons-autumn-i-allegro", "07 Vivaldi the Four Seasons Autumn I Allegro.mp3"),
    source: "internet_archive",
  },
  "The Four Seasons – Winter, RV 297: II. Largo": {
    audioUrl: ia("The_Four_Seasons_Vivaldi-10361", "John_Harrison_with_the_Wichita_State_University_Chamber_Players_-_11_-_Winter_Mvt_2_Largo.mp3"),
    source: "internet_archive",
  },
  "The Four Seasons – Winter, RV 297: I. Allegro non molto": {
    audioUrl: ia("The_Four_Seasons_Vivaldi-10361", "John_Harrison_with_the_Wichita_State_University_Chamber_Players_-_10_-_Winter_Mvt_1_Allegro_non_molto.mp3"),
    source: "internet_archive",
  },

  // ───────── LISZT ─────────
  "Hungarian Rhapsody No. 2 in C-sharp minor": {
    audioUrl: ia("LisztHungarianRhapsodyNo.2_689", "Liszt_Hungarian_Rhapsody_No.2.mp3"),
    source: "internet_archive",
  },
  "Liebestraum No. 3 in A-flat major": {
    audioUrl: ia("Liebestraum-FranzLiszt", "Liebestraum.mp3"),
    source: "internet_archive",
  },
  "La Campanella (Grand Étude de Paganini No. 3)": {
    audioUrl: ia("Liszt-LaCampanella", "LisztLaCampanella.mp3"),
    source: "internet_archive",
  },
  "Consolation No. 3 in D-flat major": {
    audioUrl: ia("FranzLisztConsolationNo.1S.17220170114", "Franz Liszt, Consolation No. 3, S. 172 [20170111].mp3"),
    source: "internet_archive",
  },

  // ───────── SCHUBERT ─────────
  "Ave Maria, D. 839": {
    audioUrl: ia("FranzSchubertAveMaria", "Franz Schubert_ Ave Maria.mp3"),
    source: "internet_archive",
  },
  "Serenade (Ständchen, D. 957 No. 4)": {
    audioUrl: ia("StndchenSchubertJuanLuria", "Ständchen Schubert Juan Luria.mp3"),
    source: "internet_archive",
  },
  "Piano Quintet in A major 'Trout', D. 667 – IV. Tema con variazioni": {
    audioUrl: ia("TroutQuintetIv.ThemeAndVariationspludermacherTrioACordesFrancais", "7-04PianoQuintet.A-dur.D667.Forellenquintett.Iv.ThemeVariations.mp3"),
    source: "internet_archive",
  },
  "Impromptu in G-flat major, Op. 90 No. 3, D. 899": {
    audioUrl: ia("schubert-d-899-3-horowitz-1987", "schubert d899-3 horowitz (1987).mp3"),
    source: "internet_archive",
  },

  // ───────── RACHMANINOFF ─────────
  "Piano Concerto No. 2 in C minor, Op. 18 – I. Moderato": {
    audioUrl: ia("RachmaninoffPianoConcertoNo.2InCMinorOp.16", "01Rachmaninov_PianoConcerto2InCMinorOp.18-1.Moderato.mp3"),
    source: "internet_archive",
  },
  "Prelude in C-sharp minor, Op. 3 No. 2": {
    audioUrl: ia("RachmaninoffPreludeInC-sharpMinor", "Rachmaninoff-PreludeInC-sharpMinorhofmann.mp3"),
    source: "internet_archive",
  },
  "Vocalise, Op. 34 No. 14": {
    audioUrl: ia("rachmaninoff-vocalise-op.-34-no.-14-orchestral-arrangement", "Rachmaninoff - Vocalise, Op. 34 No. 14 (orchestral arrangement).mp3"),
    source: "internet_archive",
  },
  "Rhapsody on a Theme of Paganini, Op. 43 – Var. 18": {
    audioUrl: ia("RachmaninoffRhapsodyOnAThemeOfPaganiniVariation18lugansky", "10Rachmaninov_RhapsodyOnAThemeOfPaganiniOp.43-Var.18.mp3"),
    source: "internet_archive",
  },

  // ───────── DVOŘÁK ─────────
  "Symphony No. 9 'From the New World' – II. Largo": {
    audioUrl: ia("newWorldSymphonyLargoklemperer", "02Ii_Largo.mp3"),
    source: "internet_archive",
  },
  "Symphony No. 9 'From the New World' – IV. Allegro con fuoco": {
    audioUrl: ia("SymphonyNo.9Iv.FinaleAllegroConFuoco", "04Dvok_Symphony9InEMinorOp.95B178_fromTheNewWorld_-4.AllegroConFuoco.mp3"),
    source: "internet_archive",
  },
  "Humoresque No. 7 in G-flat major, Op. 101": {
    audioUrl: ia("dvorak-humoresque", "Dvorak _ Humoresque.mp3"),
    source: "internet_archive",
  },

  // ───────── GRIEG ─────────
  "Peer Gynt Suite No. 1, Op. 46 – Morning Mood": {
    audioUrl: ia("edvard-grieg-morning-mood", "Edvard Grieg - Peer Gynt Suite No. 1, Op. 46_ Morning Mood.mp3"),
    source: "internet_archive",
  },
  "Peer Gynt Suite No. 1, Op. 46 – In the Hall of the Mountain King": {
    audioUrl: ia("EdvardGriegPeerGyntSuiteNo.1Op.46InTheHallFoTheMountainKingFromTrollhunter", "Edvard Grieg - Peer Gynt suite No.1 Op. 46 - In the Hall of the Mountain King (From Trollhunter).mp3"),
    source: "internet_archive",
  },
  "Piano Concerto in A minor, Op. 16 – I. Allegro molto moderato": {
    audioUrl: ia("GriegPianoConcertoInAMinorrubinstein-ormandy1942", "04PianoConcertoNo.1InAOp.16_I.AllegroMoltoModerato.mp3"),
    source: "internet_archive",
  },

  // ───────── SATIE ─────────
  "Gymnopédie No. 1": {
    audioUrl: ia("ErikSatieGymnopdieNo.1", "Erik Satie - Gymnopédie No.1.mp3"),
    source: "internet_archive",
  },
  "Gymnopédie No. 3": {
    audioUrl: ia("satie-gnossienne-gymnopedie", "Satie Gymnopedie 3.mp3"),
    source: "internet_archive",
  },
  "Gnossienne No. 1": {
    audioUrl: ia("erik-satie-gnossienne-no.-1", "Erik_Satie_Gnossienne_No.1.mp3"),
    source: "internet_archive",
  },

  // ───────── BRAHMS ─────────
  "Hungarian Dance No. 5 in G minor": {
    audioUrl: ia("JohannesBrahmsHungarianDanceNo.5", "Johannes Brahms - Hungarian Dance No. 5.mp3"),
    source: "internet_archive",
  },
  "Lullaby (Wiegenlied, Op. 49 No. 4)": {
    audioUrl: ia("Brahmswiegenlied", "21-5LiederOp.49_5LiederOp.49_Iv.Wiegenlied.mp3"),
    source: "internet_archive",
  },
  "Symphony No. 3 in F major, Op. 90 – III. Poco allegretto": {
    audioUrl: ia("BRAHMSSymphonyNo.3-NEWTRANSFER", "03.Iii.PocoAllegretto.mp3"),
    source: "internet_archive",
  },
  "Intermezzo in A major, Op. 118 No. 2": {
    audioUrl: ia("brahms_118-2", "all.mp3"),
    source: "internet_archive",
  },

  // ───────── HANDEL ─────────
  "Water Music Suite No. 2 – Alla Hornpipe": {
    audioUrl: ia("12.-water-music-bijlage-12.-alla-hornpipe-variant-in-f-hwv-3312", "12.Water Music; Bijlage - 12. Alla Hornpipe (variant in F, HWV 3312).mp3"),
    source: "internet_archive",
  },
  "Messiah – Hallelujah Chorus": {
    audioUrl: ia("218ChorusHallelujah", "2-18 Chorus 'Hallelujah!'.mp3"),
    source: "internet_archive",
  },
  "Sarabande in D minor (Suite in D minor, HWV 437)": {
    audioUrl: ia("george-frideric-handel-sarabande-in-d-minor-organ", "George Frideric Handel \u2014 Sarabande In D Minor (Organ).mp3"),
    source: "internet_archive",
  },

  // ───────── MENDELSSOHN ─────────
  "Wedding March (A Midsummer Night's Dream, Op. 61)": {
    audioUrl: ia("MendelssohnWeddingMarch", "Mendelssohn-wedding-march.mp3"),
    source: "internet_archive",
  },
  "Violin Concerto in E minor, Op. 64 – I. Allegro molto appassionato": {
    audioUrl: ia("MendelssohnViolinConcertoInEMinormenuhin", "mend-vlncto (menuhin-kurtz).mp3"),
    source: "internet_archive",
  },

  // ───────── STRAUSS ─────────
  "The Blue Danube Waltz, Op. 314": {
    audioUrl: ia("J.StraussIiOnTheBeautifulBlueDanubekarajan1966", "06StraussJr.j_AnDerSchnenBlauenDonauOp.314.mp3"),
    source: "internet_archive",
  },
  "Radetzky March, Op. 228": {
    audioUrl: ia("RadetzkyMarchOp.228", "Radetzky March, Op. 228.mp3"),
    source: "internet_archive",
  },

  // ───────── PACHELBEL ─────────
  "Canon in D major": {
    audioUrl: ia("PachelbelCanonInDMajor", "Pachelbel_ Canon - In D Major.mp3"),
    source: "internet_archive",
  },

  // ───────── SAINT-SAËNS ─────────
  "The Carnival of the Animals – The Swan": {
    audioUrl: ia("Saint-saensCarnivalOfTheAnimalsTheSwanmaisky", "13TheSwan.mp3"),
    source: "internet_archive",
  },
  "Danse macabre, Op. 40": {
    audioUrl: ia("SAINT-SANSDanseMacabre-Scherchen", "SAINT-SA\u00cbNS- Danse macabre, Op. 40.mp3"),
    source: "internet_archive",
  },

  // ───────── MUSSORGSKY ─────────
  "Pictures at an Exhibition – The Great Gate of Kiev": {
    audioUrl: ia("MussorgskyPicturesAtAnExhibition", "14Mussorgsky_PicturesAtAnExhibition-TheGreatGateOfKiev.mp3"),
    source: "internet_archive",
  },
  "Night on Bald Mountain": {
    audioUrl: ia("MUSSORGSKY-STOKOWSKINightOnTheBaldMountain", "03.Mussorgsky-stokowski-NightOnTheBaldMountain.mp3"),
    source: "internet_archive",
  },

  // ───────── RAVEL ─────────
  "Boléro": {
    audioUrl: ia("ravel-bolero-manuel-rosenthal-dvg", "Ravel - Bol\u00e9ro.mp3"),
    source: "internet_archive",
  },
  "Pavane pour une infante défunte": {
    audioUrl: ia("ravel-pavane-pour-une-infante-defunte-manuel-rosenthal-dvg", "Ravel - Pavane pour une infante d\u00e9funte.mp3"),
    source: "internet_archive",
  },

  // ───────── SCHUMANN ─────────
  "Träumerei (Kinderszenen, Op. 15 No. 7)": {
    audioUrl: ia("SchumannTraumerei", "SchumannTraumerei.mp3"),
    source: "internet_archive",
  },
  "Piano Concerto in A minor, Op. 54 – I. Allegro affettuoso": {
    audioUrl: ia("SchumannPianoConcertoInAMinorOp.54", "1.-allegro-affettuoso-Andante-espressivo-Allegro-molto.mp3"),
    source: "internet_archive",
  },

  // ───────── WAGNER ─────────
  "Ride of the Valkyries (Die Walküre, Act III)": {
    audioUrl: ia("WagnerTheRideOfTheValkyries", "WagnerTheRideOfTheValkyrieswww.keepvid.com.mp3"),
    source: "internet_archive",
  },
  "Bridal Chorus (Lohengrin, Act III)": {
    audioUrl: ia("10RichardWagnerBridalChorus1850", "10 Richard Wagner - Bridal Chorus, 1850.mp3"),
    source: "internet_archive",
  },

  // ───────── VERDI ─────────
  "La Traviata – Prelude to Act I": {
    audioUrl: ia("01-verdi.LaTraviata-Overture.mp3", "01-verdi.LaTraviata-Overture.mp3"),
    source: "internet_archive",
  },
  "Aida – Triumphal March": {
    audioUrl: ia("06GiuseppeVerdiAidaGrandFinaleMarch1871", "06 Giuseppe Verdi - Aida, Grand Finale March, 1871.mp3"),
    source: "internet_archive",
  },

  // ───────── ELGAR ─────────
  "Pomp and Circumstance March No. 1 in D major, Op. 39": {
    audioUrl: ia("01elgarpompcircumstancemarch1indop.391", "01 Elgar_ Pomp & Circumstance March #1 In D, Op. 39_1.mp3"),
    source: "internet_archive",
  },

  // ───────── HOLST ─────────
  "The Planets, Op. 32 – Jupiter, the Bringer of Jollity": {
    audioUrl: ia("gustav-holst-the-planets-jupiter-the-bringer-of-jollity", "Gustav Holst - The Planets - Jupiter, the Bringer of Jollity.mp3"),
    source: "internet_archive",
  },

  // ───────── BIZET ─────────
  "Carmen – Habanera": {
    audioUrl: ia("50GeorgesBizetCarmenFantasyHabanera1875", "50 Georges Bizet - Carmen Fantasy - Habanera, 1875.mp3"),
    source: "internet_archive",
  },
  "L'Arlésienne Suite No. 2 – Farandole": {
    audioUrl: ia("Bizet_Arlesienne", "04_Farandole.mp3"),
    source: "internet_archive",
  },

  // ───────── ROSSINI ─────────
  "William Tell Overture – Finale": {
    audioUrl: ia("03GioachinoRossiniWilliamTellOverture1829", "03 Gioachino Rossini - William Tell, Overture, 1829.mp3"),
    source: "internet_archive",
  },
  "The Barber of Seville – Overture": {
    audioUrl: ia("RossiniBarbiereOverturevarvisoCond.", "barbiere over (varviso) upgrade.mp3"),
    source: "internet_archive",
  },

  // ───────── GERSHWIN ─────────
  "Rhapsody in Blue": {
    audioUrl: ia("GershwinRhapsodyInBluebernstein-columbiaSym", "01RhapsodyInBlue.mp3"),
    source: "internet_archive",
  },

  // ───────── ALBINONI / GIAZOTTO ─────────
  "Adagio in G minor": {
    audioUrl: ia("albinoni-adagio-karajan-1983", "albinoni adagio (karajan 1983).mp3"),
    source: "internet_archive",
  },

  // ───────── TARTINI ─────────
  "Violin Sonata in G minor 'Devil's Trill' – III. Andante–Allegro": {
    audioUrl: ia("tartini-violin-sonata-the-devils-trill-alfredo-campoli-dvg", "Tartini- Violin Sonata in G minor, GT 2.g05 'The Devil's Trill'.mp3"),
    source: "internet_archive",
  },

  // ───────── PURCELL ─────────
  "Dido and Aeneas – When I am laid in earth (Dido's Lament)": {
    audioUrl: ia("78_when-i-am-laid-in-earth-didos-lament-dido-aeneas_thornton-edna", "D_533_HO_4389AF.mp3"),
    source: "internet_archive",
  },

  // ───────── BORODIN ─────────
  "In the Steppes of Central Asia": {
    audioUrl: ia("borodin_steppes_svetlanov_ussr_symphony_1968", "borodin_steppes_svetlanov_ussr_symphony_1968.mp3"),
    source: "internet_archive",
  },

  // ───────── RIMSKY-KORSAKOV ─────────
  "Flight of the Bumblebee (The Tale of Tsar Saltan)": {
    audioUrl: ia("FlightOfTheBumblebee", "flight_of_the_bumblebee_2.mp3"),
    source: "internet_archive",
  },
  "Scheherazade, Op. 35 – III. The Young Prince and The Young Princess": {
    audioUrl: ia("Rimsky-korsakovScheherazadebeecham-emi", "03Rimsky-korsakov_ScheherazadeOp.35-3.TheYoungPrinceAndTheYoungPrincessAndantinoQuasiAllegrettoUnPocoLarghetto.mp3"),
    source: "internet_archive",
  },

  // ───────── OFFENBACH ─────────
  "Orpheus in the Underworld – Galop infernal (Can-Can)": {
    audioUrl: ia("12JackuesOffenbachOrpheusInTheUnderworld1858", "12 Jackues Offenbach - Orpheus in the Underworld, 1858.mp3"),
    source: "internet_archive",
  },
  "The Tales of Hoffmann – Barcarolle": {
    audioUrl: ia("02JackuesOffenbachBarcarolleFromTalesOfHoffmann1864", "02 Jackues Offenbach - Barcarolle from Tales of Hoffmann, 1864.mp3"),
    source: "internet_archive",
  },

  // ───────── MASSENET ─────────
  "Thaïs – Méditation": {
    audioUrl: ia("massenet-thais-meditation", "Massenet_ Tha\u00efs_ M\u00e9ditation.mp3"),
    source: "internet_archive",
  },

  // ───────── FAURÉ ─────────
  "Pavane, Op. 50": {
    audioUrl: ia("FAUREPavaneOp.50", "Faur-PavaneOp.50.mp3"),
    source: "internet_archive",
  },
  "Sicilienne, Op. 78": {
    audioUrl: ia("0108SicilienneOp78Andantino", "01-08- Sicilienne, Op78 Andantino.mp3"),
    source: "internet_archive",
  },

  // ───────── PAGANINI ─────────
  "Caprice No. 24 in A minor": {
    audioUrl: ia("PaganiniCapriceNo.24perlman", "03Paganini_CapricesOp.1-24InAMinor.mp3"),
    source: "internet_archive",
  },
};

/* ── Patch Logic ────────────────────────────────────── */

async function patchUrls() {
  const titles = Object.keys(CANONICAL);
  console.log(`\nPatching ${titles.length} tracks to canonical MP3 URLs in Firestore...\n`);

  const tracksRef = db.collection("tracks");
  const snapshot = await tracksRef.get();

  if (snapshot.empty) {
    console.log("No tracks found in Firestore. Run seed-tracks.ts first.");
    return;
  }

  console.log(`Found ${snapshot.size} tracks in Firestore.\n`);

  let patched = 0;
  let alreadyOk = 0;
  let notFound = 0;

  for (const title of titles) {
    const canonical = CANONICAL[title];
    const matchingDocs = snapshot.docs.filter(
      (doc) => doc.data().title === title
    );

    if (matchingDocs.length === 0) {
      console.log(`  Not found: "${title}"`);
      notFound++;
      continue;
    }

    for (const doc of matchingDocs) {
      const data = doc.data();

      if (data.audioUrl === canonical.audioUrl && data.source === canonical.source) {
        alreadyOk++;
        continue;
      }

      await doc.ref.update({
        audioUrl: canonical.audioUrl,
        source: canonical.source,
      });
      console.log(`  Patched: "${title}"`);
      patched++;
    }
  }

  console.log(`\n${"=".repeat(40)}`);
  console.log(`  Patched:    ${patched}`);
  console.log(`  Already OK: ${alreadyOk}`);
  console.log(`  Not found:  ${notFound}`);
  console.log(`${"=".repeat(40)}\n`);
}

patchUrls().catch(console.error);

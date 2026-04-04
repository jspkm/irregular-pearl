// Seed data for Irregular Pearl — Phase 1
// 100 pieces across Piano, Violin, Cello, Voice, and Winds.
// Each piece has editions and external links pre-populated.

export interface SeedPiece {
  id: string;
  title: string;
  composer_name: string;
  catalog_number: string | null;
  instruments: string[];
  era: string;
  form: string;
  duration_minutes: number | null;
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'professional';
  description: string;
  editions: {
    id: string;
    publisher: string;
    editor: string;
    year: number | null;
    description: string;
  }[];
  external_links: {
    type: 'imslp' | 'youtube' | 'wikipedia' | 'spotify' | 'soundcloud' | 'bandcamp' | 'internet_archive' | 'vimeo';
    url: string;
    label: string;
  }[];
  /** Movement list for multi-movement works. Each entry has a name and optional pieceId if that movement exists as its own piece in the catalog. */
  movements?: {
    name: string;
    /** ID of this movement's piece in the catalog, if it exists */
    pieceId?: string;
  }[];
  /** If this piece IS a movement of a larger work, the parent work's piece ID */
  parentWorkId?: string;
  /** If this piece IS a movement, its 1-based movement number */
  movementNumber?: number;
}

export const seedPieces: SeedPiece[] = [
  // === CELLO ===
  {
    id: 'bach-cello-suite-1',
    title: 'Cello Suite No. 1 in G major',
    composer_name: 'Johann Sebastian Bach',
    catalog_number: 'BWV 1007',
    instruments: ['Cello'],
    era: 'Baroque',
    form: 'Suite',
    duration_minutes: 20,
    difficulty: 'intermediate',
    description: 'The first of six suites for unaccompanied cello. Composed during Bach\'s tenure as Kapellmeister in Cothen, the suite consists of six movements: Prelude, Allemande, Courante, Sarabande, Menuets I & II, and Gigue. The Prelude is especially famous for its flowing arpeggiated figures.',
    editions: [
      { id: 'e-bach-cs1-henle', publisher: 'Henle Verlag', editor: 'Egon Voss', year: 2000, description: 'Critical Urtext edition based on Anna Magdalena Bach\'s copy. Minimal editorial markings, ideal for informed performers.' },
      { id: 'e-bach-cs1-barenreiter', publisher: 'Bärenreiter', editor: 'Bettina Schwemer & Douglas Woodfull-Harris', year: 2012, description: 'Scholarly edition with facsimile. Includes source comparison appendix and detailed critical commentary.' },
      { id: 'e-bach-cs1-imi', publisher: 'International Music Company', editor: 'Leonard Rose', year: 1950, description: 'Heavy romantic-era bowings and fingerings. Widely used in American pedagogy but editorially dated.' }
    ],
    external_links: [
      { type: 'imslp', url: 'https://imslp.org/wiki/Cello_Suite_No.1_in_G_major,_BWV_1007_(Bach,_Johann_Sebastian)', label: 'IMSLP — 12 editions available' },
      { type: 'youtube', url: 'https://www.youtube.com/watch?v=PCicM6i59_I', label: 'Bach Cello Suite No.1 - Prelude' },
      { type: 'youtube', url: 'https://www.youtube.com/watch?v=DwHpDOWhkGk', label: 'Bach - Cello Suite No. 1 in G Major BWV1007 - Mov. 1-3/6' },
      { type: 'wikipedia', url: 'https://en.wikipedia.org/wiki/Cello_Suites_(Bach)', label: 'Wikipedia — Cello Suites' },
      { type: 'spotify', url: 'https://open.spotify.com/track/61dYvvfIRtIDFuqZypPAta', label: 'Yo-Yo Ma — Prelude' },
      { type: 'spotify', url: 'https://open.spotify.com/track/1FkFiOLin8DIUgIdALwO9n', label: 'Mstislav Rostropovich — Prelude' },
      { type: 'internet_archive', url: 'https://archive.org/details/01No.1InGBwv10071.PreludeModerato', label: 'Pablo Casals — Prelude (historic recording)' },
      { type: 'internet_archive', url: 'https://archive.org/details/bach-j.s.-suites-for-cello-cello-bwv-1007-1012-pierre-fournier', label: 'Pierre Fournier — Complete Cello Suites' },
      { type: 'vimeo', url: 'https://vimeo.com/557158390', label: 'Jean-Guihen Queyras — Prelude (video)' },
    ],
    movements: [
      { name: 'I. Prelude' },
      { name: 'II. Allemande' },
      { name: 'III. Courante' },
      { name: 'IV. Sarabande' },
      { name: 'V. Menuet I & II' },
      { name: 'VI. Gigue' },
    ],
  },
  {
    id: 'dvorak-cello-concerto',
    title: 'Cello Concerto in B minor',
    composer_name: 'Antonín Dvořák',
    catalog_number: 'Op. 104',
    instruments: ['Cello'],
    era: 'Romantic',
    form: 'Concerto',
    duration_minutes: 40,
    difficulty: 'professional',
    description: 'One of the greatest cello concertos ever written. Composed in 1894-95 during Dvořák\'s time in America, it combines Czech lyricism with orchestral grandeur. Brahms reportedly said, "Had I known a cello concerto like this could be written, I would have tried to compose one myself."',
    editions: [
      { id: 'e-dvorak-cc-henle', publisher: 'Henle Verlag', editor: 'Annette Oppermann', year: 2012, description: 'Urtext edition based on autograph and first edition. Clean, scholarly.' },
      { id: 'e-dvorak-cc-barenreiter', publisher: 'Bärenreiter', editor: 'Jonathan Del Mar', year: 2016, description: 'New critical edition with detailed source commentary and performance suggestions.' }
    ],
    external_links: [
      { type: 'imslp', url: 'https://imslp.org/wiki/Cello_Concerto_in_B_minor,_Op.104_(Dvo%C5%99%C3%A1k,_Anton%C3%ADn)', label: 'IMSLP — Dvořák Cello Concerto' },
      { type: 'youtube', url: 'https://www.youtube.com/watch?v=FVKb3DwPFA8', label: 'Gautier Capuçon | Dvořák: Cello Concerto' },
      { type: 'wikipedia', url: 'https://en.wikipedia.org/wiki/Cello_Concerto_(Dvo%C5%99%C3%A1k)', label: 'Wikipedia — Dvořák Cello Concerto' },
      { type: 'spotify', url: 'https://open.spotify.com/track/0IQ2wNbgTMGCVh2R0RYtY4', label: 'Kian Soltani / Barenboim / Staatskapelle Berlin' },
      { type: 'spotify', url: 'https://open.spotify.com/track/0nE5LAhlotmOrADLNeU5n9', label: 'Rostropovich / Karajan / Berliner Philharmoniker' },
      { type: 'spotify', url: 'https://open.spotify.com/album/0DQsuhP1UeQqT1ru5u7rF2', label: 'Jacqueline du Pré — Dvorak Cello Concerto' },
      { type: 'internet_archive', url: 'https://archive.org/details/DvorakCelloConcertoInBMinorOp.104', label: 'Rostropovich / Karajan — 1968 recording' },
      { type: 'internet_archive', url: 'https://archive.org/details/DvorakCelloConcerto-Piatigorsky', label: 'Piatigorsky / Ormandy / Philadelphia — 1946' },
    ],
    movements: [
      { name: 'I. Allegro' },
      { name: 'II. Adagio, ma non troppo' },
      { name: 'III. Finale: Allegro moderato' },
    ],
  },

  // === PIANO ===
  {
    id: 'beethoven-sonata-14',
    title: 'Piano Sonata No. 14 in C-sharp minor "Moonlight"',
    composer_name: 'Ludwig van Beethoven',
    catalog_number: 'Op. 27 No. 2',
    instruments: ['Piano'],
    era: 'Classical/Romantic',
    form: 'Sonata',
    duration_minutes: 15,
    difficulty: 'advanced',
    description: 'The "Moonlight" Sonata, subtitled "Sonata quasi una fantasia," opens with one of the most recognizable movements in all of classical music. The first movement\'s triplet arpeggios over a singing melody give way to a light Allegretto, before the explosive Presto agitato finale.',
    editions: [
      { id: 'e-beethoven-s14-henle', publisher: 'Henle Verlag', editor: 'Bertha Antonia Wallner', year: 1980, description: 'Standard Urtext. Fingerings by Conrad Hansen. The benchmark edition for this sonata.' },
      { id: 'e-beethoven-s14-wiener', publisher: 'Wiener Urtext', editor: 'Peter Hauschild', year: 2004, description: 'Viennese Urtext with detailed performance notes. Excellent for historically informed interpretation.' }
    ],
    external_links: [
      { type: 'imslp', url: 'https://imslp.org/wiki/Piano_Sonata_No.14,_Op.27_No.2_(Beethoven,_Ludwig_van)', label: 'IMSLP — Moonlight Sonata' },
      { type: 'youtube', url: 'https://www.youtube.com/watch?v=4Tr0otuiQuU', label: 'Beethoven - Moonlight Sonata' },
      { type: 'wikipedia', url: 'https://en.wikipedia.org/wiki/Piano_Sonata_No._14_(Beethoven)', label: 'Wikipedia — Moonlight Sonata' },
      { type: 'spotify', url: 'https://open.spotify.com/track/4HYkUtgKploAEhKbUqHa8w', label: 'Daniel Barenboim — III. Presto agitato' },
      { type: 'spotify', url: 'https://open.spotify.com/track/3DNRdudZ2SstnDCVKFdXxG', label: 'Paul Lewis — I. Adagio sostenuto' },
      { type: 'internet_archive', url: 'https://archive.org/details/beethoven-moonlight-sonata-horowitz-1947', label: 'Vladimir Horowitz — 1947 RCA (historic)' },
      { type: 'internet_archive', url: 'https://archive.org/details/BeethovenPianoSonataNo.14moonlightrubinstein', label: 'Arthur Rubinstein — 1962' },
      { type: 'vimeo', url: 'https://vimeo.com/36754749', label: 'Khatia Buniatishvili — Masterclass performance' },
    ],
    movements: [
      { name: 'I. Adagio sostenuto' },
      { name: 'II. Allegretto' },
      { name: 'III. Presto agitato' },
    ],
  },
  {
    id: 'chopin-ballade-1',
    title: 'Ballade No. 1 in G minor',
    composer_name: 'Frédéric Chopin',
    catalog_number: 'Op. 23',
    instruments: ['Piano'],
    era: 'Romantic',
    form: 'Ballade',
    duration_minutes: 10,
    difficulty: 'professional',
    description: 'The first of Chopin\'s four ballades, inspired by the poetry of Adam Mickiewicz. A narrative arc from the mysterious opening through lyrical themes to the explosive coda. One of the most demanding and beloved works in the piano repertoire.',
    editions: [
      { id: 'e-chopin-b1-henle', publisher: 'Henle Verlag', editor: 'Norbert Müllemann', year: 2007, description: 'Critical Urtext based on autographs and first editions. Fingerings by Vladimir Ashkenazy.' },
      { id: 'e-chopin-b1-peters', publisher: 'Peters', editor: 'Ignacy Jan Paderewski', year: 1949, description: 'The Paderewski edition. Comprehensive editorial notes, widely used in competitions. Some editorial choices now questioned by scholars.' },
      { id: 'e-chopin-b1-ekier', publisher: 'PWM / National Edition', editor: 'Jan Ekier', year: 2000, description: 'The Polish National Edition. Considered the most authoritative modern source, based on exhaustive manuscript research.' }
    ],
    external_links: [
      { type: 'imslp', url: 'https://imslp.org/wiki/Ballade_No.1,_Op.23_(Chopin,_Fr%C3%A9d%C3%A9ric)', label: 'IMSLP — Ballade No. 1' },
      { type: 'wikipedia', url: 'https://en.wikipedia.org/wiki/Ballade_No._1_(Chopin)', label: 'Wikipedia — Chopin Ballade No. 1' },
      { type: 'youtube', url: 'https://www.youtube.com/watch?v=BSFNl4roGlI', label: 'Chopin - Ballade No.1 in G minor, Op.23 (Krystian Zimerman)' },
      { type: 'spotify', url: 'https://open.spotify.com/track/7pLC3L3hscXCEA5iCKY4EN', label: 'Seong-Jin Cho — 2015 Chopin Competition winner' },
      { type: 'spotify', url: 'https://open.spotify.com/track/5Ks5ENUFNQDfaqxjZnCkVJ', label: 'Krystian Zimerman' },
      { type: 'internet_archive', url: 'https://archive.org/details/ChopinBalladeNo.1InGMinorOp.23richterPrague1960', label: 'Sviatoslav Richter — Live Prague 1960 (landmark)' },
    ],
  },
  {
    id: 'chopin-etude-op10-1',
    title: 'Étude in C major "Waterfall"',
    composer_name: 'Frédéric Chopin',
    catalog_number: 'Op. 10 No. 1',
    instruments: ['Piano'],
    era: 'Romantic',
    form: 'Étude',
    duration_minutes: 2,
    difficulty: 'professional',
    description: 'The opening étude of Chopin\'s Op. 10, dedicated to Franz Liszt. Wide-spanning arpeggios cascade across the keyboard, demanding extraordinary right-hand stretching and control. A rite of passage for advanced pianists.',
    editions: [
      { id: 'e-chopin-e101-henle', publisher: 'Henle Verlag', editor: 'Norbert Müllemann', year: 2004, description: 'Urtext edition of the complete Op. 10. Clean engraving, minimal editorial intervention.' },
      { id: 'e-chopin-e101-cortot', publisher: 'Salabert', editor: 'Alfred Cortot', year: 1915, description: 'The Cortot "Student\'s Edition" with detailed practice methods and interpretive analysis. A pedagogical classic, though the text is dated in places.' }
    ],
    external_links: [
      { type: 'imslp', url: 'https://imslp.org/wiki/Etudes,_Op.10_(Chopin,_Fr%C3%A9d%C3%A9ric)', label: 'IMSLP — Études Op. 10' },
      { type: 'youtube', url: 'https://www.youtube.com/watch?v=g0hoN6_HDVU', label: 'Chopin: Etudes Op.10 and Op.25' },
      { type: 'spotify', url: 'https://open.spotify.com/track/3T97YpxIHTRBfoqY5FX4AR', label: 'Maurizio Pollini — Etude No. 1' },
      { type: 'spotify', url: 'https://open.spotify.com/track/0LwEwG9XjaVfmZ4VpOyQat', label: 'Seong-Jin Cho — Chopin Competition' },
      { type: 'internet_archive', url: 'https://archive.org/details/20220922-chopin-etudes-opp.-10-25-maurizio-pollini', label: 'Maurizio Pollini — Complete Etudes' },
      { type: 'internet_archive', url: 'https://archive.org/details/CHOPINEtudes-Cortot-NEWTRANSFER', label: 'Alfred Cortot — 1933 (remastered)' },
    ],
  },
  {
    id: 'debussy-clair-de-lune',
    title: 'Clair de lune (Suite bergamasque, III)',
    composer_name: 'Claude Debussy',
    catalog_number: 'L. 75',
    instruments: ['Piano'],
    era: 'Impressionist',
    form: 'Character piece',
    duration_minutes: 5,
    difficulty: 'intermediate',
    description: 'The third movement of Debussy\'s Suite bergamasque, inspired by Verlaine\'s poem of the same name. Its ethereal arpeggios and delicate dynamics make it one of the most popular piano pieces ever written, though its apparent simplicity masks real interpretive depth.',
    editions: [
      { id: 'e-debussy-cdl-henle', publisher: 'Henle Verlag', editor: 'Ernst-Günter Heinemann', year: 2006, description: 'Urtext of the complete Suite bergamasque. Excellent engraving, faithful to Debussy\'s nuanced markings.' },
      { id: 'e-debussy-cdl-durand', publisher: 'Durand', editor: 'Original publication', year: 1905, description: 'The original French edition. Some engraving differences from modern Urtexts but valued for its direct connection to Debussy\'s lifetime.' }
    ],
    external_links: [
      { type: 'imslp', url: 'https://imslp.org/wiki/Suite_bergamasque_(Debussy,_Claude)', label: 'IMSLP — Suite bergamasque' },
      { type: 'youtube', url: 'https://www.youtube.com/watch?v=CvFH_6DNRCY', label: 'CLAUDE DEBUSSY:  CLAIR DE LUNE' },
      { type: 'wikipedia', url: 'https://en.wikipedia.org/wiki/Suite_bergamasque', label: 'Wikipedia — Suite bergamasque' },
      { type: 'spotify', url: 'https://open.spotify.com/track/1cmigB9I6IRpFqjIbzvSQB', label: 'Alice Sara Ott — Suite bergamasque' },
      { type: 'spotify', url: 'https://open.spotify.com/track/0JqCZH9a6xWjiw68rNwxG2', label: 'Hayato Sumino — Clair de Lune' },
      { type: 'internet_archive', url: 'https://archive.org/details/pascal-roge-debussy-clair-de-lune', label: 'Pascal Rogé — Clair de lune' },
      { type: 'vimeo', url: 'https://vimeo.com/193024034', label: 'Sarah Chapeskie — Conservatory Canada Convocation 2016' },
    ],
    movementNumber: 3,
  },

  // === VIOLIN ===
  {
    id: 'bach-violin-partita-2',
    title: 'Violin Partita No. 2 in D minor',
    composer_name: 'Johann Sebastian Bach',
    catalog_number: 'BWV 1004',
    instruments: ['Violin'],
    era: 'Baroque',
    form: 'Partita',
    duration_minutes: 30,
    difficulty: 'professional',
    description: 'Contains the monumental Chaconne, a 15-minute set of variations that is often considered the greatest piece ever written for solo violin. The partita also includes four dance movements: Allemanda, Corrente, Sarabanda, and Giga.',
    editions: [
      { id: 'e-bach-vp2-henle', publisher: 'Henle Verlag', editor: 'Klaus Rönnau', year: 2001, description: 'Urtext based on the autograph manuscript. Fingerings and bowings by Wolfgang Schneiderhan.' },
      { id: 'e-bach-vp2-barenreiter', publisher: 'Bärenreiter', editor: 'Peter Wollny', year: 2020, description: 'The newest critical edition with updated scholarship on Bach\'s bowing and articulation markings.' }
    ],
    external_links: [
      { type: 'imslp', url: 'https://imslp.org/wiki/Violin_Partita_No.2_in_D_minor,_BWV_1004_(Bach,_Johann_Sebastian)', label: 'IMSLP — Partita No. 2' },
      { type: 'wikipedia', url: 'https://en.wikipedia.org/wiki/Sonatas_and_Partitas_for_Solo_Violin_(Bach)', label: 'Wikipedia — Bach Solo Violin Works' },
      { type: 'youtube', url: 'https://www.youtube.com/watch?v=pnK6R5ej6Hg', label: 'Bach - Violin Partita no. 2 in D minor BWV 1004 - Sato | Netherlands Bach Society' },
      { type: 'spotify', url: 'https://open.spotify.com/track/7IVkyo8IVhPsRuZwdfpoLo', label: 'Hilary Hahn — Ciaccona (1997)' },
      { type: 'spotify', url: 'https://open.spotify.com/track/0c8ylcOCPdmcQuBlULkzlx', label: 'Ray Chen — Chaconne' },
      { type: 'internet_archive', url: 'https://archive.org/details/BachPartitaForSoloViolinNo.2InDMinorBwv1004', label: 'Jascha Heifetz — Complete Partita No. 2 (1952)' },
      { type: 'vimeo', url: 'https://vimeo.com/113908045', label: 'Lisa Fujita — Chaconne, New England Conservatory 2014' },
    ],
    movements: [
      { name: 'I. Allemanda' },
      { name: 'II. Corrente' },
      { name: 'III. Sarabanda' },
      { name: 'IV. Giga' },
      { name: 'V. Ciaccona' },
    ],
  },
  {
    id: 'mendelssohn-violin-concerto',
    title: 'Violin Concerto in E minor',
    composer_name: 'Felix Mendelssohn',
    catalog_number: 'Op. 64',
    instruments: ['Violin'],
    era: 'Romantic',
    form: 'Concerto',
    duration_minutes: 25,
    difficulty: 'professional',
    description: 'One of the most performed violin concertos in the repertoire. Revolutionary for its time: the soloist enters immediately rather than waiting for an orchestral exposition, and the movements are connected without pause. The singing first theme is instantly recognizable.',
    editions: [
      { id: 'e-mendel-vc-henle', publisher: 'Henle Verlag', editor: 'Ernst Herttrich', year: 2005, description: 'Urtext based on the autograph. Includes both the 1844 and 1845 versions.' },
      { id: 'e-mendel-vc-imi', publisher: 'International Music Company', editor: 'Zino Francescatti', year: 1960, description: 'Performance edition with Francescatti\'s fingerings and bowings. A practical choice for working through the concerto.' }
    ],
    external_links: [
      { type: 'imslp', url: 'https://imslp.org/wiki/Violin_Concerto_in_E_minor,_Op.64_(Mendelssohn,_Felix)', label: 'IMSLP — Mendelssohn Violin Concerto' },
      { type: 'wikipedia', url: 'https://en.wikipedia.org/wiki/Violin_Concerto_(Mendelssohn)', label: 'Wikipedia — Mendelssohn Violin Concerto' },
      { type: 'youtube', url: 'https://www.youtube.com/watch?v=I03Hs6dwj7E', label: 'Ray Chen Mendelssohn Violin Concerto in E minor, Op. 64' },
      { type: 'spotify', url: 'https://open.spotify.com/track/7y9ygf5AHcHwoSlnhFvF6F', label: 'Hilary Hahn / Oslo Philharmonic' },
      { type: 'spotify', url: 'https://open.spotify.com/track/6poscVRRM6DOvOO92pcY1e', label: 'Ray Chen / Swedish Radio Symphony' },
      { type: 'internet_archive', url: 'https://archive.org/details/HilaryHahnMendelssohnViolinConcertoInEMinorOp64', label: 'Hilary Hahn — Mendelssohn Violin Concerto' },
      { type: 'internet_archive', url: 'https://archive.org/details/mend-vc-nm-bw', label: 'Nathan Milstein / Bruno Walter — Carnegie Hall 1945' },
    ],
    movements: [
      { name: 'I. Allegro molto appassionato' },
      { name: 'II. Andante' },
      { name: 'III. Allegretto non troppo — Allegro molto vivace' },
    ],
  },

  // === VOICE ===
  {
    id: 'mozart-queen-of-the-night',
    title: 'Der Hölle Rache (Queen of the Night Aria)',
    composer_name: 'Wolfgang Amadeus Mozart',
    catalog_number: 'K. 620',
    instruments: ['Voice (Soprano)'],
    era: 'Classical',
    form: 'Aria',
    duration_minutes: 3,
    difficulty: 'professional',
    description: 'From Act II of The Magic Flute. The Queen of the Night\'s fury aria, with its stratospheric high F6 passages, is the ultimate coloratura soprano showpiece. One of the most recognized vocal pieces in existence.',
    editions: [
      { id: 'e-mozart-qon-barenreiter', publisher: 'Bärenreiter', editor: 'Wolfgang Rehm', year: 1970, description: 'The Neue Mozart-Ausgabe (NMA) critical edition. The scholarly standard for Mozart operas.' },
      { id: 'e-mozart-qon-schirmer', publisher: 'G. Schirmer', editor: 'Ruth Martin & Thomas Martin', year: 1951, description: 'English/German vocal score. Practical for audition preparation and studio use.' }
    ],
    external_links: [
      { type: 'youtube', url: 'https://www.youtube.com/watch?v=YuBeBjqKSGQ', label: 'The Magic Flute – Queen of the Night aria' },
      { type: 'wikipedia', url: 'https://en.wikipedia.org/wiki/Der_H%C3%B6lle_Rache_kocht_in_meinem_Herzen', label: 'Wikipedia — Queen of the Night Aria' },
      { type: 'spotify', url: 'https://open.spotify.com/track/6DJLaCcgjdwCcxBGXJa4wH', label: 'Diana Damrau / Le Cercle De L\'Harmonie' },
      { type: 'spotify', url: 'https://open.spotify.com/track/2rBGaOX4RpJ223CClciFTc', label: 'Natalie Dessay / Orchestra of the Age of Enlightenment' },
      { type: 'internet_archive', url: 'https://archive.org/details/78_queen-of-the-night-aria_lily-pons-mozart-bruno-walter_gbia0284391a', label: 'Lily Pons / Bruno Walter — 78rpm (historic)' },
    ],
  },
  {
    id: 'schubert-erlkonig',
    title: 'Erlkönig',
    composer_name: 'Franz Schubert',
    catalog_number: 'D. 328 / Op. 1',
    instruments: ['Voice (Baritone/Tenor)', 'Piano'],
    era: 'Romantic',
    form: 'Lied',
    duration_minutes: 4,
    difficulty: 'advanced',
    description: 'Schubert\'s dramatic setting of Goethe\'s ballad, composed at age 18. The singer portrays four characters (narrator, father, son, Erlking) while the pianist drives relentless triplet octaves that evoke a nighttime horseback ride. A technical and dramatic tour de force for both performers.',
    editions: [
      { id: 'e-schubert-ek-peters', publisher: 'Peters', editor: 'Max Friedländer', year: 1900, description: 'Classic Peters edition, available in multiple keys. The standard performance edition for over a century.' },
      { id: 'e-schubert-ek-henle', publisher: 'Henle Verlag', editor: 'Walther Dürr', year: 2005, description: 'Part of the Neue Schubert-Ausgabe. Critical Urtext based on Schubert\'s autograph.' }
    ],
    external_links: [
      { type: 'imslp', url: 'https://imslp.org/wiki/Erlk%C3%B6nig,_D.328_(Schubert,_Franz)', label: 'IMSLP — Erlkönig' },
      { type: 'youtube', url: 'https://www.youtube.com/watch?v=JS91p-vmSf0', label: 'Fischer-Dieskau / Moore — definitive recording' },
      { type: 'wikipedia', url: 'https://en.wikipedia.org/wiki/Erlk%C3%B6nig_(Schubert)', label: 'Wikipedia — Erlkönig' },
      { type: 'spotify', url: 'https://open.spotify.com/track/0hES7IYAQSwBAPXJeLKcGN', label: 'Dietrich Fischer-Dieskau / Gerald Moore (1965)' },
      { type: 'spotify', url: 'https://open.spotify.com/track/7amy9gggHIGsU7pd8vHZEL', label: 'Ian Bostridge / Julius Drake' },
      { type: 'spotify', url: 'https://open.spotify.com/track/4oomOHx8NgPq2flBcGxtxD', label: 'Bryn Terfel / Malcolm Martineau' },
      { type: 'internet_archive', url: 'https://archive.org/details/erlkonig-dfd-gm-66-68', label: 'Fischer-Dieskau / Moore — DG 1966-68' },
    ],
  },

  // === MORE PIANO ===
  {
    id: 'bach-wtc-prelude-fugue-1',
    title: 'Prelude and Fugue No. 1 in C major (WTC I)',
    composer_name: 'Johann Sebastian Bach',
    catalog_number: 'BWV 846',
    instruments: ['Piano', 'Harpsichord'],
    era: 'Baroque',
    form: 'Prelude and Fugue',
    duration_minutes: 4,
    difficulty: 'intermediate',
    description: 'The opening piece of The Well-Tempered Clavier, Book I. The Prelude\'s flowing broken chords became the foundation for Gounod\'s Ave Maria. The four-voice fugue is a model of contrapuntal writing and one of the first pieces many students encounter when studying Bach.',
    editions: [
      { id: 'e-bach-wtc1-henle', publisher: 'Henle Verlag', editor: 'Ernst-Günter Heinemann', year: 2007, description: 'Urtext with fingerings by Andras Schiff. The modern standard for WTC performance.' },
      { id: 'e-bach-wtc1-bischoff', publisher: 'Kalmus (reprint)', editor: 'Hans Bischoff', year: 1883, description: 'Historic critical edition. Still valued for Bischoff\'s scholarly notes, though superseded by modern Urtexts.' }
    ],
    external_links: [
      { type: 'imslp', url: 'https://imslp.org/wiki/The_Well-Tempered_Clavier,_Book_1,_BWV_846-869_(Bach,_Johann_Sebastian)', label: 'IMSLP — Well-Tempered Clavier I' },
      { type: 'wikipedia', url: 'https://en.wikipedia.org/wiki/The_Well-Tempered_Clavier', label: 'Wikipedia — Well-Tempered Clavier' },
      { type: 'youtube', url: 'https://www.youtube.com/watch?v=gVah1cr3pU0', label: 'Lang Lang – Bach: The Well-Tempered Clavier: Book 1, 1.Prelude C Major, BWV 846' },
    ],
    movements: [
      { name: 'Prelude in C major' },
      { name: 'Fugue in C major' },
    ],
  },

  // === FLUTE ===
  {
    id: 'mozart-flute-concerto-1',
    title: 'Flute Concerto No. 1 in G major',
    composer_name: 'Wolfgang Amadeus Mozart',
    catalog_number: 'K. 313',
    instruments: ['Flute'],
    era: 'Classical',
    form: 'Concerto',
    duration_minutes: 24,
    difficulty: 'advanced',
    description: 'The first of Mozart\'s two flute concertos, composed in 1778. Elegant and lyrical, with a sparkling finale. A standard audition piece for orchestral flute positions worldwide.',
    editions: [
      { id: 'e-mozart-fc1-barenreiter', publisher: 'Bärenreiter', editor: 'Franz Giegling', year: 1981, description: 'Neue Mozart-Ausgabe critical edition. The scholarly benchmark.' },
      { id: 'e-mozart-fc1-henle', publisher: 'Henle Verlag', editor: 'Henrik Wiese', year: 2013, description: 'Urtext with cadenzas. Includes both historically appropriate and modern cadenza options.' }
    ],
    external_links: [
      { type: 'imslp', url: 'https://imslp.org/wiki/Flute_Concerto_No.1_in_G_major,_K.313/285c_(Mozart,_Wolfgang_Amadeus)', label: 'IMSLP — Mozart Flute Concerto No. 1' },
      { type: 'wikipedia', url: 'https://en.wikipedia.org/wiki/Flute_Concerto_No._1_(Mozart)', label: 'Wikipedia — Mozart Flute Concerto No. 1' }
    ],
  },

  // === MORE CELLO ===
  {
    id: 'elgar-cello-concerto',
    title: 'Cello Concerto in E minor',
    composer_name: 'Edward Elgar',
    catalog_number: 'Op. 85',
    instruments: ['Cello'],
    era: 'Post-Romantic',
    form: 'Concerto',
    duration_minutes: 30,
    difficulty: 'professional',
    description: 'Elgar\'s last major work, composed in 1919 in the shadow of World War I. Its autumnal, elegiac character makes it one of the most emotionally profound concertos in the repertoire. Forever associated with Jacqueline du Pré\'s legendary 1965 recording.',
    editions: [
      { id: 'e-elgar-cc-novello', publisher: 'Novello', editor: 'Original publication', year: 1919, description: 'The original Novello edition, overseen by Elgar. Standard performance edition.' },
      { id: 'e-elgar-cc-barenreiter', publisher: 'Bärenreiter', editor: 'Jonathan Del Mar', year: 2020, description: 'New critical edition correcting errors in previous printings. The most accurate modern source.' }
    ],
    external_links: [
      { type: 'wikipedia', url: 'https://en.wikipedia.org/wiki/Cello_Concerto_(Elgar)', label: 'Wikipedia — Elgar Cello Concerto' },
      { type: 'spotify', url: 'https://open.spotify.com/album/3PwJLGFcKrecmaRbJQYMSg', label: 'Sheku Kanneh-Mason / LSO / Rattle — BBC Young Musician winner (2020)' },
      { type: 'spotify', url: 'https://open.spotify.com/album/4cIcY14P7NSdOvpW1wJMev', label: 'Jacqueline du Pré / LSO / Barbirolli — Landmark recording' },
      { type: 'spotify', url: 'https://open.spotify.com/album/0O62RntbSupfaZeryUMml5', label: 'Alisa Weilerstein / Staatskapelle Berlin / Barenboim' },
      { type: 'spotify', url: 'https://open.spotify.com/album/77rF1FKgWjluNtGCTs8YUz', label: 'Sol Gabetta — Live: Elgar & Martinů' },
      { type: 'internet_archive', url: 'https://archive.org/details/j.duprej.barbirolliliveatprague03011967elgarcelloconcerto', label: 'Jacqueline du Pré / Barbirolli — Live Prague 1967' },
      { type: 'vimeo', url: 'https://vimeo.com/212893480', label: 'Truls Mørk / Concertgebouw — Live Amsterdam 2017' },
    ],
    movements: [
      { name: 'I. Adagio — Moderato' },
      { name: 'II. Lento — Allegro molto' },
      { name: 'III. Adagio' },
      { name: 'IV. Allegro — Moderato — Allegro, ma non troppo' },
    ],
  },

  // === MORE VIOLIN ===
  {
    id: 'tchaikovsky-violin-concerto',
    title: 'Violin Concerto in D major',
    composer_name: 'Pyotr Ilyich Tchaikovsky',
    catalog_number: 'Op. 35',
    instruments: ['Violin'],
    era: 'Romantic',
    form: 'Concerto',
    duration_minutes: 35,
    difficulty: 'professional',
    description: 'Initially dismissed by critics as "unplayable," Tchaikovsky\'s violin concerto is now one of the most performed in the repertoire. The first movement\'s soaring melodies, the Canzonetta\'s intimate beauty, and the fiery finale make it a complete test of a violinist\'s technique and musicality.',
    editions: [
      { id: 'e-tchaik-vc-henle', publisher: 'Henle Verlag', editor: 'Ernst Herttrich', year: 2015, description: 'Urtext with two bowing variants: Tchaikovsky\'s original and Auer\'s practical revisions.' },
      { id: 'e-tchaik-vc-imi', publisher: 'International Music Company', editor: 'David Oistrakh', year: 1965, description: 'Oistrakh\'s performance edition with his own fingerings and bowings. Invaluable practical insights from the greatest interpreter of this concerto.' }
    ],
    external_links: [
      { type: 'imslp', url: 'https://imslp.org/wiki/Violin_Concerto_in_D_major,_Op.35_(Tchaikovsky,_Pyotr)', label: 'IMSLP — Tchaikovsky Violin Concerto' },
      { type: 'wikipedia', url: 'https://en.wikipedia.org/wiki/Violin_Concerto_(Tchaikovsky)', label: 'Wikipedia — Tchaikovsky Violin Concerto' },
      { type: 'spotify', url: 'https://open.spotify.com/album/5Iijzf1oBpKJwatVUb2P7o', label: 'Hilary Hahn / Royal Liverpool PO — Grammy Award winner' },
      { type: 'spotify', url: 'https://open.spotify.com/album/1yI084e5Lz0yNVQNBT4sNa', label: 'Nicola Benedetti / Czech Philharmonic / Hrůša' },
      { type: 'spotify', url: 'https://open.spotify.com/track/0V6V6fwKxTHDrsLLmgW432', label: 'Itzhak Perlman / Philadelphia Orchestra / Ormandy' },
      { type: 'internet_archive', url: 'https://archive.org/details/TCHAIKOVSKYViolinConcerto-Heifetz-NEWTRANSFER', label: 'Jascha Heifetz — Landmark recording (remastered)' },
      { type: 'internet_archive', url: 'https://archive.org/details/TCHAIKOVSKYViolinConcerto-Milstein-NewTransfer', label: 'Nathan Milstein — Historic recording (remastered)' },
    ],
    movements: [
      { name: 'I. Allegro moderato' },
      { name: 'II. Canzonetta: Andante' },
      { name: 'III. Finale: Allegro vivacissimo' },
    ],
  },

  // === MORE PIANO ===
  {
    id: 'rachmaninoff-piano-concerto-2',
    title: 'Piano Concerto No. 2 in C minor',
    composer_name: 'Sergei Rachmaninoff',
    catalog_number: 'Op. 18',
    instruments: ['Piano'],
    era: 'Late Romantic',
    form: 'Concerto',
    duration_minutes: 33,
    difficulty: 'professional',
    description: 'Written after Rachmaninoff\'s recovery from a creative crisis, this concerto opens with the famous bell-like chords that build from pianissimo to the sweeping main theme. The slow movement\'s opening clarinet and flute melody over piano arpeggios is one of the most beautiful passages in all of music.',
    editions: [
      { id: 'e-rach-pc2-boosey', publisher: 'Boosey & Hawkes', editor: 'Original publication', year: 1901, description: 'The standard Boosey & Hawkes edition. Based on the composer\'s own revisions.' },
      { id: 'e-rach-pc2-muzyka', publisher: 'Muzyka', editor: 'Pavel Lamm', year: 1947, description: 'Russian critical edition from the collected works. Includes some alternate readings from Rachmaninoff\'s manuscripts.' }
    ],
    external_links: [
      { type: 'imslp', url: 'https://imslp.org/wiki/Piano_Concerto_No.2,_Op.18_(Rachmaninoff,_Sergei)', label: 'IMSLP — Rachmaninoff Piano Concerto No. 2' },
      { type: 'youtube', url: 'https://www.youtube.com/watch?v=rEGOihjqO9w', label: 'Rachmaninoff: Piano Concerto No. 2 — Anna Fedorova' },
      { type: 'wikipedia', url: 'https://en.wikipedia.org/wiki/Piano_Concerto_No._2_(Rachmaninoff)', label: 'Wikipedia — Rachmaninoff Piano Concerto No. 2' },
      { type: 'spotify', url: 'https://open.spotify.com/album/0v3T6fPnrptRXOrd854hIl', label: 'Yuja Wang / LA Philharmonic / Dudamel (2023)' },
      { type: 'spotify', url: 'https://open.spotify.com/track/7fcDQg8prLdJwim6Ey7neB', label: 'Khatia Buniatishvili / Czech Philharmonic / Järvi' },
      { type: 'internet_archive', url: 'https://archive.org/details/RACHMANINOFFPianoConcertoNo.2-Richter', label: 'Sviatoslav Richter — Landmark recording' },
      { type: 'internet_archive', url: 'https://archive.org/details/RACHMANINOFFPianoConcertoNo.2InCMinor-NEWTRANSFER', label: 'Rachmaninoff / Philadelphia Orchestra / Stokowski — 1929 historic' },
    ],
    movements: [
      { name: 'I. Moderato' },
      { name: 'II. Adagio sostenuto' },
      { name: 'III. Allegro scherzando' },
    ],
  },

  // === MORE CELLO (17 pieces to reach 20) ===
  {
    id: 'bach-cello-suite-2',
    title: 'Cello Suite No. 2 in D minor',
    composer_name: 'Johann Sebastian Bach',
    catalog_number: 'BWV 1008',
    instruments: ['Cello'],
    era: 'Baroque',
    form: 'Suite',
    duration_minutes: 22,
    difficulty: 'intermediate',
    description: 'The second of Bach\'s six suites for unaccompanied cello, set in D minor, lending it a darker and more introspective character than the first suite. The Prelude features a distinctive arpeggiated pattern that unfolds into complex polyphonic writing. The Sarabande is particularly austere and moving, while the closing Gigue provides rhythmic vitality.',
    editions: [
      { id: 'e-bach-cs2-henle', publisher: 'Henle Verlag', editor: 'Egon Voss', year: 2000, description: 'Critical Urtext based on Anna Magdalena Bach\'s manuscript copy. Clean text with minimal editorial intervention.' },
      { id: 'e-bach-cs2-barenreiter', publisher: 'Bärenreiter', editor: 'Bettina Schwemer & Douglas Woodfull-Harris', year: 2012, description: 'Scholarly edition with comprehensive critical commentary and facsimile comparison from all surviving sources.' },
      { id: 'e-bach-cs2-wiener', publisher: 'Wiener Urtext', editor: 'Wolfgang Boettcher', year: 2004, description: 'Urtext with practical performance suggestions. Includes bowings that balance historical awareness with modern technique.' }
    ],
    external_links: [
      { type: 'imslp', url: 'https://imslp.org/wiki/Cello_Suite_No.2_in_D_minor,_BWV_1008_(Bach,_Johann_Sebastian)', label: 'IMSLP — Cello Suite No. 2' },
      { type: 'wikipedia', url: 'https://en.wikipedia.org/wiki/Cello_Suites_(Bach)', label: 'Wikipedia — Bach Cello Suites' },
      { type: 'spotify', url: 'https://open.spotify.com/track/3oXgDnhVSSNEwWCdobzliC', label: 'Anastasia Kobekina — Prelude (2025)' },
      { type: 'spotify', url: 'https://open.spotify.com/track/2vO5wNNXjXU28OWp5gyHEO', label: 'Yo-Yo Ma — Prelude' },
      { type: 'spotify', url: 'https://open.spotify.com/track/79IIPSm0SPeUf4axiNTopk', label: 'Mstislav Rostropovich — Prelude' },
      { type: 'spotify', url: 'https://open.spotify.com/album/2CAPFGnqtqzx5LjuWILaC9', label: 'Alisa Weilerstein — Complete Cello Suites (2020)' },
      { type: 'internet_archive', url: 'https://archive.org/details/lp_suites-for-unaccompanied-violoncello-no-1_pablo-casals-johann-sebastian-bach', label: 'Pablo Casals — Suites No. 1 & 2 (historic LP)' },
      { type: 'internet_archive', url: 'https://archive.org/details/bachcellosuites_rostropovich', label: 'Mstislav Rostropovich — Complete Bach Cello Suites' },
    ],
    movements: [
      { name: 'I. Prelude' },
      { name: 'II. Allemande' },
      { name: 'III. Courante' },
      { name: 'IV. Sarabande' },
      { name: 'V. Menuet I & II' },
      { name: 'VI. Gigue' },
    ],
  },
  {
    id: 'bach-cello-suite-3',
    title: 'Cello Suite No. 3 in C major',
    composer_name: 'Johann Sebastian Bach',
    catalog_number: 'BWV 1009',
    instruments: ['Cello'],
    era: 'Baroque',
    form: 'Suite',
    duration_minutes: 23,
    difficulty: 'advanced',
    description: 'The third suite returns to a bright, expansive key and is the most extroverted of the set. The Prelude\'s brilliant scale passages and bariolage figuration exploit the full sonority of the instrument. The Bourrées are among the most popular individual movements from the suites, frequently performed as encores.',
    editions: [
      { id: 'e-bach-cs3-henle', publisher: 'Henle Verlag', editor: 'Egon Voss', year: 2000, description: 'Urtext edition with source-critical apparatus. Part of Henle\'s complete suites volume.' },
      { id: 'e-bach-cs3-barenreiter', publisher: 'Bärenreiter', editor: 'Bettina Schwemer & Douglas Woodfull-Harris', year: 2012, description: 'New critical edition drawing on all surviving manuscript copies with detailed editorial report.' }
    ],
    external_links: [
      { type: 'imslp', url: 'https://imslp.org/wiki/Cello_Suite_No.3_in_C_major,_BWV_1009_(Bach,_Johann_Sebastian)', label: 'IMSLP — Cello Suite No. 3' },
      { type: 'youtube', url: 'https://www.youtube.com/watch?v=mGQLXRTl3Z0', label: 'Mischa Maisky plays Bach Cello Suite No.1 in G' },
      { type: 'wikipedia', url: 'https://en.wikipedia.org/wiki/Cello_Suites_(Bach)', label: 'Wikipedia — Bach Cello Suites' },
      { type: 'spotify', url: 'https://open.spotify.com/track/6CBJw0LW0MRwNcmqQ3KBNd', label: 'Steven Isserlis — Prelude' },
      { type: 'spotify', url: 'https://open.spotify.com/track/4HBGaiBz5jIN3qwf6xACmH', label: 'Yo-Yo Ma — Prelude' },
      { type: 'spotify', url: 'https://open.spotify.com/album/2CAPFGnqtqzx5LjuWILaC9', label: 'Alisa Weilerstein — Complete Cello Suites (2020)' },
      { type: 'internet_archive', url: 'https://archive.org/details/lp_suites-for-cello-unaccompanied-no-3-in-c-m_johann-sebastian-bach-pablo-casals', label: 'Pablo Casals — Suites No. 3 & 4 (historic LP)' },
      { type: 'internet_archive', url: 'https://archive.org/details/bach-j.s.-suites-for-cello-cello-bwv-1007-1012-pierre-fournier', label: 'Pierre Fournier — Complete Cello Suites' },
    ],
    movements: [
      { name: 'I. Prelude' },
      { name: 'II. Allemande' },
      { name: 'III. Courante' },
      { name: 'IV. Sarabande' },
      { name: 'V. Bourrée I & II' },
      { name: 'VI. Gigue' },
    ],
  },
  {
    id: 'bach-cello-suite-4',
    title: 'Cello Suite No. 4 in E-flat major',
    composer_name: 'Johann Sebastian Bach',
    catalog_number: 'BWV 1010',
    instruments: ['Cello'],
    era: 'Baroque',
    form: 'Suite',
    duration_minutes: 25,
    difficulty: 'advanced',
    description: 'The fourth suite marks a shift in technical demands, with the key of E-flat major requiring less resonant string crossings and more careful intonation. The Prelude is a grand, French overture-like movement. The Sarabande is one of Bach\'s most harmonically rich slow movements, and the Bourrées provide spirited contrast.',
    editions: [
      { id: 'e-bach-cs4-henle', publisher: 'Henle Verlag', editor: 'Egon Voss', year: 2000, description: 'Urtext based on all surviving sources with minimal editorial additions.' },
      { id: 'e-bach-cs4-peters', publisher: 'Peters', editor: 'Hugo Becker', year: 1911, description: 'Older pedagogical edition with Romantic-era bowings and fingerings. Historically interesting but editorially heavy.' },
      { id: 'e-bach-cs4-barenreiter', publisher: 'Bärenreiter', editor: 'Bettina Schwemer & Douglas Woodfull-Harris', year: 2012, description: 'Critical edition with facsimile and comprehensive source comparison.' }
    ],
    external_links: [
      { type: 'imslp', url: 'https://imslp.org/wiki/Cello_Suite_No.4_in_E-flat_major,_BWV_1010_(Bach,_Johann_Sebastian)', label: 'IMSLP — Cello Suite No. 4' },
      { type: 'wikipedia', url: 'https://en.wikipedia.org/wiki/Cello_Suites_(Bach)', label: 'Wikipedia — Bach Cello Suites' },
      { type: 'spotify', url: 'https://open.spotify.com/track/0dDcSr2vBxvILNB8oTpI01', label: 'Yo-Yo Ma — Prelude' },
      { type: 'spotify', url: 'https://open.spotify.com/album/1AxgfOUwe0LCmQiwxElEzb', label: 'Anastasia Kobekina — Bach Cello Suites (2025)' },
      { type: 'spotify', url: 'https://open.spotify.com/track/0krN1xBgSqDHCNV3dPADZn', label: 'Emmanuelle Bertrand — Prelude' },
      { type: 'internet_archive', url: 'https://archive.org/details/lp_suites-for-cello-unaccompanied-no-3-in-c-m_johann-sebastian-bach-pablo-casals', label: 'Pablo Casals — Suites No. 3 & 4 (historic LP)' },
      { type: 'internet_archive', url: 'https://archive.org/details/lp_intgrale-des-six-suites-pour-violoncelle-s_johann-sebastian-bach-janos-starker', label: 'János Starker — Complete Suites (historic)' },
    ],
    movements: [
      { name: 'I. Prelude' },
      { name: 'II. Allemande' },
      { name: 'III. Courante' },
      { name: 'IV. Sarabande' },
      { name: 'V. Bourrée I & II' },
      { name: 'VI. Gigue' },
    ],
  },
  {
    id: 'bach-cello-suite-5',
    title: 'Cello Suite No. 5 in C minor',
    composer_name: 'Johann Sebastian Bach',
    catalog_number: 'BWV 1011',
    instruments: ['Cello'],
    era: 'Baroque',
    form: 'Suite',
    duration_minutes: 27,
    difficulty: 'professional',
    description: 'The fifth suite requires scordatura tuning (the A string lowered to G), giving the instrument a darker, veiled sonority. The Prelude opens with a grave French overture before launching into an elaborate fugue. The Sarabande, built from stark single notes and double stops, is one of Bach\'s most profound slow movements.',
    editions: [
      { id: 'e-bach-cs5-henle', publisher: 'Henle Verlag', editor: 'Egon Voss', year: 2000, description: 'Urtext with clear notation of scordatura tuning. Source-critical commentary included.' },
      { id: 'e-bach-cs5-barenreiter', publisher: 'Bärenreiter', editor: 'Bettina Schwemer & Douglas Woodfull-Harris', year: 2012, description: 'Critical edition including both scordatura and standard tuning notations with full critical apparatus.' }
    ],
    external_links: [
      { type: 'imslp', url: 'https://imslp.org/wiki/Cello_Suite_No.5_in_C_minor,_BWV_1011_(Bach,_Johann_Sebastian)', label: 'IMSLP — Cello Suite No. 5' },
      { type: 'wikipedia', url: 'https://en.wikipedia.org/wiki/Cello_Suites_(Bach)', label: 'Wikipedia — Bach Cello Suites' },
      { type: 'spotify', url: 'https://open.spotify.com/track/7ekIYM7PEFS47LwMes5Y5g', label: 'Yo-Yo Ma — Prelude' },
      { type: 'spotify', url: 'https://open.spotify.com/track/265LZkpBksnPVvE80mkwOz', label: 'Bruno Philippe — Prelude (2022)' },
      { type: 'spotify', url: 'https://open.spotify.com/track/0SvpN8VUVlR0LmZhiz7zue', label: 'Jean-Guihen Queyras — Prelude (2024)' },
      { type: 'internet_archive', url: 'https://archive.org/details/suite-no.-5-in-c-minor-for-cello', label: 'Frans Helmerson — Suite No. 5 (1974)' },
      { type: 'internet_archive', url: 'https://archive.org/details/bach-j.s.-the-six-suites-for-violoncelo-solo-bwv-1007-1012-nikolaus-harnoncourt-dvg', label: 'Nikolaus Harnoncourt — Complete Suites (baroque cello)' },
    ],
    movements: [
      { name: 'I. Prelude' },
      { name: 'II. Allemande' },
      { name: 'III. Courante' },
      { name: 'IV. Sarabande' },
      { name: 'V. Gavotte I & II' },
      { name: 'VI. Gigue' },
    ],
  },
  {
    id: 'bach-cello-suite-6',
    title: 'Cello Suite No. 6 in D major',
    composer_name: 'Johann Sebastian Bach',
    catalog_number: 'BWV 1012',
    instruments: ['Cello'],
    era: 'Baroque',
    form: 'Suite',
    duration_minutes: 30,
    difficulty: 'professional',
    description: 'The final and most technically demanding of the six suites, likely written for a five-stringed instrument (viola pomposa or violoncello piccolo). The addition of a high E string allows passages in the soprano register that are extremely challenging on a standard four-string cello. The Prelude is a virtuosic showpiece, and the Gavottes are joyful and dance-like.',
    editions: [
      { id: 'e-bach-cs6-henle', publisher: 'Henle Verlag', editor: 'Egon Voss', year: 2000, description: 'Urtext with notes on the five-string instrument question. Part of the complete suites volume.' },
      { id: 'e-bach-cs6-barenreiter', publisher: 'Bärenreiter', editor: 'Bettina Schwemer & Douglas Woodfull-Harris', year: 2012, description: 'Critical edition with extensive discussion of the intended instrument and tuning.' },
      { id: 'e-bach-cs6-imi', publisher: 'International Music Company', editor: 'Leonard Rose', year: 1950, description: 'Practical edition with Rose\'s fingerings adapted for four-string cello. Standard American pedagogical edition.' }
    ],
    external_links: [
      { type: 'imslp', url: 'https://imslp.org/wiki/Cello_Suite_No.6_in_D_major,_BWV_1012_(Bach,_Johann_Sebastian)', label: 'IMSLP — Cello Suite No. 6' },
      { type: 'wikipedia', url: 'https://en.wikipedia.org/wiki/Cello_Suites_(Bach)', label: 'Wikipedia — Bach Cello Suites' },
      { type: 'spotify', url: 'https://open.spotify.com/track/7j8Zvc4SWkmjohXxuraria', label: 'Yo-Yo Ma — Prelude' },
      { type: 'spotify', url: 'https://open.spotify.com/track/3h5asYrn0bnWSlhfPdzrCh', label: 'Pieter Wispelwey — Sarabande' },
      { type: 'spotify', url: 'https://open.spotify.com/track/395a36jZL57W6VKFHSMxWX', label: 'Steven Isserlis — Sarabande' },
      { type: 'vimeo', url: 'https://vimeo.com/channels/earlymusic/29470725', label: 'William Skeen — Gavotte (baroque cello)' },
      { type: 'internet_archive', url: 'https://archive.org/details/01-alc-02-bach-cello-suites-2-5-6', label: 'Dimitry Markevitch — Cello Suites 2, 5 & 6' },
    ],
    movements: [
      { name: 'I. Prelude' },
      { name: 'II. Allemande' },
      { name: 'III. Courante' },
      { name: 'IV. Sarabande' },
      { name: 'V. Gavotte I & II' },
      { name: 'VI. Gigue' },
    ],
  },
  {
    id: 'haydn-cello-concerto-1',
    title: 'Cello Concerto No. 1 in C major',
    composer_name: 'Joseph Haydn',
    catalog_number: 'Hob.VIIb:1',
    instruments: ['Cello'],
    era: 'Classical',
    form: 'Concerto',
    duration_minutes: 25,
    difficulty: 'professional',
    description: 'Lost for nearly two centuries and rediscovered in Prague in 1961, this concerto has since become a cornerstone of the cello repertoire. Its brilliant first movement, lyrical Adagio, and spirited finale display a Classical elegance that demands both technical precision and stylistic finesse. The work dates from Haydn\'s early years at Esterházy.',
    editions: [
      { id: 'e-haydn-cc1-henle', publisher: 'Henle Verlag', editor: 'Sonja Gerlach', year: 1981, description: 'Urtext edition based on the recovered autograph. The standard scholarly text.' },
      { id: 'e-haydn-cc1-barenreiter', publisher: 'Bärenreiter', editor: 'Sonja Gerlach', year: 1984, description: 'Critical edition from the Joseph Haydn Werke. Includes orchestral parts and cadenza suggestions.' },
      { id: 'e-haydn-cc1-imi', publisher: 'International Music Company', editor: 'Leonard Rose', year: 1967, description: 'Performance edition with Rose\'s fingerings and bowings. Includes cadenzas by the editor.' }
    ],
    external_links: [
      { type: 'imslp', url: 'https://imslp.org/wiki/Cello_Concerto_No.1_in_C_major,_Hob.VIIb:1_(Haydn,_Joseph)', label: 'IMSLP — Haydn Cello Concerto No. 1' },
      { type: 'wikipedia', url: 'https://en.wikipedia.org/wiki/Cello_Concerto_No._1_(Haydn)', label: 'Wikipedia — Haydn Cello Concerto No. 1' },
      { type: 'spotify', url: 'https://open.spotify.com/album/5lIyZy3BA2mzcQjgobHQva', label: 'Gautier Capuçon / Mahler Chamber Orchestra / Harding' },
      { type: 'spotify', url: 'https://open.spotify.com/track/5Dcrc4FKYFZ1K2X29d0UpM', label: 'Mstislav Rostropovich / ASMF — Cadenza by Britten' },
      { type: 'spotify', url: 'https://open.spotify.com/track/07Oij3AVn2iUvRZOq9I8bb', label: 'Yo-Yo Ma / English Chamber Orchestra' },
      { type: 'internet_archive', url: 'https://archive.org/details/HaydnCelloConcertoNo.1InCMajorHob.Viib1', label: 'Mstislav Rostropovich / ASMF (1988)' },
    ],
    movements: [
      { name: 'I. Moderato' },
      { name: 'II. Adagio' },
      { name: 'III. Allegro molto' },
    ],
  },
  {
    id: 'haydn-cello-concerto-2',
    title: 'Cello Concerto No. 2 in D major',
    composer_name: 'Joseph Haydn',
    catalog_number: 'Hob.VIIb:2',
    instruments: ['Cello'],
    era: 'Classical',
    form: 'Concerto',
    duration_minutes: 25,
    difficulty: 'advanced',
    description: 'Composed around 1783, this concerto is one of the most frequently performed works for cello and orchestra. The singing Adagio is a masterpiece of Classical lyricism, and the Rondo finale brims with Haydnesque wit and energy. The concerto has been recorded by virtually every major cellist of the modern era.',
    editions: [
      { id: 'e-haydn-cc2-henle', publisher: 'Henle Verlag', editor: 'Sonja Gerlach', year: 1985, description: 'Urtext based on autograph and early copies. Includes cadenzas in a supplement.' },
      { id: 'e-haydn-cc2-barenreiter', publisher: 'Bärenreiter', editor: 'Sonja Gerlach', year: 1989, description: 'Part of the Haydn Gesamtausgabe. Scholarly critical notes and clean engraving.' }
    ],
    external_links: [
      { type: 'imslp', url: 'https://imslp.org/wiki/Cello_Concerto_No.2_in_D_major,_Hob.VIIb:2_(Haydn,_Joseph)', label: 'IMSLP — Haydn Cello Concerto No. 2' },
      { type: 'wikipedia', url: 'https://en.wikipedia.org/wiki/Cello_Concerto_No._2_(Haydn)', label: 'Wikipedia — Haydn Cello Concerto No. 2' },
      { type: 'spotify', url: 'https://open.spotify.com/album/5lIyZy3BA2mzcQjgobHQva', label: 'Gautier Capuçon / Mahler Chamber Orchestra / Harding' },
      { type: 'spotify', url: 'https://open.spotify.com/track/4YjekQXLEgXAUtIT9u5I3r', label: 'Jacqueline du Pré / LSO / Barbirolli' },
      { type: 'spotify', url: 'https://open.spotify.com/track/7tiAXCvYvxbuqA1pwU0QDn', label: 'Steven Isserlis / COE / Norrington' },
      { type: 'internet_archive', url: 'https://archive.org/details/haydn-cello-concertos-nos.-1-2', label: 'Lynn Harrell / ASMF / Marriner' },
      { type: 'internet_archive', url: 'https://archive.org/details/lp_haydn-cello-concerto-in-c-boccherini-cell_jacqueline-du-pr-daniel-barenboim-joseph-h', label: 'Jacqueline du Pré / Barenboim — Haydn & Boccherini (LP)' },
    ],
    movements: [
      { name: 'I. Allegro moderato' },
      { name: 'II. Adagio' },
      { name: 'III. Rondo: Allegro' },
    ],
  },
  {
    id: 'schumann-cello-concerto',
    title: 'Cello Concerto in A minor',
    composer_name: 'Robert Schumann',
    catalog_number: 'Op. 129',
    instruments: ['Cello'],
    era: 'Romantic',
    form: 'Concerto',
    duration_minutes: 26,
    difficulty: 'professional',
    description: 'Composed in just two weeks in 1850, Schumann\'s only cello concerto is a deeply personal, through-composed work in which the three movements flow without pause. The orchestration is intentionally restrained to let the cello sing. Though initially neglected, it is now recognized as one of the great Romantic concertos and a staple of the repertoire.',
    editions: [
      { id: 'e-schumann-cc-henle', publisher: 'Henle Verlag', editor: 'Ernst Herttrich', year: 2001, description: 'Urtext based on autograph and first edition. Includes the original cadenza passage.' },
      { id: 'e-schumann-cc-breitkopf', publisher: 'Breitkopf & Härtel', editor: 'Original publication', year: 1854, description: 'The first edition, published posthumously. Historically significant as the primary source for early performers.' },
      { id: 'e-schumann-cc-imi', publisher: 'International Music Company', editor: 'Leonard Rose', year: 1962, description: 'Performance edition with Rose\'s practical bowings and fingerings. Widely used in American conservatories.' }
    ],
    external_links: [
      { type: 'imslp', url: 'https://imslp.org/wiki/Cello_Concerto_in_A_minor,_Op.129_(Schumann,_Robert)', label: 'IMSLP — Schumann Cello Concerto' },
      { type: 'wikipedia', url: 'https://en.wikipedia.org/wiki/Cello_Concerto_(Schumann)', label: 'Wikipedia — Schumann Cello Concerto' },
      { type: 'spotify', url: 'https://open.spotify.com/album/7o54pvt3DHOw6CUgXbMznF', label: 'Gautier Capuçon / Haitink / Chamber Orchestra of Europe — Live (2019)' },
      { type: 'spotify', url: 'https://open.spotify.com/track/1D18l8wZj2PZ4nzXTYo8ln', label: 'Jacqueline du Pré / Barenboim / New Philharmonia' },
      { type: 'internet_archive', url: 'https://archive.org/details/lp_cello-concerto-five-pieces-in-folk-style_robert-schumann-pablo-casals-prades-festiv', label: 'Pablo Casals — Prades Festival (historic)' },
      { type: 'internet_archive', url: 'https://archive.org/details/lp_cello-concerto-schelomo-rhapsody-for-ce_leonard-rose-robert-schumann-leonard-berns', label: 'Leonard Rose / Bernstein / New York Philharmonic' },
    ],
    movements: [
      { name: 'I. Nicht zu schnell' },
      { name: 'II. Langsam' },
      { name: 'III. Sehr lebhaft' },
    ],
  },
  {
    id: 'saint-saens-cello-concerto-1',
    title: 'Cello Concerto No. 1 in A minor',
    composer_name: 'Camille Saint-Saëns',
    catalog_number: 'Op. 33',
    instruments: ['Cello'],
    era: 'Romantic',
    form: 'Concerto',
    duration_minutes: 20,
    difficulty: 'professional',
    description: 'A compact, single-movement concerto in three connected sections that unfolds with irresistible momentum. The opening theme bursts in immediately with urgent energy. Saint-Saëns masterfully balances virtuoso display with elegant French lyricism, and the work has remained one of the most popular cello concertos since its 1873 premiere.',
    editions: [
      { id: 'e-ss-cc1-durand', publisher: 'Durand', editor: 'Original publication', year: 1873, description: 'The original Durand edition, published in the composer\'s lifetime. The standard French source.' },
      { id: 'e-ss-cc1-henle', publisher: 'Henle Verlag', editor: 'Peter Jost', year: 2016, description: 'Urtext edition based on autograph and first edition. Clear engraving with critical notes.' },
      { id: 'e-ss-cc1-imi', publisher: 'International Music Company', editor: 'Leonard Rose', year: 1960, description: 'Practical performance edition with bowings and fingerings by one of the great American cellists.' }
    ],
    external_links: [
      { type: 'imslp', url: 'https://imslp.org/wiki/Cello_Concerto_No.1,_Op.33_(Saint-Sa%C3%ABns,_Camille)', label: 'IMSLP — Saint-Saëns Cello Concerto No. 1' },
      { type: 'wikipedia', url: 'https://en.wikipedia.org/wiki/Cello_Concerto_No._1_(Saint-Sa%C3%ABns)', label: 'Wikipedia — Saint-Saëns Cello Concerto No. 1' },
      { type: 'spotify', url: 'https://open.spotify.com/track/7fypWvEPty7DCveyRNamTN', label: 'Gautier Capuçon / Bringuier / Orchestre Philharmonique de Radio France' },
      { type: 'spotify', url: 'https://open.spotify.com/track/1sIHqy6vKF4GVsOGrR8H8a', label: 'Han-Na Chang / Rostropovich / LSO' },
      { type: 'internet_archive', url: 'https://archive.org/details/lp_two-great-cello-concertos_camille-saintsans-douard-lalo-andr-navarra', label: 'André Navarra / Münch / Orchestre des Concerts Lamoureux' },
      { type: 'internet_archive', url: 'https://archive.org/details/nobel-prize-concert-2021', label: 'Sol Gabetta — 2021 Nobel Prize Concert' },
    ],
  },
  {
    id: 'brahms-cello-sonata-1',
    title: 'Cello Sonata No. 1 in E minor',
    composer_name: 'Johannes Brahms',
    catalog_number: 'Op. 38',
    instruments: ['Cello', 'Piano'],
    era: 'Romantic',
    form: 'Sonata',
    duration_minutes: 25,
    difficulty: 'advanced',
    description: 'Brahms\'s first cello sonata, composed between 1862 and 1865, is a work of grave beauty in three movements. The opening Allegro non troppo features long-breathed melodies in the cello\'s rich lower register. The finale is a masterly fugue that pays homage to Bach\'s Art of Fugue while remaining unmistakably Brahmsian.',
    editions: [
      { id: 'e-brahms-cs1-henle', publisher: 'Henle Verlag', editor: 'Ernst Herttrich', year: 2000, description: 'Urtext based on autograph and first edition. Fingerings by Janos Starker.' },
      { id: 'e-brahms-cs1-peters', publisher: 'Peters', editor: 'Friedrich Grützmacher', year: 1871, description: 'Historic Peters edition. Grützmacher\'s editorial additions are heavier than modern taste prefers but of historical interest.' }
    ],
    external_links: [
      { type: 'imslp', url: 'https://imslp.org/wiki/Cello_Sonata_No.1,_Op.38_(Brahms,_Johannes)', label: 'IMSLP — Brahms Cello Sonata No. 1' },
      { type: 'wikipedia', url: 'https://en.wikipedia.org/wiki/Cello_Sonata_No._1_(Brahms)', label: 'Wikipedia — Brahms Cello Sonata No. 1' },
      { type: 'spotify', url: 'https://open.spotify.com/track/51om33yZB4mzqP287DSSn2', label: 'Yo-Yo Ma / Emanuel Ax' },
      { type: 'spotify', url: 'https://open.spotify.com/track/0ZtgCxmIDZG1aAs1SEt1FQ', label: 'Jacqueline du Pré / Barenboim' },
      { type: 'spotify', url: 'https://open.spotify.com/track/3gXrLgst05Onm15YgFv7d7', label: 'Jean-Guihen Queyras / Alexandre Tharaud' },
      { type: 'internet_archive', url: 'https://archive.org/details/20220922-brahms-cello-sonatas-opp.-38-99-mstislav-rostropovich', label: 'Mstislav Rostropovich / Rudolf Serkin' },
    ],
    movements: [
      { name: 'I. Allegro non troppo' },
      { name: 'II. Allegretto quasi menuetto' },
      { name: 'III. Allegro' },
    ],
  },
  {
    id: 'shostakovich-cello-concerto-1',
    title: 'Cello Concerto No. 1 in E-flat major',
    composer_name: 'Dmitri Shostakovich',
    catalog_number: 'Op. 107',
    instruments: ['Cello'],
    era: '20th Century',
    form: 'Concerto',
    duration_minutes: 28,
    difficulty: 'professional',
    description: 'Written in 1959 for Mstislav Rostropovich, this concerto is a tour de force of modern cello writing. The four-note motto theme (D-S-C-H, the composer\'s musical monogram) permeates the work. The extended solo cadenza connecting the third and fourth movements is one of the most demanding passages in the cello repertoire. The orchestration is lean, featuring a prominent solo horn as a foil to the cello.',
    editions: [
      { id: 'e-shost-cc1-sikorski', publisher: 'Sikorski', editor: 'Manashir Yakubov', year: 2005, description: 'Collected works edition from the Shostakovich estate. The primary critical source.' },
      { id: 'e-shost-cc1-boosey', publisher: 'Boosey & Hawkes', editor: 'Licensed reprint', year: 1960, description: 'Western distribution edition. Clear engraving based on the original Muzyka plates.' }
    ],
    external_links: [
      { type: 'wikipedia', url: 'https://en.wikipedia.org/wiki/Cello_Concerto_No._1_(Shostakovich)', label: 'Wikipedia — Shostakovich Cello Concerto No. 1' },
      { type: 'spotify', url: 'https://open.spotify.com/album/5YbrLDgDvaC5i5JqY6fBou', label: 'Sol Gabetta / Lorin Maazel' },
      { type: 'spotify', url: 'https://open.spotify.com/track/0EFVPhrcAJxu4r65BjkveH', label: 'Gautier Capuçon / Gergiev / Mariinsky Orchestra' },
      { type: 'spotify', url: 'https://open.spotify.com/track/4dLVUG0RvDi1DmwWr48UcP', label: 'Yo-Yo Ma / Nelsons / Boston Symphony' },
      { type: 'internet_archive', url: 'https://archive.org/details/lp_concerto-for-cello-in-e-flat-op-107-symph_dmitri-shostakovich-mstislav-rostropovich_0', label: 'Mstislav Rostropovich / Ormandy — 1959 premiere recording' },
    ],
    movements: [
      { name: 'I. Allegretto' },
      { name: 'II. Moderato' },
      { name: 'III. Cadenza' },
      { name: 'IV. Allegro con moto' },
    ],
  },
  {
    id: 'prokofiev-sinfonia-concertante',
    title: 'Sinfonia Concertante for Cello and Orchestra',
    composer_name: 'Sergei Prokofiev',
    catalog_number: 'Op. 125',
    instruments: ['Cello'],
    era: '20th Century',
    form: 'Concerto',
    duration_minutes: 38,
    difficulty: 'professional',
    description: 'Prokofiev\'s last major completed work, extensively revised with input from Rostropovich. It is a thorough reworking of the earlier Cello Concerto Op. 58, expanded into a three-movement symphonic concerto of enormous scope and difficulty. The writing exploits the full range of the cello with lyrical cantilenas, biting scherzando passages, and a monumental theme-and-variations finale.',
    editions: [
      { id: 'e-prok-sc-boosey', publisher: 'Boosey & Hawkes', editor: 'Licensed from Muzyka', year: 1956, description: 'Standard Western edition based on the revised score prepared with Rostropovich.' },
      { id: 'e-prok-sc-muzyka', publisher: 'Muzyka', editor: 'Original publication', year: 1955, description: 'Original Soviet edition. Contains the definitive text as approved by the composer before his death.' }
    ],
    external_links: [
      { type: 'wikipedia', url: 'https://en.wikipedia.org/wiki/Sinfonia_Concertante_(Prokofiev)', label: 'Wikipedia — Prokofiev Sinfonia Concertante' }
    ],
  },
  {
    id: 'kodaly-solo-cello-sonata',
    title: 'Sonata for Solo Cello',
    composer_name: 'Zoltán Kodály',
    catalog_number: 'Op. 8',
    instruments: ['Cello'],
    era: '20th Century',
    form: 'Sonata',
    duration_minutes: 30,
    difficulty: 'professional',
    description: 'One of the most important works for unaccompanied cello since Bach. Composed in 1915, it requires scordatura tuning (both lower strings tuned down a semitone to B and F-sharp) to create rich folk-like resonances. The three movements draw deeply on Hungarian folk music while pushing cello technique to its limits with chordal writing, rapid passage work, and extraordinary timbral variety.',
    editions: [
      { id: 'e-kodaly-sc-boosey', publisher: 'Boosey & Hawkes', editor: 'Original publication', year: 1921, description: 'Standard edition published under the composer\'s supervision. Clear and reliable.' },
      { id: 'e-kodaly-sc-emb', publisher: 'Editio Musica Budapest', editor: 'Revised edition', year: 1968, description: 'Hungarian edition with corrected errors from the first printing. Includes notes on the scordatura tuning.' }
    ],
    external_links: [
      { type: 'imslp', url: 'https://imslp.org/wiki/Cello_Sonata,_Op.8_(Kod%C3%A1ly,_Zolt%C3%A1n)', label: 'IMSLP — Kodály Solo Cello Sonata' },
      { type: 'wikipedia', url: 'https://en.wikipedia.org/wiki/Sonata_for_Solo_Cello_(Kod%C3%A1ly)', label: 'Wikipedia — Kodály Solo Cello Sonata' },
      { type: 'spotify', url: 'https://open.spotify.com/track/0FQhbYzkI5XiGkjmdBNsII', label: 'Gautier Capuçon' },
      { type: 'spotify', url: 'https://open.spotify.com/track/7plpqyCO2HlNi4fhIrKctj', label: 'Alisa Weilerstein' },
      { type: 'internet_archive', url: 'https://archive.org/details/lp_kodaly-sonata-for-solo-cello-starker-duo_zoltn-kodly-janos-starker-arnold-eidus', label: 'János Starker — Landmark recording' },
    ],
    movements: [
      { name: 'I. Allegro maestoso ma appassionato' },
      { name: 'II. Adagio (con grand espressione)' },
      { name: 'III. Allegro molto vivace' },
    ],
  },
  {
    id: 'beethoven-cello-sonata-3',
    title: 'Cello Sonata No. 3 in A major',
    composer_name: 'Ludwig van Beethoven',
    catalog_number: 'Op. 69',
    instruments: ['Cello', 'Piano'],
    era: 'Classical',
    form: 'Sonata',
    duration_minutes: 25,
    difficulty: 'advanced',
    description: 'The finest of Beethoven\'s five cello sonatas and a landmark in the chamber music repertoire. Composed in 1808 during the same fertile period as the Fifth and Sixth Symphonies, the sonata opens with the cello singing an expansive melody unaccompanied. The three movements display a perfect balance between the two instruments, with Beethoven treating them as true equals.',
    editions: [
      { id: 'e-beeth-cs3-henle', publisher: 'Henle Verlag', editor: 'Jens Dufner', year: 2010, description: 'Urtext based on the autograph. Cello fingerings by David Geringas.' },
      { id: 'e-beeth-cs3-barenreiter', publisher: 'Bärenreiter', editor: 'Jonathan Del Mar', year: 2014, description: 'New critical edition with detailed source comparison. Del Mar\'s meticulous editorial approach is exemplary.' },
      { id: 'e-beeth-cs3-peters', publisher: 'Peters', editor: 'Friedrich Grützmacher', year: 1870, description: 'Classic Peters edition. The editorial additions reflect 19th-century performance practice.' }
    ],
    external_links: [
      { type: 'imslp', url: 'https://imslp.org/wiki/Cello_Sonata_No.3,_Op.69_(Beethoven,_Ludwig_van)', label: 'IMSLP — Beethoven Cello Sonata No. 3' },
      { type: 'wikipedia', url: 'https://en.wikipedia.org/wiki/Cello_Sonata_No._3_(Beethoven)', label: 'Wikipedia — Beethoven Cello Sonata No. 3' },
      { type: 'spotify', url: 'https://open.spotify.com/track/1e15iKuVlLHPlSoVmpLTHQ', label: 'Mischa Maisky / Martha Argerich' },
      { type: 'spotify', url: 'https://open.spotify.com/track/1fqodfB87Tx5Y7ZZ9zi0XY', label: 'Jacqueline du Pré / Barenboim' },
      { type: 'internet_archive', url: 'https://archive.org/details/janos-starker-rudolf-buchbinder-beethoven-cello-sonata-no.-3-in-a-major-op.-69-0', label: 'János Starker / Rudolf Buchbinder' },
      { type: 'internet_archive', url: 'https://archive.org/details/lp_sonatas-for-cello-piano-complete_ludwig-van-beethoven-gregor-piatigorsky-so', label: 'Gregor Piatigorsky — Complete Cello Sonatas' },
    ],
    movements: [
      { name: 'I. Allegro, ma non tanto' },
      { name: 'II. Scherzo: Allegro molto' },
      { name: 'III. Adagio cantabile — Allegro vivace' },
    ],
  },
  {
    id: 'faure-elegie',
    title: 'Élégie in C minor',
    composer_name: 'Gabriel Fauré',
    catalog_number: 'Op. 24',
    instruments: ['Cello', 'Piano'],
    era: 'Romantic',
    form: 'Character piece',
    duration_minutes: 7,
    difficulty: 'intermediate',
    description: 'Originally the slow movement of an abandoned cello sonata, this standalone piece has become one of the most beloved works in the cello repertoire. Its mournful opening theme builds through a passionate climax before subsiding into a quiet, resigned close. The Élégie exists in versions for cello and piano as well as cello and orchestra.',
    editions: [
      { id: 'e-faure-el-durand', publisher: 'Durand', editor: 'Original publication', year: 1883, description: 'Original French edition from Fauré\'s publisher. The primary source.' },
      { id: 'e-faure-el-henle', publisher: 'Henle Verlag', editor: 'Fabian Kolb', year: 2018, description: 'Urtext edition with critical commentary. Includes both piano and orchestral versions.' },
      { id: 'e-faure-el-imi', publisher: 'International Music Company', editor: 'Leonard Rose', year: 1955, description: 'Performance edition with bowings and fingerings suitable for advanced students.' }
    ],
    external_links: [
      { type: 'imslp', url: 'https://imslp.org/wiki/%C3%89l%C3%A9gie,_Op.24_(Faur%C3%A9,_Gabriel)', label: 'IMSLP — Fauré Élégie' },
      { type: 'wikipedia', url: 'https://en.wikipedia.org/wiki/%C3%89l%C3%A9gie_(Faur%C3%A9)', label: 'Wikipedia — Fauré Élégie' },
      { type: 'spotify', url: 'https://open.spotify.com/track/0ltuoiadYI1yt88tz2otOk', label: 'Julia Hagen / Renaud Capuçon — Rising star (2024)' },
      { type: 'spotify', url: 'https://open.spotify.com/track/5JCFv9UugPZSY8b9VrGBqm', label: 'Steven Isserlis / Pascal Devoyon' },
      { type: 'internet_archive', url: 'https://archive.org/details/faure-elegie-rose-ormandy', label: 'Leonard Rose / Ormandy / Philadelphia Orchestra (1967)' },
    ],
  },
  {
    id: 'popper-hungarian-rhapsody',
    title: 'Hungarian Rhapsody',
    composer_name: 'David Popper',
    catalog_number: 'Op. 68',
    instruments: ['Cello', 'Piano'],
    era: 'Romantic',
    form: 'Rhapsody',
    duration_minutes: 9,
    difficulty: 'professional',
    description: 'A dazzling showpiece by the great cellist-composer, showcasing the full virtuosic potential of the instrument in a Hungarian-flavored rhapsodic form. The work alternates between soulful lassan sections and fiery friss passages, demanding brilliant left-hand technique, natural harmonics, and rapid string crossings. A perennial favorite for recitals and competitions.',
    editions: [
      { id: 'e-popper-hr-imi', publisher: 'International Music Company', editor: 'Leonard Rose', year: 1960, description: 'Standard performance edition with practical fingerings and bowings.' },
      { id: 'e-popper-hr-peters', publisher: 'Peters', editor: 'Original publication', year: 1894, description: 'First edition from the composer\'s lifetime. Engraving is less clean than modern editions but historically authentic.' }
    ],
    external_links: [
      { type: 'imslp', url: 'https://imslp.org/wiki/Hungarian_Rhapsody,_Op.68_(Popper,_David)', label: 'IMSLP — Popper Hungarian Rhapsody' },
      { type: 'wikipedia', url: 'https://en.wikipedia.org/wiki/David_Popper', label: 'Wikipedia — David Popper' }
    ],
  },
  {
    id: 'boccherini-cello-concerto-9',
    title: 'Cello Concerto No. 9 in B-flat major',
    composer_name: 'Luigi Boccherini',
    catalog_number: 'G. 482',
    instruments: ['Cello'],
    era: 'Classical',
    form: 'Concerto',
    duration_minutes: 22,
    difficulty: 'advanced',
    description: 'Long known in Grützmacher\'s heavily rearranged edition, this concerto has been restored to its original form by modern scholarship. Boccherini, himself a virtuoso cellist, wrote with an intimate knowledge of the instrument. The Adagio non troppo is notable for its operatic cantabile, and the finale sparkles with wit and rhythmic drive.',
    editions: [
      { id: 'e-bocc-cc9-henle', publisher: 'Henle Verlag', editor: 'Christian Speck', year: 2007, description: 'Urtext based on the autograph, restoring Boccherini\'s original orchestration and solo part.' },
      { id: 'e-bocc-cc9-imi', publisher: 'International Music Company', editor: 'Friedrich Grützmacher', year: 1895, description: 'The famous Grützmacher arrangement that conflates movements from multiple concertos. Historically important but not authentic.' },
      { id: 'e-bocc-cc9-schirmer', publisher: 'G. Schirmer', editor: 'Samuel Dushkin', year: 1940, description: 'Performance edition based on the Grützmacher version. Widely used in the American studio tradition.' }
    ],
    external_links: [
      { type: 'imslp', url: 'https://imslp.org/wiki/Cello_Concerto_in_B-flat_major,_G.482_(Boccherini,_Luigi)', label: 'IMSLP — Boccherini Cello Concerto' },
      { type: 'wikipedia', url: 'https://en.wikipedia.org/wiki/Luigi_Boccherini', label: 'Wikipedia — Luigi Boccherini' }
    ],
  },

  // === MORE VOICE (13 pieces to reach 15) ===
  {
    id: 'mozart-voi-che-sapete',
    title: 'Voi che sapete (Le nozze di Figaro)',
    composer_name: 'Wolfgang Amadeus Mozart',
    catalog_number: 'K. 492',
    instruments: ['Voice (Mezzo-Soprano)'],
    era: 'Classical',
    form: 'Aria',
    duration_minutes: 3,
    difficulty: 'intermediate',
    description: 'Cherubino\'s canzona from Act II of The Marriage of Figaro, in which the lovestruck page describes the confusion of adolescent desire. Written in a simple, song-like ABA form with a gentle orchestral accompaniment, it is one of Mozart\'s most perfectly crafted vocal miniatures. A staple of the mezzo-soprano audition repertoire.',
    editions: [
      { id: 'e-mozart-vcs-barenreiter', publisher: 'Bärenreiter', editor: 'Ludwig Finscher', year: 1973, description: 'Neue Mozart-Ausgabe critical edition. The scholarly standard for Le nozze di Figaro.' },
      { id: 'e-mozart-vcs-schirmer', publisher: 'G. Schirmer', editor: 'Ruth Martin & Thomas Martin', year: 1951, description: 'Vocal score with English and Italian text. Standard for studio and audition preparation.' },
      { id: 'e-mozart-vcs-peters', publisher: 'Peters', editor: 'Kurt Soldan', year: 1941, description: 'German/Italian vocal score. Practical edition widely used in European conservatories.' }
    ],
    external_links: [
      { type: 'wikipedia', url: 'https://en.wikipedia.org/wiki/The_Marriage_of_Figaro', label: 'Wikipedia — Le nozze di Figaro' }
    ],
  },
  {
    id: 'mozart-la-ci-darem-la-mano',
    title: 'Là ci darem la mano (Don Giovanni)',
    composer_name: 'Wolfgang Amadeus Mozart',
    catalog_number: 'K. 527',
    instruments: ['Voice (Soprano)', 'Voice (Baritone)'],
    era: 'Classical',
    form: 'Duet',
    duration_minutes: 4,
    difficulty: 'intermediate',
    description: 'The seduction duet from Act I of Don Giovanni, in which Don Giovanni persuades the peasant girl Zerlina to accompany him. The music begins as an elegant dialogue and gradually merges into a rapturous duet in thirds and sixths. It is a masterpiece of operatic characterization through music, and one of the most frequently excerpted numbers from the opera.',
    editions: [
      { id: 'e-mozart-lcl-barenreiter', publisher: 'Bärenreiter', editor: 'Wolfgang Plath & Wolfgang Rehm', year: 1968, description: 'Neue Mozart-Ausgabe critical edition of Don Giovanni. The definitive scholarly text.' },
      { id: 'e-mozart-lcl-schirmer', publisher: 'G. Schirmer', editor: 'Ruth Martin & Thomas Martin', year: 1961, description: 'Vocal score with Italian and English text. Practical for studio work and auditions.' }
    ],
    external_links: [
      { type: 'wikipedia', url: 'https://en.wikipedia.org/wiki/Don_Giovanni', label: 'Wikipedia — Don Giovanni' }
    ],
  },
  {
    id: 'puccini-nessun-dorma',
    title: 'Nessun dorma (Turandot)',
    composer_name: 'Giacomo Puccini',
    catalog_number: null,
    instruments: ['Voice (Tenor)'],
    era: 'Late Romantic',
    form: 'Aria',
    duration_minutes: 3,
    difficulty: 'professional',
    description: 'The iconic tenor aria from the final act of Turandot, in which Prince Calaf awaits dawn, confident that he will win the princess. The aria builds from a hushed opening to the triumphant climactic high B on "Vincerò!" Made famous worldwide by Luciano Pavarotti\'s performance at the 1990 FIFA World Cup, it is arguably the most recognized operatic aria in popular culture.',
    editions: [
      { id: 'e-puccini-nd-ricordi', publisher: 'Ricordi', editor: 'Original publication', year: 1926, description: 'The original Ricordi edition, published posthumously. The definitive text completed by Franco Alfano.' },
      { id: 'e-puccini-nd-schirmer', publisher: 'G. Schirmer', editor: 'Licensed reprint', year: 1958, description: 'Vocal score with English and Italian text. Standard for American studios and auditions.' }
    ],
    external_links: [
      { type: 'youtube', url: 'https://www.youtube.com/watch?v=cWc7vYjgnTs', label: 'Luciano Pavarotti sings "Nessun dorma" from Turandot' },
      { type: 'wikipedia', url: 'https://en.wikipedia.org/wiki/Nessun_dorma', label: 'Wikipedia — Nessun dorma' },
      { type: 'spotify', url: 'https://open.spotify.com/track/6zagJMi6gpqVQSX8yWNe3F', label: 'Jonathan Tetelman / PKF Prague Philharmonia — Rising star tenor' },
      { type: 'spotify', url: 'https://open.spotify.com/track/74WjYdm3Lvbwnds4thYPUU', label: 'Luciano Pavarotti / Mehta / LPO' },
      { type: 'internet_archive', url: 'https://archive.org/details/78_nessun-dorma-none-shall-sleep_jussi-bjrling-adami-simoni-puccini-nils-grevilli_gbia7015432a', label: 'Jussi Björling — 1946 historic landmark' },
    ],
  },
  {
    id: 'puccini-o-mio-babbino-caro',
    title: 'O mio babbino caro (Gianni Schicchi)',
    composer_name: 'Giacomo Puccini',
    catalog_number: null,
    instruments: ['Voice (Soprano)'],
    era: 'Late Romantic',
    form: 'Aria',
    duration_minutes: 2,
    difficulty: 'intermediate',
    description: 'A brief but exquisite soprano aria from Puccini\'s one-act comic opera Gianni Schicchi. Lauretta pleads with her father to let her marry the man she loves, threatening to throw herself into the Arno if denied. The melody floats above a gently rocking orchestral accompaniment in A-flat major. One of the most popular soprano arias for recitals and auditions.',
    editions: [
      { id: 'e-puccini-ombc-ricordi', publisher: 'Ricordi', editor: 'Original publication', year: 1918, description: 'Original Ricordi vocal score. The authoritative source for all Puccini operas.' },
      { id: 'e-puccini-ombc-schirmer', publisher: 'G. Schirmer', editor: 'Licensed reprint', year: 1962, description: 'Italian/English vocal score. Widely used in American studios and vocal anthologies.' }
    ],
    external_links: [
      { type: 'wikipedia', url: 'https://en.wikipedia.org/wiki/O_mio_babbino_caro', label: 'Wikipedia — O mio babbino caro' }
    ],
  },
  {
    id: 'puccini-che-gelida-manina',
    title: 'Che gelida manina (La bohème)',
    composer_name: 'Giacomo Puccini',
    catalog_number: null,
    instruments: ['Voice (Tenor)'],
    era: 'Late Romantic',
    form: 'Aria',
    duration_minutes: 5,
    difficulty: 'advanced',
    description: 'Rodolfo\'s Act I aria from La bohème, in which he introduces himself to Mimì by describing his life as a poet. The aria progresses from conversational recitative to soaring lyricism, culminating in a sustained high C that has become a hallmark test for lyric tenors. The aria captures Puccini\'s genius for marrying text and melody into an emotionally irresistible whole.',
    editions: [
      { id: 'e-puccini-cgm-ricordi', publisher: 'Ricordi', editor: 'Original publication', year: 1896, description: 'Original Ricordi vocal score of La bohème. The standard source worldwide.' },
      { id: 'e-puccini-cgm-schirmer', publisher: 'G. Schirmer', editor: 'Licensed reprint', year: 1954, description: 'Italian/English vocal score. Practical for American audition and studio use.' },
      { id: 'e-puccini-cgm-dover', publisher: 'Dover', editor: 'Full score reprint', year: 1987, description: 'Affordable full orchestral score, useful for study and conducting preparation.' }
    ],
    external_links: [
      { type: 'wikipedia', url: 'https://en.wikipedia.org/wiki/Che_gelida_manina', label: 'Wikipedia — Che gelida manina' }
    ],
  },
  {
    id: 'verdi-la-donna-e-mobile',
    title: 'La donna è mobile (Rigoletto)',
    composer_name: 'Giuseppe Verdi',
    catalog_number: null,
    instruments: ['Voice (Tenor)'],
    era: 'Romantic',
    form: 'Aria',
    duration_minutes: 2,
    difficulty: 'intermediate',
    description: 'The Duke of Mantua\'s carefree canzone from Act III of Rigoletto, whose catchy tune conceals the opera\'s darkest irony. Verdi famously kept the melody secret until the premiere, knowing its instant memorability would spread it through the streets of Venice overnight. The aria demands a ringing top B and a light, insouciant delivery despite its underlying dramatic weight.',
    editions: [
      { id: 'e-verdi-ldm-ricordi', publisher: 'Ricordi', editor: 'Original publication', year: 1851, description: 'The original Ricordi vocal score. Primary source for all Verdi operas.' },
      { id: 'e-verdi-ldm-schirmer', publisher: 'G. Schirmer', editor: 'Ruth Martin & Thomas Martin', year: 1957, description: 'Italian/English vocal score. Standard American studio and audition edition.' }
    ],
    external_links: [
      { type: 'youtube', url: 'https://www.youtube.com/watch?v=8A3zetSuYRg', label: 'Rigoletto La Dona e mobile' },
      { type: 'youtube', url: 'https://www.youtube.com/watch?v=xCFEk6Y8TmM', label: 'Luciano Pavarotti - La Donna È Mobile' },
      { type: 'wikipedia', url: 'https://en.wikipedia.org/wiki/La_donna_%C3%A8_mobile', label: 'Wikipedia — La donna è mobile' },
      { type: 'spotify', url: 'https://open.spotify.com/track/25ZYvZ2qFw7XCu8nzUxxmU', label: 'Luciano Pavarotti / Bonynge / LSO' },
      { type: 'internet_archive', url: 'https://archive.org/details/78_la-donna-mobile-woman-is-fickle_enrico-caruso-verdi_gbia7023700b', label: 'Enrico Caruso — 1904 historic landmark (78rpm)' },
      { type: 'internet_archive', url: 'https://archive.org/details/78_la-donna--mobile-woman-is-fickle_mario-lanza-rca-victor-orchestra-constantine-ca_gbia0002571b', label: 'Mario Lanza / RCA Victor Orchestra (1951)' },
    ],
  },
  {
    id: 'verdi-va-pensiero',
    title: 'Va, pensiero (Nabucco)',
    composer_name: 'Giuseppe Verdi',
    catalog_number: null,
    instruments: ['Voice (Chorus)'],
    era: 'Romantic',
    form: 'Chorus',
    duration_minutes: 5,
    difficulty: 'intermediate',
    description: 'The "Chorus of the Hebrew Slaves" from Act III of Nabucco, Verdi\'s breakthrough opera. A unison melody of heartbreaking simplicity, it was adopted as an unofficial anthem of Italian unification during the Risorgimento. The chorus builds from a hushed pianissimo to a passionate fortissimo climax before subsiding. It remains one of the most powerful and moving choral moments in all of opera.',
    editions: [
      { id: 'e-verdi-vp-ricordi', publisher: 'Ricordi', editor: 'Original publication', year: 1842, description: 'Original Ricordi vocal score. The foundational source for this landmark opera.' },
      { id: 'e-verdi-vp-schirmer', publisher: 'G. Schirmer', editor: 'Licensed reprint', year: 1960, description: 'Italian/English vocal score widely used in English-speaking countries.' },
      { id: 'e-verdi-vp-dover', publisher: 'Dover', editor: 'Full score reprint', year: 1998, description: 'Affordable full orchestral score for study and conducting preparation.' }
    ],
    external_links: [
      { type: 'youtube', url: 'https://www.youtube.com/watch?v=2F4G5H_TTvU', label: 'Nabucco - Hebrew Slaves Chorus' },
      { type: 'wikipedia', url: 'https://en.wikipedia.org/wiki/Va,_pensiero', label: 'Wikipedia — Va, pensiero' }
    ],
  },
  {
    id: 'schubert-ave-maria',
    title: 'Ave Maria (Ellens dritter Gesang)',
    composer_name: 'Franz Schubert',
    catalog_number: 'D. 839 / Op. 52 No. 6',
    instruments: ['Voice (Soprano)', 'Piano'],
    era: 'Romantic',
    form: 'Lied',
    duration_minutes: 5,
    difficulty: 'intermediate',
    description: 'Schubert\'s setting of Adam Storck\'s German translation of a passage from Walter Scott\'s "The Lady of the Lake." Although commonly associated with the Latin "Ave Maria" prayer, Schubert\'s original text is quite different. The gently rocking piano accompaniment and ethereal vocal line have made it one of the most beloved melodies ever composed, performed at weddings, funerals, and concerts worldwide.',
    editions: [
      { id: 'e-schubert-am-peters', publisher: 'Peters', editor: 'Max Friedländer', year: 1900, description: 'Classic Peters edition available in multiple keys. The standard performance edition.' },
      { id: 'e-schubert-am-henle', publisher: 'Henle Verlag', editor: 'Walther Dürr', year: 2003, description: 'Urtext from the Neue Schubert-Ausgabe. Faithful to the composer\'s original markings.' }
    ],
    external_links: [
      { type: 'imslp', url: 'https://imslp.org/wiki/Ellens_Gesang_III,_D.839_(Schubert,_Franz)', label: 'IMSLP — Schubert Ave Maria' },
      { type: 'youtube', url: 'https://www.youtube.com/watch?v=2bosouX_d8Y', label: 'Schubert - Ave Maria' },
      { type: 'wikipedia', url: 'https://en.wikipedia.org/wiki/Ellens_dritter_Gesang', label: 'Wikipedia — Ave Maria (Schubert)' }
    ],
  },
  {
    id: 'schubert-die-forelle',
    title: 'Die Forelle (The Trout)',
    composer_name: 'Franz Schubert',
    catalog_number: 'D. 550 / Op. 32',
    instruments: ['Voice (Soprano/Tenor)', 'Piano'],
    era: 'Romantic',
    form: 'Lied',
    duration_minutes: 2,
    difficulty: 'intermediate',
    description: 'One of Schubert\'s most charming songs, depicting a trout swimming in a brook and a fisherman\'s treachery. The piano\'s sparkling figuration evokes the play of water with a vividness that inspired Schubert to reuse the melody in his "Trout" Quintet. The strophic form with a modified final verse is a model of Romantic song craft.',
    editions: [
      { id: 'e-schubert-df-peters', publisher: 'Peters', editor: 'Max Friedländer', year: 1900, description: 'Standard Peters edition in multiple keys. Reliable and widely available.' },
      { id: 'e-schubert-df-henle', publisher: 'Henle Verlag', editor: 'Walther Dürr', year: 2003, description: 'Urtext from the Neue Schubert-Ausgabe. Includes all five versions composed by Schubert.' }
    ],
    external_links: [
      { type: 'imslp', url: 'https://imslp.org/wiki/Die_Forelle,_D.550_(Schubert,_Franz)', label: 'IMSLP — Die Forelle' },
      { type: 'wikipedia', url: 'https://en.wikipedia.org/wiki/Die_Forelle', label: 'Wikipedia — Die Forelle' }
    ],
  },
  {
    id: 'handel-ombra-mai-fu',
    title: 'Ombra mai fu (Serse)',
    composer_name: 'George Frideric Handel',
    catalog_number: 'HWV 40',
    instruments: ['Voice (Countertenor/Mezzo-Soprano)'],
    era: 'Baroque',
    form: 'Aria',
    duration_minutes: 3,
    difficulty: 'intermediate',
    description: 'The opening aria of Handel\'s opera Serse (Xerxes), commonly known as "Handel\'s Largo." King Xerxes addresses the shade of a plane tree with tender affection. Despite its serene beauty, the aria was originally semi-comic in context. It has become one of the most frequently performed Baroque arias and is widely arranged for instruments.',
    editions: [
      { id: 'e-handel-omf-barenreiter', publisher: 'Bärenreiter', editor: 'Rudolf Steglich', year: 1958, description: 'Hallische Händel-Ausgabe critical edition. The scholarly standard for Handel operas.' },
      { id: 'e-handel-omf-novello', publisher: 'Novello', editor: 'Chrysander reprint', year: 1880, description: 'Based on the Chrysander collected edition. Widely available and still commonly used.' },
      { id: 'e-handel-omf-schirmer', publisher: 'G. Schirmer', editor: 'Anthology edition', year: 1950, description: 'Available in the Schirmer anthology of Baroque arias in multiple keys.' }
    ],
    external_links: [
      { type: 'imslp', url: 'https://imslp.org/wiki/Serse,_HWV_40_(Handel,_George_Frideric)', label: 'IMSLP — Serse (Xerxes)' },
      { type: 'youtube', url: 'https://www.youtube.com/watch?v=N7XH-58eB8c', label: 'Andreas Scholl — countertenor' },
      { type: 'wikipedia', url: 'https://en.wikipedia.org/wiki/Ombra_mai_fu', label: 'Wikipedia — Ombra mai fu' }
    ],
  },
  {
    id: 'bach-erbarme-dich',
    title: 'Erbarme dich, mein Gott (St Matthew Passion)',
    composer_name: 'Johann Sebastian Bach',
    catalog_number: 'BWV 244',
    instruments: ['Voice (Alto)', 'Violin'],
    era: 'Baroque',
    form: 'Aria',
    duration_minutes: 7,
    difficulty: 'advanced',
    description: 'The most deeply affecting aria from Bach\'s monumental St Matthew Passion, sung after Peter\'s denial of Christ. The alto voice interweaves with a solo violin obbligato over a pulsing orchestral accompaniment in B minor. The aria\'s extraordinary emotional depth and its marriage of grief with sublime beauty represent a pinnacle of Baroque vocal writing.',
    editions: [
      { id: 'e-bach-ed-barenreiter', publisher: 'Bärenreiter', editor: 'Alfred Dürr', year: 1972, description: 'Neue Bach-Ausgabe critical edition. The definitive scholarly text of the St Matthew Passion.' },
      { id: 'e-bach-ed-peters', publisher: 'Peters', editor: 'Traditional edition', year: 1898, description: 'Historic vocal score widely used for concert preparation. Some editorial additions.' }
    ],
    external_links: [
      { type: 'imslp', url: 'https://imslp.org/wiki/Matth%C3%A4uspassion,_BWV_244_(Bach,_Johann_Sebastian)', label: 'IMSLP — St Matthew Passion' },
      { type: 'wikipedia', url: 'https://en.wikipedia.org/wiki/St_Matthew_Passion', label: 'Wikipedia — St Matthew Passion' }
    ],
  },
  {
    id: 'bizet-habanera',
    title: 'L\'amour est un oiseau rebelle — Habanera (Carmen)',
    composer_name: 'Georges Bizet',
    catalog_number: null,
    instruments: ['Voice (Mezzo-Soprano)'],
    era: 'Romantic',
    form: 'Aria',
    duration_minutes: 4,
    difficulty: 'intermediate',
    description: 'Carmen\'s entrance aria from Act I, built on a descending chromatic melody over a habanera rhythm. Carmen declares that love is a rebellious bird that no one can tame. Bizet adapted the melody from a song by Sebastián Yradier, believing it to be a genuine folk tune. The aria\'s sultry allure and dramatic flair have made it one of the most iconic moments in all of opera.',
    editions: [
      { id: 'e-bizet-hab-choudens', publisher: 'Choudens', editor: 'Original publication', year: 1875, description: 'The original French vocal score. Primary source for Carmen.' },
      { id: 'e-bizet-hab-schirmer', publisher: 'G. Schirmer', editor: 'Licensed edition', year: 1958, description: 'French/English vocal score widely used in American opera houses and studios.' },
      { id: 'e-bizet-hab-peters', publisher: 'Peters', editor: 'Fritz Oeser', year: 1964, description: 'Critical edition that restores dialogue passages often replaced by recitatives in the Guiraud version.' }
    ],
    external_links: [
      { type: 'youtube', url: 'https://www.youtube.com/watch?v=KJ_HHRJf0xg', label: 'Carmen - Habanera' },
      { type: 'wikipedia', url: 'https://en.wikipedia.org/wiki/Habanera_(Carmen)', label: 'Wikipedia — Habanera (Carmen)' }
    ],
  },
  {
    id: 'brahms-wiegenlied',
    title: 'Wiegenlied (Lullaby)',
    composer_name: 'Johannes Brahms',
    catalog_number: 'Op. 49 No. 4',
    instruments: ['Voice (Soprano)', 'Piano'],
    era: 'Romantic',
    form: 'Lied',
    duration_minutes: 2,
    difficulty: 'beginner',
    description: 'Perhaps the most famous lullaby ever written, composed in 1868 for Brahms\'s friend Bertha Faber on the birth of her second son. The melody, with its gentle rocking rhythm, has permeated global culture far beyond the concert hall. Musically, Brahms cleverly wove a counter-melody from an Austrian folk song that Bertha used to sing to him. The song exists in countless arrangements for every conceivable combination.',
    editions: [
      { id: 'e-brahms-wl-peters', publisher: 'Peters', editor: 'Max Friedländer', year: 1922, description: 'Standard Peters Lieder edition. Available in multiple keys.' },
      { id: 'e-brahms-wl-henle', publisher: 'Henle Verlag', editor: 'Hanns-Josef Ortheil', year: 2005, description: 'Urtext in the original key of E-flat major. Critical notes based on autograph sources.' }
    ],
    external_links: [
      { type: 'imslp', url: 'https://imslp.org/wiki/5_Lieder,_Op.49_(Brahms,_Johannes)', label: 'IMSLP — 5 Lieder Op. 49' },
      { type: 'wikipedia', url: 'https://en.wikipedia.org/wiki/Wiegenlied_(Brahms)', label: 'Wikipedia — Brahms Wiegenlied' }
    ],
  },

  // === FLUTE / CLARINET / OTHER (8 more to reach 10) ===
  {
    id: 'mozart-clarinet-concerto',
    title: 'Clarinet Concerto in A major',
    composer_name: 'Wolfgang Amadeus Mozart',
    catalog_number: 'K. 622',
    instruments: ['Clarinet'],
    era: 'Classical',
    form: 'Concerto',
    duration_minutes: 28,
    difficulty: 'advanced',
    description: 'Mozart\'s last instrumental concerto, written in October 1791 for his friend Anton Stadler and the basset clarinet. The Adagio second movement is one of the most serene and beautiful slow movements Mozart ever composed. The concerto exploits the clarinet\'s extraordinary range and tonal palette, from the chalumeau register\'s warmth to the clarion register\'s brilliance.',
    editions: [
      { id: 'e-mozart-clc-barenreiter', publisher: 'Bärenreiter', editor: 'Franz Giegling', year: 1977, description: 'Neue Mozart-Ausgabe critical edition, including the basset clarinet version reconstructed from fragmentary sources.' },
      { id: 'e-mozart-clc-henle', publisher: 'Henle Verlag', editor: 'Henrik Wiese', year: 2003, description: 'Urtext with both standard A clarinet and basset clarinet versions. Includes cadenza suggestions.' },
      { id: 'e-mozart-clc-boosey', publisher: 'Boosey & Hawkes', editor: 'Eric Simon', year: 1956, description: 'Practical edition for standard A clarinet with editorial suggestions for the basset passages.' }
    ],
    external_links: [
      { type: 'imslp', url: 'https://imslp.org/wiki/Clarinet_Concerto_in_A_major,_K.622_(Mozart,_Wolfgang_Amadeus)', label: 'IMSLP — Mozart Clarinet Concerto' },
      { type: 'youtube', url: 'https://www.youtube.com/watch?v=YT_63UntRJE', label: 'Wolfgang Amadeus Mozart: Clarinet Concerto in A major, K.622' },
      { type: 'youtube', url: 'https://www.youtube.com/watch?v=iCEDfZgDPS8', label: 'Mussorgsky - Night on Bald Mountain' },
      { type: 'wikipedia', url: 'https://en.wikipedia.org/wiki/Clarinet_Concerto_(Mozart)', label: 'Wikipedia — Mozart Clarinet Concerto' },
      { type: 'spotify', url: 'https://open.spotify.com/track/1BeNBCYGOGcuwLCDPnAoVE', label: 'Martin Fröst / Deutsche Kammerphilharmonie — Gramophone Award winner' },
      { type: 'spotify', url: 'https://open.spotify.com/track/0XVmCzfPj8fT2xpQQnFA8I', label: 'Sabine Meyer / Abbado / Berliner Philharmoniker' },
      { type: 'internet_archive', url: 'https://archive.org/details/MozartClarinetConcertoInAMajorK.622', label: 'Alfred Prinz / Böhm / Wiener Philharmoniker (1974)' },
    ],
    movements: [
      { name: 'I. Allegro' },
      { name: 'II. Adagio' },
      { name: 'III. Rondo: Allegro' },
    ],
  },
  {
    id: 'weber-clarinet-concerto-1',
    title: 'Clarinet Concerto No. 1 in F minor',
    composer_name: 'Carl Maria von Weber',
    catalog_number: 'Op. 73 / J. 114',
    instruments: ['Clarinet'],
    era: 'Romantic',
    form: 'Concerto',
    duration_minutes: 22,
    difficulty: 'advanced',
    description: 'Written in 1811 for Heinrich Baermann, the virtuoso clarinettist whose playing moved Weber to tears. The concerto bridges the Classical and Romantic eras with its dramatic first movement, deeply expressive Adagio, and spirited Rondo finale. Weber\'s idiomatic writing exploits the clarinet\'s agility and dynamic range to thrilling effect.',
    editions: [
      { id: 'e-weber-clc1-henle', publisher: 'Henle Verlag', editor: 'Norbert Gertsch', year: 2015, description: 'Urtext based on the autograph. Clean edition with critical commentary.' },
      { id: 'e-weber-clc1-peters', publisher: 'Peters', editor: 'Traditional edition', year: 1930, description: 'Standard Peters edition widely used in conservatories. Includes piano reduction.' },
      { id: 'e-weber-clc1-boosey', publisher: 'Boosey & Hawkes', editor: 'Pamela Weston', year: 1990, description: 'Practical edition with historically informed performance suggestions by a leading Weber scholar.' }
    ],
    external_links: [
      { type: 'imslp', url: 'https://imslp.org/wiki/Clarinet_Concerto_No.1,_Op.73_(Weber,_Carl_Maria_von)', label: 'IMSLP — Weber Clarinet Concerto No. 1' },
      { type: 'wikipedia', url: 'https://en.wikipedia.org/wiki/Clarinet_Concerto_No._1_(Weber)', label: 'Wikipedia — Weber Clarinet Concerto No. 1' }
    ],
  },
  {
    id: 'debussy-syrinx',
    title: 'Syrinx',
    composer_name: 'Claude Debussy',
    catalog_number: 'L. 129',
    instruments: ['Flute'],
    era: 'Impressionist',
    form: 'Character piece',
    duration_minutes: 3,
    difficulty: 'advanced',
    description: 'Originally composed as incidental music for a play about Pan, Syrinx has become the single most important solo flute piece of the 20th century. Its free, improvisatory melody evokes the mythological Pan playing his pipes. The haunting chromatic writing, with its absence of bar lines in the original manuscript, challenges the flutist to create a seamless, breathing musical line.',
    editions: [
      { id: 'e-debussy-syr-henle', publisher: 'Henle Verlag', editor: 'Ernst-Günter Heinemann', year: 2008, description: 'Urtext based on the recently discovered autograph. Includes the original version without bar lines.' },
      { id: 'e-debussy-syr-durand', publisher: 'Durand', editor: 'Original publication', year: 1927, description: 'First published edition, posthumous. Added bar lines not present in Debussy\'s manuscript.' }
    ],
    external_links: [
      { type: 'imslp', url: 'https://imslp.org/wiki/Syrinx_(Debussy,_Claude)', label: 'IMSLP — Syrinx' },
      { type: 'wikipedia', url: 'https://en.wikipedia.org/wiki/Syrinx_(Debussy)', label: 'Wikipedia — Syrinx' },
      { type: 'spotify', url: 'https://open.spotify.com/track/5UgMumN4UnkUharjmOafoM', label: 'Emmanuel Pahud — Principal flute, Berlin Philharmonic' },
      { type: 'spotify', url: 'https://open.spotify.com/track/40D08AuKJo3IUDZaIh6pIo', label: 'Vincent Lucas — Principal flute, Orchestre de Paris' },
      { type: 'internet_archive', url: 'https://archive.org/details/Syrinx', label: 'Debussy Syrinx — Internet Archive recording' },
    ],
  },
  {
    id: 'bach-flute-sonata-b-minor',
    title: 'Flute Sonata in B minor',
    composer_name: 'Johann Sebastian Bach',
    catalog_number: 'BWV 1030',
    instruments: ['Flute', 'Harpsichord'],
    era: 'Baroque',
    form: 'Sonata',
    duration_minutes: 20,
    difficulty: 'advanced',
    description: 'The grandest of Bach\'s flute sonatas and one of the finest chamber works for the instrument. Cast in three movements, it is a true duo sonata where the flute and harpsichord (or piano) engage as equals. The opening Andante unfolds as an expansive dialogue, the central movement features contrasting dance rhythms, and the Presto finale is a brilliant gigue-like tour de force.',
    editions: [
      { id: 'e-bach-fsb-barenreiter', publisher: 'Bärenreiter', editor: 'Hans-Peter Schmitz', year: 1963, description: 'Neue Bach-Ausgabe critical edition. The scholarly standard with detailed critical notes.' },
      { id: 'e-bach-fsb-henle', publisher: 'Henle Verlag', editor: 'Hans Eppstein', year: 1999, description: 'Urtext with performance notes. Includes both flute and keyboard parts as separate inserts.' },
      { id: 'e-bach-fsb-imi', publisher: 'International Music Company', editor: 'Jean-Pierre Rampal', year: 1965, description: 'Performance edition with Rampal\'s characteristic French-school articulations and dynamics.' }
    ],
    external_links: [
      { type: 'imslp', url: 'https://imslp.org/wiki/Flute_Sonata_in_B_minor,_BWV_1030_(Bach,_Johann_Sebastian)', label: 'IMSLP — Bach Flute Sonata BWV 1030' },
      { type: 'wikipedia', url: 'https://en.wikipedia.org/wiki/Sonata_in_B_minor_for_flute_and_harpsichord', label: 'Wikipedia — Bach Flute Sonata BWV 1030' },
      { type: 'spotify', url: 'https://open.spotify.com/track/5braP1h19lbvUvUZODlP3S', label: 'Emmanuel Pahud / Trevor Pinnock' },
      { type: 'spotify', url: 'https://open.spotify.com/track/7dQGhoFB2FLtOMw7PX6Yzm', label: 'Jean-Pierre Rampal / Robert Veyron-Lacroix' },
      { type: 'internet_archive', url: 'https://archive.org/details/20220123-bach-j.s.-o-flute-sonatas-vol.-1-janet-see-davitt-moroney', label: 'Janet See / Davitt Moroney — Baroque flute (1991)' },
    ],
    movements: [
      { name: 'I. Andante' },
      { name: 'II. Largo e dolce' },
      { name: 'III. Presto' },
    ],
  },
  {
    id: 'ibert-flute-concerto',
    title: 'Flute Concerto',
    composer_name: 'Jacques Ibert',
    catalog_number: null,
    instruments: ['Flute'],
    era: '20th Century',
    form: 'Concerto',
    duration_minutes: 20,
    difficulty: 'professional',
    description: 'Composed in 1933 for Marcel Moyse, this concerto is one of the most brilliant and demanding works in the flute repertoire. The outer movements are virtuosic and witty, filled with rapid articulation, wide leaps, and sparkling passagework. The central Andante is a haunting, modal nocturne. A required piece for virtually every major orchestral flute audition.',
    editions: [
      { id: 'e-ibert-fc-leduc', publisher: 'Alphonse Leduc', editor: 'Original publication', year: 1934, description: 'The original Leduc edition, published under the composer\'s supervision. The authoritative source.' },
      { id: 'e-ibert-fc-imi', publisher: 'International Music Company', editor: 'Licensed reprint', year: 1970, description: 'Reprint of the Leduc solo part with piano reduction. Practical for studio use.' }
    ],
    external_links: [
      { type: 'wikipedia', url: 'https://en.wikipedia.org/wiki/Flute_Concerto_(Ibert)', label: 'Wikipedia — Ibert Flute Concerto' }
    ],
  },
  {
    id: 'copland-clarinet-concerto',
    title: 'Clarinet Concerto',
    composer_name: 'Aaron Copland',
    catalog_number: null,
    instruments: ['Clarinet'],
    era: '20th Century',
    form: 'Concerto',
    duration_minutes: 17,
    difficulty: 'professional',
    description: 'Commissioned by Benny Goodman in 1947 and completed in 1948, this two-movement concerto bridges classical and jazz idioms. The first movement is a languid, lyrical meditation; the second, connected by a virtuosic cadenza, is a riotous rondo infused with jazz rhythms, blues scales, and Latin-American elements. A landmark of American music that demands both classical precision and rhythmic swagger.',
    editions: [
      { id: 'e-copland-clc-boosey', publisher: 'Boosey & Hawkes', editor: 'Original publication', year: 1950, description: 'The sole published edition, authorized by the composer. Includes solo part and piano reduction.' },
      { id: 'e-copland-clc-boosey-fs', publisher: 'Boosey & Hawkes', editor: 'Full score', year: 1952, description: 'Full orchestral study score. Essential for understanding the delicate orchestration.' }
    ],
    external_links: [
      { type: 'wikipedia', url: 'https://en.wikipedia.org/wiki/Clarinet_Concerto_(Copland)', label: 'Wikipedia — Copland Clarinet Concerto' }
    ],
  },
  {
    id: 'rodrigo-concierto-de-aranjuez',
    title: 'Concierto de Aranjuez',
    composer_name: 'Joaquín Rodrigo',
    catalog_number: null,
    instruments: ['Guitar'],
    era: '20th Century',
    form: 'Concerto',
    duration_minutes: 23,
    difficulty: 'professional',
    description: 'The most famous guitar concerto ever written, composed in 1939 in Paris. The hauntingly beautiful Adagio second movement, built on an English horn melody answered by the guitar, has been arranged and recorded countless times across genres. Rodrigo, who was blind from age three, evoked the gardens of the royal palace at Aranjuez with extraordinary orchestral color. The outer movements sparkle with Spanish rhythmic vitality.',
    editions: [
      { id: 'e-rodrigo-ca-schott', publisher: 'Schott', editor: 'Original publication', year: 1949, description: 'The original Schott edition, published with the composer\'s authorization. The sole authoritative source.' },
      { id: 'e-rodrigo-ca-schott-rev', publisher: 'Schott', editor: 'Revised edition', year: 1984, description: 'Corrected reprint with minor engraving improvements. The standard modern performance edition.' }
    ],
    external_links: [
      { type: 'youtube', url: 'https://www.youtube.com/watch?v=e9RS4biqyAc', label: 'Paco de Lucía Concierto Aranjuez - Adagio' },
      { type: 'wikipedia', url: 'https://en.wikipedia.org/wiki/Concierto_de_Aranjuez', label: 'Wikipedia — Concierto de Aranjuez' }
    ],
    movements: [
      { name: 'I. Allegro con spirito' },
      { name: 'II. Adagio' },
      { name: 'III. Allegro gentile' },
    ],
  },
  {
    id: 'barber-adagio-for-strings',
    title: 'Adagio for Strings',
    composer_name: 'Samuel Barber',
    catalog_number: 'Op. 11',
    instruments: ['String Ensemble', 'Various'],
    era: '20th Century',
    form: 'Adagio',
    duration_minutes: 8,
    difficulty: 'intermediate',
    description: 'Arranged from the slow movement of Barber\'s String Quartet, this work has become perhaps the most famous American orchestral piece. Its long, arching melody builds through several waves of increasing intensity to a devastating climax, followed by silence and a hushed coda. Used at state funerals and moments of national mourning, it has also been arranged for chorus (Agnus Dei), organ, and other combinations.',
    editions: [
      { id: 'e-barber-afs-schirmer', publisher: 'G. Schirmer', editor: 'Original publication', year: 1939, description: 'The original Schirmer string orchestra version. The definitive edition.' },
      { id: 'e-barber-afs-schirmer-ad', publisher: 'G. Schirmer', editor: 'Agnus Dei choral version', year: 1967, description: 'Barber\'s own arrangement for mixed chorus on the text of the Agnus Dei.' },
      { id: 'e-barber-afs-schirmer-sq', publisher: 'G. Schirmer', editor: 'String Quartet Op. 11', year: 1943, description: 'The original string quartet from which the Adagio is drawn. Essential for understanding the work\'s origins.' }
    ],
    external_links: [
      { type: 'youtube', url: 'https://www.youtube.com/watch?v=izQsgE0L450', label: 'Samuel Barber - Adagio for Strings' },
      { type: 'youtube', url: 'https://www.youtube.com/watch?v=WAoLJ8GbA4Y', label: 'Vienna Philharmonic & Gustavo Dudamel – Barber: Adagio fo...' },
      { type: 'wikipedia', url: 'https://en.wikipedia.org/wiki/Adagio_for_Strings', label: 'Wikipedia — Adagio for Strings' }
    ],
  },

  // === ADDITIONAL CELLO ===
  {
    id: 'tchaikovsky-rococo-variations',
    title: 'Variations on a Rococo Theme',
    composer_name: 'Pyotr Ilyich Tchaikovsky',
    catalog_number: 'Op. 33',
    instruments: ['Cello'],
    era: 'Romantic',
    form: 'Theme and Variations',
    duration_minutes: 19,
    difficulty: 'professional',
    description: 'Tchaikovsky\'s elegant homage to Mozart, written for cellist Wilhelm Fitzenhagen. Seven variations on a graceful Rococo-style theme showcase the full range of cello technique, from lyrical cantabile to sparkling virtuosity. Usually performed in Fitzenhagen\'s reordered version, though the original order has gained ground.',
    editions: [
      { id: 'e-tchaik-rv-henle', publisher: 'Henle Verlag', editor: 'Thomas Kohlhase', year: 2007, description: 'Urtext with both the original and Fitzenhagen versions. The definitive modern edition.' },
      { id: 'e-tchaik-rv-imi', publisher: 'International Music Company', editor: 'Leonard Rose', year: 1965, description: 'Fitzenhagen version with Rose\'s practical fingerings and bowings.' }
    ],
    external_links: [
      { type: 'imslp', url: 'https://imslp.org/wiki/Variations_on_a_Rococo_Theme,_Op.33_(Tchaikovsky,_Pyotr)', label: 'IMSLP — Rococo Variations' },
      { type: 'wikipedia', url: 'https://en.wikipedia.org/wiki/Variations_on_a_Rococo_Theme', label: 'Wikipedia — Rococo Variations' },
      { type: 'spotify', url: 'https://open.spotify.com/album/6sRM5rPMc3O9eYlzRa1PcD', label: 'Edgar Moreau / Sanderling / Luzerner Sinfonieorchester — Young artist (2024)' },
      { type: 'spotify', url: 'https://open.spotify.com/track/0PyM6Lhy4WSoANmO6wT97O', label: 'Steven Isserlis / Gardiner / COE — Original version' },
      { type: 'internet_archive', url: 'https://archive.org/details/rococo-vars-meneses-talvi-rtve-sp-2008', label: 'Antonio Meneses / Talmi / RTVE Symphony (2008)' },
    ],
  },
  {
    id: 'piatti-caprice-1',
    title: '12 Caprices for Solo Cello: No. 1 in B minor',
    composer_name: 'Alfredo Piatti',
    catalog_number: 'Op. 25 No. 1',
    instruments: ['Cello'],
    era: 'Romantic',
    form: 'Caprice',
    duration_minutes: 4,
    difficulty: 'professional',
    description: 'The first of Piatti\'s twelve caprices, the cello equivalent of Paganini\'s violin caprices. These works are essential study material for advanced cellists, demanding mastery of double stops, thumb position, rapid passage-work, and expressive phrasing. The first caprice in B minor is dramatic and technically comprehensive.',
    editions: [
      { id: 'e-piatti-c1-imi', publisher: 'International Music Company', editor: 'Jeffrey Solow', year: 1985, description: 'Performance edition with editorial suggestions for the complete set.' },
      { id: 'e-piatti-c1-stainer', publisher: 'Stainer & Bell', editor: 'Original publication', year: 1874, description: 'The original publication. Historical reference.' }
    ],
    external_links: [
      { type: 'imslp', url: 'https://imslp.org/wiki/12_Caprices,_Op.25_(Piatti,_Alfredo)', label: 'IMSLP — Piatti 12 Caprices' },
      { type: 'wikipedia', url: 'https://en.wikipedia.org/wiki/Alfredo_Piatti', label: 'Wikipedia — Alfredo Piatti' }
    ],
  },
  {
    id: 'bruch-kol-nidrei',
    title: 'Kol Nidrei',
    composer_name: 'Max Bruch',
    catalog_number: 'Op. 47',
    instruments: ['Cello'],
    era: 'Romantic',
    form: 'Adagio',
    duration_minutes: 11,
    difficulty: 'advanced',
    description: 'An adagio on two Hebrew melodies for cello and orchestra. Despite Bruch being Protestant, this work captures the devotional intensity of the Kol Nidrei prayer with extraordinary sensitivity. The cello\'s singing first theme and the contrasting second melody create one of the most deeply moving works in the cello repertoire.',
    editions: [
      { id: 'e-bruch-kn-henle', publisher: 'Henle Verlag', editor: 'Christian Rudolf Riedel', year: 2010, description: 'Urtext with cello part edited by Peter Bruns.' },
      { id: 'e-bruch-kn-imi', publisher: 'International Music Company', editor: 'Leonard Rose', year: 1962, description: 'Rose\'s performance edition with practical bowings.' }
    ],
    external_links: [
      { type: 'imslp', url: 'https://imslp.org/wiki/Kol_Nidrei,_Op.47_(Bruch,_Max)', label: 'IMSLP — Kol Nidrei' },
      { type: 'wikipedia', url: 'https://en.wikipedia.org/wiki/Kol_Nidrei_(Bruch)', label: 'Wikipedia — Bruch Kol Nidrei' },
      { type: 'spotify', url: 'https://open.spotify.com/track/6hQJzzgY7wh5drvunqqm8V', label: 'Mischa Maisky / Bychkov / Orchestre de Paris' },
      { type: 'spotify', url: 'https://open.spotify.com/track/0NyJTVJV1s6p5RHij1PcGU', label: 'Jacqueline du Pré / Barenboim / Israel Philharmonic' },
      { type: 'internet_archive', url: 'https://archive.org/details/BruchKolNidreiOp.47', label: 'Matt Haimovitz / Levine / Chicago Symphony' },
      { type: 'internet_archive', url: 'https://archive.org/details/KolNidreiOp.47starkerDorati', label: 'János Starker / Dorati / LSO (1962)' },
    ],
  },
  {
    id: 'cassado-suite-for-solo-cello',
    title: 'Suite for Solo Cello',
    composer_name: 'Gaspar Cassadó',
    catalog_number: null,
    instruments: ['Cello'],
    era: '20th Century',
    form: 'Suite',
    duration_minutes: 18,
    difficulty: 'professional',
    description: 'Written in 1926 by the great Catalan cellist and student of Casals, this three-movement suite is the most important solo cello work between Bach and Kodály. Spanish folk elements permeate the Preludio-Fantasia, the Sardana evokes Catalan dance rhythms, and the Intermezzo e Danza finale combines lyricism with fiery virtuosity.',
    editions: [
      { id: 'e-cassado-suite-ue', publisher: 'Universal Edition', editor: 'Original publication', year: 1926, description: 'The original Universal Edition publication.' },
      { id: 'e-cassado-suite-salabert', publisher: 'Salabert', editor: 'Revised edition', year: 1960, description: 'Revised edition with some corrections to the original text.' }
    ],
    external_links: [
      { type: 'wikipedia', url: 'https://en.wikipedia.org/wiki/Gaspar_Cassad%C3%B3', label: 'Wikipedia — Gaspar Cassadó' }
    ],
  }
    ];

// Import and merge additional pieces
import { pianoViolinNew } from './seed-piano-violin-new';
import { expansionPieces } from './seed-expansion';
import { expansionPieces2 } from './seed-expansion-2';
import { expansionPieces3 } from './seed-expansion-3';
import { expansionPieces4 } from './seed-expansion-4';
import { expansionPieces5 } from './seed-expansion-5';
import { expansionPieces6 } from './seed-expansion-6';
import { expansionPieces7 } from './seed-expansion-7';
import { expansionPieces8 } from './seed-expansion-8';
import { expansionPieces9 } from './seed-expansion-9';
import { expansionPieces10 } from './seed-expansion-10';
seedPieces.push(...pianoViolinNew);
seedPieces.push(...expansionPieces);
seedPieces.push(...expansionPieces2);
seedPieces.push(...expansionPieces3);
seedPieces.push(...expansionPieces4);
seedPieces.push(...expansionPieces5);
seedPieces.push(...expansionPieces6);
seedPieces.push(...expansionPieces7);
seedPieces.push(...expansionPieces8);
seedPieces.push(...expansionPieces9);
seedPieces.push(...expansionPieces10);

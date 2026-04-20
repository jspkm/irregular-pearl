// Seed data for Irregular Pearl.
// Curated catalog aligned with PRD rev 2: narrow scope, deep craft.
// Cello-forward editorial spine for the first real user's daily-use loop.
// When adding a piece, it must be editorially intentional — not scraped, not exhaustive.

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
    /** Editorial type per PRD vocabulary. */
    type?: 'urtext' | 'scholarly' | 'performer' | 'facsimile' | 'critical' | 'practical';
    /** Outbound link to the edition (IMSLP scan for public-domain originals, publisher catalog for modern). */
    url?: string;
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
    /** Key signature or tonal centre (e.g., "G major", "D minor", "B-flat major"). Omit when free-tonal. */
    key?: string;
    /** Time signature or meter description (e.g., "4/4", "3/4", "6/8", "2/2", "graphic notation"). Omit when not applicable. */
    meter?: string;
  }[];
  /** If this piece IS a movement of a larger work, the parent work's piece ID */
  parentWorkId?: string;
  /** If this piece IS a movement, its 1-based movement number */
  movementNumber?: number;
}

export const seedPieces: SeedPiece[] = [
  {
    id: 'bach-chaconne-cello-arr',
    title: 'Chaconne from Partita No. 2 in D minor (arr. for cello)',
    composer_name: 'Johann Sebastian Bach',
    catalog_number: 'BWV 1004',
    instruments: ['Cello'],
    era: 'Baroque',
    form: 'Chaconne',
    duration_minutes: 15,
    difficulty: 'professional',
    description: 'The closing movement of Bach\'s Partita No. 2 for solo violin, a monumental set of variations over a repeating bass pattern. Multiple cello arrangements exist, transposing the work into a register and idiom the cello can sustain; none is canonical. Most cellists work from their own adaptation or a colleague\'s. The Chaconne on cello retains the violin original\'s architectural logic across some sixty-four variations, three movements in one, and has become a staple of solo cello recital programming despite not being written for the instrument.',
    editions: [
      { id: 'e-bach-chaconne-busch', publisher: 'Schott', editor: 'Hermann Busch (arr.)', year: 1984, description: 'Transcription for solo cello by the Busch brothers\' cellist. Playable in its original key with extensive double stops; a demanding but idiomatic reading.', type: 'performer', url: 'https://www.schott-music.com/en/' },
      { id: 'e-bach-chaconne-isserlis', publisher: 'Faber Music', editor: 'Steven Isserlis (arr.)', year: 2012, description: 'Isserlis\'s own performing arrangement, transposed and lightly adapted for the cello\'s sonority. Printed with his fingerings and a short preface on the adaptation choices.', type: 'performer', url: 'https://www.fabermusic.com/sheet-music?q=bach+chaconne+isserlis' }
    ],
    external_links: [
      { type: 'imslp', url: 'https://imslp.org/wiki/Violin_Partita_No.2_in_D_minor,_BWV_1004_(Bach,_Johann_Sebastian)', label: 'IMSLP — Partita No. 2 (original violin source)' },
      { type: 'wikipedia', url: 'https://en.wikipedia.org/wiki/Partita_for_Violin_No._2_(Bach)', label: 'Wikipedia — Partita No. 2 (Bach)' },
    ],
    movements: [
      { name: 'Chaconne', key: 'D minor', meter: '3/4' },
    ],
  },
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
    description: 'The first of six suites for unaccompanied cello. Composed during Bach\'s tenure as Kapellmeister in Cöthen, the suite consists of six movements: Prélude, Allemande, Courante, Sarabande, Menuets I & II, and Gigue. The Prélude is especially famous for its flowing arpeggiated figures.',
    editions: [
      { id: 'e-bach-cs1-henle', publisher: 'Henle Verlag', editor: 'Egon Voss', year: 2000, description: 'Critical Urtext edition based on Anna Magdalena Bach\'s copy. Minimal editorial markings, ideal for informed performers.', type: 'urtext', url: 'https://www.henle.de/en/search/?q=Cello+Suites+BWV+1007' },
      { id: 'e-bach-cs1-barenreiter', publisher: 'Bärenreiter', editor: 'Bettina Schwemer & Douglas Woodfull-Harris', year: 2012, description: 'Scholarly edition with facsimile. Includes source comparison appendix and detailed critical commentary.', type: 'scholarly', url: 'https://www.baerenreiter.com/en/shop/?tx_solr%5Bq%5D=BWV+1007+cello+suites' },
      { id: 'e-bach-cs1-imi', publisher: 'International Music Company', editor: 'Leonard Rose', year: 1950, description: 'Heavy romantic-era bowings and fingerings. Widely used in American pedagogy but editorially dated.', type: 'performer', url: 'https://www.internationalmusicco.com/' }
    ],
    external_links: [
      { type: 'imslp', url: 'https://imslp.org/wiki/Cello_Suite_No.1_in_G_major,_BWV_1007_(Bach,_Johann_Sebastian)', label: 'IMSLP — 12 editions available' },
      { type: 'youtube', url: 'https://www.youtube.com/watch?v=PCicM6i59_I', label: 'Bach Cello Suite No.1 - Prélude' },
      { type: 'youtube', url: 'https://www.youtube.com/watch?v=DwHpDOWhkGk', label: 'Bach - Cello Suite No. 1 in G Major BWV1007 - Mov. 1-3/6' },
      { type: 'wikipedia', url: 'https://en.wikipedia.org/wiki/Cello_Suites_(Bach)', label: 'Wikipedia — Cello Suites' },
      { type: 'internet_archive', url: 'https://archive.org/details/01No.1InGBwv10071.PreludeModerato', label: 'Pablo Casals — Prélude (historic recording)' },
      { type: 'internet_archive', url: 'https://archive.org/details/bach-j.s.-suites-for-cello-cello-bwv-1007-1012-pierre-fournier', label: 'Pierre Fournier — Complete Cello Suites' },
      { type: 'vimeo', url: 'https://vimeo.com/557158390', label: 'Jean-Guihen Queyras — Prélude (video)' },
    ],
    movements: [
      { name: 'I. Prélude', key: 'G major', meter: '4/4' },
      { name: 'II. Allemande', key: 'G major', meter: '4/4' },
      { name: 'III. Courante', key: 'G major', meter: '3/4' },
      { name: 'IV. Sarabande', key: 'G major', meter: '3/4' },
      { name: 'V. Menuet I & II', key: 'G major', meter: '3/4' },
      { name: 'VI. Gigue', key: 'G major', meter: '6/8' },
    ],
  },
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
    description: 'The second of Bach\'s six suites for unaccompanied cello, set in D minor, lending it a darker and more introspective character than the first suite. The Prélude features a distinctive arpeggiated pattern that unfolds into complex polyphonic writing. The Sarabande is particularly austere and moving, while the closing Gigue provides rhythmic vitality.',
    editions: [
      { id: 'e-bach-cs2-henle', publisher: 'Henle Verlag', editor: 'Egon Voss', year: 2000, description: 'Critical Urtext based on Anna Magdalena Bach\'s manuscript copy. Clean text with minimal editorial intervention.', type: 'urtext', url: 'https://www.henle.de/en/search/?q=Cello+Suites+BWV+1008' },
      { id: 'e-bach-cs2-barenreiter', publisher: 'Bärenreiter', editor: 'Bettina Schwemer & Douglas Woodfull-Harris', year: 2012, description: 'Scholarly edition with comprehensive critical commentary and facsimile comparison from all surviving sources.', type: 'scholarly', url: 'https://www.baerenreiter.com/en/shop/?tx_solr%5Bq%5D=BWV+1008+cello+suite' },
      { id: 'e-bach-cs2-wiener', publisher: 'Wiener Urtext', editor: 'Wolfgang Boettcher', year: 2004, description: 'Urtext with practical performance suggestions. Includes bowings that balance historical awareness with modern technique.', type: 'urtext' }
    ],
    external_links: [
      { type: 'imslp', url: 'https://imslp.org/wiki/Cello_Suite_No.2_in_D_minor,_BWV_1008_(Bach,_Johann_Sebastian)', label: 'IMSLP — Cello Suite No. 2' },
      { type: 'wikipedia', url: 'https://en.wikipedia.org/wiki/Cello_Suites_(Bach)', label: 'Wikipedia — Bach Cello Suites' },
      { type: 'internet_archive', url: 'https://archive.org/details/lp_suites-for-unaccompanied-violoncello-no-1_pablo-casals-johann-sebastian-bach', label: 'Pablo Casals — Suites No. 1 & 2 (historic LP)' },
    ],
    movements: [
      { name: 'I. Prélude', key: 'D minor', meter: '4/4' },
      { name: 'II. Allemande', key: 'D minor', meter: '4/4' },
      { name: 'III. Courante', key: 'D minor', meter: '3/4' },
      { name: 'IV. Sarabande', key: 'D minor', meter: '3/4' },
      { name: 'V. Menuet I & II', key: 'D minor', meter: '3/4' },
      { name: 'VI. Gigue', key: 'D minor', meter: '3/8' },
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
    description: 'The third suite returns to a bright, expansive key and is the most extroverted of the set. The Prélude\'s brilliant scale passages and bariolage figuration exploit the full sonority of the instrument. The Bourrées are among the most popular individual movements from the suites, frequently performed as encores.',
    editions: [
      { id: 'e-bach-cs3-henle', publisher: 'Henle Verlag', editor: 'Egon Voss', year: 2000, description: 'Urtext edition with source-critical apparatus. Part of Henle\'s complete suites volume.', type: 'urtext', url: 'https://www.henle.de/en/search/?q=Cello+Suites+BWV+1009' },
      { id: 'e-bach-cs3-barenreiter', publisher: 'Bärenreiter', editor: 'Bettina Schwemer & Douglas Woodfull-Harris', year: 2012, description: 'New critical edition drawing on all surviving manuscript copies with detailed editorial report.', type: 'scholarly', url: 'https://www.baerenreiter.com/en/shop/?tx_solr%5Bq%5D=BWV+1009+cello+suite' }
    ],
    external_links: [
      { type: 'imslp', url: 'https://imslp.org/wiki/Cello_Suite_No.3_in_C_major,_BWV_1009_(Bach,_Johann_Sebastian)', label: 'IMSLP — Cello Suite No. 3' },
      { type: 'youtube', url: 'https://www.youtube.com/watch?v=mGQLXRTl3Z0', label: 'Mischa Maisky plays Bach Cello Suite No.1 in G' },
      { type: 'wikipedia', url: 'https://en.wikipedia.org/wiki/Cello_Suites_(Bach)', label: 'Wikipedia — Bach Cello Suites' },
      { type: 'internet_archive', url: 'https://archive.org/details/lp_suites-for-cello-unaccompanied-no-3-in-c-m_johann-sebastian-bach-pablo-casals', label: 'Pablo Casals — Suites No. 3 & 4 (historic LP)' },
      { type: 'internet_archive', url: 'https://archive.org/details/bach-j.s.-suites-for-cello-cello-bwv-1007-1012-pierre-fournier', label: 'Pierre Fournier — Complete Cello Suites' },
    ],
    movements: [
      { name: 'I. Prélude', key: 'C major', meter: '3/4' },
      { name: 'II. Allemande', key: 'C major', meter: '4/4' },
      { name: 'III. Courante', key: 'C major', meter: '3/4' },
      { name: 'IV. Sarabande', key: 'C major', meter: '3/4' },
      { name: 'V. Bourrée I & II', key: 'C major', meter: '2/2' },
      { name: 'VI. Gigue', key: 'C major', meter: '3/8' },
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
    description: 'The fourth suite marks a shift in technical demands, with the key of E-flat major requiring less resonant string crossings and more careful intonation. The Prélude is a grand, French overture-like movement. The Sarabande is one of Bach\'s most harmonically rich slow movements, and the Bourrées provide spirited contrast.',
    editions: [
      { id: 'e-bach-cs4-henle', publisher: 'Henle Verlag', editor: 'Egon Voss', year: 2000, description: 'Urtext based on all surviving sources with minimal editorial additions.', type: 'urtext', url: 'https://www.henle.de/en/search/?q=Cello+Suites+BWV+1010' },
      { id: 'e-bach-cs4-peters', publisher: 'Peters', editor: 'Hugo Becker', year: 1911, description: 'Older pedagogical edition with Romantic-era bowings and fingerings. Historically interesting but editorially heavy.', type: 'performer', url: 'https://imslp.org/wiki/Cello_Suite_No.4_in_E-flat_major,_BWV_1010_(Bach,_Johann_Sebastian)' },
      { id: 'e-bach-cs4-barenreiter', publisher: 'Bärenreiter', editor: 'Bettina Schwemer & Douglas Woodfull-Harris', year: 2012, description: 'Critical edition with facsimile and comprehensive source comparison.', type: 'scholarly', url: 'https://www.baerenreiter.com/en/shop/?tx_solr%5Bq%5D=BWV+1010+cello+suite' }
    ],
    external_links: [
      { type: 'imslp', url: 'https://imslp.org/wiki/Cello_Suite_No.4_in_E-flat_major,_BWV_1010_(Bach,_Johann_Sebastian)', label: 'IMSLP — Cello Suite No. 4' },
      { type: 'wikipedia', url: 'https://en.wikipedia.org/wiki/Cello_Suites_(Bach)', label: 'Wikipedia — Bach Cello Suites' },
      { type: 'internet_archive', url: 'https://archive.org/details/lp_suites-for-cello-unaccompanied-no-3-in-c-m_johann-sebastian-bach-pablo-casals', label: 'Pablo Casals — Suites No. 3 & 4 (historic LP)' },
      { type: 'internet_archive', url: 'https://archive.org/details/lp_intgrale-des-six-suites-pour-violoncelle-s_johann-sebastian-bach-janos-starker', label: 'János Starker — Complete Suites (historic)' },
    ],
    movements: [
      { name: 'I. Prélude', key: 'E-flat major', meter: '4/4' },
      { name: 'II. Allemande', key: 'E-flat major', meter: '4/4' },
      { name: 'III. Courante', key: 'E-flat major', meter: '3/4' },
      { name: 'IV. Sarabande', key: 'E-flat major', meter: '3/4' },
      { name: 'V. Bourrée I & II', key: 'E-flat major', meter: '2/2' },
      { name: 'VI. Gigue', key: 'E-flat major', meter: '12/8' },
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
    description: 'The fifth suite requires scordatura tuning (the A string lowered to G), giving the instrument a darker, veiled sonority. The Prélude opens with a grave French overture before launching into an elaborate fugue. The Sarabande, built from stark single notes and double stops, is one of Bach\'s most profound slow movements.',
    editions: [
      { id: 'e-bach-cs5-henle', publisher: 'Henle Verlag', editor: 'Egon Voss', year: 2000, description: 'Urtext with clear notation of scordatura tuning. Source-critical commentary included.', type: 'urtext', url: 'https://www.henle.de/en/search/?q=Cello+Suites+BWV+1011' },
      { id: 'e-bach-cs5-barenreiter', publisher: 'Bärenreiter', editor: 'Bettina Schwemer & Douglas Woodfull-Harris', year: 2012, description: 'Critical edition including both scordatura and standard tuning notations with full critical apparatus.', type: 'scholarly', url: 'https://www.baerenreiter.com/en/shop/?tx_solr%5Bq%5D=BWV+1011+cello+suite' }
    ],
    external_links: [
      { type: 'imslp', url: 'https://imslp.org/wiki/Cello_Suite_No.5_in_C_minor,_BWV_1011_(Bach,_Johann_Sebastian)', label: 'IMSLP — Cello Suite No. 5' },
      { type: 'wikipedia', url: 'https://en.wikipedia.org/wiki/Cello_Suites_(Bach)', label: 'Wikipedia — Bach Cello Suites' },
      { type: 'internet_archive', url: 'https://archive.org/details/suite-no.-5-in-c-minor-for-cello', label: 'Frans Helmerson — Suite No. 5 (1974)' },
    ],
    movements: [
      { name: 'I. Prélude', key: 'C minor', meter: '2/2 & 3/8' },
      { name: 'II. Allemande', key: 'C minor', meter: '4/4' },
      { name: 'III. Courante', key: 'C minor', meter: '3/4' },
      { name: 'IV. Sarabande', key: 'C minor', meter: '3/4' },
      { name: 'V. Gavotte I & II', key: 'C minor', meter: '2/2' },
      { name: 'VI. Gigue', key: 'C minor', meter: '3/8' },
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
    description: 'The final and most technically demanding of the six suites, likely written for a five-stringed instrument (viola pomposa or violoncello piccolo). The addition of a high E string allows passages in the soprano register that are extremely challenging on a standard four-string cello. The Prélude is a virtuosic showpiece, and the Gavottes are joyful and dance-like.',
    editions: [
      { id: 'e-bach-cs6-henle', publisher: 'Henle Verlag', editor: 'Egon Voss', year: 2000, description: 'Urtext with notes on the five-string instrument question. Part of the complete suites volume.', type: 'urtext', url: 'https://www.henle.de/en/search/?q=Cello+Suites+BWV+1012' },
      { id: 'e-bach-cs6-barenreiter', publisher: 'Bärenreiter', editor: 'Bettina Schwemer & Douglas Woodfull-Harris', year: 2012, description: 'Critical edition with extensive discussion of the intended instrument and tuning.', type: 'scholarly', url: 'https://www.baerenreiter.com/en/shop/?tx_solr%5Bq%5D=BWV+1012+cello+suite' },
      { id: 'e-bach-cs6-imi', publisher: 'International Music Company', editor: 'Leonard Rose', year: 1950, description: 'Practical edition with Rose\'s fingerings adapted for four-string cello. Standard American pedagogical edition.', type: 'performer', url: 'https://www.internationalmusicco.com/' }
    ],
    external_links: [
      { type: 'imslp', url: 'https://imslp.org/wiki/Cello_Suite_No.6_in_D_major,_BWV_1012_(Bach,_Johann_Sebastian)', label: 'IMSLP — Cello Suite No. 6' },
      { type: 'wikipedia', url: 'https://en.wikipedia.org/wiki/Cello_Suites_(Bach)', label: 'Wikipedia — Bach Cello Suites' },
      { type: 'vimeo', url: 'https://vimeo.com/channels/earlymusic/29470725', label: 'William Skeen — Gavotte (baroque cello)' },
      { type: 'internet_archive', url: 'https://archive.org/details/01-alc-02-bach-cello-suites-2-5-6', label: 'Dimitry Markevitch — Cello Suites 2, 5 & 6' },
    ],
    movements: [
      { name: 'I. Prélude', key: 'D major', meter: '12/8' },
      { name: 'II. Allemande', key: 'D major', meter: '4/4' },
      { name: 'III. Courante', key: 'D major', meter: '6/8' },
      { name: 'IV. Sarabande', key: 'D major', meter: '3/2' },
      { name: 'V. Gavotte I & II', key: 'D major', meter: '2/2' },
      { name: 'VI. Gigue', key: 'D major', meter: '6/8' },
    ],
  },
  {
    id: 'bach-viola-da-gamba-sonata-1',
    title: 'Sonata for Viola da Gamba and Harpsichord No. 1 in G major',
    composer_name: 'Johann Sebastian Bach',
    catalog_number: 'BWV 1027',
    instruments: ['Cello', 'Harpsichord'],
    era: 'Baroque',
    form: 'Sonata',
    duration_minutes: 14,
    difficulty: 'advanced',
    description: 'The first of three sonatas composed at Cöthen for viola da gamba and obbligato harpsichord. On modern cello, the piece reads as chamber music between equals rather than soloist-with-continuo: Bach gives the keyboardist a fully written-out right hand that trades material with the cellist throughout. The opening Adagio is lyrical and gently ornamented; the ensuing Allegro ma non tanto is one of Bach\'s most graceful fugues. BWV 1027 survives in an earlier version as the Trio Sonata BWV 1039 for two flutes and continuo, and the gamba sonata can be read as Bach\'s reworking of that material.',
    editions: [
      { id: 'e-bach-bwv1027-henle', publisher: 'Henle Verlag', editor: 'Hans Eppstein', year: 1987, description: 'Urtext edition with separate cello and harpsichord parts. Includes both the Leipzig and Cöthen readings in the critical commentary.', type: 'urtext', url: 'https://www.henle.de/en/search/?q=BWV+1027+Viola+da+Gamba' },
      { id: 'e-bach-bwv1027-barenreiter', publisher: 'Bärenreiter', editor: 'Hans Eppstein', year: 1989, description: 'Part of the Neue Bach-Ausgabe. The most thorough scholarly text, with alternative harpsichord realisations.', type: 'scholarly', url: 'https://www.baerenreiter.com/en/shop/?tx_solr%5Bq%5D=BWV+1027+viola+da+gamba' }
    ],
    external_links: [
      { type: 'imslp', url: 'https://imslp.org/wiki/Viola_da_Gamba_Sonata_in_G_major,_BWV_1027_(Bach,_Johann_Sebastian)', label: 'IMSLP — Gamba Sonata No. 1' },
      { type: 'wikipedia', url: 'https://en.wikipedia.org/wiki/Sonatas_for_viola_da_gamba_and_harpsichord_(Bach)', label: 'Wikipedia — Viola da Gamba Sonatas' },
    ],
    movements: [
      { name: 'I. Adagio', key: 'G major', meter: '3/2' },
      { name: 'II. Allegro ma non tanto', key: 'G major', meter: '6/8' },
      { name: 'III. Andante', key: 'E minor', meter: '3/4' },
      { name: 'IV. Allegro moderato', key: 'G major', meter: '2/4' },
    ],
  },
  {
    id: 'bach-viola-da-gamba-sonata-2',
    title: 'Sonata for Viola da Gamba and Harpsichord No. 2 in D major',
    composer_name: 'Johann Sebastian Bach',
    catalog_number: 'BWV 1028',
    instruments: ['Cello', 'Harpsichord'],
    era: 'Baroque',
    form: 'Sonata',
    duration_minutes: 16,
    difficulty: 'advanced',
    description: 'The second gamba sonata is the most outgoing of the three. The opening Adagio is brief, almost a prelude, and gives way to an Allegro of dancing energy over a walking keyboard bass. The Andante in B minor stands out for its singing, lyrical cello line; the closing Allegro is a lively gigue-like finale. As with BWV 1027, the keyboard part is fully composed rather than figured, making the sonata a genuine duo.',
    editions: [
      { id: 'e-bach-bwv1028-henle', publisher: 'Henle Verlag', editor: 'Hans Eppstein', year: 1987, description: 'Urtext edition with separate cello and harpsichord parts. Part of Henle\'s complete gamba sonatas volume.', type: 'urtext', url: 'https://www.henle.de/en/search/?q=BWV+1028+Viola+da+Gamba' },
      { id: 'e-bach-bwv1028-barenreiter', publisher: 'Bärenreiter', editor: 'Hans Eppstein', year: 1989, description: 'Neue Bach-Ausgabe critical edition with full source-critical report.', type: 'scholarly', url: 'https://www.baerenreiter.com/en/shop/?tx_solr%5Bq%5D=BWV+1028+viola+da+gamba' }
    ],
    external_links: [
      { type: 'imslp', url: 'https://imslp.org/wiki/Viola_da_Gamba_Sonata_in_D_major,_BWV_1028_(Bach,_Johann_Sebastian)', label: 'IMSLP — Gamba Sonata No. 2' },
      { type: 'wikipedia', url: 'https://en.wikipedia.org/wiki/Sonatas_for_viola_da_gamba_and_harpsichord_(Bach)', label: 'Wikipedia — Viola da Gamba Sonatas' },
    ],
    movements: [
      { name: 'I. Adagio', key: 'D major', meter: '4/4' },
      { name: 'II. Allegro', key: 'D major', meter: '3/4' },
      { name: 'III. Andante', key: 'B minor', meter: '4/4' },
      { name: 'IV. Allegro', key: 'D major', meter: '6/8' },
    ],
  },
  {
    id: 'bach-viola-da-gamba-sonata-3',
    title: 'Sonata for Viola da Gamba and Harpsichord No. 3 in G minor',
    composer_name: 'Johann Sebastian Bach',
    catalog_number: 'BWV 1029',
    instruments: ['Cello', 'Harpsichord'],
    era: 'Baroque',
    form: 'Sonata',
    duration_minutes: 15,
    difficulty: 'professional',
    description: 'The darkest and most ambitious of the three gamba sonatas, cast in three movements rather than the usual four and closer in scale to a concerto. The opening Vivace is built on a driving figure passed between the instruments; the Adagio is a plaintive siciliana; the closing Allegro is a rigorous double fugue. The cellist and keyboardist are true equals throughout, and the writing rewards chamber-music-level rehearsal rather than soloist framing.',
    editions: [
      { id: 'e-bach-bwv1029-henle', publisher: 'Henle Verlag', editor: 'Hans Eppstein', year: 1987, description: 'Urtext edition with separate parts. Includes both the keyboard realisation and the gamba part with minimal editorial additions.', type: 'urtext', url: 'https://www.henle.de/en/search/?q=BWV+1029+Viola+da+Gamba' },
      { id: 'e-bach-bwv1029-barenreiter', publisher: 'Bärenreiter', editor: 'Hans Eppstein', year: 1989, description: 'Neue Bach-Ausgabe critical edition, the standard scholarly source.', type: 'scholarly', url: 'https://www.baerenreiter.com/en/shop/?tx_solr%5Bq%5D=BWV+1029+viola+da+gamba' }
    ],
    external_links: [
      { type: 'imslp', url: 'https://imslp.org/wiki/Viola_da_Gamba_Sonata_in_G_minor,_BWV_1029_(Bach,_Johann_Sebastian)', label: 'IMSLP — Gamba Sonata No. 3' },
      { type: 'wikipedia', url: 'https://en.wikipedia.org/wiki/Sonatas_for_viola_da_gamba_and_harpsichord_(Bach)', label: 'Wikipedia — Viola da Gamba Sonatas' },
    ],
    movements: [
      { name: 'I. Vivace', key: 'G minor', meter: '4/4' },
      { name: 'II. Adagio', key: 'B-flat major', meter: '3/2' },
      { name: 'III. Allegro', key: 'G minor', meter: '4/4' },
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
      { id: 'e-haydn-cc1-henle', publisher: 'Henle Verlag', editor: 'Sonja Gerlach', year: 1981, description: 'Urtext edition based on the recovered autograph. The standard scholarly text.', type: 'urtext', url: 'https://www.henle.de/en/search/?q=Haydn+Cello+Concerto+C+major' },
      { id: 'e-haydn-cc1-barenreiter', publisher: 'Bärenreiter', editor: 'Sonja Gerlach', year: 1984, description: 'Critical edition from the Joseph Haydn Werke. Includes orchestral parts and cadenza suggestions.', type: 'scholarly', url: 'https://www.baerenreiter.com/en/shop/?tx_solr%5Bq%5D=Haydn+cello+concerto+C' },
      { id: 'e-haydn-cc1-imi', publisher: 'International Music Company', editor: 'Leonard Rose', year: 1967, description: 'Performance edition with Rose\'s fingerings and bowings. Includes cadenzas by the editor.', type: 'performer', url: 'https://www.internationalmusicco.com/' }
    ],
    external_links: [
      { type: 'imslp', url: 'https://imslp.org/wiki/Cello_Concerto_No.1_in_C_major,_Hob.VIIb:1_(Haydn,_Joseph)', label: 'IMSLP — Haydn Cello Concerto No. 1' },
      { type: 'wikipedia', url: 'https://en.wikipedia.org/wiki/Cello_Concerto_No._1_(Haydn)', label: 'Wikipedia — Haydn Cello Concerto No. 1' },
      { type: 'internet_archive', url: 'https://archive.org/details/HaydnCelloConcertoNo.1InCMajorHob.Viib1', label: 'Mstislav Rostropovich / ASMF (1988)' },
    ],
    movements: [
      { name: 'I. Moderato', key: 'C major', meter: '4/4' },
      { name: 'II. Adagio', key: 'F major', meter: '2/4' },
      { name: 'III. Allegro molto', key: 'C major', meter: '4/4' },
    ],
  },
  {
    id: 'vivaldi-rv-544',
    title: 'Concerto for Violin and Cello in F major, "Il Proteo, o sia il Mondo al rovescio"',
    composer_name: 'Antonio Vivaldi',
    catalog_number: 'RV 544',
    instruments: ['Violin', 'Cello'],
    era: 'Baroque',
    form: 'Concerto',
    duration_minutes: 12,
    difficulty: 'advanced',
    description: 'A double concerto whose nickname — "Il Proteo, or the World Upside Down" — refers to a characteristic game Vivaldi plays with the two soloists: the violin is notated in the cello\'s range and clef, and the cello in the violin\'s. Performers and listeners hear high-and-low flipped; reading performers face the concerto written the "wrong" way up. Beyond the trick, the piece is a genuine duo concerto in three movements with brilliant interplay between the soloists and the string orchestra continuo.',
    editions: [
      { id: 'e-vivaldi-rv544-ricordi', publisher: 'Ricordi', editor: 'Gian Francesco Malipiero', year: 1955, description: 'Part of the Istituto Italiano Antonio Vivaldi complete edition. The long-standard performing edition.', type: 'scholarly', url: 'https://www.ricordi.com/' },
      { id: 'e-vivaldi-rv544-barenreiter', publisher: 'Bärenreiter', editor: 'Federico Maria Sardelli', year: 2013, description: 'Critical edition with new sources and corrections. Includes notes on the "Il Proteo" instrument-swap notation.', type: 'scholarly', url: 'https://www.baerenreiter.com/en/shop/?tx_solr%5Bq%5D=Vivaldi+RV+544' }
    ],
    external_links: [
      { type: 'imslp', url: 'https://imslp.org/wiki/Concerto_in_F_major,_RV_544_(Vivaldi,_Antonio)', label: 'IMSLP — Concerto RV 544' },
      { type: 'wikipedia', url: 'https://en.wikipedia.org/wiki/Antonio_Vivaldi', label: 'Wikipedia — Antonio Vivaldi' },
    ],
    movements: [
      { name: 'I. Allegro', key: 'F major', meter: '4/4' },
      { name: 'II. Largo', key: 'D minor', meter: '3/4' },
      { name: 'III. Allegro', key: 'F major', meter: '4/4' },
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
      { id: 'e-ss-cc1-durand', publisher: 'Durand', editor: 'Original publication', year: 1873, description: 'The original Durand edition, published in the composer\'s lifetime. The standard French source.', type: 'practical', url: 'https://imslp.org/wiki/Cello_Concerto_No.1,_Op.33_(Saint-Sa%C3%ABns,_Camille)' },
      { id: 'e-ss-cc1-henle', publisher: 'Henle Verlag', editor: 'Peter Jost', year: 2016, description: 'Urtext edition based on autograph and first edition. Clear engraving with critical notes.', type: 'urtext', url: 'https://www.henle.de/en/search/?q=Saint-Saens+cello+concerto+op+33' },
      { id: 'e-ss-cc1-imi', publisher: 'International Music Company', editor: 'Leonard Rose', year: 1960, description: 'Practical performance edition with bowings and fingerings by one of the great American cellists.', type: 'performer', url: 'https://www.internationalmusicco.com/' }
    ],
    external_links: [
      { type: 'imslp', url: 'https://imslp.org/wiki/Cello_Concerto_No.1,_Op.33_(Saint-Sa%C3%ABns,_Camille)', label: 'IMSLP — Saint-Saëns Cello Concerto No. 1' },
      { type: 'wikipedia', url: 'https://en.wikipedia.org/wiki/Cello_Concerto_No._1_(Saint-Sa%C3%ABns)', label: 'Wikipedia — Saint-Saëns Cello Concerto No. 1' },
      { type: 'internet_archive', url: 'https://archive.org/details/lp_two-great-cello-concertos_camille-saintsans-douard-lalo-andr-navarra', label: 'André Navarra / Münch / Orchestre des Concerts Lamoureux' },
      { type: 'internet_archive', url: 'https://archive.org/details/nobel-prize-concert-2021', label: 'Sol Gabetta — 2021 Nobel Prize Concert' },
    ],
    movements: [
      { name: 'I. Allegro non troppo', key: 'A minor', meter: '4/4' },
      { name: 'II. Allegretto con moto', key: 'B-flat major', meter: '3/4' },
      { name: 'III. Tempo primo', key: 'A minor', meter: '4/4' },
    ],
  },
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
      { id: 'e-elgar-cc-novello', publisher: 'Novello', editor: 'Original publication', year: 1919, description: 'The original Novello edition, overseen by Elgar. Standard performance edition.', type: 'practical', url: 'https://imslp.org/wiki/Cello_Concerto,_Op.85_(Elgar,_Edward)' },
      { id: 'e-elgar-cc-barenreiter', publisher: 'Bärenreiter', editor: 'Jonathan Del Mar', year: 2020, description: 'New critical edition correcting errors in previous printings. The most accurate modern source.', type: 'scholarly', url: 'https://www.baerenreiter.com/en/shop/?tx_solr%5Bq%5D=Elgar+cello+concerto' }
    ],
    external_links: [
      { type: 'wikipedia', url: 'https://en.wikipedia.org/wiki/Cello_Concerto_(Elgar)', label: 'Wikipedia — Elgar Cello Concerto' },
      { type: 'internet_archive', url: 'https://archive.org/details/j.duprej.barbirolliliveatprague03011967elgarcelloconcerto', label: 'Jacqueline du Pré / Barbirolli — Live Prague 1967' },
      { type: 'vimeo', url: 'https://vimeo.com/212893480', label: 'Truls Mørk / Concertgebouw — Live Amsterdam 2017' },
    ],
    movements: [
      { name: 'I. Adagio — Moderato', key: 'E minor', meter: '4/4' },
      { name: 'II. Lento — Allegro molto', key: 'G major', meter: '2/4' },
      { name: 'III. Adagio', key: 'B-flat major', meter: '3/8' },
      { name: 'IV. Allegro — Moderato — Allegro, ma non troppo', key: 'E minor', meter: '2/4 & 4/4' },
    ],
  },
  {
    id: 'strauss-cello-sonata',
    title: 'Cello Sonata in F major',
    composer_name: 'Richard Strauss',
    catalog_number: 'Op. 6',
    instruments: ['Cello', 'Piano'],
    era: 'Late Romantic',
    form: 'Sonata',
    duration_minutes: 28,
    difficulty: 'professional',
    description: 'Strauss\'s only cello sonata, written at nineteen and published in 1883. The work sits just before his turn to the tone poems: it is still in the conservative Brahmsian vein, with a first movement built on broad lyrical themes, a brooding slow movement in F minor, and a dashing finale. Cellists value the sonata as one of the major late-Romantic German chamber works for the instrument, sitting in repertoire alongside the Brahms sonatas and predating the Rachmaninoff.',
    editions: [
      { id: 'e-strauss-cs-universal', publisher: 'Universal Edition', editor: 'Original publication', year: 1883, description: 'Original Aibl edition, later acquired by Universal. The standard source text.', type: 'practical', url: 'https://imslp.org/wiki/Cello_Sonata,_Op.6_(Strauss,_Richard)' },
      { id: 'e-strauss-cs-henle', publisher: 'Henle Verlag', editor: 'Norbert Gertsch', year: 2015, description: 'Urtext edition based on the autograph and first edition. Clean engraving with a short critical commentary.', type: 'urtext', url: 'https://www.henle.de/en/search/?q=Strauss+Cello+Sonata+op+6' }
    ],
    external_links: [
      { type: 'imslp', url: 'https://imslp.org/wiki/Cello_Sonata,_Op.6_(Strauss,_Richard)', label: 'IMSLP — Strauss Cello Sonata' },
      { type: 'wikipedia', url: 'https://en.wikipedia.org/wiki/Cello_Sonata_(Strauss)', label: 'Wikipedia — Strauss Cello Sonata' },
    ],
    movements: [
      { name: 'I. Allegro con brio', key: 'F major', meter: '4/4' },
      { name: 'II. Andante ma non troppo', key: 'F minor', meter: '4/4' },
      { name: 'III. Finale: Allegro vivo', key: 'F major', meter: '4/4' },
    ],
  },
  {
    id: 'mendelssohn-song-without-words-cello',
    title: 'Lied ohne Worte in D major',
    composer_name: 'Felix Mendelssohn',
    catalog_number: 'Op. 109',
    instruments: ['Cello', 'Piano'],
    era: 'Romantic',
    form: 'Character piece',
    duration_minutes: 5,
    difficulty: 'intermediate',
    description: 'A brief lyric piece for cello and piano, the only one of Mendelssohn\'s "Lieder ohne Worte" (Songs without Words) composed for cello rather than piano solo. Written in 1845 and published posthumously, the work is a single unbroken melodic arc in the composer\'s most intimate vein, often programmed as an encore or as the emotional centre of a shorter recital. Its demands are interpretive rather than technical: simple surface, sustained expressive line.',
    editions: [
      { id: 'e-mendelssohn-swow-breitkopf', publisher: 'Breitkopf & Härtel', editor: 'Julius Rietz', year: 1874, description: 'Part of Breitkopf\'s historic complete works of Mendelssohn. Standard performance text for over a century.', type: 'scholarly', url: 'https://imslp.org/wiki/Lied_ohne_Worte,_Op.109_(Mendelssohn,_Felix)' },
      { id: 'e-mendelssohn-swow-henle', publisher: 'Henle Verlag', editor: 'Ernst Herttrich', year: 2009, description: 'Urtext edition based on manuscript sources. Includes a short critical report.', type: 'urtext', url: 'https://www.henle.de/en/search/?q=Mendelssohn+Op+109+Lied+ohne+Worte' }
    ],
    external_links: [
      { type: 'imslp', url: 'https://imslp.org/wiki/Lied_ohne_Worte,_Op.109_(Mendelssohn,_Felix)', label: 'IMSLP — Lied ohne Worte, Op. 109' },
      { type: 'wikipedia', url: 'https://en.wikipedia.org/wiki/Songs_Without_Words', label: 'Wikipedia — Songs Without Words' },
    ],
    movements: [
      { name: 'Andante espressivo', key: 'D major', meter: '4/4' },
    ],
  },
  {
    id: 'faure-papillon',
    title: 'Papillon',
    composer_name: 'Gabriel Fauré',
    catalog_number: 'Op. 77',
    instruments: ['Cello', 'Piano'],
    era: 'Romantic',
    form: 'Character piece',
    duration_minutes: 3,
    difficulty: 'advanced',
    description: 'A short virtuoso showpiece for cello and piano, composed in 1884. Fauré reportedly disliked the nickname "Papillon" (Butterfly) his publisher insisted on and considered the title a marketing imposition on what he thought of as a technically demanding morceau. The outer sections are flurries of rapid figuration over a simple piano accompaniment; the central section drops into a lyrical Andantino, giving the performer a brief moment to breathe before the butterfly returns. Three minutes of controlled dazzle.',
    editions: [
      { id: 'e-faure-papillon-hamelle', publisher: 'Hamelle', editor: 'Original publication', year: 1898, description: 'The original French edition. Standard historical source.', type: 'practical', url: 'https://imslp.org/wiki/Papillon,_Op.77_(Faur%C3%A9,_Gabriel)' },
      { id: 'e-faure-papillon-imc', publisher: 'International Music Company', editor: 'Maurice Eisenberg', year: 1952, description: 'American performing edition with added bowings and fingerings. Adapted for modern cello technique.', type: 'performer', url: 'https://www.internationalmusicco.com/' }
    ],
    external_links: [
      { type: 'imslp', url: 'https://imslp.org/wiki/Papillon,_Op.77_(Faur%C3%A9,_Gabriel)', label: 'IMSLP — Papillon, Op. 77' },
      { type: 'wikipedia', url: 'https://en.wikipedia.org/wiki/Gabriel_Faur%C3%A9', label: 'Wikipedia — Gabriel Fauré' },
    ],
    movements: [
      { name: 'Allegro vivo — Andantino — Allegro vivo', key: 'A major', meter: '3/4' },
    ],
  },
  {
    id: 'crumb-sonata-solo-cello',
    title: 'Sonata for Solo Cello',
    composer_name: 'George Crumb',
    catalog_number: null,
    instruments: ['Cello'],
    era: 'Contemporary',
    form: 'Sonata',
    duration_minutes: 15,
    difficulty: 'professional',
    description: 'Crumb\'s early (1955) sonata for unaccompanied cello, composed during his graduate years at the University of Michigan. The work predates the experimental sonorities Crumb became known for: it is written in a post-Bartók idiom with clear formal architecture, aggressive rhythmic drive, and folk-inflected melodic material. The three movements are a Fantasia, a set of character pieces titled "Tema pastorale con variazioni", and a Toccata. The sonata has become a core 20th-century solo cello work and is often paired with Kodály\'s Op. 8 and the Bach Suites in recital programmes.',
    editions: [
      { id: 'e-crumb-ss-peters', publisher: 'C. F. Peters', editor: 'Original publication', year: 1955, description: 'The original Peters edition. Remains the only published score; no critical edition has been prepared.', type: 'performer', url: 'https://www.wisemusicclassical.com/publishers/edition-peters/' }
    ],
    external_links: [
      { type: 'wikipedia', url: 'https://en.wikipedia.org/wiki/George_Crumb', label: 'Wikipedia — George Crumb' },
    ],
    movements: [
      { name: 'I. Fantasia', meter: 'free meter' },
      { name: 'II. Tema pastorale con variazioni', meter: '3/4' },
      { name: 'III. Toccata', meter: '4/4' },
    ],
  },
];

// Pieces referenced as examples in llms.txt and other outward-facing docs.
// Kept in one place so the docs and the drift-detection test stay in sync.
export const EXAMPLE_PIECE_IDS = [
  'bach-cello-suite-1',
  'haydn-cello-concerto-1',
  'elgar-cello-concerto',
] as const;

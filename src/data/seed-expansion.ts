import type { SeedPiece } from './seed';

export const expansionPieces: SeedPiece[] = [
  // ═══════════════════════════════════
  // ORGAN
  // ═══════════════════════════════════
  {
    id: 'bach-toccata-fugue-dm',
    title: 'Toccata and Fugue in D minor',
    composer_name: 'Johann Sebastian Bach',
    catalog_number: 'BWV 565',
    instruments: ['Organ'],
    era: 'Baroque',
    form: 'Toccata and Fugue',
    duration_minutes: 9,
    difficulty: 'advanced',
    description: 'The most famous organ work ever written. The dramatic opening descending figure is instantly recognizable. While its attribution to Bach has been debated by scholars, its place in the organ repertoire is unquestioned. The toccata features virtuosic passages over sustained pedal tones, while the fugue builds a complex four-voice structure.',
    editions: [
      { id: 'e-bach-toc-baren', publisher: 'Bärenreiter', editor: 'Dietrich Kilian', year: 1972, description: 'Part of the New Bach Edition. Critical edition based on the earliest surviving manuscript copies.' },
      { id: 'e-bach-toc-peters', publisher: 'Peters', editor: 'Friedrich Conrad Griepenkerl', year: 1845, description: 'Historic edition that helped establish the work in the concert repertoire.' }
    ],
    external_links: [
      { type: 'imslp', url: 'https://imslp.org/wiki/Toccata_and_Fugue_in_D_minor,_BWV_565_(Bach,_Johann_Sebastian)', label: 'IMSLP — 12 editions available' },
      { type: 'youtube', url: 'https://www.youtube.com/watch?v=ho9rZjlsyYY', label: 'Toccata and Fugue in D Minor' },
      { type: 'wikipedia', url: 'https://en.wikipedia.org/wiki/Toccata_and_Fugue_in_D_minor,_BWV_565', label: 'Wikipedia — Toccata and Fugue BWV 565' }
    ],
  },
  {
    id: 'bach-passacaglia-cm',
    title: 'Passacaglia and Fugue in C minor',
    composer_name: 'Johann Sebastian Bach',
    catalog_number: 'BWV 582',
    instruments: ['Organ'],
    era: 'Baroque',
    form: 'Passacaglia',
    duration_minutes: 15,
    difficulty: 'professional',
    description: 'One of the greatest works in the organ literature. A majestic passacaglia theme in the pedals supports twenty variations of increasing complexity, followed by a double fugue that transforms the passacaglia theme. The work is a supreme test of pedal technique and musical architecture.',
    editions: [
      { id: 'e-bach-pass-baren', publisher: 'Bärenreiter', editor: 'Dietrich Kilian', year: 1972, description: 'New Bach Edition. Scholarly critical text with detailed source commentary.' },
      { id: 'e-bach-pass-henle', publisher: 'Henle Verlag', editor: 'Jean-Claude Zehnder', year: 2010, description: 'Urtext edition with practical performance suggestions.' }
    ],
    external_links: [
      { type: 'imslp', url: 'https://imslp.org/wiki/Passacaglia_and_Fugue_in_C_minor,_BWV_582_(Bach,_Johann_Sebastian)', label: 'IMSLP — editions available' },
      { type: 'wikipedia', url: 'https://en.wikipedia.org/wiki/Passacaglia_and_Fugue_in_C_minor,_BWV_582', label: 'Wikipedia — Passacaglia BWV 582' }
    ],
  },
  {
    id: 'widor-toccata',
    title: 'Toccata from Symphony No. 5',
    composer_name: 'Charles-Marie Widor',
    catalog_number: 'Op. 42/1',
    instruments: ['Organ'],
    era: 'Romantic',
    form: 'Toccata',
    duration_minutes: 6,
    difficulty: 'advanced',
    description: 'The final movement of Widor\'s Fifth Organ Symphony is one of the most famous pieces in the entire organ repertoire. Its perpetual-motion figuration over a triumphant pedal melody has made it a staple of wedding recessionals and concert finales worldwide. Widor served as organist at Saint-Sulpice in Paris for 64 years.',
    editions: [
      { id: 'e-widor-toc-dover', publisher: 'Dover', editor: 'Charles-Marie Widor', year: 1991, description: 'Reprint of the original Hamelle edition.' },
      { id: 'e-widor-toc-schott', publisher: 'Schott', editor: 'John R. Near', year: 2005, description: 'Critical edition based on multiple sources including Widor\'s annotations.' }
    ],
    external_links: [
      { type: 'imslp', url: 'https://imslp.org/wiki/Organ_Symphony_No.5,_Op.42_No.1_(Widor,_Charles-Marie)', label: 'IMSLP — editions available' },
      { type: 'wikipedia', url: 'https://en.wikipedia.org/wiki/Symphony_No._5_(Widor)', label: 'Wikipedia — Widor Symphony No. 5' }
    ],
  },
  {
    id: 'messiaen-nativite',
    title: 'La Nativité du Seigneur',
    composer_name: 'Olivier Messiaen',
    catalog_number: null,
    instruments: ['Organ'],
    era: '20th Century',
    form: 'Suite',
    duration_minutes: 55,
    difficulty: 'professional',
    description: 'Nine meditations for organ on themes of the Nativity. Messiaen\'s first major organ cycle, exploring his modes of limited transposition, Hindu rhythms, and birdsong-inspired melodies. Each movement depicts a theological aspect of the birth of Christ, from the Virgin\'s contemplation to the eternal designs of God.',
    editions: [
      { id: 'e-messiaen-nat-leduc', publisher: 'Alphonse Leduc', editor: 'Olivier Messiaen', year: 1936, description: 'Original edition by the composer.' }
    ],
    external_links: [
      { type: 'wikipedia', url: 'https://en.wikipedia.org/wiki/La_Nativit%C3%A9_du_Seigneur', label: 'Wikipedia — La Nativité du Seigneur' }
    ],
  },

  // ═══════════════════════════════════
  // CHAMBER MUSIC — String Quartets
  // ═══════════════════════════════════
  {
    id: 'beethoven-quartet-op131',
    title: 'String Quartet No. 14 in C-sharp minor',
    composer_name: 'Ludwig van Beethoven',
    catalog_number: 'Op. 131',
    instruments: ['Violin', 'Viola', 'Cello'],
    era: 'Classical',
    form: 'String Quartet',
    duration_minutes: 40,
    difficulty: 'professional',
    description: 'Beethoven considered this his greatest quartet. Seven movements played without pause, opening with a transcendent fugue. Schubert reportedly said of it, "After this, what is left for us to write?" The work pushes the boundaries of the string quartet form to its absolute limits.',
    editions: [
      { id: 'e-beeth-q131-henle', publisher: 'Henle Verlag', editor: 'Emil Platen', year: 2009, description: 'Critical urtext edition with parts. Based on autograph and first edition.' },
      { id: 'e-beeth-q131-baren', publisher: 'Bärenreiter', editor: 'Jonathan Del Mar', year: 2017, description: 'New critical edition resolving discrepancies between autograph and first edition.' }
    ],
    external_links: [
      { type: 'imslp', url: 'https://imslp.org/wiki/String_Quartet_No.14,_Op.131_(Beethoven,_Ludwig_van)', label: 'IMSLP — editions available' },
      { type: 'wikipedia', url: 'https://en.wikipedia.org/wiki/String_Quartet_No._14_(Beethoven)', label: 'Wikipedia — Beethoven Quartet Op. 131' }
    ],
  },
  {
    id: 'schubert-quartet-death-maiden',
    title: 'String Quartet No. 14 "Death and the Maiden"',
    composer_name: 'Franz Schubert',
    catalog_number: 'D. 810',
    instruments: ['Violin', 'Viola', 'Cello'],
    era: 'Romantic',
    form: 'String Quartet',
    duration_minutes: 40,
    difficulty: 'professional',
    description: 'Named for the second movement\'s theme-and-variations based on Schubert\'s own song "Der Tod und das Mädchen." One of the most dramatic works in the chamber music repertoire. The relentless opening triplets, the achingly beautiful slow movement, and the tarantella-like finale make it a cornerstone of quartet literature.',
    editions: [
      { id: 'e-schub-dm-henle', publisher: 'Henle Verlag', editor: 'Egon Voss', year: 2004, description: 'Urtext edition with score and parts based on autograph manuscript.' },
      { id: 'e-schub-dm-baren', publisher: 'Bärenreiter', editor: 'Martin Chusid', year: 2003, description: 'New Schubert Edition. Critical text with detailed source apparatus.' }
    ],
    external_links: [
      { type: 'imslp', url: 'https://imslp.org/wiki/String_Quartet_No.14,_D.810_(Schubert,_Franz)', label: 'IMSLP — editions available' },
      { type: 'wikipedia', url: 'https://en.wikipedia.org/wiki/String_Quartet_No._14_(Schubert)', label: 'Wikipedia — Death and the Maiden' }
    ],
  },
  {
    id: 'ravel-quartet-fmajor',
    title: 'String Quartet in F major',
    composer_name: 'Maurice Ravel',
    catalog_number: null,
    instruments: ['Violin', 'Viola', 'Cello'],
    era: 'Impressionist',
    form: 'String Quartet',
    duration_minutes: 28,
    difficulty: 'advanced',
    description: 'Ravel\'s only string quartet, composed at age 28. The work combines classical formal clarity with impressionist color and Basque-influenced rhythms. The pizzicato second movement is particularly inventive, while the slow movement achieves an almost orchestral richness from four instruments.',
    editions: [
      { id: 'e-ravel-q-henle', publisher: 'Henle Verlag', editor: 'Peter Jost', year: 2014, description: 'Urtext edition based on autograph and first edition.' },
      { id: 'e-ravel-q-durand', publisher: 'Durand', editor: 'Maurice Ravel', year: 1904, description: 'Original publication. The standard performing edition for decades.' }
    ],
    external_links: [
      { type: 'imslp', url: 'https://imslp.org/wiki/String_Quartet_(Ravel,_Maurice)', label: 'IMSLP — editions available' },
      { type: 'wikipedia', url: 'https://en.wikipedia.org/wiki/String_Quartet_(Ravel)', label: 'Wikipedia — Ravel String Quartet' }
    ],
  },
  {
    id: 'debussy-quartet-gminor',
    title: 'String Quartet in G minor',
    composer_name: 'Claude Debussy',
    catalog_number: 'Op. 10',
    instruments: ['Violin', 'Viola', 'Cello'],
    era: 'Impressionist',
    form: 'String Quartet',
    duration_minutes: 25,
    difficulty: 'advanced',
    description: 'Debussy\'s only string quartet, a landmark of the impressionist chamber music repertoire. Built on cyclic principles with a single theme transformed across all four movements. The scherzo\'s pizzicato textures and the finale\'s rhythmic energy show Debussy\'s debt to the Javanese gamelan music he heard at the 1889 Paris Exposition.',
    editions: [
      { id: 'e-debussy-q-henle', publisher: 'Henle Verlag', editor: 'Ernst-Günter Heinemann', year: 2009, description: 'Urtext edition with score and parts.' },
      { id: 'e-debussy-q-durand', publisher: 'Durand', editor: 'Claude Debussy', year: 1894, description: 'Original edition.' }
    ],
    external_links: [
      { type: 'imslp', url: 'https://imslp.org/wiki/String_Quartet,_Op.10_(Debussy,_Claude)', label: 'IMSLP — editions available' },
      { type: 'wikipedia', url: 'https://en.wikipedia.org/wiki/String_Quartet_(Debussy)', label: 'Wikipedia — Debussy String Quartet' }
    ],
  },
  {
    id: 'bartok-quartet-4',
    title: 'String Quartet No. 4',
    composer_name: 'Béla Bartók',
    catalog_number: 'Sz. 91',
    instruments: ['Violin', 'Viola', 'Cello'],
    era: '20th Century',
    form: 'String Quartet',
    duration_minutes: 24,
    difficulty: 'professional',
    description: 'The fourth of Bartók\'s six string quartets, often considered the pinnacle of 20th-century chamber music. Five movements in an arch form (ABCBA), with the night-music central movement surrounded by increasingly energetic outer movements. Extraordinary extended techniques including Bartók pizzicato, sul ponticello, and col legno.',
    editions: [
      { id: 'e-bartok-q4-boosey', publisher: 'Boosey & Hawkes', editor: 'Béla Bartók', year: 1929, description: 'Original publication, the standard performing edition.' },
      { id: 'e-bartok-q4-henle', publisher: 'Henle Verlag', editor: 'László Somfai', year: 2018, description: 'New critical edition based on autograph and corrected proofs.' }
    ],
    external_links: [
      { type: 'wikipedia', url: 'https://en.wikipedia.org/wiki/String_Quartet_No._4_(Bart%C3%B3k)', label: 'Wikipedia — Bartók Quartet No. 4' }
    ],
  },
  {
    id: 'shostakovich-quartet-8',
    title: 'String Quartet No. 8',
    composer_name: 'Dmitri Shostakovich',
    catalog_number: 'Op. 110',
    instruments: ['Violin', 'Viola', 'Cello'],
    era: '20th Century',
    form: 'String Quartet',
    duration_minutes: 20,
    difficulty: 'advanced',
    description: 'Dedicated "to the victims of fascism and war," though widely understood as autobiographical, possibly even a suicide note. Built entirely on Shostakovich\'s musical monogram D-S-C-H (D-Eb-C-B in German notation), it quotes extensively from his own works. Composed in three days in Dresden, the devastated city left a profound impact on the composer.',
    editions: [
      { id: 'e-shost-q8-sikorski', publisher: 'Sikorski', editor: 'Dmitri Shostakovich', year: 1960, description: 'Original publication.' },
      { id: 'e-shost-q8-dsch', publisher: 'DSCH Publishers', editor: 'Manashir Yakubov', year: 2005, description: 'New collected works edition with detailed editorial commentary.' }
    ],
    external_links: [
      { type: 'youtube', url: 'https://www.youtube.com/watch?v=PjvTTfbpWjY', label: 'Shostakovich String Quartet No. 8 in C Minor' },
      { type: 'wikipedia', url: 'https://en.wikipedia.org/wiki/String_Quartet_No._8_(Shostakovich)', label: 'Wikipedia — Shostakovich Quartet No. 8' }
    ],
  },

  // ═══════════════════════════════════
  // CHAMBER MUSIC — Piano Trios & Other
  // ═══════════════════════════════════
  {
    id: 'schubert-piano-trio-2',
    title: 'Piano Trio No. 2 in E-flat major',
    composer_name: 'Franz Schubert',
    catalog_number: 'D. 929',
    instruments: ['Piano', 'Violin', 'Cello'],
    era: 'Romantic',
    form: 'Piano Trio',
    duration_minutes: 45,
    difficulty: 'professional',
    description: 'One of the longest and most ambitious piano trios in the repertoire, composed in the last year of Schubert\'s life. The slow movement\'s haunting Swedish folk melody (used in Stanley Kubrick\'s "Barry Lyndon") is one of the most beautiful passages in all chamber music. The finale\'s epic scope rivals a symphony.',
    editions: [
      { id: 'e-schub-trio2-henle', publisher: 'Henle Verlag', editor: 'Ernst Herttrich', year: 2007, description: 'Urtext edition with score and parts.' },
      { id: 'e-schub-trio2-baren', publisher: 'Bärenreiter', editor: 'Martin Chusid', year: 2003, description: 'New Schubert Edition critical text.' }
    ],
    external_links: [
      { type: 'imslp', url: 'https://imslp.org/wiki/Piano_Trio_No.2,_D.929_(Schubert,_Franz)', label: 'IMSLP — editions available' },
      { type: 'wikipedia', url: 'https://en.wikipedia.org/wiki/Piano_Trio_No._2_(Schubert)', label: 'Wikipedia — Schubert Piano Trio No. 2' }
    ],
  },
  {
    id: 'brahms-piano-quintet',
    title: 'Piano Quintet in F minor',
    composer_name: 'Johannes Brahms',
    catalog_number: 'Op. 34',
    instruments: ['Piano', 'Violin', 'Viola', 'Cello'],
    era: 'Romantic',
    form: 'Piano Quintet',
    duration_minutes: 40,
    difficulty: 'professional',
    description: 'One of the towering achievements of Romantic chamber music. Originally conceived as a string quintet, then a two-piano sonata before finding its definitive form. The dramatic opening, lyrical slow movement, and propulsive scherzo lead to a finale of immense structural ambition. Brahms at his most powerful.',
    editions: [
      { id: 'e-brahms-pq-henle', publisher: 'Henle Verlag', editor: 'Ernst Herttrich', year: 2010, description: 'Urtext edition with score and parts.' },
      { id: 'e-brahms-pq-imc', publisher: 'International Music Company', editor: 'Scharwenka', year: 1950, description: 'Practical performing edition with fingerings.' }
    ],
    external_links: [
      { type: 'imslp', url: 'https://imslp.org/wiki/Piano_Quintet,_Op.34_(Brahms,_Johannes)', label: 'IMSLP — editions available' },
      { type: 'wikipedia', url: 'https://en.wikipedia.org/wiki/Piano_Quintet_(Brahms)', label: 'Wikipedia — Brahms Piano Quintet' }
    ],
  },

  // ═══════════════════════════════════
  // ORCHESTRAL EXCERPTS
  // ═══════════════════════════════════
  {
    id: 'strauss-don-juan',
    title: 'Don Juan',
    composer_name: 'Richard Strauss',
    catalog_number: 'Op. 20',
    instruments: ['Violin', 'Viola', 'Cello', 'Oboe', 'Horn'],
    era: 'Late Romantic',
    form: 'Tone Poem',
    duration_minutes: 18,
    difficulty: 'professional',
    description: 'The tone poem that made Strauss famous at age 24. Its dazzling orchestration and heroic themes have made it a staple of audition repertoire for virtually every orchestral instrument. The opening violin passage, oboe love theme, and horn calls are among the most frequently requested excerpts at professional orchestra auditions worldwide.',
    editions: [
      { id: 'e-strauss-dj-peters', publisher: 'Peters', editor: 'Richard Strauss', year: 1890, description: 'Original edition. Study score.' },
      { id: 'e-strauss-dj-kalmus', publisher: 'Kalmus', editor: 'Edwin F. Kalmus', year: 1933, description: 'Affordable study score reprint.' }
    ],
    external_links: [
      { type: 'wikipedia', url: 'https://en.wikipedia.org/wiki/Don_Juan_(Strauss)', label: 'Wikipedia — Don Juan' }
    ],
  },
  {
    id: 'beethoven-symphony-5',
    title: 'Symphony No. 5 in C minor',
    composer_name: 'Ludwig van Beethoven',
    catalog_number: 'Op. 67',
    instruments: ['Violin', 'Viola', 'Cello', 'Clarinet', 'Oboe', 'Horn'],
    era: 'Classical',
    form: 'Symphony',
    duration_minutes: 33,
    difficulty: 'professional',
    description: 'The four-note "fate knocking at the door" motif is the most recognizable opening in all of classical music. Beethoven transforms this simple idea through four movements, from C minor struggle to C major triumph. Essential audition repertoire for every orchestral musician. The seamless transition from the third to fourth movement was revolutionary.',
    editions: [
      { id: 'e-beeth-sym5-baren', publisher: 'Bärenreiter', editor: 'Jonathan Del Mar', year: 1999, description: 'Definitive critical edition correcting errors in all previous editions.' },
      { id: 'e-beeth-sym5-henle', publisher: 'Henle Verlag', editor: 'Bathia Churgin', year: 2017, description: 'New critical edition with detailed source commentary.' }
    ],
    external_links: [
      { type: 'imslp', url: 'https://imslp.org/wiki/Symphony_No.5,_Op.67_(Beethoven,_Ludwig_van)', label: 'IMSLP — editions available' },
      { type: 'youtube', url: 'https://www.youtube.com/watch?v=jv2WJMVPQi8', label: 'Beethoven - Symphony No. 5' },
      { type: 'wikipedia', url: 'https://en.wikipedia.org/wiki/Symphony_No._5_(Beethoven)', label: 'Wikipedia — Beethoven Symphony No. 5' }
    ],
  },
  {
    id: 'tchaikovsky-symphony-6',
    title: 'Symphony No. 6 "Pathétique"',
    composer_name: 'Pyotr Ilyich Tchaikovsky',
    catalog_number: 'Op. 74',
    instruments: ['Violin', 'Viola', 'Cello', 'Clarinet', 'Bassoon'],
    era: 'Romantic',
    form: 'Symphony',
    duration_minutes: 46,
    difficulty: 'professional',
    description: 'Tchaikovsky\'s final symphony, premiered nine days before his death. The unconventional ending, an Adagio lamentoso that fades into silence, broke all symphonic conventions. The bassoon opening, the famous 5/4 waltz, and the searing climax of the first movement are standard audition excerpts. One of the most emotionally overwhelming works in the repertoire.',
    editions: [
      { id: 'e-tchaik-sym6-jurgenson', publisher: 'Jurgenson/Kalmus', editor: 'Tchaikovsky', year: 1893, description: 'Original edition, widely available as Kalmus reprint.' },
      { id: 'e-tchaik-sym6-baren', publisher: 'Bärenreiter', editor: 'Thomas Kohlhase', year: 2007, description: 'New critical edition from the Tchaikovsky complete works project.' }
    ],
    external_links: [
      { type: 'imslp', url: 'https://imslp.org/wiki/Symphony_No.6,_Op.74_(Tchaikovsky,_Pyotr)', label: 'IMSLP — editions available' },
      { type: 'wikipedia', url: 'https://en.wikipedia.org/wiki/Symphony_No._6_(Tchaikovsky)', label: 'Wikipedia — Pathétique Symphony' }
    ],
  },
  {
    id: 'mahler-symphony-5',
    title: 'Symphony No. 5',
    composer_name: 'Gustav Mahler',
    catalog_number: null,
    instruments: ['Violin', 'Cello', 'Horn', 'Trumpet'],
    era: 'Late Romantic',
    form: 'Symphony',
    duration_minutes: 70,
    difficulty: 'professional',
    description: 'From the iconic solo trumpet funeral march to the famous Adagietto (used in Visconti\'s "Death in Venice"), Mahler\'s Fifth is one of the most performed symphonies of the 20th century. The horn and trumpet parts are among the most demanding in the orchestral repertoire. The Rondo-Finale is a contrapuntal tour de force.',
    editions: [
      { id: 'e-mahler-sym5-peters', publisher: 'Peters', editor: 'Reinhold Kubik', year: 2002, description: 'Critical edition from the International Gustav Mahler Society.' },
      { id: 'e-mahler-sym5-kalmus', publisher: 'Kalmus', editor: 'Edwin F. Kalmus', year: 1964, description: 'Affordable study score.' }
    ],
    external_links: [
      { type: 'youtube', url: 'https://www.youtube.com/watch?v=vOvXhyldUko', label: 'Mahler - Symphony No.5 - Abbado - Lucerne Festival Orches...' },
      { type: 'wikipedia', url: 'https://en.wikipedia.org/wiki/Symphony_No._5_(Mahler)', label: 'Wikipedia — Mahler Symphony No. 5' }
    ],
  },
  {
    id: 'brahms-symphony-4',
    title: 'Symphony No. 4 in E minor',
    composer_name: 'Johannes Brahms',
    catalog_number: 'Op. 98',
    instruments: ['Violin', 'Viola', 'Cello', 'Flute', 'Clarinet'],
    era: 'Romantic',
    form: 'Symphony',
    duration_minutes: 40,
    difficulty: 'professional',
    description: 'Brahms\'s final symphony, culminating in a monumental passacaglia built on a theme from Bach\'s Cantata 150. The work looks backward and forward simultaneously, combining Baroque contrapuntal technique with Romantic orchestral color. The flute solo in the first movement and the clarinet passages throughout are standard audition excerpts.',
    editions: [
      { id: 'e-brahms-sym4-henle', publisher: 'Henle Verlag', editor: 'Robert Pascall', year: 2016, description: 'New critical edition based on autograph and first edition.' },
      { id: 'e-brahms-sym4-baren', publisher: 'Bärenreiter', editor: 'Robert Pascall', year: 2018, description: 'Critical edition with extensive editorial commentary.' }
    ],
    external_links: [
      { type: 'imslp', url: 'https://imslp.org/wiki/Symphony_No.4,_Op.98_(Brahms,_Johannes)', label: 'IMSLP — editions available' },
      { type: 'youtube', url: 'https://www.youtube.com/watch?v=pT6SN4tPbv8', label: 'Johannes Brahms - Symphony no.4, op.98' },
      { type: 'wikipedia', url: 'https://en.wikipedia.org/wiki/Symphony_No._4_(Brahms)', label: 'Wikipedia — Brahms Symphony No. 4' }
    ],
  },

  // ═══════════════════════════════════
  // HARP
  // ═══════════════════════════════════
  {
    id: 'debussy-danses-sacree',
    title: 'Danses sacrée et profane',
    composer_name: 'Claude Debussy',
    catalog_number: 'L. 103',
    instruments: ['Harp'],
    era: 'Impressionist',
    form: 'Dance',
    duration_minutes: 10,
    difficulty: 'advanced',
    description: 'Composed to demonstrate the chromatic harp, this pair of dances for harp and string orchestra has become the most-performed solo harp concerto work. The sacred dance is modal and austere, while the profane dance is sensuous and waltz-like. A staple of harp auditions and recitals worldwide.',
    editions: [
      { id: 'e-debussy-ds-durand', publisher: 'Durand', editor: 'Claude Debussy', year: 1904, description: 'Original edition with piano reduction.' },
      { id: 'e-debussy-ds-imc', publisher: 'International Music Company', editor: 'Carlos Salzedo', year: 1950, description: 'Widely used performing edition with practical markings.' }
    ],
    external_links: [
      { type: 'wikipedia', url: 'https://en.wikipedia.org/wiki/Danse_sacr%C3%A9e_et_Danse_profane', label: 'Wikipedia — Danses sacrée et profane' }
    ],
  },
  {
    id: 'salzedo-chanson-nuit',
    title: 'Chanson dans la Nuit',
    composer_name: 'Carlos Salzedo',
    catalog_number: null,
    instruments: ['Harp'],
    era: '20th Century',
    form: 'Character Piece',
    duration_minutes: 5,
    difficulty: 'advanced',
    description: 'The most famous solo harp piece of the 20th century. Salzedo, who revolutionized harp technique, uses harmonics, glissandi, and special effects to create an atmospheric nocturne. A standard recital and competition piece that showcases the full range of the modern concert harp.',
    editions: [
      { id: 'e-salzedo-cn-schirmer', publisher: 'G. Schirmer', editor: 'Carlos Salzedo', year: 1921, description: 'Original edition by the composer.' }
    ],
    external_links: [
      { type: 'wikipedia', url: 'https://en.wikipedia.org/wiki/Carlos_Salzedo', label: 'Wikipedia — Carlos Salzedo' }
    ],
  },

  // ═══════════════════════════════════
  // PERCUSSION
  // ═══════════════════════════════════
  {
    id: 'keiko-abe-prism-rhapsody',
    title: 'Prism Rhapsody',
    composer_name: 'Keiko Abe',
    catalog_number: null,
    instruments: ['Marimba'],
    era: '20th Century',
    form: 'Rhapsody',
    duration_minutes: 15,
    difficulty: 'professional',
    description: 'The most important work for solo marimba and orchestra. Keiko Abe, the pioneer of modern marimba performance, composed this virtuosic showpiece that has become the concerto repertoire standard for marimbists worldwide. Requires four mallets and exploits the full five-octave range of the instrument.',
    editions: [
      { id: 'e-abe-prism-xebec', publisher: 'Xebec Music Publishing', editor: 'Keiko Abe', year: 1995, description: 'Original edition by the composer. Solo part with piano reduction.' }
    ],
    external_links: [
      { type: 'wikipedia', url: 'https://en.wikipedia.org/wiki/Keiko_Abe', label: 'Wikipedia — Keiko Abe' }
    ],
  },
  {
    id: 'rosauro-marimba-concerto',
    title: 'Concerto for Marimba and Orchestra',
    composer_name: 'Ney Rosauro',
    catalog_number: null,
    instruments: ['Marimba'],
    era: '20th Century',
    form: 'Concerto',
    duration_minutes: 22,
    difficulty: 'advanced',
    description: 'The most frequently performed marimba concerto worldwide. Three movements blending Brazilian rhythms with classical form. The lyrical second movement and the energetic samba-influenced finale have made this the go-to audition concerto for percussion majors at conservatories globally.',
    editions: [
      { id: 'e-rosauro-mc-propercussao', publisher: 'Pro Percussão', editor: 'Ney Rosauro', year: 1986, description: 'Original edition by the composer with piano reduction.' }
    ],
    external_links: [
      { type: 'wikipedia', url: 'https://en.wikipedia.org/wiki/Ney_Rosauro', label: 'Wikipedia — Ney Rosauro' }
    ],
  },
  {
    id: 'carter-timpani-pieces',
    title: 'Eight Pieces for Four Timpani',
    composer_name: 'Elliott Carter',
    catalog_number: null,
    instruments: ['Timpani'],
    era: '20th Century',
    form: 'Suite',
    duration_minutes: 20,
    difficulty: 'professional',
    description: 'The cornerstone of solo timpani literature. Carter explores metric modulation, polyrhythms, and extended techniques across eight character pieces. Required at virtually every professional timpani audition and a standard at percussion festivals. Each piece presents unique rhythmic and technical challenges.',
    editions: [
      { id: 'e-carter-timp-amp', publisher: 'Associated Music Publishers', editor: 'Elliott Carter', year: 1968, description: 'Original edition by the composer. Revised 1966 with four additional pieces.' }
    ],
    external_links: [
      { type: 'wikipedia', url: 'https://en.wikipedia.org/wiki/Elliott_Carter', label: 'Wikipedia — Elliott Carter' }
    ],
  },
  {
    id: 'bach-partita-snare',
    title: 'Partita for Solo Snare Drum',
    composer_name: 'Siegfried Fink',
    catalog_number: null,
    instruments: ['Snare Drum'],
    era: '20th Century',
    form: 'Partita',
    duration_minutes: 8,
    difficulty: 'advanced',
    description: 'The most performed solo snare drum piece in the classical percussion repertoire. Fink applies Baroque suite structure to the snare drum, with movements including Intrada, Marcia, Siciliana, and Bourée. Standard audition and competition repertoire that demands musicality beyond mere technique.',
    editions: [
      { id: 'e-fink-partita-zimm', publisher: 'Zimmermann', editor: 'Siegfried Fink', year: 1972, description: 'Original edition by the composer.' }
    ],
    external_links: [
    ],
  },

  // ═══════════════════════════════════
  // VIOLA
  // ═══════════════════════════════════
  {
    id: 'bartok-viola-concerto',
    title: 'Viola Concerto',
    composer_name: 'Béla Bartók',
    catalog_number: 'Sz. 120',
    instruments: ['Viola'],
    era: '20th Century',
    form: 'Concerto',
    duration_minutes: 22,
    difficulty: 'professional',
    description: 'Bartók\'s final work, left unfinished at his death and completed by Tibor Serly. Despite its complicated genesis, it has become the most important viola concerto of the 20th century. The Hungarian folk-influenced themes, virtuosic cadenza, and lyrical slow movement showcase the viola\'s expressive range.',
    editions: [
      { id: 'e-bartok-vla-boosey', publisher: 'Boosey & Hawkes', editor: 'Tibor Serly', year: 1950, description: 'Original completion by Serly. The standard performing version.' },
      { id: 'e-bartok-vla-boosey2', publisher: 'Boosey & Hawkes', editor: 'Peter Bartók & Nelson Dellamaggiore', year: 1995, description: 'Revised edition closer to Bartók\'s sketches.' }
    ],
    external_links: [
      { type: 'wikipedia', url: 'https://en.wikipedia.org/wiki/Viola_Concerto_(Bart%C3%B3k)', label: 'Wikipedia — Bartók Viola Concerto' }
    ],
  },
  {
    id: 'walton-viola-concerto',
    title: 'Viola Concerto',
    composer_name: 'William Walton',
    catalog_number: null,
    instruments: ['Viola'],
    era: '20th Century',
    form: 'Concerto',
    duration_minutes: 25,
    difficulty: 'professional',
    description: 'Written for Lionel Tertis (who initially declined it) and premiered by Paul Hindemith, this is one of the finest viola concertos ever written. The opening melody is one of the most beautiful in the viola repertoire. Walton\'s orchestration is transparent enough to let the viola\'s middle register sing throughout.',
    editions: [
      { id: 'e-walton-vla-oup', publisher: 'Oxford University Press', editor: 'William Walton', year: 1930, description: 'Original edition, revised 1961.' }
    ],
    external_links: [
      { type: 'wikipedia', url: 'https://en.wikipedia.org/wiki/Viola_Concerto_(Walton)', label: 'Wikipedia — Walton Viola Concerto' }
    ],
  },

  // ═══════════════════════════════════
  // ADDITIONAL PIANO
  // ═══════════════════════════════════
  {
    id: 'rachmaninoff-concerto-2',
    title: 'Piano Concerto No. 2 in C minor',
    composer_name: 'Sergei Rachmaninoff',
    catalog_number: 'Op. 18',
    instruments: ['Piano'],
    era: 'Late Romantic',
    form: 'Concerto',
    duration_minutes: 33,
    difficulty: 'professional',
    description: 'The most popular piano concerto in the repertoire. Written after Rachmaninoff overcame a creative crisis through hypnotherapy, it opens with the famous sequence of darkening piano chords. The soaring second movement theme has been adapted countless times in popular music. A supreme test of Romantic pianism.',
    editions: [
      { id: 'e-rach-pc2-boosey2', publisher: 'Boosey & Hawkes', editor: 'Rachmaninoff', year: 1901, description: 'Original edition. Two-piano reduction.' },
      { id: 'e-rach-pc2-schirmer2', publisher: 'G. Schirmer', editor: 'Ruth Laredo', year: 1991, description: 'Performance edition with the Laredo two-piano reduction.' }
    ],
    external_links: [
      { type: 'imslp', url: 'https://imslp.org/wiki/Piano_Concerto_No.2,_Op.18_(Rachmaninoff,_Sergei)', label: 'IMSLP — editions available' },
      { type: 'youtube', url: 'https://www.youtube.com/watch?v=rEGOihjqO9w', label: 'Rachmaninoff: Piano Concerto no.2 op.18 - Anna Fedorova -...' },
      { type: 'wikipedia', url: 'https://en.wikipedia.org/wiki/Piano_Concerto_No._2_(Rachmaninoff)', label: 'Wikipedia — Rachmaninoff Piano Concerto No. 2' }
    ],
  },
  {
    id: 'rachmaninoff-concerto-3',
    title: 'Piano Concerto No. 3 in D minor',
    composer_name: 'Sergei Rachmaninoff',
    catalog_number: 'Op. 30',
    instruments: ['Piano'],
    era: 'Late Romantic',
    form: 'Concerto',
    duration_minutes: 40,
    difficulty: 'professional',
    description: 'Known as "Rach 3," this is widely considered the most technically demanding concerto in the standard piano repertoire. The massive cadenza in the first movement offers two versions, both ferociously difficult. Horowitz\'s legendary performances made it a benchmark of virtuosity. The lyrical second movement provides respite before the titanic finale.',
    editions: [
      { id: 'e-rach-pc3-boosey', publisher: 'Boosey & Hawkes', editor: 'Rachmaninoff', year: 1910, description: 'Original edition.' },
      { id: 'e-rach-pc3-schirmer', publisher: 'G. Schirmer', editor: 'Ruth Laredo', year: 1992, description: 'Two-piano reduction for practice.' }
    ],
    external_links: [
      { type: 'imslp', url: 'https://imslp.org/wiki/Piano_Concerto_No.3,_Op.30_(Rachmaninoff,_Sergei)', label: 'IMSLP — editions available' },
      { type: 'youtube', url: 'https://www.youtube.com/watch?v=D5mxU_7BTRA', label: 'Horowitz Rachmaninoff 3rd Concerto Mehta NYPO 1978' },
      { type: 'wikipedia', url: 'https://en.wikipedia.org/wiki/Piano_Concerto_No._3_(Rachmaninoff)', label: 'Wikipedia — Rachmaninoff Piano Concerto No. 3' }
    ],
  },
  {
    id: 'prokofiev-sonata-7',
    title: 'Piano Sonata No. 7 "Stalingrad"',
    composer_name: 'Sergei Prokofiev',
    catalog_number: 'Op. 83',
    instruments: ['Piano'],
    era: '20th Century',
    form: 'Sonata',
    duration_minutes: 18,
    difficulty: 'professional',
    description: 'The second of Prokofiev\'s "War Sonatas," premiered by Sviatoslav Richter in 1943. The explosive final movement in 7/8 time, marked Precipitato, is one of the most viscerally exciting endings in all piano literature. The middle movement\'s eerie, mechanical march captures the atmosphere of wartime Soviet Russia.',
    editions: [
      { id: 'e-prok-son7-boosey', publisher: 'Boosey & Hawkes', editor: 'Prokofiev', year: 1943, description: 'Original edition.' },
      { id: 'e-prok-son7-henle', publisher: 'Henle Verlag', editor: 'Alexander Melnikov', year: 2019, description: 'New urtext edition with detailed source commentary.' }
    ],
    external_links: [
      { type: 'imslp', url: 'https://imslp.org/wiki/Piano_Sonata_No.7,_Op.83_(Prokofiev,_Sergei)', label: 'IMSLP — editions available' },
      { type: 'wikipedia', url: 'https://en.wikipedia.org/wiki/Piano_Sonata_No._7_(Prokofiev)', label: 'Wikipedia — Prokofiev Sonata No. 7' }
    ],
  },

  // ═══════════════════════════════════
  // ADDITIONAL VOICE
  // ═══════════════════════════════════
  {
    id: 'schubert-winterreise',
    title: 'Winterreise',
    composer_name: 'Franz Schubert',
    catalog_number: 'D. 911',
    instruments: ['Voice (Baritone)', 'Piano'],
    era: 'Romantic',
    form: 'Song Cycle',
    duration_minutes: 72,
    difficulty: 'professional',
    description: 'The greatest song cycle ever written, composed in the last year of Schubert\'s life. Twenty-four songs following a rejected lover\'s winter journey through a frozen landscape, ending with the mysterious organ-grinder. Each song is a masterpiece of text-painting and psychological insight. The piano part is a full partner, not mere accompaniment.',
    editions: [
      { id: 'e-schub-wr-henle', publisher: 'Henle Verlag', editor: 'Walther Dürr', year: 2004, description: 'Urtext in multiple keys (high, medium, low).' },
      { id: 'e-schub-wr-peters', publisher: 'Peters', editor: 'Max Friedlaender', year: 1884, description: 'Classic performing edition with German text.' }
    ],
    external_links: [
      { type: 'imslp', url: 'https://imslp.org/wiki/Winterreise,_D.911_(Schubert,_Franz)', label: 'IMSLP — editions available' },
      { type: 'wikipedia', url: 'https://en.wikipedia.org/wiki/Winterreise', label: 'Wikipedia — Winterreise' }
    ],
  },
  {
    id: 'schumann-dichterliebe',
    title: 'Dichterliebe',
    composer_name: 'Robert Schumann',
    catalog_number: 'Op. 48',
    instruments: ['Voice (Tenor)', 'Piano'],
    era: 'Romantic',
    form: 'Song Cycle',
    duration_minutes: 27,
    difficulty: 'advanced',
    description: 'Schumann\'s most beloved song cycle, setting sixteen poems by Heinrich Heine about unrequited love. The piano part is extraordinarily poetic, with postludes that continue the emotional narrative after the voice falls silent. "Im wunderschönen Monat Mai" opens with one of the most beautiful unresolved harmonies in all music.',
    editions: [
      { id: 'e-schum-dl-henle', publisher: 'Henle Verlag', editor: 'Kazuko Ozawa', year: 2005, description: 'Urtext in high and low keys.' },
      { id: 'e-schum-dl-peters', publisher: 'Peters', editor: 'Max Friedlaender', year: 1887, description: 'Classic performing edition.' }
    ],
    external_links: [
      { type: 'imslp', url: 'https://imslp.org/wiki/Dichterliebe,_Op.48_(Schumann,_Robert)', label: 'IMSLP — editions available' },
      { type: 'wikipedia', url: 'https://en.wikipedia.org/wiki/Dichterliebe', label: 'Wikipedia — Dichterliebe' }
    ],
  },

  // ═══════════════════════════════════
  // GUITAR
  // ═══════════════════════════════════
  {
    id: 'rodrigo-concierto-aranjuez',
    title: 'Concierto de Aranjuez',
    composer_name: 'Joaquín Rodrigo',
    catalog_number: null,
    instruments: ['Guitar'],
    era: '20th Century',
    form: 'Concerto',
    duration_minutes: 23,
    difficulty: 'professional',
    description: 'The most famous guitar concerto ever written and one of the most frequently performed concertos of the 20th century. The hauntingly beautiful Adagio second movement, with its dialogue between English horn and guitar, is one of the most recognized melodies in all classical music. Rodrigo, who was blind from age three, never played the guitar himself.',
    editions: [
      { id: 'e-rodrigo-ca-schott2', publisher: 'Schott', editor: 'Joaquín Rodrigo', year: 1959, description: 'Original authorized edition.' }
    ],
    external_links: [
      { type: 'youtube', url: 'https://www.youtube.com/watch?v=e9RS4biqyAc', label: 'Paco de Lucía Concierto Aranjuez - Adagio' },
      { type: 'wikipedia', url: 'https://en.wikipedia.org/wiki/Concierto_de_Aranjuez', label: 'Wikipedia — Concierto de Aranjuez' }
    ],
  },

  // ═══════════════════════════════════
  // ADDITIONAL WINDS
  // ═══════════════════════════════════
  {
    id: 'strauss-oboe-concerto',
    title: 'Oboe Concerto in D major',
    composer_name: 'Richard Strauss',
    catalog_number: null,
    instruments: ['Oboe'],
    era: 'Late Romantic',
    form: 'Concerto',
    duration_minutes: 25,
    difficulty: 'professional',
    description: 'Written in 1945 when Strauss was 81, inspired by hearing an American soldier play an oboe in post-war Bavaria. The work is a late masterpiece of lyrical beauty, looking back to the clarity of Mozart. The long-breathed melodies demand supreme breath control. The standard oboe concerto for professional auditions.',
    editions: [
      { id: 'e-strauss-oc-boosey', publisher: 'Boosey & Hawkes', editor: 'Richard Strauss', year: 1948, description: 'Original edition.' }
    ],
    external_links: [
      { type: 'wikipedia', url: 'https://en.wikipedia.org/wiki/Oboe_Concerto_(Strauss)', label: 'Wikipedia — Strauss Oboe Concerto' }
    ],
  },
  {
    id: 'mozart-horn-concerto-4',
    title: 'Horn Concerto No. 4 in E-flat major',
    composer_name: 'Wolfgang Amadeus Mozart',
    catalog_number: 'K. 495',
    instruments: ['Horn'],
    era: 'Classical',
    form: 'Concerto',
    duration_minutes: 16,
    difficulty: 'advanced',
    description: 'The last and most substantial of Mozart\'s four horn concertos, all written for his friend Joseph Leutgeb. The Rondo finale\'s hunting-call theme is one of Mozart\'s most infectious melodies. The work balances technical demands with lyrical beauty, making it essential repertoire for every horn player.',
    editions: [
      { id: 'e-mozart-hc4-baren', publisher: 'Bärenreiter', editor: 'John Humphries', year: 2003, description: 'New Mozart Edition with original text and editorial alternatives.' },
      { id: 'e-mozart-hc4-henle', publisher: 'Henle Verlag', editor: 'Henrik Wiese', year: 2006, description: 'Urtext for horn in F with piano reduction.' }
    ],
    external_links: [
      { type: 'imslp', url: 'https://imslp.org/wiki/Horn_Concerto_No.4,_K.495_(Mozart,_Wolfgang_Amadeus)', label: 'IMSLP — editions available' },
      { type: 'wikipedia', url: 'https://en.wikipedia.org/wiki/Horn_Concerto_No._4_(Mozart)', label: 'Wikipedia — Mozart Horn Concerto No. 4' }
    ],
  },
  {
    id: 'hindemith-bassoon-sonata',
    title: 'Sonata for Bassoon and Piano',
    composer_name: 'Paul Hindemith',
    catalog_number: null,
    instruments: ['Bassoon', 'Piano'],
    era: '20th Century',
    form: 'Sonata',
    duration_minutes: 12,
    difficulty: 'advanced',
    description: 'Part of Hindemith\'s project to write a sonata for every orchestral instrument. The bassoon sonata is one of the most successful, combining neoclassical clarity with Hindemith\'s distinctive harmony. The march-like second movement and lyrical slow movement showcase the bassoon\'s full range of expression. Standard audition and recital repertoire.',
    editions: [
      { id: 'e-hind-bsn-schott', publisher: 'Schott', editor: 'Paul Hindemith', year: 1938, description: 'Original edition by the composer.' }
    ],
    external_links: [
      { type: 'wikipedia', url: 'https://en.wikipedia.org/wiki/Paul_Hindemith', label: 'Wikipedia — Paul Hindemith' }
    ],
  }
    ];

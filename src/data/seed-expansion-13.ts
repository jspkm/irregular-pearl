import type { SeedPiece } from './seed';

export const expansionPieces13: SeedPiece[] = [

  // === ORCHESTRAL ===

  {
    id: 'vaughan-williams-fantasia-tallis',
    title: 'Fantasia on a Theme by Thomas Tallis',
    composer_name: 'Ralph Vaughan Williams',
    catalog_number: null,
    instruments: ['Orchestra'],
    era: 'Romantic',
    form: 'Fantasia',
    duration_minutes: 16,
    difficulty: 'professional',
    description: 'Vaughan Williams\'s Fantasia on a Theme by Thomas Tallis (1910, rev. 1913 and 1919) is the masterpiece that established the English orchestral renaissance of the 20th century. Scored for double string orchestra and a string quartet — a disposition that creates extraordinary spatial antiphony and an illusion of depth — it transforms a single Phrygian melody from Tallis\'s 1567 Psalter into an ocean of sound that moves between meditative calm and overwhelming radiance. The work is simultaneously archaic and modern: its modality and open harmonies reach back to Tudor polyphony while its long-breathed melodic paragraphs are entirely of the new century. Few orchestral works of any era produce such a complete sense of transcendence from purely string sonority.',
    editions: [
      {
        id: 'e-vwft-breitkopf',
        publisher: 'Breitkopf & Hartel',
        editor: 'Standard edition',
        year: 1921,
        description: 'Original publication of the revised version; the standard performing score.',
      },
      {
        id: 'e-vwft-oxford',
        publisher: 'Oxford University Press',
        editor: 'Study score edition',
        year: 1972,
        description: 'Study score from the primary Vaughan Williams publisher; includes programme notes.',
      },
    ],
    external_links: [
      { type: 'imslp', url: 'https://imslp.org/wiki/Fantasia_on_a_Theme_by_Thomas_Tallis_(Vaughan_Williams,_Ralph)', label: 'IMSLP -- Fantasia on a Theme by Thomas Tallis' },
      { type: 'wikipedia', url: 'https://en.wikipedia.org/wiki/Fantasia_on_a_Theme_by_Thomas_Tallis', label: 'Wikipedia -- Fantasia on a Theme by Thomas Tallis' },
    ],
  },

  {
    id: 'prokofiev-symphony-1',
    title: 'Symphony No. 1 in D major "Classical", Op. 25',
    composer_name: 'Sergei Prokofiev',
    catalog_number: 'Op. 25',
    instruments: ['Orchestra'],
    era: '20th Century',
    form: 'Symphony',
    duration_minutes: 16,
    difficulty: 'professional',
    description: 'Prokofiev\'s "Classical" Symphony (1916-17) is a gleaming neo-Classical gem written as a deliberate act of playful homage to Haydn -- but filtered through the composer\'s acerbic wit, unexpected harmonic sidesteps, and propulsive rhythmic energy. Composed away from the piano to strengthen his compositional ear, it is simultaneously a perfect evocation of 18th-century form and a distinctly modern work: the Gavotte third movement became one of Prokofiev\'s most beloved melodies (he reused it in Romeo and Juliet), and the finale\'s perpetuo moto has a machine-like energy no Classical-era composer could have imagined. At sixteen minutes it is one of the most perfectly compact symphonies ever written.',
    editions: [
      {
        id: 'e-prokofiev-sym1-boosey',
        publisher: 'Boosey & Hawkes',
        editor: 'Standard edition',
        year: 1926,
        description: 'The standard Western performing score; the reference edition for major orchestras.',
      },
      {
        id: 'e-prokofiev-sym1-muzgiz',
        publisher: 'Muzgiz',
        editor: 'Soviet edition',
        year: 1951,
        description: 'Soviet State Music Publishers edition; basis for Eastern European performing materials.',
      },
      {
        id: 'e-prokofiev-sym1-dover',
        publisher: 'Dover Publications',
        editor: 'Reprint',
        year: 1975,
        description: 'Affordable full score reprint for study.',
      },
    ],
    external_links: [
      { type: 'wikipedia', url: 'https://en.wikipedia.org/wiki/Symphony_No._1_(Prokofiev)', label: 'Wikipedia -- Symphony No. 1 (Prokofiev)' },
      { type: 'soundcloud', url: 'https://soundcloud.com/mariinsky/prokofiev-symphony-1-classical', label: 'Mariinsky Orchestra -- live broadcast recording' },
    ],
    movements: [
      { name: 'I. Allegro' },
      { name: 'II. Larghetto' },
      { name: 'III. Gavotte: Non troppo allegro' },
      { name: 'IV. Finale: Molto vivace' },
    ],
  },

  {
    id: 'bruckner-symphony-7',
    title: 'Symphony No. 7 in E major',
    composer_name: 'Anton Bruckner',
    catalog_number: null,
    instruments: ['Orchestra'],
    era: 'Romantic',
    form: 'Symphony',
    duration_minutes: 65,
    difficulty: 'professional',
    description: 'Bruckner\'s Seventh Symphony (1881-83) was the work that finally won him international recognition after decades of neglect, and it remains the most beloved and accessible of his mature symphonies. The opening movement introduces one of the most majestic main themes in all symphonic literature; but the heart of the work is the Adagio second movement, written as Bruckner sensed Wagner was dying and completed with a funeral peroration for four Wagner tubas that he called the greatest thing he had ever written. The triumphant Scherzo and genial Finale complete a journey from aspiration to celebration that is characteristically Brucknerian in its vast architecture and cosmic serenity.',
    editions: [
      {
        id: 'e-bruckner-sym7-haas',
        publisher: 'Musikwissenschaftlicher Verlag',
        editor: 'Robert Haas',
        year: 1944,
        description: 'Haas edition; for decades the standard performing score, though now critically questioned in some details.',
      },
      {
        id: 'e-bruckner-sym7-nowak',
        publisher: 'Musikwissenschaftlicher Verlag',
        editor: 'Leopold Nowak',
        year: 1954,
        description: 'Nowak critical edition; based on autograph and first edition. The current scholarly standard.',
      },
    ],
    external_links: [
      { type: 'imslp', url: 'https://imslp.org/wiki/Symphony_No.7_in_E_major_(Bruckner,_Anton)', label: 'IMSLP -- Symphony No. 7 in E major' },
      { type: 'wikipedia', url: 'https://en.wikipedia.org/wiki/Symphony_No._7_(Bruckner)', label: 'Wikipedia -- Symphony No. 7 (Bruckner)' },
      { type: 'youtube', url: 'https://www.youtube.com/watch?v=rCvOXwgOvOo', label: 'Herbert von Karajan / Vienna Philharmonic -- DG (1989)' },
      { type: 'vimeo', url: 'https://vimeo.com/401823048', label: 'Christoph Eschenbach / Orchestre de Paris -- live' },
    ],
    movements: [
      { name: 'I. Allegro moderato' },
      { name: 'II. Adagio: Sehr feierlich und sehr langsam' },
      { name: 'III. Scherzo: Sehr schnell' },
      { name: 'IV. Finale: Bewegt, doch nicht schnell' },
    ],
  },

  {
    id: 'schumann-symphony-1',
    title: 'Symphony No. 1 in B-flat major "Spring", Op. 38',
    composer_name: 'Robert Schumann',
    catalog_number: 'Op. 38',
    instruments: ['Orchestra'],
    era: 'Romantic',
    form: 'Symphony',
    duration_minutes: 32,
    difficulty: 'professional',
    description: 'Schumann\'s First Symphony (1841) was composed in an extraordinary burst of energy during his honeymoon year with Clara, and the exuberant joy of new love permeates every movement. The opening fanfare horn call, the singing first theme in the violins, and the finale\'s skipping dactylic rhythm all breathe the fresh air that Schumann associated with Adolf Bottger\'s spring poem. Despite later critics\' reservations about his orchestration, the work has a direct emotional authenticity and a sense of structural spring-like growth that makes it deeply lovable. Schumann conducted the premiere himself with the Leipzig Gewandhaus Orchestra in March 1841 to immediate acclaim.',
    editions: [
      {
        id: 'e-schumann-sym1-breitkopf',
        publisher: 'Breitkopf & Hartel',
        editor: 'Clara Schumann supervised',
        year: 1882,
        description: 'Part of the first complete Schumann edition; the historical standard.',
      },
      {
        id: 'e-schumann-sym1-barenreiter',
        publisher: 'Barenreiter',
        editor: 'Linda Correll Roesner',
        year: 2003,
        description: 'New critical Schumann edition (NSA) based on autograph. Modern scholarly standard with performance notes.',
      },
    ],
    external_links: [
      { type: 'wikipedia', url: 'https://en.wikipedia.org/wiki/Symphony_No._1_(Schumann)', label: 'Wikipedia -- Symphony No. 1 (Schumann)' },
      { type: 'soundcloud', url: 'https://soundcloud.com/hr-sinfonieorchester/schumann-symphony-1-spring', label: 'HR-Sinfonieorchester Frankfurt -- broadcast recording' },
    ],
    movements: [
      { name: 'I. Andante un poco maestoso -- Allegro molto vivace' },
      { name: 'II. Larghetto' },
      { name: 'III. Scherzo: Molto vivace' },
      { name: 'IV. Allegro animato e grazioso' },
    ],
  },

  {
    id: 'mendelssohn-symphony-3',
    title: 'Symphony No. 3 in A minor "Scottish", Op. 56',
    composer_name: 'Felix Mendelssohn',
    catalog_number: 'Op. 56',
    instruments: ['Orchestra'],
    era: 'Romantic',
    form: 'Symphony',
    duration_minutes: 38,
    difficulty: 'professional',
    description: 'The "Scottish" Symphony (begun 1829, completed 1842) was inspired by Mendelssohn\'s visit to the ruined Chapel of Holyroodhouse in Edinburgh, where he noted a musical theme that became the introduction\'s brooding opening. It is the most structurally unified of his symphonies: all four movements are played without a full break, and the thematic material is closely interconnected across the work. The stormy first movement, the fleet Scherzo (one of Mendelssohn\'s greatest inventions), the serene slow movement, and the martial finale that ends in a radiant coda are each individually perfect; together they form his most satisfying large-scale orchestral canvas. Mendelssohn dedicated the work to Queen Victoria.',
    editions: [
      {
        id: 'e-mendelssohn-sym3-breitkopf',
        publisher: 'Breitkopf & Hartel',
        editor: 'Julius Rietz',
        year: 1874,
        description: 'First complete Mendelssohn edition; historical standard.',
      },
      {
        id: 'e-mendelssohn-sym3-barenreiter',
        publisher: 'Barenreiter',
        editor: 'Christian Rudolf Riedel',
        year: 1997,
        description: 'New Mendelssohn edition (NMA) critical score based on autograph. Current scholarly standard.',
      },
    ],
    external_links: [
      { type: 'wikipedia', url: 'https://en.wikipedia.org/wiki/Symphony_No._3_(Mendelssohn)', label: 'Wikipedia -- Symphony No. 3 (Mendelssohn)' },
      { type: 'vimeo', url: 'https://vimeo.com/335820977', label: 'Robin Ticciati / Scottish Chamber Orchestra -- live' },
    ],
    movements: [
      { name: 'I. Andante con moto -- Allegro un poco agitato' },
      { name: 'II. Vivace non troppo' },
      { name: 'III. Adagio' },
      { name: 'IV. Allegro vivacissimo -- Allegro maestoso assai' },
    ],
  },


  // === CHAMBER MUSIC ===

  {
    id: 'janacek-string-quartet-2',
    title: 'String Quartet No. 2 "Kreutzer Sonata"',
    composer_name: 'Leos Janacek',
    catalog_number: null,
    instruments: ['Violin', 'Violin', 'Viola', 'Cello'],
    era: '20th Century',
    form: 'String Quartet',
    duration_minutes: 22,
    difficulty: 'professional',
    description: 'Janacek\'s Second String Quartet (1928) takes its name from Tolstoy\'s novella inspired by the Beethoven sonata, but its biographical subtext is Janacek\'s own passionate late-life obsession with the married Kamila Stosslova. The quartet is his most emotionally extreme chamber work: violent outbursts and whimpering fragility alternate within phrases; the viola and cello often sustain against stinging violin attacks that seem to embody jealousy made audible. Written by a 74-year-old composer in a state of emotional crisis, it belongs with the greatest love testaments in all chamber music. Its five compressed movements require extraordinary technical command and emotional commitment to realize fully.',
    editions: [
      {
        id: 'e-janacek-sq2-supraphon',
        publisher: 'Supraphon',
        editor: 'Frantisek Maly',
        year: 1948,
        description: 'The original Czech publication; the primary performing edition.',
      },
      {
        id: 'e-janacek-sq2-universal',
        publisher: 'Universal Edition',
        editor: 'Standard edition',
        year: 1975,
        description: 'Western performing edition widely used by European and American quartets.',
      },
    ],
    external_links: [
      { type: 'wikipedia', url: 'https://en.wikipedia.org/wiki/String_Quartet_No._2_(Jan%C3%A1%C4%8Dek)', label: 'Wikipedia -- String Quartet No. 2 (Janacek)' },
      { type: 'soundcloud', url: 'https://soundcloud.com/belcea-quartet/janacek-string-quartet-2', label: 'Belcea Quartet -- live recital recording' },
    ],
    movements: [
      { name: 'I. Andante -- Con moto' },
      { name: 'II. Con moto' },
      { name: 'III. Con moto -- Vivo -- Andante' },
      { name: 'IV. Con moto (Adagio)' },
      { name: 'V. Andante -- In moto' },
    ],
  },

  {
    id: 'bartok-string-quartet-5',
    title: 'String Quartet No. 5, Sz. 102',
    composer_name: 'Bela Bartok',
    catalog_number: 'Sz. 102',
    instruments: ['Violin', 'Violin', 'Viola', 'Cello'],
    era: '20th Century',
    form: 'String Quartet',
    duration_minutes: 28,
    difficulty: 'professional',
    description: 'Bartok\'s Fifth String Quartet (1934) occupies the center of his six-quartet cycle and represents the fullest flowering of his mature style. Its five-movement arch form is perfectly symmetrical: the outer Allegros bracket a central Andante, with two scherzos on either side that carry his characteristic Bulgarian rhythms and night music atmospheres. The work demonstrates Bartok\'s complete mastery of chromatic counterpoint, complex polyrhythm, and extended string techniques, including pizzicato glissandos and sul ponticello effects that had rarely appeared in chamber music. Commissioned by the Elizabeth Sprague Coolidge Foundation and premiered by the Kolisch Quartet in 1935, it demands four players of the highest caliber.',
    editions: [
      {
        id: 'e-bartok-sq5-boosey',
        publisher: 'Boosey & Hawkes',
        editor: 'Bartok estate',
        year: 1936,
        description: 'Original publication; the authoritative performing edition used internationally.',
      },
      {
        id: 'e-bartok-sq5-editio-musica',
        publisher: 'Editio Musica Budapest',
        editor: 'Critical edition',
        year: 1956,
        description: 'Hungarian critical edition with revised parts; important for the composer\'s exact intentions.',
      },
    ],
    external_links: [
      { type: 'imslp', url: 'https://imslp.org/wiki/String_Quartet_No.5,_Sz.102_(Bart%C3%B3k,_B%C3%A9la)', label: 'IMSLP -- String Quartet No. 5, Sz. 102' },
      { type: 'wikipedia', url: 'https://en.wikipedia.org/wiki/String_Quartet_No._5_(Bart%C3%B3k)', label: 'Wikipedia -- String Quartet No. 5 (Bartok)' },
    ],
    movements: [
      { name: 'I. Allegro' },
      { name: 'II. Adagio molto' },
      { name: 'III. Scherzo (alla bulgarese): Alla breve' },
      { name: 'IV. Andante' },
      { name: 'V. Finale: Allegro vivace' },
    ],
  },

  {
    id: 'schubert-string-quartet-d887',
    title: 'String Quartet in G major, D. 887',
    composer_name: 'Franz Schubert',
    catalog_number: 'D. 887',
    instruments: ['Violin', 'Violin', 'Viola', 'Cello'],
    era: 'Romantic',
    form: 'String Quartet',
    duration_minutes: 50,
    difficulty: 'professional',
    description: 'The G major Quartet (1826) is Schubert\'s final and greatest string quartet and, by any measure, one of the supreme achievements of the chamber music repertoire. At over fifty minutes it is nearly twice the length of any earlier quartet, and its vast emotional scope -- from the tremolando opening that suggests both earthly trembling and celestial radiance to the exhausting finale -- seems to contain an entire lifetime. Unlike the Death and the Maiden quartet, this work resists any single programmatic interpretation; it is pure abstract music of terrifying emotional truthfulness. The technical demands are extreme, especially the sustained pianissimo tremolando passages that can last for several minutes.',
    editions: [
      {
        id: 'e-schubert-sqd887-henle',
        publisher: 'Henle Verlag',
        editor: 'Arnold Feil',
        year: 1971,
        description: 'Critical Urtext based on autograph. The scholarly standard.',
      },
      {
        id: 'e-schubert-sqd887-barenreiter',
        publisher: 'Barenreiter',
        editor: 'Werner Aderhold',
        year: 2004,
        description: 'New Schubert edition with source apparatus and critical commentary.',
      },
    ],
    external_links: [
      { type: 'wikipedia', url: 'https://en.wikipedia.org/wiki/String_Quartet_No._15_(Schubert)', label: 'Wikipedia -- String Quartet No. 15 (Schubert)' },
    ],
    movements: [
      { name: 'I. Allegro molto moderato' },
      { name: 'II. Andante un poco moto' },
      { name: 'III. Scherzo: Allegro vivace' },
      { name: 'IV. Allegro assai' },
    ],
  },

  {
    id: 'mozart-string-quintet-k516',
    title: 'String Quintet in G minor, K. 516',
    composer_name: 'Wolfgang Amadeus Mozart',
    catalog_number: 'K. 516',
    instruments: ['Violin', 'Violin', 'Viola', 'Viola', 'Cello'],
    era: 'Classical',
    form: 'Quintet',
    duration_minutes: 32,
    difficulty: 'advanced',
    description: 'The String Quintet in G minor (1787) stands alongside the great G minor Symphony as one of Mozart\'s most impassioned minor-key statements. Written for two violins, two violas, and cello -- Mozart\'s preferred quintet scoring, which allows the extra viola to enrich the middle register -- it combines the pathos of the G minor key with extraordinary melodic invention. The first movement\'s questioning main theme unfolds with an urgency that seems to reach beyond the Classical period, while the serene G-major Minuet and the rondo finale -- which begins ominously in G minor before dissolving into G major -- create a journey from darkness toward acceptance. The first viola writing is among the most demanding and rewarding in the entire chamber repertoire.',
    editions: [
      {
        id: 'e-mozart-k516-henle',
        publisher: 'Henle Verlag',
        editor: 'Ernst Hess and Gernot Gruber',
        year: 1967,
        description: 'Urtext edition based on Mozart\'s autograph. The scholarly standard for performance and study.',
      },
      {
        id: 'e-mozart-k516-barenreiter',
        publisher: 'Barenreiter',
        editor: 'Ernst Hess',
        year: 1967,
        description: 'New Mozart Edition (NMA) critical edition with full source apparatus.',
      },
    ],
    external_links: [
      { type: 'imslp', url: 'https://imslp.org/wiki/String_Quintet_No.4_in_G_minor,_K.516_(Mozart,_Wolfgang_Amadeus)', label: 'IMSLP -- String Quintet K. 516' },
      { type: 'wikipedia', url: 'https://en.wikipedia.org/wiki/String_Quintet_No._4_(Mozart)', label: 'Wikipedia -- String Quintet No. 4 (Mozart)' },
      { type: 'soundcloud', url: 'https://soundcloud.com/conservatoireparis/mozart-quintet-g-minor-k516', label: 'Paris Conservatoire -- live recital recording' },
    ],
    movements: [
      { name: 'I. Allegro' },
      { name: 'II. Menuetto: Allegretto' },
      { name: 'III. Adagio ma non troppo' },
      { name: 'IV. Adagio -- Allegro' },
    ],
  },

  {
    id: 'brahms-clarinet-quintet-op115',
    title: 'Clarinet Quintet in B minor, Op. 115',
    composer_name: 'Johannes Brahms',
    catalog_number: 'Op. 115',
    instruments: ['Clarinet', 'Violin', 'Violin', 'Viola', 'Cello'],
    era: 'Romantic',
    form: 'Quintet',
    duration_minutes: 38,
    difficulty: 'professional',
    description: 'The Clarinet Quintet (1891) was inspired by the legendary clarinettist Richard Muhlfeld, whom Brahms encountered in Meiningen and whose tone he described as like the voice of a beautiful woman. It is Brahms\'s most autumnal and elegiac chamber work, saturated with the valedictory warmth of late style, and widely considered one of the supreme chamber music masterpieces. The opening movement unfolds with long melodic lines that the clarinet and strings share in tender dialogue; the slow movement contains one of Brahms\'s most heartbreaking melodies; and the finale returns to the opening material in a cyclical structure that suggests a life coming full circle. The clarinet writing demands extraordinary control of tone, vibrato, and the instrument\'s full dynamic range.',
    editions: [
      {
        id: 'e-brahms-cq115-henle',
        publisher: 'Henle Verlag',
        editor: 'Egon Voss',
        year: 1987,
        description: 'Critical Urtext based on the autograph and first edition. The standard scholarly text.',
      },
      {
        id: 'e-brahms-cq115-simrock',
        publisher: 'Simrock',
        editor: 'Original first edition',
        year: 1892,
        description: 'The original published score from Brahms\'s own publisher. Historically significant.',
      },
    ],
    external_links: [
      { type: 'imslp', url: 'https://imslp.org/wiki/Clarinet_Quintet,_Op.115_(Brahms,_Johannes)', label: 'IMSLP -- Clarinet Quintet, Op. 115' },
      { type: 'wikipedia', url: 'https://en.wikipedia.org/wiki/Clarinet_Quintet_(Brahms)', label: 'Wikipedia -- Clarinet Quintet (Brahms)' },
      { type: 'vimeo', url: 'https://vimeo.com/288453901', label: 'Sharon Kam / Jerusalem Quartet -- live recital' },
    ],
    movements: [
      { name: 'I. Allegro' },
      { name: 'II. Adagio' },
      { name: 'III. Andantino -- Presto non assai, ma con sentimento' },
      { name: 'IV. Con moto' },
    ],
  },

  {
    id: 'dvorak-american-quartet',
    title: 'String Quartet No. 12 in F major "American", Op. 96',
    composer_name: 'Antonin Dvorak',
    catalog_number: 'Op. 96',
    instruments: ['Violin', 'Violin', 'Viola', 'Cello'],
    era: 'Romantic',
    form: 'String Quartet',
    duration_minutes: 26,
    difficulty: 'advanced',
    description: 'The "American" Quartet (1893) was composed in just three days at the Czech-American colony of Spillville, Iowa, where Dvorak was recovering from the creative exhaustion of finishing the New World Symphony. The work breathes American folk spirit without quoting specific tunes -- pentatonic themes, syncopated rhythms, and the spirit of African-American song pervade the writing -- while remaining unmistakably Czech in its lyrical warmth and formal clarity. The famous opening cello melody in F major is one of the most recognizable themes in all chamber music; the luminous slow movement with its bird-call effects and the scherzo with its lively cross-rhythms cement the quartet\'s popularity. It remains the most frequently performed quartet by any non-German composer.',
    editions: [
      {
        id: 'e-dvorak-aq-henle',
        publisher: 'Henle Verlag',
        editor: 'Ludvik Kubela',
        year: 1975,
        description: 'Critical Urtext based on the autograph score.',
      },
      {
        id: 'e-dvorak-aq-eulenburg',
        publisher: 'Eulenburg',
        editor: 'Study score',
        year: 1955,
        description: 'Compact study score for analysis; widely available.',
      },
    ],
    external_links: [
      { type: 'soundcloud', url: 'https://soundcloud.com/parker-quartet/dvorak-american-quartet-op96', label: 'Parker Quartet -- Boston Conservatory live recital' },
    ],
    movements: [
      { name: 'I. Allegro ma non troppo' },
      { name: 'II. Lento' },
      { name: 'III. Molto vivace' },
      { name: 'IV. Finale: Vivace ma non troppo' },
    ],
  },


  // === ORGAN ===

  {
    id: 'brahms-organ-preludes-op122',
    title: 'Eleven Chorale Preludes, Op. 122',
    composer_name: 'Johannes Brahms',
    catalog_number: 'Op. 122',
    instruments: ['Organ'],
    era: 'Romantic',
    form: 'Chorale Preludes',
    duration_minutes: 30,
    difficulty: 'advanced',
    description: 'Brahms\'s Eleven Chorale Preludes (1896) were among the last works he completed before his death in 1897, and constitute his farewell to composition in the most intimate possible form. Based on Lutheran chorale melodies associated with sin, grace, and death -- including Herzlich tut mich verlangen (the "Passion Chorale") and O Welt, ich muss dich lassen -- they are profoundly introspective, written not for virtuosity but for solitary meditation. The eleventh prelude, O Welt ich muss dich lassen, is especially celebrated: two settings frame the collection like a grave and luminous benediction. No other Romantic composer touched the organ with such reserve and emotional depth; these pieces require a refined sense of registration, tempo rubato, and voicing that draws on the long German chorale prelude tradition from Buxtehude through Bach.',
    editions: [
      {
        id: 'e-brahms-op122-breitkopf',
        publisher: 'Breitkopf & Hartel',
        editor: 'Original edition',
        year: 1902,
        description: 'The posthumous original publication; the authoritative text for this work.',
      },
      {
        id: 'e-brahms-op122-peters',
        publisher: 'Edition Peters',
        editor: 'Karl Matthaei',
        year: 1930,
        description: 'Peters performing edition with additional registration suggestions.',
      },
    ],
    external_links: [
      { type: 'imslp', url: 'https://imslp.org/wiki/11_Chorale_Preludes,_Op.122_(Brahms,_Johannes)', label: 'IMSLP -- Eleven Chorale Preludes, Op. 122' },
      { type: 'wikipedia', url: 'https://en.wikipedia.org/wiki/Eleven_Chorale_Preludes_(Brahms)', label: 'Wikipedia -- Eleven Chorale Preludes (Brahms)' },
      { type: 'soundcloud', url: 'https://soundcloud.com/rcco-organ/brahms-chorale-preludes-op122', label: 'Royal Canadian College of Organists -- recital recording' },
    ],
  },

  {
    id: 'buxtehude-prelude-dm-buxwv140',
    title: 'Praeludium in D minor, BuxWV 140',
    composer_name: 'Dietrich Buxtehude',
    catalog_number: 'BuxWV 140',
    instruments: ['Organ'],
    era: 'Baroque',
    form: 'Prelude and Fugue',
    duration_minutes: 8,
    difficulty: 'advanced',
    description: 'Buxtehude\'s Praeludium in D minor (BuxWV 140) is one of the supreme examples of the north German Baroque organ prelude, a form Buxtehude perfected and which directly influenced the young Johann Sebastian Bach, who famously walked from Arnstadt to Lubeck to hear Buxtehude play. The work alternates freely improvisatory toccata sections with rigorous fugal passages, creating a form that juxtaposes rhetorical fantasy with strict counterpoint. The opening fanfare, the chromatic fugue subject, and the closing Gigue-fugue combine to make a work of extraordinary expressive range. It requires mastery of north German Baroque registration, manual changes, and pedal technique.',
    editions: [
      {
        id: 'e-buxtehude-buxwv140-hansen',
        publisher: 'Wilhelm Hansen',
        editor: 'Josef Hedar',
        year: 1952,
        description: 'Modern scholarly edition based on primary manuscript sources. Standard performing text.',
      },
      {
        id: 'e-buxtehude-buxwv140-breitkopf',
        publisher: 'Breitkopf & Hartel',
        editor: 'Klaus Beckmann',
        year: 1998,
        description: 'New critical edition with extensive commentary on registration and ornamentation practice.',
      },
    ],
    external_links: [
      { type: 'wikipedia', url: 'https://en.wikipedia.org/wiki/Dietrich_Buxtehude', label: 'Wikipedia -- Dietrich Buxtehude' },
      { type: 'soundcloud', url: 'https://soundcloud.com/organ-heritage/buxtehude-praeludium-buxwv140', label: 'Lubeck Marienkirche -- historic organ reconstruction recording' },
    ],
  },

  {
    id: 'dupre-symphonie-passion',
    title: 'Symphonie-Passion, Op. 23',
    composer_name: 'Marcel Dupre',
    catalog_number: 'Op. 23',
    instruments: ['Organ'],
    era: '20th Century',
    form: 'Symphony for Organ',
    duration_minutes: 35,
    difficulty: 'professional',
    description: 'Marcel Dupre\'s Symphonie-Passion (1924) represents the summit of the French symphonic organ tradition, composed for and first improvised at the Wanamaker Organ in Philadelphia before being written down. In four movements corresponding to the birth, ministry, crucifixion, and resurrection of Christ, Dupre builds a vast tonal architecture incorporating Gregorian themes -- including the Easter Sequence and the Veni Creator -- transformed through a richly Romantic harmonic idiom touched by Impressionism. The final movement, Resurrection, reaches an overwhelming climax that remains one of the most spectacular moments in the organ repertoire. Technically the work demands fluency in multi-layer polyphony, complex pedal passages, and an organ of symphonic scope.',
    editions: [
      {
        id: 'e-dupre-sp-leduc',
        publisher: 'Alphonse Leduc',
        editor: 'Original edition',
        year: 1925,
        description: 'The original publication of the written-down version; the standard performing text.',
      },
      {
        id: 'e-dupre-sp-leduc-rev',
        publisher: 'Alphonse Leduc',
        editor: 'Revised edition',
        year: 1972,
        description: 'Revised printing with corrected errata; the current standard edition.',
      },
    ],
    external_links: [
      { type: 'imslp', url: 'https://imslp.org/wiki/Symphonie-Passion,_Op.23_(Dupr%C3%A9,_Marcel)', label: 'IMSLP -- Symphonie-Passion, Op. 23' },
      { type: 'wikipedia', url: 'https://en.wikipedia.org/wiki/Marcel_Dupr%C3%A9', label: 'Wikipedia -- Marcel Dupre' },
      { type: 'soundcloud', url: 'https://soundcloud.com/orgue-saint-ouen/dupre-symphonie-passion-op23', label: 'Live performance -- Cavaille-Coll organ, Saint-Ouen, Rouen' },
    ],
    movements: [
      { name: 'I. Le Monde dans l\'attente du Sauveur' },
      { name: 'II. Nativite' },
      { name: 'III. Crucifixion' },
      { name: 'IV. Resurrection' },
    ],
  },

  {
    id: 'messiaen-livre-saint-sacrement',
    title: 'Livre du Saint-Sacrement',
    composer_name: 'Olivier Messiaen',
    catalog_number: null,
    instruments: ['Organ'],
    era: '20th Century',
    form: 'Suite for Organ',
    duration_minutes: 110,
    difficulty: 'professional',
    description: 'Messiaen\'s Livre du Saint-Sacrement (1984) is his final and most monumental organ work, a vast meditation in eighteen movements on the mystery of the Eucharist that took seven years to complete. It synthesizes every element of his mature style: complex modes of limited transposition, Hindu rhythmic techniques, bird-song transcriptions from around the world, and a harmonic language that is simultaneously intellectually rigorous and deeply devotional. Movements range from the terrifying -- Demeurer dans l\'Amour, with its brutal dissonances representing divine wrath -- to the transcendentally serene. It demands a full concert commitment of nearly two hours and is among the most technically and spiritually demanding works in the organ repertoire.',
    editions: [
      {
        id: 'e-messiaen-livre-leduc',
        publisher: 'Alphonse Leduc',
        editor: 'Messiaen authorized edition',
        year: 1984,
        description: 'The original publication; the authoritative performing text.',
      },
      {
        id: 'e-messiaen-livre-leduc-rev',
        publisher: 'Alphonse Leduc',
        editor: 'Second printing with corrections',
        year: 1986,
        description: 'Corrected edition incorporating final revisions.',
      },
    ],
    external_links: [
      { type: 'wikipedia', url: 'https://en.wikipedia.org/wiki/Livre_du_Saint-Sacrement', label: 'Wikipedia -- Livre du Saint-Sacrement' },
      { type: 'vimeo', url: 'https://vimeo.com/347291849', label: 'Naji Hakim -- Sainte-Trinite, Paris (Messiaen\'s own organ)' },
    ],
  },


  // === HARP ===

  {
    id: 'ginastera-harp-concerto',
    title: 'Harp Concerto, Op. 25',
    composer_name: 'Alberto Ginastera',
    catalog_number: 'Op. 25',
    instruments: ['Harp', 'Orchestra'],
    era: '20th Century',
    form: 'Concerto',
    duration_minutes: 25,
    difficulty: 'professional',
    description: 'Ginastera\'s Harp Concerto (1956-65, premiered 1965) is the most significant harp concerto written since Saint-Saens, and the greatest contribution to the harp\'s solo orchestral repertoire in the 20th century. Commissioned by Edna Phillips, the former principal harp of the Philadelphia Orchestra, the work fuses Argentine folk idioms -- malambo rhythms, modal pentatonic melodies -- with Bartokian percussive techniques and Ginastera\'s mature atonal language. The soloist\'s part extends the harp\'s technique to its extreme limits, demanding strummed chords, harmonics, bisbigliando, and precise rhythmic interactions with the chamber orchestra. The middle movement is a transcendently still Molto moderato that stands as one of Ginastera\'s most intimate inspirations.',
    editions: [
      {
        id: 'e-ginastera-hc-boosey',
        publisher: 'Boosey & Hawkes',
        editor: 'Standard international edition',
        year: 1978,
        description: 'Western performing edition used by major orchestras and soloists.',
      },
      {
        id: 'e-ginastera-hc-barry',
        publisher: 'Barry',
        editor: 'Buenos Aires original edition',
        year: 1965,
        description: 'The original Argentine publication; the authoritative text for performance.',
      },
    ],
    external_links: [
      { type: 'wikipedia', url: 'https://en.wikipedia.org/wiki/Harp_Concerto_(Ginastera)', label: 'Wikipedia -- Harp Concerto (Ginastera)' },
      { type: 'soundcloud', url: 'https://soundcloud.com/juilliard/ginastera-harp-concerto-juilliard', label: 'Juilliard School -- student concerto competition performance' },
    ],
    movements: [
      { name: 'I. Allegro giusto' },
      { name: 'II. Molto moderato' },
      { name: 'III. Liberamente capriccioso -- Vivace' },
    ],
  },

  {
    id: 'britten-suite-for-harp',
    title: 'Suite for Harp, Op. 83',
    composer_name: 'Benjamin Britten',
    catalog_number: 'Op. 83',
    instruments: ['Harp'],
    era: '20th Century',
    form: 'Suite',
    duration_minutes: 18,
    difficulty: 'professional',
    description: 'Britten\'s Suite for Harp (1969) was written for Osian Ellis, the Welsh harpist who became one of Britten\'s closest collaborators and performed at Aldeburgh Festival for many years. The five-movement work is the most important 20th-century solo suite for the instrument: wide-ranging in style, demanding in technique, and deeply characteristic of Britten\'s late manner. The opening Overture, the modal Toccata, the elegant Nocturne with its delicate harmonics, the vigorous Fugue, and the closing Hymn display both the harp\'s range and Britten\'s complete understanding of its idiomatic possibilities. The work inhabits a neo-Baroque formal clarity combined with Britten\'s own harmonic ambiguity.',
    editions: [
      {
        id: 'e-britten-harp-faber',
        publisher: 'Faber Music',
        editor: 'Original edition',
        year: 1970,
        description: 'The original publication from Britten\'s primary publisher; the authoritative performing text.',
      },
      {
        id: 'e-britten-harp-faber-rev',
        publisher: 'Faber Music',
        editor: 'Revised printing',
        year: 1985,
        description: 'Corrected reprint with updated fingerings from Osian Ellis.',
      },
    ],
    external_links: [
      { type: 'soundcloud', url: 'https://soundcloud.com/rncm-harp/britten-suite-for-harp-op83', label: 'RNCM Harp -- student competition recording' },
    ],
    movements: [
      { name: 'I. Overture: Maestoso -- Allegretto -- Maestoso' },
      { name: 'II. Toccata: Presto' },
      { name: 'III. Nocturne: Andante lento' },
      { name: 'IV. Fugue: Moderato' },
      { name: 'V. Hymn: Molto lento e tranquillo' },
    ],
  },

  {
    id: 'tailleferre-harp-concerto',
    title: 'Harp Concertino',
    composer_name: 'Germaine Tailleferre',
    catalog_number: null,
    instruments: ['Harp', 'Orchestra'],
    era: '20th Century',
    form: 'Concertino',
    duration_minutes: 14,
    difficulty: 'advanced',
    description: 'Germaine Tailleferre\'s Harp Concertino (1927) is a sparkling neo-Classical gem by the only woman member of Les Six, the group of French composers -- with Milhaud, Poulenc, Honegger, Auric, and Durey -- who dominated French music in the 1920s. Written in three compact movements, the work combines Tailleferre\'s characteristic melodic wit and rhythmic elegance with idiomatic harp writing that honors both Ravel\'s color and a distinctly gallic sense of proportion. The outer movements are vivacious and transparent; the central Andante has a wistful, bittersweet character that reveals the deeper emotional range beneath the surface brilliance. It is one of the most charming harp concertos in the classical repertoire.',
    editions: [
      {
        id: 'e-tailleferre-hc-durand',
        publisher: 'Durand',
        editor: 'Original edition',
        year: 1928,
        description: 'The original publication from the leading French music publisher; the performing text.',
      },
      {
        id: 'e-tailleferre-hc-salabert',
        publisher: 'Editions Salabert',
        editor: 'Revised edition',
        year: 1975,
        description: 'Standard reprint edition used by orchestras and soloists.',
      },
    ],
    external_links: [
      { type: 'imslp', url: 'https://imslp.org/wiki/Concertino_for_Harp_and_Orchestra_(Tailleferre,_Germaine)', label: 'IMSLP -- Harp Concertino (Tailleferre)' },
      { type: 'wikipedia', url: 'https://en.wikipedia.org/wiki/Germaine_Tailleferre', label: 'Wikipedia -- Germaine Tailleferre' },
      { type: 'soundcloud', url: 'https://soundcloud.com/cnsm-paris/tailleferre-concertino-harp', label: 'CNSM Paris -- student concerto recital' },
    ],
    movements: [
      { name: 'I. Allegro moderato' },
      { name: 'II. Andante' },
      { name: 'III. Vif' },
    ],
  },


  // === PERCUSSION ===

  {
    id: 'xenakis-rebonds',
    title: 'Rebonds for solo percussion',
    composer_name: 'Iannis Xenakis',
    catalog_number: null,
    instruments: ['Percussion'],
    era: '20th Century',
    form: 'Solo Percussion',
    duration_minutes: 10,
    difficulty: 'professional',
    description: 'Xenakis\'s Rebonds (1987-89) consists of two unaccompanied percussion solos -- Rebonds A and Rebonds B -- that may be performed separately or together in either order. The work deploys a single player on a battery of drums and woodblocks, exploring the mathematical and stochastic principles that governed much of Xenakis\'s compositional output: irregular rhythmic groupings, densities that build to explosive climaxes, and sudden silences that heighten the percussive attack. Rebonds is widely regarded as the most important solo percussion work of the late 20th century, requiring not only technical brilliance but a deep understanding of Xenakis\'s spatial and rhythmic thinking. It has become a standard work at international percussion competitions, particularly the ARD.',
    editions: [
      {
        id: 'e-xenakis-rebonds-salabert',
        publisher: 'Editions Salabert',
        editor: 'Original edition',
        year: 1989,
        description: 'The authoritative performing edition from Xenakis\'s primary publisher.',
      },
      {
        id: 'e-xenakis-rebonds-salabert-rev',
        publisher: 'Editions Salabert',
        editor: 'Revised reprint',
        year: 1998,
        description: 'Corrected second printing with updated notation notes.',
      },
    ],
    external_links: [
      { type: 'wikipedia', url: 'https://en.wikipedia.org/wiki/Iannis_Xenakis', label: 'Wikipedia -- Iannis Xenakis' },
      { type: 'soundcloud', url: 'https://soundcloud.com/ard-competition/xenakis-rebonds-ard-percussion', label: 'ARD Competition finalist -- Munich 2017' },
    ],
  },

  {
    id: 'psathas-view-from-olympus',
    title: 'View from Olympus',
    composer_name: 'John Psathas',
    catalog_number: null,
    instruments: ['Percussion'],
    era: '20th Century',
    form: 'Solo Marimba',
    duration_minutes: 11,
    difficulty: 'professional',
    description: 'John Psathas\'s View from Olympus (1996) has become one of the most widely performed contemporary marimba solos internationally, beloved for its combination of Mediterranean folk-influenced melody, driving virtuosic passages, and deep expressive lyricism. The New Zealand composer draws on his Greek heritage in a work that begins with a contemplative, almost hymn-like opening and builds through increasingly passionate and technically demanding passages to a transcendent conclusion. The four-mallet writing demands complete independence of hands, a singing legato tone, and an ability to sustain long phrases at the instrument\'s extremes of range. View from Olympus is now standard repertoire at international marimba competitions worldwide.',
    editions: [
      {
        id: 'e-psathas-olympus-rattle',
        publisher: 'Rattle Records',
        editor: 'Psathas authorized edition',
        year: 1998,
        description: 'The standard performing edition from the composer\'s own publisher.',
      },
      {
        id: 'e-psathas-olympus-promethean',
        publisher: 'Promethean Editions',
        editor: 'International edition',
        year: 2005,
        description: 'Widely distributed international edition with performance notes from John Psathas.',
      },
    ],
    external_links: [
      { type: 'wikipedia', url: 'https://en.wikipedia.org/wiki/John_Psathas', label: 'Wikipedia -- John Psathas' },
      { type: 'soundcloud', url: 'https://soundcloud.com/john-psathas-composer/view-from-olympus-demo', label: 'John Psathas official -- composer recording' },
    ],
  },

  {
    id: 'saariaho-six-japanese-gardens',
    title: 'Six Japanese Gardens',
    composer_name: 'Kaija Saariaho',
    catalog_number: null,
    instruments: ['Percussion'],
    era: '20th Century',
    form: 'Concerto for Marimba and Electronics',
    duration_minutes: 25,
    difficulty: 'professional',
    description: 'Kaija Saariaho\'s Six Japanese Gardens (1993-95) is one of the defining works for marimba and electronics, composed during her stay at IRCAM in Paris and premiered at the Salzburg Festival. Each of the six movements evokes a specific Japanese garden -- from the meditative tranquility of moss gardens to the rhythmic patterns of rock and gravel -- while Saariaho\'s spectral electronic processing transforms the marimba\'s resonances into an immersive sonic environment. The work established Saariaho\'s reputation as a composer of extraordinary timbral imagination, and has become one of the most performed works in the contemporary marimba repertoire. The electronics part requires precise synchronization and venue-specific adaptation.',
    editions: [
      {
        id: 'e-saariaho-sjg-chester',
        publisher: 'Chester Music',
        editor: 'Authorized edition',
        year: 1995,
        description: 'The standard performing edition with electronic setup instructions.',
      },
      {
        id: 'e-saariaho-sjg-chester-rev',
        publisher: 'Chester Music',
        editor: 'Revised edition with updated electronics notes',
        year: 2005,
        description: 'Updated edition with revised electronics specifications for modern systems.',
      },
    ],
    external_links: [
      { type: 'wikipedia', url: 'https://en.wikipedia.org/wiki/Kaija_Saariaho', label: 'Wikipedia -- Kaija Saariaho' },
      { type: 'soundcloud', url: 'https://soundcloud.com/ircam-paris/saariaho-six-japanese-gardens', label: 'IRCAM Paris -- original electronics archive' },
      { type: 'vimeo', url: 'https://vimeo.com/314206792', label: 'International Percussion Competition -- Salzburg 2018 finalist' },
    ],
    movements: [
      { name: 'I. Jardin du paradis' },
      { name: 'II. Jardin du rocher' },
      { name: 'III. Jardin de mousse' },
      { name: 'IV. Jardin de pierre' },
      { name: 'V. Jardin de bord' },
      { name: 'VI. Jardin de sable' },
    ],
  },


  // === GUITAR ===

  {
    id: 'ponce-sonata-romantica',
    title: 'Sonata romantica (Hommage a Schubert)',
    composer_name: 'Manuel Ponce',
    catalog_number: null,
    instruments: ['Guitar'],
    era: '20th Century',
    form: 'Sonata',
    duration_minutes: 18,
    difficulty: 'advanced',
    description: 'Manuel Ponce\'s Sonata romantica (1928), subtitled Hommage a Schubert, is one of the most important guitar sonatas of the 20th century, written at Andres Segovia\'s request during Ponce\'s years in Paris studying with Paul Dukas. Ponce was the first major composer to write substantial original concert works specifically for Segovia\'s revival of the classical guitar, and this four-movement sonata demonstrates his ability to inhabit a Schubertian Romantic style while writing idiomatically for the instrument. The warm lyricism of the first movement, the song-like Andante espressivo, the delicate Minuet, and the energetic finale all draw on Schubert\'s melodic world filtered through Ponce\'s Mexican sensibility.',
    editions: [
      {
        id: 'e-ponce-sr-schott',
        publisher: 'Schott',
        editor: 'Andres Segovia',
        year: 1954,
        description: 'Segovia\'s own fingered edition; the standard performing text carrying his interpretive tradition.',
      },
      {
        id: 'e-ponce-sr-berben',
        publisher: 'Edizioni Berben',
        editor: 'Angelo Gilardino',
        year: 1995,
        description: 'New critical edition with recovery of Ponce\'s original intentions from manuscripts.',
      },
    ],
    external_links: [
      { type: 'wikipedia', url: 'https://en.wikipedia.org/wiki/Manuel_Ponce', label: 'Wikipedia -- Manuel Ponce' },
      { type: 'soundcloud', url: 'https://soundcloud.com/rcm-guitar/ponce-sonata-romantica', label: 'Royal College of Music -- guitar recital' },
    ],
    movements: [
      { name: 'I. Allegro moderato' },
      { name: 'II. Andante espressivo' },
      { name: 'III. Minueto' },
      { name: 'IV. Finale: Allegro non troppo e serioso' },
    ],
  },

  {
    id: 'dyens-tango-en-skai',
    title: 'Tango en Skai',
    composer_name: 'Roland Dyens',
    catalog_number: null,
    instruments: ['Guitar'],
    era: '20th Century',
    form: 'Character Piece',
    duration_minutes: 4,
    difficulty: 'advanced',
    description: 'Roland Dyens\'s Tango en Skai (1985) is one of the most widely performed modern guitar pieces, instantly recognizable for its sultry neo-tango melody and the playful wordplay of its title -- skai is a French word for imitation leather, suggesting a tango in fake glamour. The piece perfectly distills Dyens\'s style: jazz-inflected harmonies, a conversational rubato, sudden dynamic contrasts, and an almost theatrical sense of character. Despite its apparent simplicity it demands a convincing command of tango style -- the precise placement of rhythmic emphasis, the control of vibrato on sustained notes, and a natural fluency in the melodic ornamentation that defines the genre. Dyens (1955-2016) was one of the most beloved guitarist-composers of his generation.',
    editions: [
      {
        id: 'e-dyens-ts-lemoine',
        publisher: 'Henry Lemoine',
        editor: 'Dyens authorized edition',
        year: 1990,
        description: 'The authoritative edition from Dyens\'s primary publisher; includes his own performance notes.',
      },
      {
        id: 'e-dyens-ts-lemoine-rev',
        publisher: 'Henry Lemoine',
        editor: 'Revised edition',
        year: 2008,
        description: 'Revised edition with updated fingering suggestions from the composer.',
      },
    ],
    external_links: [
      { type: 'wikipedia', url: 'https://en.wikipedia.org/wiki/Roland_Dyens', label: 'Wikipedia -- Roland Dyens' },
      { type: 'soundcloud', url: 'https://soundcloud.com/rcm-guitar/dyens-tango-en-skai-student', label: 'Royal College of Music -- guitar student recital' },
    ],
  },

  {
    id: 'milan-pavane-guitar',
    title: 'Pavane No. 6 (from El Maestro)',
    composer_name: 'Luis de Milan',
    catalog_number: null,
    instruments: ['Guitar'],
    era: 'Renaissance',
    form: 'Pavane',
    duration_minutes: 3,
    difficulty: 'intermediate',
    description: 'Luis de Milan\'s El Maestro (1536) is the earliest printed collection of music specifically for solo vihuela -- the Spanish predecessor of the guitar -- and contains some of the most direct and beautiful music in the entire early guitar repertoire. The sixth Pavane is particularly celebrated for its elegant stepwise melody, its clear tonal architecture in E minor, and its expressive simplicity that speaks as freshly today as it did in Renaissance Castile. Guitarists typically perform it with a small amount of ornamentation and a tempo that breathes naturally; it serves both as an accessible entry point to Renaissance music and as a meditation on musical essentials that no amount of sophistication can improve. Luis de Milan was also a poet, scholar, and courtier in Valencia.',
    editions: [
      {
        id: 'e-milan-pav-schott',
        publisher: 'Schott',
        editor: 'Andres Segovia',
        year: 1958,
        description: 'Segovia\'s arrangement for modern guitar; the standard performing edition.',
      },
      {
        id: 'e-milan-pav-berben',
        publisher: 'Edizioni Berben',
        editor: 'Oscar Ghiglia',
        year: 1982,
        description: 'Critical edition with historical performance notes for Renaissance-style interpretation.',
      },
    ],
    external_links: [
      { type: 'wikipedia', url: 'https://en.wikipedia.org/wiki/Luis_de_Mil%C3%A1n', label: 'Wikipedia -- Luis de Milan' },
      { type: 'soundcloud', url: 'https://soundcloud.com/rncm-guitar/milan-pavane-renaissance', label: 'RNCM Guitar -- Renaissance music recital' },
    ],
  },


  // === DOUBLE BASS ===

  {
    id: 'sperger-db-concerto-d',
    title: 'Double Bass Concerto No. 15 in D major',
    composer_name: 'Johann Matthias Sperger',
    catalog_number: null,
    instruments: ['Double Bass', 'Orchestra'],
    era: 'Classical',
    form: 'Concerto',
    duration_minutes: 24,
    difficulty: 'advanced',
    description: 'Johann Matthias Sperger (1750-1812) was the most important double bass virtuoso of the Classical era, serving at the court orchestra of Prince Esterhazy alongside Haydn, and he composed an extraordinary body of double bass concertos -- eighteen survive -- that remain the primary Classical repertoire for the instrument. The Concerto No. 15 in D major (c. 1790s) is perhaps the finest, combining the galant elegance of late Haydn with writing of genuine virtuosity for the soloist. The first movement unfolds with lyrical themes well-suited to the bass\'s tenor register; the Adagio is genuinely expressive; and the finale\'s rondo theme has a folk-like bounce. Sperger wrote for his own tuning system -- solo tuning, a whole step above orchestral pitch -- making modern performances require careful transposition decisions.',
    editions: [
      {
        id: 'e-sperger-dbc15-doblinger',
        publisher: 'Doblinger',
        editor: 'Michael Riessler',
        year: 1984,
        description: 'The primary modern edition of this concerto, with cadenzas and performance notes for modern bass.',
      },
      {
        id: 'e-sperger-dbc15-heinrichshofen',
        publisher: 'Heinrichshofen',
        editor: 'Klaus Trumpf',
        year: 1990,
        description: 'Alternative performing edition with different cadenzas and bowings.',
      },
    ],
    external_links: [
      { type: 'wikipedia', url: 'https://en.wikipedia.org/wiki/Johann_Matthias_Sperger', label: 'Wikipedia -- Johann Matthias Sperger' },
      { type: 'soundcloud', url: 'https://soundcloud.com/isb-doublebass/sperger-concerto-d-major-student', label: 'International Society of Bassists -- student concerto recording' },
    ],
    movements: [
      { name: 'I. Allegro moderato' },
      { name: 'II. Adagio' },
      { name: 'III. Rondo: Allegretto' },
    ],
  },

];

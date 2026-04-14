import type { SeedPiece } from './seed';

export const expansionPieces12: SeedPiece[] = [

  // === ORCHESTRAL (6) ===

// === ORCHESTRAL ===

  // Bartók Concerto for Orchestra
  {
    id: 'bartok-concerto-for-orchestra',
    title: 'Concerto for Orchestra, Sz. 116',
    composer_name: 'Béla Bartók',
    catalog_number: 'Sz. 116',
    instruments: ['Orchestra'],
    era: '20th Century',
    form: 'Concerto for Orchestra',
    duration_minutes: 37,
    difficulty: 'professional',
    description: "Bartók's Concerto for Orchestra (1943), composed at the Seranak retreat in Massachusetts while the composer was gravely ill, stands as one of the supreme achievements of 20th-century symphonic writing. Commissioned by Serge Koussevitzky and the Boston Symphony Orchestra, it takes its name from the concertante treatment of individual orchestral sections — pairs of instruments trading solos in the second movement 'Game of Pairs,' woodwind families dueling in the scherzo, and the strings blazing in the long-arched finale. The work draws on the full resources of the post-Romantic orchestra while filtering them through Bartók's distinctive synthesis of folk modality, chromaticism, and driving asymmetric rhythm. The premiere in December 1944 was an immediate triumph and helped restore Bartók's finances in his final illness.",
    editions: [
      {
        id: 'e-bartok-cfo-boosey',
        publisher: 'Boosey & Hawkes',
        editor: 'Bartók estate',
        year: 1946,
        description: 'Original publication; the standard performing score used by orchestras worldwide. Includes all tempo markings and articulation from the composer.',
      },
      {
        id: 'e-bartok-cfo-pocket',
        publisher: 'Boosey & Hawkes',
        editor: 'Hawkes Pocket Score',
        year: 1963,
        description: 'Pocket study score in Hawkes Pocket Scores series. Convenient format for analysis and score-reading.',
      },
      {
        id: 'e-bartok-cfo-dover',
        publisher: 'Dover Publications',
        editor: 'Reprinted from Boosey & Hawkes',
        year: 1993,
        description: 'Affordable reprint of the Boosey & Hawkes full score; widely used for study purposes.',
      },
    ],
    external_links: [
      { type: 'imslp', url: 'https://imslp.org/wiki/Concerto_for_Orchestra,_Sz.116_(Bart%C3%B3k,_B%C3%A9la)', label: 'IMSLP — Concerto for Orchestra, Sz. 116' },
      { type: 'wikipedia', url: 'https://en.wikipedia.org/wiki/Concerto_for_Orchestra_(Bart%C3%B3k)', label: 'Wikipedia — Concerto for Orchestra (Bartók)' },
    ],
    movements: [
      { name: 'I. Introduzione — Andante non troppo; Allegro vivace' },
      { name: 'II. Giuoco delle coppie — Allegretto scherzando' },
      { name: 'III. Elegia — Andante non troppo' },
      { name: 'IV. Intermezzo interrotto — Allegretto' },
      { name: 'V. Finale — Pesante; Presto' },
    ],
  },
// Sibelius Symphony No. 5
  {
    id: 'sibelius-symphony-5',
    title: 'Symphony No. 5 in E-flat major',
    composer_name: 'Jean Sibelius',
    catalog_number: 'Op. 82',
    instruments: ['Orchestra'],
    era: '20th Century',
    form: 'Symphony',
    duration_minutes: 29,
    difficulty: 'professional',
    description: "Sibelius's Fifth Symphony (1915, revised 1916 and 1919) stands apart from his other symphonies in its visionary formal compression and its sense of transcendent natural grandeur. The opening movement undergoes a unique metamorphosis, beginning as a slow introduction before gradually accelerating into a scherzo — a process Sibelius achieved only after three successive revisions. The finale's 'swan hymn,' inspired by a diary entry about a flight of sixteen swans, is one of the most overwhelming moments in all Romantic orchestral music, its great horn theme circling over churning strings before arriving at the astonishing isolated hammer-blow conclusion: six massive chords separated by rests, as if the music were being chiseled in stone. Leonard Bernstein called it the most perfect symphonic ending ever written.",
    editions: [
      {
        id: 'e-sibelius-sym5-hansen',
        publisher: 'Wilhelm Hansen',
        editor: 'Edition Wilhelm Hansen',
        year: 1921,
        description: 'Original publication of the final 1919 revision; the standard performing score for this symphony.',
      },
      {
        id: 'e-sibelius-sym5-breitkopf',
        publisher: 'Breitkopf & Härtel',
        editor: 'Kalevi Aho',
        year: 2009,
        description: 'New critical edition based on autograph and all three versions (1915, 1916, 1919), with extensive commentary on the revision history.',
      },
    ],
    external_links: [
      { type: 'wikipedia', url: 'https://en.wikipedia.org/wiki/Symphony_No._5_(Sibelius)', label: 'Wikipedia — Symphony No. 5 (Sibelius)' },
    ],
    movements: [
      { name: 'I. Tempo molto moderato — Largamente — Allegro moderato — Presto' },
      { name: 'II. Andante mosso, quasi allegretto' },
      { name: 'III. Allegro molto — Un pochettino largamente' },
    ],
  },
// Smetana: The Moldau
  {
    id: 'smetana-moldau',
    title: 'Vltava (The Moldau) from Má vlast',
    composer_name: 'Bedřich Smetana',
    catalog_number: null,
    instruments: ['Orchestra'],
    era: 'Romantic',
    form: 'Symphonic Poem',
    duration_minutes: 12,
    difficulty: 'professional',
    description: "Vltava (The Moldau, 1874), the second and most celebrated of Smetana's six-movement symphonic cycle Má vlast (My Homeland), traces the course of Bohemia's great river from its twin springs in the Šumava forest to Prague and beyond. The work is a marvel of pictorial orchestration: two flutes represent the cold and warm sources merging into a stream, then the full orchestra launches the famous river melody — one of the most immediately recognizable tunes in all orchestral music. The river passes a peasant wedding, moonlit water nymphs, the St. John's Rapids (fierce brass and woodwind cascades), before arriving at the broad Bohemian landscape of Prague. Composed after Smetana had become completely deaf, Vltava stands as one of the supreme examples of musical patriotism and the power of programmatic orchestral writing.",
    editions: [
      {
        id: 'e-smetana-moldau-supraphon',
        publisher: 'Supraphon',
        editor: 'Miroslav Malura',
        year: 1979,
        description: 'Authoritative Czech critical edition; the standard score for professional performances. Based on autograph sources.',
      },
      {
        id: 'e-smetana-moldau-kalmus',
        publisher: 'Kalmus',
        editor: 'Edwin F. Kalmus',
        year: 1968,
        description: 'Affordable reprint widely used for study; reliable text based on the original Urbánek publication.',
      },
    ],
    external_links: [
      { type: 'wikipedia', url: 'https://en.wikipedia.org/wiki/The_Moldau', label: 'Wikipedia — The Moldau (Vltava)' },
      { type: 'youtube', url: 'https://www.youtube.com/watch?v=l4zkc7KEvYM', label: 'Václav Neumann / Czech Philharmonic — Complete Má vlast (1982)' },
    ],
  },
// Schumann Symphony No. 4
  {
    id: 'schumann-symphony-4',
    title: 'Symphony No. 4 in D minor',
    composer_name: 'Robert Schumann',
    catalog_number: 'Op. 120',
    instruments: ['Orchestra'],
    era: 'Romantic',
    form: 'Symphony',
    duration_minutes: 28,
    difficulty: 'professional',
    description: "Schumann's Fourth Symphony has one of the most complicated histories in the symphonic canon: first composed in 1841 (the same year as the 'Spring' Symphony), it was withdrawn after a disappointing premiere and completely revised in 1851 into its familiar form — the version Schumann himself called his 'most perfect' symphony. The four movements are played without break, connected by transitional passages that give the work an unusual organic unity; a single motto-theme permeates all four movements in various transformations. The finale's striding main theme drives the symphony to an exhilarating conclusion. Brahms famously preferred the 1841 version for its leaner orchestration, sparking the 'Brahms vs. Clara' controversy that has never been fully resolved; today conductors perform one or the other, or sometimes both versions in the same program.",
    editions: [
      {
        id: 'e-schumann-sym4-breitkopf',
        publisher: 'Breitkopf & Härtel',
        editor: 'Linda Correll Roesner',
        year: 2003,
        description: 'New critical edition presenting both the 1841 and 1851 versions in parallel; the definitive scholarly resource for this symphony.',
      },
      {
        id: 'e-schumann-sym4-eulenburg',
        publisher: 'Eulenburg',
        editor: 'Martin Schelhaas',
        year: 1966,
        description: 'Standard pocket study score of the 1851 version with historical introduction. Widely used for orchestra study and score-following.',
      },
    ],
    external_links: [
      { type: 'wikipedia', url: 'https://en.wikipedia.org/wiki/Symphony_No._4_(Schumann)', label: 'Wikipedia — Symphony No. 4 (Schumann)' },
    ],
    movements: [
      { name: 'I. Ziemlich langsam — Lebhaft' },
      { name: 'II. Romanze — Ziemlich langsam' },
      { name: 'III. Scherzo — Lebhaft' },
      { name: 'IV. Langsam — Lebhaft' },
    ],
  },
{
    id: 'mozart-symphony-41',
    title: 'Symphony No. 41 in C major "Jupiter"',
    composer_name: 'Wolfgang Amadeus Mozart',
    catalog_number: 'K. 551',
    instruments: ['Orchestra'],
    era: 'Classical',
    form: 'Symphony',
    duration_minutes: 31,
    difficulty: 'professional',
    description: "Mozart's final symphony (1788), nicknamed 'Jupiter' by the impresario Johann Peter Salomon, stands as the supreme monument of Classical symphonic writing. Its opening movement combines regal ceremonial gestures with intimate cantabile passages in a duality that electrified contemporaries, while the Andante cantabile achieves a singing beauty that anticipates Schubert. The Menuetto's trio introduces a chromatic rising scale that reappears transformed in the finale, one of the greatest movements in all music: a stupendous sonata-fugue synthesis in which five distinct themes are combined in stretto counterpoint, creating a final coda of overwhelming polyphonic complexity. That Mozart wrote this work, along with symphonies 39 and 40, in just six weeks during the summer of 1788—with no commission or performance in view—remains one of the great mysteries of musical creation.",
    editions: [
      {
        id: 'e-mozart-sym41-barenreiter',
        publisher: 'Bärenreiter',
        editor: 'Neal Zaslaw',
        year: 1990,
        description: 'Part of the Neue Mozart Ausgabe (NMA); the scholarly standard, based on autograph manuscript and earliest sources, with comprehensive critical commentary.',
      },
      {
        id: 'e-mozart-sym41-breitkopf',
        publisher: 'Breitkopf & Härtel',
        editor: 'Original editorial committee',
        year: 1880,
        description: 'Part of the 19th-century complete Mozart edition; historically important though superseded by NMA for scholarly use.',
      },
      {
        id: 'e-mozart-sym41-eulenburg',
        publisher: 'Eulenburg',
        editor: 'Wilhelm Fischer',
        year: 1966,
        description: 'Compact study score, widely used in analysis classes; includes prefatory essay on the work\'s form and historical significance.',
      },
    ],
    external_links: [
      { type: 'imslp', url: 'https://imslp.org/wiki/Symphony_No.41_in_C_major,_K.551_(Mozart,_Wolfgang_Amadeus)', label: 'IMSLP — Symphony No. 41 "Jupiter", K. 551' },
      { type: 'wikipedia', url: 'https://en.wikipedia.org/wiki/Symphony_No._41_(Mozart)', label: 'Wikipedia — Symphony No. 41 (Mozart)' },
    ],
    movements: [
      { name: 'I. Allegro vivace' },
      { name: 'II. Andante cantabile' },
      { name: 'III. Menuetto: Allegretto' },
      { name: 'IV. Molto allegro' },
    ],
  },

  // 4. Schubert Symphony No. 8 "Unfinished",
{
    id: 'prokofiev-symphony-5',
    title: 'Symphony No. 5 in B-flat major',
    composer_name: 'Sergei Prokofiev',
    catalog_number: 'Op. 100',
    instruments: ['Orchestra'],
    era: '20th Century',
    form: 'Symphony',
    duration_minutes: 43,
    difficulty: 'professional',
    description: "Prokofiev's Fifth Symphony (1944) was written during a supremely fertile wartime period and premiered under the composer's own baton in January 1945, the guns of the advancing Red Army audible during rehearsals. Prokofiev himself described it as 'a symphony about the spirit of man'—not a war symphony per se but a celebration of human freedom and strength. The massive opening Andante, with its broad, hymn-like themes, is one of the most majestic essays in 20th-century symphonism, while the Scherzo's savage motorism represents the demonic energy of Prokofiev at his most brilliant. The slow movement achieves a lyrical depth rarely equaled in the composer's output, before the finale—initially buoyant—is shadowed by darker undertones that complicate its apparent triumph. The symphony quickly became one of the most performed of the 20th century, a status it has never relinquished.",
    editions: [
      {
        id: 'e-prokofiev-sym5-sikorski',
        publisher: 'Sikorski',
        editor: 'Original publication',
        year: 1945,
        description: 'Original Soviet publication; the primary performing edition used in Russia and Eastern Europe for decades.',
      },
      {
        id: 'e-prokofiev-sym5-boosey',
        publisher: 'Boosey & Hawkes',
        editor: 'Editorial committee',
        year: 1946,
        description: 'Western performing edition; the standard score used by most Western orchestras, faithful to the Soviet original.',
      },
      {
        id: 'e-prokofiev-sym5-kalmus',
        publisher: 'Kalmus',
        editor: 'Editorial committee',
        year: null,
        description: 'Reprint of the Boosey & Hawkes edition, widely distributed and commonly found in orchestral libraries in North America.',
      },
    ],
    external_links: [
      { type: 'wikipedia', url: 'https://en.wikipedia.org/wiki/Symphony_No._5_(Prokofiev)', label: 'Wikipedia — Symphony No. 5 (Prokofiev)' },
    ],
    movements: [
      { name: 'I. Andante' },
      { name: 'II. Allegro marcato' },
      { name: 'III. Adagio' },
      { name: 'IV. Allegro giocoso' },
    ],
  },

  // ============================================================
  // CHAMBER MUSIC (5)
  // ============================================================

  // 6. Ravel Piano Trio,

  // === CHAMBER MUSIC (5) ===

// === CHAMBER MUSIC ===

  // Beethoven String Quartet Op. 59 No. 1 "Razumovsky"
  {
    id: 'beethoven-string-quartet-razumovsky-1',
    title: 'String Quartet in F major "Razumovsky No. 1"',
    composer_name: 'Ludwig van Beethoven',
    catalog_number: 'Op. 59 No. 1',
    instruments: ['String Quartet'],
    era: 'Classical',
    form: 'String Quartet',
    duration_minutes: 40,
    difficulty: 'professional',
    description: "The first of the three Razumovsky Quartets (1806), commissioned by the Russian ambassador Count Razumovsky, marked a revolutionary expansion of the string quartet form that left Beethoven's contemporaries bewildered. At over forty minutes, it was longer than any previous quartet and seemed more like a symphony than chamber music; the opening cello melody — one of the most celebrated in all chamber literature — unfolds at extraordinary length before the other instruments join. The scherzo's Russian theme (provided by Razumovsky himself) adds an exotic national color, while the finale's explosive energy and the Adagio's profound depth establish an emotional range that no quartet had previously attempted. Beethoven's achievement in Op. 59 fundamentally redefined what chamber music could express and aspire to.",
    editions: [
      {
        id: 'e-beeth-op59-1-henle',
        publisher: 'Henle Verlag',
        editor: 'Ernst Herttrich',
        year: 2012,
        description: 'Urtext edition based on autograph and first edition; includes critical commentary and performance notes.',
      },
      {
        id: 'e-beeth-op59-1-barenreiter',
        publisher: 'Bärenreiter',
        editor: 'Jonathan Del Mar',
        year: 2011,
        description: 'New critical edition as part of Del Mar\'s complete Beethoven string quartets; comprehensive source comparison.',
      },
    ],
    external_links: [
      { type: 'wikipedia', url: 'https://en.wikipedia.org/wiki/String_Quartet_No._7_(Beethoven)', label: 'Wikipedia — String Quartet Op. 59 No. 1 (Beethoven)' },
    ],
    movements: [
      { name: 'I. Allegro' },
      { name: 'II. Allegretto vivace e sempre scherzando' },
      { name: 'III. Adagio molto e mesto' },
      { name: 'IV. Thème russe — Allegro' },
    ],
  },
// Borodin String Quartet No. 2
  {
    id: 'borodin-string-quartet-2',
    title: 'String Quartet No. 2 in D major',
    composer_name: 'Alexander Borodin',
    catalog_number: null,
    instruments: ['String Quartet'],
    era: 'Romantic',
    form: 'String Quartet',
    duration_minutes: 30,
    difficulty: 'advanced',
    description: "Borodin's Second String Quartet in D major (1881) is the most popular Russian string quartet of the 19th century, and its slow movement — the Nocturne — one of the most beloved pieces of chamber music ever written. Composed as a love letter to his wife Ekaterina on their twentieth wedding anniversary, the work is a distillation of Borodin's lyrical gifts: warm, singing melodies, lush chromatic harmonies, and a natural, unforced spontaneity rare in quartet writing. The Nocturne's glowing cello melody over a pizzicato accompaniment, taken up in turn by each instrument, was later adapted as 'And This Is My Beloved' in the Broadway musical Kismet. The quartet balances Russian nationalist coloring with the formal refinement Borodin absorbed from his studies of Mendelssohn and Schumann.",
    editions: [
      {
        id: 'e-borodin-q2-zimmermann',
        publisher: 'M.P. Belaieff / Zimmermann',
        editor: 'Edition Belaieff',
        year: 1882,
        description: 'Original Belaieff publication; the authoritative performing text. Widely reprinted and the basis for modern editions.',
      },
      {
        id: 'e-borodin-q2-eulenburg',
        publisher: 'Eulenburg',
        editor: 'Pocket Score',
        year: 1955,
        description: 'Standard study score with historical note. Convenient format for analysis and ensemble rehearsal use.',
      },
    ],
    external_links: [
      { type: 'wikipedia', url: 'https://en.wikipedia.org/wiki/String_Quartet_No._2_(Borodin)', label: 'Wikipedia — String Quartet No. 2 (Borodin)' },
    ],
    movements: [
      { name: 'I. Allegro moderato' },
      { name: 'II. Scherzo — Allegro' },
      { name: 'III. Notturno — Andante' },
      { name: 'IV. Finale — Andante; Vivace' },
    ],
  },
// Brahms Piano Quartet No. 1
  {
    id: 'brahms-piano-quartet-1',
    title: 'Piano Quartet No. 1 in G minor',
    composer_name: 'Johannes Brahms',
    catalog_number: 'Op. 25',
    instruments: ['Piano', 'Violin', 'Viola', 'Cello'],
    era: 'Romantic',
    form: 'Piano Quartet',
    duration_minutes: 38,
    difficulty: 'professional',
    description: "Brahms's First Piano Quartet (1861), the work he played at his first Vienna concert, is one of the most passionate and turbulent pieces in the chamber music repertoire. The opening Allegro drives forward with an urgency that the young Brahms rarely matched elsewhere, its syncopations and dense counterpoint creating an almost symphonic weight. The Intermezzo's hovering, otherworldly atmosphere and the Andante con moto's Hungarian-inflected lyricism show Brahms at his most introspective, while the finale's rondo alla zingarese — a Hungarian-Romani dance of ferocious energy — brought the house down at every early performance and still does today. The work is doubly famous through Schoenberg's brilliant 1937 orchestration, which revealed the latent symphonic ambitions of every passage.",
    editions: [
      {
        id: 'e-brahms-pq1-henle',
        publisher: 'Henle Verlag',
        editor: 'Ernst Herttrich',
        year: 2011,
        description: 'Urtext edition based on the autograph and Simrock first edition; includes critical notes on sources and variants.',
      },
      {
        id: 'e-brahms-pq1-simrock',
        publisher: 'Breitkopf & Härtel (after Simrock)',
        editor: 'Clara Schumann',
        year: 1863,
        description: 'Original Simrock publication; the text supervised by the composer and Clara Schumann. Historic importance as the first edition.',
      },
    ],
    external_links: [
      { type: 'wikipedia', url: 'https://en.wikipedia.org/wiki/Piano_Quartet_No._1_(Brahms)', label: 'Wikipedia — Piano Quartet No. 1 (Brahms)' },
    ],
    movements: [
      { name: 'I. Allegro' },
      { name: 'II. Intermezzo — Allegro ma non troppo' },
      { name: 'III. Andante con moto' },
      { name: 'IV. Rondo alla Zingarese — Presto' },
    ],
  },
{
    id: 'beethoven-ghost-trio',
    title: 'Piano Trio No. 5 in D major "Ghost"',
    composer_name: 'Ludwig van Beethoven',
    catalog_number: 'Op. 70 No. 1',
    instruments: ['Piano', 'Violin', 'Cello'],
    era: 'Classical',
    form: 'Piano Trio',
    duration_minutes: 24,
    difficulty: 'professional',
    description: "Beethoven's 'Ghost' Trio (1808) owes its nickname to the extraordinary middle movement, a slow movement of such spectral, otherworldly character that commentators immediately associated it with the supernatural. Sketches for the slow movement appear alongside notes for an unwritten opera on Macbeth, and the tremolo-laden pianissimo textures and hollow harmonics indeed evoke the world of witches and apparitions. The outer movements could scarcely be more different: the opening Allegro vivace e con brio is all vital energy and rhythmic drive, while the finale returns to vigorous good humor after the slow movement's darkness. The combination of the work's spiritual depth with its high technical demands and expressive range makes it one of Beethoven's most frequently performed chamber pieces and a cornerstone of the piano trio repertoire.",
    editions: [
      {
        id: 'e-beeth-ghost-henle',
        publisher: 'Henle Verlag',
        editor: 'Ernst Herttrich',
        year: 2001,
        description: 'Urtext edition based on the autograph and first Breitkopf edition; considered the standard scholarly and performance text.',
      },
      {
        id: 'e-beeth-ghost-barenreiter',
        publisher: 'Bärenreiter',
        editor: 'Jonathan Del Mar',
        year: 2011,
        description: 'Part of the new Beethoven complete edition; critically edited with detailed notes on textual variants and performance practice.',
      },
      {
        id: 'e-beeth-ghost-breitkopf',
        publisher: 'Breitkopf & Härtel',
        editor: 'Original editorial committee',
        year: 1874,
        description: 'Part of the original Breitkopf & Härtel complete Beethoven edition; historically significant though now superseded by critical editions.',
      },
    ],
    external_links: [
      { type: 'wikipedia', url: 'https://en.wikipedia.org/wiki/Piano_Trio_No._5_(Beethoven)', label: 'Wikipedia — Piano Trio No. 5 "Ghost" (Beethoven)' },
    ],
    movements: [
      { name: 'I. Allegro vivace e con brio' },
      { name: 'II. Largo assai ed espressivo' },
      { name: 'III. Presto' },
    ],
  },

  // 8. Haydn "Emperor" Quartet,
{
    id: 'brahms-clarinet-sonata-1',
    title: 'Clarinet Sonata No. 1 in F minor',
    composer_name: 'Johannes Brahms',
    catalog_number: 'Op. 120 No. 1',
    instruments: ['Clarinet', 'Piano'],
    era: 'Romantic',
    form: 'Sonata',
    duration_minutes: 22,
    difficulty: 'advanced',
    description: "Brahms's two clarinet sonatas (1894) were among the last works of his career, written after he had supposedly retired from composition, inspired by his encounter with the clarinettist Richard Mühlfeld of the Meiningen Court Orchestra. The F minor Sonata, the first of the pair, is the more turbulent and emotionally complex, its brooding opening Allegro appassionato setting a dark, introspective tone that runs through much of the work. The Andante un poco Adagio is a movement of extraordinary tenderness, its sighing phrases and warm clarinet tone evoking a late-autumnal nostalgia unique in Brahms's output. The Allegretto grazioso brings welcome lightness, and the finale—a set of variations on a theme of gypsy character—ends the work with warmth and dance-like energy. Brahms himself arranged the solo part for viola as an alternative, and the work has since become a cornerstone of both instruments' repertoire.",
    editions: [
      {
        id: 'e-brahms-cl-son1-henle',
        publisher: 'Henle Verlag',
        editor: 'Ernst Herttrich & Hans-Martin Theopold',
        year: 2004,
        description: 'Urtext edition based on the autograph and first Simrock edition; includes the alternative viola part, standard scholarly and performing edition.',
      },
      {
        id: 'e-brahms-cl-son1-simrock',
        publisher: 'Breitkopf & Härtel',
        editor: 'Simrock original',
        year: 1895,
        description: 'Reprint of the original Simrock first edition; historically significant and the basis for subsequent performing editions.',
      },
      {
        id: 'e-brahms-cl-son1-peters',
        publisher: 'Peters',
        editor: 'Editorial committee',
        year: 1971,
        description: 'Standard performing edition, widely used in conservatories; includes both clarinet and viola parts with piano.',
      },
    ],
    external_links: [
      { type: 'wikipedia', url: 'https://en.wikipedia.org/wiki/Clarinet_Sonatas_(Brahms)', label: 'Wikipedia — Clarinet Sonatas (Brahms)' },
    ],
    movements: [
      { name: 'I. Allegro appassionato' },
      { name: 'II. Andante un poco Adagio' },
      { name: 'III. Allegretto grazioso' },
      { name: 'IV. Vivace' },
    ],
  },

  // ============================================================
  // ORGAN (4)
  // ============================================================

  // 11. Alain Litanies,

  // === ORGAN (3) ===

// === ORGAN ===

  // Elgar Organ Sonata No. 1
  {
    id: 'elgar-organ-sonata-1',
    title: 'Organ Sonata No. 1 in G major',
    composer_name: 'Edward Elgar',
    catalog_number: 'Op. 28',
    instruments: ['Organ'],
    era: 'Romantic',
    form: 'Sonata',
    duration_minutes: 30,
    difficulty: 'professional',
    description: "Elgar's Organ Sonata in G major (1895), written for the Worcester Three Choirs Festival and premiered by Herbert Brewer, is the largest and most ambitious organ sonata in the English repertoire. Its four movements reveal an orchestral imagination of the first order: the opening Allegro maestoso has the sweep and grandeur of a cathedral anthem, the Allegretto combines scherzo wit with cathedral bell effects, and the Andante espressivo is music of genuine mystical beauty. The finale's fugal writing and triumphant peroration demonstrate the young Elgar's complete mastery of large-scale form. The sonata fell into neglect for much of the 20th century but has been revived through recordings by Elgar champions including Thomas Trotter and Christopher Herrick.",
    editions: [
      {
        id: 'e-elgar-organ-novello',
        publisher: 'Novello',
        editor: 'Herbert Brewer',
        year: 1896,
        description: 'Original Novello publication supervised by the dedicatee Herbert Brewer; the standard performing text.',
      },
      {
        id: 'e-elgar-organ-novello-rev',
        publisher: 'Novello',
        editor: 'Christopher Robinson',
        year: 1996,
        description: 'Centenary reprint with updated editorial notes and registration suggestions for modern instruments.',
      },
    ],
    external_links: [
      { type: 'wikipedia', url: 'https://en.wikipedia.org/wiki/Organ_Sonata_No._1_(Elgar)', label: 'Wikipedia — Organ Sonata No. 1 (Elgar)' },
    ],
    movements: [
      { name: 'I. Allegro maestoso' },
      { name: 'II. Allegretto' },
      { name: 'III. Andante espressivo' },
      { name: 'IV. Presto (Comodo)' },
    ],
  },
// Flor Peeters: Toccata, Fugue and Hymn
  {
    id: 'flor-peeters-toccata',
    title: 'Toccata, Fugue and Hymn on "Ave Maris Stella"',
    composer_name: 'Flor Peeters',
    catalog_number: 'Op. 28',
    instruments: ['Organ'],
    era: '20th Century',
    form: 'Toccata and Fugue',
    duration_minutes: 10,
    difficulty: 'advanced',
    description: "Flor Peeters' Toccata, Fugue and Hymn on 'Ave Maris Stella' (1931) is the most celebrated work of the Belgian organist-composer and one of the essential pieces of the 20th-century organ repertoire. Peeters — perhaps the greatest Belgian organist of his generation, professor at the Royal Flemish Conservatory for over 40 years — weaves the ancient Marian plainchant through three contrasting movements: a brilliant toccata that places the cantus firmus in the pedal against cascading manual figuration, a rigorous Baroque-influenced fugue, and a luminous closing hymn that brings the chant to its most radiant statement. The work demands technical mastery of both manuals and pedals while presenting the performer with profound expressive opportunities. It is a touchstone of both the Belgian organ tradition and the wider 20th-century neo-classical organ movement.",
    editions: [
      {
        id: 'e-peeters-toccata-cfp',
        publisher: 'C. F. Peters',
        editor: 'Flor Peeters',
        year: 1931,
        description: 'Original publication; the standard performing text with Peeters\' own registration and tempo markings.',
      },
      {
        id: 'e-peeters-toccata-mclaug',
        publisher: 'McLaughlin & Reilly',
        editor: 'American edition',
        year: 1945,
        description: 'American edition with registration suggestions adapted for North American organ specifications.',
      },
    ],
    external_links: [
      { type: 'wikipedia', url: 'https://en.wikipedia.org/wiki/Flor_Peeters', label: 'Wikipedia — Flor Peeters' },
    ],
    movements: [
      { name: 'I. Toccata' },
      { name: 'II. Fugue' },
      { name: 'III. Hymn' },
    ],
  },
{
    id: 'messiaen-corps-glorieux',
    title: 'Les Corps Glorieux (Seven Brief Visions of the Life of the Risen)',
    composer_name: 'Olivier Messiaen',
    catalog_number: null,
    instruments: ['Organ'],
    era: '20th Century',
    form: 'Cycle',
    duration_minutes: 55,
    difficulty: 'professional',
    description: "Les Corps Glorieux (1939), composed during the summer before the outbreak of World War II, represents Messiaen at the height of his pre-war organ cycle trilogy, alongside La Nativité du Seigneur and L'Ascension. Its seven movements meditate on the properties of the glorified body after resurrection—subtility, agility, clarity, and impassibility—drawing on the theology of Thomas Aquinas and the mystical writings of St. Paul. The musical language deploys Messiaen's signature modes of limited transposition, rhythmic innovations drawn from Indian tala patterns, and birdsong-inspired melodic lines, creating an entirely personal soundworld that transformed 20th-century organ writing. The third movement, 'L'Ange aux parfums,' achieves an otherworldly stasis through its layered static harmonies, while the seventh, 'Le Mystère de la Sainte Trinité,' builds to a climax of overwhelming power and luminosity. First performed on the organ of La Trinité, Paris, the work remains the cornerstone of the modern French organ repertoire.",
    editions: [
      {
        id: 'e-messiaen-corps-leduc',
        publisher: 'Leduc',
        editor: 'Original Messiaen edition',
        year: 1945,
        description: 'Original Leduc publication; the authoritative text as approved by the composer.',
      },
      {
        id: 'e-messiaen-corps-leduc-rev',
        publisher: 'Leduc',
        editor: 'Revised editorial team',
        year: null,
        description: 'Revised Leduc reprint incorporating minor corrections; the currently distributed performing edition.',
      },
    ],
    external_links: [
      { type: 'wikipedia', url: 'https://en.wikipedia.org/wiki/Les_Corps_glorieux', label: 'Wikipedia — Les Corps Glorieux (Messiaen)' },
    ],
    movements: [
      { name: 'I. Subtilité des Corps Glorieux' },
      { name: 'II. Les Eaux de la Grâce' },
      { name: 'III. L\'Ange aux parfums' },
      { name: 'IV. Combat de la Mort et de la Vie' },
      { name: 'V. Force et Agilité des Corps Glorieux' },
      { name: 'VI. Joie et Clarté des Corps Glorieux' },
      { name: 'VII. Le Mystère de la Sainte Trinité' },
    ],
  },

  // ============================================================
  // HARP (3)
  // ============================================================

  // 15. Pierne Concertstuck for Harp,

  // === HARP (3) ===

{
    id: 'pierne-concertstuck-harp',
    title: 'Concertstück for Harp and Orchestra',
    composer_name: 'Gabriel Pierné',
    catalog_number: 'Op. 39',
    instruments: ['Harp', 'Orchestra'],
    era: 'Romantic',
    form: 'Concertstück',
    duration_minutes: 12,
    difficulty: 'advanced',
    description: "Pierné's Concertstück (1901) is one of the jewels of the harp concertante repertoire, written with a flair for brilliant salon-style writing that barely conceals its considerable technical demands. The work was written for the legendary harpist Henriette Renié, who premiered it, and its single-movement form combines lyrical fantasy with virtuosic display in a way perfectly suited to the instrument's capabilities. The opening Andante moderato introduces a singing cantabile theme of Romantic warmth before the music accelerates into a dazzling Allegro vivo section showing off the harp's full range of glissandi, arpeggios, and harmonics. Pierné was a consummate orchestral colorist as well as a fine melodist, and the orchestral writing provides an iridescent backdrop to the solo part without ever overwhelming it. The piece remains a staple of the orchestral harp repertoire and a favorite with audiences unfamiliar with the instrument's concertante potential.",
    editions: [
      {
        id: 'e-pierne-cstk-leduc',
        publisher: 'Leduc',
        editor: 'Original edition',
        year: 1904,
        description: 'Original Leduc publication; the authoritative edition used in performance.',
      },
      {
        id: 'e-pierne-cstk-imc',
        publisher: 'International Music Company',
        editor: 'Editorial committee',
        year: 1975,
        description: 'Standard performing edition widely used in North American harp teaching and performance.',
      },
    ],
    external_links: [
      { type: 'wikipedia', url: 'https://en.wikipedia.org/wiki/Gabriel_Piern%C3%A9#Works', label: 'Wikipedia — Gabriel Pierné works' },
    ],
  },

  // 16. Parish Alvars Harp Concerto,
// === HARP ===

  // Reinecke Harp Sonata "Undine"
  {
    id: 'reinecke-harp-sonata',
    title: 'Harp Sonata in E minor "Undine"',
    composer_name: 'Carl Reinecke',
    catalog_number: 'Op. 167',
    instruments: ['Harp'],
    era: 'Romantic',
    form: 'Sonata',
    duration_minutes: 22,
    difficulty: 'advanced',
    description: "Reinecke's Harp Sonata 'Undine' (1883), inspired by Friedrich de la Motte Fouqué's fairy tale of the water spirit Undine and her love for a mortal knight, is the most important original sonata for harp in the Romantic literature. Reinecke — then director of the Leipzig Gewandhaus — composed the work as a vehicle for Friederike Mayer, his star harp student, and the four movements trace Undine's journey from enchanted water world to human love and ultimately tragic fate. The opening Allegro agitato's turbulent figurations conjure the sea, while the Intermezzo's playful trickster spirit and the Romance's aching lyricism show the full expressive range Reinecke demands of the harpist. The finale's coda, where the harp fades away in hushed harmonics as if dissolving back into the water, is one of the most magically atmospheric passages in all harp music.",
    editions: [
      {
        id: 'e-reinecke-harp-simrock',
        publisher: 'Simrock',
        editor: 'Carl Reinecke',
        year: 1883,
        description: 'Original Simrock publication; the authoritative performing text with the composer\'s own markings.',
      },
      {
        id: 'e-reinecke-harp-imc',
        publisher: 'International Music Company',
        editor: 'Carlos Salzedo',
        year: 1963,
        description: 'American edition with Salzedo\'s idiomatic fingering and technical suggestions for the modern pedal harp.',
      },
    ],
    external_links: [
      { type: 'wikipedia', url: 'https://en.wikipedia.org/wiki/Carl_Reinecke', label: 'Wikipedia — Carl Reinecke' },
    ],
    movements: [
      { name: 'I. Allegro agitato' },
      { name: 'II. Intermezzo — Allegretto vivace' },
      { name: 'III. Romance — Moderato tranquillo' },
      { name: 'IV. Finale — Allegro molto agitato' },
    ],
  },
// Damase Sonatine en Trio
  {
    id: 'damase-sonatine-trio',
    title: 'Sonatine en Trio for Flute, Harp, and Cello',
    composer_name: 'Jean-Michel Damase',
    catalog_number: null,
    instruments: ['Flute', 'Harp', 'Cello'],
    era: '20th Century',
    form: 'Sonatine',
    duration_minutes: 10,
    difficulty: 'advanced',
    description: "Jean-Michel Damase's Sonatine en Trio (1946), written when the composer was only seventeen and premiered the following year by his own trio, is an exquisite miniature of the French neo-classical chamber repertoire. Damase, later a student of Nadia Boulanger, captures the elegance and wit of the French salon tradition while infusing it with a youthful freshness; the three movements — a graceful Allegretto, a tender Andante, and a sparkling Finale — exploit the interplay between flute, harp, and cello with inspired economy. The harp writing balances delicate arpeggios with moments of crystalline clarity, while the cello adds warmth and grounding to the upper voices. Despite its modest scope, the Sonatine has become a staple of the French chamber repertoire and a popular recital work for harp-centered trios.",
    editions: [
      {
        id: 'e-damase-sonatine-leduc',
        publisher: 'Alphonse Leduc',
        editor: 'Jean-Michel Damase',
        year: 1946,
        description: 'Original Leduc publication; the standard performing text with the composer\'s own articulation and dynamic markings.',
      },
      {
        id: 'e-damase-sonatine-leduc-rev',
        publisher: 'Alphonse Leduc',
        editor: 'Revised edition',
        year: 1968,
        description: 'Revised edition with minor engraving corrections; the version most commonly used in modern performance.',
      },
    ],
    external_links: [
      { type: 'wikipedia', url: 'https://en.wikipedia.org/wiki/Jean-Michel_Damase', label: 'Wikipedia — Jean-Michel Damase' },
    ],
    movements: [
      { name: 'I. Allegretto' },
      { name: 'II. Andante' },
      { name: 'III. Finale — Allegro' },
    ],
  },

  // === PERCUSSION (2) ===

// === PERCUSSION ===

  // Séjourné Concerto for Marimba
  {
    id: 'sejourne-marimba-concerto',
    title: 'Concerto for Marimba and String Orchestra',
    composer_name: 'Emmanuel Séjourné',
    catalog_number: null,
    instruments: ['Marimba', 'String Orchestra'],
    era: '20th Century',
    form: 'Concerto',
    duration_minutes: 18,
    difficulty: 'professional',
    description: "Emmanuel Séjourné's Concerto for Marimba and String Orchestra (2003) has rapidly become one of the most performed and recorded new concertos in the marimba repertoire, winning the ICMA (International Classical Music Award) in its recording by Katarzyna Myćka with the Bamberg Symphony. Séjourné, a French percussionist-composer and professor at the Strasbourg Conservatoire, brings an improvisatory, jazz-inflected energy to the concerto form while maintaining rigorous structural clarity. The three movements move from a turbulent, driving Allegro through an intimate Andante notable for its long melodic arcs to a virtuosic finale that exploits the full four-mallet technique. The interplay between marimba and strings is exceptionally imaginative, the percussion instrument emerging with unprecedented lyrical character.",
    editions: [
      {
        id: 'e-sejourne-mc-perceneige',
        publisher: 'Perce-Neige',
        editor: 'Emmanuel Séjourné',
        year: 2004,
        description: 'Original publication from Séjourné\'s own publishing house; the authoritative performing score.',
      },
      {
        id: 'e-sejourne-mc-leduc',
        publisher: 'Alphonse Leduc',
        editor: 'Emmanuel Séjourné',
        year: 2010,
        description: 'Leduc distribution edition; wider availability for hire and purchase in Europe and North America.',
      },
    ],
    external_links: [
      { type: 'wikipedia', url: 'https://en.wikipedia.org/wiki/Emmanuel_S%C3%A9journ%C3%A9', label: 'Wikipedia — Emmanuel Séjourné' },
    ],
    movements: [
      { name: 'I. Allegro' },
      { name: 'II. Andante' },
      { name: 'III. Finale' },
    ],
  },
// Živković: Funny Marimba
  {
    id: 'zivkovic-funny-marimba',
    title: 'Funny Marimba',
    composer_name: 'Nebojša Jovan Živković',
    catalog_number: null,
    instruments: ['Marimba'],
    era: '20th Century',
    form: 'Character Pieces',
    duration_minutes: 12,
    difficulty: 'advanced',
    description: "Nebojša Jovan Živković's Funny Marimba (2001), a suite of five short character pieces for solo marimba, has become one of the most frequently programmed contemporary works for the instrument, appearing on international competition programs and solo recitals worldwide. Živković, a Serbian composer and percussionist based in Germany, writes with an infectious rhythmic wit and an idiomatic understanding of the marimba's resonant possibilities that few composers match. Each piece has a vivid character title — ranging from the playful to the mysterious — and exploits four-mallet technique, rolled chords, and cross-rhythm with equal facility. The suite is simultaneously accessible enough for advanced students and rewarding enough for professional soloists, occupying a unique position in the contemporary marimba repertoire as a work that is both technically demanding and immediately communicative.",
    editions: [
      {
        id: 'e-zivkovic-fm-ricordi',
        publisher: 'Ricordi',
        editor: 'Nebojša Jovan Živković',
        year: 2001,
        description: 'Original publication from Ricordi; the standard performing text.',
      },
      {
        id: 'e-zivkovic-fm-zimmermann',
        publisher: 'Zimmermann',
        editor: 'Frankfurt edition',
        year: 2008,
        description: 'European distribution edition; includes revised dynamics and performance notes from the composer.',
      },
    ],
    external_links: [
    ],
    movements: [
      { name: 'I. Crazy' },
      { name: 'II. Lullaby' },
      { name: 'III. Dangerous' },
      { name: 'IV. In the mist' },
      { name: 'V. Tarantella' },
    ],
  },

  // === GUITAR (3) ===

{
    id: 'villa-lobos-prelude-1',
    title: 'Prelude No. 1 in E minor',
    composer_name: 'Heitor Villa-Lobos',
    catalog_number: null,
    instruments: ['Guitar'],
    era: '20th Century',
    form: 'Character Piece',
    duration_minutes: 5,
    difficulty: 'intermediate',
    description: "Villa-Lobos's Five Preludes for guitar (1940) are the most important contributions to the guitar's solo literature since the 19th century, and the first in E minor is perhaps the most widely loved. Villa-Lobos subtitled it 'Lyric Melody'—a dedication 'to the soul of the Brazilian countryside'—and it combines the guitar's characteristic open-string resonances with a lyrical, slightly melancholy melody that owes something to the modinha, a Brazilian urban song form. The piece's elegant arch form—a sustained singing melody over plucked bass arpeggios, with a more animated middle section before the return—makes it accessible to intermediate players while rewarding the refinements of the virtuoso, and it has become perhaps the most recorded piece in the guitar's entire repertoire. Julian Bream's 1977 recording and John Williams's many versions have done much to establish its worldwide popularity. The Prelude exemplifies Villa-Lobos's gift for fusing European Romantic harmony with the distinctive rhythmic and melodic personality of Brazilian music.",
    editions: [
      {
        id: 'e-villlobos-pre1-eschig',
        publisher: 'Max Eschig',
        editor: 'Original Villa-Lobos edition',
        year: 1940,
        description: 'Original Max Eschig publication; the authoritative edition under Villa-Lobos\'s supervision.',
      },
      {
        id: 'e-villlobos-pre1-schott',
        publisher: 'Schott',
        editor: 'Frédéric Zigante',
        year: 2002,
        description: 'Critical performing edition with detailed editorial notes on variant readings and performance practice.',
      },
      {
        id: 'e-villlobos-pre1-berben',
        publisher: 'Berben',
        editor: 'Editorial committee',
        year: 1980,
        description: 'Performing edition widely used in Italian and European guitar pedagogy.',
      },
    ],
    external_links: [
    ],
  },

  // 22. Ponce Guitar Sonata No. 3 "Guitarra",
{
    id: 'ponce-guitar-sonata-3',
    title: 'Sonata No. 3 "Guitarra"',
    composer_name: 'Manuel María Ponce',
    catalog_number: null,
    instruments: ['Guitar'],
    era: '20th Century',
    form: 'Sonata',
    duration_minutes: 15,
    difficulty: 'professional',
    description: "Ponce's Third Guitar Sonata, nicknamed 'Guitarra' (c. 1928), was written for and edited by Andrés Segovia, whose advocacy made Ponce the most important composer for the guitar in the first half of the 20th century. The work is a full-scale three-movement sonata in the Romantic tradition, but with a distinctly Mexican harmonic and melodic flavoring—the folk-inflected melodic lines and characteristic guitar figurations give it a national character wholly different from the European tradition Segovia was anxious to emulate. The first movement's lyrical singing quality, the central Andante's profound calm, and the finale's dance-like energy together create a satisfying formal arc. Ponce's harmonic language, influenced by his studies in Paris with Paul Dukas, blends chromatic Romanticism with modal and tonal simplicity in a way that perfectly suits the guitar's distinctive resonance. The Sonata is technically demanding across all three movements but especially rewarding to those who invest in its considerable expressive depths.",
    editions: [
      {
        id: 'e-ponce-son3-schott',
        publisher: 'Schott',
        editor: 'Andrés Segovia',
        year: 1948,
        description: 'Original Schott edition edited by Segovia; historically significant as the edition that brought the work to the world\'s attention.',
      },
      {
        id: 'e-ponce-son3-berben',
        publisher: 'Berben',
        editor: 'Angelo Gilardino',
        year: 1991,
        description: 'Critical performing edition by Gilardino based on manuscript sources; corrects various editorial liberties in the Segovia edition.',
      },
    ],
    external_links: [
      { type: 'wikipedia', url: 'https://en.wikipedia.org/wiki/Manuel_Ponce#Guitar_music', label: 'Wikipedia — Manuel Ponce guitar works' },
    ],
    movements: [
      { name: 'I. Allegro moderato' },
      { name: 'II. Andante' },
      { name: 'III. Allegretto' },
    ],
  },

  // 23. Castelnuovo-Tedesco Guitar Sonata "Omaggio a Boccherini",
{
    id: 'castelnuovo-tedesco-guitar-sonata',
    title: 'Sonata (Omaggio a Boccherini)',
    composer_name: 'Mario Castelnuovo-Tedesco',
    catalog_number: 'Op. 77',
    instruments: ['Guitar'],
    era: '20th Century',
    form: 'Sonata',
    duration_minutes: 18,
    difficulty: 'professional',
    description: "Castelnuovo-Tedesco's Guitar Sonata 'Omaggio a Boccherini,' Op. 77 (1934) was written for and dedicated to Andrés Segovia, who premiered it and kept it in his repertoire for decades, making it one of the most celebrated works in the guitar's 20th-century canon. The 'homage to Boccherini' refers not to specific quotation but to the spirit of 18th-century Classicism—the Neoclassical poise, clear formal articulation, and elegant craftsmanship that Castelnuovo-Tedesco admired in the Italian master who was himself a guitarist's composer. The four movements span a wide emotional range: an opening movement of Classical formal balance but Romantic harmonic richness, a graceful Minuet, a deeply felt Andantino sostenuto slow movement, and a vivacious finale. Throughout, the composer demonstrates an instinctive understanding of the guitar's idiomatic possibilities—its tendency to sing, its resonant open strings, its capacity for rapid passage-work—that marks him as one of the finest non-guitarist composers for the instrument.",
    editions: [
      {
        id: 'e-ctedesco-son-schott',
        publisher: 'Schott',
        editor: 'Julian Bream',
        year: 1950,
        description: 'Edition prepared by Julian Bream for Schott; the standard performing edition for most of the 20th century.',
      },
      {
        id: 'e-ctedesco-son-berben',
        publisher: 'Berben',
        editor: 'Angelo Gilardino',
        year: 2005,
        description: 'Critical edition by Gilardino based on the autograph; incorporates manuscript variants and updates the editorial fingerings.',
      },
    ],
    external_links: [
      { type: 'wikipedia', url: 'https://en.wikipedia.org/wiki/Mario_Castelnuovo-Tedesco#Guitar_sonata', label: 'Wikipedia — Mario Castelnuovo-Tedesco guitar works' },
    ],
    movements: [
      { name: 'I. Allegro con spirito' },
      { name: 'II. Minuetto' },
      { name: 'III. Andantino sostenuto e melanconico' },
      { name: 'IV. Vivo ed energico' },
    ],
  },

  // ============================================================
  // DOUBLE BASS (2)
  // ============================================================

  // 24. Bottesini Fantasia on Themes from Norma,

  // === DOUBLE BASS (3) ===

{
    id: 'bottesini-fantasia-norma',
    title: 'Fantasia on Themes from Norma (Bellini)',
    composer_name: 'Giovanni Bottesini',
    catalog_number: null,
    instruments: ['Double Bass', 'Piano'],
    era: 'Romantic',
    form: 'Fantasy',
    duration_minutes: 10,
    difficulty: 'advanced',
    description: "Giovanni Bottesini (1821–1889), called 'the Paganini of the double bass,' brought the instrument to a virtuosic level previously thought impossible, and his fantasies on operatic themes were the showpieces of his legendary concert career. The Fantasia on Bellini's Norma (c. 1850s) takes the opera's most famous melodies—above all the 'Casta diva' cavatina—and transforms them into vehicles for the double bass's unexpectedly singing upper register, exploiting harmonics, cantilena passages, and rapid passage-work to reveal the instrument's Romantic expressivity. Bottesini's writing pushes the double bass to the very top of its range, requiring the soloist to negotiate flageolet harmonics and singing cantabile phrases of operatic breadth that seem scarcely possible on so large an instrument. The work has become a cornerstone of the double bass's solo repertoire and a favorite encore piece for the instrument's greatest exponents, demonstrating that the bass could indeed be a solo instrument capable of challenging the cello in expressive richness.",
    editions: [
      {
        id: 'e-bottesini-norma-imc',
        publisher: 'International Music Company',
        editor: 'Rudolf Zimmermann',
        year: null,
        description: 'Standard performing edition with Zimmermann\'s arrangement; widely used in double bass teaching and performance.',
      },
      {
        id: 'e-bottesini-norma-yorke',
        publisher: 'Yorke Edition',
        editor: 'Ludwig Streicher',
        year: 1990,
        description: 'Urtext-style edition based on manuscript sources; includes detailed performance notes by the distinguished bassist Ludwig Streicher.',
      },
    ],
    external_links: [
      { type: 'wikipedia', url: 'https://en.wikipedia.org/wiki/Giovanni_Bottesini#Solo_works', label: 'Wikipedia — Giovanni Bottesini solo works' },
    ],
  },

  // 25. Nanny Double Bass Concerto,
// === DOUBLE BASS ===

  // Hoffmeister Double Bass Concerto
  {
    id: 'hoffmeister-db-concerto',
    title: 'Concerto for Double Bass in D major',
    composer_name: 'Franz Anton Hoffmeister',
    catalog_number: null,
    instruments: ['Double Bass', 'Orchestra'],
    era: 'Classical',
    form: 'Concerto',
    duration_minutes: 22,
    difficulty: 'advanced',
    description: "Franz Anton Hoffmeister's Double Bass Concerto in D major (c. 1790) is one of the most important and frequently performed works in the solo bass repertoire, occupying a similar position to the Dittersdorf and Vanhal concertos as a vehicle for demonstrating the bass's lyrical and technical possibilities in the Classical era. Hoffmeister — better known as a publisher who founded the firm that became Breitkopf & Härtel — was also a prolific composer, and the concerto reveals a genuine understanding of the instrument's singing character. The opening Allegro moderato presents two contrasting themes with a clear sense of Classical formal architecture, the Andante sings with genuine melodic warmth, and the Rondo finale's folk-dance energy makes it a crowd-pleasing conclusion. The concerto has been championed by virtually every major double bass soloist of the past century and remains a key recital and concerto work for the instrument.",
    editions: [
      {
        id: 'e-hoffmeister-dbc-imc',
        publisher: 'International Music Company',
        editor: 'Lawrence Hurst',
        year: 1966,
        description: 'Standard performing edition widely used for over fifty years; includes bowings and fingerings for modern orchestral bass.',
      },
      {
        id: 'e-hoffmeister-dbc-doblinger',
        publisher: 'Doblinger',
        editor: 'Klaus Stoll',
        year: 1981,
        description: 'Austrian edition with Stoll\'s own editing from the Berlin Philharmonic tradition; includes ossia passages for difficult sections.',
      },
    ],
    external_links: [
      { type: 'wikipedia', url: 'https://en.wikipedia.org/wiki/Franz_Anton_Hoffmeister', label: 'Wikipedia — Franz Anton Hoffmeister' },
    ],
    movements: [
      { name: 'I. Allegro moderato' },
      { name: 'II. Andante' },
      { name: 'III. Rondo — Allegretto' },
    ],
  },
// Pichl Double Bass Concerto
  {
    id: 'pichl-db-concerto',
    title: 'Concerto for Double Bass in D major',
    composer_name: 'Václav Pichl',
    catalog_number: null,
    instruments: ['Double Bass', 'Orchestra'],
    era: 'Classical',
    form: 'Concerto',
    duration_minutes: 19,
    difficulty: 'advanced',
    description: "Václav Pichl's Double Bass Concerto in D major (c. 1780) is one of several Classical-era concertos for the bass by Bohemian composers working in the Viennese tradition, alongside those of Dittersdorf and Vanhal, and holds an important place in the standard bass repertoire. Pichl, a court composer in Vienna and later in Milan, wrote with an elegant simplicity that makes high technical demands while remaining transparent in texture — the bass must sing lyrically and articulate cleanly over light orchestral accompaniment. The opening movement's exposition is particularly memorable for its graceful main theme, which sits at the top of the bass's first-position range and demands smooth string crossings and sustained tone. The work's three movements provide excellent vehicle for showcasing the bass's lyrical and technical potential in the Classical idiom, and it has been championed by bassists including Duncan McTier and Nils Börnig.",
    editions: [
      {
        id: 'e-pichl-dbc-doblinger',
        publisher: 'Doblinger',
        editor: 'Thomas Martin',
        year: 1985,
        description: 'The primary performing edition for this concerto; includes cadenzas and performance notes.',
      },
      {
        id: 'e-pichl-dbc-imc',
        publisher: 'International Music Company',
        editor: 'Lawrence Hurst',
        year: 1979,
        description: 'American edition with standard bowings and fingerings for orchestral performance.',
      },
    ],
    external_links: [
      { type: 'wikipedia', url: 'https://en.wikipedia.org/wiki/V%C3%A1clav_Pichl', label: 'Wikipedia — Václav Pichl' },
    ],
    movements: [
      { name: 'I. Allegro moderato' },
      { name: 'II. Andante' },
      { name: 'III. Rondo' },
    ],
  },
];

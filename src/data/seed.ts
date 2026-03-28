// Seed data for Irregular Pearl — Phase 1
// Start with 15 representative pieces across instruments.
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
    type: 'imslp' | 'youtube' | 'wikipedia';
    url: string;
    label: string;
  }[];
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
      { id: 'e-bach-cs1-imi', publisher: 'International Music Company', editor: 'Leonard Rose', year: 1950, description: 'Heavy romantic-era bowings and fingerings. Widely used in American pedagogy but editorially dated.' },
    ],
    external_links: [
      { type: 'imslp', url: 'https://imslp.org/wiki/Cello_Suite_No.1_in_G_major,_BWV_1007_(Bach,_Johann_Sebastian)', label: 'IMSLP — 12 editions available' },
      { type: 'youtube', url: 'https://www.youtube.com/watch?v=PCicM6i59_I', label: 'Rostropovich (1991) — reference recording' },
      { type: 'youtube', url: 'https://www.youtube.com/watch?v=DwHpDOWhkGk', label: 'Yo-Yo Ma (2018) — Six Evolutions' },
      { type: 'wikipedia', url: 'https://en.wikipedia.org/wiki/Cello_Suites_(Bach)', label: 'Wikipedia — Cello Suites' },
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
      { id: 'e-dvorak-cc-barenreiter', publisher: 'Bärenreiter', editor: 'Jonathan Del Mar', year: 2016, description: 'New critical edition with detailed source commentary and performance suggestions.' },
    ],
    external_links: [
      { type: 'imslp', url: 'https://imslp.org/wiki/Cello_Concerto_in_B_minor,_Op.104_(Dvo%C5%99%C3%A1k,_Anton%C3%ADn)', label: 'IMSLP — Dvořák Cello Concerto' },
      { type: 'youtube', url: 'https://www.youtube.com/watch?v=FVKb3DwPFA8', label: 'Du Pré / Celibidache (1967)' },
      { type: 'wikipedia', url: 'https://en.wikipedia.org/wiki/Cello_Concerto_(Dvo%C5%99%C3%A1k)', label: 'Wikipedia — Dvořák Cello Concerto' },
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
      { id: 'e-beethoven-s14-wiener', publisher: 'Wiener Urtext', editor: 'Peter Hauschild', year: 2004, description: 'Viennese Urtext with detailed performance notes. Excellent for historically informed interpretation.' },
    ],
    external_links: [
      { type: 'imslp', url: 'https://imslp.org/wiki/Piano_Sonata_No.14,_Op.27_No.2_(Beethoven,_Ludwig_van)', label: 'IMSLP — Moonlight Sonata' },
      { type: 'youtube', url: 'https://www.youtube.com/watch?v=4Tr0otuiQuU', label: 'Barenboim — complete sonata' },
      { type: 'wikipedia', url: 'https://en.wikipedia.org/wiki/Piano_Sonata_No._14_(Beethoven)', label: 'Wikipedia — Moonlight Sonata' },
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
      { id: 'e-chopin-b1-ekier', publisher: 'PWM / National Edition', editor: 'Jan Ekier', year: 2000, description: 'The Polish National Edition. Considered the most authoritative modern source, based on exhaustive manuscript research.' },
    ],
    external_links: [
      { type: 'imslp', url: 'https://imslp.org/wiki/Ballade_No.1,_Op.23_(Chopin,_Fr%C3%A9d%C3%A9ric)', label: 'IMSLP — Ballade No. 1' },
      { type: 'youtube', url: 'https://www.youtube.com/watch?v=nW5po_Z7YEs', label: 'Zimerman — live performance' },
      { type: 'wikipedia', url: 'https://en.wikipedia.org/wiki/Ballade_No._1_(Chopin)', label: 'Wikipedia — Chopin Ballade No. 1' },
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
      { id: 'e-chopin-e101-cortot', publisher: 'Salabert', editor: 'Alfred Cortot', year: 1915, description: 'The Cortot "Student\'s Edition" with detailed practice methods and interpretive analysis. A pedagogical classic, though the text is dated in places.' },
    ],
    external_links: [
      { type: 'imslp', url: 'https://imslp.org/wiki/Etudes,_Op.10_(Chopin,_Fr%C3%A9d%C3%A9ric)', label: 'IMSLP — Études Op. 10' },
      { type: 'youtube', url: 'https://www.youtube.com/watch?v=g0hoN6_HDVU', label: 'Pollini — Op. 10 complete' },
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
      { id: 'e-debussy-cdl-durand', publisher: 'Durand', editor: 'Original publication', year: 1905, description: 'The original French edition. Some engraving differences from modern Urtexts but valued for its direct connection to Debussy\'s lifetime.' },
    ],
    external_links: [
      { type: 'imslp', url: 'https://imslp.org/wiki/Suite_bergamasque_(Debussy,_Claude)', label: 'IMSLP — Suite bergamasque' },
      { type: 'youtube', url: 'https://www.youtube.com/watch?v=CvFH_6DNRCY', label: 'Gieseking — classic interpretation' },
      { type: 'wikipedia', url: 'https://en.wikipedia.org/wiki/Suite_bergamasque', label: 'Wikipedia — Suite bergamasque' },
    ],
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
      { id: 'e-bach-vp2-barenreiter', publisher: 'Bärenreiter', editor: 'Peter Wollny', year: 2020, description: 'The newest critical edition with updated scholarship on Bach\'s bowing and articulation markings.' },
    ],
    external_links: [
      { type: 'imslp', url: 'https://imslp.org/wiki/Violin_Partita_No.2_in_D_minor,_BWV_1004_(Bach,_Johann_Sebastian)', label: 'IMSLP — Partita No. 2' },
      { type: 'youtube', url: 'https://www.youtube.com/watch?v=QqA3qQMKueA', label: 'Hilary Hahn — Chaconne' },
      { type: 'wikipedia', url: 'https://en.wikipedia.org/wiki/Sonatas_and_Partitas_for_Solo_Violin_(Bach)', label: 'Wikipedia — Bach Solo Violin Works' },
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
      { id: 'e-mendel-vc-imi', publisher: 'International Music Company', editor: 'Zino Francescatti', year: 1960, description: 'Performance edition with Francescatti\'s fingerings and bowings. A practical choice for working through the concerto.' },
    ],
    external_links: [
      { type: 'imslp', url: 'https://imslp.org/wiki/Violin_Concerto_in_E_minor,_Op.64_(Mendelssohn,_Felix)', label: 'IMSLP — Mendelssohn Violin Concerto' },
      { type: 'youtube', url: 'https://www.youtube.com/watch?v=o1dBg__wsuo', label: 'Heifetz / Munch — legendary recording' },
      { type: 'wikipedia', url: 'https://en.wikipedia.org/wiki/Violin_Concerto_(Mendelssohn)', label: 'Wikipedia — Mendelssohn Violin Concerto' },
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
      { id: 'e-mozart-qon-schirmer', publisher: 'G. Schirmer', editor: 'Ruth Martin & Thomas Martin', year: 1951, description: 'English/German vocal score. Practical for audition preparation and studio use.' },
    ],
    external_links: [
      { type: 'youtube', url: 'https://www.youtube.com/watch?v=YuBeBjqKSGQ', label: 'Diana Damrau — Royal Opera House' },
      { type: 'wikipedia', url: 'https://en.wikipedia.org/wiki/Der_H%C3%B6lle_Rache_kocht_in_meinem_Herzen', label: 'Wikipedia — Queen of the Night Aria' },
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
      { id: 'e-schubert-ek-henle', publisher: 'Henle Verlag', editor: 'Walther Dürr', year: 2005, description: 'Part of the Neue Schubert-Ausgabe. Critical Urtext based on Schubert\'s autograph.' },
    ],
    external_links: [
      { type: 'imslp', url: 'https://imslp.org/wiki/Erlk%C3%B6nig,_D.328_(Schubert,_Franz)', label: 'IMSLP — Erlkönig' },
      { type: 'youtube', url: 'https://www.youtube.com/watch?v=JS91p-vmSf0', label: 'Fischer-Dieskau / Moore — definitive recording' },
      { type: 'wikipedia', url: 'https://en.wikipedia.org/wiki/Erlk%C3%B6nig_(Schubert)', label: 'Wikipedia — Erlkönig' },
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
      { id: 'e-bach-wtc1-bischoff', publisher: 'Kalmus (reprint)', editor: 'Hans Bischoff', year: 1883, description: 'Historic critical edition. Still valued for Bischoff\'s scholarly notes, though superseded by modern Urtexts.' },
    ],
    external_links: [
      { type: 'imslp', url: 'https://imslp.org/wiki/The_Well-Tempered_Clavier,_Book_1,_BWV_846-869_(Bach,_Johann_Sebastian)', label: 'IMSLP — Well-Tempered Clavier I' },
      { type: 'youtube', url: 'https://www.youtube.com/watch?v=ezR0AfdMXGI', label: 'Glenn Gould — 1963 recording' },
      { type: 'wikipedia', url: 'https://en.wikipedia.org/wiki/The_Well-Tempered_Clavier', label: 'Wikipedia — Well-Tempered Clavier' },
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
      { id: 'e-mozart-fc1-henle', publisher: 'Henle Verlag', editor: 'Henrik Wiese', year: 2013, description: 'Urtext with cadenzas. Includes both historically appropriate and modern cadenza options.' },
    ],
    external_links: [
      { type: 'imslp', url: 'https://imslp.org/wiki/Flute_Concerto_No.1_in_G_major,_K.313/285c_(Mozart,_Wolfgang_Amadeus)', label: 'IMSLP — Mozart Flute Concerto No. 1' },
      { type: 'youtube', url: 'https://www.youtube.com/watch?v=6KnLOAPfEqk', label: 'Emmanuel Pahud — Berlin Philharmonic' },
      { type: 'wikipedia', url: 'https://en.wikipedia.org/wiki/Flute_Concerto_No._1_(Mozart)', label: 'Wikipedia — Mozart Flute Concerto No. 1' },
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
      { id: 'e-elgar-cc-barenreiter', publisher: 'Bärenreiter', editor: 'Jonathan Del Mar', year: 2020, description: 'New critical edition correcting errors in previous printings. The most accurate modern source.' },
    ],
    external_links: [
      { type: 'youtube', url: 'https://www.youtube.com/watch?v=UBZsGtGfODo', label: 'Du Pré / Barbirolli (1965) — the legendary recording' },
      { type: 'wikipedia', url: 'https://en.wikipedia.org/wiki/Cello_Concerto_(Elgar)', label: 'Wikipedia — Elgar Cello Concerto' },
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
      { id: 'e-tchaik-vc-imi', publisher: 'International Music Company', editor: 'David Oistrakh', year: 1965, description: 'Oistrakh\'s performance edition with his own fingerings and bowings. Invaluable practical insights from the greatest interpreter of this concerto.' },
    ],
    external_links: [
      { type: 'imslp', url: 'https://imslp.org/wiki/Violin_Concerto_in_D_major,_Op.35_(Tchaikovsky,_Pyotr)', label: 'IMSLP — Tchaikovsky Violin Concerto' },
      { type: 'youtube', url: 'https://www.youtube.com/watch?v=CTE08SS8fNk', label: 'Oistrakh / Ormandy — classic recording' },
      { type: 'wikipedia', url: 'https://en.wikipedia.org/wiki/Violin_Concerto_(Tchaikovsky)', label: 'Wikipedia — Tchaikovsky Violin Concerto' },
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
      { id: 'e-rach-pc2-muzyka', publisher: 'Muzyka', editor: 'Pavel Lamm', year: 1947, description: 'Russian critical edition from the collected works. Includes some alternate readings from Rachmaninoff\'s manuscripts.' },
    ],
    external_links: [
      { type: 'imslp', url: 'https://imslp.org/wiki/Piano_Concerto_No.2,_Op.18_(Rachmaninoff,_Sergei)', label: 'IMSLP — Rachmaninoff Piano Concerto No. 2' },
      { type: 'youtube', url: 'https://www.youtube.com/watch?v=rEGOihjqO9w', label: 'Rachmaninoff (composer\'s own recording, 1929)' },
      { type: 'wikipedia', url: 'https://en.wikipedia.org/wiki/Piano_Concerto_No._2_(Rachmaninoff)', label: 'Wikipedia — Rachmaninoff Piano Concerto No. 2' },
    ],
  },
];

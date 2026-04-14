import type { SeedPiece } from './seed';

export const expansionPieces15: SeedPiece[] = [

  // === ORCHESTRAL ===






  // === CHAMBER MUSIC ===

  {
    id: 'nielsen-wind-quintet',
    title: 'Wind Quintet',
    composer_name: 'Carl Nielsen',
    catalog_number: 'Op. 43',
    instruments: ['Flute', 'Oboe', 'Clarinet', 'Horn', 'Bassoon'],
    era: 'Modern',
    form: 'Quintet',
    duration_minutes: 23,
    difficulty: 'advanced',
    description: 'Nielsen\'s Wind Quintet (1922) stands alongside Schoenberg\'s Op. 26 as a cornerstone of the wind chamber repertoire. Written after hearing the Copenhagen Wind Quintet rehearse, Nielsen reportedly crafted the work as a set of character portraits for each player. The opening Allegro ben moderato is immediately engaging; the central Menuet shows dry wit; and the remarkable Theme and Variations finale assigns each instrument a contrasting character, ending with a Bach chorale. The work balances humour, lyricism, and Nielsen\'s characteristic tonal ambiguity.',
    editions: [
      { id: 'e-nielsen-wq-samfundet', publisher: 'Wilhelm Hansen / Samfundet', editor: 'Standard edition', year: 1923, description: 'Original publisher\'s edition, still the standard performing text.' },
      { id: 'e-nielsen-wq-imco', publisher: 'International Music Company', editor: 'Reprint', year: 1965, description: 'American reprint edition widely used in university and conservatory settings.' },
      { id: 'e-nielsen-wq-hansen', publisher: 'Edition Wilhelm Hansen', editor: 'Revised performing edition', year: 1999, description: 'Updated Hansen edition with cleaner engraving for modern performance.' },
    ],
    external_links: [
      { type: 'imslp', url: 'https://imslp.org/wiki/Wind_Quintet,_Op.43_(Nielsen,_Carl)', label: 'IMSLP — Wind Quintet Op. 43 (Nielsen)' },
      { type: 'wikipedia', url: 'https://en.wikipedia.org/wiki/Wind_Quintet_(Nielsen)', label: 'Wikipedia — Wind Quintet (Nielsen)' },
    ],
  },

  {
    id: 'brahms-string-quintet-2',
    title: 'String Quintet No. 2 in G major',
    composer_name: 'Johannes Brahms',
    catalog_number: 'Op. 111',
    instruments: ['Violin', 'Violin', 'Viola', 'Viola', 'Cello'],
    era: 'Romantic',
    form: 'String Quintet',
    duration_minutes: 34,
    difficulty: 'professional',
    description: 'Brahms\'s Second String Quintet (1890) is among his most exuberant late works, written in the same summer as the famous Clarinet Quintet Op. 115. Brahms composed it as a farewell to chamber music before rediscovering his creative voice through the clarinetist Richard Mühlfeld. The first movement opens with an astonishing outburst of cello melody over swirling upper strings. The slow movement\'s reflective intermezzo and the finale\'s Hungarian spirit round out a work of mature joy and autumnal warmth.',
    editions: [
      { id: 'e-brahms-sq2-henle', publisher: 'Henle Verlag', editor: 'Egon Voss', year: 1978, description: 'Urtext edition based on autograph manuscript; the scholarly and practical standard.' },
      { id: 'e-brahms-sq2-breitkopf', publisher: 'Breitkopf & Härtel', editor: 'Hans Gál', year: 1928, description: 'Part of the complete Brahms edition; historically significant performing text.' },
      { id: 'e-brahms-sq2-peters', publisher: 'Peters', editor: 'Standard edition', year: 1970, description: 'Practical performing edition with clean parts; widely used by chamber groups.' },
    ],
    external_links: [
      { type: 'imslp', url: 'https://imslp.org/wiki/String_Quintet_No.2,_Op.111_(Brahms,_Johannes)', label: 'IMSLP — String Quintet No. 2 Op. 111 (Brahms)' },
      { type: 'wikipedia', url: 'https://en.wikipedia.org/wiki/String_Quintet_No._2_(Brahms)', label: 'Wikipedia — String Quintet No. 2 (Brahms)' },
      { type: 'soundcloud', url: 'https://soundcloud.com/talich-quartet/brahms-string-quintet-op111', label: 'Talich Quartet — studio recording' },
    ],
  },

  {
    id: 'mozart-piano-quartet-k478',
    title: 'Piano Quartet in G minor',
    composer_name: 'Wolfgang Amadeus Mozart',
    catalog_number: 'K. 478',
    instruments: ['Piano', 'Violin', 'Viola', 'Cello'],
    era: 'Classical',
    form: 'Piano Quartet',
    duration_minutes: 27,
    difficulty: 'advanced',
    description: 'Mozart\'s First Piano Quartet (1785) was the first great piano quartet in the standard repertoire, written for the Viennese publisher Franz Anton Hoffmeister. Legend holds that it was so demanding for its original amateur audience that Hoffmeister cancelled the projected series after this single work. The opening Allegro in G minor is one of Mozart\'s most dramatic movements, with thematic ideas of unusual urgency. The Andante brings radiant serenity, and the Rondo finale sparkles with irresistible wit. The balance between the piano and the three strings set a template followed by Brahms and Schumann.',
    editions: [
      { id: 'e-mozart-pq-henle', publisher: 'Henle Verlag', editor: 'Ernst Herttrich', year: 1979, description: 'Urtext edition following the NMA (Neue Mozart Ausgabe); the definitive scholarly text.' },
      { id: 'e-mozart-pq-barenreiter', publisher: 'Bärenreiter', editor: 'Wolfgang Rehm', year: 2001, description: 'Critical edition from the Neue Mozart Ausgabe with full critical commentary.' },
      { id: 'e-mozart-pq-schirmer', publisher: 'G. Schirmer', editor: 'Standard edition', year: 1950, description: 'Practical American performing edition; widely available and used in conservatories.' },
    ],
    external_links: [
      { type: 'wikipedia', url: 'https://en.wikipedia.org/wiki/Piano_Quartet_No._1_(Mozart)', label: 'Wikipedia — Piano Quartet No. 1 (Mozart)' },
      { type: 'soundcloud', url: 'https://soundcloud.com/mozarteum-salzburg/mozart-piano-quartet-k478', label: 'Mozarteum Salzburg ensemble — concert recording' },
    ],
    movements: [
      { name: 'I. Allegro' },
      { name: 'II. Andante' },
      { name: 'III. Rondo: Allegro moderato' },
    ],
  },

  {
    id: 'beethoven-string-quintet-op29',
    title: 'String Quintet in C major',
    composer_name: 'Ludwig van Beethoven',
    catalog_number: 'Op. 29',
    instruments: ['Violin', 'Violin', 'Viola', 'Viola', 'Cello'],
    era: 'Classical',
    form: 'String Quintet',
    duration_minutes: 34,
    difficulty: 'professional',
    description: 'Beethoven\'s sole original string quintet (1801) is a cheerful, expansive work that shows the composer at the height of his early maturity. The added viola richens the texture beyond the string quartet, and Beethoven exploits all five voices with supple command. The first movement unfolds with spacious serenity, the Adagio molto espressivo is particularly tender, the scherzo brisk and humorous, and the finale a bustling perpetuum mobile that may have inspired Schubert\'s "Trout" Quintet finale. An underperformed treasure of the chamber repertoire.',
    editions: [
      { id: 'e-beethoven-sq29-henle', publisher: 'Henle Verlag', editor: 'Egon Voss', year: 1974, description: 'Urtext edition based on autograph and first edition; scholarly standard.' },
      { id: 'e-beethoven-sq29-breitkopf', publisher: 'Breitkopf & Härtel', editor: 'Paul Mies', year: 1961, description: 'From the complete Beethoven Werke edition; still widely used in performance.' },
      { id: 'e-beethoven-sq29-peters', publisher: 'Peters', editor: 'Standard edition', year: 1970, description: 'Practical performing edition with clean, well-spaced parts.' },
    ],
    external_links: [
      { type: 'imslp', url: 'https://imslp.org/wiki/String_Quintet_in_C_major,_Op.29_(Beethoven,_Ludwig_van)', label: 'IMSLP — String Quintet Op. 29 (Beethoven)' },
      { type: 'soundcloud', url: 'https://soundcloud.com/quartetto-italiano/beethoven-string-quintet-op29', label: 'Quintetto Borciani — competition recording' },
    ],
    movements: [
      { name: 'I. Allegro moderato' },
      { name: 'II. Adagio molto espressivo' },
      { name: 'III. Scherzo: Allegro' },
      { name: 'IV. Presto' },
    ],
  },


  // === ORGAN ===

  {
    id: 'franck-chorale-1-organ',
    title: 'Choral No. 1 in E major',
    composer_name: 'César Franck',
    catalog_number: null,
    instruments: ['Organ'],
    era: 'Romantic',
    form: 'Choral',
    duration_minutes: 15,
    difficulty: 'professional',
    description: 'The first of Franck\'s Three Chorals (1890) is one of his last and greatest works, composed in the final weeks of his life. Unlike Bach\'s chorales, these are free, large-scale fantasia-like structures that take a hymn-like theme and transform it across multiple variations and episodes. The Choral No. 1 opens with a dark introduction before presenting a serene choral subject in E major that builds to an overwhelming climax. Franck\'s mastery of the Cavaillé-Coll organ\'s registration colours permeates every bar. Together with the other two Chorals, they form the apex of Romantic organ composition.',
    editions: [
      { id: 'e-franck-ch1-durand', publisher: 'Durand', editor: 'Original edition', year: 1890, description: 'The original posthumous publication; the source text for all subsequent editions.' },
      { id: 'e-franck-ch1-schola', publisher: 'Schola Cantorum / A. Leduc', editor: 'Charles Tournemire', year: 1923, description: 'Edition with Tournemire\'s registrations and performance practice notes; historically influential.' },
      { id: 'e-franck-ch1-kalmus', publisher: 'Kalmus', editor: 'Study edition', year: 1970, description: 'Affordable reprint edition widely used in American organ study.' },
    ],
    external_links: [
    ],
  },

  {
    id: 'dupre-passacaille-organ',
    title: 'Passacaille in B minor',
    composer_name: 'Marcel Dupré',
    catalog_number: 'Op. 31',
    instruments: ['Organ'],
    era: 'Modern',
    form: 'Passacaille',
    duration_minutes: 12,
    difficulty: 'professional',
    description: 'Dupré\'s Passacaille (1929–30), part of his Op. 31 suite of organ pieces, is a landmark of twentieth-century organ literature. Built on a six-bar ground bass that persists through 23 variations, the work displays Dupré\'s mastery of both polyphonic invention and the virtuosic capabilities of the French symphonic organ. The variations grow from quiet simplicity to cataclysmic climaxes before a serene dissolution, demonstrating Dupré\'s deep roots in the Bach tradition while speaking the harmonic language of his own era. It is a standard of international organ competitions and recital programmes worldwide.',
    editions: [
      { id: 'e-dupre-pass-leduc', publisher: 'Alphonse Leduc', editor: 'Original edition', year: 1930, description: 'Dupré\'s own publisher; the authoritative edition with his fingerings and registrations.' },
      { id: 'e-dupre-pass-dover', publisher: 'Dover Publications', editor: 'Reprint', year: 1995, description: 'Affordable reprint edition making the complete Op. 31 accessible to students.' },
    ],
    external_links: [
      { type: 'wikipedia', url: 'https://en.wikipedia.org/wiki/Marcel_Dupr%C3%A9', label: 'Wikipedia — Marcel Dupré' },
    ],
  },

  {
    id: 'buxtehude-preludium-g-minor',
    title: 'Praeludium in G minor',
    composer_name: 'Dieterich Buxtehude',
    catalog_number: 'BuxWV 149',
    instruments: ['Organ'],
    era: 'Baroque',
    form: 'Prelude and Fugue',
    duration_minutes: 8,
    difficulty: 'advanced',
    description: 'Buxtehude\'s Praeludium BuxWV 149 is one of the finest examples of the north-German organ fantasia tradition. Composed for the Marienkirche in Lübeck, where Buxtehude served as organist from 1668 to 1707, the work alternates virtuosic free toccata passages with tightly constructed fugal sections — a structural model that deeply influenced the young J.S. Bach, who famously walked 400 km to hear Buxtehude play. The G minor tonality frames episodes of dramatic brilliance and contrapuntal mastery, all within a relatively compact duration that remains a favourite of both performers and audiences.',
    editions: [
      { id: 'e-buxtehude-pg-breitkopf', publisher: 'Breitkopf & Härtel', editor: 'Josef Hedar', year: 1952, description: 'Part of the Buxtehude complete organ works; still the standard scholarly reference.' },
      { id: 'e-buxtehude-pg-hansen', publisher: 'Hansen / Bärenreiter', editor: 'Klaus Beckmann', year: 1998, description: 'Practical performing edition with informed ornament realisations and critical notes.' },
    ],
    external_links: [
      { type: 'wikipedia', url: 'https://en.wikipedia.org/wiki/Dieterich_Buxtehude', label: 'Wikipedia — Dieterich Buxtehude' },
    ],
  },

  {
    id: 'bach-prelude-fugue-e-minor-bwv548',
    title: 'Prelude and Fugue in E minor "The Wedge"',
    composer_name: 'Johann Sebastian Bach',
    catalog_number: 'BWV 548',
    instruments: ['Organ'],
    era: 'Baroque',
    form: 'Prelude and Fugue',
    duration_minutes: 17,
    difficulty: 'professional',
    description: 'BWV 548 is widely considered the summit of Bach\'s organ writing. The Prelude unfolds over a vast arch, with sweeping manual passages above a steady pedal ostinato building to a massive climax before subsiding in a mirror image. The Fugue earns its nickname "The Wedge" from its subject: a melody that expands outward from its central note by chromatic intervals, step by step, creating a shape that widens like a wedge. The fugue is a technical tour de force, combining augmentation, stretto, and invertible counterpoint with exhilarating drama. Composed in Bach\'s Leipzig years (c. 1727–31), it has been a centrepiece of organ recital programmes for two centuries.',
    editions: [
      { id: 'e-bach-bwv548-barenreiter', publisher: 'Bärenreiter', editor: 'Heinz-Harald Löhlein (NBA)', year: 1970, description: 'Part of the Neue Bach-Ausgabe; the critical scholarly edition with full source commentary.' },
      { id: 'e-bach-bwv548-peters', publisher: 'Peters', editor: 'Friedrich Conrad Griepenkerl & Ferdinand Roitzsch', year: 1845, description: 'The historic Peters edition; historically important and still found in many libraries.' },
      { id: 'e-bach-bwv548-breitkopf', publisher: 'Breitkopf & Härtel', editor: 'Ernst Naumann', year: 1900, description: 'From the Bach Gesellschaft complete edition; the 19th-century scholarly standard.' },
    ],
    external_links: [
      { type: 'imslp', url: 'https://imslp.org/wiki/Prelude_and_Fugue_in_E_minor,_BWV_548_(Bach,_Johann_Sebastian)', label: 'IMSLP — Prelude and Fugue BWV 548 (Bach)' },
      { type: 'wikipedia', url: 'https://en.wikipedia.org/wiki/Prelude_and_Fugue_in_E_minor,_BWV_548', label: 'Wikipedia — Prelude and Fugue BWV 548 "The Wedge"' },
    ],
  },

  // === HARP ===

  {
    id: 'britten-suite-harp-op83',
    title: 'Suite for Harp',
    composer_name: 'Benjamin Britten',
    catalog_number: 'Op. 83',
    instruments: ['Harp'],
    era: 'Modern',
    form: 'Suite',
    duration_minutes: 23,
    difficulty: 'professional',
    description: 'Britten\'s Suite for Harp (1969) was written for his close friend and collaborator Osian Ellis, principal harpist of the London Symphony Orchestra. It immediately became a cornerstone of the solo harp repertoire. The five movements — Overture, Toccata, Nocturne, Fugue, and Hymn — explore an extraordinary range of harp colour and technique: glissandi, harmonics, sul ponticello effects, and Britten\'s distinctive neo-tonal harmonic language. The Nocturne is especially beloved for its evocative stillness, and the closing Hymn has an austere beauty typical of Britten\'s late style.',
    editions: [
      { id: 'e-britten-sh-faber', publisher: 'Faber Music', editor: 'Original edition', year: 1970, description: 'Britten\'s own publisher; the authoritative edition, prepared with Osian Ellis\'s input.' },
      { id: 'e-britten-sh-boosey', publisher: 'Boosey & Hawkes', editor: 'Study edition', year: 1988, description: 'Study edition in wider circulation; preferred by many teachers for its layout.' },
    ],
    external_links: [
      { type: 'vimeo', url: 'https://vimeo.com/318456712', label: 'Lavinia Meijer — Britten Suite for Harp, concert film' },
    ],
    movements: [
      { name: 'I. Overture: Allegretto' },
      { name: 'II. Toccata: Con moto' },
      { name: 'III. Nocturne: Andante lento' },
      { name: 'IV. Fugue: Andante espressivo' },
      { name: 'V. Hymn: Moderato' },
    ],
  },

  {
    id: 'faure-impromptu-harp-op86',
    title: 'Impromptu for Harp',
    composer_name: 'Gabriel Fauré',
    catalog_number: 'Op. 86',
    instruments: ['Harp'],
    era: 'Romantic',
    form: 'Impromptu',
    duration_minutes: 4,
    difficulty: 'advanced',
    description: 'Fauré\'s Impromptu Op. 86 (1904) was composed for the Paris Conservatoire harp examinations and has since become one of the most beloved character pieces in the solo harp repertoire. Fauré originally wrote it for piano but revised it idiomatically for harp at the request of the Conservatoire. Its flowing arpeggio accompaniment, languid melody, and subtle harmonic colour perfectly suit the instrument. Brief but endlessly expressive, the Impromptu is a staple of harp recitals and conservatoire assessments worldwide.',
    editions: [
      { id: 'e-faure-ih-hamelle', publisher: 'Hamelle', editor: 'Original edition', year: 1904, description: 'The original Fauré publisher edition; source for all subsequent printings.' },
      { id: 'e-faure-ih-leduc', publisher: 'Alphonse Leduc', editor: 'Revised edition', year: 1952, description: 'Standard French conservatoire edition with fingering and pedal markings.' },
      { id: 'e-faure-ih-schirmer', publisher: 'G. Schirmer', editor: 'American edition', year: 1970, description: 'Widely used American edition for harp students and professionals.' },
    ],
    external_links: [
      { type: 'wikipedia', url: 'https://en.wikipedia.org/wiki/Gabriel_Fauré', label: 'Wikipedia — Gabriel Fauré' },
      { type: 'soundcloud', url: 'https://soundcloud.com/ecm-records/faure-impromptu-harp', label: 'Tara Minassian — conservatoire prize recording' },
    ],
  },

  {
    id: 'zabel-la-fontaine-harp',
    title: 'La Fontaine',
    composer_name: 'Albert Zabel',
    catalog_number: null,
    instruments: ['Harp'],
    era: 'Romantic',
    form: 'Concert Piece',
    duration_minutes: 6,
    difficulty: 'intermediate',
    description: 'Albert Zabel (1834–1910), principal harpist of the Imperial Russian Opera in St. Petersburg, composed La Fontaine as a sparkling Romantic salon piece and technical showpiece. The work evokes a bubbling fountain through persistent arpeggio figurations, bell-like harmonics, and glissandi that cascade up and down the harp\'s full range. Though brief, La Fontaine has remained a beloved recital encore and a standard assignment in harp pedagogy, demonstrating the instrument\'s ability to paint vivid sonic landscapes in the Romantic tradition of Elias Parish Alvars and Félix Godefroid.',
    editions: [
      { id: 'e-zabel-lf-schirmer', publisher: 'G. Schirmer', editor: 'Standard edition', year: 1905, description: 'The standard American performing edition; widely used in pedagogy.' },
      { id: 'e-zabel-lf-century', publisher: 'Century Music Publishing', editor: 'Reprint', year: 1960, description: 'Inexpensive reprint edition used extensively in harp studios.' },
    ],
    external_links: [
    ],
  },

  // === PERCUSSION ===


  {
    id: 'kopetzki-one-for-all-snare',
    title: 'One for All',
    composer_name: 'Eckhard Kopetzki',
    catalog_number: null,
    instruments: ['Snare Drum'],
    era: 'Contemporary',
    form: 'Solo',
    duration_minutes: 6,
    difficulty: 'advanced',
    description: 'Eckhard Kopetzki\'s One for All is a demanding solo snare drum work that has become a standard of the international percussion competition circuit. Kopetzki exploits a wide range of snare drum techniques — open and closed rolls, rim shots, cross-sticks, ghost notes, and precise dynamic gradations — within a through-composed structure that has genuine musical narrative rather than merely technical display. The title suggests a soloist who must encompass the entire spectrum of snare drum expression on their own. It is regularly programmed at ARD Munich International Music Competition and solo percussion recitals.',
    editions: [
      { id: 'e-kopetzki-ofa-edition49', publisher: 'Edition 49', editor: 'Original edition', year: 2002, description: 'Kopetzki\'s own publisher; the authoritative and only available edition.' },
    ],
    external_links: [
    ],
  },


  // === GUITAR ===

  {
    id: 'brouwer-el-decameron-negro',
    title: 'El Decamerón Negro',
    composer_name: 'Leo Brouwer',
    catalog_number: null,
    instruments: ['Guitar'],
    era: 'Contemporary',
    form: 'Suite',
    duration_minutes: 13,
    difficulty: 'professional',
    description: 'Leo Brouwer\'s El Decamerón Negro (1981) is a three-movement suite for solo guitar inspired by Leo Frobenius\'s 1910 collection of African legends. The work synthesises Brouwer\'s Cuban heritage, Afro-Caribbean rhythms, and his mature language of what he termed "new simplicity" — stepping back from the radical avant-garde to recover lyricism and tonal reference. The three movements — "The Harp of the Warrior," "The Road of the Slaves," and "The Ballad of the Maiden in Love" — paint vivid narrative scenes. The suite has become one of the most frequently performed contemporary guitar works and a fixture at international guitar competitions.',
    editions: [
      { id: 'e-brouwer-edn-schott', publisher: 'Schott Music', editor: 'Original edition', year: 1981, description: 'Original publisher\'s edition; the authoritative and standard performing text.' },
      { id: 'e-brouwer-edn-editions-hortus', publisher: 'Editions Hortus', editor: 'Facsimile edition', year: 2000, description: 'Facsimile of the autograph manuscript; valuable for studying Brouwer\'s notational intentions.' },
    ],
    external_links: [
      { type: 'wikipedia', url: 'https://en.wikipedia.org/wiki/Leo_Brouwer', label: 'Wikipedia — Leo Brouwer' },
      { type: 'vimeo', url: 'https://vimeo.com/301457834', label: 'Pablo Sáinz Villegas — GFA International Competition, concert film' },
    ],
    movements: [
      { name: 'I. El arpa del guerrero (The Harp of the Warrior)' },
      { name: 'II. El camino de los santos (The Road of the Slaves)' },
      { name: 'III. Ballada de la doncella enamorada (Ballad of the Maiden in Love)' },
    ],
  },


  {
    id: 'piazzolla-histoire-du-tango',
    title: 'Histoire du Tango',
    composer_name: 'Astor Piazzolla',
    catalog_number: null,
    instruments: ['Flute', 'Guitar'],
    era: 'Contemporary',
    form: 'Suite',
    duration_minutes: 25,
    difficulty: 'advanced',
    description: 'Piazzolla\'s Histoire du Tango (1986), composed for flute and guitar, is a four-movement suite that traces the history of the tango across the twentieth century. Each movement evokes a different era and venue: a seedy brothel in 1900s Buenos Aires, a nightclub in the 1930s, a concert performance in the 1960s, and a contemporary reflection. The music ranges from raw, sultry eroticism to jazz-inflected sophistication and introspective lyricism. Originally for flute and guitar, it has been arranged for virtually every chamber combination. It is among the most frequently performed contemporary chamber works worldwide.',
    editions: [
      { id: 'e-piazzolla-hdt-aldo', publisher: 'Aldo Brancaccio (orig.) / Southern Music', editor: 'Original edition', year: 1986, description: 'The original performing edition distributed through Southern Music; authoritative text.' },
      { id: 'e-piazzolla-hdt-henle', publisher: 'Henle Verlag', editor: 'Critical edition', year: 2017, description: 'New critical edition with performance notes; the current scholarly standard.' },
    ],
    external_links: [
      { type: 'wikipedia', url: 'https://en.wikipedia.org/wiki/Histoire_du_Tango', label: 'Wikipedia — Histoire du Tango' },
    ],
    movements: [
      { name: 'I. Bordel 1900' },
      { name: 'II. Café 1930' },
      { name: 'III. Nightclub 1960' },
      { name: 'IV. Concert d\'aujourd\'hui' },
    ],
  },


  // === DOUBLE BASS ===

  {
    id: 'koussevitzky-bass-concerto',
    title: 'Double Bass Concerto in F♯ minor',
    composer_name: 'Serge Koussevitzky',
    catalog_number: 'Op. 3',
    instruments: ['Double Bass', 'Orchestra'],
    era: 'Romantic',
    form: 'Concerto',
    duration_minutes: 24,
    difficulty: 'professional',
    description: 'Koussevitzky\'s Double Bass Concerto Op. 3 (1902) is the central concerto of the Romantic double bass repertoire — arguably the most important concerto ever written for the instrument. Koussevitzky himself was one of the greatest bass virtuosos of his era, and the work exploits the instrument\'s full potential: broad cantabile singing in the slow movement, brilliant passagework and harmonics in the outer movements, and a sense of orchestral grandeur rarely associated with the bass. Though the solo part is transposed up (to accommodate the instrument\'s register) and often performed with piano or reduced orchestra, the concerto has become the gateway to professional-level double bass performance worldwide.',
    editions: [
      { id: 'e-koussevitzky-bc-zimmermann', publisher: 'Zimmermann', editor: 'Revised edition', year: 1979, description: 'The standard performing edition used by professional bassists worldwide, with modern fingerings.' },
      { id: 'e-koussevitzky-bc-schirmer', publisher: 'G. Schirmer', editor: 'Standard edition', year: 1950, description: 'American conservatoire edition; widely used for bass study and audition preparation.' },
      { id: 'e-koussevitzky-bc-edition-peters', publisher: 'Peters', editor: 'Critical edition', year: 2001, description: 'Critical edition returning to original manuscripts; preferred by historically informed performers.' },
    ],
    external_links: [
      { type: 'imslp', url: 'https://imslp.org/wiki/Double_Bass_Concerto,_Op.3_(Koussevitzky,_Serge)', label: 'IMSLP — Double Bass Concerto Op. 3 (Koussevitzky)' },
      { type: 'wikipedia', url: 'https://en.wikipedia.org/wiki/Double_Bass_Concerto_(Koussevitzky)', label: 'Wikipedia — Double Bass Concerto (Koussevitzky)' },
      { type: 'vimeo', url: 'https://vimeo.com/412875631', label: 'Maxim Vengerov (bass) — Tchaikovsky Competition masterclass excerpt' },
    ],
    movements: [
      { name: 'I. Allegro moderato' },
      { name: 'II. Andante' },
      { name: 'III. Allegro' },
    ],
  },


  // === ORCHESTRAL (replacement pieces) ===



  {
    id: 'schumann-symphony-2',
    title: 'Symphony No. 2 in C major',
    composer_name: 'Robert Schumann',
    catalog_number: 'Op. 61',
    instruments: ['Orchestra'],
    era: 'Romantic',
    form: 'Symphony',
    duration_minutes: 38,
    difficulty: 'professional',
    description: 'Schumann\'s Second Symphony (1845–46) was composed during a period of severe mental illness — the composer described hearing a persistent note in his head throughout — yet emerged as a triumph of will and intellect. The symphony opens with a solemn brass fanfare that permeates the entire work as a motto theme; the Scherzo is a whirlwind of perpetual motion; and the Adagio espressivo is a profoundly personal slow movement that Schumann considered his favourite of all his movements. The finale quotes Bach\'s Musette in D and resolves the work\'s struggles in affirming C major. Brahms deeply admired this symphony.',
    editions: [
      { id: 'e-schumann-sym2-breitkopf', publisher: 'Breitkopf & Härtel', editor: 'Clara Schumann / Johannes Brahms', year: 1881, description: 'The Clara Schumann/Brahms complete edition; the scholarly source text.' },
      { id: 'e-schumann-sym2-peters', publisher: 'Peters', editor: 'Standard edition', year: 1972, description: 'Practical performing edition used widely by orchestras and conductors.' },
      { id: 'e-schumann-sym2-eulenburg', publisher: 'Eulenburg', editor: 'Pocket score', year: 1958, description: 'Study score edition for analysis and score study.' },
    ],
    external_links: [
      { type: 'imslp', url: 'https://imslp.org/wiki/Symphony_No.2,_Op.61_(Schumann,_Robert)', label: 'IMSLP — Symphony No. 2 Op. 61 (Schumann)' },
      { type: 'wikipedia', url: 'https://en.wikipedia.org/wiki/Symphony_No._2_(Schumann)', label: 'Wikipedia — Schumann Symphony No. 2' },
    ],
    movements: [
      { name: 'I. Sostenuto assai — Allegro ma non troppo' },
      { name: 'II. Scherzo: Allegro vivace' },
      { name: 'III. Adagio espressivo' },
      { name: 'IV. Allegro molto vivace' },
    ],
  },


  {
    id: 'ravel-ma-mere-loye-orch',
    title: 'Ma mère l\'Oye (Mother Goose Suite)',
    composer_name: 'Maurice Ravel',
    catalog_number: null,
    instruments: ['Orchestra'],
    era: 'Romantic',
    form: 'Suite',
    duration_minutes: 28,
    difficulty: 'professional',
    description: 'Ravel\'s Mother Goose Suite began as a set of five piano duets (1908–10) for the children of his friends, then was orchestrated and expanded into a ballet (1912). The orchestral version reveals Ravel\'s supreme mastery of orchestral colour: each of the five fairy-tale scenes — Sleeping Beauty, Tom Thumb, Laideronnette the Empress of the Pagodas, Beauty and the Beast, and The Fairy Garden — deploys a unique orchestral palette. The use of pentatonic scales in the Pagodas movement, the contrabassoon as the Beast, and the shimmering closing garden are Ravel at his most magical. One of the most enchanting orchestral scores in the entire repertoire.',
    editions: [
      { id: 'e-ravel-mmlo-durand', publisher: 'Durand', editor: 'Original edition', year: 1912, description: 'Ravel\'s original publisher; the authoritative orchestral score.' },
      { id: 'e-ravel-mmlo-eulenburg', publisher: 'Eulenburg', editor: 'Study score', year: 1965, description: 'Pocket study score widely used for analysis and conducting preparation.' },
    ],
    external_links: [
      { type: 'wikipedia', url: 'https://en.wikipedia.org/wiki/Ma_m%C3%A8re_l%27Oye', label: 'Wikipedia — Ma mère l\'Oye (Ravel)' },
    ],
    movements: [
      { name: 'Prélude' },
      { name: 'I. Pavane de la Belle au bois dormant (Sleeping Beauty\'s Pavane)' },
      { name: 'II. Petit Poucet (Tom Thumb)' },
      { name: 'III. Laideronnette, Impératrice des Pagodes (The Pagoda Empress)' },
      { name: 'IV. Les entretiens de la Belle et de la Bête (Beauty and the Beast)' },
      { name: 'V. Le jardin féerique (The Fairy Garden)' },
    ],
  },

  // === CHAMBER (replacement) ===

  {
    id: 'schumann-piano-quintet-op44',
    title: 'Piano Quintet in E♭ major',
    composer_name: 'Robert Schumann',
    catalog_number: 'Op. 44',
    instruments: ['Piano', 'Violin', 'Violin', 'Viola', 'Cello'],
    era: 'Romantic',
    form: 'Piano Quintet',
    duration_minutes: 32,
    difficulty: 'professional',
    description: 'Schumann\'s Piano Quintet Op. 44 (1842) was the first major Romantic piano quintet and effectively created the genre. Composed in a single burst of creative energy during his "chamber music year" of 1842, the work combines the piano\'s brilliance with the warmth of the string quartet in an unprecedented way. The opening Allegro brillante is magnificent in its broad, singing themes; the "In modo d\'una marcia" second movement is one of Schumann\'s greatest slow movements, eerily foreboding; the scherzo is exhilarating; and the finale ends with a remarkable double fugue. Brahms reportedly said it changed his understanding of what a piano quintet could be.',
    editions: [
      { id: 'e-schumann-pq44-henle', publisher: 'Henle Verlag', editor: 'Ernst Herttrich', year: 1984, description: 'Urtext edition based on autograph; the scholarly and practical standard.' },
      { id: 'e-schumann-pq44-breitkopf', publisher: 'Breitkopf & Härtel', editor: 'Clara Schumann / Johannes Brahms', year: 1882, description: 'Clara Schumann/Brahms complete edition; the historical scholarly source.' },
      { id: 'e-schumann-pq44-peters', publisher: 'Peters', editor: 'Standard edition', year: 1975, description: 'Practical performing edition widely used in concert and conservatoire.' },
    ],
    external_links: [
      { type: 'imslp', url: 'https://imslp.org/wiki/Piano_Quintet,_Op.44_(Schumann,_Robert)', label: 'IMSLP — Piano Quintet Op. 44 (Schumann)' },
      { type: 'wikipedia', url: 'https://en.wikipedia.org/wiki/Piano_Quintet_(Schumann)', label: 'Wikipedia — Piano Quintet Op. 44 (Schumann)' },
      { type: 'vimeo', url: 'https://vimeo.com/371245680', label: 'Yuja Wang / Emerson String Quartet — Verbier Festival film' },
    ],
    movements: [
      { name: 'I. Allegro brillante' },
      { name: 'II. In modo d\'una marcia: Un poco largamente' },
      { name: 'III. Scherzo: Molto vivace — Trio I & II' },
      { name: 'IV. Allegro ma non troppo — Finale' },
    ],
  },

  // === PERCUSSION (replacements) ===

  {
    id: 'stout-two-mexican-dances',
    title: 'Two Mexican Dances',
    composer_name: 'Gordon Stout',
    catalog_number: null,
    instruments: ['Marimba'],
    era: 'Contemporary',
    form: 'Dances',
    duration_minutes: 7,
    difficulty: 'advanced',
    description: 'Gordon Stout\'s Two Mexican Dances (1977) are among the most widely performed marimba solos in the repertoire, appearing on international competition programmes and conservatoire curricula worldwide. The two movements — "Huapango" (a traditional Mexican dance in fast 3/4+2/4) and "Son" — challenge the performer with virtuosic four-mallet technique, rhythmic complexity, and the need to balance melodic singing lines against driving ostinato patterns. Stout, professor of marimba at Ithaca College, composed these dances as showpieces that are also genuinely musical, making them ideal for both competition and recital contexts.',
    editions: [
      { id: 'e-stout-tmd-studio49', publisher: 'Studio 49 / Stout publications', editor: 'Original edition', year: 1977, description: 'The original publication; the only authoritative edition.' },
      { id: 'e-stout-tmd-alfred', publisher: 'Alfred Music', editor: 'Distributed edition', year: 1990, description: 'Widely distributed American edition used in conservatoires.' },
    ],
    external_links: [
      { type: 'vimeo', url: 'https://vimeo.com/389542110', label: 'World Marimba Competition finalist — Stout Two Mexican Dances' },
    ],
    movements: [
      { name: 'I. Huapango' },
      { name: 'II. Son' },
    ],
  },

  {
    id: 'abe-dream-cherry-blossoms',
    title: 'Dream of the Cherry Blossoms',
    composer_name: 'Keiko Abe',
    catalog_number: null,
    instruments: ['Marimba'],
    era: 'Contemporary',
    form: 'Concert Piece',
    duration_minutes: 8,
    difficulty: 'advanced',
    description: 'Keiko Abe\'s Dream of the Cherry Blossoms is one of her most lyrical compositions — a contrast to the virtuosic showpieces for which she is often known. The work evokes the fleeting, bittersweet beauty of sakura (cherry blossoms) in a language that combines impressionistic harmonics, pentatonic melody, and subtle cross-rhythms. Abe, considered the founding figure of the modern concert marimba, composed it as both a personal meditation and a vehicle for exploring the marimba\'s cantabile singing register. It is widely taught in Japan and internationally as a model of expressive marimba writing.',
    editions: [
      { id: 'e-abe-dcb-mallet', publisher: 'Mallet Works Music', editor: 'Original edition', year: 1992, description: 'Original publisher\'s edition; the authoritative performing text.' },
    ],
    external_links: [
      { type: 'vimeo', url: 'https://vimeo.com/310857923', label: 'Sumire Yoshihara — Dream of the Cherry Blossoms, recital film' },
    ],
  },

  // === GUITAR (replacements) ===

  {
    id: 'villa-lobos-guitar-concerto',
    title: 'Guitar Concerto',
    composer_name: 'Heitor Villa-Lobos',
    catalog_number: 'W 501',
    instruments: ['Guitar', 'Orchestra'],
    era: 'Modern',
    form: 'Concerto',
    duration_minutes: 20,
    difficulty: 'professional',
    description: 'Villa-Lobos\'s Guitar Concerto (1951), written for Andrés Segovia, is one of the central concertos of the guitar repertoire and the primary large-scale concerto written by a major composer specifically for the instrument. The three-movement work balances the guitar\'s intimate voice against the orchestra with remarkable skill — Villa-Lobos deliberately scored the orchestral textures lightly to allow the soloist to project. The lyrical central movement draws on Brazilian melodic idioms, and the finale\'s rhythmic drive reflects samba-influenced patterns. Segovia himself gave the premiere in Houston in 1956.',
    editions: [
      { id: 'e-villalobos-gc-escolar', publisher: 'Edições Musicais Savart / Eschig', editor: 'Standard edition', year: 1956, description: 'The original publisher\'s edition prepared with Segovia\'s input; the authoritative text.' },
      { id: 'e-villalobos-gc-schott', publisher: 'Schott Music', editor: 'Performance edition', year: 1982, description: 'Widely distributed performing edition; the standard in North American conservatoires.' },
    ],
    external_links: [
      { type: 'imslp', url: 'https://imslp.org/wiki/Guitar_Concerto,_W501_(Villa-Lobos,_Heitor)', label: 'IMSLP — Guitar Concerto W.501 (Villa-Lobos)' },
      { type: 'wikipedia', url: 'https://en.wikipedia.org/wiki/Guitar_Concerto_(Villa-Lobos)', label: 'Wikipedia — Guitar Concerto (Villa-Lobos)' },
    ],
    movements: [
      { name: 'I. Allegro preciso' },
      { name: 'II. Andantino e Andante' },
      { name: 'III. Cadenza e tutti final' },
    ],
  },



  // === ORCHESTRAL (final replacements) ===

  {
    id: 'bruckner-symphony-4',
    title: 'Symphony No. 4 in E♭ major "Romantic"',
    composer_name: 'Anton Bruckner',
    catalog_number: null,
    instruments: ['Orchestra'],
    era: 'Romantic',
    form: 'Symphony',
    duration_minutes: 66,
    difficulty: 'professional',
    description: 'Bruckner\'s Fourth Symphony (1874, rev. 1878/80/88) is his most popular and is nicknamed "Romantic" by the composer himself — evoking a medieval knight leaving his castle at dawn to the sound of a horn call over trembling strings. The opening Eb horn solo over a soft string tremolo is one of the most magical openings in the symphonic repertoire. Bruckner revised the symphony multiple times, particularly the scherzo and finale. The work exemplifies his "cathedral" approach to symphonic architecture: vast spans, "Bruckner rhythms" (triplet against duplet), chorale-like brass writing, and an overwhelming sense of scale. The finale\'s culminating return of the opening theme in apotheosis is deeply moving.',
    editions: [
      { id: 'e-bruckner-sym4-haas', publisher: 'Musikwissenschaftlicher Verlag Wien (Haas edition)', editor: 'Robert Haas', year: 1936, description: 'Controversial Haas edition combining different versions; historically influential.' },
      { id: 'e-bruckner-sym4-nowak', publisher: 'Musikwissenschaftlicher Verlag Wien (Nowak edition)', editor: 'Leopold Nowak', year: 1953, description: 'The scholarly standard Nowak edition, now preferred by most conductors and orchestras.' },
      { id: 'e-bruckner-sym4-eulenburg', publisher: 'Eulenburg', editor: 'Study score', year: 1965, description: 'Pocket study score widely used for analysis and conducting preparation.' },
    ],
    external_links: [
      { type: 'imslp', url: 'https://imslp.org/wiki/Symphony_No.4_in_E-flat_major_(Bruckner,_Anton)', label: 'IMSLP — Symphony No. 4 "Romantic" (Bruckner)' },
      { type: 'wikipedia', url: 'https://en.wikipedia.org/wiki/Symphony_No._4_(Bruckner)', label: 'Wikipedia — Bruckner Symphony No. 4 "Romantic"' },
      { type: 'soundcloud', url: 'https://soundcloud.com/berliner-philharmoniker/bruckner-symphony-4', label: 'Simon Rattle / Berlin Philharmonic — Digital Concert Hall' },
    ],
    movements: [
      { name: 'I. Bewegt, nicht zu schnell (Sonata Allegro)' },
      { name: 'II. Andante quasi Allegretto' },
      { name: 'III. Bewegt (Scherzo — Hunting music)' },
      { name: 'IV. Bewegt, doch nicht zu schnell (Finale)' },
    ],
  },

  {
    id: 'dvorak-symphony-8',
    title: 'Symphony No. 8 in G major',
    composer_name: 'Antonín Dvořák',
    catalog_number: 'Op. 88',
    instruments: ['Orchestra'],
    era: 'Romantic',
    form: 'Symphony',
    duration_minutes: 35,
    difficulty: 'professional',
    description: 'Dvořák\'s Eighth Symphony (1889) is his most lyrical and folk-inflected symphony — a work of pastoral joy and Czech national character that contrasts with the grand statements of the "New World" Symphony. A flute solo opens the first movement unexpectedly; the Adagio is one of Dvořák\'s most expressive slow movements; the third movement is a lilting Allegretto rather than a conventional scherzo; and the finale is a set of variations on a bold trumpet fanfare theme. The work was composed in Dvořák\'s summer house in Vysoká with characteristic spontaneity and remains one of the sunniest symphonies in the repertoire.',
    editions: [
      { id: 'e-dvorak-sym8-simrock', publisher: 'Simrock', editor: 'Original edition', year: 1890, description: 'Dvořák\'s original publisher; the historical source text.' },
      { id: 'e-dvorak-sym8-barenreiter', publisher: 'Bärenreiter', editor: 'Jarmil Burghauser', year: 1974, description: 'Critical edition from the complete Dvořák works; the scholarly standard.' },
      { id: 'e-dvorak-sym8-eulenburg', publisher: 'Eulenburg', editor: 'Pocket score', year: 1960, description: 'Standard study score for analysis and conducting study.' },
    ],
    external_links: [
      { type: 'imslp', url: 'https://imslp.org/wiki/Symphony_No.8,_Op.88_(Dvo%C5%99%C3%A1k,_Anton%C3%ADn)', label: 'IMSLP — Symphony No. 8 Op. 88 (Dvořák)' },
      { type: 'wikipedia', url: 'https://en.wikipedia.org/wiki/Symphony_No._8_(Dvo%C5%99%C3%A1k)', label: 'Wikipedia — Dvořák Symphony No. 8' },
    ],
    movements: [
      { name: 'I. Allegro con brio' },
      { name: 'II. Adagio' },
      { name: 'III. Allegretto grazioso' },
      { name: 'IV. Allegro ma non troppo — Finale' },
    ],
  },

  {
    id: 'mahler-symphony-6',
    title: 'Symphony No. 6 in A minor "Tragic"',
    composer_name: 'Gustav Mahler',
    catalog_number: null,
    instruments: ['Orchestra'],
    era: 'Romantic',
    form: 'Symphony',
    duration_minutes: 78,
    difficulty: 'professional',
    description: 'Mahler\'s Sixth Symphony (1903–04) is the most tragic and perhaps the most purely abstract of his symphonies. Unlike his other works it ends definitively in the minor key, with three hammer blows in the finale (reduced to two in Mahler\'s later revision) that he described as blows of fate. The opening march movement introduces a recurring fate-motif in brass; the slow movement is a song of heartbreaking beauty; the scherzo pulses with sardonic energy; and the finale is a vast, 30-minute struggle ending in annihilation. Mahler\'s wife Alma wrote that he wept after completing it. The cowbells in the slow movement evoke pastoral distance, making the final defeat all the more desolate.',
    editions: [
      { id: 'e-mahler-sym6-kahnt', publisher: 'Kahnt', editor: 'Original edition', year: 1906, description: 'Mahler\'s original publisher; the historical source text (first edition).' },
      { id: 'e-mahler-sym6-dover', publisher: 'Dover Publications', editor: 'Reprint', year: 1992, description: 'Affordable reprint of the full orchestral score; widely used for study.' },
      { id: 'e-mahler-sym6-universal', publisher: 'Universal Edition', editor: 'Revised edition', year: 1963, description: 'Long-standard performing edition based on the composer\'s later revisions.' },
    ],
    external_links: [
      { type: 'imslp', url: 'https://imslp.org/wiki/Symphony_No.6_(Mahler,_Gustav)', label: 'IMSLP — Symphony No. 6 "Tragic" (Mahler)' },
      { type: 'wikipedia', url: 'https://en.wikipedia.org/wiki/Symphony_No._6_(Mahler)', label: 'Wikipedia — Mahler Symphony No. 6 "Tragic"' },
      { type: 'youtube', url: 'https://www.youtube.com/watch?v=4XbHLFkg_Mw', label: 'Claudio Abbado / Berlin Philharmonic — legendary recording' },
      { type: 'vimeo', url: 'https://vimeo.com/558312907', label: 'Klaus Mäkelä / Oslo Philharmonic — concert film' },
    ],
    movements: [
      { name: 'I. Allegro energico, ma non troppo (Heftig, aber markig)' },
      { name: 'II. Scherzo: Wuchtig' },
      { name: 'III. Andante moderato' },
      { name: 'IV. Finale: Sostenuto — Allegro moderato — Allegro energico' },
    ],
  },

  // === GUITAR (final replacement) ===

  {
    id: 'ponce-concierto-del-sur',
    title: 'Concierto del Sur',
    composer_name: 'Manuel Ponce',
    catalog_number: null,
    instruments: ['Guitar', 'Orchestra'],
    era: 'Modern',
    form: 'Concerto',
    duration_minutes: 26,
    difficulty: 'professional',
    description: 'Manuel Ponce\'s Concierto del Sur (1941), written at Andrés Segovia\'s request, is one of the most beloved guitar concertos in the repertoire. Composed while Ponce was in residence in Mexico City, it draws on Southern Spanish and Mexican folk idioms while employing a neo-Romantic harmonic language. The three movements balance the guitar\'s intimacy with subtle orchestration — Ponce carefully studied how to balance the soloist against the ensemble. The lyrical slow movement is particularly exquisite. Segovia premiered it in Montevideo in 1941 and considered it among the finest concertos written for him. With the Villa-Lobos and Rodrigo concertos, it forms the cornerstone of the classical guitar concerto repertoire.',
    editions: [
      { id: 'e-ponce-cds-peer', publisher: 'Peer Music', editor: 'Andrés Segovia', year: 1941, description: 'The original edition prepared with Segovia\'s input; the authoritative performing text.' },
      { id: 'e-ponce-cds-schott', publisher: 'Schott Music', editor: 'Standard performing edition', year: 1989, description: 'Widely distributed performing edition; the standard in conservatoires worldwide.' },
    ],
    external_links: [
      { type: 'imslp', url: 'https://imslp.org/wiki/Concierto_del_Sur_(Ponce,_Manuel)', label: 'IMSLP — Concierto del Sur (Ponce)' },
      { type: 'wikipedia', url: 'https://en.wikipedia.org/wiki/Concierto_del_Sur', label: 'Wikipedia — Concierto del Sur (Ponce)' },
    ],
    movements: [
      { name: 'I. Allegro moderato' },
      { name: 'II. Andante' },
      { name: 'III. Allegro moderato e festivo' },
    ],
  },

];

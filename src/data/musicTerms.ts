export type MusicTermCategory =
  | 'Historical style'
  | 'Form'
  | 'Technique'
  | 'Performance practice'
  | 'Theory';

import { additionalMusicTerms } from './additionalMusicTerms';

export interface MusicTermExample {
  composer: string;
  work: string;
  pieceId?: string;
}

export interface MusicTerm {
  id: string;
  term: string;
  pronunciation?: string;
  aliases?: string[];
  category: MusicTermCategory;
  period: string;
  historicalPeriodId: string;
  definition: string;
  context: string[];
  listeningCues: string[];
  examples: MusicTermExample[];
  relatedTerms: string[];
}

const coreMusicTerms: MusicTerm[] = [
  {
    id: 'basso-continuo',
    term: 'Basso continuo',
    aliases: ['Continuo', 'Thoroughbass'],
    category: 'Performance practice',
    period: 'c. 1600–1750',
    historicalPeriodId: '17th-century',
    definition: 'A continuously sounding bass line, usually supplied with figures that guide one or more players in realizing the harmony above it.',
    context: [
      'Continuo practice became foundational around the beginning of the Baroque period. A bass instrument such as cello, violone, or bassoon reinforces the written line while a chordal instrument such as harpsichord, organ, lute, or theorbo realizes its harmonies.',
      'The figures specify intervals above the bass rather than a fully written-out accompaniment, so voicing, texture, and rhythmic detail depend on the players, the ensemble, and the repertory.',
    ],
    listeningCues: ['A bass line present through most of a movement', 'Chordal filling that responds flexibly to the solo line', 'Changes of continuo instrument or texture that alter the music’s weight and color'],
    examples: [
      { composer: 'Arcangelo Corelli', work: 'Violin Sonatas, Op. 5' },
      { composer: 'Antonio Vivaldi', work: 'Concerto for Violin and Cello in F major, RV 544', pieceId: 'vivaldi-rv-544' },
      { composer: 'George Frideric Handel', work: 'Giulio Cesare' },
    ],
    relatedTerms: ['figured-bass', 'recitative', 'stile-antico'],
  },
  {
    id: 'bel-canto',
    term: 'Bel canto',
    pronunciation: 'bel KAHN-toh',
    category: 'Historical style',
    period: 'Late 18th–mid-19th century',
    historicalPeriodId: '19th-century',
    definition: 'An Italian vocal ideal centered on beauty and evenness of tone, sustained legato, agile passagework, and expressive control across the range.',
    context: [
      'The phrase means “beautiful singing.” It is most closely associated with Italian opera and with the works of Rossini, Bellini, and Donizetti, though later writers also used it for an earlier tradition of Italian vocal training.',
      'Instrumentalists often use the term by analogy when aiming for a long, vocally shaped line, but that broader usage should not obscure its origins in singing technique and operatic style.',
    ],
    listeningCues: ['Long phrases carried on an even column of sound', 'Ornamentation and coloratura integrated into the melodic line', 'Flexible timing that serves breath, text, and cadence'],
    examples: [
      { composer: 'Vincenzo Bellini', work: 'Norma' },
      { composer: 'Gioachino Rossini', work: 'Il barbiere di Siviglia' },
      { composer: 'Gaetano Donizetti', work: 'Lucia di Lammermoor' },
    ],
    relatedTerms: ['recitative', 'musical-rhetoric', 'thematic-transformation'],
  },
  {
    id: 'empfindsamer-stil',
    term: 'Empfindsamer Stil',
    pronunciation: 'emp-FINT-zah-mer shteel',
    aliases: ['Sensitive style'],
    category: 'Historical style',
    period: 'c. 1740–1780',
    historicalPeriodId: '18th-century',
    definition: 'A mid-18th-century style that seeks intimate, rapidly changing expression through irregular phrases, unexpected pauses, harmonic turns, and sharp contrasts of gesture.',
    context: [
      'The “sensitive style” developed especially in northern Germany and is strongly associated with Carl Philipp Emanuel Bach. It shares the galant style’s move away from dense Baroque counterpoint but favors emotional volatility over social ease.',
      'Its abrupt changes can sound almost improvisatory: a phrase may hesitate, break off, or turn suddenly toward a distant harmony.',
    ],
    listeningCues: ['Frequent rests and broken phrases', 'Sudden dynamic, registral, or affective contrasts', 'Harmonic surprises and speech-like rhythmic freedom'],
    examples: [
      { composer: 'Carl Philipp Emanuel Bach', work: 'Keyboard Sonata in A major, Wq. 55/4' },
      { composer: 'Carl Philipp Emanuel Bach', work: 'Cello Concerto in A minor, Wq. 170' },
      { composer: 'Wilhelm Friedemann Bach', work: 'Keyboard Fantasias' },
    ],
    relatedTerms: ['galant-style', 'sonata-principle', 'musical-rhetoric'],
  },
  {
    id: 'figured-bass',
    term: 'Figured bass',
    aliases: ['Thoroughbass notation'],
    category: 'Theory',
    period: 'c. 1600–1800',
    historicalPeriodId: '17th-century',
    definition: 'A shorthand in which numbers and accidentals placed above or below a bass line indicate intervals—and therefore harmonies—to be played above it.',
    context: [
      'Figured bass is the notational language of much continuo playing. An unfigured bass commonly implies a root-position triad; figures such as 6 or 6/4 indicate inversions, while accidentals alter the interval to which they apply.',
      'The notation does not determine a single realization. Performers decide spacing, voice leading, register, texture, and often rhythm according to style and context.',
    ],
    listeningCues: ['Different chord voicings over the same written bass', 'Inner voices shaped to lead into cadences', 'A realization that becomes sparser under active solo writing'],
    examples: [
      { composer: 'Johann Sebastian Bach', work: 'Sonatas for viola da gamba and harpsichord, BWV 1027–1029' },
      { composer: 'Henry Purcell', work: 'Dido and Aeneas' },
      { composer: 'Antonio Vivaldi', work: 'Sonatas for cello and continuo' },
    ],
    relatedTerms: ['basso-continuo', 'recitative', 'stile-antico'],
  },
  {
    id: 'galant-style',
    term: 'Galant style',
    category: 'Historical style',
    period: 'c. 1720–1770',
    historicalPeriodId: '18th-century',
    definition: 'An 18th-century style favoring clear melody, regular phrasing, light accompaniment, and immediately legible gestures over dense contrapuntal complexity.',
    context: [
      'The galant style emerged across European courtly and theatrical music during the transition from the Baroque to the Classical period. It prized elegance, variety, and ease of communication.',
      'Typical textures place a periodic melody over a relatively simple bass or repeated accompaniment. The term describes a broad musical language rather than a single school or fixed set of rules.',
    ],
    listeningCues: ['Short, balanced phrases with clear cadences', 'Melody-and-accompaniment texture', 'Frequent repetition, sequence, and stock cadential patterns'],
    examples: [
      { composer: 'Giovanni Battista Sammartini', work: 'Early symphonies' },
      { composer: 'Johann Christian Bach', work: 'Keyboard Concertos, Op. 7' },
      { composer: 'Domenico Scarlatti', work: 'Keyboard sonatas' },
    ],
    relatedTerms: ['empfindsamer-stil', 'sonata-principle', 'musical-rhetoric'],
  },
  {
    id: 'leitmotif',
    term: 'Leitmotif',
    pronunciation: 'LIGHT-moh-teef',
    aliases: ['Leading motif'],
    category: 'Technique',
    period: 'Especially 19th–20th century',
    historicalPeriodId: 'late-romanticism',
    definition: 'A recurring, recognizable musical idea associated with a person, object, place, idea, or dramatic situation.',
    context: [
      'The technique is strongly associated with Wagner’s music dramas, although the word became standard mainly through later commentary. Related recurring-motive techniques appear before Wagner and throughout later opera, symphonic music, and film music.',
      'A leitmotif need not return unchanged. Its rhythm, harmony, orchestration, or contour may be transformed as the drama and its associations develop.',
    ],
    listeningCues: ['A short idea returning with the same dramatic association', 'Transformation of that idea as a character or situation changes', 'Several associated ideas sounding together or interrupting one another'],
    examples: [
      { composer: 'Richard Wagner', work: 'Der Ring des Nibelungen' },
      { composer: 'Richard Strauss', work: 'Also sprach Zarathustra' },
      { composer: 'Hector Berlioz', work: 'Symphonie fantastique' },
    ],
    relatedTerms: ['thematic-transformation', 'program-music', 'musical-rhetoric'],
  },
  {
    id: 'musical-rhetoric',
    term: 'Musical rhetoric',
    category: 'Performance practice',
    period: 'Especially 16th–18th century',
    historicalPeriodId: '17th-century',
    definition: 'The understanding of music as persuasive, speech-like discourse shaped through gesture, syntax, emphasis, and affect.',
    context: [
      'Early modern theorists and musicians often drew analogies between composition or performance and classical oratory. Phrases could function like clauses, cadences like punctuation, and ornaments or dissonances like expressive figures.',
      'The idea is most useful as a way of hearing musical direction and articulation; named rhetorical figures vary among historical treatises and should not be treated as a single universal code.',
    ],
    listeningCues: ['Phrases shaped as questions, answers, interruptions, or declarations', 'Cadences treated as different strengths of punctuation', 'Dissonance, repetition, and silence used for emphasis'],
    examples: [
      { composer: 'Claudio Monteverdi', work: 'L’Orfeo' },
      { composer: 'Heinrich Schütz', work: 'Musikalische Exequien' },
      { composer: 'Johann Sebastian Bach', work: 'Cello Suites, BWV 1007–1012', pieceId: 'bach-cello-suite-1' },
    ],
    relatedTerms: ['basso-continuo', 'recitative', 'stile-antico'],
  },
  {
    id: 'program-music',
    term: 'Program music',
    category: 'Historical style',
    period: 'Especially 19th century onward',
    historicalPeriodId: '19th-century',
    definition: 'Instrumental music connected to an extra-musical narrative, image, place, event, or sequence of ideas supplied or implied by the composer.',
    context: [
      'Program music became a central 19th-century aesthetic category, especially in concert overtures, program symphonies, and symphonic poems. Its “program” may be a detailed narrative or only a title and suggestive frame.',
      'The category is often contrasted with absolute music, though many works complicate that division by combining formal autonomy with literary or pictorial associations.',
    ],
    listeningCues: ['Recurring themes tied to characters or ideas', 'Orchestral effects that imitate sounds or suggest scenes', 'Formal events coordinated with an external narrative'],
    examples: [
      { composer: 'Hector Berlioz', work: 'Symphonie fantastique' },
      { composer: 'Franz Liszt', work: 'Les Préludes' },
      { composer: 'Richard Strauss', work: 'Don Quixote' },
    ],
    relatedTerms: ['leitmotif', 'thematic-transformation', 'sonata-principle'],
  },
  {
    id: 'recitative',
    term: 'Recitative',
    pronunciation: 'reh-chih-tah-TEEV',
    category: 'Form',
    period: 'c. 1600 onward',
    historicalPeriodId: '17th-century',
    definition: 'A speech-like style of vocal writing that advances text or dramatic action with flexible rhythm and relatively sparse musical repetition.',
    context: [
      'Recitative developed with early opera as composers sought a direct, intelligible way to deliver dramatic text. Recitativo secco is supported mainly by continuo; accompanied or obbligato recitative uses a fuller ensemble for heightened moments.',
      'Its pacing follows verbal syntax more closely than the regular phrase structure of an aria, though the boundary between recitative and arioso can be fluid.',
    ],
    listeningCues: ['Syllabic, speech-shaped vocal rhythm', 'Harmony changing in response to the text', 'Cadences that hand directly into an aria, ensemble, or chorus'],
    examples: [
      { composer: 'Claudio Monteverdi', work: 'L’Orfeo' },
      { composer: 'George Frideric Handel', work: 'Messiah' },
      { composer: 'Wolfgang Amadeus Mozart', work: 'Le nozze di Figaro' },
    ],
    relatedTerms: ['basso-continuo', 'bel-canto', 'musical-rhetoric'],
  },
  {
    id: 'sonata-principle',
    term: 'Sonata principle',
    aliases: ['Sonata-form principle'],
    category: 'Form',
    period: 'Late 18th–19th century',
    historicalPeriodId: '18th-century',
    definition: 'The tonal and thematic expectation that material first presented away from the home key will ultimately return in the tonic, usually near the end of a movement.',
    context: [
      'The term focuses on the large-scale tonal action underlying many sonata-form movements rather than on a rigid sequence of labeled boxes. In a typical exposition, contrasting material appears in a secondary key; after development, the recapitulation resolves that tonal separation.',
      'Composers can delay, disguise, redistribute, or refuse the expected resolution, which is why the principle is often more flexible than a textbook form diagram.',
    ],
    listeningCues: ['A clear move from the tonic to a contrasting key area', 'Instability or fragmentation in a developmental span', 'Earlier material returning with its tonal conflict resolved in the tonic'],
    examples: [
      { composer: 'Joseph Haydn', work: 'String Quartets, Op. 76' },
      { composer: 'Ludwig van Beethoven', work: 'Cello Sonata No. 3 in A major, Op. 69' },
      { composer: 'Johannes Brahms', work: 'Cello Sonata No. 1 in E minor, Op. 38' },
    ],
    relatedTerms: ['galant-style', 'thematic-transformation', 'empfindsamer-stil'],
  },
  {
    id: 'stile-antico',
    term: 'Stile antico',
    pronunciation: 'STEE-leh an-TEE-koh',
    aliases: ['Old style'],
    category: 'Historical style',
    period: '17th–18th century reception of Renaissance style',
    historicalPeriodId: '17th-century',
    definition: 'A deliberately “old” contrapuntal style modeled on 16th-century sacred polyphony, especially the tradition associated with Palestrina.',
    context: [
      'Baroque and Classical composers used stile antico for sacred gravity, learned display, or institutional continuity. Its smooth vocal lines and controlled dissonance distinguish it from more theatrical contemporary idioms.',
      'The style is a later idealization of Renaissance practice rather than a perfect preservation of it; composers adapted it to newer tonal and expressive habits.',
    ],
    listeningCues: ['Independent voices entering in imitation', 'Long, even lines with restrained rhythmic contrast', 'Carefully prepared and resolved dissonance'],
    examples: [
      { composer: 'Giovanni Pierluigi da Palestrina', work: 'Missa Papae Marcelli' },
      { composer: 'Johann Joseph Fux', work: 'Missa canonica' },
      { composer: 'Wolfgang Amadeus Mozart', work: 'Requiem, K. 626' },
    ],
    relatedTerms: ['musical-rhetoric', 'basso-continuo', 'figured-bass'],
  },
  {
    id: 'thematic-transformation',
    term: 'Thematic transformation',
    category: 'Technique',
    period: 'Especially 19th century onward',
    historicalPeriodId: 'late-romanticism',
    definition: 'The repeated reshaping of a theme’s rhythm, harmony, mode, tempo, contour, or orchestration so that it takes on a new expressive or structural role.',
    context: [
      'Transformation creates continuity across strongly contrasting passages or movements. Rather than merely restating a theme, the composer makes its changing identity part of the work’s argument.',
      'The technique is closely associated with Liszt and later Romantic cyclic forms, but transformation also appears in opera, symphonic poems, chamber music, and earlier variation procedures.',
    ],
    listeningCues: ['A familiar contour returning in a new tempo or character', 'Major/minor or harmonic changes that recast a theme’s meaning', 'One theme generating material across several movements'],
    examples: [
      { composer: 'Franz Liszt', work: 'Piano Sonata in B minor' },
      { composer: 'César Franck', work: 'Violin Sonata in A major' },
      { composer: 'Richard Strauss', work: 'Don Quixote' },
    ],
    relatedTerms: ['leitmotif', 'program-music', 'sonata-principle'],
  },
];

export const musicTerms: MusicTerm[] = [...coreMusicTerms, ...additionalMusicTerms];

export const musicTermsById = new Map(musicTerms.map((entry) => [entry.id, entry]));

export function getRelatedMusicTerms(entry: MusicTerm): MusicTerm[] {
  return entry.relatedTerms
    .map((id) => musicTermsById.get(id))
    .filter((term): term is MusicTerm => Boolean(term));
}

export function groupMusicTermsByLetter(entries = musicTerms): Record<string, MusicTerm[]> {
  return [...entries]
    .sort((a, b) => a.term.localeCompare(b.term))
    .reduce<Record<string, MusicTerm[]>>((groups, entry) => {
      const letter = entry.term[0].toUpperCase();
      (groups[letter] ??= []).push(entry);
      return groups;
    }, {});
}

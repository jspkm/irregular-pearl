import type { MusicPeriod } from './musicPeriods';

export interface MusicPeriodProfile {
  periodId: MusicPeriod['id'];
  exampleTerms: string[];
  composers: string[];
  characteristics: string[];
  writers: string[];
  artists: string[];
  historicEvent: string;
  invention: string;
}

export const musicPeriodProfiles: MusicPeriodProfile[] = [
  {
    periodId: 'antiquity',
    exampleTerms: ['Ethos', 'Tetrachord', 'Aulos', 'Kithara', 'Ancient Greek modes'],
    composers: ['Mesomedes of Crete', 'Terpander', 'Limenius'],
    characteristics: ['Music joined poetry, dance, drama, and ritual', 'Monophonic melodic practice', 'Mode and ethos linked music with character', 'Theory organized pitch through tetrachords'],
    writers: ['Homer', 'Sappho', 'Plato', 'Aristotle'],
    artists: ['Phidias', 'Praxiteles', 'Apelles'],
    historicEvent: 'The fall of the Western Roman Empire in 476 marks the conventional transition from Antiquity to the Middle Ages.',
    invention: 'The hydraulis, an early water-powered pipe organ, appeared in the Hellenistic world during the 3rd century BCE.',
  },
  {
    periodId: '6th-9th-century',
    exampleTerms: ['Plainchant', 'Neume', 'Psalmody', 'Liturgical mode', 'Antiphon'],
    composers: ['Kassia', 'Romanos the Melodist', 'Notker the Stammerer'],
    characteristics: ['Unaccompanied sacred monophony', 'Oral transmission gradually supported by notation', 'Texts shaped melodic rhythm', 'Regional chant traditions became increasingly standardized'],
    writers: ['Boethius', 'Bede', 'Alcuin'],
    artists: ['Artists of the Book of Kells', 'Mosaicists of San Vitale', 'Carolingian manuscript illuminators'],
    historicEvent: 'Charlemagne was crowned emperor in 800, strengthening cultural and liturgical exchange across the Carolingian realm.',
    invention: 'Early neumatic notation gave singers visual reminders of melodic contour and helped preserve chant repertories.',
  },
  {
    periodId: '10th-12th-century',
    exampleTerms: ['Organum', 'Trope', 'Sequence', 'Troubadour', 'Guidonian hand'],
    composers: ['Hildegard von Bingen', 'Bernart de Ventadorn', 'Léonin'],
    characteristics: ['Early polyphony expanded chant', 'Sacred and courtly song flourished', 'Staff notation clarified pitch', 'Rhythmic coordination became more systematic'],
    writers: ['Marie de France', 'Chrétien de Troyes', 'Omar Khayyam'],
    artists: ['Bayeux Tapestry artists', 'Gislebertus', 'Master Hugo'],
    historicEvent: 'The First Crusade began in 1096, intensifying movement and cultural contact across Europe and the eastern Mediterranean.',
    invention: 'Guido of Arezzo’s four-line staff and solmization system transformed the teaching and reading of music.',
  },
  {
    periodId: '13th-century',
    exampleTerms: ['Ars Antiqua', 'Rhythmic mode', 'Motet', 'Clausula', 'Conductus'],
    composers: ['Pérotin', 'Adam de la Halle', 'Franco of Cologne'],
    characteristics: ['Measured polyphony centered on Notre Dame practice', 'Rhythmic modes coordinated independent voices', 'The motet emerged from clausula practice', 'Notation increasingly specified duration'],
    writers: ['Dante Alighieri', 'Rumi', 'Rutebeuf'],
    artists: ['Nicola Pisano', 'Cimabue', 'Villard de Honnecourt'],
    historicEvent: 'The founding and growth of European universities created new centers for scholarship, notation, and theoretical exchange.',
    invention: 'Franco of Cologne’s mensural notation assigned rhythmic meaning to individual note shapes.',
  },
  {
    periodId: '14th-century',
    exampleTerms: ['Ars Nova', 'Isorhythm', 'Hocket', 'Formes fixes', 'Mensuration'],
    composers: ['Guillaume de Machaut', 'Francesco Landini', 'Philippe de Vitry'],
    characteristics: ['Greater rhythmic independence and complexity', 'Secular polyphonic song expanded', 'Isorhythmic structures organized large spans', 'New notation supported duple and triple divisions'],
    writers: ['Geoffrey Chaucer', 'Petrarch', 'Giovanni Boccaccio'],
    artists: ['Giotto', 'Simone Martini', 'Ambrogio Lorenzetti'],
    historicEvent: 'The Black Death reached Europe in 1347–1351 and profoundly altered social, religious, and artistic life.',
    invention: 'The mechanical clock spread through European cities, reshaping ideas of measured and coordinated time.',
  },
  {
    periodId: '15th-century',
    exampleTerms: ['Cantus firmus', 'Fauxbourdon', 'Burgundian chanson', 'Cyclic mass', 'Imitation'],
    composers: ['Guillaume Du Fay', 'Johannes Ockeghem', 'Josquin des Prez'],
    characteristics: ['Smoother consonant sonorities', 'Interconnected mass movements', 'Franco-Flemish contrapuntal craft', 'Growing circulation of international styles'],
    writers: ['Christine de Pizan', 'François Villon', 'Thomas Malory'],
    artists: ['Jan van Eyck', 'Sandro Botticelli', 'Donatello'],
    historicEvent: 'The fall of Constantinople in 1453 accelerated the movement of scholars and classical texts into western Europe.',
    invention: 'Movable-type printing, developed in Europe by Johannes Gutenberg, transformed the circulation of texts and later printed music.',
  },
  {
    periodId: '16th-century',
    exampleTerms: ['Stile antico', 'Madrigal', 'Imitative counterpoint', 'Musica reservata', 'Word painting'],
    composers: ['Giovanni Pierluigi da Palestrina', 'Orlando di Lasso', 'Tomás Luis de Victoria', 'William Byrd'],
    characteristics: ['Balanced imitative polyphony', 'Close musical response to poetic text', 'Sacred and secular vocal genres flourished', 'Instrumental families and dance music expanded'],
    writers: ['William Shakespeare', 'Miguel de Cervantes', 'Michel de Montaigne'],
    artists: ['Leonardo da Vinci', 'Michelangelo', 'Titian'],
    historicEvent: 'The Protestant Reformation began in 1517 and reshaped worship, patronage, and vernacular sacred music.',
    invention: 'Music printing with movable type made repertory available to a much wider community of performers.',
  },
  {
    periodId: '17th-century',
    exampleTerms: ['Basso continuo', 'Figured bass', 'Recitative', 'Doctrine of affections', 'Concertato style'],
    composers: ['Claudio Monteverdi', 'Barbara Strozzi', 'Heinrich Schütz', 'Arcangelo Corelli'],
    characteristics: ['Tonal direction strengthened', 'Opera united music, theater, and spectacle', 'Continuo supported melody and harmony', 'Idiomatic instrumental writing and contrast became central'],
    writers: ['John Milton', 'Molière', 'Sor Juana Inés de la Cruz'],
    artists: ['Caravaggio', 'Artemisia Gentileschi', 'Rembrandt', 'Diego Velázquez'],
    historicEvent: 'The Thirty Years’ War ended in 1648, redrawing European political and confessional relationships.',
    invention: 'The modern telescope, developed at the beginning of the century, transformed observation and scientific thought.',
  },
  {
    periodId: 'late-baroque',
    exampleTerms: ['Basso continuo', 'Figured bass', 'Concerto grosso', 'Fugue', 'Ritornello form'],
    composers: ['Johann Sebastian Bach', 'George Frideric Handel', 'Antonio Vivaldi', 'Élisabeth Jacquet de La Guerre'],
    characteristics: ['Functional tonality became firmly established', 'Contrapuntal forms reached new complexity', 'Concertos highlighted contrast between soloists and ensemble', 'Dance suites and instrumental genres flourished'],
    writers: ['Alexander Pope', 'Jonathan Swift', 'Voltaire'],
    artists: ['Peter Paul Rubens', 'Giovanni Battista Tiepolo', 'Jean-Antoine Watteau'],
    historicEvent: 'The Enlightenment reshaped European intellectual and cultural life as public concerts and music publishing expanded.',
    invention: 'Bartolomeo Cristofori developed the early pianoforte around 1700, allowing players to control dynamics through touch.',
  },
  {
    periodId: '18th-century',
    exampleTerms: ['Galant style', 'Sonata principle', 'Empfindsamer Stil', 'Alberti bass', 'Periodic phrase'],
    composers: ['Johann Sebastian Bach', 'Joseph Haydn', 'Wolfgang Amadeus Mozart', 'Joseph Bologne'],
    characteristics: ['Clear phrases and balanced forms', 'Public concerts and publishing expanded', 'Sonata practice organized large instrumental works', 'Orchestral color and standardized genres developed'],
    writers: ['Voltaire', 'Jane Austen', 'Johann Wolfgang von Goethe'],
    artists: ['Jean-Antoine Watteau', 'Élisabeth Vigée Le Brun', 'Francisco Goya'],
    historicEvent: 'The French Revolution began in 1789 and transformed European politics, institutions, and patronage.',
    invention: 'Bartolomeo Cristofori’s pianoforte enabled performers to shape dynamics through touch.',
  },
  {
    periodId: '19th-century',
    exampleTerms: ['Bel canto', 'Program music', 'Rubato', 'Lied'],
    composers: ['Ludwig van Beethoven', 'Franz Schubert', 'Felix Mendelssohn', 'Frédéric Chopin', 'Robert Schumann', 'Clara Schumann'],
    characteristics: ['Lyrical melody and individual expression', 'Art song and character pieces flourished', 'Virtuosity and public concert life expanded', 'Program music explored literary and dramatic ideas'],
    writers: ['Mary Shelley', 'Victor Hugo', 'Alexander Pushkin'],
    artists: ['J. M. W. Turner', 'Eugène Delacroix'],
    historicEvent: 'Industrialization and the revolutions of 1848 reshaped European society and cultural life.',
    invention: 'The metronome was patented by Johann Nepomuk Mälzel in 1815, offering a standardized measure of tempo.',
  },
  {
    periodId: 'late-romanticism',
    exampleTerms: ['Leitmotif', 'Thematic transformation', 'Program music'],
    composers: ['Johannes Brahms', 'Richard Wagner', 'Franz Liszt', 'Pyotr Ilyich Tchaikovsky', 'Antonín Dvořák', 'Richard Strauss'],
    characteristics: ['Expanded chromatic harmony and orchestration', 'National traditions gained prominence', 'Symphonic poems and music dramas developed', 'Large-scale forms and cyclic thematic connections'],
    writers: ['Emily Dickinson', 'Leo Tolstoy'],
    artists: ['Berthe Morisot', 'Vincent van Gogh'],
    historicEvent: 'Growing cities, rail networks, and public concert institutions broadened musical circulation in the later nineteenth century.',
    invention: 'Sound recording emerged in the late nineteenth century, making it possible to preserve performances.',
  },
  {
    periodId: '20th-century',
    exampleTerms: ['Impressionism', 'Expressionism', 'Atonality', 'Serialism', 'Neoclassicism'],
    composers: ['Claude Debussy', 'Arnold Schoenberg', 'Igor Stravinsky', 'Florence Price'],
    characteristics: ['Radically plural musical languages', 'New approaches to timbre, rhythm, and tonality', 'Recording changed listening and performance', 'Electronic and experimental practices emerged'],
    writers: ['Virginia Woolf', 'T. S. Eliot', 'James Baldwin', 'Pablo Neruda'],
    artists: ['Pablo Picasso', 'Wassily Kandinsky', 'Frida Kahlo', 'Georgia O’Keeffe'],
    historicEvent: 'Two world wars and their aftermath transformed cultural institutions, migration, technology, and artistic expression.',
    invention: 'Electronic recording and broadcasting made performances reproducible and globally distributable.',
  },
  {
    periodId: '21st-century',
    exampleTerms: ['Spectralism', 'Postminimalism', 'Electroacoustic music', 'New complexity', 'Multimedia performance'],
    composers: ['Kaija Saariaho', 'Thomas Adès', 'Unsuk Chin', 'Caroline Shaw'],
    characteristics: ['Stylistic pluralism and cross-cultural exchange', 'Digital tools integrated into composition and performance', 'New concert formats and multimedia collaboration', 'Broader attention to representation and recovered repertories'],
    writers: ['Ocean Vuong', 'Chimamanda Ngozi Adichie', 'Olga Tokarczuk', 'Tracy K. Smith'],
    artists: ['Yayoi Kusama', 'Kara Walker', 'Ai Weiwei', 'El Anatsui'],
    historicEvent: 'The COVID-19 pandemic accelerated livestreaming, remote collaboration, and new models of musical presentation.',
    invention: 'Affordable digital audio workstations and networked performance tools moved studio-scale creation onto personal computers and mobile devices.',
  },
];

export const musicPeriodProfilesById = new Map(musicPeriodProfiles.map((profile) => [profile.periodId, profile]));

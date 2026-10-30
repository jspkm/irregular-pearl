export type ComposerCareerStage = 'established' | 'recognized-emerging' | 'early-career' | 'student';

export interface LivingComposerEntry {
  name: string;
  stage: ComposerCareerStage;
  distinction?: string;
  year?: number;
  awardedWork?: string;
  notableWork?: string;
  affiliations?: string[];
  sourceUrl?: string;
}

// Established composers are living Pulitzer Prize for Music recipients from
// 2000 onward whose winning work belongs to classical or contemporary concert music.
// Source: https://www.pulitzer.org/prize-winners-by-category/225
export const livingComposers: LivingComposerEntry[] = [
  { name: 'John Corigliano', stage: 'established', year: 2001, awardedWork: 'Symphony No. 2 for String Orchestra', distinction: 'Pulitzer Prize for Music' },
  { name: 'John Adams', stage: 'established', year: 2003, awardedWork: 'On the Transmigration of Souls', distinction: 'Pulitzer Prize for Music' },
  { name: 'Paul Moravec', stage: 'established', year: 2004, awardedWork: 'Tempest Fantasy', distinction: 'Pulitzer Prize for Music' },
  { name: 'Yehudi Wyner', stage: 'established', year: 2006, awardedWork: "Piano Concerto: 'Chiavi in Mano'", distinction: 'Pulitzer Prize for Music' },
  { name: 'David Lang', stage: 'established', year: 2008, awardedWork: 'The Little Match Girl Passion', distinction: 'Pulitzer Prize for Music' },
  { name: 'Steve Reich', stage: 'established', year: 2009, awardedWork: 'Double Sextet', distinction: 'Pulitzer Prize for Music' },
  { name: 'Jennifer Higdon', stage: 'established', year: 2010, awardedWork: 'Violin Concerto', distinction: 'Pulitzer Prize for Music' },
  { name: 'Zhou Long', stage: 'established', year: 2011, awardedWork: 'Madame White Snake', distinction: 'Pulitzer Prize for Music' },
  { name: 'Kevin Puts', stage: 'established', year: 2012, awardedWork: 'Silent Night: Opera in Two Acts', distinction: 'Pulitzer Prize for Music' },
  { name: 'Caroline Shaw', stage: 'established', year: 2013, awardedWork: 'Partita for 8 Voices', distinction: 'Pulitzer Prize for Music' },
  { name: 'John Luther Adams', stage: 'established', year: 2014, awardedWork: 'Become Ocean', distinction: 'Pulitzer Prize for Music' },
  { name: 'Julia Wolfe', stage: 'established', year: 2015, awardedWork: 'Anthracite Fields', distinction: 'Pulitzer Prize for Music' },
  { name: 'Du Yun', stage: 'established', year: 2017, awardedWork: 'Angel’s Bone', distinction: 'Pulitzer Prize for Music' },
  { name: 'Ellen Reid', stage: 'established', year: 2019, awardedWork: 'p r i s m', distinction: 'Pulitzer Prize for Music' },
  { name: 'Anthony Davis', stage: 'established', year: 2020, awardedWork: 'The Central Park Five', distinction: 'Pulitzer Prize for Music' },
  { name: 'Tania León', stage: 'established', year: 2021, awardedWork: 'Stride', distinction: 'Pulitzer Prize for Music' },
  { name: 'Raven Chacon', stage: 'established', year: 2022, awardedWork: 'Voiceless Mass', distinction: 'Pulitzer Prize for Music' },
  { name: 'Rhiannon Giddens', stage: 'established', year: 2023, awardedWork: 'Omar', distinction: 'Pulitzer Prize for Music' },
  { name: 'Michael Abels', stage: 'established', year: 2023, awardedWork: 'Omar', distinction: 'Pulitzer Prize for Music' },
  { name: 'Tyshawn Sorey', stage: 'established', year: 2024, awardedWork: 'Adagio (For Wadada Leo Smith)', distinction: 'Pulitzer Prize for Music' },
  { name: 'Susie Ibarra', stage: 'established', year: 2025, awardedWork: 'Sky Islands', distinction: 'Pulitzer Prize for Music' },
  { name: 'Gabriela Lena Frank', stage: 'established', year: 2026, awardedWork: 'Picaflor: A Future Myth', distinction: 'Pulitzer Prize for Music' },
  { name: 'Valerie Coleman', stage: 'established', notableWork: 'Umoja', distinction: 'Composition Faculty', affiliations: ['The Juilliard School'], sourceUrl: 'https://www.juilliard.edu/music/composition' },
  { name: 'Amy Beth Kirsten', stage: 'established', notableWork: 'Savior', distinction: 'Composition Faculty', affiliations: ['The Juilliard School'], sourceUrl: 'https://www.juilliard.edu/music/composition' },
  { name: 'David Serkin Ludwig', stage: 'established', notableWork: 'The New Colossus', distinction: 'Chair, Composition Department', affiliations: ['The Juilliard School'], sourceUrl: 'https://www.juilliard.edu/music/faculty/ludwig-david' },
  { name: 'Melinda Wagner', stage: 'established', notableWork: 'Concerto for Flute, Strings and Percussion', distinction: 'Composition Faculty', affiliations: ['The Juilliard School'], sourceUrl: 'https://www.juilliard.edu/music/faculty/wagner-melinda' },
  { name: 'Nina C. Young', stage: 'established', notableWork: 'Out of whose womb came the ice', distinction: 'Composition Faculty', affiliations: ['The Juilliard School'], sourceUrl: 'https://www.juilliard.edu/music/composition' },
  { name: 'Reiko Füting', stage: 'established', notableWork: 'names, erased', distinction: 'Department Chair; Composition Faculty', affiliations: ['Manhattan School of Music'], sourceUrl: 'https://www.reikofueting.com/' },
  { name: 'David Adamcyk', stage: 'established', notableWork: 'Trompe-l’œil', distinction: 'Composition Faculty', affiliations: ['Manhattan School of Music'], sourceUrl: 'https://www.msmnyc.edu/programs/composition/' },
  { name: 'Ashkan Behzadi', stage: 'established', notableWork: 'Journal of an Ordinary Grief', distinction: 'Composition Faculty', affiliations: ['Manhattan School of Music'], sourceUrl: 'https://evs-musikstiftung.ch/en/composer-prize/ashkan-behzadi/ashkan-behzadi-works/' },
  { name: 'Susan Botti', stage: 'established', notableWork: 'Cosmosis', distinction: 'Composition Faculty', affiliations: ['Manhattan School of Music'], sourceUrl: 'https://www.msmnyc.edu/programs/composition/' },
  { name: 'J. Mark Stambaugh', stage: 'established', notableWork: 'The Pied Piper of Hamelin', distinction: 'Composition Faculty', affiliations: ['Manhattan School of Music'], sourceUrl: 'https://www.msmnyc.edu/programs/composition/' },
  { name: 'Leah Asher', stage: 'established', notableWork: 'Nyx', distinction: 'Composition Course Faculty', affiliations: ['Manhattan School of Music'], sourceUrl: 'https://www.leahasher.com/list-of-works' },
  { name: 'Yu-Chun Chien', stage: 'established', notableWork: 'New Music for, about, and with String Quartet', distinction: 'Composition Course Faculty', affiliations: ['Manhattan School of Music'], sourceUrl: 'https://www.msmnyc.edu/programs/composition/' },
  { name: 'Hayes Biggs', stage: 'established', notableWork: 'Symphonia brevis', distinction: 'Composition Course Faculty', affiliations: ['Manhattan School of Music'], sourceUrl: 'https://www.navonarecords.com/artists/hayes-biggs/' },
  { name: 'Paolo Marchettini', stage: 'established', notableWork: 'Tre movimenti dalla Beltà', distinction: 'Composition Course Faculty', affiliations: ['Manhattan School of Music'], sourceUrl: 'https://paolomarchettini.com/paolo-marchettinis-list-of-works' },
  { name: 'David McDonald', stage: 'established', notableWork: 'Between Paths', distinction: 'Composition Course Faculty', affiliations: ['Manhattan School of Music'], sourceUrl: 'https://www.msmnyc.edu/programs/composition/' },
  { name: 'Peter Andreacchi', stage: 'established', notableWork: 'Fiori Musicali', distinction: 'Composition, Theory, and Aural Skills Faculty', affiliations: ['Manhattan School of Music'], sourceUrl: 'https://www.peterandreacchi.com/fiori-musicali' },
  { name: 'Kati Agócs', stage: 'established', notableWork: 'The Debrecen Passion', distinction: 'Composition Faculty', affiliations: ['New England Conservatory'], sourceUrl: 'https://necmusic.edu/faculty/kati-agocs/' },
  { name: 'Paul Burdick', stage: 'established', notableWork: 'Genetic Music', distinction: 'Composition Faculty', affiliations: ['New England Conservatory'], sourceUrl: 'https://necmusic.edu/faculty/paul-burdick/' },
  { name: 'Michael Gandolfi', stage: 'established', notableWork: 'The Garden of Cosmic Speculation', distinction: 'Composition Department Chair', affiliations: ['New England Conservatory'], sourceUrl: 'https://necmusic.edu/the-college/departments/composition/' },
  { name: 'John Mallia', stage: 'established', notableWork: 'In the White Silence', distinction: 'Composition Faculty', affiliations: ['New England Conservatory'], sourceUrl: 'https://necmusic.edu/the-college/departments/composition/' },
  { name: 'Efstratios Minakakis', stage: 'established', notableWork: 'Crossings', distinction: 'Composition Faculty', affiliations: ['New England Conservatory'], sourceUrl: 'https://necmusic.edu/faculty/efstratios-minakakis/' },
  { name: 'Sid Richardson', stage: 'established', notableWork: 'Borne by a Wind', distinction: 'Composition Faculty', affiliations: ['New England Conservatory'], sourceUrl: 'https://necmusic.edu/faculty/sid-richardson/' },
];

export const composerCareerStages: { id: ComposerCareerStage; label: string; description: string }[] = [
  { id: 'established', label: 'Established Composers', description: 'Major living composers with sustained international recognition.' },
  { id: 'recognized-emerging', label: 'Recognized Emerging Composers', description: 'Composers receiving significant commissions, performances, and professional recognition.' },
  { id: 'early-career', label: 'Early-Career Composers', description: 'Composers building their first substantial body of professional work.' },
  { id: 'student', label: 'Student Composers', description: 'Composers currently studying and developing their artistic practice.' },
];

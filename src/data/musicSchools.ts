import type { CareerStage } from './opportunities';
export type MusicSchoolKind = 'University music program' | 'Conservatory';

export interface MusicSchool {
  name: string;
  kind: MusicSchoolKind;
  city: string;
  state: string;
  acceptanceRate?: string;
  acceptanceRateNote?: string;
  repertoire: string;
  admissionsUrl: string;
  websiteUrl?: string;
  sourceReviewed?: string;
  careerStages?: CareerStage[];
}

export const musicSchools: MusicSchool[] = [

  {
    "name": "Royal Academy of Music",
    "kind": "Conservatory",
    "city": "London",
    "state": "United Kingdom",
    "repertoire": "Specialist conservatory training in performance and composition, with undergraduate and postgraduate study and ensemble opportunities.",
    "admissionsUrl": "https://www.ram.ac.uk/",
    "websiteUrl": "https://www.ram.ac.uk/",
    "sourceReviewed": "2026-10-23",
    "careerStages": [
      "Pre-College",
      "College Student",
      "Emerging Professional"
    ]
  },
  {
    "name": "Royal College of Music",
    "kind": "Conservatory",
    "city": "London",
    "state": "United Kingdom",
    "repertoire": "Conservatory study across orchestral instruments, keyboard, voice, composition, conducting, and historical performance.",
    "admissionsUrl": "https://www.rcm.ac.uk/",
    "websiteUrl": "https://www.rcm.ac.uk/",
    "sourceReviewed": "2026-10-23",
    "careerStages": [
      "Pre-College",
      "College Student",
      "Emerging Professional"
    ]
  },
  {
    "name": "Guildhall School of Music & Drama",
    "kind": "Conservatory",
    "city": "London",
    "state": "United Kingdom",
    "repertoire": "Specialist music training with principal-study departments, chamber music, historical performance, composition, and performance projects.",
    "admissionsUrl": "https://www.gsmd.ac.uk/",
    "websiteUrl": "https://www.gsmd.ac.uk/",
    "sourceReviewed": "2026-10-23",
    "careerStages": [
      "Pre-College",
      "College Student",
      "Emerging Professional"
    ]
  },
  {
    "name": "Conservatoire national supérieur de musique et de danse de Paris",
    "kind": "Conservatory",
    "city": "Paris",
    "state": "France",
    "repertoire": "Specialist higher education in music and dance, with music courses spanning performance, composition, and related disciplines.",
    "admissionsUrl": "https://www.conservatoiredeparis.fr/",
    "websiteUrl": "https://www.conservatoiredeparis.fr/",
    "sourceReviewed": "2026-10-23",
    "careerStages": [
      "Pre-College",
      "College Student",
      "Emerging Professional"
    ]
  },
  {
    "name": "Hochschule für Musik Hanns Eisler Berlin",
    "kind": "Conservatory",
    "city": "Berlin",
    "state": "Germany",
    "repertoire": "Specialist music higher education with instrumental and vocal study, composition, conducting, and ensemble performance.",
    "admissionsUrl": "https://www.hfm-berlin.de/",
    "websiteUrl": "https://www.hfm-berlin.de/",
    "sourceReviewed": "2026-10-23",
    "careerStages": [
      "Pre-College",
      "College Student",
      "Emerging Professional"
    ]
  },
  {
    "name": "University of Music and Performing Arts Vienna (mdw)",
    "kind": "Conservatory",
    "city": "Vienna",
    "state": "Austria",
    "repertoire": "A specialist arts university offering music performance, composition, conducting, music education, and research programs.",
    "admissionsUrl": "https://www.mdw.ac.at/",
    "websiteUrl": "https://www.mdw.ac.at/",
    "sourceReviewed": "2026-10-23",
    "careerStages": [
      "Pre-College",
      "College Student",
      "Emerging Professional"
    ]
  },
  {
    "name": "Mozarteum University Salzburg",
    "kind": "Conservatory",
    "city": "Salzburg",
    "state": "Austria",
    "repertoire": "A specialist arts university offering instrumental and vocal study, composition, conducting, and music education alongside ensemble performance.",
    "admissionsUrl": "https://www.moz.ac.at/en",
    "websiteUrl": "https://www.moz.ac.at/en",
    "sourceReviewed": "2026-10-23",
    "careerStages": [
      "Pre-College",
      "College Student",
      "Emerging Professional"
    ]
  },
  {
    "name": "Cleveland Institute of Music",
    "kind": "Conservatory",
    "city": "Cleveland",
    "state": "Ohio, United States",
    "repertoire": "A classical-music conservatory offering focused performance and composition training, with individual instruction and ensemble study.",
    "admissionsUrl": "https://www.cim.edu/",
    "websiteUrl": "https://www.cim.edu/",
    "sourceReviewed": "2026-10-23",
    "careerStages": [
      "Pre-College",
      "College Student",
      "Emerging Professional"
    ]
  },
  {
    "name": "Peabody Conservatory at Johns Hopkins University",
    "kind": "Conservatory",
    "city": "Baltimore",
    "state": "Maryland, United States",
    "repertoire": "A university-affiliated conservatory combining performance and composition study with ensemble experience and professional preparation.",
    "admissionsUrl": "https://peabody.jhu.edu/",
    "websiteUrl": "https://peabody.jhu.edu/",
    "sourceReviewed": "2026-10-23",
    "careerStages": [
      "Pre-College",
      "College Student",
      "Emerging Professional"
    ]
  },
  {
    "name": "Oberlin Conservatory of Music",
    "kind": "Conservatory",
    "city": "Oberlin",
    "state": "Ohio, United States",
    "repertoire": "An undergraduate-focused conservatory offering individual instruction, ensemble performance, and opportunities to combine music with liberal-arts study.",
    "admissionsUrl": "https://www.oberlin.edu/conservatory",
    "websiteUrl": "https://www.oberlin.edu/conservatory",
    "sourceReviewed": "2026-10-23",
    "careerStages": [
      "Pre-College",
      "College Student",
      "Emerging Professional"
    ]
  },
  {
    "name": "USC Thornton School of Music",
    "kind": "University music program",
    "city": "Los Angeles",
    "state": "California, United States",
    "repertoire": "A university music school with classical performance and composition, contemporary music, and research and scholarly studies.",
    "admissionsUrl": "https://music.usc.edu/",
    "websiteUrl": "https://music.usc.edu/",
    "sourceReviewed": "2026-10-23",
    "careerStages": [
      "Pre-College",
      "College Student",
      "Emerging Professional"
    ]
  },
  {
    "name": "Yale School of Music",
    "kind": "University music program",
    "city": "New Haven",
    "state": "Connecticut, United States",
    "repertoire": "A graduate professional music school offering advanced performance, composition, and conducting study. Applicants should consult degree-specific prerequisites.",
    "admissionsUrl": "https://music.yale.edu/",
    "websiteUrl": "https://music.yale.edu/",
    "sourceReviewed": "2026-10-23",
    "careerStages": [
      "College Student",
      "Emerging Professional",
      "Professional"
    ]
  },
  {
    "name": "Schulich School of Music at McGill University",
    "kind": "University music program",
    "city": "Montréal",
    "state": "Quebec, Canada",
    "repertoire": "A university music school offering performance, composition, music education, musicology, music theory, music technology, and sound recording.",
    "admissionsUrl": "https://www.mcgill.ca/music/",
    "websiteUrl": "https://www.mcgill.ca/music/",
    "sourceReviewed": "2026-10-23",
    "careerStages": [
      "Pre-College",
      "College Student",
      "Emerging Professional"
    ]
  },
  {
    "name": "University of Toronto Faculty of Music",
    "kind": "University music program",
    "city": "Toronto",
    "state": "Ontario, Canada",
    "repertoire": "A university faculty offering music performance, composition, education, and scholarly study, with undergraduate and graduate pathways.",
    "admissionsUrl": "https://music.utoronto.ca/",
    "websiteUrl": "https://music.utoronto.ca/",
    "sourceReviewed": "2026-10-23",
    "careerStages": [
      "Pre-College",
      "College Student",
      "Emerging Professional"
    ]
  }
,
  {
    name: 'Bienen School of Music at Northwestern University', kind: 'University music program', city: 'Evanston', state: 'Illinois',
    acceptanceRate: 'Not currently published', acceptanceRateNote: 'Bienen-specific undergraduate rate',
    repertoire: 'Varies by instrument. Performance applicants generally submit a prescreen where required and prepare contrasting works plus instrument-specific études, excerpts, or major solo repertoire for the final audition.',
    admissionsUrl: 'https://www.music.northwestern.edu/admission/undergraduate/auditions',
  },
  {
    name: 'Indiana University Jacobs School of Music', kind: 'University music program', city: 'Bloomington', state: 'Indiana',
    acceptanceRate: 'Not currently published', acceptanceRateNote: 'Jacobs-specific undergraduate rate',
    repertoire: 'Varies by department. Undergraduate piano, for example, requires a Bach prelude and fugue, a complete Classical sonata, a Romantic work, and a 20th- or 21st-century work, performed from memory.',
    admissionsUrl: 'https://music.indiana.edu/admissions/auditions/index.html',
  },
  {
    name: 'Shepherd School of Music at Rice University', kind: 'University music program', city: 'Houston', state: 'Texas',
    acceptanceRate: 'About 15%', acceptanceRateNote: 'Shepherd undergraduate applicants; school-reported typical rate',
    repertoire: 'Instrument-specific prescreening and live audition. Violin applicants, for example, prepare Bach, an étude or caprice, and a complete first movement of a major concerto with cadenza.',
    admissionsUrl: 'https://music.rice.edu/admissions/undergraduate/audition',
  },
  {
    name: 'University of Michigan School of Music, Theatre & Dance', kind: 'University music program', city: 'Ann Arbor', state: 'Michigan',
    acceptanceRate: 'Not currently published', acceptanceRateNote: 'SMTD-specific undergraduate rate',
    repertoire: 'Requirements vary by principal instrument and degree. Most performance programs require a prescreening portfolio followed by a live or recorded audition of contrasting solo works and specified excerpts.',
    admissionsUrl: 'https://smtd.umich.edu/admissions/undergraduate/apply/auditions-interviews/',
  },
  {
    name: 'Eastman School of Music at the University of Rochester', kind: 'University music program', city: 'Rochester', state: 'New York',
    acceptanceRate: 'Not currently published', acceptanceRateNote: 'Eastman-specific current undergraduate rate',
    repertoire: 'Applicants follow department-specific prescreening and audition lists. Performance programs typically ask for contrasting repertoire from multiple periods, technical material, and orchestral excerpts where applicable.',
    admissionsUrl: 'https://www.esm.rochester.edu/admissions/ugrad/audition-repertoire/',
  },
  {
    name: 'The Juilliard School', kind: 'Conservatory', city: 'New York', state: 'New York',
    acceptanceRate: 'Not currently published', acceptanceRateNote: 'Current Music Division undergraduate rate',
    repertoire: 'Requirements are organized by instrument and degree. Most applicants submit prescreening recordings, then prepare a substantial live audition spanning contrasting styles, major works, and specified études or excerpts.',
    admissionsUrl: 'https://www.juilliard.edu/arm/music/college',
  },
  {
    name: 'Curtis Institute of Music', kind: 'Conservatory', city: 'Philadelphia', state: 'Pennsylvania',
    acceptanceRate: 'Not currently published', acceptanceRateNote: 'Current undergraduate rate',
    repertoire: 'Instrument-specific repertoire is required for prescreening and audition. Applicants must prepare the complete published list; some departments require proposed repertoire to receive faculty approval before auditioning.',
    admissionsUrl: 'https://www.curtis.edu/apply/audition/',
  },
  {
    name: 'New England Conservatory', kind: 'Conservatory', city: 'Boston', state: 'Massachusetts',
    acceptanceRate: 'Not currently published', acceptanceRateNote: 'Current undergraduate rate',
    repertoire: 'Each department publishes its own prescreening and final-audition requirements, generally including contrasting solo works and, for orchestral instruments, selected standard excerpts.',
    admissionsUrl: 'https://necmusic.edu/admissions/auditions/audition-repertoire/',
  },
  {
    name: 'Colburn Conservatory of Music', kind: 'Conservatory', city: 'Los Angeles', state: 'California',
    acceptanceRate: 'Not currently published', acceptanceRateNote: 'Current undergraduate rate; enrollment depends on studio and orchestra openings',
    repertoire: 'All applicants submit a video prescreen. Undergraduate piano applicants prepare at least 30 minutes from varied periods, including a virtuosic étude and a complete Classical work; other instruments follow detailed lists.',
    admissionsUrl: 'https://colburnschool.edu/conservatory/audition/prescreening-video-submission/',
  },
  {
    name: 'Manhattan School of Music', kind: 'Conservatory', city: 'New York', state: 'New York',
    acceptanceRate: 'Not currently published', acceptanceRateNote: 'Current undergraduate rate',
    repertoire: 'Prescreening and audition requirements vary by major and instrument. Applicants prepare the selections and technical material listed for their program, with live auditions required or preferred for many areas.',
    admissionsUrl: 'https://www.msmnyc.edu/admissions/audition-requirements/',
  },
];

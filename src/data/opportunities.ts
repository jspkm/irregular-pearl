import { additionalCompetitions } from './additionalCompetitions';
import { additionalSummerFestivals } from './additionalSummerFestivals';
export type OpportunityType = 'Competition' | 'Grant or award' | 'Summer festival';
export type CareerStage = 'Pre-College' | 'College Student' | 'Emerging Professional' | 'Professional';
export type ApplicationRoute = 'Open application' | 'Nomination only' | 'Invitation and application' | 'Varies by award';

export interface Opportunity {
  id: string;
  name: string;
  shortName?: string;
  type: OpportunityType;
  location: string;
  country: string;
  summary: string;
  disciplines: string[];
  careerStage: string;
  careerStages: CareerStage[];
  minimumAge?: number;
  maximumAge?: number;
  applicationRoute: ApplicationRoute;
  eligibility: string[];
  support: string[];
  schedule: string;
  currentNote?: string;
  officialUrl: string;
  applicationUrl?: string;
  sourceReviewed: string;
}

export const opportunityTypes: OpportunityType[] = ['Competition', 'Grant or award', 'Summer festival'];
export const careerStages: CareerStage[] = ['Pre-College', 'College Student', 'Emerging Professional', 'Professional'];

export function getCareerStage(careerStage: string): CareerStage {
  const stage = careerStage.toLowerCase();
  if (stage.includes('pre-professional') || stage.includes('pre-college')) return 'Pre-College';
  if (stage.includes('student')) return 'College Student';
  if (stage.includes('emerging') || stage.includes('young professional') || stage.includes('early career')) return 'Emerging Professional';
  return 'Professional';
}

const ageBands: Array<{ stage: CareerStage; minimumAge: number; maximumAge: number }> = [
  { stage: 'Pre-College', minimumAge: 0, maximumAge: 17 },
  { stage: 'College Student', minimumAge: 18, maximumAge: 24 },
  { stage: 'Emerging Professional', minimumAge: 25, maximumAge: 34 },
  { stage: 'Professional', minimumAge: 35, maximumAge: Number.POSITIVE_INFINITY },
];

export function getCareerStages(
  entry: Pick<Opportunity, 'careerStage' | 'careerStages' | 'minimumAge' | 'maximumAge'>,
): CareerStage[] {
  if (entry.minimumAge !== undefined || entry.maximumAge !== undefined) {
    const minimumAge = entry.minimumAge ?? 0;
    const maximumAge = entry.maximumAge ?? Number.POSITIVE_INFINITY;
    return ageBands
      .filter((band) => minimumAge <= band.maximumAge && maximumAge >= band.minimumAge)
      .map((band) => band.stage);
  }
  return entry.careerStages.length > 0 ? entry.careerStages : [getCareerStage(entry.careerStage)];
}

export const opportunities: Opportunity[] = [
  ...additionalCompetitions,
  ...additionalSummerFestivals,
  {
    id: 'bach-competition-leipzig',
    name: 'Bach Competition Leipzig',
    type: 'Competition',
    location: 'Leipzig, Saxony',
    country: 'Germany',
    summary: 'An international competition centered on the music of Johann Sebastian Bach and historically informed performance, presented by the Bach Archive Leipzig with a discipline that changes by edition.',
    disciplines: ['Voice', 'Violin', 'Piano', 'Organ', 'Historical performance'],
    careerStage: 'Emerging professional',
    careerStages: ['College Student', 'Emerging Professional', 'Professional'],
    applicationRoute: 'Open application',
    eligibility: ['Discipline and age requirements change by edition', 'International applicants are eligible'],
    support: ['Cash prizes', 'Special prizes', 'Concert engagements', 'International recognition'],
    schedule: 'Annual editions with rotating disciplines',
    currentNote: 'The 2027 edition is dedicated to voice and is scheduled for 13–21 March 2027.',
    officialUrl: 'https://www.bach-leipzig.de/en/node/307',
    applicationUrl: 'https://www.bach-leipzig.de/en/node/3916',
    sourceReviewed: '2026-08-25',
  },
  {
    id: 'international-tchaikovsky-competition',
    name: 'International Tchaikovsky Competition',
    type: 'Competition',
    location: 'Moscow and Saint Petersburg',
    country: 'Russia',
    summary: 'A large international performance competition founded in 1958, spanning solo instrumental, voice, and wind disciplines across multiple rounds.',
    disciplines: ['Piano', 'Violin', 'Cello', 'Voice', 'Woodwinds', 'Brass'],
    careerStage: 'Emerging professional',
    careerStages: ['College Student', 'Emerging Professional', 'Professional'],
    applicationRoute: 'Open application',
    eligibility: ['Requirements are published for each edition', 'International applicants are eligible'],
    support: ['Cash prizes', 'Laureate title', 'Performance exposure', 'International broadcast'],
    schedule: 'Every four years',
    currentNote: 'The official site identifies 2027 as the next competition year.',
    officialUrl: 'https://www.tchaikovskycompetition.com/en/',
    sourceReviewed: '2026-08-25',
  },
  {
    id: 'queen-elisabeth-competition',
    name: 'Queen Elisabeth Competition',
    type: 'Competition',
    location: 'Brussels',
    country: 'Belgium',
    summary: 'An annual international competition founded in 1937 that rotates among violin, piano, voice, and cello and includes preselection, public rounds, and orchestral finals.',
    disciplines: ['Violin', 'Piano', 'Voice', 'Cello'],
    careerStage: 'Young professional',
    careerStages: ['Pre-College', 'College Student', 'Emerging Professional', 'Professional'],
    minimumAge: 18,
    maximumAge: 30,
    applicationRoute: 'Open application',
    eligibility: ['Classically trained musicians', 'Published age limit is generally 18–30', 'Discipline rotates by year'],
    support: ['Cash prizes', 'Laureate concerts', 'Broadcast exposure', 'Career development'],
    schedule: 'Annual, with rotating discipline',
    currentNote: 'Voice is scheduled for 2027, violin for 2028, and piano for 2029.',
    officialUrl: 'https://queenelisabethcompetition.be/en/competitions/',
    applicationUrl: 'https://queenelisabethcompetition.be/en/apply',
    sourceReviewed: '2026-08-25',
  },
  {
    id: 'avery-fisher-career-grants',
    name: 'Avery Fisher Career Grants',
    type: 'Grant or award',
    location: 'New York, New York',
    country: 'United States',
    summary: 'Annual career grants administered by Lincoln Center for emerging classical instrumentalists and chamber ensembles judged to have major career potential.',
    disciplines: ['Instrumental performance', 'Chamber music'],
    careerStage: 'Emerging professional',
    careerStages: ['Emerging Professional'],
    applicationRoute: 'Nomination only',
    eligibility: ['U.S. citizens or permanent residents', 'Solo instrumentalists and, since 2004, chamber ensembles', 'Artists cannot apply directly'],
    support: ['$25,000 career grant', 'Professional recognition', 'Recorded performance materials'],
    schedule: 'Annual; up to five grants may be awarded',
    currentNote: 'Candidates are confidentially nominated by the program’s Recommendation Board.',
    officialUrl: 'https://www.lincolncenter.org/series/avery-fisher-artist-program/',
    sourceReviewed: '2026-08-25',
  },
  {
    id: 'fulbright-us-student-arts',
    name: 'Fulbright U.S. Student Program — Arts',
    shortName: 'Fulbright Arts',
    type: 'Grant or award',
    location: 'Approximately 140 host countries',
    country: 'International',
    summary: 'A U.S. government international exchange program through which graduating seniors, graduate students, young professionals, and artists can propose study or research projects abroad, including music projects.',
    disciplines: ['Composition', 'Conducting', 'Historical performance', 'Instrumental performance', 'Jazz', 'Opera', 'Voice', 'World music'],
    careerStage: 'College student and early career',
    careerStages: ['College Student', 'Emerging Professional'],
    applicationRoute: 'Varies by award',
    eligibility: ['U.S. citizenship for the U.S. Student Program', 'A bachelor’s degree or equivalent is generally required by the grant start', 'Country-specific requirements and affiliation apply'],
    support: ['Study or research funding', 'International affiliation', 'Country-specific living and travel support'],
    schedule: 'Annual competition; awards and requirements vary by host country',
    currentNote: 'Music applicants submit discipline-specific arts portfolio materials. Always consult the selected country’s current award page.',
    officialUrl: 'https://us.fulbrightonline.org/applicants/types-of-awards/study-research',
    applicationUrl: 'https://us.fulbrightonline.org/applicants/application-components/arts',
    sourceReviewed: '2026-08-25',
  },
  {
    id: 'marlboro-music',
    name: 'Marlboro Music',
    shortName: 'Marlboro',
    type: 'Summer festival',
    location: 'Marlboro, Vermont',
    country: 'United States',
    summary: 'A seven-week chamber-music retreat and festival where emerging musicians work intensively with senior artists before selected collaborations reach public performance.',
    disciplines: ['Strings', 'Piano', 'Woodwinds', 'Voice', 'Chamber music'],
    careerStage: 'Advanced and emerging professional',
    careerStages: ['College Student', 'Emerging Professional', 'Professional'],
    applicationRoute: 'Invitation and application',
    eligibility: ['Instrument needs and selection processes vary by season', 'Admission is highly selective'],
    support: ['Intensive chamber-music study', 'Senior-artist mentorship', 'Festival performances', 'Tour consideration'],
    schedule: 'Seven-week summer residency',
    officialUrl: 'https://www.marlboromusic.org/',
    sourceReviewed: '2026-08-25',
  },
  {
    id: 'taos-school-of-music',
    name: 'Taos School of Music',
    shortName: 'Taos',
    type: 'Summer festival',
    location: 'Taos and Taos Ski Valley, New Mexico',
    country: 'United States',
    summary: 'A small, immersive chamber-music school and festival in which young artists prepare unfamiliar repertoire on a professional rehearsal schedule with established chamber musicians.',
    disciplines: ['Violin', 'Viola', 'Cello', 'Piano', 'Chamber music'],
    careerStage: 'Advanced college student and emerging professional',
    careerStages: ['College Student', 'Emerging Professional'],
    applicationRoute: 'Open application',
    eligibility: ['Audition-based selection', 'Instrument complement is set by the program'],
    support: ['Chamber-music coaching', 'Young Artist performances', 'Faculty mentorship', 'Summer residency'],
    schedule: 'Annual summer program and concert festival',
    currentNote: 'The official site lists Season 64 for 10 June–8 August 2027.',
    officialUrl: 'https://taosschoolofmusic.com/',
    applicationUrl: 'https://taosschoolofmusic.com/students/',
    sourceReviewed: '2026-08-25',
  },
  {
    id: 'olympic-chamber-music-fellowship',
    name: 'Olympic Chamber Music Fellowship',
    type: 'Summer festival',
    location: 'Port Townsend, Washington',
    country: 'United States',
    summary: 'A selective chamber-music fellowship within the Olympic Music Festival that pairs a small cohort of fellows with established performers for collaboration, mentorship, teaching, and public concerts.',
    disciplines: ['Violin', 'Viola', 'Cello', 'Piano', 'Chamber music'],
    careerStage: 'Advanced college student and emerging professional',
    careerStages: ['College Student', 'Emerging Professional'],
    minimumAge: 18,
    applicationRoute: 'Open application',
    eligibility: ['Age 18 or older', 'Individuals and established ensembles may apply', 'Up to five participants are typically selected'],
    support: ['Full scholarship', 'Housing', 'Meal stipend', 'Local transportation', 'Mentorship and performances'],
    schedule: 'Two-week summer fellowship',
    officialUrl: 'https://www.olympicmusicfestival.org/olympic-chamber-music-fellowship',
    applicationUrl: 'https://www.olympicmusicfestival.org/olympic-chamber-music-fellowship',
    sourceReviewed: '2026-08-25',
  },
  {
    id: 'music-academy-fellowship-institute',
    name: 'Music Academy Fellowship Institute',
    type: 'Summer festival',
    location: 'Santa Barbara, California',
    country: 'United States',
    summary: 'A six-week pre-professional training institute within Music Academy’s Summer Music Festival & School, combining orchestral, chamber, opera, studio, and career-development work.',
    disciplines: ['Orchestral instruments', 'Piano', 'Voice', 'Conducting', 'Opera', 'Chamber music'],
    careerStage: 'College student and emerging professional',
    careerStages: ['College Student', 'Emerging Professional'],
    minimumAge: 18,
    maximumAge: 34,
    applicationRoute: 'Open application',
    eligibility: ['Ages 18–34 under the published 2026 structure', 'Audition and discipline-specific requirements apply'],
    support: ['Full scholarship', 'Tuition', 'Housing', 'Meals', 'Lessons, masterclasses, and performances'],
    schedule: 'Six-week summer institute',
    officialUrl: 'https://musicacademy.org/',
    applicationUrl: 'https://musicacademy.org/admissions/',
    sourceReviewed: '2026-08-25',
  },
];

export const opportunitiesById = new Map(opportunities.map((entry) => [entry.id, entry]));

export function groupOpportunitiesByType(entries = opportunities): Record<OpportunityType, Opportunity[]> {
  return opportunityTypes.reduce((groups, type) => {
    groups[type] = entries.filter((entry) => entry.type === type).sort((a, b) => a.name.localeCompare(b.name));
    return groups;
  }, {} as Record<OpportunityType, Opportunity[]>);
}

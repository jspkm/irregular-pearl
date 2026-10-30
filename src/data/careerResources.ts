export const performanceResourceTypes = ['Performance Resources — Psychology', 'Performance Resources — Physical health', 'Performance Resources — Lessons, masterclasses, and interviews'] as const;
export type PerformanceResourceType = typeof performanceResourceTypes[number];

export const studyResourceTypes = ['Study Resources — Music history', 'Study Resources — Performance and practice', 'Study Resources — Music libraries (in person/virtual)'] as const;
export type StudyResourceType = typeof studyResourceTypes[number];

export type CareerResourceFocus = 'Performance auditions' | 'Teaching and administration' | 'Orchestra careers' | 'Opera careers' | 'Inclusive career listings' | 'Broader arts careers' | 'Performance Resources' | 'Study Resources' | 'Performance psychology' | 'Practice methods' | 'Classical music news';

export interface CareerResource {
  name: string;
  authors?: string;
  categories?: ('Performance Resources' | PerformanceResourceType | StudyResourceType | 'Teaching Resources' | 'Classical Music News Database')[];
  focus: CareerResourceFocus;
  description: string;
  url: string;
  instagramUrl?: string;
  accessNote?: string;
  sourceReviewed: string;
}

export function getCareerResourceTypes(resource: CareerResource): string[] {
  if (resource.categories?.length) return resource.categories;
  if (resource.focus === 'Performance Resources') return [resource.focus];
  if (resource.focus === 'Study Resources') return ['Study Resources — Music libraries (in person/virtual)'];
  return [resource.focus === 'Performance auditions' || resource.focus === 'Orchestra careers' ? 'Orchestra jobs and auditions' : 'Music career resources'];
}

export const careerResources: CareerResource[] = [
  {
    name: 'tonebase',
    focus: 'Performance Resources',
    categories: ['Performance Resources — Lessons, masterclasses, and interviews', 'Study Resources — Performance and practice'],
    description: 'An online music-learning platform with artist-led video lessons, courses, interviews, and live workshops covering repertoire, technique, and interpretation across instruments and voice.',
    url: 'https://www.tonebase.co/',
    accessNote: 'Full platform access requires a subscription. Selected lessons and other resources are available free on the website.',
    sourceReviewed: '2026-10-28',
  },
  {
    name: 'Alexander Technique — Resources for Musicians',
    focus: 'Performance Resources',
    categories: ['Performance Resources — Physical health'],
    description: 'An introduction to the Alexander Technique for instrumentalists and singers, with articles, videos, audio interviews, and books exploring movement, body awareness, and habitual tension in music-making.',
    url: 'https://alexandertechnique.com/musicians/',
    sourceReviewed: '2026-10-28',
  },
  {
    name: 'Lori Schiff — Alexander Technique',
    focus: 'Performance Resources',
    categories: ['Performance Resources — Physical health'],
    description: 'Alexander Technique teacher Lori Schiff’s official website, with an introduction for musicians, reflections on awareness and movement, and information about her teaching and workshops.',
    url: 'https://www.lorischiff.com/',
    sourceReviewed: '2026-10-28',
  },
  {
    name: 'JSTOR',
    focus: 'Study Resources',
    categories: ['Study Resources — Music history'],
    description: 'A scholarly research platform for finding music journals, books, and other academic sources on composers, musical history, criticism, and cultural context.',
    url: 'https://www.jstor.org/',
    accessNote: 'Access varies by item and institutional subscription. Free personal accounts offer limited online reading of eligible articles; some content is open access.',
    sourceReviewed: '2026-10-28',
  },
  {
    name: 'Grove Music Online',
    focus: 'Study Resources',
    categories: ['Study Resources — Music history'],
    description: 'A scholarly music reference with articles on composers, musical traditions, instruments, and terminology, with bibliographies for further research. Grove is available through Oxford Music Online.',
    url: 'https://www.oxfordmusiconline.com/grovemusic/',
    accessNote: 'Full articles generally require a subscription or access through a participating library or institution.',
    sourceReviewed: '2026-10-28',
  },
  {
    name: 'Oxford Music Online',
    focus: 'Study Resources',
    categories: ['Study Resources — Music history'],
    description: 'Oxford’s gateway to music reference works, including Grove Music Online, The Oxford Dictionary of Music, and The Oxford Companion to Music. Use it to explore musical history, composer biographies, and reference definitions.',
    url: 'https://www.oxfordmusiconline.com/',
    accessNote: 'Available reference works depend on the subscription. Check access through your public library, school, or university; Grove is part of this platform, not an unrelated database.',
    sourceReviewed: '2026-10-28',
  },
  {
    name: "The New York Public Library for the Performing Arts",
    focus: "Study Resources",
    categories: ["Study Resources — Music libraries (in person/virtual)"],
    description: "A public performing arts library at Lincoln Center in New York City, with circulating, reference, and archival collections covering music, dance, theater, and recorded sound.",
    url: "https://www.nypl.org/locations/lpa",
    accessNote: "Borrowing and access to research or archival materials follow library policies; check collection-specific requirements before visiting.",
    sourceReviewed: "2026-10-27",
  },
  {
    name: "Boston Public Library — Music Research Collection",
    focus: "Study Resources",
    categories: ["Study Resources — Music libraries (in person/virtual)"],
    description: "A public music research collection at the Central Library in Copley Square, Boston, with scores, librettos, composer editions, and reference materials on music history, theory, composition, and education.",
    url: "https://guides.bpl.org/musicref",
    accessNote: "Consult the library for collection access and borrowing rules; some online music resources require a library card.",
    sourceReviewed: "2026-10-27",
  },
  {
    name: "Free Library of Philadelphia — Music Department",
    focus: "Study Resources",
    categories: ["Study Resources — Music libraries (in person/virtual)", "Performance Resources"],
    description: "A public music library at Parkway Central Library in Philadelphia, with study scores, instrumental music, chamber music scores and parts, and books on music history, theory, and performance technique.",
    url: "https://libwww.freelibrary.org/locations/departments/music-department",
    accessNote: "Borrowing is subject to library membership and lending policies. Some historical collections are for in-library use only.",
    sourceReviewed: "2026-10-27",
  },
  {
    name: "Los Angeles Public Library — Art, Music & Recreation Department",
    focus: "Study Resources",
    categories: ["Study Resources — Music libraries (in person/virtual)", "Performance Resources"],
    description: "A public collection at Los Angeles Central Library covering music theory and history, sheet music, orchestral scores and parts, and the visual and performing arts, with a song index and sheet music assistance.",
    url: "https://www.lapl.org/branches/central-library/departments/art-music-recreation",
    accessNote: "Digital resources may require an LAPL library card. Orchestral score rentals serve Southern California orchestras and carry fees.",
    sourceReviewed: "2026-10-27",
  },
  {
    name: 'Suzuki Method — Suzuki Association of the Americas',
    focus: 'Teaching and administration',
    categories: ['Teaching Resources'],
    description: 'An official introduction to Shinichi Suzuki’s approach to music education, outlining its mother-tongue philosophy, listening, repetition, supportive learning environment, and involvement of a parent or other supporting adult.',
    url: 'https://suzukiassociation.org/about/about-the-suzuki-method/',
    sourceReviewed: '2026-10-23',
  },
  {
    name: 'Classic FM — Composers',
    focus: 'Study Resources',
    categories: ['Study Resources — Music history'],
    description: 'Classic FM’s alphabetical composer directory, linking to composer profiles and related articles for exploring classical-music history and repertoire.',
    url: 'https://www.classicfm.com/composers/',
    sourceReviewed: '2026-10-23',
  },
  {
    name: 'CelloBello',
    focus: 'Practice methods',
    categories: ['Study Resources — Performance and practice', 'Performance Resources — Lessons, masterclasses, and interviews'],
    description: 'An educational resource with cello and chamber-ensemble lessons, articles, and repertoire references covering technique, interpretation, practicing, mindset, and rehearsal strategies.',
    url: 'https://cellobello.org/',
    sourceReviewed: '2026-10-23',
  },
  {
    name: 'The Violin Channel — Classical Music News',
    focus: 'Classical music news',
    categories: ['Classical Music News Database'],
    description: 'The Violin Channel’s classical-music news page, covering artists, orchestras, appointments, competitions, and developments across the classical-music community.',
    url: 'https://theviolinchannel.com/classical-music-news/',
    sourceReviewed: '2026-10-23',
  },
  {
    name: 'Classic FM — News',
    focus: 'Classical music news',
    categories: ['Classical Music News Database'],
    description: 'Classic FM’s music-news page, featuring classical artists, performances, recordings, awards, and wider stories from the music world.',
    url: 'https://www.classicfm.com/music-news/',
    sourceReviewed: '2026-10-23',
  },
  {
    name: 'The Inner Game of Tennis',
    authors: 'W. Timothy Gallwey',
    focus: 'Performance psychology',
    categories: ['Study Resources — Performance and practice', 'Performance Resources — Psychology'],
    description: 'A book about the mental side of tennis, including attention, self-judgment, and learning. Included here as a cross-disciplinary reference for musicians exploring performance psychology.',
    url: 'https://theinnergame.com/the-inner-game-of-tennis/',
    sourceReviewed: '2026-10-23',
  },
  {
    name: 'PracticeMind for Everyone',
    authors: 'Hans Jørgen Jensen and Oleksander Mycyk',
    focus: 'Practice methods',
    categories: ['Study Resources — Performance and practice'],
    description: 'A practice-method book for musicians across instruments, presenting a mental practice model and techniques for organizing practice and preparing repertoire.',
    url: 'https://ovationpressbooks.com/products/practicemind-for-everyone',
    sourceReviewed: '2026-10-23',
  },
  {
    name: 'IMSLP — Petrucci Music Library',
    focus: 'Study Resources',
    description: 'A searchable library of public-domain sheet music and recordings, organized by composer, instrumentation, genre, and historical period for repertoire exploration and score study.',
    url: 'https://imslp.org/',
    sourceReviewed: '2026-10-23',
  },
  {
    name: 'Henle Library App',
    focus: 'Study Resources',
    description: 'Digital Henle Urtext editions with tools for working with scores and fingerings from selected musicians, supporting detailed score study and repertoire preparation.',
    url: 'https://henle-library.com/',
    sourceReviewed: '2026-10-23',
  },
  {
    name: 'forScore',
    focus: 'Performance Resources',
    description: 'A sheet-music reader for Apple devices with PDF organization, annotations, setlists, bookmarks, and page-turning tools for rehearsal and performance.',
    url: 'https://forscore.co/',
    sourceReviewed: '2026-10-23',
  },
  {
    name: 'Audition Forum',
    focus: 'Performance auditions',
    description: 'An orchestral-audition community with audition and opportunity listings, discussion groups, reported results, and instrument-specific conversation.',
    url: 'https://www.auditionforum.com/',
    instagramUrl: 'https://www.instagram.com/auditionforum/',
    accessNote: 'Some community features require joining or signing in.',
    sourceReviewed: '2026-08-27',
  },
  {
    name: 'Musical Chairs',
    focus: 'Performance auditions',
    description: 'An international classical-music board covering performance, teaching, and administrative jobs, plus competitions, courses, and orchestra directories.',
    url: 'https://www.musicalchairs.info/',
    sourceReviewed: '2026-08-27',
  },
  {
    name: 'League of American Orchestras Jobs Center',
    focus: 'Orchestra careers',
    description: 'U.S.-focused openings across orchestras, from artistic and production work to development, marketing, operations, and executive leadership.',
    url: 'https://jobs.americanorchestras.org/',
    accessNote: 'Some job-seeker tools and member resources may require an account or membership.',
    sourceReviewed: '2026-08-27',
  },
  {
    name: 'OPERA America — Jobs in Opera',
    focus: 'Opera careers',
    description: 'Employment listings for singers, artistic teams, administrators, production staff, fundraisers, educators, and other opera professionals.',
    url: 'https://www.operaamerica.org/jobs/',
    sourceReviewed: '2026-08-27',
  },
  {
    name: 'Sphinx Organization Job Postings',
    focus: 'Inclusive career listings',
    description: 'Music-sector opportunities and external job resources curated by an organization focused on access, representation, and excellence in classical music.',
    url: 'https://www.sphinxmusic.org/job-postings/',
    sourceReviewed: '2026-08-27',
  },
  {
    name: 'Arts Jobs',
    focus: 'Broader arts careers',
    description: 'A searchable U.K. arts board with filters for music, education, production, administration, seniority, contract type, and region.',
    url: 'https://www.artsjobs.org.uk/jobs',
    sourceReviewed: '2026-08-27',
  },
];

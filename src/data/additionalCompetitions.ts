import type { Opportunity } from './opportunities';

// Official source pages checked 2026-10-23; past editions are labeled explicitly.
export const additionalCompetitions: Opportunity[] = [
  {
    id: 'koussevitzky-young-artist-awards',
    name: 'Serge & Olga Koussevitzky Young Artist Awards',
    shortName: 'Musicians Club of New York Competition',
    type: 'Competition',
    location: 'New York, New York',
    country: 'United States',
    summary: 'The Musicians Club of New York’s competition for emerging performers, rotating among strings, piano, winds and brass, voice, and other categories, with cash prizes and winner recitals.',
    disciplines: ['Strings', 'Piano', 'Woodwinds', 'Brass', 'Voice'],
    careerStage: 'Emerging performers',
    careerStages: ['College Student', 'Emerging Professional'],
    applicationRoute: 'Open application',
    eligibility: ['The featured discipline and entry requirements vary by edition.', 'Consult the official application for current eligibility, supporting materials, and repertoire.'],
    support: ['Cash prizes', 'Recital in the Musicians Club of New York Concert Series', 'Performance fee'],
    schedule: 'Rotating-discipline competition; consult the current edition',
    currentNote: 'Source reviewed 23 October 2026: the official page lists a 2026 piano competition with a May 1, 2026 submission deadline, which has passed. A new application cycle is not confirmed here.',
    officialUrl: 'https://www.musiciansclubny.org/competition',
    sourceReviewed: '2026-10-23',
  },
  {
    "id": "yamaha-young-performing-artists",
    "name": "Yamaha Young Performing Artists Competition",
    "type": "Competition",
    "location": "Muncie, Indiana / recorded selection",
    "country": "United States",
    "summary": "A competition recognizing young classical, jazz, and contemporary instrumentalists, with winners invited to a performance and career-development celebration weekend.",
    "disciplines": [
      "Woodwinds",
      "Brass",
      "Percussion",
      "Strings",
      "Piano"
    ],
    "careerStage": "Students and emerging performers",
    "careerStages": [
      "College Student",
      "Emerging Professional"
    ],
    "applicationRoute": "Open application",
    "eligibility": [
      "Applicants must meet U.S. residency and full-time U.S. study requirements.",
      "A supporting nomination is required; eligible instruments and recording rules are published by Yamaha."
    ],
    "support": [
      "Performance opportunity",
      "Career-development workshops",
      "Travel and accommodation under award terms"
    ],
    "schedule": "Annual competition",
    "officialUrl": "https://usa.yamaha.com/education/yypa/index.html",
    "sourceReviewed": "2026-10-23",
    "minimumAge": 18,
    "maximumAge": 22
  },
  {
    "id": "artist-presentation-society",
    "name": "Artist Presentation Society Competition",
    "type": "Competition",
    "location": "St. Louis, Missouri",
    "country": "United States",
    "summary": "A concerto and aria competition supporting emerging classical musicians with orchestral performance opportunities and awards, subject to Midwestern residency or study eligibility.",
    "disciplines": [
      "Orchestral instruments",
      "Piano",
      "Classical guitar",
      "Voice"
    ],
    "careerStage": "Students and emerging performers",
    "careerStages": [
      "College Student",
      "Emerging Professional"
    ],
    "applicationRoute": "Open application",
    "eligibility": [
      "Regional eligibility covers specified Midwestern states; current or qualifying previous residency or study may count.",
      "Age limits differ for singers and instrumentalists. Prior performance experience and other restrictions apply."
    ],
    "support": [
      "Cash awards",
      "Orchestral performance opportunities"
    ],
    "schedule": "Annual competition",
    "officialUrl": "https://www.apsmusic.org/competition_overview.html",
    "sourceReviewed": "2026-10-23"
  },
  {
    "id": "musicians-club-of-women",
    "name": "Musicians Club of Women Annual Awards Competition",
    "type": "Competition",
    "location": "Chicago, Illinois",
    "country": "United States",
    "summary": "An annual merit-based competition supporting women musicians through awards for professional development, with instrumental and vocal divisions and regional eligibility.",
    "disciplines": [
      "Instrumental performance",
      "Voice"
    ],
    "careerStage": "Students and emerging performers",
    "careerStages": [
      "College Student",
      "Emerging Professional"
    ],
    "applicationRoute": "Open application",
    "eligibility": [
      "Open to women-identifying musicians living or studying in the eligible Midwestern states.",
      "Division-specific age, repertoire, and application requirements apply; consult the current rules."
    ],
    "support": [
      "Financial awards",
      "Professional development support"
    ],
    "schedule": "Annual awards competition",
    "officialUrl": "https://www.musiciansclubofwomen.org/award-information",
    "sourceReviewed": "2026-10-23"
  },
  {
    "id": "schadt-string-competition",
    "name": "National Schadt String Competition",
    "type": "Competition",
    "location": "Allentown, Pennsylvania",
    "country": "United States",
    "summary": "A national string competition organized by the Allentown Symphony Association, alternating between violin and cello and offering cash awards and a concerto engagement.",
    "disciplines": [
      "Violin",
      "Cello"
    ],
    "careerStage": "Students and emerging performers",
    "careerStages": [
      "College Student",
      "Emerging Professional"
    ],
    "applicationRoute": "Open application",
    "eligibility": [
      "The featured instrument changes by edition.",
      "Check the current age, residency, repertoire, and excluded-concerto requirements."
    ],
    "support": [
      "Cash prizes",
      "Solo appearance with the Allentown Symphony Orchestra"
    ],
    "schedule": "Biennial; alternates violin and cello",
    "officialUrl": "https://millersymphonyhall.org/education-engagement/schadt/",
    "sourceReviewed": "2026-10-23"
  },
  {
    "id": "irving-klein-string-competition",
    "name": "Irving M. Klein International String Competition",
    "type": "Competition",
    "location": "San Francisco, California",
    "country": "United States",
    "summary": "An international competition for young string players combining recital rounds, a commissioned work, cash awards, and recital and concerto performance opportunities.",
    "disciplines": [
      "Violin",
      "Viola",
      "Cello",
      "Double bass"
    ],
    "careerStage": "Students and emerging performers",
    "careerStages": [
      "Pre-College",
      "College Student",
      "Emerging Professional"
    ],
    "applicationRoute": "Open application",
    "eligibility": [
      "Young string players must meet the current age and instrument rules.",
      "Semifinal and final programs must satisfy published repertoire and timing requirements."
    ],
    "support": [
      "Cash prizes",
      "Recital and concerto engagements",
      "Commissioned-work performance"
    ],
    "schedule": "Annual competition",
    "officialUrl": "https://kleincompetition.org/competition-overview/",
    "sourceReviewed": "2026-10-23"
  },
  {
    "id": "paulo-cello-competition",
    "name": "International Paulo Cello Competition",
    "type": "Competition",
    "location": "Helsinki, Espoo, and Lahti",
    "country": "Finland",
    "summary": "An international cello competition founded by Arto Noras, presenting demanding solo repertoire and orchestral finals, with monetary prizes for leading competitors.",
    "disciplines": [
      "Cello"
    ],
    "careerStage": "Students and emerging performers",
    "careerStages": [
      "College Student",
      "Emerging Professional"
    ],
    "applicationRoute": "Open application",
    "eligibility": [
      "Age, repertoire, and application requirements are announced per edition.",
      "The official site currently documents the 2023 edition; a new application cycle is not confirmed here."
    ],
    "support": [
      "Cash prizes",
      "Orchestral finals",
      "International performance exposure"
    ],
    "schedule": "Periodic editions; check the official announcement",
    "officialUrl": "https://cellocompetitionpaulo.org/en/frontpage/",
    "sourceReviewed": "2026-10-23",
    "currentNote": "Source reviewed 23 October 2026: the linked official page documents a past edition. New application dates and requirements have not been verified."
  },
  {
    "id": "ecso-instrumental-competition",
    "name": "ECSO Annual Instrumental Competition",
    "type": "Competition",
    "location": "New London, Connecticut",
    "country": "United States",
    "summary": "The Eastern Connecticut Symphony Orchestra’s competition for young instrumentalists, with recorded preliminary selection, live concerto finals, and cash awards.",
    "disciplines": [
      "Instrumental performance"
    ],
    "careerStage": "Students and emerging performers",
    "careerStages": [
      "College Student",
      "Emerging Professional"
    ],
    "applicationRoute": "Open application",
    "eligibility": [
      "Applicants must be 25 or younger on the competition date.",
      "Previous first-prize winners are not eligible; recording and concerto requirements apply."
    ],
    "support": [
      "Cash prizes",
      "Possible guest-soloist appearance with the orchestra"
    ],
    "schedule": "Annual instrumental competition",
    "officialUrl": "https://ectsymphony.com/instrumental-competition/",
    "sourceReviewed": "2026-10-23",
    "maximumAge": 25
  },
  {
    "id": "antonio-janigro-cello-competition",
    "name": "Antonio Janigro International Cello Competition",
    "type": "Competition",
    "location": "Zagreb; junior editions in Poreč",
    "country": "Croatia",
    "summary": "An international cello competition with senior and junior traditions in Croatia, featuring adjudicated performances and awards. Consult the organizer for the next edition.",
    "disciplines": [
      "Cello"
    ],
    "careerStage": "Students and emerging performers",
    "careerStages": [
      "Pre-College",
      "College Student",
      "Emerging Professional"
    ],
    "applicationRoute": "Open application",
    "eligibility": [
      "Junior and senior editions have separate age and repertoire rules.",
      "Linked official venue report documents the 2024 Zagreb edition, not an open application cycle."
    ],
    "support": [
      "Cash awards in documented editions",
      "Concert engagements in documented editions"
    ],
    "schedule": "Edition-based; next application cycle unconfirmed",
    "officialUrl": "https://www.lisinski.hr/hr/novosti/proglaseni-pobjednici-8-izdanja-natjecanja-antonio/",
    "sourceReviewed": "2026-10-23",
    "currentNote": "Source reviewed 23 October 2026: the linked official page documents a past edition. New application dates and requirements have not been verified."
  },
  {
    "id": "david-popper-cello-competition",
    "name": "David Popper International Cello Competition",
    "type": "Competition",
    "location": "Várpalota",
    "country": "Hungary",
    "summary": "An international youth cello competition held at Thury Castle, organized around age-group categories and the presentation of developing cellists to an international jury.",
    "disciplines": [
      "Cello"
    ],
    "careerStage": "Students and emerging performers",
    "careerStages": [
      "Pre-College",
      "College Student",
      "Emerging Professional"
    ],
    "applicationRoute": "Open application",
    "eligibility": [
      "Age-group categories and repertoire are set by the organizer.",
      "Consult the upcoming edition’s announcement before preparing an application."
    ],
    "support": [
      "International jury assessment",
      "Competition recognition"
    ],
    "schedule": "Periodic editions; next rules published by organizer",
    "officialUrl": "https://www.popper-cello-competition.com/",
    "sourceReviewed": "2026-10-23"
  },
  {
    "id": "east-coast-international-competition",
    "name": "East Coast International Competition",
    "type": "Competition",
    "location": "United States; live and video auditions",
    "country": "United States",
    "summary": "A music competition offering instrumental, vocal, and ensemble categories, with live and video audition options and category-specific repertoire requirements.",
    "disciplines": [
      "Instrumental performance",
      "Voice",
      "Ensembles"
    ],
    "careerStage": "Students and emerging performers",
    "careerStages": [
      "Pre-College",
      "College Student",
      "Emerging Professional"
    ],
    "applicationRoute": "Open application",
    "eligibility": [
      "Check current age-group and category requirements.",
      "Memory, accompaniment, and unedited-video requirements differ by category."
    ],
    "support": [
      "Adjudicated performance assessment",
      "Competition recognition"
    ],
    "schedule": "Edition-based competition",
    "officialUrl": "https://www.ecicompetition.com/",
    "sourceReviewed": "2026-10-23"
  }
];

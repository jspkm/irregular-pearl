export const upkeepCategories = [
  { id: 'strings', label: 'Strings' },
  { id: 'woodwinds', label: 'Woodwinds' },
  { id: 'brass', label: 'Brass' },
  { id: 'percussion', label: 'Percussion' },
  { id: 'keyboard', label: 'Keyboard' },
  { id: 'voice', label: 'Voice' },
] as const;

export const upkeepLevels = [
  { id: 'beginner', label: 'Beginner' },
  { id: 'advanced', label: 'Advanced' },
] as const;

export const stringsBeginnerResources = [
  {
    topic: 'Bow rehairing',
    title: 'Care and Maintenance of a Violin: Occasional maintenance',
    publisher: 'Yamaha',
    scope: 'Violin and bow',
    summary: 'Explains how bow hair loses grip and how seasonal changes affect its tension. Yamaha gives six months to a year as a guideline for beginners, rather than a fixed schedule for every player.',
    url: 'https://www.yamaha.com/en/musical_instrument_guide/violin/maintenance/maintenance003.html',
    reviewedAt: '2026-10-20',
  },
  {
    topic: 'Changing strings',
    title: 'PIRASTRO String Manual',
    publisher: 'Pirastro',
    scope: 'Bowed strings; includes violin-specific details',
    summary: 'The string maker’s illustrated manual covers installation, tuning, and maintenance. It explains why strings should be replaced one at a time and why the bridge position needs attention during tuning.',
    url: 'https://www.pirastro.com/public_pirastro/pages/en/String-Manual-00003/',
    reviewedAt: '2026-10-20',
  },
  {
    topic: 'Daily cleaning and storage',
    title: 'Care and Maintenance of a Violin: Daily care and maintenance',
    publisher: 'Yamaha',
    scope: 'Violin',
    summary: 'Introduces wiping away rosin after playing, using separate cloths for different areas, and storing the instrument in its case. Also explains the effects of temperature and humidity and when stubborn buildup needs a specialist.',
    url: 'https://www.yamaha.com/en/musical_instrument_guide/violin/maintenance/',
    reviewedAt: '2026-10-20',
  },
  {
    topic: 'Routine instrument and bow checks',
    title: 'General Care for Your Stringed Instrument',
    publisher: 'Yamaha',
    scope: 'Violin, viola, cello, and double bass',
    summary: 'A practical overview of checking strings, pegs, seams, the bridge, and the bow, with a downloadable student checklist. Covers loosening bow hair after playing and spotting issues for a qualified luthier to assess.',
    url: 'https://hub.yamaha.com/music-educators/instruments/strings-instruments/general-care-for-your-stringed-instrument/',
    reviewedAt: '2026-10-20',
  },
] as const;

export const stringsAdvancedResources = [
  {
    topic: 'Fingerboard replaning and dressing',
    title: 'Guide to Proper Care and Maintenance of Violin Family Instruments and Bows (PDF, page 3)',
    publisher: 'The Sound Post',
    scope: 'Violin-family instruments · Workshop maintenance',
    summary: 'Explains how playing can leave grooves and unevenness in a fingerboard, and how planing, also called dressing, addresses that wear. The guide places this work among the repairs to discuss with a qualified string-instrument repairer.',
    url: 'https://www.thesoundpost.com/files/en/violin_care.pdf#page=3',
    reviewedAt: '2026-10-20',
  },
  {
    topic: 'Soundpost fit and adjustments',
    title: 'Guide to Proper Care and Maintenance of Violin Family Instruments and Bows (PDF, page 3)',
    publisher: 'The Sound Post',
    scope: 'Violin-family instruments · Workshop maintenance',
    summary: 'Describes the importance of a precisely fitted soundpost for sound production and the instrument’s structure. A useful starting point for a conversation with a luthier about fit and adjustment, rather than a do-it-yourself procedure.',
    url: 'https://www.thesoundpost.com/files/en/violin_care.pdf#page=3',
    reviewedAt: '2026-10-20',
  },
  {
    topic: 'Choosing an instrument',
    title: 'Eleven Tips for a Player or Parent on Buying a Better Violin (PDF)',
    publisher: 'Claire Givens · MNSOTA String Notes',
    scope: 'Violin-focused · Instrument and bow purchasing',
    summary: 'A specialist dealer’s guide to defining your needs, setting a budget, arranging trials, and seeking teacher feedback. Originally published in 2000; use it for the evaluation process, and confirm current trial and trade-in terms with the shop.',
    url: 'https://farrpublications.com/mnsotapedagogy/StringNotesIssues/SN_2000-04/MMEA-%20Eleven%20Tips%20for%20a%20Player%20or%20Parent%20on%20Buying%20a%20Better%20Violin%20--%20Claire%20Givens.pdf',
    reviewedAt: '2026-10-20',
  },
  {
    topic: 'Choosing a bow: contemporary and antique',
    title: 'Best Bow',
    publisher: 'Richard Ward · Ifshin Violins',
    scope: 'Violin-focused · Bow selection',
    summary: 'Discusses old French and modern bows, materials, balance, response, and testing bows with your own instrument. Includes makers such as Tourte, Peccatte, and Voirin. Originally published in 2004; the comparison and trial process are more useful than its historical prices.',
    url: 'https://www.ifshinviolins.com/Resources/Detail/Article/29/Best-Bow',
    reviewedAt: '2026-10-20',
  },
  {
    topic: 'Historic instrument makers',
    title: 'Instrument Makers',
    publisher: 'Darnton & Hersh Fine Violins',
    scope: 'Maker history · Specialist dealer archive',
    summary: 'An illustrated article index covering Antonio Stradivari, Nicolò Amati, Giovanni Battista Rogeri, David Tecchler, and the Gagliano family. Provides background on makers and their traditions when researching older instruments.',
    url: 'https://darntonhersh.com/instrument-makers/',
    reviewedAt: '2026-10-20',
  },
  {
    topic: 'Historic bow makers',
    title: 'Bows & Bow Makers',
    publisher: 'Darnton & Hersh Fine Violins',
    scope: 'Bow history · François-Nicolas Voirin',
    summary: 'A specialist archive introducing François-Nicolas Voirin and his connection to Jean-Baptiste Vuillaume’s workshop. Complements the Tourte, Peccatte, and Voirin discussion in the bow-selection resource above.',
    url: 'https://darntonhersh.com/bows-bow-makers/',
    reviewedAt: '2026-10-20',
  },
  {
    topic: 'Booking a seat for a cello: British Airways',
    title: 'Flying with musical instruments',
    publisher: 'British Airways',
    scope: 'Cello travel · Official airline policy',
    summary: 'Explains booking an adjacent seat for a cello in its case. At review, the additional seat had to be arranged through the airline or a travel agent, not online, at least 48 hours before departure. Check the current case limits, seat restrictions, and requirements for your itinerary before purchasing.',
    url: 'https://www.britishairways.com/content/information/baggage-essentials/musical-instruments',
    reviewedAt: '2026-10-20',
  },
  {
    topic: 'Booking a seat for a cello: Lufthansa',
    title: 'Sports baggage and special baggage — Taking musical instruments with you',
    publisher: 'Lufthansa',
    scope: 'Cello travel · Official airline policy',
    summary: 'The musical-instruments section explains additional-seat booking through the Service Center. At review, this seat had to be booked at the same time as the passenger ticket. Check current dimensions, weight limits, and the operating carrier’s rules before booking.',
    url: 'https://www.lufthansa.com/gb/en/sports-baggage',
    reviewedAt: '2026-10-20',
  },
] as const;

interface UpkeepResource {
  topic: string;
  title: string;
  publisher: string;
  scope: string;
  summary: string;
  url: string;
  reviewedAt: string;
}
function resource(topic: string, title: string, publisher: string, scope: string, summary: string, url: string): UpkeepResource {
  return { topic, title, publisher, scope, summary, url, reviewedAt: '2026-10-20' };
}

export const upkeepResources: Record<(typeof upkeepCategories)[number]['id'], Record<(typeof upkeepLevels)[number]['id'], readonly UpkeepResource[]>> = {
  strings: { beginner: stringsBeginnerResources, advanced: stringsAdvancedResources },
  woodwinds: {
    beginner: [
      resource('Cleaning after playing', 'Care and Maintenance of a Flute: Care and maintenance after playing', 'Yamaha', 'Flute', 'Illustrated manufacturer guidance on removing moisture from the flute after playing, using a cleaning rod and cloth or an appropriate swab.', 'https://www.yamaha.com/en/musical_instrument_guide/flute/maintenance/'),
      resource('Caring for a wooden instrument', 'Care and Maintenance of a Clarinet: Points to remember about the body', 'Yamaha', 'Wooden clarinet', 'Explains how rapid temperature and humidity changes affect a wooden clarinet, with guidance on acclimatization and introducing a new instrument to regular use.', 'https://www.yamaha.com/en/musical_instrument_guide/clarinet/maintenance/'),
    ],
    advanced: [
      resource('Keywork and joint checks', 'Care and Maintenance of a Flute: Periodic maintenance', 'Yamaha', 'Flute', 'Covers periodic keywork checks, lubrication, and stiff joints. Yamaha recommends shop adjustment for loose keys and specialist help when cleaning does not resolve a problem.', 'https://www.yamaha.com/en/musical_instrument_guide/flute/maintenance/maintenance002.html'),
      resource('Key oils and mechanism care', 'Care and Maintenance of a Clarinet: Monthly care and maintenance', 'Yamaha', 'Clarinet; oil distinctions across woodwinds', 'Explains key inspection, choosing the appropriate key-oil viscosity, and removing accumulated dust. Loose keywork is identified as a reason to seek adjustment at an instrument shop.', 'https://www.yamaha.com/en/musical_instrument_guide/clarinet/maintenance/maintenance004.html'),
    ],
  },
  brass: {
    beginner: [
      resource('After-playing care', 'Care and Maintenance of a Trumpet: Care and maintenance after playing', 'Yamaha', 'Trumpet', 'Introduces removing moisture and surface dirt after a session, with notes on caring for the instrument’s finish.', 'https://www.yamaha.com/en/musical_instrument_guide/trumpet/maintenance/'),
      resource('Daily slide care', 'Care and Maintenance of a Trombone: What do I need to do daily?', 'Yamaha', 'Trombone', 'Explains daily slide lubrication, moisture removal, and exterior care. Also identifies sluggish slide movement as a reason to have the instrument checked at a shop.', 'https://www.yamaha.com/en/musical_instrument_guide/trombone/maintenance/'),
    ],
    advanced: [
      resource('Valve and internal cleaning', 'Care and Maintenance of a Trumpet: Monthly care and maintenance', 'Yamaha', 'Trumpet', 'A manufacturer guide to periodic cleaning and valve care, including differences in oil viscosity and changing between oils.', 'https://www.yamaha.com/en/musical_instrument_guide/trumpet/maintenance/maintenance003.html'),
      resource('Rotors, slides, and lubricants', 'Care and Maintenance of a Horn: Weekly care and maintenance', 'Yamaha', 'Horn with rotary valves', 'Illustrates slide cleaning and distinguishes rotor-spindle and lever lubrication. Includes mouthpiece care; follow the instructions applicable to your instrument’s mechanism.', 'https://www.yamaha.com/en/musical_instrument_guide/horn/maintenance/maintenance002.html'),
    ],
  },
  percussion: {
    beginner: [
      resource('Protecting wooden bars', 'Care and Maintenance of a Marimba: Care and maintenance of the tone plates', 'Yamaha', 'Marimba with wooden bars', 'Explains dry cleaning, moisture protection, and mallet choices that avoid damaging wooden bars. Identifies damaged or out-of-tune bars as needing replacement.', 'https://www.yamaha.com/en/musical_instrument_guide/marimba/maintenance/'),
      resource('Cymbal cleaning and finishes', 'Frequently Asked Questions — Cymbal care', 'Zildjian', 'Zildjian cymbals; finish-specific guidance', 'The cymbal-care section explains cleaning choices and finish restrictions. In particular, the manufacturer’s Brilliant cleaning polish is intended only for Brilliant-finish cymbals.', 'https://zildjian.com/pages/frequently-asked-questions'),
    ],
    advanced: [
      resource('Timpani maintenance and range', 'Timpani Maintenance', 'Yamaha', 'Timpani', 'A maintenance overview for school and ensemble percussion, including timpani head care and standard tonal ranges.', 'https://hub.yamaha.com/drums/percussion/timpani-maintenance/'),
      resource('Evaluating and purchasing timpani', 'Buying New Timpani? Here’s What You Need to Know', 'Yamaha', 'Timpani selection', 'Discusses head selection and evaluating pedal operation when comparing instruments. Useful for planning an ensemble purchase and considering the conditions in which the timpani will be used.', 'https://hub.yamaha.com/music-educators/educator/buying-new-timpani-heres-what-you-need-to-know/'),
    ],
  },
  keyboard: {
    beginner: [
      resource('Everyday acoustic piano care', 'Five Simple Steps for Maintaining Your Piano', 'Yamaha', 'Acoustic piano', 'An introduction to the piano’s environment, regular care, and working with a qualified technician to maintain the instrument.', 'https://hub.yamaha.com/pianos/p-how-to/five-simple-steps-for-maintaining-your-piano/'),
      resource('Digital piano and keyboard care', 'Care and Maintenance of a Digital Piano and Keyboard', 'Yamaha', 'Digital piano and keyboard; includes acoustic-piano sections', 'Covers cleaning keys, protecting electronic instruments from dust, and choosing a suitable location. The article distinguishes acoustic-piano tuning and regulation from electronic keyboard care.', 'https://hub.europe.yamaha.com/articles/care-and-maintenance-of-a-digital-piano-and-keyboard'),
    ],
    advanced: [
      resource('Planning professional piano service', 'Caring for a Piano', 'Piano Technicians Guild', 'Acoustic piano', 'The professional guild’s guide explains ongoing care and choosing a technician. It places internal maintenance, regulation, and repairs with qualified piano technicians.', 'https://www.ptg.org/teacher-resources/caring-for-a-piano'),
      resource('Tuning, regulation, and voicing', 'How to Care for Your Piano: Tuning, Maintenance, and Finding the Right Technician', 'Yamaha', 'Acoustic piano', 'Distinguishes tuning, action regulation, and voicing, and explains how a technician evaluates changes in touch and tone. Includes questions to consider when arranging service.', 'https://hub.yamaha.com/pianos/how-to-care-for-your-piano-tuning-maintenance-and-finding-the-right-technician/'),
    ],
  },
  voice: {
    beginner: [
      resource('Understanding everyday voice care', 'Taking Care of Your Voice', 'NIDCD · National Institutes of Health', 'Singers and other voice users', 'A public-health introduction to how the voice works, healthy voice-use habits, and recognizing changes that warrant professional assessment.', 'https://www.nidcd.nih.gov/health/taking-care-your-voice'),
      resource('Healthy singing habits', 'Fit to Sing! BAPAM Vocal Health Factsheet Updated', 'British Association for Performing Arts Medicine', 'Singers across styles', 'Introduces BAPAM’s downloadable Fit to Sing factsheet, offering a holistic approach to healthy practice and performance and signposting specialist support.', 'https://www.bapam.org.uk/fit-to-sing-bapam-vocal-health-factsheet-updated/'),
    ],
    advanced: [
      resource('Managing professional vocal demands', 'Vocal Overload', 'British Association for Performing Arts Medicine', 'Performers and professional voice users', 'Introduces guidance on extended or loud voice use and vocal fatigue. Authored by a specialist voice speech-and-language therapist and reviewed by BAPAM’s Vocal Health Working Group.', 'https://www.bapam.org.uk/vocal-overload/'),
      resource('Understanding specialist voice support', 'Voice Therapy', 'Duke Health', 'Singers and other voice users · Clinical education', 'Explains clinician-led voice therapy, vocal pacing, and specialist support for singers. Describes professional care rather than a self-directed treatment or exercise plan.', 'https://www.dukehealth.org/treatments/voice-disorders/voice-therapy'),
    ],
  },
};

export function curatedResourceId(category: string, level: string, topic: string): string {
  return `curated-${category}-${level}-${topic.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`;
}

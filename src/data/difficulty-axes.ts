// Four-axis difficulty data for the 19 curated pieces.
// PRD Tier 1: every piece page carries a Technical / Stamina / Interpretive / Ensemble
// readout. Values here are first-draft editorial estimates for a cellist audience;
// when the contributor approval pipeline lands (P1 in TODOS.md), bylined contributors
// can override per piece.
//
// Level convention: 0 = n/a, 1 = Light, 2-3 = Moderate / Intermediate,
// 4 = Advanced / Demanding, 5 = Professional. Labels are editorial free-text,
// not mechanically derived from the level.

export interface DifficultyAxis {
  /** 0 to 5 — bars filled in the UI. 0 renders as empty bars. */
  level: number;
  /** Short editorial label shown below the bars (e.g., "Intermediate", "Advanced", "n/a"). */
  label: string;
  /** One-line practical note. What makes this axis score what it scores? */
  note: string;
}

export interface PieceDifficultyAxes {
  technical: DifficultyAxis;
  stamina: DifficultyAxis;
  interpretive: DifficultyAxis;
  ensemble: DifficultyAxis;
}

export const difficultyAxes: Record<string, PieceDifficultyAxes> = {
  'bach-cello-suite-1': {
    technical: { level: 3, label: 'Intermediate', note: 'String crossings, bariolage; no extended technique.' },
    stamina: { level: 2, label: 'Moderate', note: 'Eighteen minutes unaccompanied.' },
    interpretive: { level: 5, label: 'Advanced', note: 'Implied voices, unmarked phrasing.' },
    ensemble: { level: 0, label: 'n/a', note: 'Solo work.' },
  },
  'bach-cello-suite-2': {
    technical: { level: 3, label: 'Intermediate', note: 'D-minor range sits comfortably; Sarabande voicing demands attention.' },
    stamina: { level: 3, label: 'Moderate', note: 'Twenty-two minutes unaccompanied, weight on the bow arm.' },
    interpretive: { level: 5, label: 'Advanced', note: 'Minor-key shadow, Sarabande gravity, Gigue lift.' },
    ensemble: { level: 0, label: 'n/a', note: 'Solo work.' },
  },
  'bach-cello-suite-3': {
    technical: { level: 4, label: 'Advanced', note: 'Scalar Prélude passagework and Bourrée agility; C-major sings but exposes everything.' },
    stamina: { level: 3, label: 'Moderate', note: 'Twenty-three minutes at a more active tempo than the first two.' },
    interpretive: { level: 4, label: 'Advanced', note: 'Extroverted, harmonically rich, popular Bourrées invite cliché.' },
    ensemble: { level: 0, label: 'n/a', note: 'Solo work.' },
  },
  'bach-cello-suite-4': {
    technical: { level: 4, label: 'Advanced', note: 'E-flat sits less resonantly; intonation and string-crossing precision are load-bearing.' },
    stamina: { level: 3, label: 'Moderate', note: 'Twenty-five minutes, with the long French-overture Prélude up front.' },
    interpretive: { level: 4, label: 'Advanced', note: 'Sarabande harmonic richness; Prélude architecture.' },
    ensemble: { level: 0, label: 'n/a', note: 'Solo work.' },
  },
  'bach-cello-suite-5': {
    technical: { level: 5, label: 'Professional', note: 'Scordatura tuning (A string down to G), fugal Prélude, chordal writing.' },
    stamina: { level: 4, label: 'Demanding', note: 'Twenty-seven minutes; scordatura bow balance and concentration.' },
    interpretive: { level: 5, label: 'Advanced', note: 'Darkest of the six; single-line Sarabande that holds the audience by nothing.' },
    ensemble: { level: 0, label: 'n/a', note: 'Solo work.' },
  },
  'bach-cello-suite-6': {
    technical: { level: 5, label: 'Professional', note: 'Written for a five-string instrument; the high register on four strings is brutal.' },
    stamina: { level: 4, label: 'Demanding', note: 'Thirty minutes, the longest and most physically costly of the set.' },
    interpretive: { level: 5, label: 'Advanced', note: 'Virtuosic Prélude; Gavottes joyful without becoming glib.' },
    ensemble: { level: 0, label: 'n/a', note: 'Solo work.' },
  },
  'bach-viola-da-gamba-sonata-1': {
    technical: { level: 3, label: 'Intermediate', note: 'Conservative range, fugal writing; the keyboardist has most of the acrobatics.' },
    stamina: { level: 2, label: 'Moderate', note: 'About fourteen minutes, four compact movements.' },
    interpretive: { level: 4, label: 'Advanced', note: 'Reads as chamber between equals, not soloist-with-continuo.' },
    ensemble: { level: 4, label: 'Demanding', note: 'Keyboard is fully written-out; the trio-sonata texture has to breathe together.' },
  },
  'bach-viola-da-gamba-sonata-2': {
    technical: { level: 3, label: 'Intermediate', note: 'Outgoing and song-like; dance rhythms rather than athletic demands.' },
    stamina: { level: 2, label: 'Moderate', note: 'Sixteen minutes, four movements.' },
    interpretive: { level: 4, label: 'Advanced', note: 'Lyrical B-minor Andante; outer movements dance without slackening.' },
    ensemble: { level: 4, label: 'Demanding', note: 'Walking-bass keyboard under a singing cello line; tempo alignment is everything.' },
  },
  'bach-viola-da-gamba-sonata-3': {
    technical: { level: 4, label: 'Advanced', note: 'Concerto-like driving figure; double fugue in the finale.' },
    stamina: { level: 3, label: 'Moderate', note: 'Fifteen minutes at higher density than BWV 1027/1028.' },
    interpretive: { level: 5, label: 'Advanced', note: 'Darkest of the three; siciliana Adagio; architectural finale.' },
    ensemble: { level: 5, label: 'Professional', note: 'Concerto-scale, the keyboardist and cellist are genuinely co-soloists.' },
  },
  'bach-chaconne-cello-arr': {
    technical: { level: 5, label: 'Professional', note: 'Double stops and chordal writing adapted into the cello\'s lower register.' },
    stamina: { level: 4, label: 'Demanding', note: 'Fifteen unbroken minutes; no breath.' },
    interpretive: { level: 5, label: 'Advanced', note: 'Sixty-four variations arguing with themselves across a single bass pattern.' },
    ensemble: { level: 0, label: 'n/a', note: 'Solo work.' },
  },
  'haydn-cello-concerto-1': {
    technical: { level: 5, label: 'Professional', note: 'First-movement bariolage, high-register writing, cadenza athletics.' },
    stamina: { level: 3, label: 'Moderate', note: 'Twenty-five minutes, with tutti rests that let the bow arm recover.' },
    interpretive: { level: 4, label: 'Advanced', note: 'Classical finesse demands light articulation; the piece unmasks poor phrasing.' },
    ensemble: { level: 3, label: 'Moderate', note: 'Standard concerto coordination with a classical-sized orchestra.' },
  },
  'vivaldi-rv-544': {
    technical: { level: 4, label: 'Advanced', note: 'Baroque idiom; the clef-swap notation ("Il Proteo") demands fluent reading.' },
    stamina: { level: 2, label: 'Moderate', note: 'Twelve minutes, three short movements.' },
    interpretive: { level: 4, label: 'Advanced', note: 'Baroque articulation and ornamentation; the joke on the page has to still land musically.' },
    ensemble: { level: 5, label: 'Professional', note: 'Tight duo concerto; violin and cello trade material constantly over string continuo.' },
  },
  'saint-saens-cello-concerto-1': {
    technical: { level: 5, label: 'Professional', note: 'Rapid-fire opening, ricochet bowing, sustained fingerboard work.' },
    stamina: { level: 3, label: 'Moderate', note: 'Twenty minutes continuous, no breaks between sections.' },
    interpretive: { level: 4, label: 'Advanced', note: 'French Romantic lyricism inside a compact single-movement arc.' },
    ensemble: { level: 3, label: 'Moderate', note: 'Concerto coordination; orchestra mostly accompanies rather than dialogues.' },
  },
  'elgar-cello-concerto': {
    technical: { level: 5, label: 'Professional', note: 'Broad lines, register leaps, cadenza demands. Technically taxing across all four movements.' },
    stamina: { level: 4, label: 'Demanding', note: 'Thirty minutes of emotional weight as much as physical — the cello carries most of it.' },
    interpretive: { level: 5, label: 'Advanced', note: 'Autumnal color, rubato choices, and the famous cadenza that defines careers.' },
    ensemble: { level: 4, label: 'Demanding', note: 'Elaborate orchestral dialogue; the Adagio rests on conductor and cellist agreeing on stillness.' },
  },
  'strauss-cello-sonata': {
    technical: { level: 5, label: 'Professional', note: 'Late-Romantic demands; wide-interval writing, sustained lyric lines, brisk finale.' },
    stamina: { level: 4, label: 'Demanding', note: 'Twenty-eight minutes with both players fully engaged throughout.' },
    interpretive: { level: 4, label: 'Advanced', note: 'Brahmsian vein rather than post-Romantic tone poem; demands restraint, not flash.' },
    ensemble: { level: 4, label: 'Demanding', note: 'True chamber duo; piano is an equal voice, not accompaniment.' },
  },
  'mendelssohn-song-without-words-cello': {
    technical: { level: 2, label: 'Intermediate', note: 'Technical demands are modest; it is the simplicity that exposes the player.' },
    stamina: { level: 1, label: 'Light', note: 'Five minutes, single arc.' },
    interpretive: { level: 4, label: 'Advanced', note: 'Sustained singing line; the whole piece is one expressive breath.' },
    ensemble: { level: 2, label: 'Intermediate', note: 'Piano accompaniment with a clear supporting role.' },
  },
  'faure-papillon': {
    technical: { level: 5, label: 'Professional', note: 'Rapid figuration at controlled speed; the Andantino demands to land cleanly.' },
    stamina: { level: 1, label: 'Light', note: 'Three minutes of dazzle.' },
    interpretive: { level: 3, label: 'Moderate', note: 'Short character piece; the interpretive frame is "butterfly" rather than essay.' },
    ensemble: { level: 2, label: 'Intermediate', note: 'Piano provides simple accompaniment; ensemble asks are minimal.' },
  },
  'crumb-sonata-solo-cello': {
    technical: { level: 4, label: 'Advanced', note: 'Post-Bartók idiom; rhythmic drive, folk-inflected intervallic writing.' },
    stamina: { level: 3, label: 'Moderate', note: 'Fifteen minutes across three contrasting movements.' },
    interpretive: { level: 4, label: 'Advanced', note: 'Formal architecture clear; expressive demands are idiomatic 20th-century.' },
    ensemble: { level: 0, label: 'n/a', note: 'Solo work.' },
  },
};

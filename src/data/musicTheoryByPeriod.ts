export interface TheoryConcept {
  name: string;
  description: string;
}

export const musicTheoryByPeriod: Record<string, TheoryConcept[]> = {
  antiquity: [
    { name: 'Tetrachords', description: 'Four-note spans forming the fundamental units of Greek pitch organization.' },
    { name: 'Genera', description: 'Diatonic, chromatic, and enharmonic ways of dividing a tetrachord.' },
    { name: 'Harmoniai and ethos', description: 'Pitch organizations understood as carrying distinct ethical and emotional qualities.' },
    { name: 'Consonance by ratio', description: 'Octaves, fifths, and fourths explained through simple numerical proportions.' },
  ],
  '6th-9th-century': [
    { name: 'Church modes', description: 'Modal classification by final, range, and characteristic melodic behavior.' },
    { name: 'Reciting tones', description: 'Stable pitches around which psalm formulas and liturgical melodies unfold.' },
    { name: 'Melodic centonization', description: 'The formation of chant through established melodic formulas and gestures.' },
    { name: 'Neumatic contour', description: 'Early notation indicating the direction and grouping of melodic motion.' },
  ],
  '10th-12th-century': [
    { name: 'Parallel and free organum', description: 'Early approaches to combining a chant with one or more additional voices.' },
    { name: 'Hexachord and solmization', description: 'Guido’s overlapping six-note collections and ut–re–mi syllables for sight-singing.' },
    { name: 'Mutation', description: 'Moving between overlapping hexachords to sing beyond a single six-note range.' },
    { name: 'Consonance and contrary motion', description: 'Increasing control of perfect intervals and independent voice movement.' },
  ],
  '13th-century': [
    { name: 'Rhythmic modes', description: 'Recurring long–short patterns used to coordinate polyphonic voices.' },
    { name: 'Modal counterpoint', description: 'Voice-leading governed by perfect consonances, controlled dissonance, and modal finals.' },
    { name: 'Franconian notation', description: 'A system in which individual note shapes communicate relative duration.' },
    { name: 'Clausula structure', description: 'Measured polyphonic sections organized above portions of a sustained chant tenor.' },
  ],
  '14th-century': [
    { name: 'Mensuration', description: 'Signs and note relationships governing duple and triple divisions of musical time.' },
    { name: 'Isorhythm', description: 'Independent repeating patterns of duration and pitch used to organize large spans.' },
    { name: 'Coloration and proportion', description: 'Notational changes that alter rhythmic values or create proportional relationships.' },
    { name: 'Landini cadence', description: 'A characteristic upper-voice descent before the final arrival, especially in Italian music.' },
  ],
  '15th-century': [
    { name: 'Contrapuntal cadence', description: 'Stepwise two-voice motion into an octave or unison, often embellished by a leading tone.' },
    { name: 'Cantus-firmus technique', description: 'A pre-existing melody placed in long values as the structural basis of polyphony.' },
    { name: 'Fauxbourdon', description: 'Parallel first-inversion sonorities generated around notated outer voices.' },
    { name: 'Imitation', description: 'Successive entrances of related melodic material in different voices.' },
  ],
  '16th-century': [
    { name: 'Species counterpoint', description: 'A pedagogical framework separating note-against-note, florid, and syncopated contrapuntal textures.' },
    { name: 'Modal polyphony', description: 'Counterpoint shaped by modal finals, ranges, cadences, and characteristic interval patterns.' },
    { name: 'Suspension formulas', description: 'Prepared dissonances resolving downward by step within controlled voice-leading.' },
    { name: 'Musica ficta', description: 'Unwritten chromatic alterations applied to clarify cadences or avoid difficult intervals.' },
    { name: 'Common cadences', description: 'Clausula vera and Phrygian patterns coordinating contrary stepwise motion at closure.' },
  ],
  '17th-century': [
    { name: 'Figured bass', description: 'Intervals written above a bass line to guide improvised harmonic realization.' },
    { name: 'Emerging functional tonality', description: 'Increasing organization around major and minor keys, bass motion, and directed cadences.' },
    { name: 'Cadential 6/4', description: 'A dominant embellishment that intensifies arrival at a perfect cadence.' },
    { name: 'Sequences', description: 'Short harmonic and melodic patterns repeated at successive pitch levels.' },
    { name: 'Rule of the octave', description: 'Conventional harmonizations for ascending and descending scale degrees.' },
  ],
  'late-baroque': [
    { name: 'Functional harmony', description: 'Tonic, predominant, and dominant functions directing phrases toward cadential goals.' },
    { name: 'Circle-of-fifths sequences', description: 'Root motion by descending fifths supporting extended harmonic progression.' },
    { name: 'Fugal counterpoint', description: 'Subjects, answers, countersubjects, episodes, stretto, and tonal planning in imitative form.' },
    { name: 'Augmented-sixth chords', description: 'Chromatic predominant sonorities whose outer voices expand toward the dominant octave.' },
    { name: 'Diminished-seventh chords', description: 'Symmetrical leading-tone sonorities used for dominant intensification and modulation.' },
  ],
  '18th-century': [
    { name: 'Sonata principle', description: 'Large-scale tonal drama created through exposition, contrasting keys, development, and return.' },
    { name: 'Periodic phrase structure', description: 'Balanced antecedent and consequent phrases articulated by weaker and stronger cadences.' },
    { name: 'Common cadences', description: 'Perfect authentic, imperfect authentic, half, deceptive, and plagal cadential types.' },
    { name: 'Alberti bass', description: 'A broken-chord accompaniment pattern clarifying harmony while maintaining light texture.' },
    { name: 'Secondary dominants', description: 'Temporary dominant-function chords that tonicize scale degrees within a key.' },
  ],
  '19th-century': [
    { name: 'Chromatic mediants', description: 'Major or minor chords related by a third while sharing one or more common tones.' },
    { name: 'Expanded augmented-sixth harmony', description: 'Italian, French, and German forms used for intensification, modulation, and enharmonic reinterpretation.' },
    { name: 'Common-tone diminished sevenths', description: 'Chromatic embellishing chords that prolong or transform a shared pitch.' },
    { name: 'Enharmonic modulation', description: 'Reinterpreting a chord’s spelling and function to reach distant tonal regions.' },
    { name: 'Thematic transformation', description: 'Changing a recurring theme’s rhythm, harmony, mode, or character across a large form.' },
  ],
  'late-romanticism': [
    { name: 'Chromatic mediants', description: 'Major or minor chords related by a third while sharing one or more common tones.' },
    { name: 'Expanded augmented-sixth harmony', description: 'Italian, French, and German forms used for intensification, modulation, and enharmonic reinterpretation.' },
    { name: 'Common-tone diminished sevenths', description: 'Chromatic embellishing chords that prolong or transform a shared pitch.' },
    { name: 'Enharmonic modulation', description: 'Reinterpreting a chord’s spelling and function to reach distant tonal regions.' },
    { name: 'Thematic transformation', description: 'Changing a recurring theme’s rhythm, harmony, mode, or character across a large form.' },
  ],
  '20th-century': [
    { name: 'Pitch-class set theory', description: 'Analyzing unordered pitch collections through interval content, normal order, and set class.' },
    { name: 'Twelve-tone technique', description: 'Ordering all twelve pitch classes into a row and transforming it through serial operations.' },
    { name: 'Modes and synthetic scales', description: 'Whole-tone, octatonic, pentatonic, and constructed collections used beyond functional tonality.' },
    { name: 'Quartal and quintal harmony', description: 'Chords built primarily from stacked fourths or fifths rather than thirds.' },
    { name: 'Polyrhythm and metric modulation', description: 'Layered pulses and proportional tempo relationships that reorganize musical time.' },
  ],
  '21st-century': [
    { name: 'Spectral harmony', description: 'Pitch and orchestration derived from overtone spectra and the internal behavior of sound.' },
    { name: 'Post-tonal voice-leading', description: 'Smooth connections among chords or collections without requiring functional harmony.' },
    { name: 'Process and modular form', description: 'Forms generated through audible procedures, loops, cells, or rearrangeable sections.' },
    { name: 'Microtonality', description: 'Pitch systems using intervals smaller than the conventional equal-tempered semitone.' },
    { name: 'Algorithmic and electronic structures', description: 'Musical relationships generated or transformed through software, data, and interactive systems.' },
  ],
};

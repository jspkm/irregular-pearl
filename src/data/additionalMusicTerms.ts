import type { MusicTerm, MusicTermCategory } from './musicTerms';
import { musicPeriodProfilesById } from './musicPeriodProfiles';
import { musicPeriods } from './musicPeriods';

type Seed = [id: string, term: string, category: MusicTermCategory, periodId: string, definition: string];

const seeds: Seed[] = [
  ['ethos', 'Ethos', 'Theory', 'antiquity', 'The ancient idea that musical modes, rhythms, and styles could shape character, emotion, and moral behavior.'],
  ['tetrachord', 'Tetrachord', 'Theory', 'antiquity', 'A span of a perfect fourth divided into three smaller intervals and used as a basic unit of ancient Greek pitch theory.'],
  ['aulos', 'Aulos', 'Performance practice', 'antiquity', 'An ancient Greek double-reed wind instrument, often played in pairs and associated with theater, ritual, dance, and public ceremony.'],
  ['kithara', 'Kithara', 'Performance practice', 'antiquity', 'A large professional lyre of ancient Greece whose strings were plucked to accompany song, recitation, and public musical contests.'],
  ['ancient-greek-modes', 'Ancient Greek modes', 'Theory', 'antiquity', 'Systems for organizing pitch in ancient Greek theory, defined differently from the later medieval church modes that borrowed their names.'],
  ['plainchant', 'Plainchant', 'Historical style', '6th-9th-century', 'Unaccompanied monophonic liturgical song whose flexible melodic rhythm follows the shape and accent of sacred text.'],
  ['neume', 'Neume', 'Theory', '6th-9th-century', 'An early notational sign representing one or more sung pitches, first indicating melodic contour and later increasingly precise pitch.'],
  ['psalmody', 'Psalmody', 'Performance practice', '6th-9th-century', 'The singing or chanting of psalms, commonly using reciting tones, formulas, and antiphonal or responsorial alternation.'],
  ['liturgical-mode', 'Liturgical mode', 'Theory', '6th-9th-century', 'One of the modal frameworks used to classify and shape Western Christian chant according to final, range, and characteristic melodic behavior.'],
  ['antiphon', 'Antiphon', 'Form', '6th-9th-century', 'A short liturgical chant sung in connection with a psalm or canticle, often framing it before and after its verses.'],
  ['organum', 'Organum', 'Technique', '10th-12th-century', 'Medieval polyphony in which one or more newly composed voices sound with a pre-existing chant melody.'],
  ['trope', 'Trope', 'Technique', '10th-12th-century', 'New text, music, or both added to an existing liturgical chant in order to elaborate or interpret it.'],
  ['sequence', 'Sequence', 'Form', '10th-12th-century', 'A medieval Latin chant sung after the Alleluia, often organized as paired melodic phrases carrying successive text lines.'],
  ['troubadour', 'Troubadour', 'Historical style', '10th-12th-century', 'A poet-composer of medieval Occitania associated with courtly song, especially repertories concerning love, politics, and social life.'],
  ['guidonian-hand', 'Guidonian hand', 'Theory', '10th-12th-century', 'A medieval teaching device that mapped pitches and solmization syllables onto points of the hand to aid sight-singing and memorization.'],
  ['ars-antiqua', 'Ars Antiqua', 'Historical style', '13th-century', 'The style of 12th- and 13th-century measured polyphony associated especially with Notre Dame organum, rhythmic modes, and early motets.'],
  ['rhythmic-mode', 'Rhythmic mode', 'Theory', '13th-century', 'One of a small set of recurring long-and-short rhythmic patterns used to coordinate voices in medieval polyphony.'],
  ['motet', 'Motet', 'Form', '13th-century', 'A polyphonic vocal genre that began with texted upper voices above a chant-derived tenor and changed substantially across later eras.'],
  ['clausula', 'Clausula', 'Form', '13th-century', 'A self-contained polyphonic section of organum in which a portion of chant is treated in measured, coordinated voices.'],
  ['conductus', 'Conductus', 'Form', '13th-century', 'A medieval Latin sacred or ceremonial song, often newly composed in all voices rather than built above pre-existing chant.'],
  ['ars-nova', 'Ars Nova', 'Historical style', '14th-century', 'A 14th-century musical style and notational practice that enabled greater rhythmic flexibility, mensuration, and polyphonic complexity.'],
  ['isorhythm', 'Isorhythm', 'Technique', '14th-century', 'A structural technique that combines a repeating rhythmic pattern with a repeating pitch sequence, often of different lengths.'],
  ['hocket', 'Hocket', 'Technique', '14th-century', 'A rapid alternation in which a melody is split between voices so that one sounds while another rests.'],
  ['formes-fixes', 'Formes fixes', 'Form', '14th-century', 'The principal fixed poetic-musical forms of late medieval French song: ballade, rondeau, and virelai.'],
  ['mensuration', 'Mensuration', 'Theory', '14th-century', 'The system of proportional relationships among note values in medieval and Renaissance notation, analogous in part to later meter.'],
  ['cantus-firmus', 'Cantus firmus', 'Technique', '15th-century', 'A pre-existing melody used as the structural foundation for a polyphonic composition, frequently placed in long notes.'],
  ['fauxbourdon', 'Fauxbourdon', 'Technique', '15th-century', 'A 15th-century practice producing mostly parallel first-inversion sonorities around a notated upper voice and tenor.'],
  ['burgundian-chanson', 'Burgundian chanson', 'Historical style', '15th-century', 'A courtly French polyphonic song cultivated by composers connected with the Burgundian court, often in a formes-fixes design.'],
  ['cyclic-mass', 'Cyclic mass', 'Form', '15th-century', 'A polyphonic setting whose movements are unified by shared musical material such as a cantus firmus, motto, or parody source.'],
  ['imitation', 'Imitation', 'Technique', '15th-century', 'The restatement of a melodic idea in another voice, often at a different pitch level and after a short delay.'],
  ['madrigal', 'Madrigal', 'Form', '16th-century', 'A secular vocal composition, especially the Italian Renaissance genre that closely responds to the imagery and rhetoric of its poetry.'],
  ['imitative-counterpoint', 'Imitative counterpoint', 'Technique', '16th-century', 'Polyphonic writing in which related melodic ideas enter successively in independent voices and combine contrapuntally.'],
  ['musica-reservata', 'Musica reservata', 'Historical style', '16th-century', 'A debated Renaissance term associated with learned, text-sensitive, chromatic, or otherwise exclusive expressive musical practice.'],
  ['word-painting', 'Word painting', 'Technique', '16th-century', 'The musical illustration of a word or image through contour, register, rhythm, harmony, texture, or another audible gesture.'],
  ['doctrine-of-affections', 'Doctrine of affections', 'Theory', '17th-century', 'The Baroque-era concept that music organizes and communicates distinct emotional states through recognizable musical means.'],
  ['concertato-style', 'Concertato style', 'Historical style', '17th-century', 'A style built on coordinated contrast among voices, instruments, choirs, or groups while preserving a unified musical design.'],
  ['alberti-bass', 'Alberti bass', 'Technique', '18th-century', 'An accompaniment pattern that repeatedly arpeggiates a chord in the order low–high–middle–high or a close variant.'],
  ['periodic-phrase', 'Periodic phrase', 'Form', '18th-century', 'A balanced phrase structure in which an antecedent gesture is answered by a consequent, usually with stronger closure.'],
  ['rubato', 'Rubato', 'Performance practice', '19th-century', 'Expressive flexibility of tempo in which musical time is stretched, compressed, or redistributed without losing larger continuity.'],
  ['lied', 'Lied', 'Form', '19th-century', 'A German-language art song, especially the 19th-century repertory joining poetry with an independent and expressive piano part.'],
  ['impressionism', 'Impressionism', 'Historical style', '20th-century', 'A label applied especially to coloristic music using fluid harmony, distinctive scales, timbral nuance, and suggestive rather than goal-directed forms.'],
  ['expressionism', 'Expressionism', 'Historical style', '20th-century', 'An early modernist aesthetic of intensified inner expression, often using extreme contrast, dissonance, fragmentation, and psychological subject matter.'],
  ['atonality', 'Atonality', 'Theory', '20th-century', 'Music that avoids establishing a single pitch as a governing tonal center through traditional functional harmony.'],
  ['serialism', 'Serialism', 'Technique', '20th-century', 'A compositional method that orders musical elements into recurring series, originating with twelve-tone pitch organization.'],
  ['neoclassicism', 'Neoclassicism', 'Historical style', '20th-century', 'A modernist return to earlier forms, genres, textures, or ideals, recast through contemporary harmony, rhythm, and instrumentation.'],
  ['spectralism', 'Spectralism', 'Historical style', '21st-century', 'An approach to composition that draws harmony, timbre, and form from the acoustic spectrum and the internal behavior of sound.'],
  ['postminimalism', 'Postminimalism', 'Historical style', '21st-century', 'Music extending minimalist repetition and pulse through broader harmony, narrative shape, stylistic mixture, and expressive contrast.'],
  ['electroacoustic-music', 'Electroacoustic music', 'Historical style', '21st-century', 'Music created, transformed, or presented through electronic technology, often combining recorded or synthesized sound with live performance.'],
  ['new-complexity', 'New complexity', 'Historical style', '21st-century', 'A late-20th- and 21st-century tendency toward dense notation, layered rhythm, intricate gesture, and demanding performer-composer collaboration.'],
  ['multimedia-performance', 'Multimedia performance', 'Performance practice', '21st-century', 'A performance practice integrating music with video, projection, movement, theater, interactive systems, or other media.'],
];

export const additionalMusicTerms: MusicTerm[] = seeds.map(([id, term, category, historicalPeriodId, definition]) => {
  const period = musicPeriods.find((entry) => entry.id === historicalPeriodId)!;
  const profile = musicPeriodProfilesById.get(historicalPeriodId)!;
  return {
    id,
    term,
    category,
    period: period.span,
    historicalPeriodId,
    definition,
    context: [
      `${term} belongs to the musical vocabulary of ${period.title}. ${period.description}`,
      `The term is most useful when connected to the notation, repertory, and performance conventions of its own historical setting.`,
    ],
    listeningCues: [
      `Listen for the sound or structural behavior described by the term rather than treating it only as a label.`,
      `Compare several works from ${period.title} to hear how the practice varies by composer and genre.`,
      `Notice how performers clarify the term through articulation, timing, balance, timbre, or phrasing.`,
    ],
    examples: profile.composers.slice(0, 3).map((composer) => ({ composer, work: `Representative repertory associated with ${term}` })),
    relatedTerms: [],
  };
});

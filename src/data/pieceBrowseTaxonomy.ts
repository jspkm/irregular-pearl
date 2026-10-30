export const instrumentFamilies = [
  { id: 'strings', label: 'Strings', instruments: ['Violin', 'Viola', 'Cello', 'Double Bass', 'Harp', 'Guitar'] },
  { id: 'woodwinds', label: 'Woodwinds', instruments: ['Flute', 'Oboe', 'English Horn', 'Clarinet', 'Bassoon', 'Saxophone', 'Recorder'] },
  { id: 'brass', label: 'Brass', instruments: ['Horn', 'French Horn', 'Trumpet', 'Trombone', 'Euphonium', 'Tuba'] },
  { id: 'percussion', label: 'Percussion', instruments: ['Percussion', 'Timpani', 'Marimba', 'Vibraphone', 'Xylophone'] },
  { id: 'keyboard', label: 'Keyboard', instruments: ['Piano', 'Harpsichord', 'Organ'] },
  { id: 'voice', label: 'Voice', instruments: ['Voice', 'Soprano', 'Mezzo-Soprano', 'Alto', 'Tenor', 'Baritone', 'Bass', 'Choir'] },
] as const;

export const pieceEraPeriods = [
  { id: 'antiquities', label: 'Antiquities', eras: ['Antiquity', 'Ancient'] },
  { id: 'baroque', label: 'Baroque', eras: ['Baroque'] },
  { id: 'classical', label: 'Classical', eras: ['Classical'] },
  { id: 'romantic', label: 'Romantic', eras: ['Romantic', 'Late Romantic', 'Post-Romantic'] },
  { id: '20th-century', label: '20th Century', eras: ['20th Century', 'Modern', 'Post-Romantic', 'Contemporary'] },
] as const;

// Dates shown beside titles on individual piece pages. Approximate dates and
// ranges are retained where a single completion year is not securely known.
export const pieceCompletionYears: Record<string, string> = {
  'bach-chaconne-cello-arr':'c. 1720', 'bach-cello-suite-1':'c. 1720', 'bach-cello-suite-2':'c. 1720',
  'bach-cello-suite-3':'c. 1720', 'bach-cello-suite-4':'c. 1720', 'bach-cello-suite-5':'c. 1720',
  'bach-cello-suite-6':'c. 1720', 'bach-viola-da-gamba-sonata-1':'c. 1736–1741',
  'bach-viola-da-gamba-sonata-2':'c. 1736–1741', 'bach-viola-da-gamba-sonata-3':'c. 1736–1741',
  'haydn-cello-concerto-1':'c. 1761–1765', 'vivaldi-rv-544':'c. 1716',
  'saint-saens-cello-concerto-1':'1872', 'elgar-cello-concerto':'1919', 'strauss-cello-sonata':'1883',
  'mendelssohn-song-without-words-cello':'1845', 'faure-papillon':'1884', 'crumb-sonata-solo-cello':'1955',
  'mozart-dissonance-quartet':'1785', 'bottesini-elegy-double-bass':'c. 1870', 'debussy-danses-harp':'1904',
  'mozart-flute-concerto-1':'1778', 'strauss-oboe-concerto':'1945', 'weber-clarinet-concerto-1':'1811',
  'mozart-horn-concerto-4':'1786', 'haydn-trumpet-concerto':'1796', 'david-trombone-concertino':'1837',
  'milhaud-percussion-concerto':'1930', 'sejourne-marimba-concerto':'2005',
  'bartok-sonata-two-pianos-percussion':'1937', 'beethoven-waldstein-sonata':'1804',
  'bach-goldberg-variations':'1741', 'franck-chorale-3':'1890', 'schubert-winterreise':'1827',
  'mozart-exsultate-jubilate':'1773', 'brahms-german-requiem':'1868', 'tchaikovsky-swan-lake':'1876',
  'stravinsky-firebird':'1910', 'bach-wachet-auf':'1731', 'bach-ich-habe-genug':'1727',
  'bach-violin-chaconne':'c. 1720', 'vitali-chaconne':'c. 1700', 'schumann-traumerei':'1838',
  'grieg-wedding-day':'1896', 'mendelssohn-violin-concerto':'1844', 'rachmaninoff-piano-concerto-2':'1901',
  'chopin-etude-op10-3':'1832', 'liszt-la-campanella':'1851', 'bach-art-of-fugue':'c. 1742–1750',
  'shostakovich-fugue-d-minor':'1951', 'palestrina-missa-papae-marcelli':'c. 1562',
  'bach-mass-b-minor':'1749', 'mozart-don-giovanni':'1787', 'puccini-la-boheme':'1895',
  'handel-messiah':'1741', 'mendelssohn-elijah':'1846', 'beethoven-egmont-overture':'1810',
  'rossini-william-tell-overture':'1829', 'mozart-piano-quartet-1':'1785', 'brahms-piano-quartet-1':'1861',
  'schumann-piano-quintet':'1842', 'dvorak-piano-quintet-2':'1887', 'beethoven-archduke-trio':'1811',
  'mendelssohn-piano-trio-1':'1839', 'debussy-prelude-afternoon-faun':'1894',
  'rachmaninoff-prelude-c-sharp-minor':'1892', 'mozart-requiem':'1791', 'faure-requiem':'1890',
  'franck-violin-sonata':'1886', 'brahms-clarinet-sonata-1':'1894', 'mozart-duo-violin-viola-1':'1783',
  'ravel-sonata-violin-cello':'1922', 'haydn-emperor-quartet':'1797', 'beethoven-string-quartet-14':'1826',
  'mozart-string-quintet-g-minor':'1787', 'schubert-c-major-quintet':'1828',
  'beethoven-string-trio-op9-1':'1798', 'schubert-string-trio-b-flat':'1817', 'holst-planets':'1916',
  'ravel-mother-goose-suite':'1911', 'smetana-moldau':'1874', 'sibelius-finlandia':'1899',
  'beethoven-symphony-5':'1808', 'dvorak-new-world-symphony':'1893', 'brahms-haydn-variations':'1873',
  'elgar-enigma-variations':'1899', 'strauss-don-juan':'1888', 'strauss-till-eulenspiegel':'1895',
};

export function getPieceCompletionYear(pieceId: string): string | null {
  return pieceCompletionYears[pieceId] ?? null;
}

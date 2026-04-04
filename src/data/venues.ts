/**
 * Known classical music venues worldwide.
 * Used for autocomplete on the event submission form.
 * Merged with live data from the events table.
 */

export interface VenueEntry {
  venue: string;
  city: string;
}

export const VENUES: VenueEntry[] = [
  // --- United States ---
  { venue: 'Carnegie Hall', city: 'New York' },
  { venue: 'David Geffen Hall', city: 'New York' },
  { venue: 'Alice Tully Hall', city: 'New York' },
  { venue: 'Metropolitan Opera House', city: 'New York' },
  { venue: 'Zankel Hall', city: 'New York' },
  { venue: 'Merkin Concert Hall', city: 'New York' },
  { venue: 'Bargemusic', city: 'New York' },
  { venue: 'The Juilliard School', city: 'New York' },
  { venue: 'Symphony Hall', city: 'Boston' },
  { venue: 'Jordan Hall', city: 'Boston' },
  { venue: 'Isabella Stewart Gardner Museum', city: 'Boston' },
  { venue: 'New England Conservatory', city: 'Boston' },
  { venue: 'Davies Symphony Hall', city: 'San Francisco' },
  { venue: 'Herbst Theatre', city: 'San Francisco' },
  { venue: 'War Memorial Opera House', city: 'San Francisco' },
  { venue: 'Walt Disney Concert Hall', city: 'Los Angeles' },
  { venue: 'Hollywood Bowl', city: 'Los Angeles' },
  { venue: 'The Soraya', city: 'Los Angeles' },
  { venue: 'Colburn School', city: 'Los Angeles' },
  { venue: 'Orchestra Hall', city: 'Chicago' },
  { venue: 'Harris Theater', city: 'Chicago' },
  { venue: 'Ravinia Festival', city: 'Highland Park' },
  { venue: 'Kimmel Center', city: 'Philadelphia' },
  { venue: 'Curtis Institute of Music', city: 'Philadelphia' },
  { venue: 'Kennedy Center', city: 'Washington DC' },
  { venue: 'Strathmore', city: 'North Bethesda' },
  { venue: 'Severance Hall', city: 'Cleveland' },
  { venue: 'Meyerson Symphony Center', city: 'Dallas' },
  { venue: 'Bass Performance Hall', city: 'Fort Worth' },
  { venue: 'Jones Hall', city: 'Houston' },
  { venue: 'Benaroya Hall', city: 'Seattle' },
  { venue: 'Orchestra Hall', city: 'Minneapolis' },
  { venue: 'Schermerhorn Symphony Center', city: 'Nashville' },
  { venue: 'Powell Hall', city: 'St. Louis' },
  { venue: 'Music Hall', city: 'Cincinnati' },
  { venue: 'Hill Auditorium', city: 'Ann Arbor' },
  { venue: 'Woolsey Hall', city: 'New Haven' },
  { venue: 'Adrienne Arsht Center', city: 'Miami' },
  { venue: 'Kravis Center', city: 'West Palm Beach' },
  { venue: 'Kauffman Center', city: 'Kansas City' },
  // --- Canada ---
  { venue: 'Koerner Hall', city: 'Toronto' },
  { venue: 'Roy Thomson Hall', city: 'Toronto' },
  { venue: 'Maison symphonique', city: 'Montreal' },
  { venue: 'Chan Centre', city: 'Vancouver' },
  { venue: 'National Arts Centre', city: 'Ottawa' },
  // --- United Kingdom ---
  { venue: 'Royal Albert Hall', city: 'London' },
  { venue: 'Wigmore Hall', city: 'London' },
  { venue: 'Barbican Centre', city: 'London' },
  { venue: 'Royal Festival Hall', city: 'London' },
  { venue: 'Queen Elizabeth Hall', city: 'London' },
  { venue: 'Cadogan Hall', city: 'London' },
  { venue: 'Kings Place', city: 'London' },
  { venue: 'Royal Opera House', city: 'London' },
  { venue: 'Bridgewater Hall', city: 'Manchester' },
  { venue: 'Stoller Hall', city: 'Manchester' },
  { venue: 'Symphony Hall', city: 'Birmingham' },
  { venue: 'Usher Hall', city: 'Edinburgh' },
  { venue: 'City Halls', city: 'Glasgow' },
  { venue: 'Sage Gateshead', city: 'Gateshead' },
  { venue: 'Sheldonian Theatre', city: 'Oxford' },
  // --- Germany ---
  { venue: 'Berliner Philharmonie', city: 'Berlin' },
  { venue: 'Konzerthaus Berlin', city: 'Berlin' },
  { venue: 'Pierre Boulez Saal', city: 'Berlin' },
  { venue: 'Elbphilharmonie', city: 'Hamburg' },
  { venue: 'Laeiszhalle', city: 'Hamburg' },
  { venue: 'Gasteig', city: 'Munich' },
  { venue: 'Herkulessaal', city: 'Munich' },
  { venue: 'Gewandhaus', city: 'Leipzig' },
  { venue: 'Semperoper', city: 'Dresden' },
  { venue: 'Kolner Philharmonie', city: 'Cologne' },
  { venue: 'Alte Oper', city: 'Frankfurt' },
  { venue: 'Liederhalle', city: 'Stuttgart' },
  { venue: 'Tonhalle Dusseldorf', city: 'Dusseldorf' },
  // --- Austria ---
  { venue: 'Musikverein', city: 'Vienna' },
  { venue: 'Wiener Konzerthaus', city: 'Vienna' },
  { venue: 'Vienna State Opera', city: 'Vienna' },
  { venue: 'Grosses Festspielhaus', city: 'Salzburg' },
  { venue: 'Mozarteum', city: 'Salzburg' },
  { venue: 'Brucknerhaus', city: 'Linz' },
  // --- France ---
  { venue: 'Philharmonie de Paris', city: 'Paris' },
  { venue: 'Salle Pleyel', city: 'Paris' },
  { venue: 'Theatre des Champs-Elysees', city: 'Paris' },
  { venue: 'Opera Garnier', city: 'Paris' },
  { venue: 'Opera Bastille', city: 'Paris' },
  { venue: 'Auditorium de Lyon', city: 'Lyon' },
  { venue: 'Opera de Marseille', city: 'Marseille' },
  // --- Netherlands & Belgium ---
  { venue: 'Concertgebouw', city: 'Amsterdam' },
  { venue: 'Muziekgebouw aan t IJ', city: 'Amsterdam' },
  { venue: 'De Doelen', city: 'Rotterdam' },
  { venue: 'BOZAR', city: 'Brussels' },
  // --- Switzerland ---
  { venue: 'Tonhalle Zurich', city: 'Zurich' },
  { venue: 'Victoria Hall', city: 'Geneva' },
  { venue: 'KKL Luzern', city: 'Lucerne' },
  // --- Italy ---
  { venue: 'Teatro alla Scala', city: 'Milan' },
  { venue: 'Auditorium Parco della Musica', city: 'Rome' },
  { venue: 'Teatro La Fenice', city: 'Venice' },
  { venue: 'Teatro di San Carlo', city: 'Naples' },
  { venue: 'Teatro Comunale di Bologna', city: 'Bologna' },
  { venue: 'Teatro Regio', city: 'Turin' },
  // --- Spain & Portugal ---
  { venue: 'Auditorio Nacional de Musica', city: 'Madrid' },
  { venue: 'Teatro Real', city: 'Madrid' },
  { venue: 'L Auditori', city: 'Barcelona' },
  { venue: 'Palau de la Musica Catalana', city: 'Barcelona' },
  { venue: 'Fundacao Calouste Gulbenkian', city: 'Lisbon' },
  // --- Scandinavia ---
  { venue: 'DR Koncerthuset', city: 'Copenhagen' },
  { venue: 'Konserthuset', city: 'Stockholm' },
  { venue: 'Berwaldhallen', city: 'Stockholm' },
  { venue: 'Oslo Konserthus', city: 'Oslo' },
  { venue: 'Helsinki Music Centre', city: 'Helsinki' },
  // --- Central & Eastern Europe ---
  { venue: 'Mupa Budapest', city: 'Budapest' },
  { venue: 'Liszt Academy', city: 'Budapest' },
  { venue: 'Rudolfinum', city: 'Prague' },
  { venue: 'National Philharmonic', city: 'Warsaw' },
  { venue: 'Romanian Athenaeum', city: 'Bucharest' },
  { venue: 'Bulgaria Hall', city: 'Sofia' },
  // --- Russia ---
  { venue: 'Tchaikovsky Concert Hall', city: 'Moscow' },
  { venue: 'Moscow Conservatory', city: 'Moscow' },
  { venue: 'Mariinsky Theatre', city: 'St. Petersburg' },
  { venue: 'St. Petersburg Philharmonia', city: 'St. Petersburg' },
  // --- Japan ---
  { venue: 'Suntory Hall', city: 'Tokyo' },
  { venue: 'Tokyo Opera City', city: 'Tokyo' },
  { venue: 'NHK Hall', city: 'Tokyo' },
  { venue: 'Osaka Symphony Hall', city: 'Osaka' },
  // --- South Korea ---
  { venue: 'Seoul Arts Center', city: 'Seoul' },
  { venue: 'Lotte Concert Hall', city: 'Seoul' },
  // --- China ---
  { venue: 'National Centre for the Performing Arts', city: 'Beijing' },
  { venue: 'Shanghai Symphony Hall', city: 'Shanghai' },
  // --- Southeast Asia & Taiwan ---
  { venue: 'Hong Kong Cultural Centre', city: 'Hong Kong' },
  { venue: 'Esplanade', city: 'Singapore' },
  { venue: 'Victoria Concert Hall', city: 'Singapore' },
  { venue: 'National Concert Hall', city: 'Taipei' },
  // --- India ---
  { venue: 'NCPA Mumbai', city: 'Mumbai' },
  // --- Middle East ---
  { venue: 'Charles Bronfman Auditorium', city: 'Tel Aviv' },
  { venue: 'Jerusalem Theatre', city: 'Jerusalem' },
  { venue: 'Dubai Opera', city: 'Dubai' },
  // --- Oceania ---
  { venue: 'Sydney Opera House', city: 'Sydney' },
  { venue: 'Melbourne Recital Centre', city: 'Melbourne' },
  { venue: 'Hamer Hall', city: 'Melbourne' },
  { venue: 'Auckland Town Hall', city: 'Auckland' },
  // --- South America ---
  { venue: 'Teatro Colon', city: 'Buenos Aires' },
  { venue: 'Sala Sao Paulo', city: 'Sao Paulo' },
  { venue: 'Teatro Municipal', city: 'Sao Paulo' },
  { venue: 'Teatro Municipal de Santiago', city: 'Santiago' },
  // --- Ireland ---
  { venue: 'National Concert Hall', city: 'Dublin' },
  // --- Monaco ---
  { venue: 'Opera de Monte-Carlo', city: 'Monaco' },
];

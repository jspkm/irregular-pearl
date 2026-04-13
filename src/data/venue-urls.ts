/**
 * Maps known venue names to their official calendar / events URL.
 * Used to rewrite scraper-supplied URLs (e.g. bachtrack listings) so that
 * users land on the venue's own site instead of a third-party aggregator.
 *
 * Match is case-insensitive, ignores punctuation, and matches if a known
 * venue name is a substring of the scraped venue (which often includes
 * sub-hall info, e.g. "Carnegie Hall: Stern Auditorium").
 */

export interface VenueUrl {
  /** Canonical venue name to match against (case-insensitive substring). */
  name: string;
  /** Official events/calendar URL. */
  url: string;
}

export const VENUE_URLS: VenueUrl[] = [
  // United States
  { name: 'Carnegie Hall', url: 'https://www.carnegiehall.org/Calendar' },
  { name: 'David Geffen Hall', url: 'https://nyphil.org/concerts-tickets/calendar' },
  { name: 'Metropolitan Opera', url: 'https://www.metopera.org/season/in-cinemas/' },
  { name: 'Lincoln Center', url: 'https://www.lincolncenter.org/calendar' },
  { name: 'Walt Disney Concert Hall', url: 'https://www.laphil.com/calendar' },
  { name: 'Hollywood Bowl', url: 'https://www.hollywoodbowl.com/events' },
  { name: 'Dorothy Chandler', url: 'https://www.laopera.org/performances/' },
  { name: 'LA Opera', url: 'https://www.laopera.org/performances/' },
  { name: 'Davies Symphony Hall', url: 'https://www.sfsymphony.org/Buy-Tickets' },
  { name: 'War Memorial Opera House', url: 'https://www.sfopera.com/calendar/' },
  { name: 'Herbst Theatre', url: 'https://sfwmpac.org/herbst-theatre/' },
  { name: 'SFJAZZ', url: 'https://www.sfjazz.org/tickets/' },
  { name: 'Symphony Hall', url: 'https://www.bso.org/performances' },
  { name: 'Jordan Hall', url: 'https://necmusic.edu/concerts' },
  { name: 'Symphony Center', url: 'https://cso.org/performances/' },
  { name: 'Lyric Opera', url: 'https://www.lyricopera.org/shows/' },
  { name: 'Kennedy Center', url: 'https://www.kennedy-center.org/whats-on/' },
  { name: 'Strathmore', url: 'https://www.strathmore.org/calendar/' },
  { name: 'Kimmel Center', url: 'https://www.kimmelculturalcampus.org/events-and-tickets/' },
  { name: 'Verizon Hall', url: 'https://www.philorch.org/performances/' },
  { name: 'Severance Hall', url: 'https://www.clevelandorchestra.com/attend/' },
  { name: 'Heinz Hall', url: 'https://pittsburghsymphony.org/concerts' },
  { name: 'Meyerson Symphony Center', url: 'https://www.dallassymphony.org/calendar' },
  { name: 'Jones Hall', url: 'https://houstonsymphony.org/concerts/' },
  { name: 'Benaroya Hall', url: 'https://www.seattlesymphony.org/concerts' },
  { name: 'Schermerhorn', url: 'https://www.nashvillesymphony.org/calendar' },
  { name: 'Powell Hall', url: 'https://www.slso.org/en/tickets/calendar/' },
  { name: 'Orchestra Hall', url: 'https://www.minnesotaorchestra.org/concerts-tickets/' },
  { name: 'Ordway', url: 'https://www.thespco.org/concerts/' },
  { name: 'Bass Performance Hall', url: 'https://www.basshall.com/events' },
  { name: 'Adrienne Arsht', url: 'https://www.arshtcenter.org/tickets/' },

  // UK
  { name: 'Royal Albert Hall', url: 'https://www.royalalberthall.com/tickets/' },
  { name: 'Royal Festival Hall', url: 'https://www.southbankcentre.co.uk/whats-on' },
  { name: 'Southbank Centre', url: 'https://www.southbankcentre.co.uk/whats-on' },
  { name: 'Barbican', url: 'https://www.barbican.org.uk/whats-on' },
  { name: 'Wigmore Hall', url: 'https://wigmore-hall.org.uk/whats-on' },
  { name: 'Royal Opera House', url: 'https://www.roh.org.uk/tickets-and-events' },
  { name: 'Glyndebourne', url: 'https://www.glyndebourne.com/tickets/whats-on/' },

  // France
  { name: 'Philharmonie de Paris', url: 'https://philharmoniedeparis.fr/en/calendar' },
  { name: 'Opéra National de Paris', url: 'https://www.operadeparis.fr/en/season-23-24/calendar' },
  { name: 'Opera de Paris', url: 'https://www.operadeparis.fr/en/season-23-24/calendar' },
  { name: 'Théâtre des Champs-Élysées', url: 'https://www.theatrechampselysees.fr/en/season' },

  // Germany
  { name: 'Berliner Philharmonie', url: 'https://www.berliner-philharmoniker.de/en/concerts/calendar/' },
  { name: 'Staatsoper Unter den Linden', url: 'https://www.staatsoper-berlin.de/en/calendar/' },
  { name: 'Elbphilharmonie', url: 'https://www.elbphilharmonie.de/en/whats-on' },
  { name: 'Gewandhaus', url: 'https://www.gewandhausorchester.de/en/concerts/' },
  { name: 'Alte Oper', url: 'https://www.alteoper.de/en/program/' },
  { name: 'Bayerische Staatsoper', url: 'https://www.staatsoper.de/en/schedule' },
  { name: 'Münchner Philharmonie', url: 'https://www.mphil.de/en/concerts-tickets/' },

  // Austria
  { name: 'Musikverein', url: 'https://www.musikverein.at/en/concerts' },
  { name: 'Konzerthaus', url: 'https://konzerthaus.at/calendar' },
  { name: 'Wiener Staatsoper', url: 'https://www.wiener-staatsoper.at/en/schedule/calendar/' },

  // Netherlands
  { name: 'Concertgebouw', url: 'https://www.concertgebouw.nl/en/calendar' },
  { name: 'Dutch National Opera', url: 'https://www.operaballet.nl/en/calendar' },

  // Switzerland
  { name: 'KKL Luzern', url: 'https://www.kkl-luzern.ch/en/programm/' },
  { name: 'Tonhalle', url: 'https://www.tonhalle-orchester.ch/en/concerts/' },
  { name: 'Victoria Hall', url: 'https://www.osr.ch/en/calendar' },

  // Italy
  { name: 'Teatro alla Scala', url: 'https://www.teatroallascala.org/en/season/2024-2025/calendar' },
  { name: 'Teatro La Fenice', url: 'https://www.teatrolafenice.it/en/calendar/' },
  { name: 'Santa Cecilia', url: 'https://www.santacecilia.it/en/calendar' },

  // Spain
  { name: 'Teatro Real', url: 'https://www.teatroreal.es/en/season-2024-25' },
  { name: 'Auditorio Nacional', url: 'https://www.auditorionacional.mcu.es/programacion/' },
  { name: 'Palau de la Música', url: 'https://www.palaumusica.cat/en/whats-on' },
  { name: 'Liceu', url: 'https://www.liceubarcelona.cat/en/2024-2025-season' },

  // Asia / Oceania
  { name: 'Suntory Hall', url: 'https://www.suntory.com/culture-sports/suntoryhall/calendar/' },
  { name: 'Sydney Opera House', url: 'https://www.sydneyoperahouse.com/whats-on' },
  { name: 'Seoul Arts Center', url: 'https://www.sac.or.kr/site/eng/show/show_list' },
  { name: 'Melbourne Recital', url: 'https://www.melbournerecital.com.au/events/' },
];

const NORM = (s: string): string => s.toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();

/**
 * Returns the canonical venue URL for a scraped venue name, or null if no
 * known venue matches. Matches if any known venue name appears as a substring
 * of the scraped name (after normalization), so "Carnegie Hall: Stern
 * Auditorium" matches "Carnegie Hall".
 */
export function resolveVenueUrl(scrapedVenue: string | null | undefined): string | null {
  if (!scrapedVenue) return null;
  const hay = NORM(scrapedVenue);
  for (const v of VENUE_URLS) {
    if (hay.includes(NORM(v.name))) return v.url;
  }
  return null;
}

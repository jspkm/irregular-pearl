/**
 * Venue scraper registry. Add new venues by importing the scraper here.
 */

import { carnegieHall } from './carnegie-hall';
import { sfSymphony } from './sf-symphony';
import { laPhil } from './la-phil';
import { chicagoCso } from './chicago-cso';
import { berlinPhil } from './berlin-phil';
import { wigmoreHall } from './wigmore-hall';
import type { VenueScraper } from './types';

export const VENUE_SCRAPERS: VenueScraper[] = [
  carnegieHall,
  sfSymphony,
  laPhil,
  chicagoCso,
  berlinPhil,
  wigmoreHall,
];

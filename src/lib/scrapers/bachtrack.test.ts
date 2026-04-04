import { describe, test, expect } from 'bun:test';
import { parseEventListing } from './bachtrack';

// Fixture: real Bachtrack HTML structure (as of 2026-04)
// Each listing has a desktop <div data-id> block followed by a mobile <li data-id> block
const FIXTURE_HTML = `
<div data-id="433573" data-type="nothing" data-fkmyevent="" data-dates="1775296800">
<div class="listing-shortform listing-medium-1">
<div class="listing-shortform-left">
<div class="listing-shortform-dates">Sat  4 Apr at 11:00</div>
</div>
<div class="listing-shortform-middle">
<div class="li-shortform-venue"><h2 class="li-shortform-venue"><a href="/venue/wigmore-hall">Wigmore Hall</a>, <a href="/city/london">London</a></h2></div>
<div class="listing-shortform-lowermid">
<div class="li-shortform-title">McLorinan, Paul, Daniels, Wall, Holliday, Fretwork, Wollston</div>
<a class="listing-more-info" href="/concert-event/mclorinan-paul-wigmore-hall-4-april-2026/433573">More info</a>
</div>
</div>
<div class="listing-shortform-right">
<div class="listing-personnel-simple">
<div class="item"><span class="performername">Martha McLorinan</span>, <span class="rolename">Mezzo-soprano</span></div>
<div class="item"><span class="performername">Elisabeth Paul</span>, <span class="rolename">Contralto</span></div>
<div class="item"><span class="performername">Charles Daniels</span>, <span class="rolename">Tenor</span></div>
</div>
</div>
</div>
</div>
<li data-id="433573" data-dates="1775296800"><div class="listing-ms"><div class="listing-ms-right">
<div class="listing-ms-venue">Wigmore Hall</div>
<div class="listing-ms-city">London</div>
<div class="listing-ms-dates">Sat  4 Apr at 11:00</div>
<div class="listing-ms-main">Schütz, Schein, Scheidt</div>
<div class="listing-ms-performers">McLorinan, Paul, Daniels</div>
</div></div></li>
<div data-id="423604" data-type="nothing" data-fkmyevent="" data-dates="1775304900">
<div class="listing-shortform listing-medium-1">
<div class="listing-shortform-left">
<div class="listing-shortform-dates">Sat  4 Apr at 14:15</div>
</div>
<div class="listing-shortform-middle">
<div class="li-shortform-venue"><h2 class="li-shortform-venue"><a href="/venue/concertgebouw">Concertgebouw: Main Hall</a>, <a href="/city/amsterdam">Amsterdam</a></h2></div>
<div class="listing-shortform-lowermid">
<div class="li-shortform-title">The Bach Choir &amp; Orchestra of the Netherlands: St Matthew Passion</div>
<a class="listing-more-info" href="/concert-event/bach-st-matthew-passion-concertgebouw-4-april-2026/423604">More info</a>
</div>
</div>
<div class="listing-shortform-right">
<div class="listing-personnel-simple">
<div class="item"><span class="performername">Bach Choir of the Netherlands</span></div>
<div class="item"><span class="performername">Pieter Jan Leusink</span>, <span class="rolename">Conductor</span></div>
</div>
</div>
</div>
</div>
<li data-id="423604" data-dates="1775304900"><div class="listing-ms"><div class="listing-ms-right">
<div class="listing-ms-venue">Concertgebouw: Main Hall</div>
<div class="listing-ms-city">Amsterdam</div>
<div class="listing-ms-dates">Sat  4 Apr at 14:15</div>
<div class="listing-ms-main">St Matthew Passion, BWV244</div>
<div class="listing-ms-performers">Leusink, Bach Orchestra of the Netherlands</div>
</div></div></li>
`;

describe('Bachtrack parser', () => {
  test('parses two listings from fixture HTML', () => {
    const candidates = parseEventListing(FIXTURE_HTML);
    expect(candidates.length).toBe(2);
  });

  test('extracts title correctly', () => {
    const candidates = parseEventListing(FIXTURE_HTML);
    expect(candidates[0].title).toContain('McLorinan');
    expect(candidates[1].title).toContain('St Matthew Passion');
  });

  test('extracts venue and city from links', () => {
    const candidates = parseEventListing(FIXTURE_HTML);
    expect(candidates[0].venue).toBe('Wigmore Hall');
    expect(candidates[0].city).toBe('London');
    expect(candidates[1].venue).toBe('Concertgebouw: Main Hall');
    expect(candidates[1].city).toBe('Amsterdam');
  });

  test('parses date from displayed text', () => {
    const candidates = parseEventListing(FIXTURE_HTML);
    expect(candidates[0].event_date).toMatch(/^\d{4}-04-04$/);
    expect(candidates[1].event_date).toMatch(/^\d{4}-04-04$/);
  });

  test('extracts start_time from displayed text', () => {
    const candidates = parseEventListing(FIXTURE_HTML);
    expect(candidates[0].start_time).toBe('11:00');
    expect(candidates[1].start_time).toBe('14:15');
  });

  test('extracts URL with bachtrack domain', () => {
    const candidates = parseEventListing(FIXTURE_HTML);
    expect(candidates[0].url).toContain('bachtrack.com');
    expect(candidates[0].url).toContain('/concert-event/');
  });

  test('extracts performer names', () => {
    const candidates = parseEventListing(FIXTURE_HTML);
    expect(candidates[0].performers).toContain('Martha McLorinan');
    expect(candidates[0].performers).toContain('Elisabeth Paul');
    expect(candidates[0].performers).toContain('Charles Daniels');
    expect(candidates[1].performers).toContain('Pieter Jan Leusink');
  });

  test('decodes HTML entities in title', () => {
    const candidates = parseEventListing(FIXTURE_HTML);
    expect(candidates[1].title).toContain('&');
    expect(candidates[1].title).not.toContain('&amp;');
  });

  test('falls back to listing-ms-city when venue link has no city', () => {
    const html = `
<div data-id="999" data-dates="1775296800">
<div class="listing-shortform"><div class="listing-shortform-dates">Sat  4 Apr at 19:00</div>
<div class="li-shortform-venue"><h2 class="li-shortform-venue">Opéra de Monte-Carlo</h2></div>
<div class="li-shortform-title">Test Event</div></div></div>
<li data-id="999" data-dates="1775296800"><div class="listing-ms"><div class="listing-ms-right">
<div class="listing-ms-venue">Opéra de Monte-Carlo</div>
<div class="listing-ms-city">Monaco</div>
</div></div></li>
`;
    const candidates = parseEventListing(html);
    expect(candidates.length).toBe(1);
    expect(candidates[0].city).toBe('Monaco');
  });

  test('returns empty array for non-matching HTML', () => {
    expect(parseEventListing('<div>No listings</div>')).toEqual([]);
  });

  test('returns empty array for empty string', () => {
    expect(parseEventListing('')).toEqual([]);
  });
});

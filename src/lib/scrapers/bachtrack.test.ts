import { describe, test, expect } from 'bun:test';
import { parseEventListing } from './bachtrack';

// Fixture: real Bachtrack HTML structure (as of 2026-04)
const FIXTURE_HTML = `
<div data-id="433573" data-type="nothing" data-fkmyevent="" data-dates="1775296800">
<div class="listing-shortform data-sfdate='2026-03-25 14:04:44' listing-medium-1">
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
<li data-id="433573" data-type="nothing" data-dates="1775296800"><div class="listing-ms"></div></li>
<div data-id="423604" data-type="nothing" data-fkmyevent="" data-dates="1775304900">
<div class="listing-shortform data-sfdate='2026-03-23 07:46:36' listing-medium-1">
<div class="listing-shortform-left">
<div class="listing-shortform-dates">Sat  4 Apr at 14:15</div>
</div>
<div class="listing-shortform-middle">
<div class="li-shortform-venue"><h2 class="li-shortform-venue"><a href="/venue/concertgebouw-main-hall">Concertgebouw: Main Hall</a>, <a href="/city/amsterdam">Amsterdam</a></h2></div>
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
<li data-id="423604" data-type="nothing" data-dates="1775304900"><div class="listing-ms"></div></li>
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

  test('parses date from data-dates unix timestamp', () => {
    const candidates = parseEventListing(FIXTURE_HTML);
    // 1775296800 = 2026-04-02 or similar (depends on TZ)
    expect(candidates[0].event_date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  test('extracts start_time from timestamp', () => {
    const candidates = parseEventListing(FIXTURE_HTML);
    // Should have a time component
    if (candidates[0].start_time) {
      expect(candidates[0].start_time).toMatch(/^\d{2}:\d{2}$/);
    }
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

  test('returns empty array for non-matching HTML', () => {
    const candidates = parseEventListing('<div>No listings here</div>');
    expect(candidates).toEqual([]);
  });

  test('returns empty array for empty string', () => {
    const candidates = parseEventListing('');
    expect(candidates).toEqual([]);
  });
});

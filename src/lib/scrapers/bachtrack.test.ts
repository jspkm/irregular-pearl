import { describe, test, expect } from 'bun:test';
import { parseEventListing } from './bachtrack';

// Fixture: realistic Bachtrack-style HTML listing
const FIXTURE_HTML = `
<article class="listing-item">
  <h3 class="listing-title">Bach Cello Suite No. 1 Recital</h3>
  <span class="listing-venue">Jordan Hall</span>
  <span class="listing-location">Boston, USA</span>
  <time datetime="2026-04-10T19:30">7:30 PM</time>
  <a href="/concert/bach-cello-suite-boston">Details</a>
  <span class="listing-performer">Yo-Yo Ma</span>
  <span class="listing-performer">Emanuel Ax</span>
</article>
<article class="listing-item">
  <h3 class="listing-title">Beethoven Piano Sonatas Masterclass</h3>
  <span class="listing-venue">Weill Recital Hall</span>
  <span class="listing-location">New York, USA</span>
  <time datetime="2026-04-12">TBA</time>
  <a href="/concert/beethoven-masterclass-nyc">Details</a>
</article>
<article class="listing-item">
  <h3 class="listing-title"></h3>
  <span class="listing-venue">Empty Title Venue</span>
  <time datetime="2026-04-13">TBA</time>
</article>
`;

describe('Bachtrack parser', () => {
  test('parses valid HTML into EventCandidates', () => {
    const candidates = parseEventListing(FIXTURE_HTML);
    // Should skip the empty-title entry
    expect(candidates.length).toBe(2);
  });

  test('extracts title, venue, city correctly', () => {
    const candidates = parseEventListing(FIXTURE_HTML);
    expect(candidates[0].title).toBe('Bach Cello Suite No. 1 Recital');
    expect(candidates[0].venue).toBe('Jordan Hall');
    expect(candidates[0].city).toBe('Boston');
  });

  test('extracts date and time', () => {
    const candidates = parseEventListing(FIXTURE_HTML);
    expect(candidates[0].event_date).toBe('2026-04-10');
    expect(candidates[0].start_time).toBe('19:30');
    // Second event has no time
    expect(candidates[1].event_date).toBe('2026-04-12');
    expect(candidates[1].start_time).toBeUndefined();
  });

  test('extracts URL with bachtrack domain', () => {
    const candidates = parseEventListing(FIXTURE_HTML);
    expect(candidates[0].url).toContain('bachtrack.com');
  });

  test('extracts performers', () => {
    const candidates = parseEventListing(FIXTURE_HTML);
    expect(candidates[0].performers).toEqual(['Yo-Yo Ma', 'Emanuel Ax']);
    // Second event has no performers listed
    expect(candidates[1].performers).toBeUndefined();
  });

  test('infers event type from title', () => {
    const candidates = parseEventListing(FIXTURE_HTML);
    expect(candidates[0].event_type).toBe('recital');
    expect(candidates[1].event_type).toBe('masterclass');
  });

  test('returns empty array for non-matching HTML', () => {
    const candidates = parseEventListing('<div>No events here</div>');
    expect(candidates).toEqual([]);
  });

  test('returns empty array for empty string', () => {
    const candidates = parseEventListing('');
    expect(candidates).toEqual([]);
  });

  test('skips entries without event_date', () => {
    const html = `
      <article class="listing-item">
        <h3 class="listing-title">No Date Event</h3>
        <span class="listing-venue">Some Venue</span>
      </article>
    `;
    const candidates = parseEventListing(html);
    expect(candidates.length).toBe(0);
  });
});

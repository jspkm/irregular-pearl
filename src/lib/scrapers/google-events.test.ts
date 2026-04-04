import { describe, test, expect } from 'bun:test';
import { parseGoogleEvents } from './google-events';

const JSON_LD_FIXTURE = `
<html><head>
<script type="application/ld+json">
[
  {
    "@type": "MusicEvent",
    "name": "Bach Cello Suite Recital",
    "startDate": "2027-04-10T19:30:00",
    "location": {
      "@type": "Place",
      "name": "Jordan Hall",
      "address": { "addressLocality": "Boston" }
    },
    "url": "https://example.com/bach-recital",
    "performer": [
      { "@type": "Person", "name": "Yo-Yo Ma" }
    ],
    "offers": { "price": "25", "priceCurrency": "USD" }
  },
  {
    "@type": "Event",
    "name": "Beethoven Piano Sonatas",
    "startDate": "2027-04-12",
    "location": "Weill Recital Hall",
    "description": "An evening of late Beethoven sonatas."
  }
]
</script>
</head><body></body></html>
`;

describe('Google Events parser', () => {
  test('parses JSON-LD MusicEvent and Event types', () => {
    const candidates = parseGoogleEvents(JSON_LD_FIXTURE, 'Boston');
    expect(candidates.length).toBe(2);
  });

  test('extracts title, venue, city from JSON-LD', () => {
    const candidates = parseGoogleEvents(JSON_LD_FIXTURE, 'Boston');
    expect(candidates[0].title).toBe('Bach Cello Suite Recital');
    expect(candidates[0].venue).toBe('Jordan Hall');
    expect(candidates[0].city).toBe('Boston');
  });

  test('extracts date and time from startDate', () => {
    const candidates = parseGoogleEvents(JSON_LD_FIXTURE, 'Boston');
    expect(candidates[0].event_date).toBe('2027-04-10');
    expect(candidates[0].start_time).toBe('19:30');
    // Second event has date only
    expect(candidates[1].event_date).toBe('2027-04-12');
    expect(candidates[1].start_time).toBeUndefined();
  });

  test('extracts performers from JSON-LD', () => {
    const candidates = parseGoogleEvents(JSON_LD_FIXTURE, 'Boston');
    expect(candidates[0].performers).toEqual(['Yo-Yo Ma']);
    expect(candidates[1].performers).toBeUndefined();
  });

  test('extracts ticket price from offers', () => {
    const candidates = parseGoogleEvents(JSON_LD_FIXTURE, 'Boston');
    expect(candidates[0].url).toBe('https://example.com/bach-recital');
  });

  test('extracts description', () => {
    const candidates = parseGoogleEvents(JSON_LD_FIXTURE, 'Boston');
    expect(candidates[1].description).toBe('An evening of late Beethoven sonatas.');
  });

  test('handles string location', () => {
    const candidates = parseGoogleEvents(JSON_LD_FIXTURE, 'New York');
    expect(candidates[1].venue).toBe('Weill Recital Hall');
  });

  test('infers event type from title', () => {
    const candidates = parseGoogleEvents(JSON_LD_FIXTURE, 'Boston');
    expect(candidates[0].event_type).toBe('recital');
    expect(candidates[1].event_type).toBe('concert'); // default
  });

  test('returns empty for no JSON-LD', () => {
    const candidates = parseGoogleEvents('<html><body>No events</body></html>', 'Boston');
    expect(candidates).toEqual([]);
  });

  test('skips invalid JSON-LD blocks', () => {
    const html = '<script type="application/ld+json">not valid json</script>';
    const candidates = parseGoogleEvents(html, 'Boston');
    expect(candidates).toEqual([]);
  });

  test('skips non-Event types', () => {
    const html = `<script type="application/ld+json">{"@type":"Organization","name":"Test"}</script>`;
    const candidates = parseGoogleEvents(html, 'Boston');
    expect(candidates).toEqual([]);
  });

  test('skips events without title', () => {
    const html = `<script type="application/ld+json">{"@type":"Event","startDate":"2027-04-10"}</script>`;
    const candidates = parseGoogleEvents(html, 'Boston');
    expect(candidates).toEqual([]);
  });

  test('skips events without date', () => {
    const html = `<script type="application/ld+json">{"@type":"Event","name":"Test"}</script>`;
    const candidates = parseGoogleEvents(html, 'Boston');
    expect(candidates).toEqual([]);
  });
});

import { describe, test, expect } from 'bun:test';

const BASE = 'https://irregularpearl.org';

async function fetchOk(path: string) {
  const res = await fetch(`${BASE}${path}`);
  return res;
}

describe('E2E: static pages', () => {
  test('homepage returns 200 with HTML', async () => {
    const res = await fetchOk('/');
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('text/html');
  });

  test('about page returns 200', async () => {
    const res = await fetchOk('/about');
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain('Irregular Pearl');
  });

  test('privacy page returns 200', async () => {
    const res = await fetchOk('/privacy');
    expect(res.status).toBe(200);
  });

  test('terms page returns 200', async () => {
    const res = await fetchOk('/terms');
    expect(res.status).toBe(200);
  });
});

describe('E2E: piece pages', () => {
  test('piece page returns 200', async () => {
    const res = await fetchOk('/piece/bach-cello-suite-1');
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain('Cello Suite No. 1');
    expect(html).toContain('Bach');
  });

  test('non-existent piece redirects to home', async () => {
    const res = await fetch(`${BASE}/piece/does-not-exist`, { redirect: 'manual' });
    expect([301, 302, 308]).toContain(res.status);
  });
});

describe('E2E: composer pages', () => {
  test('composer page returns 200', async () => {
    const res = await fetchOk('/composer/Johann%20Sebastian%20Bach');
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain('Bach');
  });
});

describe('E2E: instrument pages', () => {
  test('instrument page returns 200', async () => {
    const res = await fetchOk('/instrument/piano');
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain('Piano');
  });
});

describe('E2E: search', () => {
  test('search returns results', async () => {
    const res = await fetchOk('/?q=chopin');
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain('Chopin');
  });

  test('empty search returns homepage', async () => {
    const res = await fetchOk('/?q=');
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain('Featured Pieces');
  });
});

describe('E2E: SEO files', () => {
  test('robots.txt returns text', async () => {
    const res = await fetchOk('/robots.txt');
    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).toContain('Sitemap:');
    expect(text).toContain('irregularpearl.org');
  });

  test('sitemap.xml returns XML', async () => {
    const res = await fetchOk('/sitemap.xml');
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('application/xml');
    const xml = await res.text();
    expect(xml).toContain('<urlset');
    expect(xml).toContain('/piece/bach-cello-suite-1');
    expect(xml).toContain('/composer/');
    expect(xml).toContain('/instrument/');
    expect(xml).toContain('/about');
  });

  test('llms.txt returns plain text', async () => {
    const res = await fetchOk('/llms.txt');
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('text/plain');
    const text = await res.text();
    expect(text).toContain('Irregular Pearl');
    expect(text).toContain('/composer/');
    expect(text).toContain('/instrument/');
  });

  test('llms-full.txt returns full catalog', async () => {
    const res = await fetchOk('/llms-full.txt');
    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).toContain('Full Piece Catalog');
    expect(text).toContain('Editions');
  });

  test('openapi.json returns valid spec', async () => {
    const res = await fetchOk('/openapi.json');
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('application/json');
    const spec = await res.json();
    expect(spec.openapi).toBe('3.1.0');
    expect(spec.paths['/']).toBeTruthy();
    expect(spec.paths['/piece/{id}']).toBeTruthy();
  });

  test('BingSiteAuth.xml returns 200', async () => {
    const res = await fetchOk('/BingSiteAuth.xml');
    expect(res.status).toBe(200);
  });

  test('ai-plugin.json returns plugin manifest', async () => {
    const res = await fetchOk('/.well-known/ai-plugin.json');
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.name_for_human).toBe('Irregular Pearl');
    expect(json.api.url).toContain('irregularpearl.org');
  });
});

describe('E2E: structured data', () => {
  test('homepage has JSON-LD', async () => {
    const res = await fetchOk('/');
    const html = await res.text();
    expect(html).toContain('application/ld+json');
    expect(html).toContain('"@type":"WebSite"');
  });

  test('piece page has MusicComposition JSON-LD', async () => {
    const res = await fetchOk('/piece/bach-cello-suite-1');
    const html = await res.text();
    expect(html).toContain('application/ld+json');
    expect(html).toContain('"@type":"MusicComposition"');
  });

  test('about page has Organization JSON-LD', async () => {
    const res = await fetchOk('/about');
    const html = await res.text();
    expect(html).toContain('application/ld+json');
    expect(html).toContain('"@type":"Organization"');
  });
});

describe('E2E: meta tags', () => {
  test('homepage has canonical and OG tags', async () => {
    const res = await fetchOk('/');
    const html = await res.text();
    expect(html).toContain('rel="canonical"');
    expect(html).toContain('og:title');
    expect(html).toContain('og:description');
    expect(html).toContain('twitter:card');
  });

  test('piece page has descriptive title', async () => {
    const res = await fetchOk('/piece/chopin-ballade-1');
    const html = await res.text();
    expect(html).toContain('Ballade No. 1');
    expect(html).toContain('| Irregular Pearl');
  });
});

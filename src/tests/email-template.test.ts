// Unit tests for the shared email template primitives.
// The template module lives under supabase/functions/_lib/ so edge functions
// can import it at runtime, but it's pure TypeScript with no Deno APIs —
// safe to import directly from a bun test.

import { describe, test, expect } from 'bun:test';
import {
  TOKENS,
  esc,
  kicker,
  heading,
  paragraph,
  primaryButton,
  link,
  divider,
  card,
  renderEmailLayout,
} from '../../supabase/functions/_lib/email-template';

describe('esc', () => {
  test('escapes all five HTML-unsafe chars', () => {
    expect(esc(`<a href="x">&'`)).toBe('&lt;a href=&quot;x&quot;&gt;&amp;&#39;');
  });
});

describe('kicker', () => {
  test('renders with accent color and uppercase transform', () => {
    const html = kicker('new this week');
    expect(html).toContain(TOKENS.accent);
    expect(html).toContain('text-transform:uppercase');
    expect(html).toContain('new this week');
  });
});

describe('heading', () => {
  test('wraps in anchor when href supplied', () => {
    const html = heading('Cello Suite No. 1', { href: 'https://example.com/a' });
    expect(html).toContain('<a href="https://example.com/a"');
    expect(html).toContain('Cello Suite No. 1');
  });

  test('no anchor when href omitted', () => {
    const html = heading('No link');
    expect(html).not.toContain('<a ');
  });

  test('h1 uses larger size than default', () => {
    const h1 = heading('Big', { level: 'h1' });
    const h3 = heading('Small', { level: 'h3' });
    expect(h1).toContain('font-size:28px');
    expect(h3).toContain('font-size:18px');
  });
});

describe('paragraph', () => {
  test('default uses sans', () => {
    expect(paragraph('body')).toContain('Inter');
  });

  test('serif mode uses Source Serif 4', () => {
    const html = paragraph('editorial', { family: 'serif' });
    expect(html).toContain('Source Serif 4');
    expect(html).toContain('line-height:1.68');
  });

  test('muted mode uses muted color', () => {
    const html = paragraph('x', { muted: true });
    expect(html).toContain(TOKENS.muted);
  });
});

describe('primaryButton', () => {
  test('uses dark-ink background, white text, href as given', () => {
    const html = primaryButton({ text: 'Explore', href: 'https://example.com' });
    expect(html).toContain(`background:${TOKENS.ink}`);
    expect(html).toContain('color:#FFFFFF');
    expect(html).toContain('href="https://example.com"');
  });
});

describe('link', () => {
  test('muted link uses hint color', () => {
    const html = link({ text: 'Unsubscribe', href: 'https://example.com/u', muted: true });
    expect(html).toContain(TOKENS.hint);
  });

  test('default link uses accent color', () => {
    const html = link({ text: 'Settings', href: 'https://example.com/s' });
    expect(html).toContain(TOKENS.accent);
  });
});

describe('divider', () => {
  test('renders a 1px rule in border color by default', () => {
    expect(divider()).toContain(`border-top:1px solid ${TOKENS.border}`);
  });

  test('custom color overrides default', () => {
    expect(divider({ color: '#FF0000' })).toContain('border-top:1px solid #FF0000');
  });
});

describe('card', () => {
  test('default uses 1px border, no accent left', () => {
    const html = card({ html: 'inner' });
    expect(html).toContain(`border:1px solid ${TOKENS.border}`);
    expect(html).not.toContain(`border-left:2px solid ${TOKENS.accent}`);
    expect(html).toContain('inner');
  });

  test('accent mode adds 2px purple left border', () => {
    const html = card({ html: 'inner', accent: true });
    expect(html).toContain(`border-left:2px solid ${TOKENS.accent}`);
  });
});

describe('renderEmailLayout', () => {
  test('includes title, preheader, body, and wordmark', () => {
    const html = renderEmailLayout({
      title: 'Irregular Pearl — Test',
      preheader: 'Preview snippet here.',
      subtitle: 'Weekly Digest',
      bodyHtml: '<p>BODY_MARKER</p>',
    });
    expect(html).toContain('<title>Irregular Pearl — Test</title>');
    expect(html).toContain('Preview snippet here.');
    expect(html).toContain('BODY_MARKER');
    expect(html).toContain('IrregularPearl'); // wordmark, non-italic
    expect(html).toContain('Weekly Digest'); // subtitle
  });

  test('omits footer when no footerNote or footerLink given', () => {
    const html = renderEmailLayout({ title: 't', bodyHtml: 'body' });
    expect(html).not.toContain('Unsubscribe');
  });

  test('includes footer note + link when provided', () => {
    const html = renderEmailLayout({
      title: 't',
      bodyHtml: 'body',
      footerNote: 'Opt-in reminder.',
      footerLink: { text: 'Unsubscribe', href: 'https://example.com/u' },
    });
    expect(html).toContain('Opt-in reminder.');
    expect(html).toContain('Unsubscribe');
  });

  test('output has no amber #B45309 — Claude kit reskin complete', () => {
    const html = renderEmailLayout({ title: 't', bodyHtml: paragraph('test') });
    expect(html.toUpperCase()).not.toContain('#B45309');
    expect(html.toUpperCase()).not.toContain('#B4530');
  });

  test('output contains the Claude-kit accent purple', () => {
    const html = renderEmailLayout({
      title: 't',
      bodyHtml: kicker('Section'),
    });
    expect(html).toContain(TOKENS.accent);
  });
});

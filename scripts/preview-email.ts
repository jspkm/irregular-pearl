#!/usr/bin/env bun
// Renders sample emails to HTML files for visual review. No network calls —
// pure local rendering of whatever's shipped in supabase/functions/_lib/.
//
// Usage:
//   bun run scripts/preview-email.ts                 # write + print paths
//   bun run scripts/preview-email.ts --open          # also open in browser

import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { spawn } from 'node:child_process';

import {
  card,
  esc,
  heading,
  kicker,
  paragraph,
  primaryButton,
  renderEmailLayout,
  TOKENS,
} from '../supabase/functions/_lib/email-template';

const OUT_DIR = resolve(import.meta.dir, '..', 'dist-preview');

// Sample data — matches current prod catalog shape
const sampleWeeklyDigest = renderWeeklyDigestSample();
const sampleNotificationDigest = renderNotificationDigestSample();
const sampleSwatches = renderSwatches();

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  await writeFile(resolve(OUT_DIR, 'weekly-digest.html'), sampleWeeklyDigest);
  await writeFile(resolve(OUT_DIR, 'notification-digest.html'), sampleNotificationDigest);
  await writeFile(resolve(OUT_DIR, 'swatches.html'), sampleSwatches);

  console.log('Rendered previews:');
  console.log(`  ${resolve(OUT_DIR, 'weekly-digest.html')}`);
  console.log(`  ${resolve(OUT_DIR, 'notification-digest.html')}`);
  console.log(`  ${resolve(OUT_DIR, 'swatches.html')}`);

  if (process.argv.includes('--open')) {
    for (const file of ['weekly-digest.html', 'notification-digest.html', 'swatches.html']) {
      spawn('open', [resolve(OUT_DIR, file)], { stdio: 'ignore', detached: true }).unref();
    }
  }
}

function renderWeeklyDigestSample(): string {
  const pieces = [
    {
      id: 'bach-cello-1',
      title: 'Cello Suite No. 1 in G major',
      composer_name: 'Bach, J.S.',
      catalog_number: 'BWV 1007',
      instruments: ['cello'],
      era: 'Baroque',
      description: 'The most-played of the Six, and the one every cellist must eventually confront on their own terms.',
    },
    {
      id: 'dvorak-cello-concerto',
      title: 'Cello Concerto in B minor',
      composer_name: 'Dvořák, Antonín',
      catalog_number: 'Op. 104',
      instruments: ['cello', 'orchestra'],
      era: 'Romantic',
      description: 'The concerto that convinced Brahms to wish he had written one. The Adagio ma non troppo is the passage cellists return to for the rest of their lives.',
    },
  ];

  const piecesHtml = pieces.map(renderPieceCardSample).join('\n');

  const bodyHtml = `
    <div style="padding-bottom:12px;">${paragraph('Dear Haji,')}</div>
    <div style="padding-bottom:20px;">${paragraph('2 new pieces added to the catalog this week. The catalog now holds 19 pieces.', { muted: true })}</div>
    ${renderStatBlockSample(19, 2)}
    <div style="padding-bottom:12px;">${kicker('New this week')}</div>
    ${piecesHtml}
    <div align="center" style="padding:24px 0 8px;">
      ${primaryButton({ text: 'Explore Irregular Pearl', href: 'https://irregularpearl.org' })}
    </div>
  `;

  return renderEmailLayout({
    title: 'Irregular Pearl — Weekly Digest · April 13–20, 2026',
    preheader: '2 new pieces added to the catalog this week. The catalog now holds 19 pieces.',
    subtitle: 'Weekly Digest',
    bodyHtml,
    footerNote: "You're receiving this because you opted in to weekly digests.",
    footerLink: { text: 'Manage email preferences', href: 'https://irregularpearl.org/profile/preview-user-id?section=setting#email' },
  });
}

function renderPieceCardSample(p: {
  id: string;
  title: string;
  composer_name: string;
  catalog_number: string | null;
  instruments: string[];
  era: string;
  description: string;
}): string {
  const meta = [p.instruments.slice(0, 2).join(', '), p.era].filter(Boolean).join(' · ');
  const desc = p.description.length > 140
    ? p.description.slice(0, 140).replace(/\s+\S*$/, '') + '...'
    : p.description;
  const url = `https://irregularpearl.org/piece/${p.id}`;

  const inner = `
    <div style="display:flex;justify-content:space-between;font-family:${TOKENS.sans};font-size:11px;color:${TOKENS.accent};letter-spacing:0.08em;font-weight:500;text-transform:uppercase;">
      <span>${esc(meta)}</span>
      ${p.catalog_number ? `<span style="color:${TOKENS.muted};">${esc(p.catalog_number)}</span>` : ''}
    </div>
    <div style="padding-top:6px;">${heading(p.title, { level: 'h3', href: url })}</div>
    <div style="padding-top:4px;">${paragraph(p.composer_name, { muted: true })}</div>
    ${desc ? `<div style="padding-top:10px;">${paragraph(desc, { family: 'serif' })}</div>` : ''}
  `;

  return card({ html: inner, accent: true });
}

function renderStatBlockSample(total: number, newCount: number): string {
  return `<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom:20px;">
<tr>
  <td width="50%" align="center" style="padding:14px 0;border:1px solid ${TOKENS.border};border-radius:8px 0 0 8px;border-right:0;">
    <div style="font-family:${TOKENS.serif};font-size:26px;color:${TOKENS.ink};">${total}</div>
    <div style="font-family:${TOKENS.sans};font-size:10px;color:${TOKENS.muted};text-transform:uppercase;letter-spacing:0.08em;padding-top:2px;">Pieces</div>
  </td>
  <td width="50%" align="center" style="padding:14px 0;border:1px solid ${TOKENS.border};border-radius:0 8px 8px 0;">
    <div style="font-family:${TOKENS.serif};font-size:26px;color:${TOKENS.ink};">${newCount}</div>
    <div style="font-family:${TOKENS.sans};font-size:10px;color:${TOKENS.muted};text-transform:uppercase;letter-spacing:0.08em;padding-top:2px;">New this week</div>
  </td>
</tr>
</table>`;
}

// Stub for the Slice A daily digest — same template primitives, different body.
function renderNotificationDigestSample(): string {
  const items = [
    {
      piece: 'Cello Suite No. 1 in G major',
      url: 'https://irregularpearl.org/piece/bach-cello-1#performers-notes',
      excerpt: 'A draft performer\'s note awaits your review.',
    },
    {
      piece: 'Dvořák Cello Concerto',
      url: 'https://irregularpearl.org/piece/dvorak-cello-concerto#performers-notes',
      excerpt: 'A revised draft is ready after your earlier notes.',
    },
  ];

  const itemsHtml = items.map((item) => {
    const inner = `
      ${heading(item.piece, { level: 'h3', href: item.url })}
      <div style="padding-top:6px;">${paragraph(item.excerpt, { muted: true })}</div>
    `;
    return card({ html: inner, accent: true });
  }).join('\n');

  const bodyHtml = `
    <div style="padding-bottom:12px;">${paragraph('Dear Haji,')}</div>
    <div style="padding-bottom:20px;">${paragraph('You have 2 un-cleared notifications waiting in your queue.', { muted: true })}</div>
    <div style="padding-bottom:12px;">${kicker('Awaiting your review')}</div>
    ${itemsHtml}
    <div align="center" style="padding:24px 0 8px;">
      ${primaryButton({ text: 'Open your queue', href: 'https://irregularpearl.org/notifications' })}
    </div>
  `;

  return renderEmailLayout({
    title: 'Irregular Pearl — 2 items await your review',
    preheader: 'You have 2 un-cleared notifications waiting in your queue.',
    subtitle: 'Daily digest',
    bodyHtml,
    footerNote: 'You\'re receiving this because drafts are waiting for your approval.',
    footerLink: { text: 'Manage email preferences', href: 'https://irregularpearl.org/profile/preview-user-id?section=setting#email' },
  });
}

function renderSwatches(): string {
  const colors = [
    ['bg', TOKENS.bg],
    ['ink', TOKENS.ink],
    ['muted', TOKENS.muted],
    ['hint', TOKENS.hint],
    ['border', TOKENS.border],
    ['borderStrong', TOKENS.borderStrong],
    ['accent', TOKENS.accent],
    ['accentSoft', TOKENS.accentSoft],
  ];

  const rows = colors.map(([name, hex]) =>
    `<tr><td style="padding:8px 16px;width:160px;background:${hex};border:1px solid ${TOKENS.border};">&nbsp;</td><td style="padding:8px 16px;font-family:${TOKENS.sans};font-size:13px;">${esc(name)} = <code>${esc(hex)}</code></td></tr>`
  ).join('\n');

  return renderEmailLayout({
    title: 'Email template swatches',
    subtitle: 'Swatches',
    bodyHtml: `
      <div style="padding-bottom:16px;">${paragraph('Claude-kit email tokens as rendered on a real email client surface.')}</div>
      <table role="presentation" cellspacing="0" cellpadding="0" border="0">${rows}</table>
    `,
  });
}

await main();

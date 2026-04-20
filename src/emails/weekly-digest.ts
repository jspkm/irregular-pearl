/**
 * Weekly Digest Email Renderer
 *
 * Generates the admin weekly digest email.
 * Sent every Monday at 03:00 UTC via cron or Supabase Edge Function.
 *
 * Usage:
 *   const html = await renderWeeklyDigest(supabase, { recipientName: 'Joseph' });
 *   // then send via Resend / Postmark / SES
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../lib/database.types';

// ── Types ──────────────────────────────────────────────────────────────────

interface DigestPiece {
  id: string;
  title: string;
  composer_name: string;
  catalog_number: string | null;
  instruments: string[];
  era: string;
  description: string;
}

interface WeeklySnapshot {
  weekLabel: string;
  registeredUsers: number;
}

interface DigestData {
  weekRange: string;
  recipientName: string;
  digestSummary: string;
  pieces: DigestPiece[];
  totalPieces: number;
  totalMembers: number;
  unsubscribeUrl: string;
  trendData: WeeklySnapshot[];
}

// ── Template loader ────────────────────────────────────────────────────────

function loadTemplate(): string {
  const __dir = dirname(fileURLToPath(import.meta.url));
  return readFileSync(join(__dir, 'weekly-digest.html'), 'utf-8');
}

// ── Piece card renderer ────────────────────────────────────────────────────

function renderPieceCard(piece: DigestPiece): string {
  const instrumentLabel = piece.instruments.slice(0, 2).join(', ');
  const metaLabel = [instrumentLabel, piece.era].filter(Boolean).join(' \u00B7 ');
  const pieceUrl = `https://irregularpearl.org/piece/${piece.id}`;

  const desc = piece.description.length > 140
    ? piece.description.slice(0, 140).replace(/\s+\S*$/, '') + '...'
    : piece.description;

  return `
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%"
  style="margin-bottom: 12px; background-color: #FFFFFF; border: 1px solid #E5E3DE; border-left: 3px solid #6B4E7C;">
  <!--[if mso]><tr><td style="padding: 18px 20px;"><![endif]-->
  <!--[if !mso]><!--><tr><td style="padding: 18px 20px; border-radius: 8px;"><!--<![endif]-->
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
        <tr>
          <td style="font-family: 'Courier New', Courier, monospace; font-size: 10px; color: #6B4E7C; letter-spacing: 0.06em; text-transform: uppercase;">
            ${escapeHtml(metaLabel)}
          </td>
          ${piece.catalog_number ? `<td align="right" style="font-family: 'Courier New', Courier, monospace; font-size: 10px; color: #6F6F6F;">${escapeHtml(piece.catalog_number)}</td>` : ''}
        </tr>
        <tr>
          <td colspan="2" style="padding-top: 6px; padding-bottom: 4px; font-family: Georgia, 'Times New Roman', Times, serif; font-size: 18px; font-weight: 400; color: #1A1A1A; line-height: 1.25;">
            <a href="${pieceUrl}" style="text-decoration: none; color: #1A1A1A;" target="_blank">${escapeHtml(piece.title)}</a>
          </td>
        </tr>
        <tr>
          <td colspan="2" style="padding-bottom: ${desc ? '10px' : '0'}; font-family: Arial, Helvetica, sans-serif; font-size: 13px; color: #6F6F6F;">
            ${escapeHtml(piece.composer_name)}
          </td>
        </tr>
        ${desc ? `
        <tr>
          <td colspan="2" style="font-family: Arial, Helvetica, sans-serif; font-size: 13px; color: #1A1A1A; line-height: 1.55;">
            ${escapeHtml(desc)}
          </td>
        </tr>` : ''}
      </table>
    </td>
  </tr>
</table>`.trim();
}

// ── Trend chart renderer (registered users only) ──────────────────────────

function renderTrendChart(data: WeeklySnapshot[]): string {
  if (data.length === 0) return '';

  const max = Math.max(...data.map(d => d.registeredUsers), 1);
  const color = '#6B4E7C';
  const barWidth = Math.max(Math.floor(480 / data.length) - 1, 4);
  const maxHeight = 40;

  const bars = data.map((d, i) => {
    const h = Math.max(Math.round((d.registeredUsers / max) * maxHeight), 1);
    const isLast = i === data.length - 1;
    return `<td valign="bottom" style="padding: 0 ${barWidth > 6 ? '1' : '0'}px;">` +
      `<div style="width: ${barWidth}px; height: ${h}px; background-color: ${color};` +
      `${isLast ? ' opacity: 1;' : ' opacity: 0.6;'}"></div></td>`;
  }).join('');

  const labelCells = data.map((d, i) => {
    if (i === 0 || i === Math.floor(data.length / 4) || i === Math.floor(data.length / 2) || i === Math.floor(3 * data.length / 4) || i === data.length - 1) {
      return `<td style="font-family: 'Courier New', Courier, monospace; font-size: 9px; color: #A8A29E; text-align: center; padding-top: 4px;">${escapeHtml(d.weekLabel)}</td>`;
    }
    return `<td></td>`;
  }).join('');

  const latest = data[data.length - 1].registeredUsers;

  return `
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-top: 16px; margin-bottom: 8px;">
  <tr>
    <td style="font-family: Arial, Helvetica, sans-serif; font-size: 11px; font-weight: 500; color: #6F6F6F; padding-bottom: 6px;">
      <span style="display: inline-block; width: 8px; height: 8px; background-color: ${color}; border-radius: 2px; margin-right: 6px; vertical-align: middle;"></span>
      Registered Users
      <span style="font-family: 'Courier New', Courier, monospace; font-size: 12px; font-weight: 400; color: ${color}; margin-left: 8px;">${latest}</span>
    </td>
  </tr>
  <tr>
    <td>
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="border-bottom: 1px solid #E5E3DE;">
        <tr>${bars}</tr>
      </table>
    </td>
  </tr>
  <tr>
    <td>
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
        <tr>${labelCells}</tr>
      </table>
    </td>
  </tr>
</table>`.trim();
}

// ── Trend data fetcher (registered users only) ────────────────────────────

async function fetchTrendData(
  supabase: SupabaseClient<Database>,
  weeksBack: number = 52,
): Promise<WeeklySnapshot[]> {
  const now = new Date();
  const snapshots: WeeklySnapshot[] = [];

  for (let w = weeksBack - 1; w >= 0; w--) {
    const weekEnd = new Date(now.getTime() - w * 7 * 24 * 60 * 60 * 1000);
    const isoEnd = weekEnd.toISOString();
    const label = weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    const { count: registered } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .lte('created_at', isoEnd);

    snapshots.push({
      weekLabel: label,
      registeredUsers: registered ?? 0,
    });
  }

  return snapshots;
}

// ── HTML escape ────────────────────────────────────────────────────────────

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ── Week range formatter ───────────────────────────────────────────────────

function formatWeekRange(from: Date, to: Date): string {
  const opts: Intl.DateTimeFormatOptions = { month: 'long', day: 'numeric' };
  const fromStr = from.toLocaleDateString('en-US', opts);
  const toStr = to.toLocaleDateString('en-US', { ...opts, year: 'numeric' });
  return `${fromStr} – ${toStr}`;
}

// ── Data fetch ─────────────────────────────────────────────────────────────

async function fetchDigestData(
  supabase: SupabaseClient<Database>,
  weekStart: Date,
  weekEnd: Date,
  unsubscribeUrl: string,
): Promise<DigestData> {
  const isoStart = weekStart.toISOString();
  const isoEnd = weekEnd.toISOString();

  const { data: newPieces } = await supabase
    .from('pieces')
    .select('id, title, composer_name, catalog_number, instruments, era, description')
    .gte('created_at' as never, isoStart)
    .lte('created_at' as never, isoEnd)
    .order('created_at' as never, { ascending: false })
    .limit(5);

  const { count: totalPieces } = await supabase
    .from('pieces')
    .select('*', { count: 'exact', head: true });

  const { count: totalMembers } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true });

  const trendData = await fetchTrendData(supabase, 52);

  return {
    weekRange: formatWeekRange(weekStart, weekEnd),
    recipientName: '',
    digestSummary: '',
    pieces: (newPieces ?? []) as DigestPiece[],
    totalPieces: totalPieces ?? 0,
    totalMembers: totalMembers ?? 0,
    unsubscribeUrl,
    trendData,
  };
}

// ── Digest summary generator ──────────────────────────────────────────────

function generateDigestSummary(data: DigestData): string {
  const parts: string[] = [];

  if (data.pieces.length > 0) {
    const composers = [...new Set(data.pieces.map(p => p.composer_name.split(' ').pop()))];
    const instruments = [...new Set(data.pieces.flatMap(p => p.instruments))];
    parts.push(`This week we added ${data.pieces.length} new piece${data.pieces.length !== 1 ? 's' : ''} to the catalog, including works by ${composers.slice(0, 3).join(', ')}${composers.length > 3 ? ' and others' : ''} spanning ${instruments.slice(0, 3).join(', ').toLowerCase()}.`);
  } else {
    parts.push('A quieter week on the catalog front.');
  }

  parts.push(`The platform now holds ${data.totalPieces} pieces across ${data.totalMembers} members.`);

  return parts.join(' ');
}

// ── Template injection ─────────────────────────────────────────────────────

function injectData(template: string, data: DigestData): string {
  const piecesHtml = data.pieces.length > 0
    ? data.pieces.map(renderPieceCard).join('\n')
    : `<p style="font-family: Arial, Helvetica, sans-serif; font-size: 13px; color: #6F6F6F; font-style: italic; margin: 16px 0;">No new pieces were added this week.</p>`;

  return template
    .replace('{{recipient_name}}', escapeHtml(data.recipientName))
    .replace('{{digest_summary}}', escapeHtml(data.digestSummary))
    .replace('{{week_range}}', escapeHtml(data.weekRange))
    .replace('{{new_pieces_count}}', String(data.pieces.length))
    .replace('{{pieces_html}}', piecesHtml)
    .replace('{{total_pieces}}', String(data.totalPieces))
    .replace('{{total_members}}', String(data.totalMembers))
    .replace('{{unsubscribe_url}}', data.unsubscribeUrl)
    .replace('{{trend_chart}}', renderTrendChart(data.trendData));
}

// ── Public API ─────────────────────────────────────────────────────────────

export interface RenderOptions {
  weekStart?: Date;
  weekEnd?: Date;
  recipientName: string;
  digestSummary?: string;
  unsubscribeUrl?: string;
}

export async function renderWeeklyDigest(
  supabase: SupabaseClient<Database>,
  options: RenderOptions,
): Promise<string> {
  const now = new Date();
  const weekEnd = options.weekEnd ?? now;
  const weekStart = options.weekStart ?? new Date(weekEnd.getTime() - 7 * 24 * 60 * 60 * 1000);
  const unsubscribeUrl = options.unsubscribeUrl ?? 'https://irregularpearl.org/settings#email';

  const template = loadTemplate();
  const data = await fetchDigestData(supabase, weekStart, weekEnd, unsubscribeUrl);
  data.recipientName = options.recipientName;
  data.digestSummary = options.digestSummary || generateDigestSummary(data);
  return injectData(template, data);
}

export function renderWeeklyDigestPreview(recipientName = 'Joseph'): string {
  const template = loadTemplate();

  const pieces: DigestPiece[] = [
    {
      id: 'beethoven-piano-sonata-op109',
      title: 'Piano Sonata No. 30 in E major',
      composer_name: 'Ludwig van Beethoven',
      catalog_number: 'Op. 109',
      instruments: ['Piano'],
      era: 'Romantic',
      description: 'One of the late sonatas — opens with a Vivace of startling immediacy, dissolving into variations of extraordinary tenderness in the finale.',
    },
    {
      id: 'bach-cello-suite-no1',
      title: 'Cello Suite No. 1 in G major',
      composer_name: 'Johann Sebastian Bach',
      catalog_number: 'BWV 1007',
      instruments: ['Cello'],
      era: 'Baroque',
      description: 'The most approachable of the six suites and among the most beloved pieces in the string repertoire. The Prelude alone is a masterclass in melodic implication.',
    },
    {
      id: 'ravel-string-quartet-f-major',
      title: 'String Quartet in F major',
      composer_name: 'Maurice Ravel',
      catalog_number: null,
      instruments: ['Violin', 'Viola', 'Cello'],
      era: 'Modern',
      description: 'A tightly constructed single-quartet work from 1903, demonstrating Ravel\'s already assured command of texture and his debt to Debussy alongside his own emerging voice.',
    },
  ];

  const trendData: WeeklySnapshot[] = [];
  const now = new Date();
  for (let w = 51; w >= 0; w--) {
    const weekDate = new Date(now.getTime() - w * 7 * 24 * 60 * 60 * 1000);
    const label = weekDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const progress = (52 - w) / 52;
    const noise = () => Math.floor(Math.random() * 3) - 1;
    trendData.push({
      weekLabel: label,
      registeredUsers: Math.floor(8 + progress * 75 + noise()),
    });
  }

  const data: DigestData = {
    weekRange: 'March 24 – March 30, 2026',
    recipientName,
    digestSummary: '',
    totalPieces: 247,
    totalMembers: 83,
    unsubscribeUrl: 'https://irregularpearl.org/settings#email',
    pieces,
    trendData,
  };

  data.digestSummary = generateDigestSummary(data);

  return injectData(template, data);
}

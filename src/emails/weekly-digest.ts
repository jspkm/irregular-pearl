/**
 * Weekly Digest Email Renderer
 *
 * Generates the admin/firstchair weekly digest email.
 * Sent every Monday at 03:00 UTC via cron or Supabase Edge Function.
 *
 * Usage:
 *   const html = await renderWeeklyDigest(supabase);
 *   // then send via Resend / Postmark / SES
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database, UserLevel } from '../lib/database.types';
import { getInitials } from '../lib/helpers';

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

interface DigestMember {
  id: string;
  display_name: string;
  instrument: string | null;
  level: UserLevel | null;
}

interface DigestData {
  weekRange: string;
  recipientName: string;
  digestSummary: string;
  pieces: DigestPiece[];
  members: DigestMember[];
  totalPieces: number;
  totalMembers: number;
  mostDiscussedTitle: string;
  mostDiscussedComposer: string;
  mostApplaudedName: string;
  mostApplaudedInstrument: string | null;
  unsubscribeUrl: string;
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

  // Truncate description to ~140 chars at word boundary
  const desc = piece.description.length > 140
    ? piece.description.slice(0, 140).replace(/\s+\S*$/, '') + '...'
    : piece.description;

  return `
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%"
  style="margin-bottom: 12px; background-color: #FFFFFF; border: 1px solid #E7E5E4; border-left: 3px solid #B45309;">
  <!--[if mso]><tr><td style="padding: 18px 20px;"><![endif]-->
  <!--[if !mso]><!--><tr><td style="padding: 18px 20px; border-radius: 8px;"><!--<![endif]-->
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
        <tr>
          <td style="font-family: 'Courier New', Courier, monospace; font-size: 10px; color: #B45309; letter-spacing: 0.06em; text-transform: uppercase;">
            ${escapeHtml(metaLabel)}
          </td>
          ${piece.catalog_number ? `<td align="right" style="font-family: 'Courier New', Courier, monospace; font-size: 10px; color: #78716C;">${escapeHtml(piece.catalog_number)}</td>` : ''}
        </tr>
        <tr>
          <td colspan="2" style="padding-top: 6px; padding-bottom: 4px; font-family: Georgia, 'Times New Roman', Times, serif; font-size: 18px; font-weight: 400; color: #1C1917; line-height: 1.25;">
            <a href="${pieceUrl}" style="text-decoration: none; color: #1C1917;" target="_blank">${escapeHtml(piece.title)}</a>
          </td>
        </tr>
        <tr>
          <td colspan="2" style="padding-bottom: ${desc ? '10px' : '0'}; font-family: Arial, Helvetica, sans-serif; font-size: 13px; color: #78716C;">
            ${escapeHtml(piece.composer_name)}
          </td>
        </tr>
        ${desc ? `
        <tr>
          <td colspan="2" style="font-family: Arial, Helvetica, sans-serif; font-size: 13px; color: #1C1917; line-height: 1.55;">
            ${escapeHtml(desc)}
          </td>
        </tr>` : ''}
      </table>
    </td>
  </tr>
</table>`.trim();
}

// ── Member row renderer ────────────────────────────────────────────────────

const LEVEL_LABELS: Record<UserLevel, string> = {
  student: 'Student',
  amateur: 'Amateur',
  professional: 'Professional',
  teacher: 'Teacher',
};

function renderMemberRow(member: DigestMember): string {
  const initials = getInitials(member.display_name);
  const meta = [
    member.instrument ?? null,
    member.level ? LEVEL_LABELS[member.level] : null,
  ].filter(Boolean).join(' · ');

  return `
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%"
  style="border-bottom: 1px solid #E7E5E4;">
  <tr>
    <td style="padding: 14px 0;">
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
        <tr>
          <td width="40" valign="middle" style="padding-right: 14px;">
            <!--[if mso]>
            <v:oval style="width:36px;height:36px;" fill="t" stroke="f">
              <v:fill color="#FEF3C7"/>
              <v:textbox inset="0,0,0,0" style="mso-fit-shape-to-text:false;"><center style="font-family:Arial,Helvetica,sans-serif;font-size:12px;font-weight:500;color:#B45309;">${escapeHtml(initials)}</center></v:textbox>
            </v:oval>
            <![endif]-->
            <!--[if !mso]><!-->
            <div style="width: 36px; height: 36px; border-radius: 50%; background-color: #FEF3C7; text-align: center; line-height: 36px; font-family: Arial, Helvetica, sans-serif; font-size: 12px; font-weight: 500; color: #B45309;">
              ${escapeHtml(initials)}
            </div>
            <!--<![endif]-->
          </td>
          <td valign="middle" style="font-family: Arial, Helvetica, sans-serif;">
            <div style="font-size: 14px; font-weight: 500; color: #1C1917; line-height: 1.3;">${escapeHtml(member.display_name)}</div>
            ${meta ? `<div style="font-size: 12px; color: #78716C;">${escapeHtml(meta)}</div>` : ''}
          </td>
          <td align="right" valign="middle">
            <a href="https://irregularpearl.org/community"
               style="display: inline-block; font-family: Arial, Helvetica, sans-serif; font-size: 11px; color: #B45309; text-decoration: none; border: 1px solid #B45309; border-radius: 9999px; padding: 4px 12px;"
               target="_blank">View profile</a>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>`.trim();
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

  // Fetch new pieces added this week (limit 5 for email)
  const { data: newPieces } = await supabase
    .from('pieces')
    .select('id, title, composer_name, catalog_number, instruments, era, description')
    .gte('created_at' as never, isoStart)
    .lte('created_at' as never, isoEnd)
    .order('created_at' as never, { ascending: false })
    .limit(5);

  // Fetch new members this week
  const { data: newMembers } = await supabase
    .from('users')
    .select('id, display_name, instrument, level')
    .gte('created_at', isoStart)
    .lte('created_at', isoEnd)
    .order('created_at', { ascending: false })
    .limit(20);

  // Count totals
  const { count: totalPieces } = await supabase
    .from('pieces')
    .select('*', { count: 'exact', head: true });

  const { count: totalMembers } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true });

  // Most discussed piece this week (by discussion count)
  const { data: topDiscussionRows } = await supabase
    .from('discussions')
    .select('piece_id, pieces(title, composer_name)')
    .gte('created_at', isoStart)
    .lte('created_at', isoEnd)
    .limit(200);

  let mostDiscussedTitle = 'No discussions this week';
  let mostDiscussedComposer = '';
  if (topDiscussionRows && topDiscussionRows.length > 0) {
    const counts: Record<string, { count: number; title: string; composer: string }> = {};
    for (const row of topDiscussionRows) {
      const pid = row.piece_id;
      const piece = row.pieces as { title: string; composer_name: string } | null;
      if (!counts[pid]) counts[pid] = { count: 0, title: piece?.title ?? pid, composer: piece?.composer_name ?? '' };
      counts[pid].count++;
    }
    const top = Object.values(counts).sort((a, b) => b.count - a.count)[0];
    mostDiscussedTitle = top.title;
    mostDiscussedComposer = top.composer;
  }

  // Most applauded artist this week (by new applause received)
  const { data: topApplauseRows } = await supabase
    .from('applause' as never)
    .select('artist_id, users!applause_artist_id_fkey(display_name, instrument)')
    .gte('created_at', isoStart)
    .lte('created_at', isoEnd)
    .limit(200);

  let mostApplaudedName = 'No applause yet';
  let mostApplaudedInstrument: string | null = null;
  if (topApplauseRows && (topApplauseRows as unknown[]).length > 0) {
    const rows = topApplauseRows as Array<{
      artist_id: string;
      users: { display_name: string; instrument: string | null } | null;
    }>;
    const counts: Record<string, { count: number; name: string; instrument: string | null }> = {};
    for (const row of rows) {
      const aid = row.artist_id;
      if (!counts[aid]) counts[aid] = { count: 0, name: row.users?.display_name ?? aid, instrument: row.users?.instrument ?? null };
      counts[aid].count++;
    }
    const top = Object.values(counts).sort((a, b) => b.count - a.count)[0];
    mostApplaudedName = top.name;
    mostApplaudedInstrument = top.instrument;
  }

  return {
    weekRange: formatWeekRange(weekStart, weekEnd),
    recipientName: '',
    digestSummary: '',
    pieces: (newPieces ?? []) as DigestPiece[],
    members: (newMembers ?? []) as DigestMember[],
    totalPieces: totalPieces ?? 0,
    totalMembers: totalMembers ?? 0,
    mostDiscussedTitle,
    mostDiscussedComposer,
    mostApplaudedName,
    mostApplaudedInstrument,
    unsubscribeUrl,
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
    parts.push('A quieter week on the catalog front, but the community has been active.');
  }

  if (data.members.length > 0) {
    parts.push(`${data.members.length} new musician${data.members.length !== 1 ? 's' : ''} joined the community.`);
  }

  if (data.mostDiscussedTitle !== 'No discussions this week') {
    parts.push(`The most discussed piece was ${data.mostDiscussedTitle}.`);
  }

  parts.push(`The platform now holds ${data.totalPieces} pieces across ${data.totalMembers} members.`);

  return parts.join(' ');
}

// ── Template injection ─────────────────────────────────────────────────────

function injectData(template: string, data: DigestData): string {
  const piecesHtml = data.pieces.length > 0
    ? data.pieces.map(renderPieceCard).join('\n')
    : `<p style="font-family: 'DM Sans', Arial, Helvetica, sans-serif; font-size: 13px; color: #78716C; font-style: italic; margin: 16px 0;">No new pieces were added this week.</p>`;

  const membersHtml = data.members.length > 0
    ? data.members.map(renderMemberRow).join('\n')
    : `<p style="font-family: 'DM Sans', Arial, Helvetica, sans-serif; font-size: 13px; color: #78716C; font-style: italic; margin: 16px 0 0;">No new members joined this week.</p>`;

  const mostDiscussed = data.mostDiscussedComposer
    ? `${data.mostDiscussedTitle} — ${data.mostDiscussedComposer}`
    : data.mostDiscussedTitle;

  const mostApplauded = data.mostApplaudedInstrument
    ? `${data.mostApplaudedName} (${data.mostApplaudedInstrument})`
    : data.mostApplaudedName;

  return template
    .replace('{{recipient_name}}', escapeHtml(data.recipientName))
    .replace('{{digest_summary}}', escapeHtml(data.digestSummary))
    .replace('{{week_range}}', escapeHtml(data.weekRange))
    .replace('{{new_pieces_count}}', String(data.pieces.length))
    .replace('{{new_members_count}}', String(data.members.length))
    .replace('{{pieces_html}}', piecesHtml)
    .replace('{{members_html}}', membersHtml)
    .replace('{{total_pieces}}', String(data.totalPieces))
    .replace('{{total_members}}', String(data.totalMembers))
    .replace('{{most_discussed}}', escapeHtml(mostDiscussed))
    .replace('{{most_applauded}}', escapeHtml(mostApplauded))
    .replace('{{unsubscribe_url}}', data.unsubscribeUrl);
}

// ── Public API ─────────────────────────────────────────────────────────────

export interface RenderOptions {
  /** Override the week window. Defaults to the past 7 days ending now. */
  weekStart?: Date;
  weekEnd?: Date;
  /** Recipient's display name for the greeting. */
  recipientName: string;
  /** Custom digest summary (e.g. LLM-generated). Falls back to auto-generated if omitted. */
  digestSummary?: string;
  /** Unsubscribe link injected into the footer. */
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

/**
 * Render with static placeholder data — useful for design preview
 * and snapshot tests without a live database connection.
 */
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

  const members: DigestMember[] = [
    { id: '1', display_name: 'Margaret Kovacs', instrument: 'Violin', level: 'professional' },
    { id: '2', display_name: 'Thomas Reiner', instrument: 'Piano', level: 'student' },
    { id: '3', display_name: 'Soo-Jin Park', instrument: 'Cello', level: 'teacher' },
  ];

  const data: DigestData = {
    weekRange: 'March 24 – March 30, 2026',
    recipientName,
    digestSummary: '',
    totalPieces: 247,
    totalMembers: 83,
    mostDiscussedTitle: 'Cello Suite No. 1 in G major',
    mostDiscussedComposer: 'J.S. Bach',
    mostApplaudedName: 'Hana Novakova',
    mostApplaudedInstrument: 'Cello',
    unsubscribeUrl: 'https://irregularpearl.org/settings#email',
    pieces,
    members,
  };

  data.digestSummary = generateDigestSummary(data);

  return injectData(template, data);
}

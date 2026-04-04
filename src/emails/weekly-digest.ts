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

interface WeeklySnapshot {
  weekLabel: string; // "Mar 3"
  registeredUsers: number;
  activeUsers: number;
  interactions: number;
}

interface DigestEvent {
  id: string;
  title: string;
  venue: string | null;
  city: string | null;
  event_date: string;
  event_type: string;
}

interface DigestData {
  weekRange: string;
  recipientName: string;
  digestSummary: string;
  pieces: DigestPiece[];
  members: DigestMember[];
  upcomingEvents: DigestEvent[];
  totalPieces: number;
  totalMembers: number;
  mostDiscussedTitle: string;
  mostDiscussedComposer: string;
  mostApplaudedName: string;
  mostApplaudedInstrument: string | null;
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

// ── Trend chart renderer (email-safe HTML bar chart) ──────────────────────

const CHART_COLORS = {
  registered: '#B45309',  // amber accent
  active: '#0369A1',     // info blue
  interactions: '#15803D', // success green
};

function renderTrendChart(data: WeeklySnapshot[]): string {
  if (data.length === 0) return '';

  const maxRegistered = Math.max(...data.map(d => d.registeredUsers), 1);
  const maxActive = Math.max(...data.map(d => d.activeUsers), 1);
  const maxInteractions = Math.max(...data.map(d => d.interactions), 1);

  function sparkline(values: number[], max: number, color: string, label: string, latestValue: number): string {
    const barWidth = Math.max(Math.floor(480 / values.length) - 1, 4);
    const maxHeight = 40;
    const bars = values.map((v, i) => {
      const h = Math.max(Math.round((v / max) * maxHeight), 1);
      const isLast = i === values.length - 1;
      return `<td valign="bottom" style="padding: 0 ${barWidth > 6 ? '1' : '0'}px;">` +
        `<div style="width: ${barWidth}px; height: ${h}px; background-color: ${color};` +
        `${isLast ? ' opacity: 1;' : ' opacity: 0.6;'}` +
        `"></div></td>`;
    }).join('');

    return `
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 12px;">
  <tr>
    <td style="font-family: Arial, Helvetica, sans-serif; font-size: 11px; font-weight: 500; color: #78716C; padding-bottom: 6px;">
      <span style="display: inline-block; width: 8px; height: 8px; background-color: ${color}; border-radius: 2px; margin-right: 6px; vertical-align: middle;"></span>
      ${escapeHtml(label)}
      <span style="font-family: 'Courier New', Courier, monospace; font-size: 12px; font-weight: 400; color: ${color}; margin-left: 8px;">${latestValue}</span>
    </td>
  </tr>
  <tr>
    <td>
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="border-bottom: 1px solid #E7E5E4;">
        <tr>${bars}</tr>
      </table>
    </td>
  </tr>
</table>`.trim();
  }

  const registeredLine = sparkline(
    data.map(d => d.registeredUsers), maxRegistered, CHART_COLORS.registered,
    'Registered Users', data[data.length - 1].registeredUsers
  );
  const activeLine = sparkline(
    data.map(d => d.activeUsers), maxActive, CHART_COLORS.active,
    'Weekly Active Users', data[data.length - 1].activeUsers
  );
  const interactionsLine = sparkline(
    data.map(d => d.interactions), maxInteractions, CHART_COLORS.interactions,
    'Weekly Interactions', data[data.length - 1].interactions
  );

  // X-axis labels (every 13 weeks = quarterly)
  const labelCells = data.map((d, i) => {
    if (i === 0 || i === Math.floor(data.length / 4) || i === Math.floor(data.length / 2) || i === Math.floor(3 * data.length / 4) || i === data.length - 1) {
      return `<td style="font-family: 'Courier New', Courier, monospace; font-size: 9px; color: #A8A29E; text-align: center; padding-top: 4px;">${escapeHtml(d.weekLabel)}</td>`;
    }
    return `<td></td>`;
  }).join('');

  return `
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-top: 16px; margin-bottom: 8px;">
  <tr><td>${registeredLine}</td></tr>
  <tr><td>${activeLine}</td></tr>
  <tr><td>${interactionsLine}</td></tr>
  <tr>
    <td>
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
        <tr>${labelCells}</tr>
      </table>
    </td>
  </tr>
</table>`.trim();
}

// ── Trend data fetcher ────────────────────────────────────────────────────

async function fetchTrendData(
  supabase: SupabaseClient<Database>,
  weeksBack: number = 52,
): Promise<WeeklySnapshot[]> {
  const now = new Date();
  const snapshots: WeeklySnapshot[] = [];

  for (let w = weeksBack - 1; w >= 0; w--) {
    const weekEnd = new Date(now.getTime() - w * 7 * 24 * 60 * 60 * 1000);
    const weekStart = new Date(weekEnd.getTime() - 7 * 24 * 60 * 60 * 1000);
    const isoEnd = weekEnd.toISOString();
    const isoStart = weekStart.toISOString();

    const label = weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    // Cumulative registered users up to this week
    const { count: registered } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .lte('created_at', isoEnd);

    // Active users this week (distinct users with activity_log or discussions)
    const { data: activeActivityRows } = await supabase
      .from('activity_log')
      .select('user_id')
      .gte('created_at', isoStart)
      .lte('created_at', isoEnd);

    const { data: activeDiscussionRows } = await supabase
      .from('discussions')
      .select('user_id')
      .gte('created_at', isoStart)
      .lte('created_at', isoEnd);

    const activeSet = new Set<string>();
    for (const r of (activeActivityRows || [])) activeSet.add(r.user_id);
    for (const r of (activeDiscussionRows || [])) if (r.user_id) activeSet.add(r.user_id);

    // Interactions this week (activity_log + discussions + applause)
    const { count: activityCount } = await supabase
      .from('activity_log')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', isoStart)
      .lte('created_at', isoEnd);

    const { count: discussionCount } = await supabase
      .from('discussions')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', isoStart)
      .lte('created_at', isoEnd);

    const { count: applauseCount } = await supabase
      .from('applause' as never)
      .select('*', { count: 'exact', head: true })
      .gte('created_at', isoStart)
      .lte('created_at', isoEnd);

    snapshots.push({
      weekLabel: label,
      registeredUsers: registered ?? 0,
      activeUsers: activeSet.size,
      interactions: (activityCount ?? 0) + (discussionCount ?? 0) + (applauseCount ?? 0),
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
  recipientCity?: string,
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

  // Fetch upcoming events in the next 7 days (gated: only include if >= 1 exists)
  // If recipientCity is provided, prioritize local events first
  const nextWeekEnd = new Date(weekEnd.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const todayStr = weekEnd.toISOString().split('T')[0];

  let upcomingEvents: DigestEvent[] = [];

  // Try local events first (from user's location field or registration city)
  if (recipientCity) {
    const { data: localEvents } = await supabase
      .from('events')
      .select('id, title, venue, city, event_date, event_type')
      .eq('status', 'approved')
      .eq('city', recipientCity)
      .gte('event_date', todayStr)
      .lte('event_date', nextWeekEnd)
      .order('event_date', { ascending: true })
      .limit(5);
    upcomingEvents = (localEvents || []) as DigestEvent[];
  }

  // Fill remaining slots with any events if local < 5
  if (upcomingEvents.length < 5) {
    const existingIds = upcomingEvents.map(e => e.id);
    const remaining = 5 - upcomingEvents.length;
    const { data: moreEvents } = await supabase
      .from('events')
      .select('id, title, venue, city, event_date, event_type')
      .eq('status', 'approved')
      .gte('event_date', todayStr)
      .lte('event_date', nextWeekEnd)
      .not('id', 'in', `(${existingIds.map(id => `"${id}"`).join(',')})`)
      .order('event_date', { ascending: true })
      .limit(remaining);
    upcomingEvents = [...upcomingEvents, ...((moreEvents || []) as DigestEvent[])];
  }

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

  // Fetch 52-week trend data
  const trendData = await fetchTrendData(supabase, 52);

  return {
    weekRange: formatWeekRange(weekStart, weekEnd),
    recipientName: '',
    digestSummary: '',
    pieces: (newPieces ?? []) as DigestPiece[],
    members: (newMembers ?? []) as DigestMember[],
    upcomingEvents,
    totalPieces: totalPieces ?? 0,
    totalMembers: totalMembers ?? 0,
    mostDiscussedTitle,
    mostDiscussedComposer,
    mostApplaudedName,
    mostApplaudedInstrument,
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

// ── Event row renderer (email-safe) ───────────────────────────────────────

function renderEventRow(event: DigestEvent): string {
  const dateObj = new Date(event.event_date + 'T00:00:00');
  const dateStr = dateObj.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  const eventUrl = `https://irregularpearl.org/events/${event.id}`;

  return `
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%"
  style="border-bottom: 1px solid #E7E5E4;">
  <tr>
    <td style="padding: 12px 0;">
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
        <tr>
          <td width="80" valign="top" style="font-family: 'Courier New', Courier, monospace; font-size: 11px; color: #B45309; padding-right: 12px;">
            ${escapeHtml(dateStr)}
          </td>
          <td valign="top">
            <a href="${eventUrl}" style="font-family: Georgia, 'Times New Roman', Times, serif; font-size: 14px; color: #1C1917; text-decoration: none;" target="_blank">
              ${escapeHtml(event.title)}
            </a>
            ${event.venue ? `<div style="font-family: Arial, Helvetica, sans-serif; font-size: 12px; color: #78716C; margin-top: 2px;">${escapeHtml(event.venue)}${event.city ? `, ${escapeHtml(event.city)}` : ''}</div>` : ''}
          </td>
          <td width="70" align="right" valign="top" style="font-family: 'Courier New', Courier, monospace; font-size: 10px; color: #78716C; text-transform: capitalize;">
            ${escapeHtml(event.event_type)}
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>`.trim();
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

  // Events section: gated, only include when >= 1 approved event exists
  const eventsHtml = data.upcomingEvents.length > 0
    ? data.upcomingEvents.map(renderEventRow).join('\n')
    : '';

  // Events section wrapper (entire block hidden if no events)
  const eventsSectionHtml = data.upcomingEvents.length > 0
    ? `<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-top: 24px; margin-bottom: 8px;">
<tr><td style="font-family: Georgia, 'Times New Roman', Times, serif; font-size: 18px; color: #1C1917; padding-bottom: 12px; border-bottom: 2px solid #B45309;">This Week's Events</td></tr>
<tr><td>${eventsHtml}</td></tr>
<tr><td style="padding-top: 8px;"><a href="https://irregularpearl.org/events" style="font-family: Arial, Helvetica, sans-serif; font-size: 12px; color: #B45309; text-decoration: none;" target="_blank">View all events &rarr;</a></td></tr>
</table>`
    : '';

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
    .replace('{{unsubscribe_url}}', data.unsubscribeUrl)
    .replace('{{trend_chart}}', renderTrendChart(data.trendData))
    .replace('{{events_section}}', eventsSectionHtml);
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
  /** Recipient's city (from user.location) for location-aware event recommendations. */
  recipientCity?: string;
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
  const data = await fetchDigestData(supabase, weekStart, weekEnd, unsubscribeUrl, options.recipientCity);
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

  // Generate sample 52-week trend data with realistic growth curves
  const trendData: WeeklySnapshot[] = [];
  const now = new Date();
  for (let w = 51; w >= 0; w--) {
    const weekDate = new Date(now.getTime() - w * 7 * 24 * 60 * 60 * 1000);
    const label = weekDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const progress = (52 - w) / 52; // 0 to 1
    const noise = () => Math.floor(Math.random() * 3) - 1;
    trendData.push({
      weekLabel: label,
      registeredUsers: Math.floor(8 + progress * 75 + noise()),
      activeUsers: Math.max(1, Math.floor(2 + progress * 20 + Math.sin(w * 0.3) * 4 + noise())),
      interactions: Math.max(0, Math.floor(5 + progress * 60 + Math.sin(w * 0.5) * 10 + noise() * 3)),
    });
  }

  const sampleEvents: DigestEvent[] = [
    { id: 'sample-1', title: 'Bach Cello Suite Recital', venue: 'Weill Recital Hall', city: 'New York', event_date: '2026-04-05', event_type: 'recital' },
    { id: 'sample-2', title: 'Beethoven Piano Sonatas', venue: 'Jordan Hall', city: 'Boston', event_date: '2026-04-07', event_type: 'concert' },
  ];

  const data: DigestData = {
    weekRange: 'March 24 – March 30, 2026',
    recipientName,
    digestSummary: '',
    upcomingEvents: sampleEvents,
    totalPieces: 247,
    totalMembers: 83,
    mostDiscussedTitle: 'Cello Suite No. 1 in G major',
    mostDiscussedComposer: 'J.S. Bach',
    mostApplaudedName: 'Hana Novakova',
    mostApplaudedInstrument: 'Cello',
    unsubscribeUrl: 'https://irregularpearl.org/settings#email',
    pieces,
    members,
    trendData,
  };

  data.digestSummary = generateDigestSummary(data);

  return injectData(template, data);
}

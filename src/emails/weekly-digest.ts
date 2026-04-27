// Weekly digest email module.
// Exports fetchDigestData (for summary generation) and renderWeeklyDigest
// (accepts a live Supabase client + per-recipient opts, fetches data internally).

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  TOKENS,
  card,
  esc,
  heading,
  kicker,
  paragraph,
  primaryButton,
  renderEmailLayout,
} from "../../supabase/functions/_lib/email-template";

export interface DigestPiece {
  id: string;
  title: string;
  composer_name: string;
  catalog_number: string | null;
  instruments: string[];
  era: string | null;
  description: string;
}

export interface DigestData {
  newPieces: DigestPiece[];
  piecesCount: number;
  totalPieces: number;
  newMembersCount: number;
  totalMembers: number;
  mostViewedPiece: DigestPiece | null;
  mostApplaudedPiece: { title: string; composer_name: string; catalog_number: string | null } | null;
  weekRange: string;
  weekStart: Date;
  weekEnd: Date;
}

export async function fetchDigestData(supabase: SupabaseClient): Promise<DigestData> {
  const now = new Date();
  const weekEnd = now;
  const weekStart = new Date(now.getTime() - 7 * 86400000);
  const isoStart = weekStart.toISOString();
  const isoEnd = weekEnd.toISOString();

  const weekRange = `${weekStart.toLocaleDateString("en-US", { month: "long", day: "numeric" })} – ${weekEnd.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`;

  const [
    { data: newPieces },
    { count: totalPieces },
    { count: newMembersCount },
    { count: totalMembers },
  ] = await Promise.all([
    supabase
      .from("pieces")
      .select("id, title, composer_name, catalog_number, instruments, era, description")
      .gte("created_at", isoStart)
      .lte("created_at", isoEnd)
      .order("created_at", { ascending: false })
      .limit(5),
    supabase.from("pieces").select("*", { count: "exact", head: true }),
    supabase
      .from("users")
      .select("*", { count: "exact", head: true })
      .gte("created_at", isoStart)
      .lte("created_at", isoEnd),
    supabase.from("users").select("*", { count: "exact", head: true }),
  ]);

  // Most viewed piece this week (by piece_views count)
  let mostViewedPiece: DigestPiece | null = null;
  const { data: viewRows } = await supabase
    .from("piece_views")
    .select("piece_id")
    .gte("created_at", isoStart)
    .lte("created_at", isoEnd);

  if (viewRows && viewRows.length > 0) {
    const counts: Record<string, number> = {};
    for (const row of viewRows) {
      counts[row.piece_id] = (counts[row.piece_id] ?? 0) + 1;
    }
    const topId = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0];
    if (topId) {
      const { data } = await supabase
        .from("pieces")
        .select("id, title, composer_name, catalog_number, instruments, era, description")
        .eq("id", topId)
        .single();
      mostViewedPiece = data ?? null;
    }
  }

  // Most applauded piece overall (via vote_tallies, subject_table = 'pieces')
  let mostApplaudedPiece: { title: string; composer_name: string; catalog_number: string | null } | null = null;
  const { data: topVotes } = await supabase
    .from("vote_tallies")
    .select("subject_id, net_score")
    .eq("subject_table", "pieces")
    .order("net_score", { ascending: false })
    .limit(1);

  if (topVotes?.[0]) {
    const { data } = await supabase
      .from("pieces")
      .select("title, composer_name, catalog_number")
      .eq("id", topVotes[0].subject_id)
      .single();
    mostApplaudedPiece = data ?? null;
  }

  return {
    newPieces: (newPieces as DigestPiece[]) ?? [],
    piecesCount: (newPieces ?? []).length,
    totalPieces: totalPieces ?? 0,
    newMembersCount: newMembersCount ?? 0,
    totalMembers: totalMembers ?? 0,
    mostViewedPiece,
    mostApplaudedPiece,
    weekRange,
    weekStart,
    weekEnd,
  };
}

function renderPieceCard(p: DigestPiece): string {
  const meta = [p.instruments.slice(0, 2).join(", "), p.era].filter(Boolean).join(" · ");
  const desc =
    p.description.length > 140
      ? p.description.slice(0, 140).replace(/\s+\S*$/, "") + "..."
      : p.description;
  const url = `https://irregularpearl.org/piece/${esc(p.id)}`;

  const inner = `
    <div style="display:flex;justify-content:space-between;font-family:${TOKENS.sans};font-size:11px;color:${TOKENS.accent};letter-spacing:0.08em;font-weight:500;text-transform:uppercase;">
      <span>${esc(meta)}</span>
      ${p.catalog_number ? `<span style="color:${TOKENS.muted};">${esc(p.catalog_number)}</span>` : ""}
    </div>
    <div style="padding-top:6px;">${heading(p.title, { level: "h3", href: url })}</div>
    <div style="padding-top:4px;">${paragraph(p.composer_name, { muted: true })}</div>
    ${desc ? `<div style="padding-top:10px;">${paragraph(desc, { family: "serif" })}</div>` : ""}
  `;

  return card({ html: inner, accent: true });
}

function renderStatBlock(totalPieces: number, piecesCount: number): string {
  return `<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom:20px;">
<tr>
  <td width="50%" align="center" style="padding:14px 0;border:1px solid ${TOKENS.border};border-radius:8px 0 0 8px;border-right:0;">
    <div style="font-family:${TOKENS.serif};font-size:26px;color:${TOKENS.ink};">${totalPieces}</div>
    <div style="font-family:${TOKENS.sans};font-size:10px;color:${TOKENS.muted};text-transform:uppercase;letter-spacing:0.08em;padding-top:2px;">Pieces</div>
  </td>
  <td width="50%" align="center" style="padding:14px 0;border:1px solid ${TOKENS.border};border-radius:0 8px 8px 0;">
    <div style="font-family:${TOKENS.serif};font-size:26px;color:${TOKENS.ink};">${piecesCount}</div>
    <div style="font-family:${TOKENS.sans};font-size:10px;color:${TOKENS.muted};text-transform:uppercase;letter-spacing:0.08em;padding-top:2px;">New this week</div>
  </td>
</tr>
</table>`;
}

export async function renderWeeklyDigest(
  supabase: SupabaseClient,
  opts: {
    recipientName: string;
    digestSummary: string;
    unsubscribeUrl?: string;
  }
): Promise<string> {
  const data = await fetchDigestData(supabase);
  const piecesHtml = data.newPieces.map(renderPieceCard).join("\n");
  const unsubUrl =
    opts.unsubscribeUrl ?? "https://irregularpearl.org/settings#email";

  const bodyHtml = `
  <div style="padding-bottom:12px;">${paragraph(`Dear ${esc(opts.recipientName)},`)}</div>
  <div style="padding-bottom:20px;">${paragraph(opts.digestSummary, { muted: true })}</div>
  ${renderStatBlock(data.totalPieces, data.piecesCount)}
  ${
    piecesHtml
      ? `<div style="padding-bottom:12px;">${kicker("New this week")}</div>${piecesHtml}`
      : ""
  }
  <div align="center" style="padding:24px 0 8px;">
    ${primaryButton({ text: "Explore Irregular Pearl", href: "https://irregularpearl.org" })}
  </div>
  `;

  return renderEmailLayout({
    title: `Irregular Pearl — Weekly Digest · ${data.weekRange}`,
    preheader: opts.digestSummary,
    subtitle: "Weekly Digest",
    bodyHtml,
    footerNote: "You’re receiving this because you opted in to the weekly digest.",
    footerLink: { text: "Manage email preferences", href: unsubUrl },
  });
}

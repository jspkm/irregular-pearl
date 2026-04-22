// Contributor approval queue. Lists drafts across all signed content types
// that are awaiting the logged-in contributor's review. For each draft:
//
//   • subject-type kicker ("Performer's note" / "Interpretive school" / "Piece description")
//   • piece title + link, drafter meta, school name if applicable
//   • current proposed body in the signed-notes pattern (serif, 2px purple left border)
//   • action row: Approve, Edit and approve (inline textarea), Reject
//     (inline confirmation with optional freeform reason — no native dialog)
//
// The source of truth for "what is pending" is the `notifications` table:
// one un-cleared notification per (subject, type) pair. This is what the
// bell + email digest also read, so all three surfaces stay consistent.
// Subject-specific details (body, piece, drafter) are batch-fetched per
// subject_table in parallel to keep round trips at O(subject_tables).

import { useEffect, useState, useCallback } from 'react';
import { supabase, hasSupabase } from '../lib/supabase';
import type { Session } from '@supabase/supabase-js';
import {
  SUBJECT_CONFIG,
  isSubjectTable,
  rpcSubjectIdParam,
  type SubjectTable,
} from '../lib/contributorSubjects';

type Status = 'loading' | 'unauthed' | 'ready';

interface PendingDraft {
  kind: 'draft';
  subjectTable: SubjectTable;
  subjectId: string;
  pieceId: string;
  pieceTitle: string;
  composerName: string;
  catalogNumber: string | null;
  drafterName: string | null;
  body: string;
  versionNumber: number;
  pendingVersionId: string;
  createdAt: string;
  /** Schools only; null for other subject types. */
  schoolName: string | null;
}

interface ContributionRequestMessage {
  kind: 'message';
  notificationId: string;
  requestId: string;
  pieceId: string;
  pieceTitle: string;
  composerName: string;
  catalogNumber: string | null;
  senderName: string;
  note: string | null;
  createdAt: string;
}

type Item = PendingDraft | ContributionRequestMessage;

interface ContributorProfile {
  displayName: string;
  bioShort: string | null;
}

type ItemAction = null | 'approve' | 'approve-and-edit' | 'reject';

function itemKey(d: Pick<PendingDraft, 'subjectTable' | 'subjectId'>): string {
  return `${d.subjectTable}:${d.subjectId}`;
}

export default function NotificationsQueue() {
  const [status, setStatus] = useState<Status>('loading');
  const [profile, setProfile] = useState<ContributorProfile | null>(null);
  const [drafts, setDrafts] = useState<PendingDraft[]>([]);
  const [messages, setMessages] = useState<ContributionRequestMessage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [actionByKey, setActionByKey] = useState<Record<string, ItemAction>>({});
  const [busyByKey, setBusyByKey] = useState<Record<string, boolean>>({});

  const loadQueue = useCallback(async (session: Session) => {
    setError(null);

    // Profile: any signed-in user can reach Messages. Contributor fields
    // decide whether we also load draft_awaiting_approval items below.
    const { data: profileRow, error: profileErr } = await supabase
      .from('users')
      .select('is_contributor, contributor_active, display_name, contributor_bio_short')
      .eq('id', session.user.id)
      .single();
    if (profileErr) {
      setError(profileErr.message);
      return;
    }
    const isContributor = Boolean(
      profileRow?.is_contributor && profileRow?.contributor_active,
    );
    setProfile({
      displayName: profileRow?.display_name ?? '',
      bioShort: profileRow?.contributor_bio_short ?? null,
    });

    // One query for un-cleared notifications. Subject-specific data is
    // batch-fetched per table below.
    const { data: notifs, error: notifErr } = await supabase
      .from('notifications')
      .select('id, subject_table, subject_id, created_at')
      .is('cleared_at', null)
      .order('created_at', { ascending: false });
    if (notifErr) {
      setError(notifErr.message);
      return;
    }
    if (!notifs || notifs.length === 0) {
      setDrafts([]);
      setMessages([]);
      setStatus('ready');
      return;
    }

    // Group subject ids by table so we can issue one query per table.
    // Drafts are loaded only for contributors; contribution_requests are
    // loaded for everyone.
    const idsByTable = new Map<SubjectTable, string[]>();
    const contribRequestIds: string[] = [];
    for (const n of notifs) {
      if (n.subject_table === 'contribution_requests') {
        contribRequestIds.push(n.subject_id);
        continue;
      }
      if (!isContributor) continue; // non-contributors never see drafts
      if (!isSubjectTable(n.subject_table)) continue;
      const arr = idsByTable.get(n.subject_table) ?? [];
      arr.push(n.subject_id);
      idsByTable.set(n.subject_table, arr);
    }

    // Fetch subjects, pending versions, and drafters per table in parallel.
    const perTableFetches = await Promise.all(
      [...idsByTable.entries()].map(async ([table, ids]) => {
        const cfg = SUBJECT_CONFIG[table];
        const subjectFields = cfg.hasName
          ? 'id, piece_id, drafted_by, name'
          : 'id, piece_id, drafted_by';
        const [subjectsRes, versionsRes] = await Promise.all([
          supabase.from(cfg.table).select(subjectFields).in('id', ids),
          supabase
            .from(cfg.versionsTable)
            .select(`id, ${cfg.versionForeignKey}, body, version_number`)
            .in(cfg.versionForeignKey, ids)
            .is('approved_at', null)
            .order('version_number', { ascending: false }),
        ]);
        return { table, cfg, subjectsRes, versionsRes };
      }),
    );

    // Collect piece ids + drafter ids across all subject tables for one
    // follow-up batch each.
    const pieceIdSet = new Set<string>();
    const drafterIdSet = new Set<string>();
    type SubjectRow = { id: string; piece_id: string; drafted_by: string | null; name?: string };
    const subjectByKey = new Map<string, { table: SubjectTable; row: SubjectRow }>();
    type VersionRow = { id: string; body: string; version_number: number } & Record<string, string>;
    const latestVersionByKey = new Map<string, VersionRow>();

    for (const { table, cfg, subjectsRes, versionsRes } of perTableFetches) {
      if (subjectsRes.error) {
        setError(subjectsRes.error.message);
        return;
      }
      if (versionsRes.error) {
        setError(versionsRes.error.message);
        return;
      }
      for (const row of (subjectsRes.data ?? []) as SubjectRow[]) {
        pieceIdSet.add(row.piece_id);
        if (row.drafted_by) drafterIdSet.add(row.drafted_by);
        subjectByKey.set(`${table}:${row.id}`, { table, row });
      }
      for (const v of (versionsRes.data ?? []) as VersionRow[]) {
        const subjectId = v[cfg.versionForeignKey];
        const key = `${table}:${subjectId}`;
        if (!latestVersionByKey.has(key)) {
          latestVersionByKey.set(key, v);
        }
      }
    }

    const [piecesRes, draftersRes] = await Promise.all([
      pieceIdSet.size
        ? supabase
            .from('pieces')
            .select('id, title, composer_name, catalog_number')
            .in('id', [...pieceIdSet])
        : Promise.resolve({ data: [], error: null }),
      drafterIdSet.size
        ? supabase.from('users').select('id, display_name').in('id', [...drafterIdSet])
        : Promise.resolve({ data: [], error: null }),
    ]);
    if (piecesRes.error) {
      setError(piecesRes.error.message);
      return;
    }
    if (draftersRes.error) {
      setError(draftersRes.error.message);
      return;
    }

    const pieceById = new Map(
      (piecesRes.data ?? []).map((p: { id: string; title: string; composer_name: string; catalog_number: string | null }) => [p.id, p]),
    );
    const drafterById = new Map(
      (draftersRes.data ?? []).map((u: { id: string; display_name: string }) => [u.id, u.display_name]),
    );

    const rows: PendingDraft[] = [];
    for (const n of notifs) {
      if (n.subject_table === 'contribution_requests') continue;
      if (!isSubjectTable(n.subject_table)) continue;
      const key = `${n.subject_table}:${n.subject_id}`;
      const subject = subjectByKey.get(key);
      const version = latestVersionByKey.get(key);
      if (!subject || !version) continue;
      const piece = pieceById.get(subject.row.piece_id);
      if (!piece) continue;
      rows.push({
        kind: 'draft',
        subjectTable: n.subject_table,
        subjectId: n.subject_id,
        pieceId: subject.row.piece_id,
        pieceTitle: piece.title,
        composerName: piece.composer_name,
        catalogNumber: piece.catalog_number ?? null,
        drafterName: subject.row.drafted_by ? drafterById.get(subject.row.drafted_by) ?? null : null,
        body: version.body,
        versionNumber: version.version_number,
        pendingVersionId: version.id,
        createdAt: n.created_at,
        schoolName: subject.row.name ?? null,
      });
    }

    // Load contribution_request messages (everyone — not gated to contributors).
    let msgs: ContributionRequestMessage[] = [];
    if (contribRequestIds.length > 0) {
      const { data: crRows, error: crErr } = await supabase
        .from('contribution_requests')
        .select('id, piece_id, sender_id, note, created_at')
        .in('id', contribRequestIds);
      if (crErr) {
        setError(crErr.message);
        return;
      }
      const crList = (crRows ?? []) as {
        id: string;
        piece_id: string;
        sender_id: string;
        note: string | null;
        created_at: string;
      }[];

      // Batch-fetch sender display names and pieces referenced by the requests.
      const senderIds = [...new Set(crList.map((r) => r.sender_id))];
      const pieceIdsForMsgs = [...new Set(crList.map((r) => r.piece_id))];
      const [sendersRes, piecesForMsgsRes] = await Promise.all([
        senderIds.length
          ? supabase.from('users').select('id, display_name').in('id', senderIds)
          : Promise.resolve({ data: [], error: null }),
        pieceIdsForMsgs.length
          ? supabase
              .from('pieces')
              .select('id, title, composer_name, catalog_number')
              .in('id', pieceIdsForMsgs)
          : Promise.resolve({ data: [], error: null }),
      ]);
      const senderById = new Map(
        ((sendersRes.data ?? []) as { id: string; display_name: string }[]).map((u) => [
          u.id,
          u.display_name,
        ]),
      );
      const pieceForMsgsById = new Map(
        (
          (piecesForMsgsRes.data ?? []) as {
            id: string;
            title: string;
            composer_name: string;
            catalog_number: string | null;
          }[]
        ).map((p) => [p.id, p]),
      );
      const crById = new Map(crList.map((r) => [r.id, r]));

      msgs = notifs
        .filter((n) => n.subject_table === 'contribution_requests')
        .flatMap((n) => {
          const cr = crById.get(n.subject_id);
          if (!cr) return [];
          const piece = pieceForMsgsById.get(cr.piece_id);
          if (!piece) return [];
          return [
            {
              kind: 'message' as const,
              notificationId: n.id,
              requestId: cr.id,
              pieceId: cr.piece_id,
              pieceTitle: piece.title,
              composerName: piece.composer_name,
              catalogNumber: piece.catalog_number ?? null,
              senderName: senderById.get(cr.sender_id) ?? 'Someone',
              note: cr.note,
              createdAt: cr.created_at,
            },
          ];
        });
    }

    setDrafts(rows);
    setMessages(msgs);
    setStatus('ready');
  }, []);

  useEffect(() => {
    if (!hasSupabase) { setStatus('unauthed'); return; }
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { setStatus('unauthed'); return; }
      void loadQueue(session);
    });
  }, [loadQueue]);

  async function refresh() {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) await loadQueue(session);
  }

  function notifyChanged() {
    if (typeof window !== 'undefined') window.dispatchEvent(new Event('notifications:changed'));
  }

  async function callRpc(
    d: PendingDraft,
    rpcName: string,
    extra: Record<string, unknown> = {},
  ): Promise<{ error: string | null }> {
    const args: Record<string, unknown> = { [rpcSubjectIdParam(d.subjectTable)]: d.subjectId, ...extra };
    const { error: rpcErr } = await supabase.rpc(rpcName, args);
    return { error: rpcErr?.message ?? null };
  }

  async function handleApprove(d: PendingDraft) {
    const key = itemKey(d);
    setBusyByKey((b) => ({ ...b, [key]: true }));
    setError(null);
    const { error: msg } = await callRpc(d, SUBJECT_CONFIG[d.subjectTable].rpcs.approve);
    setBusyByKey((b) => ({ ...b, [key]: false }));
    if (msg) { setError(msg); return; }
    setDrafts((rows) => rows.filter((r) => itemKey(r) !== key));
    setActionByKey((a) => ({ ...a, [key]: null }));
    notifyChanged();
  }

  async function handleApproveAndEdit(d: PendingDraft, body: string) {
    const key = itemKey(d);
    setBusyByKey((b) => ({ ...b, [key]: true }));
    setError(null);
    const { error: msg } = await callRpc(d, SUBJECT_CONFIG[d.subjectTable].rpcs.approveAndEdit, {
      p_body: body,
    });
    setBusyByKey((b) => ({ ...b, [key]: false }));
    if (msg) { setError(msg); return; }
    setDrafts((rows) => rows.filter((r) => itemKey(r) !== key));
    setActionByKey((a) => ({ ...a, [key]: null }));
    notifyChanged();
  }

  async function handleReject(d: PendingDraft, reason: string) {
    const key = itemKey(d);
    setBusyByKey((b) => ({ ...b, [key]: true }));
    setError(null);
    const { error: msg } = await callRpc(d, SUBJECT_CONFIG[d.subjectTable].rpcs.reject, {
      p_reason: reason || null,
    });
    setBusyByKey((b) => ({ ...b, [key]: false }));
    if (msg) { setError(msg); return; }
    setDrafts((rows) => rows.filter((r) => itemKey(r) !== key));
    setActionByKey((a) => ({ ...a, [key]: null }));
    notifyChanged();
  }

  if (status === 'loading') {
    return <div className="text-sm text-muted font-body">Loading…</div>;
  }
  if (status === 'unauthed') {
    return (
      <div className="font-body">
        <h1 className="text-2xl font-display text-ink mb-3">Messages</h1>
        <p className="text-sm text-muted">You need to be signed in to see your messages.</p>
      </div>
    );
  }

  // Merge drafts and messages into a single reverse-chron list.
  const items: Item[] = [...drafts, ...messages].sort(
    (a, b) => (a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0),
  );
  const hasDrafts = drafts.length > 0;

  return (
    <div className="font-body">
      <h1 className="text-[28px] font-display text-ink mb-1 tracking-tight">Messages</h1>
      <p className="text-sm text-muted mb-8">
        {hasDrafts
          ? 'Requests from colleagues and drafts waiting for your review.'
          : 'Requests from colleagues. When someone asks you to contribute to a piece, it appears here.'}
      </p>

      {error && (
        <div className="mb-6 rounded-lg border-[0.5px] border-[#A32D2D] bg-[#F7E4E4] px-4 py-3 text-sm text-[#A32D2D]">
          {error}
        </div>
      )}

      {items.length === 0 ? (
        <div className="rounded-xl border-[0.5px] border-border bg-surface px-5 py-8 text-center">
          <p className="text-sm text-muted">
            Nothing waiting. When someone asks you to contribute to a piece, it will appear here.
          </p>
        </div>
      ) : (
        <ul className="space-y-4">
          {items.map((item) => {
            if (item.kind === 'message') {
              return <MessageCard key={`msg:${item.notificationId}`} m={item} />;
            }
            const d = item;
            const key = itemKey(d);
            const cfg = SUBJECT_CONFIG[d.subjectTable];
            const currentAction = actionByKey[key] ?? null;
            const busy = busyByKey[key] ?? false;
            return (
              <li
                key={key}
                className="rounded-xl border-[0.5px] border-border bg-surface p-5"
              >
                <div
                  className="text-[11px] font-medium tracking-[0.08em] uppercase mb-4"
                  style={{ color: 'var(--color-accent)' }}
                >
                  {cfg.label} &middot; {cfg.pageContext}
                </div>

                <div className="pb-4 mb-5 border-b-[0.5px] border-border">
                  <div className="flex items-baseline flex-wrap gap-x-3 gap-y-1">
                    <a
                      href={`/piece/${d.pieceId}`}
                      className="font-display text-[22px] text-ink leading-tight tracking-tight no-underline hover:underline"
                    >
                      {d.pieceTitle}
                    </a>
                    {d.catalogNumber && (
                      <span className="text-[11px] font-mono text-tertiary tracking-wide">
                        {d.catalogNumber}
                      </span>
                    )}
                  </div>
                  <div className="mt-1 text-sm text-muted">
                    by <span className="text-ink">{d.composerName}</span>
                  </div>
                  {d.schoolName && (
                    <div className="mt-2 text-[11px] font-medium tracking-[0.08em] uppercase text-ink">
                      {d.schoolName}
                    </div>
                  )}
                </div>

                <div
                  className="pl-[18px] border-l-2 mb-2 font-display text-[16px] text-ink leading-[1.68] whitespace-pre-wrap"
                  style={{ borderLeftColor: 'var(--color-accent)' }}
                >
                  {d.body}
                </div>
                {profile && (
                  <div className="pl-[18px] mb-1 font-body">
                    <div className="text-sm text-ink font-medium">{profile.displayName}</div>
                    {profile.bioShort && (
                      <div className="text-xs text-muted">{profile.bioShort}</div>
                    )}
                  </div>
                )}

                <div className="text-[11px] text-tertiary mt-4 mb-4">
                  {d.drafterName ? `drafted by ${d.drafterName}` : 'drafted on your behalf'} &middot; v{d.versionNumber}
                </div>

                {currentAction === null && (
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => handleApprove(d)}
                      disabled={busy}
                      className="inline-flex items-center px-4 py-2 bg-ink text-white text-sm font-medium rounded-lg hover:bg-[#292524] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {busy ? 'Approving…' : 'Approve'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setActionByKey((a) => ({ ...a, [key]: 'approve-and-edit' }))}
                      disabled={busy}
                      className="inline-flex items-center px-4 py-2 bg-transparent text-ink text-sm font-medium border-[0.5px] border-border-strong rounded-lg hover:bg-[#F8F7F4] disabled:opacity-50 transition-colors"
                    >
                      Edit and approve
                    </button>
                    <button
                      type="button"
                      onClick={() => setActionByKey((a) => ({ ...a, [key]: 'reject' }))}
                      disabled={busy}
                      className="inline-flex items-center px-4 py-2 bg-transparent text-ink text-sm font-medium border-[0.5px] border-border-strong rounded-lg hover:bg-[#F8F7F4] disabled:opacity-50 transition-colors"
                    >
                      Reject
                    </button>
                  </div>
                )}

                {currentAction === 'approve-and-edit' && (
                  <EditForm
                    initialBody={d.body}
                    submitting={busy}
                    onCancel={() => setActionByKey((a) => ({ ...a, [key]: null }))}
                    onSubmit={(newBody) => handleApproveAndEdit(d, newBody)}
                  />
                )}

                {currentAction === 'reject' && (
                  <RejectForm
                    submitting={busy}
                    onCancel={() => setActionByKey((a) => ({ ...a, [key]: null }))}
                    onSubmit={(reason) => handleReject(d, reason)}
                  />
                )}
              </li>
            );
          })}
        </ul>
      )}

      <div className="mt-10">
        <button
          type="button"
          onClick={refresh}
          className="inline-flex items-center bg-transparent border-[0.5px] border-border-strong text-muted font-body text-[11px] px-2.5 py-1 rounded-md cursor-pointer transition-colors hover:text-ink hover:border-ink"
        >
          Refresh
        </button>
      </div>
    </div>
  );
}

function EditForm(props: {
  initialBody: string;
  submitting: boolean;
  onSubmit: (body: string) => void;
  onCancel: () => void;
}) {
  const [value, setValue] = useState(props.initialBody);
  return (
    <div>
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        rows={6}
        className="w-full px-3 py-2 text-[15px] font-display leading-[1.68] text-ink border-[0.5px] border-border-strong rounded-lg focus:outline-none focus:ring-1 focus:ring-accent resize-y"
      />
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={() => props.onSubmit(value)}
          disabled={props.submitting || value.trim() === ''}
          className="inline-flex items-center px-4 py-2 bg-ink text-white text-sm font-medium rounded-lg hover:bg-[#292524] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {props.submitting ? 'Approving…' : 'Approve'}
        </button>
        <button
          type="button"
          onClick={props.onCancel}
          disabled={props.submitting}
          className="inline-flex items-center px-4 py-2 bg-transparent text-ink text-sm font-medium border-[0.5px] border-border-strong rounded-lg hover:bg-[#F8F7F4] disabled:opacity-50 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function RejectForm(props: {
  submitting: boolean;
  onSubmit: (reason: string) => void;
  onCancel: () => void;
}) {
  const [reason, setReason] = useState('');
  return (
    <div>
      <label className="block text-xs text-muted mb-2 uppercase tracking-wider font-medium">
        Reason (optional, visible to staff)
      </label>
      <textarea
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        rows={3}
        placeholder="e.g. The second sentence reads as too prescriptive."
        className="w-full px-3 py-2 text-sm font-body text-ink border-[0.5px] border-border-strong rounded-lg focus:outline-none focus:ring-1 focus:ring-accent resize-y"
      />
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={() => props.onSubmit(reason)}
          disabled={props.submitting}
          className="inline-flex items-center px-4 py-2 bg-ink text-white text-sm font-medium rounded-lg hover:bg-[#292524] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {props.submitting ? 'Sending back…' : 'Send back'}
        </button>
        <button
          type="button"
          onClick={props.onCancel}
          disabled={props.submitting}
          className="inline-flex items-center px-4 py-2 bg-transparent text-ink text-sm font-medium border-[0.5px] border-border-strong rounded-lg hover:bg-[#F8F7F4] disabled:opacity-50 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// ---------- MessageCard ----------
// Renders a contribution_requested notification as a message card. Unlike
// draft approval cards, there's no inline approval action — the recipient
// acts by visiting the piece and publishing signed content (which triggers
// the auto-clear trigger and removes this message).

function formatTimestamp(iso: string): string {
  try {
    const d = new Date(iso);
    // "Apr 22, 2026, 3:42 PM" — precise for recipients who are deciding
    // whether a request is recent or stale.
    return d.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function MessageCard({ m }: { m: ContributionRequestMessage }) {
  return (
    <li className="rounded-xl border-[0.5px] border-border bg-surface p-5">
      <div
        className="text-[11px] font-medium tracking-[0.08em] uppercase mb-4"
        style={{ color: 'var(--color-accent)' }}
      >
        Contribution request
      </div>

      <div className="pb-4 mb-5 border-b-[0.5px] border-border">
        <div className="flex items-baseline flex-wrap gap-x-3 gap-y-1">
          <a
            href={`/piece/${m.pieceId}`}
            className="font-display text-[22px] text-ink leading-tight tracking-tight no-underline hover:underline"
          >
            {m.pieceTitle}
          </a>
          {m.catalogNumber && (
            <span className="text-[11px] font-mono text-tertiary tracking-wide">
              {m.catalogNumber}
            </span>
          )}
        </div>
        <div className="mt-1 text-sm text-muted">
          by <span className="text-ink">{m.composerName}</span>
        </div>
      </div>

      <div className="text-sm text-ink font-body mb-2">
        <span className="font-medium">{m.senderName}</span>
        <span className="text-muted"> asked you to contribute.</span>
      </div>
      <div className="text-[11px] text-tertiary mb-4">{formatTimestamp(m.createdAt)}</div>

      {m.note && (
        <div
          className="pl-[18px] border-l-2 font-display text-[15px] text-ink leading-[1.68] whitespace-pre-wrap italic mb-2"
          style={{ borderLeftColor: 'var(--color-accent)' }}
        >
          &ldquo;{m.note}&rdquo;
        </div>
      )}

      <div className="mt-5">
        <a
          href={`/piece/${m.pieceId}`}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-ink text-white text-sm font-medium rounded-lg hover:bg-[#292524] transition-colors no-underline"
        >
          Open piece <span aria-hidden="true">→</span>
        </a>
      </div>
    </li>
  );
}

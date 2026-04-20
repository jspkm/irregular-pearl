// Generic staff authoring surface for all three signed content types that
// flow through the contributor approval pipeline:
//   - performer's notes (body only)
//   - interpretive schools (name + optional tempo_cues + body)
//   - piece descriptions (body only)
//
// One component, parameterized by `subjectTable`; per-subject config comes
// from SUBJECT_CONFIG in src/lib/contributorSubjects.ts. Adding a fourth
// subject type in a future slice is: (a) migration for the new tables,
// (b) one row in SUBJECT_CONFIG, (c) mount this component with the new
// subject table — no component duplication.
//
// Deliberately unpolished per the PRD: Tier 1 staff admin is data-model +
// admin view, not styled product.

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import {
  SUBJECT_CONFIG,
  rpcSubjectIdParam,
  type SubjectTable,
} from '../../lib/contributorSubjects';

type DraftStatus = 'draft' | 'awaiting_contributor_approval' | 'published' | 'removed';

interface Piece {
  id: string;
  title: string;
  composer_name: string;
  catalog_number: string | null;
}

interface Contributor {
  id: string;
  display_name: string;
}

interface VersionRow {
  id: string;
  version_number: number;
  body: string;
  approved_at: string | null;
  rejection_note: string | null;
  created_at: string;
}

interface SubjectRow {
  id: string;
  piece: Piece;
  contributor: Contributor;
  status: DraftStatus;
  current_version_id: string | null;
  drafted_by_name: string | null;
  versions: VersionRow[];
  created_at: string;
  updated_at: string;
  /** Schools only. */
  name: string | null;
  /** Schools only. */
  tempo_cues: Record<string, unknown> | null;
}

interface Props {
  subjectTable: SubjectTable;
}

function parseTempoCues(raw: string): Record<string, unknown> | null {
  const trimmed = raw.trim();
  if (trimmed === '') return null;
  try {
    const parsed = JSON.parse(trimmed);
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      throw new Error('tempo_cues must be a JSON object');
    }
    return parsed as Record<string, unknown>;
  } catch (e) {
    throw new Error(`tempo_cues: ${e instanceof Error ? e.message : String(e)}`);
  }
}

export default function ContributorContentAdmin({ subjectTable }: Props) {
  const cfg = SUBJECT_CONFIG[subjectTable];
  const idParam = rpcSubjectIdParam(subjectTable);

  const [pieces, setPieces] = useState<Piece[]>([]);
  const [contributors, setContributors] = useState<Contributor[]>([]);
  const [rows, setRows] = useState<SubjectRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create form
  const [pieceId, setPieceId] = useState<string>('');
  const [contributorId, setContributorId] = useState<string>('');
  const [body, setBody] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [tempoCuesRaw, setTempoCuesRaw] = useState<string>('');
  const [creating, setCreating] = useState<boolean>(false);

  // Per-row state
  const [rowBusy, setRowBusy] = useState<Record<string, boolean>>({});
  const [reviseOpen, setReviseOpen] = useState<Record<string, boolean>>({});
  const [reviseBody, setReviseBody] = useState<Record<string, string>>({});
  const [filter, setFilter] = useState<'all' | DraftStatus>('awaiting_contributor_approval');

  const reload = useCallback(async () => {
    setError(null);

    const selectFields = [
      'id',
      'piece_id',
      'contributor_id',
      'status',
      'current_version_id',
      'drafted_by',
      'created_at',
      'updated_at',
      cfg.hasName ? 'name' : null,
      cfg.hasTempoCues ? 'tempo_cues' : null,
    ].filter(Boolean).join(', ');

    const [piecesRes, contribRes, rowsRes] = await Promise.all([
      supabase.from('pieces').select('id, title, composer_name, catalog_number').order('title'),
      supabase
        .from('users')
        .select('id, display_name')
        .eq('is_contributor', true)
        .eq('contributor_active', true)
        .order('display_name'),
      supabase
        .from(cfg.table)
        .select(selectFields)
        .order('updated_at', { ascending: false }),
    ]);
    if (piecesRes.error) { setError(piecesRes.error.message); return; }
    if (contribRes.error) { setError(contribRes.error.message); return; }
    if (rowsRes.error) { setError(rowsRes.error.message); return; }

    setPieces(piecesRes.data ?? []);
    setContributors(contribRes.data ?? []);

    if ((contribRes.data?.length ?? 0) === 1) {
      setContributorId(contribRes.data![0].id);
    }

    type RawRow = {
      id: string;
      piece_id: string;
      contributor_id: string;
      status: DraftStatus;
      current_version_id: string | null;
      drafted_by: string | null;
      created_at: string;
      updated_at: string;
      name?: string | null;
      tempo_cues?: Record<string, unknown> | null;
    };
    const rawRows = (rowsRes.data ?? []) as RawRow[];
    if (rawRows.length === 0) {
      setRows([]);
      setLoading(false);
      return;
    }

    const subjectIds = rawRows.map((r) => r.id);
    const drafterIds = [...new Set(rawRows.map((r) => r.drafted_by).filter((x): x is string => Boolean(x)))];
    const contribIds = [...new Set(rawRows.map((r) => r.contributor_id))];

    const [versionsRes, draftersRes, contribLookupRes] = await Promise.all([
      supabase
        .from(cfg.versionsTable)
        .select(`id, ${cfg.versionForeignKey}, version_number, body, approved_at, rejection_note, created_at`)
        .in(cfg.versionForeignKey, subjectIds)
        .order('version_number', { ascending: false }),
      drafterIds.length
        ? supabase.from('users').select('id, display_name').in('id', drafterIds)
        : Promise.resolve({ data: [], error: null as null | { message: string } }),
      supabase.from('users').select('id, display_name').in('id', contribIds),
    ]);
    if (versionsRes.error) { setError(versionsRes.error.message); return; }
    if (draftersRes.error) { setError(draftersRes.error.message); return; }
    if (contribLookupRes.error) { setError(contribLookupRes.error.message); return; }

    const pieceById = new Map((piecesRes.data ?? []).map((p) => [p.id, p]));
    const drafterById = new Map((draftersRes.data ?? []).map((u) => [u.id, u.display_name]));
    const contributorById = new Map((contribLookupRes.data ?? []).map((u) => [u.id, u.display_name]));

    type RawVersion = VersionRow & Record<string, string>;
    const versionsBySubject = new Map<string, VersionRow[]>();
    for (const v of (versionsRes.data ?? []) as RawVersion[]) {
      const subjectId = v[cfg.versionForeignKey];
      const arr = versionsBySubject.get(subjectId) ?? [];
      arr.push({
        id: v.id,
        version_number: v.version_number,
        body: v.body,
        approved_at: v.approved_at,
        rejection_note: v.rejection_note,
        created_at: v.created_at,
      });
      versionsBySubject.set(subjectId, arr);
    }

    const hydrated: SubjectRow[] = [];
    for (const r of rawRows) {
      const piece = pieceById.get(r.piece_id);
      if (!piece) continue;
      hydrated.push({
        id: r.id,
        piece,
        contributor: { id: r.contributor_id, display_name: contributorById.get(r.contributor_id) ?? 'Unknown' },
        status: r.status,
        current_version_id: r.current_version_id,
        drafted_by_name: r.drafted_by ? drafterById.get(r.drafted_by) ?? null : null,
        versions: versionsBySubject.get(r.id) ?? [],
        created_at: r.created_at,
        updated_at: r.updated_at,
        name: cfg.hasName ? r.name ?? null : null,
        tempo_cues: cfg.hasTempoCues ? r.tempo_cues ?? null : null,
      });
    }
    setRows(hydrated);
    setLoading(false);
  }, [cfg]);

  useEffect(() => { void reload(); }, [reload]);

  function notifyChanged() {
    if (typeof window !== 'undefined') window.dispatchEvent(new Event('notifications:changed'));
  }

  async function handleCreate(options: { submitAfter: boolean }) {
    if (!pieceId) { setError('Pick a piece.'); return; }
    if (!contributorId) { setError('Pick a contributor.'); return; }
    if (body.trim().length === 0) { setError('Body required.'); return; }
    if (cfg.hasName && name.trim().length === 0) {
      setError('Name required for this subject type.');
      return;
    }

    let tempoCues: Record<string, unknown> | null = null;
    if (cfg.hasTempoCues) {
      try {
        tempoCues = parseTempoCues(tempoCuesRaw);
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
        return;
      }
    }

    setCreating(true);
    setError(null);

    const createArgs: Record<string, unknown> = {
      p_piece_id: pieceId,
      p_contributor_id: contributorId,
      p_body: body,
    };
    if (cfg.hasName) createArgs.p_name = name.trim();
    if (cfg.hasTempoCues && tempoCues !== null) createArgs.p_tempo_cues = tempoCues;

    const { data: subjectId, error: createErr } = await supabase.rpc(cfg.rpcs.createDraft, createArgs);
    if (createErr) { setError(createErr.message); setCreating(false); return; }

    if (options.submitAfter) {
      const { error: submitErr } = await supabase.rpc(cfg.rpcs.submit, {
        [idParam]: subjectId,
      });
      if (submitErr) { setError(submitErr.message); setCreating(false); return; }
    }

    setBody('');
    setName('');
    setTempoCuesRaw('');
    setCreating(false);
    await reload();
    notifyChanged();
  }

  async function handleSubmit(rowId: string) {
    setRowBusy((b) => ({ ...b, [rowId]: true })); setError(null);
    const { error: err } = await supabase.rpc(cfg.rpcs.submit, { [idParam]: rowId });
    setRowBusy((b) => ({ ...b, [rowId]: false }));
    if (err) { setError(err.message); return; }
    await reload();
    notifyChanged();
  }

  async function handleRetract(rowId: string) {
    setRowBusy((b) => ({ ...b, [rowId]: true })); setError(null);
    const { error: err } = await supabase.rpc(cfg.rpcs.retract, { [idParam]: rowId });
    setRowBusy((b) => ({ ...b, [rowId]: false }));
    if (err) { setError(err.message); return; }
    await reload();
    notifyChanged();
  }

  async function handleRevise(rowId: string) {
    const newBody = reviseBody[rowId] ?? '';
    if (newBody.trim().length === 0) { setError('Revision body required.'); return; }
    setRowBusy((b) => ({ ...b, [rowId]: true })); setError(null);
    const { error: err } = await supabase.rpc(cfg.rpcs.updateDraft, {
      [idParam]: rowId,
      p_body: newBody,
    });
    setRowBusy((b) => ({ ...b, [rowId]: false }));
    if (err) { setError(err.message); return; }
    setReviseOpen((o) => ({ ...o, [rowId]: false }));
    setReviseBody((b) => ({ ...b, [rowId]: '' }));
    await reload();
  }

  if (loading) return <div className="text-sm text-[#6F6F6F]">Loading…</div>;

  const filtered = filter === 'all' ? rows : rows.filter((r) => r.status === filter);
  const baseReady = Boolean(pieceId && contributorId && body.trim().length > 0);
  const nameReady = !cfg.hasName || name.trim().length > 0;
  const canSend = baseReady && nameReady && !creating;
  const noContributor = contributors.length === 0;

  return (
    <div className="space-y-8">
      {error && (
        <div className="rounded-lg border-[0.5px] border-[#A32D2D] bg-[#F7E4E4] px-4 py-3 text-sm text-[#A32D2D]">
          {error}
        </div>
      )}

      <section className="border-[0.5px] border-[#E5E3DE] rounded-xl bg-white p-5">
        <h2 className="font-display text-[20px] mb-1 text-[#1A1A1A]">New draft</h2>
        <p className="text-xs text-[#6F6F6F] mb-4">
          Authored on the contributor's behalf. They approve it before it publishes.
        </p>

        {noContributor && (
          <div className="rounded-lg bg-[#FAF2DB] border-[0.5px] border-[#8B6914] text-[#8B6914] text-xs px-3 py-2 mb-3">
            No active contributors yet. Promote one via <code>scripts/seed-contributor.ts</code> before drafting.
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
          <label className="block text-xs text-[#6F6F6F]">
            Piece
            <select
              value={pieceId}
              onChange={(e) => setPieceId(e.target.value)}
              className="mt-1 w-full px-3 py-2 text-sm text-[#1A1A1A] border-[0.5px] border-[#CCC9C2] rounded-lg bg-white"
            >
              <option value="">— select a piece —</option>
              {pieces.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}{p.catalog_number ? ` (${p.catalog_number})` : ''} — {p.composer_name}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs text-[#6F6F6F]">
            Contributor
            <select
              value={contributorId}
              onChange={(e) => setContributorId(e.target.value)}
              disabled={noContributor}
              className="mt-1 w-full px-3 py-2 text-sm text-[#1A1A1A] border-[0.5px] border-[#CCC9C2] rounded-lg bg-white disabled:bg-[#F8F7F4] disabled:text-[#9A9A9A]"
            >
              {contributors.length === 1 ? (
                <option value={contributors[0].id}>{contributors[0].display_name}</option>
              ) : (
                <>
                  <option value="">— select a contributor —</option>
                  {contributors.map((c) => (
                    <option key={c.id} value={c.id}>{c.display_name}</option>
                  ))}
                </>
              )}
            </select>
          </label>
        </div>

        {cfg.hasName && (
          <label className="block text-xs text-[#6F6F6F] mb-3">
            Name
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Historically informed"
              className="mt-1 w-full px-3 py-2 text-sm text-[#1A1A1A] border-[0.5px] border-[#CCC9C2] rounded-lg bg-white"
            />
          </label>
        )}

        {cfg.hasTempoCues && (
          <label className="block text-xs text-[#6F6F6F] mb-3">
            Tempo cues (optional JSON object)
            <textarea
              value={tempoCuesRaw}
              onChange={(e) => setTempoCuesRaw(e.target.value)}
              rows={2}
              placeholder='{"opening": "quarter=72"}'
              className="mt-1 w-full px-3 py-2 text-xs font-mono leading-relaxed text-[#1A1A1A] border-[0.5px] border-[#CCC9C2] rounded-lg resize-y bg-white"
            />
          </label>
        )}

        <label className="block text-xs text-[#6F6F6F] mb-3">
          Body
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={6}
            placeholder={`Proposed ${cfg.label.toLowerCase()}…`}
            className="mt-1 w-full px-3 py-2 text-[15px] font-display leading-[1.68] text-[#1A1A1A] border-[0.5px] border-[#CCC9C2] rounded-lg resize-y bg-white"
          />
        </label>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => handleCreate({ submitAfter: true })}
            disabled={!canSend || noContributor}
            className="inline-flex items-center px-4 py-2 bg-[#1A1A1A] text-white text-sm font-medium rounded-lg hover:bg-[#292524] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {creating ? 'Sending…' : 'Send to contributor'}
          </button>
          <button
            type="button"
            onClick={() => handleCreate({ submitAfter: false })}
            disabled={!canSend || noContributor}
            className="inline-flex items-center px-4 py-2 bg-transparent text-[#1A1A1A] text-sm font-medium border-[0.5px] border-[#CCC9C2] rounded-lg hover:bg-[#F8F7F4] disabled:opacity-50"
          >
            Save as draft only
          </button>
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-3 gap-4">
          <h2 className="font-display text-[20px] text-[#1A1A1A]">{cfg.label}s</h2>
          <div className="flex gap-2 flex-wrap">
            {(['awaiting_contributor_approval', 'draft', 'published', 'removed', 'all'] as const).map((f) => {
              const active = filter === f;
              return (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFilter(f)}
                  className={`inline-flex items-center font-body text-[11px] px-2.5 py-1 rounded-md cursor-pointer border-[0.5px] transition-colors ${
                    active
                      ? 'bg-accent-light text-accent border-accent-border'
                      : 'bg-transparent text-muted border-border-strong hover:text-ink hover:border-ink'
                  }`}
                >
                  {f === 'awaiting_contributor_approval' ? 'awaiting' : f}
                </button>
              );
            })}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-xl border-[0.5px] border-[#E5E3DE] bg-white px-5 py-8 text-center text-sm text-[#6F6F6F]">
            Nothing here.
          </div>
        ) : (
          <ul className="space-y-3">
            {filtered.map((r) => {
              const busy = rowBusy[r.id] ?? false;
              const pending = r.versions.find((v) => v.approved_at === null);
              const currentVersion = r.versions.find((v) => v.id === r.current_version_id);
              const rejected = r.versions.filter((v) => v.rejection_note);
              return (
                <li key={r.id} className="rounded-xl border-[0.5px] border-[#E5E3DE] bg-white p-4">
                  <div className="flex items-baseline justify-between gap-2 mb-1">
                    <div className="font-display text-[18px] text-[#1A1A1A] leading-tight">
                      {r.piece.title}{r.piece.catalog_number && (
                        <span className="ml-2 text-[11px] font-mono text-[#9A9A9A] tracking-wide">{r.piece.catalog_number}</span>
                      )}
                    </div>
                    <StatusPill status={r.status} />
                  </div>
                  <div className="text-xs text-[#6F6F6F] mb-3">
                    for {r.contributor.display_name} &middot; {r.drafted_by_name ? `drafted by ${r.drafted_by_name}` : 'self-authored'} &middot; {r.versions.length} version{r.versions.length === 1 ? '' : 's'}
                  </div>

                  {cfg.hasName && r.name && (
                    <div className="mb-2 text-[11px] font-medium tracking-[0.08em] uppercase text-[#1A1A1A]">
                      {r.name}
                    </div>
                  )}

                  {cfg.hasTempoCues && r.tempo_cues && Object.keys(r.tempo_cues).length > 0 && (
                    <div className="mb-2 text-[11px] font-mono text-[#6F6F6F]">
                      {Object.entries(r.tempo_cues).map(([k, v]) => (
                        <span key={k} className="mr-3">
                          {k}: {typeof v === 'string' ? v : JSON.stringify(v)}
                        </span>
                      ))}
                    </div>
                  )}

                  {rejected.length > 0 && (
                    <div className="mb-3 rounded-lg bg-[#FAF2DB] border-[0.5px] border-[#8B6914] text-[#8B6914] text-xs px-3 py-2 space-y-1">
                      {rejected.map((x) => (
                        <div key={x.id}>
                          <span className="font-medium">rejected v{x.version_number}:</span> {x.rejection_note}
                        </div>
                      ))}
                    </div>
                  )}

                  {(pending || currentVersion) && (
                    <pre
                      className="px-3 py-2 mb-3 bg-[#F8F7F4] border-[0.5px] border-[#E5E3DE] rounded-lg font-display text-[14px] leading-[1.55] text-[#1A1A1A] whitespace-pre-wrap"
                    >
                      {(pending ?? currentVersion)!.body}
                    </pre>
                  )}

                  <div className="flex flex-wrap gap-2">
                    {r.status === 'draft' && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleSubmit(r.id)}
                          disabled={busy}
                          className="px-3 py-1.5 bg-[#1A1A1A] text-white text-xs font-medium rounded-lg hover:bg-[#292524] disabled:opacity-50"
                        >
                          {busy ? 'Sending…' : 'Send to contributor'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setReviseOpen((o) => ({ ...o, [r.id]: !(o[r.id] ?? false) }));
                            setReviseBody((b) => ({ ...b, [r.id]: (pending ?? currentVersion)?.body ?? '' }));
                          }}
                          disabled={busy}
                          className="px-3 py-1.5 bg-transparent text-[#1A1A1A] text-xs font-medium border-[0.5px] border-[#CCC9C2] rounded-lg hover:bg-[#F8F7F4] disabled:opacity-50"
                        >
                          {reviseOpen[r.id] ? 'Close' : 'Revise'}
                        </button>
                      </>
                    )}
                    {r.status === 'awaiting_contributor_approval' && (
                      <button
                        type="button"
                        onClick={() => handleRetract(r.id)}
                        disabled={busy}
                        className="px-3 py-1.5 bg-transparent text-[#1A1A1A] text-xs font-medium border-[0.5px] border-[#CCC9C2] rounded-lg hover:bg-[#F8F7F4] disabled:opacity-50"
                      >
                        {busy ? 'Retracting…' : 'Retract'}
                      </button>
                    )}
                  </div>

                  {r.status === 'draft' && reviseOpen[r.id] && (
                    <div className="mt-3">
                      <textarea
                        value={reviseBody[r.id] ?? ''}
                        onChange={(e) => setReviseBody((b) => ({ ...b, [r.id]: e.target.value }))}
                        rows={5}
                        className="w-full px-3 py-2 text-[15px] font-display leading-[1.68] text-[#1A1A1A] border-[0.5px] border-[#CCC9C2] rounded-lg resize-y bg-white"
                      />
                      <div className="flex gap-2 mt-2">
                        <button
                          type="button"
                          onClick={() => handleRevise(r.id)}
                          disabled={busy}
                          className="px-3 py-1.5 bg-[#1A1A1A] text-white text-xs font-medium rounded-lg hover:bg-[#292524] disabled:opacity-50"
                        >
                          {busy ? 'Saving…' : 'Save new version'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setReviseOpen((o) => ({ ...o, [r.id]: false }))}
                          disabled={busy}
                          className="px-3 py-1.5 bg-transparent text-[#1A1A1A] text-xs font-medium border-[0.5px] border-[#CCC9C2] rounded-lg hover:bg-[#F8F7F4] disabled:opacity-50"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

function StatusPill({ status }: { status: DraftStatus }) {
  const styles: Record<DraftStatus, { bg: string; color: string; border: string; label: string }> = {
    draft:                         { bg: '#F8F7F4', color: '#6F6F6F', border: '#CCC9C2', label: 'draft' },
    awaiting_contributor_approval: { bg: '#F2EEF5', color: '#6B4E7C', border: '#D9CCE1', label: 'awaiting' },
    published:                     { bg: '#E6F1E9', color: '#2D6A3F', border: '#2D6A3F', label: 'published' },
    removed:                       { bg: '#F8F7F4', color: '#9A9A9A', border: '#CCC9C2', label: 'removed' },
  };
  const s = styles[status];
  return (
    <span
      className="text-[10px] font-medium tracking-wider uppercase px-2 py-0.5 rounded-full shrink-0"
      style={{ background: s.bg, color: s.color, border: `0.5px solid ${s.border}` }}
    >
      {s.label}
    </span>
  );
}

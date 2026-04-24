// Staff Requests admin tab. Read-only view over the viewer's own
// contribution_request outbox (unsent) and sent-archive. No disposition
// info is shown at any layer — that's the no-feedback property enforced
// in schema (sent_request_archive doesn't store it; sender_drafts_archive
// function omits those columns).
//
// Outbox rows link to /piece/[slug]?compose=<id> to resume drafting.
// Sent rows expand inline to show the personal note + a read-only copy of
// each draft body as it was at send time.

import { useEffect, useState } from 'react';
import { hasSupabase } from '../../lib/supabase';
import {
  fetchOutboxList,
  fetchSentArchiveList,
  type DraftKind,
  type OutboxListRow,
  type SentRequestArchiveRow,
} from '../../lib/contributionDrafts';
import { KIND_LABEL_TITLE } from '../../lib/draftKinds';

type Tab = 'outbox' | 'sent';
type Status = 'loading' | 'ready' | 'error';

function draftBodyPreview(kind: DraftKind, payload: Record<string, unknown>): string {
  if (kind === 'interpretive_school') {
    const name = typeof payload.name === 'string' ? payload.name : '';
    const body = typeof payload.body === 'string' ? payload.body : '';
    return name ? `${name} — ${body}` : body;
  }
  if (kind === 'landmark') {
    const label = typeof payload.label === 'string' ? payload.label : '';
    const desc = typeof payload.description === 'string' ? payload.description : '';
    return desc ? `${label} — ${desc}` : label;
  }
  return typeof payload.body === 'string' ? payload.body : '';
}

export default function RequestsAdmin() {
  const [tab, setTab] = useState<Tab>('outbox');
  const [status, setStatus] = useState<Status>('loading');
  const [error, setError] = useState<string | null>(null);
  const [outbox, setOutbox] = useState<OutboxListRow[]>([]);
  const [sent, setSent] = useState<SentRequestArchiveRow[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!hasSupabase) {
        if (!cancelled) {
          setError('Supabase not configured.');
          setStatus('error');
        }
        return;
      }
      try {
        const [o, s] = await Promise.all([fetchOutboxList(), fetchSentArchiveList(50)]);
        if (cancelled) return;
        setOutbox(o);
        setSent(s);
        setStatus('ready');
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : String(e));
        setStatus('error');
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (status === 'loading') {
    return <div className="text-sm text-[#6F6F6F]">Loading…</div>;
  }
  if (status === 'error') {
    return (
      <div className="rounded-lg border-[0.5px] border-[#A32D2D] bg-[#F7E4E4] px-4 py-3 text-sm text-[#A32D2D]">
        {error ?? 'Failed to load.'}
      </div>
    );
  }

  return (
    <div>
      <div className="border-b-[0.5px] border-[#E5E3DE] mb-6 flex gap-0">
        <button
          type="button"
          onClick={() => setTab('outbox')}
          className={`px-3 py-2 text-sm font-medium border-b-2 bg-transparent cursor-pointer transition-colors ${
            tab === 'outbox'
              ? 'border-[#6B4E7C] text-[#6B4E7C]'
              : 'border-transparent text-[#6F6F6F] hover:text-[#1A1A1A]'
          }`}
        >
          Outbox <span className="text-[11px] text-[#9A9A9A] ml-1">({outbox.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setTab('sent')}
          className={`px-3 py-2 text-sm font-medium border-b-2 bg-transparent cursor-pointer transition-colors ${
            tab === 'sent'
              ? 'border-[#6B4E7C] text-[#6B4E7C]'
              : 'border-transparent text-[#6F6F6F] hover:text-[#1A1A1A]'
          }`}
        >
          Sent <span className="text-[11px] text-[#9A9A9A] ml-1">({sent.length})</span>
        </button>
      </div>

      {tab === 'outbox' && (
        <div>
          {outbox.length === 0 ? (
            <p className="text-sm text-[#6F6F6F]">
              No outbox drafts. Start one from any piece page's &ldquo;Request a
              contribution&rdquo; dialog.
            </p>
          ) : (
            <ul className="space-y-3">
              {outbox.map((row) => (
                <li
                  key={row.requestId}
                  className="border-[0.5px] border-[#E5E3DE] rounded-lg px-4 py-3 flex items-center justify-between gap-4"
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-sm text-[#1A1A1A]">
                      <span className="font-medium">{row.pieceTitle ?? row.pieceId}</span>
                      <span className="text-[#9A9A9A] mx-2">→</span>
                      <span>{row.recipientDisplayName ?? (row.recipientId ? '(unknown)' : '(recipient deleted)')}</span>
                    </div>
                    <div className="text-[11px] text-[#9A9A9A] mt-1">
                      {row.draftCount} draft{row.draftCount === 1 ? '' : 's'}
                      {row.note ? ` · "${row.note.slice(0, 80)}${row.note.length > 80 ? '…' : ''}"` : ''}
                    </div>
                  </div>
                  <a
                    href={`/piece/${row.pieceId}?compose=${row.requestId}&return=${encodeURIComponent('/admin')}`}
                    className="text-sm text-[#6B4E7C] no-underline hover:underline whitespace-nowrap"
                  >
                    Resume →
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {tab === 'sent' && (
        <div>
          {sent.length === 0 ? (
            <p className="text-sm text-[#6F6F6F]">No sent requests.</p>
          ) : (
            <ul className="space-y-2">
              {sent.map((row) => {
                const expanded = expandedId === row.id;
                return (
                  <li
                    key={row.id}
                    className="border-[0.5px] border-[#E5E3DE] rounded-lg px-4 py-3"
                  >
                    <button
                      type="button"
                      onClick={() => setExpandedId(expanded ? null : row.id)}
                      className="w-full flex items-center justify-between gap-4 bg-transparent border-0 p-0 cursor-pointer text-left"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="text-sm text-[#1A1A1A]">
                          <span className="text-[#9A9A9A] mr-3 font-mono text-xs">
                            {new Date(row.sentAt).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                          <span className="font-medium">{row.pieceTitle ?? row.pieceId}</span>
                          <span className="text-[#9A9A9A] mx-2">→</span>
                          <span>{row.recipientDisplayName ?? '(recipient deleted)'}</span>
                        </div>
                        <div className="text-[11px] text-[#9A9A9A] mt-1">
                          {row.drafts.length === 0
                            ? 'note only'
                            : `${row.drafts.length} draft${row.drafts.length === 1 ? '' : 's'}`}
                        </div>
                      </div>
                      <span className="text-[#6B4E7C] text-xs">{expanded ? '−' : '+'}</span>
                    </button>

                    {expanded && (
                      <div className="mt-4 pt-4 border-t-[0.5px] border-[#E5E3DE] space-y-3">
                        {row.note && (
                          <div>
                            <div className="text-[11px] uppercase tracking-wider text-[#9A9A9A] mb-1">
                              Personal note
                            </div>
                            <div className="text-sm text-[#1A1A1A] italic">&ldquo;{row.note}&rdquo;</div>
                          </div>
                        )}
                        {row.drafts.length > 0 && (
                          <div>
                            <div className="text-[11px] uppercase tracking-wider text-[#9A9A9A] mb-2">
                              Drafts sent
                            </div>
                            <ul className="space-y-2">
                              {row.drafts.map((d, i) => (
                                <li key={i} className="border-l-2 border-[#6B4E7C] pl-3">
                                  <div className="text-[11px] text-[#6B4E7C] uppercase tracking-wider">
                                    {KIND_LABEL_TITLE[d.kind] ?? d.kind}
                                  </div>
                                  <div className="text-sm text-[#1A1A1A] mt-1 whitespace-pre-wrap">
                                    {draftBodyPreview(d.kind, d.payload)}
                                  </div>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

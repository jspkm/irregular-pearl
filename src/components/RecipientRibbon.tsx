// Recipient ribbon on the piece page. When the current viewer has one or
// more un-cleared contribution_requests on THIS piece where they are the
// recipient, render a small strip under the piece header: "Alice asked
// you to contribute here." (or "Alice and N others asked you to contribute
// here." when multi-requester). Invisible to everyone else.
//
// Client-fetched — piece page HTML is public and edge-cacheable, so the
// recipient-personalized surface has to be hydrated client-side. Signed-out
// viewers silently fetch nothing (no request could possibly be addressed
// to them). Staff who received a request see the same ribbon as any
// other recipient; the Dismiss affordance lives on the Messages page, not
// here.

import { useEffect, useState } from 'react';
import { supabase, hasSupabase } from '../lib/supabase';
import { useAuth } from '../lib/useAuth';

interface Props {
  pieceId: string;
}

interface RibbonRequest {
  id: string;
  senderId: string;
  senderDisplayName: string;
  note: string | null;
  createdAt: string;
}

export default function RecipientRibbon({ pieceId }: Props) {
  const { user, loading: authLoading } = useAuth();
  const [requests, setRequests] = useState<RibbonRequest[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (authLoading) return;
      if (!user || !hasSupabase) {
        setRequests([]);
        setReady(true);
        return;
      }

      const { data: crRows } = await supabase
        .from('contribution_requests')
        .select('id, sender_id, note, created_at')
        .eq('piece_id', pieceId)
        .eq('recipient_id', user.id)
        .is('cleared_at', null)
        .order('created_at', { ascending: false });

      const rows = (crRows ?? []) as {
        id: string;
        sender_id: string;
        note: string | null;
        created_at: string;
      }[];

      if (rows.length === 0) {
        if (!cancelled) {
          setRequests([]);
          setReady(true);
        }
        return;
      }

      const senderIds = [...new Set(rows.map((r) => r.sender_id))];
      const { data: sendersData } = await supabase
        .from('users')
        .select('id, display_name')
        .in('id', senderIds);
      const senderById = new Map(
        ((sendersData ?? []) as { id: string; display_name: string }[]).map((u) => [
          u.id,
          u.display_name,
        ]),
      );

      if (cancelled) return;
      setRequests(
        rows.map((r) => ({
          id: r.id,
          senderId: r.sender_id,
          senderDisplayName: senderById.get(r.sender_id) ?? 'Someone',
          note: r.note,
          createdAt: r.created_at,
        })),
      );
      setReady(true);
    }

    void load();

    function onChanged() {
      void load();
    }
    window.addEventListener('notifications:changed', onChanged);
    return () => {
      cancelled = true;
      window.removeEventListener('notifications:changed', onChanged);
    };
  }, [authLoading, user, pieceId]);

  if (!ready) return null;
  if (requests.length === 0) return null;

  const latest = requests[0];
  const others = requests.length - 1;

  return (
    <aside className="recipient-ribbon" role="status">
      <div className="recipient-ribbon-copy">
        {others > 0 ? (
          <>
            <strong>{latest.senderDisplayName}</strong>{' '}
            and {others} other{others === 1 ? '' : 's'} asked you to contribute here.
          </>
        ) : (
          <>
            <strong>{latest.senderDisplayName}</strong> asked you to contribute here.
          </>
        )}
      </div>
      {latest.note && others === 0 && (
        <div className="recipient-ribbon-note">&ldquo;{latest.note}&rdquo;</div>
      )}
      <div className="recipient-ribbon-privacy">
        This message is only visible to you.
      </div>
    </aside>
  );
}

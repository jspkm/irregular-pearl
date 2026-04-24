// Shell for /notifications: tab nav between the Messages list
// (contribution-request messages) and the Open items tab (recipient's
// cross-piece view of contribution_request_drafts).
//
// Tab state is a single useState — no router hash, no URL coupling. Keeps
// the bell badge + page title stable. If we ever need deep-linking per tab,
// add a ?tab=drafts param; for now the simple model is fine.
//
// Live counts on each tab label update from the current data fetches so
// the user can see "Open items · 3" without switching over.

import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase, hasSupabase } from '../lib/supabase';
import { fetchPendingDraftsForViewer } from '../lib/contributionDrafts';
import { redirectFromPrivateRoute } from '../lib/privateRoute';
import NotificationsQueue from './NotificationsQueue';
import RecipientDraftsTab from './RecipientDraftsTab';

type Tab = 'messages' | 'drafts';
type AuthStatus = 'loading' | 'unauthed' | 'authed';

export default function MessagesPageShell() {
  const [tab, setTab] = useState<Tab>('messages');
  const [authStatus, setAuthStatus] = useState<AuthStatus>('loading');
  const [draftCount, setDraftCount] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function checkAuth() {
      if (!hasSupabase) { setAuthStatus('unauthed'); return; }
      const { data: { session } } = await supabase.auth.getSession();
      if (cancelled) return;
      setAuthStatus(session?.user ? 'authed' : 'unauthed');
    }
    void checkAuth();

    if (!hasSupabase) return;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session: Session | null) => {
      if (cancelled) return;
      setAuthStatus(session?.user ? 'authed' : 'unauthed');
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  // /notifications is a private route. Anon viewers redirect via the
  // shared helper — silent, no leak about what the page contains.
  useEffect(() => {
    if (authStatus === 'unauthed') redirectFromPrivateRoute(false);
  }, [authStatus]);

  useEffect(() => {
    if (authStatus !== 'authed') { setDraftCount(null); return; }
    let cancelled = false;
    async function loadCount() {
      const all = await fetchPendingDraftsForViewer();
      if (!cancelled) setDraftCount(all.length);
    }
    void loadCount();

    // Refresh count when the navbar bell fires (draft resolved on piece
    // page → Open items tab count should reflect).
    function onChange() { void loadCount(); }
    if (typeof window !== 'undefined') {
      window.addEventListener('notifications:changed', onChange);
    }
    return () => {
      cancelled = true;
      if (typeof window !== 'undefined') {
        window.removeEventListener('notifications:changed', onChange);
      }
    };
  }, [authStatus, tab]);

  // Render nothing while loading and during the unauthed redirect — the
  // page is private, no leak of what it contains.
  if (authStatus !== 'authed') return null;

  return (
    <div>
      <div className="messages-tabs" role="tablist" aria-label="Messages">
        <button
          role="tab"
          type="button"
          aria-selected={tab === 'messages'}
          className={`messages-tab${tab === 'messages' ? ' is-active' : ''}`}
          onClick={() => setTab('messages')}
        >
          Messages
        </button>
        <button
          role="tab"
          type="button"
          aria-selected={tab === 'drafts'}
          className={`messages-tab${tab === 'drafts' ? ' is-active' : ''}`}
          onClick={() => setTab('drafts')}
        >
          Open items
          {draftCount !== null && draftCount > 0 && (
            <span className="messages-tab-count" aria-label={`${draftCount} open items`}>
              {draftCount}
            </span>
          )}
        </button>
      </div>
      <div className="messages-tab-panel">
        {tab === 'messages' ? <NotificationsQueue /> : <RecipientDraftsTab />}
      </div>
    </div>
  );
}

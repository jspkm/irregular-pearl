import { useState, useEffect } from 'react';
import { supabase, hasSupabase } from '../../lib/supabase';

interface Report {
  id: string;
  reason: string;
  created_at: string;
  discussion_id: string;
  reporter: { display_name: string; vanity_slug: string | null };
  discussion: { text: string; piece_id: string; user: { display_name: string } };
}

interface Props {
  managedSections?: string[];
  isAdmin: boolean;
}

export default function AdminReportList({ managedSections, isAdmin }: Props) {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hasSupabase) { setLoading(false); return; }

    const fetchReports = async () => {
      const { data, error } = await supabase
        .from('reports')
        .select(`
          id, reason, created_at, discussion_id,
          users!reporter_user_id(display_name, vanity_slug),
          discussions!inner(text, piece_id, users!inner(display_name))
        `)
        .order('created_at', { ascending: false });

      if (!error && data) {
        const mapped = data.map((r: any) => ({
          id: r.id,
          reason: r.reason,
          created_at: r.created_at,
          discussion_id: r.discussion_id,
          reporter: r.users || { display_name: 'Unknown', vanity_slug: null },
          discussion: {
            text: r.discussions?.text || '',
            piece_id: r.discussions?.piece_id || '',
            user: r.discussions?.users || { display_name: 'Unknown' },
          },
        }));
        setReports(mapped);
      }
      setLoading(false);
    };

    fetchReports();
  }, []);

  const dismissReport = async (reportId: string) => {
    await supabase.from('reports').delete().eq('id', reportId);
    setReports(prev => prev.filter(r => r.id !== reportId));
  };

  const deleteDiscussion = async (reportId: string, discussionId: string) => {
    if (!confirm('Delete this discussion post? This cannot be undone.')) return;
    await supabase.from('discussions').update({ is_deleted: true }).eq('id', discussionId);
    await supabase.from('reports').delete().eq('id', reportId);
    setReports(prev => prev.filter(r => r.id !== reportId));
  };

  if (loading) return <div className="text-sm text-muted">Loading...</div>;

  if (reports.length === 0) {
    return (
      <div className="text-center py-16 border border-dashed border-border rounded-xl">
        <div className="text-2xl mb-2">✓</div>
        <p className="text-sm text-muted">No pending reports</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {reports.map(r => (
        <div key={r.id} className="bg-surface border border-border rounded-xl p-5">
          <div className="flex justify-between items-start mb-3">
            <div>
              <span className="text-xs text-muted">Reported by </span>
              <span className="text-xs font-medium text-ink">{r.reporter.display_name}</span>
              <span className="text-xs text-muted"> · {new Date(r.created_at).toLocaleDateString()}</span>
            </div>
            <a href={`/piece/${r.discussion.piece_id}`} className="text-[11px] text-[#B45309] no-underline hover:underline">
              View piece →
            </a>
          </div>

          <div className="bg-bg rounded-lg p-3 mb-3">
            <div className="text-xs text-muted mb-1">Post by {r.discussion.user.display_name}:</div>
            <p className="text-sm text-ink whitespace-pre-line">{r.discussion.text}</p>
          </div>

          <div className="text-xs text-muted mb-3">
            <span className="font-medium">Reason:</span> {r.reason}
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => dismissReport(r.id)}
              className="text-xs px-3 py-1.5 border border-border rounded-lg text-muted hover:text-ink bg-transparent cursor-pointer"
            >
              Dismiss
            </button>
            <button
              onClick={() => deleteDiscussion(r.id, r.discussion_id)}
              className="text-xs px-3 py-1.5 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 cursor-pointer"
            >
              Delete Post
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

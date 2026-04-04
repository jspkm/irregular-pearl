import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface WantedQuery {
  query: string;
  count: number;
}

export default function MostWanted() {
  const [queries, setQueries] = useState<WantedQuery[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        // Get most-searched queries from the last 30 days
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
        const { data } = await supabase
          .from('search_queries')
          .select('query')
          .gte('created_at', thirtyDaysAgo)
          .gt('result_count', 0);

        if (!data || data.length === 0) {
          setLoading(false);
          return;
        }

        // Count query frequency
        const counts: Record<string, number> = {};
        for (const row of data) {
          const q = row.query.toLowerCase().trim();
          if (q.length < 2) continue;
          counts[q] = (counts[q] || 0) + 1;
        }

        const sorted = Object.entries(counts)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 10)
          .map(([query, count]) => ({ query, count }));

        setQueries(sorted);
      } catch {
        // Silent fail — analytics feature
      }
      setLoading(false);
    }
    load();
  }, []);

  if (loading || queries.length === 0) return null;

  return (
    <section className="mb-10">
      <h2 className="font-display text-lg mb-3">Most Searched</h2>
      <div className="bg-surface border border-border rounded-xl p-5">
        <div className="space-y-2.5">
          {queries.map((q, i) => (
            <a
              key={q.query}
              href={`/?q=${encodeURIComponent(q.query)}`}
              className="flex items-center gap-3 text-sm no-underline text-ink hover:text-accent transition-colors"
            >
              <span className="font-mono text-[11px] text-muted w-5 text-right">{i + 1}.</span>
              <span className="flex-1">{q.query}</span>
              <span className="font-mono text-[10px] text-muted px-2 py-0.5 bg-bg rounded-full">
                {q.count} search{q.count !== 1 ? 'es' : ''}
              </span>
            </a>
          ))}
        </div>
        <p className="text-[11px] text-muted italic mt-4">
          These pieces get searched the most. Help fill them in.
        </p>
      </div>
    </section>
  );
}

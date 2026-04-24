import { useState, useEffect } from 'react';
import { supabase, hasSupabase } from '../../lib/supabase';
import { seedPieces } from '../../data/seed';

interface PlaylistItem {
  id: string;
  piece_id: string;
  position: number;
}

export default function AdminPlaylist() {
  const [playlist, setPlaylist] = useState<PlaylistItem[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hasSupabase) { setLoading(false); return; }
    supabase.from('maestro_playlist').select('*').order('position').then(({ data }) => {
      if (data) setPlaylist(data);
      setLoading(false);
    });
  }, []);

  const addPiece = async (pieceId: string) => {
    if (playlist.some(p => p.piece_id === pieceId)) return;
    const position = playlist.length + 1;
    const { data, error } = await supabase.from('maestro_playlist')
      .insert({ piece_id: pieceId, position })
      .select().single();
    if (!error && data) setPlaylist(prev => [...prev, data]);
  };

  const removePiece = async (id: string) => {
    await supabase.from('maestro_playlist').delete().eq('id', id);
    setPlaylist(prev => prev.filter(p => p.id !== id));
  };

  const movePiece = async (index: number, direction: -1 | 1) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= playlist.length) return;
    const updated = [...playlist];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    updated.forEach((item, i) => { item.position = i + 1; });
    setPlaylist(updated);
    // Update positions in DB
    await Promise.all(updated.map(item =>
      supabase.from('maestro_playlist').update({ position: item.position }).eq('id', item.id)
    ));
  };

  const searchResults = search.length >= 2
    ? seedPieces.filter(p =>
        (p.title.toLowerCase().includes(search.toLowerCase()) ||
         p.composer_name.toLowerCase().includes(search.toLowerCase())) &&
        !playlist.some(pl => pl.piece_id === p.id)
      ).slice(0, 6)
    : [];

  if (loading) return <div className="text-sm text-muted">Loading...</div>;

  return (
    <div>
      <p className="text-sm text-muted mb-4">
        Curate the site-wide playlist. This will power the streaming feature when it launches.
        {playlist.length > 0 && ` ${playlist.length} pieces in the playlist.`}
      </p>

      {/* Add piece search */}
      <div className="relative mb-6">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search pieces to add..."
          className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent"
        />
        {searchResults.length > 0 && (
          <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-bg border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto">
            {searchResults.map(p => (
              <button
                key={p.id}
                onClick={() => { addPiece(p.id); setSearch(''); }}
                className="w-full text-left px-3 py-2 text-sm hover:bg-accent-soft bg-transparent border-none cursor-pointer"
              >
                <span className="font-medium">{p.title}</span>
                <span className="text-muted ml-1">— {p.composer_name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Playlist */}
      {playlist.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-border rounded-xl">
          <p className="text-sm text-muted">Playlist is empty. Search above to add pieces.</p>
        </div>
      ) : (
        <div className="space-y-1">
          {playlist.map((item, i) => {
            const piece = seedPieces.find(p => p.id === item.piece_id);
            return (
              <div key={item.id} className="flex items-center gap-3 bg-surface border border-border rounded-lg px-4 py-2 group">
                <span className="font-mono text-xs text-muted w-6 text-right">{item.position}</span>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium text-ink">{piece?.title || item.piece_id}</span>
                  {piece && <span className="text-xs text-muted ml-2">{piece.composer_name}</span>}
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => movePiece(i, -1)} disabled={i === 0}
                    className="text-muted hover:text-ink bg-transparent border-none cursor-pointer p-1 disabled:opacity-30 text-xs">↑</button>
                  <button onClick={() => movePiece(i, 1)} disabled={i === playlist.length - 1}
                    className="text-muted hover:text-ink bg-transparent border-none cursor-pointer p-1 disabled:opacity-30 text-xs">↓</button>
                  <button onClick={() => removePiece(item.id)}
                    className="text-muted hover:text-red-600 bg-transparent border-none cursor-pointer p-1 text-xs">x</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

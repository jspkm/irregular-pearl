import { useState } from 'react';
import GenerativeAvatar from './GenerativeAvatar';
import ApplaudButton from './ApplaudButton';

interface Artist {
  id: string;
  display_name: string;
  instrument: string | null;
  level: string | null;
  avatar_url: string | null;
  vanity_slug: string | null;
  created_at: string;
}

interface RecentActivityEntry {
  piece_title: string;
  activity: string;
  created_at: string;
}

interface CommunityGridProps {
  artists: Artist[];
  applauseCounts: Record<string, number>;
  recentActivity: Record<string, RecentActivityEntry>;
  recentlyActive: string[];
  allInstruments: string[];
  newMembers: Artist[];
}

function applauseText(count: number): string {
  if (count === 0) return '';
  return count === 1 ? '1 applause' : `${count} applause`;
}

const LEVEL_CLASSES: Record<string, string> = {
  professional: 'bg-accent-light text-[#92400E] border border-accent-border',
  teacher: 'bg-success-bg text-success border border-[#BBF7D0]',
};

export default function CommunityGrid({
  artists,
  applauseCounts,
  recentActivity,
  recentlyActive,
  allInstruments,
  newMembers,
}: CommunityGridProps) {
  const [filter, setFilter] = useState('All');

  // Sort: recently active first, then everyone else
  const activeSet = new Set(recentlyActive);
  const sorted = [
    ...recentlyActive.map(id => artists.find(a => a.id === id)!).filter(Boolean),
    ...artists.filter(a => !activeSet.has(a.id)),
  ];

  const filtered = sorted.filter(a => {
    if (filter === 'All') return true;
    const instruments = (a.instrument || '').split(',').map(i => i.trim().toLowerCase());
    return instruments.includes(filter.toLowerCase());
  });

  const tabs = ['All', ...allInstruments.slice(0, 5)];

  return (
    <>
      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`text-[13px] font-medium px-4 py-1.5 rounded-full border cursor-pointer transition-all font-body ${
              filter === tab
                ? 'bg-accent border-accent text-white'
                : 'bg-surface border-border text-muted hover:border-accent hover:text-ink'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Members */}
      <section className="mb-10">
        <div className="flex items-center gap-2 mb-4">
          <h2 className="font-['Instrument_Serif'] text-xl">Members</h2>
          <span className="text-xs text-muted bg-bg border border-border px-2 py-0.5 rounded-full">
            {filtered.length} musician{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>

        {filtered.length === 0 ? (
          <div className="border border-dashed border-border rounded-lg py-8 text-center">
            <p className="text-sm text-muted">No musicians found{filter !== 'All' ? ` playing ${filter}` : ''}.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(artist => (
              <ArtistCard
                key={artist.id}
                artist={artist}
                applauseCount={applauseCounts[artist.id] || 0}
                workingOn={recentActivity[artist.id]}
              />
            ))}
          </div>
        )}
      </section>

      {/* New Members */}
      {newMembers.length > 0 && (
        <section className="mb-10">
          <h2 className="font-['Instrument_Serif'] text-xl mb-4">New Members</h2>
          <div className="flex gap-3 flex-wrap">
            {newMembers.map(m => (
              <a
                key={m.id}
                href={m.vanity_slug ? `/@${m.vanity_slug}` : `/profile/${m.id}`}
                className="flex items-center gap-2 px-3 py-1.5 pl-1.5 bg-surface border border-border rounded-full text-xs font-medium text-ink hover:border-accent transition-all no-underline"
              >
                <div className="w-6 h-6 flex-shrink-0">
                  {m.avatar_url ? (
                    <img src={m.avatar_url} alt="" className="w-6 h-6 rounded-full object-cover" />
                  ) : (
                    <GenerativeAvatar userId={m.id} size={24} />
                  )}
                </div>
                {m.display_name}
              </a>
            ))}
          </div>
        </section>
      )}
    </>
  );
}

function ArtistCard({
  artist,
  applauseCount,
  workingOn,
}: {
  artist: Artist;
  applauseCount: number;
  workingOn?: RecentActivityEntry;
}) {
  const instruments = (artist.instrument || '').split(',').map(i => i.trim()).filter(Boolean);
  const levelClass = LEVEL_CLASSES[artist.level || ''] || 'bg-bg border border-border';

  return (
    <div className="bg-surface border border-border rounded-lg p-5 hover:border-accent transition-all">
      <a href={artist.vanity_slug ? `/@${artist.vanity_slug}` : `/profile/${artist.id}`} className="no-underline">
        <div className="flex gap-3 items-start mb-3">
          <div className="w-12 h-12 flex-shrink-0">
            {artist.avatar_url ? (
              <img src={artist.avatar_url} alt="" className="w-12 h-12 rounded-full object-cover" />
            ) : (
              <GenerativeAvatar userId={artist.id} size={48} />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-['Instrument_Serif'] text-[17px] text-ink leading-tight">{artist.display_name}</div>
            <div className="flex items-center gap-2 text-xs text-muted mt-0.5">
              {instruments[0] || 'Musician'}
              {artist.level && (
                <span className={`text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0 rounded ${levelClass}`}>
                  {artist.level}
                </span>
              )}
            </div>
          </div>
        </div>

        {workingOn && (
          <div className="text-xs text-muted mb-3 truncate">
            Working on <span className="font-medium text-ink">{workingOn.piece_title}</span>
          </div>
        )}
      </a>

      <div className="pt-3 border-t border-border">
        <ApplaudButton artistId={artist.id} compact client:idle />
      </div>
    </div>
  );
}

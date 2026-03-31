import { useState } from 'react';
import { StarRating } from './StarRating';
import { extractYouTubeId } from '../lib/helpers';
import type { SeedPiece } from '../data/seed';

interface PieceTabsProps {
  piece: SeedPiece;
}

type Tab = 'overview' | 'editions' | 'recordings' | 'history';

export default function PieceTabs({ piece }: PieceTabsProps) {
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  const recordingTypes = ['youtube', 'spotify', 'soundcloud', 'bandcamp', 'internet_archive', 'vimeo'];
  const recordingLinks = piece.external_links.filter(l => recordingTypes.includes(l.type));
  const otherLinks = piece.external_links.filter(l => !recordingTypes.includes(l.type));

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'editions', label: 'Editions', count: piece.editions.length },
    { id: 'recordings', label: 'Recordings', count: recordingLinks.length || undefined },
    { id: 'history', label: 'History' },
  ];

  return (
    <div>
      {/* Tab bar */}
      <div className="flex gap-0 border-b border-gray-200 mb-6 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 md:px-5 py-2.5 text-sm whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? 'font-semibold text-[#1C1917] border-b-2 border-[#B45309]'
                : 'text-gray-500 border-b-2 border-transparent hover:text-gray-700'
            }`}
          >
            {tab.label}
            {tab.count !== undefined && ` (${tab.count})`}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'overview' && (
        <div>
          <p className="text-sm md:text-base leading-relaxed text-gray-600 mb-8">
            {piece.description}
          </p>

          {/* Editions preview */}
          <section className="mb-8">
            <h2 className="text-base font-semibold mb-3">Editions</h2>
            <div className="space-y-2">
              {piece.editions.map((edition) => (
                <EditionCardCompact
                  key={edition.id}
                  publisher={edition.publisher}
                  editor={edition.editor}
                  year={edition.year}
                  description={edition.description}
                />
              ))}
              {piece.editions.length === 0 && (
                <p className="text-sm text-gray-400 italic">
                  No editions listed yet. Know of a good edition? Sign in to suggest one.
                </p>
              )}
            </div>
          </section>

          {/* Resources */}
          <section className="mb-8">
            <h2 className="text-base font-semibold mb-3">Resources</h2>
            <div className="space-y-1">
              {piece.external_links.map((link, i) => (
                <a
                  key={i}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 py-2 px-1 text-sm text-gray-600 hover:text-gray-900 border-b border-gray-50 last:border-0"
                >
                  <span className="w-5 h-5 bg-gray-100 rounded flex items-center justify-center text-[10px] text-gray-500 flex-shrink-0">
                    {link.type === 'imslp' ? '♫' : link.type === 'youtube' ? '▶' : 'W'}
                  </span>
                  {link.label}
                </a>
              ))}
            </div>
          </section>
        </div>
      )}

      {activeTab === 'editions' && (
        <div>
          <p className="text-sm text-gray-500 mb-4">
            Compare editions to find the best one for your needs. Ratings are from the Irregular Pearl community.
          </p>
          <div className="space-y-3">
            {piece.editions.map((edition) => (
              <EditionCardFull
                key={edition.id}
                id={edition.id}
                publisher={edition.publisher}
                editor={edition.editor}
                year={edition.year}
                description={edition.description}
              />
            ))}
          </div>
        </div>
      )}

      {activeTab === 'recordings' && (
        <div>
          {recordingLinks.length > 0 ? (
            <div className="space-y-2">
              {recordingLinks.map((link, i) => (
                <RecordingCard key={i} url={link.url} label={link.label} type={link.type} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 italic py-8 text-center">
              No recordings linked yet. Know of a great recording? Sign in to suggest one.
            </p>
          )}
        </div>
      )}

      {activeTab === 'history' && (
        <div className="text-sm leading-relaxed text-gray-600">
          <p className="mb-4">{piece.description}</p>
          <div className="bg-gray-50 rounded-lg p-4 text-xs text-gray-500">
            <p className="font-medium text-gray-600 mb-2">Details</p>
            <div className="grid grid-cols-2 gap-2">
              <div>Composer: <span className="text-gray-800">{piece.composer_name}</span></div>
              {piece.catalog_number && <div>Catalog: <span className="text-gray-800">{piece.catalog_number}</span></div>}
              <div>Era: <span className="text-gray-800">{piece.era}</span></div>
              <div>Form: <span className="text-gray-800">{piece.form}</span></div>
              {piece.duration_minutes && <div>Duration: <span className="text-gray-800">~{piece.duration_minutes} min</span></div>}
              <div>Difficulty: <span className="text-gray-800 capitalize">{piece.difficulty}</span></div>
              <div>Instruments: <span className="text-gray-800">{piece.instruments.join(', ')}</span></div>
              <div>Editions listed: <span className="text-gray-800">{piece.editions.length}</span></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- Subcomponents ---

const PLATFORM_STYLES: Record<string, { bg: string; text: string; name: string }> = {
  youtube: { bg: 'bg-red-50', text: 'text-red-500', name: 'YouTube' },
  spotify: { bg: 'bg-green-50', text: 'text-green-600', name: 'Spotify' },
  soundcloud: { bg: 'bg-orange-50', text: 'text-orange-500', name: 'SoundCloud' },
  bandcamp: { bg: 'bg-blue-50', text: 'text-blue-500', name: 'Bandcamp' },
  internet_archive: { bg: 'bg-amber-50', text: 'text-amber-600', name: 'Internet Archive' },
  vimeo: { bg: 'bg-cyan-50', text: 'text-cyan-600', name: 'Vimeo' },
};

function getEmbedUrl(url: string, type: string): string | null {
  if (type === 'youtube') {
    const id = extractYouTubeId(url);
    return id ? `https://www.youtube.com/embed/${id}?autoplay=1` : null;
  }
  if (type === 'spotify') {
    // https://open.spotify.com/track/XXX → https://open.spotify.com/embed/track/XXX
    const m = url.match(/open\.spotify\.com\/(track|album|playlist)\/([a-zA-Z0-9]+)/);
    return m ? `https://open.spotify.com/embed/${m[1]}/${m[2]}` : null;
  }
  if (type === 'soundcloud') {
    return `https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}&auto_play=true&visual=true`;
  }
  if (type === 'bandcamp') {
    return null; // Bandcamp embeds need album/track IDs, link out instead
  }
  if (type === 'vimeo') {
    const m = url.match(/vimeo\.com\/(\d+)/);
    return m ? `https://player.vimeo.com/video/${m[1]}?autoplay=1` : null;
  }
  return null;
}

function RecordingCard({ url, label, type }: { url: string; label: string; type: string }) {
  const [expanded, setExpanded] = useState(false);
  const style = PLATFORM_STYLES[type] || { bg: 'bg-gray-50', text: 'text-gray-500', name: type };
  const embedUrl = getEmbedUrl(url, type);
  const isAudioOnly = ['spotify', 'soundcloud', 'bandcamp', 'internet_archive'].includes(type);

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors text-left bg-transparent border-none cursor-pointer"
      >
        <div className={`w-10 h-10 ${style.bg} rounded-lg flex items-center justify-center ${style.text} flex-shrink-0`}>
          {expanded ? '▼' : isAudioOnly ? '♫' : '▶'}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-800">{label}</p>
          <p className="text-xs text-gray-400">{style.name}</p>
        </div>
      </button>
      {expanded && embedUrl && (
        <div className="relative w-full" style={{ paddingBottom: isAudioOnly ? '80px' : '56.25%', height: isAudioOnly ? '80px' : undefined }}>
          <iframe
            className={isAudioOnly ? 'w-full' : 'absolute inset-0 w-full h-full'}
            style={isAudioOnly ? { height: '80px' } : undefined}
            src={embedUrl}
            title={label}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen={!isAudioOnly}
          />
        </div>
      )}
      {expanded && !embedUrl && (
        <a href={url} target="_blank" rel="noopener noreferrer"
          className="block px-3 pb-3 text-sm text-[#B45309] hover:underline no-underline">
          Open on {style.name} →
        </a>
      )}
    </div>
  );
}

function EditionCardCompact({ publisher, editor, year, description }: {
  publisher: string; editor: string; year: number | null; description: string;
}) {
  return (
    <div className="border border-gray-200 rounded-lg p-3 md:p-4 bg-white">
      <div className="flex justify-between items-start gap-4">
        <div className="min-w-0">
          <h3 className="font-semibold text-sm">{publisher}</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {editor}{year ? `, ${year}` : ''}
          </p>
          <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">{description}</p>
        </div>
        <div className="text-right flex-shrink-0">
          <StarRating rating={0} size="sm" />
          <div className="text-[11px] text-gray-400 mt-0.5">0 reviews</div>
        </div>
      </div>
    </div>
  );
}

function EditionCardFull({ id, publisher, editor, year, description }: {
  id: string; publisher: string; editor: string; year: number | null; description: string;
}) {
  const [userRating, setUserRating] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [showReviewForm, setShowReviewForm] = useState(false);

  const handleRate = (rating: number) => {
    setUserRating(rating);
    setShowReviewForm(true);
    // TODO: Wire to Supabase edition_reviews
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-white">
      <div className="flex justify-between items-start gap-4 mb-3">
        <div className="min-w-0">
          <h3 className="font-semibold text-sm">{publisher}</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {editor}{year ? `, ${year}` : ''}
          </p>
        </div>
        <div className="text-right flex-shrink-0">
          <StarRating rating={0} size="sm" />
          <div className="text-[11px] text-gray-400 mt-0.5">0 reviews</div>
        </div>
      </div>

      <p className="text-xs text-gray-500 leading-relaxed mb-3">{description}</p>

      {/* Rate this edition */}
      <div className="border-t border-gray-100 pt-3">
        <p className="text-xs text-gray-500 mb-2">
          {userRating > 0 ? 'Your rating:' : 'Have you played from this edition? Rate it:'}
        </p>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => handleRate(star)}
              onMouseEnter={() => setHoveredStar(star)}
              onMouseLeave={() => setHoveredStar(0)}
              className="text-lg transition-colors"
            >
              <span className={
                star <= (hoveredStar || userRating)
                  ? 'text-[#D97706]'
                  : 'text-gray-300'
              }>
                ★
              </span>
            </button>
          ))}
        </div>

        {showReviewForm && (
          <div className="mt-2">
            <textarea
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="Optional: explain your rating..."
              className="w-full border border-gray-200 rounded-md px-3 py-2 text-xs resize-none h-16 focus:outline-none focus:border-gray-400"
            />
            <div className="flex justify-end gap-2 mt-1">
              <button
                onClick={() => { setShowReviewForm(false); setUserRating(0); }}
                className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1"
              >
                Cancel
              </button>
              <button
                className="text-xs bg-gray-900 text-white px-3 py-1 rounded-md hover:bg-gray-800"
              >
                Submit
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

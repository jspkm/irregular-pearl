import { useState } from 'react';
import { StarRating } from './StarRating';
import type { SeedPiece } from '../data/seed';

function extractYouTubeId(url: string): string | null {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
}

interface PieceTabsProps {
  piece: SeedPiece;
}

type Tab = 'overview' | 'editions' | 'recordings' | 'history';

export default function PieceTabs({ piece }: PieceTabsProps) {
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'editions', label: 'Editions', count: piece.editions.length },
    { id: 'recordings', label: 'Recordings' },
    { id: 'history', label: 'History' },
  ];

  const youtubeLinks = piece.external_links.filter(l => l.type === 'youtube');
  const otherLinks = piece.external_links.filter(l => l.type !== 'youtube');

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
          {youtubeLinks.length > 0 ? (
            <div className="space-y-2">
              {youtubeLinks.map((link, i) => (
                <RecordingCard key={i} url={link.url} label={link.label} />
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

function RecordingCard({ url, label }: { url: string; label: string }) {
  const [expanded, setExpanded] = useState(false);
  const videoId = extractYouTubeId(url);

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors text-left"
      >
        <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center text-red-500 flex-shrink-0">
          {expanded ? '▼' : '▶'}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-800">{label}</p>
          <p className="text-xs text-gray-400">YouTube</p>
        </div>
      </button>
      {expanded && videoId && (
        <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
          <iframe
            className="absolute inset-0 w-full h-full"
            src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
            title={label}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      )}
      {expanded && !videoId && (
        <a href={url} target="_blank" rel="noopener noreferrer"
          className="block px-3 pb-3 text-sm text-blue-600 hover:underline">
          Open in YouTube →
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

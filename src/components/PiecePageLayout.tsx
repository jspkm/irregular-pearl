import { useState, useRef, useCallback, useEffect } from 'react';
import WorkingOnButton from './WorkingOnButton';
import PieceTabs from './PieceTabs';
import DiscussionSidebar from './DiscussionSidebar';
import type { SeedPiece } from '../data/seed';

interface PiecePageLayoutProps {
  piece: SeedPiece;
}

export default function PiecePageLayout({ piece }: PiecePageLayoutProps) {
  const defaultWidth = 340;
  const minWidth = 280;
  const maxWidth = 900;

  const [sidebarWidth, setSidebarWidth] = useState(defaultWidth);
  const [isDragging, setIsDragging] = useState(false);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    startXRef.current = e.clientX;
    startWidthRef.current = sidebarWidth;
  }, [sidebarWidth]);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const delta = startXRef.current - e.clientX;
      const newWidth = Math.min(maxWidth, Math.max(minWidth, startWidthRef.current + delta));
      setSidebarWidth(newWidth);
    };

    const handleMouseUp = () => setIsDragging(false);

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDragging]);

  const isExpanded = sidebarWidth > defaultWidth + 100;

  return (
    <div className="relative min-h-[calc(100vh-8rem)]">
      <div className="flex h-full">
        {/* Main content */}
        <main className="flex-1 min-w-0 px-4 md:px-8 lg:px-10 py-6 md:py-8">
          <div className="mb-6">
            <h1 className="font-['Instrument_Serif'] text-xl md:text-2xl lg:text-[28px] leading-tight mb-1">
              {piece.title}
              {piece.catalog_number && (
                <span className="font-['JetBrains_Mono'] text-[#78716C] text-sm md:text-base">, {piece.catalog_number}</span>
              )}
            </h1>
            <p className="text-sm md:text-base text-[#78716C] mb-3">
              by <span className="text-[#1C1917] underline decoration-[#E7E5E4]">{piece.composer_name}</span>
            </p>
            <div className="flex flex-wrap items-center gap-2 mb-4 text-xs md:text-sm text-[#78716C]">
              {piece.instruments.map((inst) => (
                <span key={inst} className="bg-[#FAF8F5] border border-[#E7E5E4] px-2 py-0.5 rounded">{inst}</span>
              ))}
              <span className="bg-[#FAF8F5] border border-[#E7E5E4] px-2 py-0.5 rounded">{piece.era}</span>
              <span className="bg-[#FAF8F5] border border-[#E7E5E4] px-2 py-0.5 rounded">{piece.form}</span>
              {piece.duration_minutes && <span>~{piece.duration_minutes} min</span>}
              <span className="capitalize">{piece.difficulty}</span>
            </div>
            <WorkingOnButton pieceId={piece.id} />
          </div>
          <PieceTabs piece={piece} />
        </main>

        {/* Drag handle — the divider */}
        <div
          onMouseDown={handleMouseDown}
          className="w-[1px] flex-shrink-0 relative group hidden md:block"
          style={{ cursor: 'col-resize', zIndex: isExpanded ? 40 : 0 }}
        >
          <div className={`absolute inset-0 transition-colors ${
            isDragging ? 'bg-[#B45309]' : 'bg-[#E7E5E4] group-hover:bg-[#B45309]/40'
          }`} />
          {/* Wider invisible hit target */}
          <div className="absolute inset-y-0 -left-3 -right-3" />
        </div>

        {/* Sidebar — desktop */}
        <aside
          className={`flex-shrink-0 bg-white hidden md:block ${isExpanded ? 'z-40 shadow-2xl' : ''}`}
          style={{ width: `${sidebarWidth}px` }}
        >
          <div className="px-4 md:px-5 py-6 md:py-8 h-full">
            <DiscussionSidebar pieceId={piece.id} pieceTitle={piece.title} sidebarWidth={sidebarWidth} />
          </div>
        </aside>
      </div>

      {/* Mobile: sidebar below content */}
      <div className="md:hidden bg-white px-4 py-6">
        <DiscussionSidebar pieceId={piece.id} pieceTitle={piece.title} />
      </div>
    </div>
  );
}

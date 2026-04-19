import PieceTabs from './PieceTabs';
import type { SeedPiece } from '../data/seed';

interface PiecePageLayoutProps {
  piece: SeedPiece;
}

export default function PiecePageLayout({ piece }: PiecePageLayoutProps) {
  return (
    <main className="px-4 md:px-8 lg:px-10 py-6 md:py-8">
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
      </div>
      <PieceTabs piece={piece} />
    </main>
  );
}

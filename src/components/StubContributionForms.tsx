import { useState, useRef } from 'react';

interface Movement {
  name: string;
  pieceId?: string;
}

interface Props {
  pieceId: string;
  existingDescription: string;
  existingMovements: Movement[];
}

const NUMERALS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];

export default function StubContributionForms({ pieceId, existingDescription, existingMovements }: Props) {
  const [description, setDescription] = useState(existingDescription || '');
  const [editing, setEditing] = useState(false);
  const [movements, setMovements] = useState<string[]>(existingMovements.map(m => m.name));
  const [newMovement, setNewMovement] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const movementInputRef = useRef<HTMLInputElement>(null);

  const handleDescriptionClick = () => {
    if (!editing) {
      setEditing(true);
      setTimeout(() => textareaRef.current?.focus(), 0);
    }
  };

  const handleCancel = () => {
    setEditing(false);
    setDescription(existingDescription || '');
  };

  const addMovement = () => {
    const name = newMovement.trim();
    if (!name) return;
    setMovements(prev => [...prev, name]);
    setNewMovement('');
    movementInputRef.current?.focus();
  };

  const removeMovement = (index: number) => {
    setMovements(prev => prev.filter((_, i) => i !== index));
  };

  const handleMovementKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addMovement();
    }
  };

  return (
    <div>
      {/* Description section */}
      <div className="mb-8">
        <div className="font-sans font-semibold text-[11px] text-muted uppercase tracking-wider mb-2.5">
          About this piece
        </div>
        <div
          onClick={handleDescriptionClick}
          className={`border rounded-lg p-4 min-h-25 cursor-text transition-all ${
            editing
              ? 'border-accent border-solid bg-surface'
              : 'border-dashed border-border hover:border-[#C4C0BC]'
          }`}
        >
          {editing ? (
            <>
              <textarea
                ref={textareaRef}
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Shostakovich composed this quartet in just three days while visiting Dresden in 1960. Officially dedicated 'to the victims of fascism and war,' many scholars believe it was a deeply personal work..."
                className="w-full min-h-[110px] border-none outline-none font-sans text-[14px] leading-[1.7] text-ink bg-transparent resize-y"
              />
              <div className="flex justify-between items-center mt-2.5">
                <span className="text-[11px] text-muted">Markdown supported</span>
                <span className="flex gap-1.5">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleCancel(); }}
                    className="px-3 py-1 rounded-md font-sans font-medium text-[12px] text-muted bg-transparent border-none cursor-pointer hover:text-ink transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={(e) => e.stopPropagation()}
                    className="px-3 py-1 rounded-md font-sans font-medium text-[12px] text-bg bg-accent border-none cursor-pointer hover:bg-accent-hover transition-colors"
                  >
                    Save
                  </button>
                </span>
              </div>
            </>
          ) : (
            <p className="text-[#B8B4B0] text-[14px] leading-[1.7] pointer-events-none">
              What makes this piece remarkable? Add historical context, performance notes, or what musicians should know...
            </p>
          )}
        </div>
        {!editing && !description && (
          <p className="text-[13px] text-muted italic mt-2.5 font-display">
            No description yet. Be the first to write about this piece.
          </p>
        )}
      </div>

      {/* Movements section */}
      <div className="mb-8">
        <div className="font-sans font-semibold text-[11px] text-muted uppercase tracking-wider mb-2.5">
          Movements
        </div>

        {movements.length > 0 && (
          <ul className="list-none p-0 m-0">
            {movements.map((name, i) => (
              <li
                key={i}
                className="flex items-baseline gap-3.5 py-2.5 border-b border-border first:border-t group"
              >
                <span className="font-mono text-[11px] text-muted w-7 text-right flex-shrink-0">
                  {NUMERALS[i] || i + 1}.
                </span>
                <span className="text-[14px]">{name}</span>
                <button
                  onClick={() => removeMovement(i)}
                  className="ml-auto bg-none border-none text-border cursor-pointer text-[16px] leading-none px-0.5 opacity-0 group-hover:opacity-100 hover:text-[#DC2626] transition-all"
                >
                  &times;
                </button>
              </li>
            ))}
          </ul>
        )}

        {/* Add movement widget */}
        <div className="flex items-center gap-2 py-2 mt-0.5">
          <span className="font-mono text-[11px] text-muted w-7 text-right flex-shrink-0">
            {NUMERALS[movements.length] || movements.length + 1}.
          </span>
          <input
            ref={movementInputRef}
            type="text"
            value={newMovement}
            onChange={e => setNewMovement(e.target.value)}
            onKeyDown={handleMovementKeyDown}
            placeholder="e.g. Largo, Allegro vivace, Andante con moto..."
            className="flex-1 py-1.5 px-2.5 border border-border rounded-md font-sans text-[13px] text-ink bg-surface outline-none focus:border-accent transition-colors"
          />
          <button
            onClick={addMovement}
            className="py-1.5 px-3.5 bg-accent text-bg border-none rounded-md font-sans font-medium text-[12px] cursor-pointer hover:bg-accent-hover transition-colors whitespace-nowrap"
          >
            Add
          </button>
        </div>

        {movements.length === 0 && (
          <p className="text-[13px] text-muted italic mt-2 font-display">
            No movements listed yet. Add the first one above.
          </p>
        )}
      </div>
    </div>
  );
}

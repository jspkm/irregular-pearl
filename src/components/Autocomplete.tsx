import { useState, useRef, useEffect } from 'react';

interface Props {
  id: string;
  name: string;
  placeholder?: string;
  required?: boolean;
  maxLength?: number;
  suggestions: string[];
  value?: string;
  onChange?: (value: string) => void;
  className?: string;
}

export default function Autocomplete({
  id, name, placeholder, required, maxLength,
  suggestions, value: controlledValue, onChange, className,
}: Props) {
  const [value, setValue] = useState(controlledValue || '');
  const [filtered, setFiltered] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    if (controlledValue !== undefined) setValue(controlledValue);
  }, [controlledValue]);

  function handleInput(text: string) {
    setValue(text);
    onChange?.(text);

    if (text.length < 1) {
      setFiltered([]);
      setOpen(false);
      return;
    }

    const lower = text.toLowerCase();
    const matches = suggestions
      .filter(s => s.toLowerCase().includes(lower))
      .slice(0, 8);
    setFiltered(matches);
    setOpen(matches.length > 0);
    setActiveIndex(-1);
  }

  function select(item: string) {
    setValue(item);
    onChange?.(item);
    setOpen(false);
    setActiveIndex(-1);
    inputRef.current?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open || filtered.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(i => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault();
      select(filtered[activeIndex]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  }

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (!listRef.current?.contains(e.target as Node) && e.target !== inputRef.current) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        id={id}
        name={name}
        value={value}
        placeholder={placeholder}
        required={required}
        maxLength={maxLength}
        autoComplete="off"
        onChange={e => handleInput(e.target.value)}
        onFocus={() => { if (value && filtered.length > 0) setOpen(true); }}
        onKeyDown={handleKeyDown}
        className={className}
      />
      {open && filtered.length > 0 && (
        <ul
          ref={listRef}
          className="absolute z-50 left-0 right-0 mt-1 bg-bg border border-border rounded-lg shadow-sm max-h-48 overflow-y-auto list-none p-0 m-0"
        >
          {filtered.map((item, i) => (
            <li
              key={item}
              onMouseDown={() => select(item)}
              className={`px-3 py-2 text-sm cursor-pointer transition-colors ${
                i === activeIndex
                  ? 'bg-accent-soft text-ink'
                  : 'text-muted hover:bg-bg'
              }`}
            >
              {item}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

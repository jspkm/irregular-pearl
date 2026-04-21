import { useEffect, useState } from 'react';
import { getStoredTheme, setTheme, type ThemePreference } from '../lib/theme';

const OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: 'light', label: 'Light' },
  { value: 'system', label: 'System' },
  { value: 'dark', label: 'Dark' },
];

export default function AppearanceSettings() {
  const [current, setCurrent] = useState<ThemePreference>('system');

  useEffect(() => {
    setCurrent(getStoredTheme());
  }, []);

  const handleSelect = (value: ThemePreference) => {
    setCurrent(value);
    setTheme(value);
  };

  return (
    <div>
      <h2 className="text-sm font-medium text-ink mb-1">Appearance</h2>
      <p className="text-xs text-muted mb-5">Choose how Irregular Pearl looks on this device.</p>

      <div className="grid grid-cols-3 gap-3 md:gap-4 max-w-[520px]">
        {OPTIONS.map((opt) => (
          <ThemeOption
            key={opt.value}
            value={opt.value}
            label={opt.label}
            selected={current === opt.value}
            onSelect={handleSelect}
          />
        ))}
      </div>
    </div>
  );
}

function ThemeOption({
  value,
  label,
  selected,
  onSelect,
}: {
  value: ThemePreference;
  label: string;
  selected: boolean;
  onSelect: (v: ThemePreference) => void;
}) {
  return (
    <a
      href="#"
      onClick={(e) => {
        e.preventDefault();
        onSelect(value);
      }}
      className="group block no-underline"
      aria-pressed={selected}
    >
      <div
        className={`rounded-lg overflow-hidden border transition-colors ${
          selected
            ? 'border-accent ring-1 ring-accent'
            : 'border-border group-hover:border-border-strong'
        }`}
        style={{ borderWidth: '0.5px' }}
      >
        <ThemePreview variant={value} />
      </div>
      <div className="flex items-center gap-1.5 mt-2 text-xs">
        <span
          className={`inline-block w-3 h-3 rounded-full border ${
            selected ? 'border-accent' : 'border-border-strong'
          }`}
          style={{ borderWidth: '0.5px' }}
        >
          {selected && (
            <span className="block w-1.5 h-1.5 rounded-full bg-accent mx-auto mt-[3px]" />
          )}
        </span>
        <span className={selected ? 'text-ink font-medium' : 'text-ink'}>{label}</span>
      </div>
    </a>
  );
}

function ThemePreview({ variant }: { variant: ThemePreference }) {
  if (variant === 'system') {
    return (
      <svg viewBox="0 0 160 100" className="w-full h-auto block" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <clipPath id="sys-left">
            <polygon points="0,0 160,0 0,100" />
          </clipPath>
          <clipPath id="sys-right">
            <polygon points="160,0 160,100 0,100" />
          </clipPath>
        </defs>
        <g clipPath="url(#sys-left)">
          <PreviewGraphic palette={LIGHT} />
        </g>
        <g clipPath="url(#sys-right)">
          <PreviewGraphic palette={DARK} />
        </g>
        <line x1="160" y1="0" x2="0" y2="100" stroke="#CCC9C2" strokeWidth="0.5" />
      </svg>
    );
  }

  const palette = variant === 'dark' ? DARK : LIGHT;
  return (
    <svg viewBox="0 0 160 100" className="w-full h-auto block" xmlns="http://www.w3.org/2000/svg">
      <PreviewGraphic palette={palette} />
    </svg>
  );
}

type Palette = {
  bg: string;
  surface: string;
  ink: string;
  muted: string;
  border: string;
  accent: string;
};

const LIGHT: Palette = {
  bg: '#FFFFFF',
  surface: '#F8F7F4',
  ink: '#1A1A1A',
  muted: '#9A9A9A',
  border: '#E5E3DE',
  accent: '#6B4E7C',
};

const DARK: Palette = {
  bg: '#1A1A1A',
  surface: '#242320',
  ink: '#F0EFEC',
  muted: '#77756F',
  border: '#3A3732',
  accent: '#B299C4',
};

function PreviewGraphic({ palette }: { palette: Palette }) {
  return (
    <g>
      <rect width="160" height="100" fill={palette.bg} />
      <rect x="0" y="0" width="160" height="16" fill={palette.surface} />
      <line x1="0" y1="16" x2="160" y2="16" stroke={palette.border} strokeWidth="0.5" />
      <text x="8" y="11" fontFamily="Georgia, serif" fontStyle="italic" fontSize="8" fill={palette.ink}>
        IP
      </text>
      <circle cx="150" cy="8" r="3" fill={palette.accent} />
      <rect x="10" y="28" width="70" height="5" rx="1" fill={palette.ink} opacity="0.85" />
      <rect x="10" y="40" width="120" height="3" rx="1" fill={palette.muted} />
      <rect x="10" y="48" width="100" height="3" rx="1" fill={palette.muted} />
      <rect x="10" y="56" width="110" height="3" rx="1" fill={palette.muted} />
      <rect x="10" y="72" width="28" height="10" rx="2" fill={palette.accent} />
      <rect x="44" y="72" width="28" height="10" rx="2" fill="none" stroke={palette.border} strokeWidth="0.5" />
    </g>
  );
}

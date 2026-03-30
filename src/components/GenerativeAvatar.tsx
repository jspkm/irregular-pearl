// Generates a deterministic composer avatar from a user ID.
// Each user gets a unique composer character with a randomized background.

const COMPOSERS = [
  {
    name: 'Mozart',
    // Powdered wig, red coat, cheerful
    svg: (bg: string) => `<rect width="24" height="24" rx="12" fill="${bg}"/>
      <circle cx="12" cy="10" r="6" fill="#F5F0E8"/>
      <circle cx="12" cy="14" r="5" fill="#FCEBD5"/>
      <ellipse cx="12" cy="16" rx="3.5" ry="2.5" fill="#C43C3C"/>
      <circle cx="8" cy="6" r="2.5" fill="#E8E0D0"/>
      <circle cx="16" cy="6" r="2.5" fill="#E8E0D0"/>
      <circle cx="12" cy="5" r="3" fill="#E8E0D0"/>
      <circle cx="10.5" cy="13" r="0.7" fill="#4A3728"/>
      <circle cx="13.5" cy="13" r="0.7" fill="#4A3728"/>
      <path d="M10.8 15.2 Q12 16 13.2 15.2" stroke="#4A3728" stroke-width="0.5" fill="none"/>`,
  },
  {
    name: 'Beethoven',
    // Wild dark hair, intense brow, dark coat
    svg: (bg: string) => `<rect width="24" height="24" rx="12" fill="${bg}"/>
      <path d="M6 8 Q7 3 12 4 Q17 3 18 8 Q19 6 18 4 Q14 1 12 2 Q10 1 6 4 Q5 6 6 8Z" fill="#3D2B1F"/>
      <circle cx="12" cy="13" r="5" fill="#FCEBD5"/>
      <ellipse cx="12" cy="16" rx="3.5" ry="2.5" fill="#2C2C2C"/>
      <path d="M7 7 Q8 4 12 5 Q16 4 17 7 Q18 5 16 3 Q12 1 8 3 Q6 5 7 7Z" fill="#3D2B1F"/>
      <rect x="9" y="11.5" width="2" height="0.6" rx="0.3" fill="#3D2B1F"/>
      <rect x="13" y="11.5" width="2" height="0.6" rx="0.3" fill="#3D2B1F"/>
      <circle cx="10.5" cy="13" r="0.7" fill="#4A3728"/>
      <circle cx="13.5" cy="13" r="0.7" fill="#4A3728"/>
      <path d="M11 15.5 L13 15.5" stroke="#4A3728" stroke-width="0.5"/>`,
  },
  {
    name: 'Bach',
    // Curly baroque wig, round face, jovial
    svg: (bg: string) => `<rect width="24" height="24" rx="12" fill="${bg}"/>
      <circle cx="12" cy="13" r="5.5" fill="#FCEBD5"/>
      <ellipse cx="12" cy="16.5" rx="3.5" ry="2" fill="#3D3D5C"/>
      <circle cx="7" cy="8" r="2.5" fill="#8B8078"/>
      <circle cx="17" cy="8" r="2.5" fill="#8B8078"/>
      <circle cx="9" cy="6" r="2" fill="#8B8078"/>
      <circle cx="15" cy="6" r="2" fill="#8B8078"/>
      <circle cx="12" cy="5" r="2.5" fill="#8B8078"/>
      <circle cx="6" cy="11" r="2" fill="#8B8078"/>
      <circle cx="18" cy="11" r="2" fill="#8B8078"/>
      <circle cx="10.5" cy="12.5" r="0.7" fill="#4A3728"/>
      <circle cx="13.5" cy="12.5" r="0.7" fill="#4A3728"/>
      <path d="M10.5 15 Q12 16.2 13.5 15" stroke="#4A3728" stroke-width="0.5" fill="none"/>`,
  },
  {
    name: 'Chopin',
    // Wavy side-parted hair, delicate features, cravat
    svg: (bg: string) => `<rect width="24" height="24" rx="12" fill="${bg}"/>
      <circle cx="12" cy="13" r="5" fill="#FCEBD5"/>
      <ellipse cx="12" cy="16.5" rx="3" ry="2" fill="#2C2C2C"/>
      <path d="M7 9 Q8 4 11 5 Q9 7 8 9Z" fill="#5C4033"/>
      <path d="M8 8 Q10 3 14 4 Q16 5 17 8 Q15 6 12 6 Q9 6 8 8Z" fill="#5C4033"/>
      <ellipse cx="12" cy="17" rx="1" ry="0.6" fill="#E8E0D0"/>
      <circle cx="10.5" cy="12.5" r="0.6" fill="#4A3728"/>
      <circle cx="13.5" cy="12.5" r="0.6" fill="#4A3728"/>
      <path d="M11 15 Q12 15.8 13 15" stroke="#4A3728" stroke-width="0.4" fill="none"/>`,
  },
  {
    name: 'Liszt',
    // Long flowing hair, angular face, dramatic
    svg: (bg: string) => `<rect width="24" height="24" rx="12" fill="${bg}"/>
      <circle cx="12" cy="12" r="5" fill="#FCEBD5"/>
      <ellipse cx="12" cy="16" rx="3" ry="2.5" fill="#2C2C2C"/>
      <path d="M7 7 Q9 3 13 4 Q16 3 17 7 L18 14 Q17 12 16 10 Q14 6 12 6 Q10 6 8 10 Q7 12 6 14Z" fill="#6B5B4A"/>
      <path d="M6 14 Q5 18 6 20" stroke="#6B5B4A" stroke-width="2" fill="none"/>
      <path d="M18 14 Q19 18 18 20" stroke="#6B5B4A" stroke-width="2" fill="none"/>
      <circle cx="10.5" cy="12" r="0.6" fill="#4A3728"/>
      <circle cx="13.5" cy="12" r="0.6" fill="#4A3728"/>
      <path d="M11 14.5 Q12 15 13 14.5" stroke="#4A3728" stroke-width="0.4" fill="none"/>`,
  },
  {
    name: 'Vivaldi',
    // Red hair, priest collar
    svg: (bg: string) => `<rect width="24" height="24" rx="12" fill="${bg}"/>
      <circle cx="12" cy="13" r="5" fill="#FCEBD5"/>
      <ellipse cx="12" cy="16.5" rx="3.5" ry="2.5" fill="#1C1917"/>
      <ellipse cx="12" cy="17.5" rx="1.5" ry="0.8" fill="#E8E0D0"/>
      <path d="M7 8 Q8 4 12 4 Q16 4 17 8 Q15 5 12 5 Q9 5 7 8Z" fill="#B44B2A"/>
      <circle cx="7" cy="9" r="2" fill="#B44B2A"/>
      <circle cx="17" cy="9" r="2" fill="#B44B2A"/>
      <path d="M7 10 Q6 14 7 16" stroke="#B44B2A" stroke-width="1.5" fill="none"/>
      <path d="M17 10 Q18 14 17 16" stroke="#B44B2A" stroke-width="1.5" fill="none"/>
      <circle cx="10.5" cy="12.5" r="0.6" fill="#4A3728"/>
      <circle cx="13.5" cy="12.5" r="0.6" fill="#4A3728"/>
      <path d="M11 15 Q12 15.5 13 15" stroke="#4A3728" stroke-width="0.4" fill="none"/>`,
  },
  {
    name: 'Brahms',
    // Big bushy beard, balding
    svg: (bg: string) => `<rect width="24" height="24" rx="12" fill="${bg}"/>
      <circle cx="12" cy="11" r="5" fill="#FCEBD5"/>
      <ellipse cx="12" cy="17" rx="4" ry="3" fill="#8B7355"/>
      <path d="M8 15 Q12 18 16 15 Q17 19 15 21 Q12 22 9 21 Q7 19 8 15Z" fill="#8B7355"/>
      <path d="M9 8 Q12 6 15 8" fill="#8B7355"/>
      <circle cx="7" cy="11" r="1.5" fill="#8B7355"/>
      <circle cx="17" cy="11" r="1.5" fill="#8B7355"/>
      <circle cx="10.5" cy="11" r="0.6" fill="#4A3728"/>
      <circle cx="13.5" cy="11" r="0.6" fill="#4A3728"/>
      <ellipse cx="12" cy="9" rx="4" ry="2" fill="#FCEBD5" opacity="0.6"/>`,
  },
  {
    name: 'Debussy',
    // Dark goatee, hat, impressionist vibe
    svg: (bg: string) => `<rect width="24" height="24" rx="12" fill="${bg}"/>
      <circle cx="12" cy="13" r="5" fill="#FCEBD5"/>
      <ellipse cx="12" cy="16.5" rx="3" ry="2" fill="#2C2C2C"/>
      <path d="M10 15 Q12 17 14 15 Q13.5 18 12 18.5 Q10.5 18 10 15Z" fill="#3D2B1F"/>
      <path d="M7 7 Q9 3 15 3 Q17 3 17 7 Q15 5 12 5.5 Q9 5 7 7Z" fill="#3D2B1F"/>
      <rect x="6" y="5" width="12" height="2" rx="1" fill="#2C2C2C"/>
      <rect x="5" y="6.5" width="14" height="1" rx="0.5" fill="#2C2C2C"/>
      <circle cx="10.5" cy="12.5" r="0.6" fill="#4A3728"/>
      <circle cx="13.5" cy="12.5" r="0.6" fill="#4A3728"/>`,
  },
  {
    name: 'Tchaikovsky',
    // Balding, neat beard, bow tie
    svg: (bg: string) => `<rect width="24" height="24" rx="12" fill="${bg}"/>
      <circle cx="12" cy="13" r="5" fill="#FCEBD5"/>
      <ellipse cx="12" cy="17" rx="3.5" ry="2" fill="#2C2C2C"/>
      <path d="M10 15 Q12 16.5 14 15 Q13 17 12 17 Q11 17 10 15Z" fill="#6B5B4A"/>
      <path d="M9 8 Q12 6 15 8 Q14 7 12 7 Q10 7 9 8Z" fill="#6B5B4A"/>
      <circle cx="7.5" cy="12" r="1.5" fill="#6B5B4A"/>
      <circle cx="16.5" cy="12" r="1.5" fill="#6B5B4A"/>
      <path d="M10.5 17 L11.5 16.5 L12 17.2 L12.5 16.5 L13.5 17" fill="#C43C3C" stroke="none"/>
      <circle cx="10.5" cy="12.5" r="0.6" fill="#4A3728"/>
      <circle cx="13.5" cy="12.5" r="0.6" fill="#4A3728"/>`,
  },
  {
    name: 'Paganini',
    // Long dark hair, thin face, violin-like
    svg: (bg: string) => `<rect width="24" height="24" rx="12" fill="${bg}"/>
      <ellipse cx="12" cy="13" rx="4.5" ry="5" fill="#FCEBD5"/>
      <ellipse cx="12" cy="17" rx="3" ry="2" fill="#2C2C2C"/>
      <path d="M7 8 Q8 4 12 4 Q16 4 17 8 L18 16 Q17 13 16 10 Q14 6 12 6 Q10 6 8 10 Q7 13 6 16Z" fill="#1C1917"/>
      <circle cx="10.5" cy="12.5" r="0.6" fill="#4A3728"/>
      <circle cx="13.5" cy="12.5" r="0.6" fill="#4A3728"/>
      <path d="M11 15 Q12 15.5 13 15" stroke="#4A3728" stroke-width="0.4" fill="none"/>
      <path d="M11 10 Q12 9.5 13 10" stroke="#4A3728" stroke-width="0.4" fill="none"/>`,
  },
];

const BG_COLORS = [
  '#F5E6D3', '#E8DDD3', '#DDE5E8', '#E3DDE8', '#D3E8DD',
  '#E8E3D3', '#D8E0E8', '#E8D8D8', '#D3D8E8', '#E0E8D3',
  '#F0E8DC', '#E5DFD5', '#DCE8E5', '#E8DCE5', '#D5E5DC',
];

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

export function getAvatarSvg(userId: string): string {
  const hash = hashCode(userId);
  const composerIdx = hash % COMPOSERS.length;
  const bgIdx = (hash >> 4) % BG_COLORS.length;
  const bg = BG_COLORS[bgIdx];
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">${COMPOSERS[composerIdx].svg(bg)}</svg>`;
}

export function avatarDataUrl(userId: string): string {
  return `data:image/svg+xml,${encodeURIComponent(getAvatarSvg(userId))}`;
}

interface GenerativeAvatarProps {
  userId: string;
  size?: number;
  className?: string;
}

export default function GenerativeAvatar({ userId, size = 28, className = '' }: GenerativeAvatarProps) {
  return (
    <img
      src={avatarDataUrl(userId)}
      alt=""
      width={size}
      height={size}
      className={`rounded-full ${className}`}
    />
  );
}

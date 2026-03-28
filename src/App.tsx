import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Music, 
  Library, 
  User, 
  Mic2, 
  PenTool, 
  Newspaper, 
  Settings, 
  Volume2, 
  VolumeX, 
  Play, 
  Pause, 
  Square,
  Globe,
  ChevronRight,
  ChevronLeft,
  Minus,
  Maximize2,
  Minimize2,
  X,
  Calendar,
  Clock,
  MapPin,
  ExternalLink,
  Loader2,
  Filter,
  Search,
  ChevronDown,
  Check,
  FileText,
  ArrowLeft,
  ArrowRight,
  Plus,
  Trash2,
  Edit2,
  Save,
  Camera,
  Disc,
  History,
  Info,
  Send,
  MessageSquare
} from 'lucide-react';
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

// --- Types ---
type Event = {
  id: string;
  title: string;
  venue: string;
  date: string;
  time: string;
  type: 'Classical' | 'Ballet' | 'Drama' | 'Jazz';
  description: string;
  link: string;
  image: string;
  isPast: boolean;
};

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// --- Types ---
type Section = 'Events' | 'Catalog' | 'Artists' | 'Player' | 'Composers' | 'News' | 'Profile' | 'Music' | 'ComposerDetail' | 'ArtistDetail' | 'SheetMusic' | 'GenreDetail' | 'Mission' | 'Contribute' | 'Donate' | 'Community';

interface ChatRoom {
  id: string;
  name: string;
  type: 'Piece' | 'Composer' | 'Performance' | 'Genre';
  description: string;
  activeArtists: { name: string, status: 'past' | 'current' | 'future' }[];
}

interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  timestamp: string;
  isArtist: boolean;
}

interface Performance {
  id: string;
  event: string;
  venue: string;
  date: string;
}

interface DiscographyItem {
  id: string;
  title: string;
  year: string;
  role: string;
}

interface UserProfile {
  name: string;
  role: string;
  bio: string;
  profilePicture: string;
  instruments: string[];
  genres: string[];
  discography: DiscographyItem[];
  performanceHistory: Performance[];
}
type PlayerStatus = 'normal' | 'minimized' | 'fullscreen' | 'closed';

interface Genre {
  id: string;
  name: string;
  description: string;
  image: string;
  subgenres: string[];
  keyEras: string[];
  notableComposers: string[];
}

interface SheetMusicState {
  work: Work;
  variationIndex: number;
}

interface Work {
  id: string;
  title: string;
  composer: string;
  year: string;
  genre: string;
  description: string;
  sheetMusic?: {
    title: string;
    edition: string;
    previewUrl: string;
    fullUrl: string;
    copyright: string;
  }[];
}

const CC_SYMBOLS: Record<string, React.ReactNode> = {
  CC: (
    <svg viewBox="0 0 30 30" className="w-4 h-4 fill-current" aria-hidden="true">
      <circle cx="15" cy="15" r="14" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M11.5 11.5c1.2-1.2 3-1.2 4.2 0l-1.4 1.4c-.4-.4-1-.4-1.4 0-.8.8-.8 2 0 2.8.4.4 1 .4 1.4 0l1.4 1.4c-1.2 1.2-3 1.2-4.2 0-2.3-2.3-2.3-6 0-8.4zm7 0c1.2-1.2 3-1.2 4.2 0l-1.4 1.4c-.4-.4-1-.4-1.4 0-.8.8-.8 2 0 2.8.4.4 1 .4 1.4 0l1.4 1.4c-1.2 1.2-3 1.2-4.2 0-2.3-2.3-2.3-6 0-8.4z" />
    </svg>
  ),
  BY: (
    <svg viewBox="0 0 30 30" className="w-4 h-4 fill-current" aria-hidden="true">
      <circle cx="15" cy="15" r="14" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M15 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6zm-7 16c0-3.87 3.13-7 7-7s7 3.13 7 7v1H8v-1z" />
    </svg>
  ),
  NC: (
    <svg viewBox="0 0 30 30" className="w-4 h-4 fill-current" aria-hidden="true">
      <circle cx="15" cy="15" r="14" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M15 8v14M12 11h6a3 3 0 0 1 0 6h-6a3 3 0 0 0 0 6h6M8 22l14-14" fill="none" stroke="currentColor" strokeWidth="2" />
    </svg>
  ),
  ND: (
    <svg viewBox="0 0 30 30" className="w-4 h-4 fill-current" aria-hidden="true">
      <circle cx="15" cy="15" r="14" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M10 13h10M10 17h10" fill="none" stroke="currentColor" strokeWidth="2" />
    </svg>
  ),
  SA: (
    <svg viewBox="0 0 30 30" className="w-4 h-4 fill-current" aria-hidden="true">
      <circle cx="15" cy="15" r="14" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M22 15a7 7 0 1 1-7-7" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M15 5l3 3-3 3" />
    </svg>
  ),
  ZERO: (
    <svg viewBox="0 0 30 30" className="w-4 h-4 fill-current" aria-hidden="true">
      <circle cx="15" cy="15" r="14" fill="none" stroke="currentColor" strokeWidth="2" />
      <circle cx="15" cy="15" r="7" fill="none" stroke="currentColor" strokeWidth="2" />
      <line x1="10" y1="20" x2="20" y2="10" stroke="currentColor" strokeWidth="2" />
    </svg>
  ),
  PD: (
    <svg viewBox="0 0 30 30" className="w-4 h-4 fill-current" aria-hidden="true">
      <circle cx="15" cy="15" r="14" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M11 11c1.2-1.2 3-1.2 4.2 0l-1.4 1.4c-.4-.4-1-.4-1.4 0-.8.8-.8 2 0 2.8.4.4 1 .4 1.4 0l1.4 1.4c-1.2 1.2-3 1.2-4.2 0-2.3-2.3-2.3-6 0-8.4z" />
      <text x="18" y="20" fontSize="10" fontWeight="bold">M</text>
    </svg>
  )
};

const LicenseDisplay = ({ license, className = "" }: { license: string, className?: string }) => {
  const getIcons = () => {
    if (license === "Public Domain") {
      return <div className="flex gap-0.5">{CC_SYMBOLS.PD}</div>;
    }
    if (license === "CC0") {
      return <div className="flex gap-0.5">{CC_SYMBOLS.CC}{CC_SYMBOLS.ZERO}</div>;
    }
    if (license.startsWith("CC ")) {
      const symbols = license.split(" ")[1].split("-");
      return (
        <div className="flex gap-0.5">
          {CC_SYMBOLS.CC}
          {symbols.map((s, i) => (
            <React.Fragment key={i}>
              {CC_SYMBOLS[s.toUpperCase()] || null}
            </React.Fragment>
          ))}
        </div>
      );
    }
    return <span className="text-[10px] opacity-40">[{license}]</span>;
  };

  return (
    <div className={`inline-flex items-center gap-1 ${className}`} title={license}>
      {getIcons()}
    </div>
  );
};

const WORKS: Work[] = [
  { 
    id: "brandenburg-concertos",
    title: "Brandenburg Concertos", 
    composer: "J.S. Bach", 
    year: "1721", 
    genre: "Classical",
    description: "A collection of six instrumental works presented by Bach to Christian Ludwig, Margrave of Brandenburg-Schwedt.",
    sheetMusic: [
      { title: "Autograph Score", edition: "1721 Original", previewUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6a/Bach_Brandenburg_Concerto_No_1_Autograph.jpg/800px-Bach_Brandenburg_Concerto_No_1_Autograph.jpg", fullUrl: "#", copyright: "Public Domain" },
      { title: "Peters Edition", edition: "1850 Leipzig", previewUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d1/Bach_Brandenburg_Concerto_No_1_Peters_Edition.jpg/800px-Bach_Brandenburg_Concerto_No_1_Peters_Edition.jpg", fullUrl: "#", copyright: "CC BY-SA" }
    ]
  },
  { 
    id: "symphony-9",
    title: "Symphony No. 9", 
    composer: "L. van Beethoven", 
    year: "1824", 
    genre: "Classical",
    description: "The final complete symphony by Ludwig van Beethoven, composed between 1822 and 1824.",
    sheetMusic: [
      { title: "First Edition", edition: "1826 Schott", previewUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a1/Beethoven_Symphony_9_Schott_1826.jpg/800px-Beethoven_Symphony_9_Schott_1826.jpg", fullUrl: "#", copyright: "Public Domain" },
      { title: "Breitkopf & Härtel", edition: "1863 Complete Works", previewUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Beethoven_Symphony_9_Breitkopf.jpg/800px-Beethoven_Symphony_9_Breitkopf.jpg", fullUrl: "#", copyright: "Public Domain" }
    ]
  },
  { 
    id: "rite-of-spring",
    title: "The Rite of Spring", 
    composer: "I. Stravinsky", 
    year: "1913", 
    genre: "Ballet",
    description: "A ballet and orchestral concert work by Russian composer Igor Stravinsky.",
    sheetMusic: [
      { title: "Piano Duet", edition: "1913 Edition", previewUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/Stravinsky_Rite_of_Spring_Piano_Duet.jpg/800px-Stravinsky_Rite_of_Spring_Piano_Duet.jpg", fullUrl: "#", copyright: "Public Domain" },
      { title: "Full Score", edition: "1921 Revised", previewUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Stravinsky_Rite_of_Spring_Full_Score.jpg/800px-Stravinsky_Rite_of_Spring_Full_Score.jpg", fullUrl: "#", copyright: "Public Domain" }
    ]
  },
  { 
    id: "clair-de-lune",
    title: "Clair de Lune", 
    composer: "C. Debussy", 
    year: "1905", 
    genre: "Classical",
    description: "The third movement from the Suite bergamasque, one of Debussy's most famous works for piano.",
    sheetMusic: [
      { title: "Original Publication", edition: "1905 Fromont", previewUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/Debussy_Clair_de_Lune_Fromont.jpg/800px-Debussy_Clair_de_Lune_Fromont.jpg", fullUrl: "#", copyright: "Public Domain" }
    ]
  },
  { 
    id: "four-seasons",
    title: "Four Seasons", 
    composer: "A. Vivaldi", 
    year: "1723", 
    genre: "Classical",
    description: "A group of four violin concerti by Antonio Vivaldi, each of which gives musical expression to a season of the year.",
    sheetMusic: [
      { title: "Le Cène Edition", edition: "1725 Amsterdam", previewUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/Vivaldi_Four_Seasons_Le_Cene.jpg/800px-Vivaldi_Four_Seasons_Le_Cene.jpg", fullUrl: "#", copyright: "Public Domain" }
    ]
  },
  { 
    id: "requiem",
    title: "Requiem", 
    composer: "W.A. Mozart", 
    year: "1791", 
    genre: "Classical",
    description: "A funeral mass composed by Wolfgang Amadeus Mozart in Vienna in 1791 and left unfinished at his death.",
    sheetMusic: [
      { title: "Süssmayr Completion", edition: "1800 Breitkopf", previewUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a0/Mozart_Requiem_Breitkopf_1800.jpg/800px-Mozart_Requiem_Breitkopf_1800.jpg", fullUrl: "#", copyright: "Public Domain" },
      { title: "Eybler Fragment", edition: "Manuscript", previewUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c3/Mozart_Requiem_Manuscript.jpg/800px-Mozart_Requiem_Manuscript.jpg", fullUrl: "#", copyright: "Public Domain" }
    ]
  },
  { 
    id: "well-tempered-clavier",
    title: "The Well-Tempered Clavier", 
    composer: "J.S. Bach", 
    year: "1722", 
    genre: "Classical",
    description: "A collection of two sets of preludes and fugues in all 24 major and minor keys.",
    sheetMusic: [
      { title: "Autograph Manuscript", edition: "Book I, 1722", previewUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Bach_Well-Tempered_Clavier_Book_1_Autograph.jpg/800px-Bach_Well-Tempered_Clavier_Book_1_Autograph.jpg", fullUrl: "#", copyright: "Public Domain" }
    ]
  },
  { 
    id: "st-matthew-passion",
    title: "St Matthew Passion", 
    composer: "J.S. Bach", 
    year: "1727", 
    genre: "Classical",
    description: "A sacred oratorio from the Passion of Christ according to the Gospel of Matthew.",
    sheetMusic: [
      { title: "Autograph Score", edition: "1727 Manuscript", previewUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Bach_St_Matthew_Passion_Autograph.jpg/800px-Bach_St_Matthew_Passion_Autograph.jpg", fullUrl: "#", copyright: "Public Domain" }
    ]
  },
  { 
    id: "goldberg-variations",
    title: "Goldberg Variations", 
    composer: "J.S. Bach", 
    year: "1741", 
    genre: "Classical",
    description: "A work for harpsichord consisting of an aria and a set of 30 variations.",
    sheetMusic: [
      { title: "First Edition", edition: "1741 Balthasar Schmid", previewUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/14/Bach_Goldberg_Variations_First_Edition.jpg/800px-Bach_Goldberg_Variations_First_Edition.jpg", fullUrl: "#", copyright: "Public Domain" }
    ]
  },
  { 
    id: "art-of-fugue",
    title: "The Art of Fugue", 
    composer: "J.S. Bach", 
    year: "1750", 
    genre: "Classical",
    description: "An unfinished musical work of unspecified instrumentation by Johann Sebastian Bach.",
    sheetMusic: [
      { title: "Original Manuscript", edition: "c. 1742-1750", previewUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/Bach_Art_of_Fugue_Manuscript.jpg/800px-Bach_Art_of_Fugue_Manuscript.jpg", fullUrl: "#", copyright: "Public Domain" }
    ]
  },
  { 
    id: "symphony-3",
    title: "Symphony No. 3 (Eroica)", 
    composer: "L. van Beethoven", 
    year: "1804", 
    genre: "Classical",
    description: "A symphony in four movements, one of Beethoven's most celebrated works.",
    sheetMusic: [
      { title: "Title Page", edition: "1804 Manuscript", previewUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d7/Beethoven_Symphony_3_Title_Page.jpg/800px-Beethoven_Symphony_3_Title_Page.jpg", fullUrl: "#", copyright: "Public Domain" }
    ]
  },
  { 
    id: "symphony-5",
    title: "Symphony No. 5", 
    composer: "L. van Beethoven", 
    year: "1808", 
    genre: "Classical",
    description: "One of the best-known compositions in classical music, and one of the most frequently played symphonies.",
    sheetMusic: [
      { title: "Opening Page", edition: "Manuscript Fragment", previewUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c9/Beethoven_Symphony_5_Opening.jpg/800px-Beethoven_Symphony_5_Opening.jpg", fullUrl: "#", copyright: "Public Domain" }
    ]
  },
  { 
    id: "missa-solemnis",
    title: "Missa Solemnis", 
    composer: "L. van Beethoven", 
    year: "1823", 
    genre: "Classical",
    description: "A Mass composed by Ludwig van Beethoven between 1819 and 1823.",
    sheetMusic: [
      { title: "Autograph Score", edition: "1823 Original", previewUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Beethoven_Missa_Solemnis_Autograph.jpg/800px-Beethoven_Missa_Solemnis_Autograph.jpg", fullUrl: "#", copyright: "Public Domain" }
    ]
  },
  { 
    id: "estro-armonico",
    title: "L'estro armonico", 
    composer: "A. Vivaldi", 
    year: "1711", 
    genre: "Classical",
    description: "A set of 12 concertos for one, two, and four violins with strings and basso continuo.",
    sheetMusic: [
      { title: "Title Page", edition: "1711 Estienne Roger", previewUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/Vivaldi_Estro_Armonico_Title_Page.jpg/800px-Vivaldi_Estro_Armonico_Title_Page.jpg", fullUrl: "#", copyright: "Public Domain" }
    ]
  },
  { 
    id: "juditha-triumphans",
    title: "Juditha triumphans", 
    composer: "A. Vivaldi", 
    year: "1716", 
    genre: "Classical",
    description: "An oratorio by Antonio Vivaldi, the only one of his four oratorios that has survived.",
    sheetMusic: [
      { title: "Manuscript Score", edition: "1716 Original", previewUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3d/Vivaldi_Juditha_Triumphans_Manuscript.jpg/800px-Vivaldi_Juditha_Triumphans_Manuscript.jpg", fullUrl: "#", copyright: "Public Domain" }
    ]
  },
  { 
    id: "cimento-dell-armonia",
    title: "Il cimento dell'armonia e dell'inventione", 
    composer: "A. Vivaldi", 
    year: "1725", 
    genre: "Classical",
    description: "A set of twelve concertos written by Antonio Vivaldi between 1723 and 1725.",
    sheetMusic: [
      { title: "Title Page", edition: "1725 Le Cène", previewUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/Vivaldi_Cimento_Title_Page.jpg/800px-Vivaldi_Cimento_Title_Page.jpg", fullUrl: "#", copyright: "Public Domain" }
    ]
  },
  { 
    id: "gloria",
    title: "Gloria", 
    composer: "A. Vivaldi", 
    year: "1726", 
    genre: "Classical",
    description: "One of the most popular choral works by Antonio Vivaldi.",
    sheetMusic: [
      { title: "Manuscript", edition: "c. 1715 Original", previewUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Vivaldi_Gloria_Manuscript.jpg/800px-Vivaldi_Gloria_Manuscript.jpg", fullUrl: "#", copyright: "Public Domain" }
    ]
  },
  { 
    id: "orlando-furioso",
    title: "Orlando furioso", 
    composer: "A. Vivaldi", 
    year: "1727", 
    genre: "Classical",
    description: "An opera in three acts by Antonio Vivaldi to a libretto by Grazio Braccioli.",
    sheetMusic: [
      { title: "Title Page", edition: "1727 Original", previewUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/Vivaldi_Orlando_Furioso_Title_Page.jpg/800px-Vivaldi_Orlando_Furioso_Title_Page.jpg", fullUrl: "#", copyright: "Public Domain" }
    ]
  },
  { 
    id: "symphony-1-mozart",
    title: "Symphony No. 1", 
    composer: "W.A. Mozart", 
    year: "1764", 
    genre: "Classical",
    description: "Mozart's first symphony, written at the age of eight.",
    sheetMusic: [
      { title: "Autograph Score", edition: "1764 Original", previewUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Mozart_Symphony_1_Autograph.jpg/800px-Mozart_Symphony_1_Autograph.jpg", fullUrl: "#", copyright: "Public Domain" }
    ]
  },
  { 
    id: "mass-in-c-minor",
    title: "Mass in C minor", 
    composer: "W.A. Mozart", 
    year: "1783", 
    genre: "Classical",
    description: "The Great Mass in C minor, K. 427, is a large-scale musical setting of the Mass.",
    sheetMusic: [
      { title: "Autograph Score", edition: "1783 Original", previewUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Mozart_Mass_in_C_minor_Autograph.jpg/800px-Mozart_Mass_in_C_minor_Autograph.jpg", fullUrl: "#", copyright: "Public Domain" }
    ]
  },
  { 
    id: "marriage-of-figaro",
    title: "The Marriage of Figaro", 
    composer: "W.A. Mozart", 
    year: "1786", 
    genre: "Classical",
    description: "An opera buffa in four acts composed in 1786 by Wolfgang Amadeus Mozart.",
    sheetMusic: [
      { title: "Autograph Score", edition: "Act I, 1786", previewUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0e/Mozart_Marriage_of_Figaro_Autograph.jpg/800px-Mozart_Marriage_of_Figaro_Autograph.jpg", fullUrl: "#", copyright: "Public Domain" }
    ]
  },
  { 
    id: "don-giovanni",
    title: "Don Giovanni", 
    composer: "W.A. Mozart", 
    year: "1787", 
    genre: "Classical",
    description: "An opera in two acts with music by Wolfgang Amadeus Mozart and Italian libretto by Lorenzo Da Ponte.",
    sheetMusic: [
      { title: "Overture Manuscript", edition: "1787 Original", previewUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/Mozart_Don_Giovanni_Autograph.jpg/800px-Mozart_Don_Giovanni_Autograph.jpg", fullUrl: "#", copyright: "Public Domain" }
    ]
  },
  { 
    id: "symphony-40",
    title: "Symphony No. 40", 
    composer: "W.A. Mozart", 
    year: "1788", 
    genre: "Classical",
    description: "One of only two symphonies Mozart wrote in minor keys.",
    sheetMusic: [
      { title: "Autograph Score", edition: "1788 Original", previewUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b4/Mozart_Symphony_40_Autograph.jpg/800px-Mozart_Symphony_40_Autograph.jpg", fullUrl: "#", copyright: "Public Domain" }
    ]
  },
  { 
    id: "symphony-41",
    title: "Symphony No. 41 (Jupiter)", 
    composer: "W.A. Mozart", 
    year: "1788", 
    genre: "Classical",
    description: "The longest and last symphony that Mozart composed.",
    sheetMusic: [
      { title: "Finale Manuscript", edition: "1788 Autograph", previewUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f6/Mozart_Jupiter_Symphony_Autograph.jpg/800px-Mozart_Jupiter_Symphony_Autograph.jpg", fullUrl: "#", copyright: "Public Domain" }
    ]
  },
  { 
    id: "magic-flute",
    title: "The Magic Flute", 
    composer: "W.A. Mozart", 
    year: "1791", 
    genre: "Classical",
    description: "An opera in two acts by Wolfgang Amadeus Mozart to a German libretto by Emanuel Schikaneder.",
    sheetMusic: [
      { title: "Autograph Score", edition: "1791 Original", previewUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a0/Mozart_Magic_Flute_Autograph.jpg/800px-Mozart_Magic_Flute_Autograph.jpg", fullUrl: "#", copyright: "Public Domain" }
    ]
  },
  { 
    id: "cello-suite-1",
    title: "Cello Suite No. 1 in G Major", 
    composer: "J.S. Bach", 
    year: "1720", 
    genre: "Classical",
    description: "The first of six suites for unaccompanied cello by Johann Sebastian Bach, among the most frequently performed and recognizable solo compositions ever written for cello.",
    sheetMusic: [
      { title: "Anna Magdalena Copy", edition: "c. 1727-1731", previewUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/67/Bach_Cello_Suite_1_Magdalena.jpg/800px-Bach_Cello_Suite_1_Magdalena.jpg", fullUrl: "#", copyright: "Public Domain" },
      { title: "Kellner Manuscript", edition: "c. 1726", previewUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Bach_Cello_Suite_1_Kellner.jpg/800px-Bach_Cello_Suite_1_Kellner.jpg", fullUrl: "#", copyright: "Public Domain" }
    ]
  },
];

interface Milestone {
  year: string;
  event: string;
  type: 'milestone' | 'work';
  isHighlight?: boolean;
}

interface Composer {
  name: string;
  born: string;
  died: string;
  nationality: string;
  roles: string[];
  shortBio: string;
  fullBio: string;
  timeline: Milestone[];
}

interface Performance {
  performer: string;
  year: string;
  artistPicture: string;
  location: string;
  duration: string;
}

interface Artist {
  id: string;
  name: string;
  instrument: string;
  period: string;
  bio: string;
  image: string;
  recordings: string[];
}

const ARTISTS: Artist[] = [
  { 
    id: "a1",
    name: "Jacqueline du Pré", 
    instrument: "Cello", 
    period: "20th Century",
    bio: "Jacqueline Mary du Pré was a British cellist. At a young age, she achieved widespread popularity. Despite her short career, she is regarded as one of the greatest cellists of all time.",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Jacqueline_du_Pr%C3%A9_1968.jpg/800px-Jacqueline_du_Pr%C3%A9_1968.jpg",
    recordings: ["Elgar Cello Concerto", "Dvořák Cello Concerto", "Beethoven Cello Sonatas"]
  },
  { 
    id: "a2",
    name: "Glenn Gould", 
    instrument: "Piano", 
    period: "20th Century",
    bio: "Glenn Herbert Gould was a Canadian classical pianist. He was one of the best-known and most celebrated classical pianists of the 20th century.",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Glenn_Gould_1959.jpg/800px-Glenn_Gould_1959.jpg",
    recordings: ["Bach: Goldberg Variations", "Bach: The Well-Tempered Clavier", "Beethoven: Piano Sonatas"]
  },
  { 
    id: "a3",
    name: "Maria Callas", 
    instrument: "Soprano", 
    period: "20th Century",
    bio: "Maria Callas was an American-born Greek soprano and one of the most renowned and influential opera singers of the 20th century.",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Maria_Callas_1958.jpg/800px-Maria_Callas_1958.jpg",
    recordings: ["Puccini: Tosca", "Bellini: Norma", "Verdi: La Traviata"]
  },
  { 
    id: "a4",
    name: "Yo-Yo Ma", 
    instrument: "Cello", 
    period: "Contemporary",
    bio: "Yo-Yo Ma is an American cellist. Born in Paris to Chinese parents and educated in New York City, he was a child prodigy, performing from the age of four and a half.",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/Yo-Yo_Ma_2010.jpg/800px-Yo-Yo_Ma_2010.jpg",
    recordings: ["Bach: Cello Suites", "The Goat Rodeo Sessions", "Silk Road Journeys"]
  },
  {
    id: "a5",
    name: "Alisa Weilerstein",
    instrument: "Cello",
    period: "Contemporary",
    bio: "Alisa Weilerstein is an American cellist. She was named a MacArthur Fellow in 2011.",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/Alisa_Weilerstein_2011.jpg/800px-Alisa_Weilerstein_2011.jpg",
    recordings: ["Elgar: Cello Concerto", "Elliott Carter: Cello Concerto"]
  },
  {
    id: "a6",
    name: "Pablo Casals",
    instrument: "Cello",
    period: "20th Century",
    bio: "Pablo Casals was a Spanish and Puerto Rican cellist, composer, and conductor. He is generally regarded as the pre-eminent cellist of the first half of the 20th century.",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/Pablo_Casals_1950.jpg/800px-Pablo_Casals_1950.jpg",
    recordings: ["Bach: Cello Suites", "Beethoven: Cello Sonatas"]
  }
];

const GENRES_DATA: Record<string, Genre> = {
  Classical: {
    id: 'Classical',
    name: 'Classical',
    description: 'Classical music is art music produced or rooted in the traditions of Western culture, including both liturgical (religious) and secular music.',
    image: 'https://images.unsplash.com/photo-1507838153414-b4b713384a76?auto=format&fit=crop&w=1200&q=80',
    subgenres: ['Symphony', 'Opera', 'Chamber Music', 'Sonata', 'Concerto'],
    keyEras: ['Baroque', 'Classical', 'Romantic', '20th Century', 'Contemporary'],
    notableComposers: ['J.S. Bach', 'W.A. Mozart', 'L. van Beethoven', 'P.I. Tchaikovsky']
  },
  Ballet: {
    id: 'Ballet',
    name: 'Ballet',
    description: 'Ballet is a type of performance dance that originated during the Italian Renaissance in the 15th century and later developed into a concert dance form in France and Russia.',
    image: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=1200&q=80',
    subgenres: ['Classical Ballet', 'Neoclassical Ballet', 'Contemporary Ballet'],
    keyEras: ['Romantic Era', 'Imperial Era', 'Ballets Russes'],
    notableComposers: ['P.I. Tchaikovsky', 'I. Stravinsky', 'L. Delibes', 'A. Adam']
  },
  Drama: {
    id: 'Drama',
    name: 'Drama',
    description: 'Drama is the specific mode of fiction represented in performance: a play, opera, mime, ballet, etc., performed in a theatre, or on radio or television.',
    image: 'https://images.unsplash.com/photo-1503095396549-807a89010049?auto=format&fit=crop&w=1200&q=80',
    subgenres: ['Tragedy', 'Comedy', 'Melodrama', 'Farce'],
    keyEras: ['Ancient Greek', 'Elizabethan', 'Restoration', 'Modern'],
    notableComposers: ['W. Shakespeare', 'Sophocles', 'Molière', 'A. Chekhov']
  },
  Jazz: {
    id: 'Jazz',
    name: 'Jazz',
    description: 'Jazz is a music genre that originated in the African-American communities of New Orleans, Louisiana, in the late 19th and early 20th centuries, with its roots in blues and ragtime.',
    image: 'https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?auto=format&fit=crop&w=1200&q=80',
    subgenres: ['Swing', 'Bebop', 'Cool Jazz', 'Fusion', 'Free Jazz'],
    keyEras: ['New Orleans Jazz', 'Swing Era', 'Modern Jazz'],
    notableComposers: ['Miles Davis', 'Duke Ellington', 'John Coltrane', 'Louis Armstrong']
  }
};

// --- Components ---

const TrebleClef = ({ size = 24, className = "" }: { size?: number, className?: string }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M12 22V4a2 2 0 0 1 4 0c0 4-8 5-8 10 0 3 2 5 4 5s4-2 4-4-2-4-4-4" />
    <circle cx="12" cy="19" r="1" fill="currentColor" />
  </svg>
);

const Violin = ({ size = 24, className = "" }: { size?: number, className?: string }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M12 2v4M10 6h4M12 6v14M9 10c-1 0-2 1-2 3 0 3 2 5 5 5s5-2 5-5c0-2-1-3-2-3M8 13c0 1 1 2 2 2M16 13c0 1-1 2-2 2" />
    <path d="M12 20a2 2 0 1 0 0 4 2 2 0 0 0 0-4z" />
  </svg>
);

const BeethovenIcon = ({ size = 24, className = "" }: { size?: number, className?: string }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    {/* Stylized Beethoven Profile/Hair */}
    <path d="M7 14c-1.5-1-2-3-2-5 0-4 3-7 7-7s7 3 7 7c0 2-.5 4-2 5" />
    <path d="M9 12c-1 1-2 3-2 5 0 2 1 3 2 4" />
    <path d="M15 12c1 1 2 3 2 5 0 2-1 3-2 4" />
    <path d="M10 9c0 1 1 1 2 1s2 0 2-1" />
    <path d="M11 14h2" />
    <path d="M8 7c0-1 1-2 2-2h4c1 0 2 1 2 2" />
    <path d="M6 10c-1 0-2 1-2 2s1 2 2 2" />
    <path d="M18 10c1 0 2 1 2 2s-1 2-2 2" />
  </svg>
);

const ViolinistIcon = ({ size = 24, className = "" }: { size?: number, className?: string }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
    <g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g>
    <g id="SVGRepo_iconCarrier"> 
      <g clipPath="url(#clip0_429_11111)"> 
        <circle cx="12" cy="7" r="3" stroke="currentColor" strokeWidth="2.5"></circle> 
        <circle cx="18" cy="18" r="2" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"></circle> 
        <path d="M12.3414 20H6C4.89543 20 4 19.1046 4 18C4 15.7909 5.79086 14 8 14H13.5278" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"></path> 
        <path d="M20 18V11L22 13" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"></path> 
      </g> 
      <defs> 
        <clipPath id="clip0_429_11111"> 
          <rect width="24" height="24" fill="white"></rect> 
        </clipPath> 
      </defs> 
    </g>
  </svg>
);

const COMPOSERS_DATA: Record<string, Composer> = {
  "J.S. Bach": {
    name: "Johann Sebastian Bach",
    born: "1685",
    died: "1750",
    nationality: "German",
    roles: ["Composer", "Organist", "Harpsichordist", "Violinist"],
    shortBio: "A German composer and musician of the late Baroque period.",
    fullBio: "Johann Sebastian Bach was a German composer and musician of the late Baroque period. He is known for instrumental compositions such as the Brandenburg Concertos and the Goldberg Variations, and for vocal music such as the St Matthew Passion and the Mass in B minor. Since the 19th-century Bach Revival, he has been generally regarded as one of the greatest composers in the history of Western music.",
    timeline: [
      { year: "1685", event: "Born in Eisenach, Germany.", type: 'milestone', isHighlight: true },
      { year: "1703", event: "Appointed court musician in Weimar.", type: 'milestone' },
      { year: "1707", event: "Married Maria Barbara Bach.", type: 'milestone' },
      { year: "1708", event: "Toccata and Fugue in D minor", type: 'work' },
      { year: "1717", event: "Appointed Kapellmeister at Köthen.", type: 'milestone' },
      { year: "1720", event: "Cello Suites", type: 'work', isHighlight: true },
      { year: "1721", event: "Brandenburg Concertos", type: 'work', isHighlight: true },
      { year: "1722", event: "The Well-Tempered Clavier (Book I)", type: 'work', isHighlight: true },
      { year: "1723", event: "Appointed Thomaskantor in Leipzig.", type: 'milestone', isHighlight: true },
      { year: "1727", event: "St Matthew Passion", type: 'work', isHighlight: true },
      { year: "1733", event: "Kyrie and Gloria of the Mass in B minor", type: 'work' },
      { year: "1741", event: "Goldberg Variations", type: 'work' },
      { year: "1747", event: "Musical Offering", type: 'work' },
      { year: "1749", event: "Mass in B minor", type: 'work', isHighlight: true },
      { year: "1750", event: "Died in Leipzig, Germany.", type: 'milestone', isHighlight: true }
    ]
  },
  "L. van Beethoven": {
    name: "Ludwig van Beethoven",
    born: "1770",
    died: "1827",
    nationality: "German",
    roles: ["Composer", "Pianist"],
    shortBio: "A German composer and pianist who was a crucial figure in the transition between the Classical and Romantic eras.",
    fullBio: "Ludwig van Beethoven was a German composer and pianist. A crucial figure in the transition between the Classical and Romantic eras in Western art music, he remains one of the most famous and influential of all composers. His best-known compositions include 9 symphonies, 5 piano concertos, 1 violin concerto, 32 piano sonatas, 16 string quartets, his great Mass the Missa solemnis, and one opera, Fidelio.",
    timeline: [
      { year: "1770", event: "Born in Bonn, Germany.", type: 'milestone', isHighlight: true },
      { year: "1792", event: "Moved to Vienna to study with Haydn.", type: 'milestone', isHighlight: true },
      { year: "1795", event: "First public performance in Vienna.", type: 'milestone' },
      { year: "1798", event: "Piano Sonata No. 8 (Pathétique)", type: 'work' },
      { year: "1800", event: "Symphony No. 1", type: 'work' },
      { year: "1801", event: "Piano Sonata No. 14 (Moonlight)", type: 'work', isHighlight: true },
      { year: "1803", event: "Symphony No. 3 (Eroica)", type: 'work', isHighlight: true },
      { year: "1804", event: "Appointed to the court of Archduke Rudolph.", type: 'milestone' },
      { year: "1808", event: "Symphony No. 5", type: 'work', isHighlight: true },
      { year: "1808", event: "Symphony No. 6 (Pastoral)", type: 'work' },
      { year: "1811", event: "Piano Trio No. 7 (Archduke)", type: 'work' },
      { year: "1814", event: "Fidelio (final version)", type: 'work' },
      { year: "1823", event: "Missa solemnis", type: 'work' },
      { year: "1824", event: "Symphony No. 9", type: 'work', isHighlight: true },
      { year: "1827", event: "Died in Vienna, Austria.", type: 'milestone', isHighlight: true }
    ]
  },
  "A. Vivaldi": {
    name: "Antonio Vivaldi",
    born: "1678",
    died: "1741",
    nationality: "Italian",
    roles: ["Composer", "Violinist", "Priest"],
    shortBio: "An Italian Baroque composer, virtuoso violinist, teacher and cleric.",
    fullBio: "Antonio Lucio Vivaldi was an Italian Baroque composer, virtuoso violinist, teacher and cleric. Born in Venice, he is recognized as one of the greatest Baroque composers, and his influence during his lifetime was widespread across Europe. He is known mainly for composing many instrumental concertos, for the violin and a variety of other instruments, as well as sacred choral works and more than forty operas. His best-known work is a series of violin concertos known as The Four Seasons.",
    timeline: [
      { year: "1678", event: "Born in Venice, Italy.", type: 'milestone', isHighlight: true },
      { year: "1703", event: "Ordained as a priest ('The Red Priest').", type: 'milestone' },
      { year: "1703", event: "Began teaching at the Ospedale della Pietà.", type: 'milestone', isHighlight: true },
      { year: "1711", event: "L'estro armonico", type: 'work', isHighlight: true },
      { year: "1723", event: "The Four Seasons published.", type: 'milestone', isHighlight: true },
      { year: "1723", event: "The Four Seasons", type: 'work', isHighlight: true },
      { year: "1725", event: "Il cimento dell'armonia e dell'inventione", type: 'work' },
      { year: "1726", event: "Gloria", type: 'work', isHighlight: true },
      { year: "1727", event: "Orlando furioso", type: 'work', isHighlight: true },
      { year: "1740", event: "Left Venice for Vienna.", type: 'milestone' },
      { year: "1741", event: "Died in Vienna, Austria.", type: 'milestone', isHighlight: true }
    ]
  },
  "W.A. Mozart": {
    name: "Wolfgang Amadeus Mozart",
    born: "1756",
    died: "1791",
    nationality: "Austrian",
    roles: ["Composer", "Pianist", "Violinist"],
    shortBio: "A prolific and influential composer of the Classical era.",
    fullBio: "Wolfgang Amadeus Mozart, baptised as Johannes Chrysostomus Wolfgangus Theophilus Mozart, was a prolific and influential composer of the Classical era. Born in Salzburg, in the Holy Roman Empire, Mozart showed prodigious ability from his earliest childhood. Already competent on keyboard and violin, he composed from the age of five and performed before European royalty. At 17, Mozart was engaged as a musician at the Salzburg court but grew restless and travelled in search of a better position. While visiting Vienna in 1781, he was dismissed from his Salzburg position. He chose to stay in the capital, where he achieved fame but little financial security.",
    timeline: [
      { year: "1756", event: "Born in Salzburg, Austria.", type: 'milestone', isHighlight: true },
      { year: "1762", event: "Began touring Europe as a child prodigy.", type: 'milestone', isHighlight: true },
      { year: "1764", event: "Symphony No. 1", type: 'work' },
      { year: "1777", event: "Traveled to Mannheim and Paris.", type: 'milestone' },
      { year: "1781", event: "Moved to Vienna as a freelance musician.", type: 'milestone', isHighlight: true },
      { year: "1782", event: "Married Constanze Weber.", type: 'milestone' },
      { year: "1783", event: "Mass in C minor", type: 'work' },
      { year: "1786", event: "The Marriage of Figaro", type: 'work', isHighlight: true },
      { year: "1787", event: "Don Giovanni", type: 'work', isHighlight: true },
      { year: "1788", event: "Symphony No. 40", type: 'work' },
      { year: "1788", event: "Symphony No. 41 (Jupiter)", type: 'work', isHighlight: true },
      { year: "1791", event: "The Magic Flute", type: 'work' },
      { year: "1791", event: "Requiem", type: 'work', isHighlight: true },
      { year: "1791", event: "Died in Vienna, Austria.", type: 'milestone', isHighlight: true }
    ]
  }
};

const GenreDetail = ({ genre, onBack, setActiveSection, setSelectedComposer, setSelectedWork }: { 
  genre: Genre; 
  onBack: () => void;
  setActiveSection: (section: Section) => void;
  setSelectedComposer: (composer: Composer | null) => void;
  setSelectedWork: (work: Work | null) => void;
}) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-6xl mx-auto px-4 py-12"
    >
      <button 
        onClick={onBack}
        className="flex items-center gap-2 text-research-muted hover:text-research-ink transition-colors mb-8 group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        Back to Catalog
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
        <div>
          <h1 className="text-6xl font-serif italic mb-6">{genre.name}</h1>
          <p className="text-xl text-research-muted leading-relaxed mb-8">
            {genre.description}
          </p>
          
          <div className="space-y-8">
            <div>
              <h3 className="text-sm uppercase tracking-widest text-research-muted mb-4">Subgenres</h3>
              <div className="flex flex-wrap gap-2">
                {genre.subgenres.map(sub => (
                  <span key={sub} className="px-4 py-2 bg-research-ink/5 rounded-full text-sm">
                    {sub}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm uppercase tracking-widest text-research-muted mb-4">Key Eras</h3>
              <div className="flex flex-wrap gap-2">
                {genre.keyEras.map(era => (
                  <span key={era} className="px-4 py-2 border border-research-ink/10 rounded-full text-sm">
                    {era}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="relative aspect-[4/5] rounded-3xl overflow-hidden shadow-2xl">
          <img 
            src={genre.image} 
            alt={genre.name}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        <section>
          <h2 className="text-3xl font-serif italic mb-8">Notable Composers</h2>
          <div className="space-y-4">
            {genre.notableComposers.map(composerName => {
              const composer = COMPOSERS_DATA[composerName];
              return (
                <div 
                  key={composerName}
                  className="p-6 rounded-2xl border border-research-ink/5 hover:bg-research-ink/5 transition-colors cursor-pointer group"
                  onClick={() => {
                    if (composer) {
                      setSelectedComposer(composer);
                      setActiveSection('ComposerDetail');
                    }
                  }}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="text-lg font-medium">{composerName}</h4>
                      {composer && <p className="text-sm text-research-muted">{composer.nationality} · {composer.born}-{composer.died}</p>}
                    </div>
                    <ArrowRight className="w-5 h-5 text-research-muted group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section>
          <h2 className="text-3xl font-serif italic mb-8">Featured Works</h2>
          <div className="space-y-4">
            {WORKS.filter(w => w.genre === genre.name).slice(0, 5).map(work => (
              <div 
                key={work.id}
                className="p-6 rounded-2xl border border-research-ink/5 hover:bg-research-ink/5 transition-colors cursor-pointer group"
                onClick={() => {
                  setSelectedWork(work);
                  setActiveSection('Music');
                }}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="text-lg font-medium">{work.title}</h4>
                    <p className="text-sm text-research-muted">{work.composer} · {work.year}</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-research-muted group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </motion.div>
  );
};

const EventsView = ({ 
  globalSearchQuery,
  setSelectedWork,
  setSelectedArtist,
  setSelectedGenre,
  setActiveSection
}: { 
  globalSearchQuery: string,
  setSelectedWork: (w: Work) => void,
  setSelectedArtist: (a: Artist) => void,
  setSelectedGenre: (g: Genre) => void,
  setActiveSection: (s: Section) => void
}) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'Upcoming' | 'Past'>('Upcoming');
  const [showFilters, setShowFilters] = useState(false);
  
  // Filter states
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedVenues, setSelectedVenues] = useState<string[]>([]);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Find 12-15 major upcoming and recent past events in classical music, ballet, drama, and jazz in major global cultural hubs (London, NYC, Paris, Berlin, Vienna, Tokyo, Milan). 
        Include:
        - Title of the performance
        - Performer or ensemble name
        - Venue name and city (e.g., "Wigmore Hall, London")
        - Date (in YYYY-MM-DD format)
        - Time
        - Genre (Classical, Ballet, Drama, or Jazz)
        - Brief description
        - A relevant official link if possible
        - A high-quality image URL representing the event or venue (use a real URL or a high-quality placeholder from Unsplash)
        - Whether it is in the past or upcoming (relative to March 2026)
        
        Return the data as a JSON array of objects.`,
        config: {
          tools: [{ googleSearch: {} }],
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                performer: { type: Type.STRING },
                venue: { type: Type.STRING },
                date: { type: Type.STRING },
                time: { type: Type.STRING },
                type: { type: Type.STRING, enum: ['Classical', 'Ballet', 'Drama', 'Jazz'] },
                description: { type: Type.STRING },
                link: { type: Type.STRING },
                image: { type: Type.STRING },
                isPast: { type: Type.BOOLEAN }
              },
              required: ['title', 'performer', 'venue', 'date', 'time', 'type', 'description', 'link', 'image', 'isPast']
            }
          }
        }
      });

      const data = JSON.parse(response.text || '[]').map((e: any, i: number) => ({
        ...e,
        id: e.id || `event-${i}-${e.title.replace(/\s+/g, '-').toLowerCase()}-${e.date}`
      }));
      setEvents(data);
    } catch (error) {
      console.error("Error fetching events:", error);
      setEvents([
        { id: "e1", title: "The Art of Fugue", performer: "Alisa Weilerstein", venue: "Wigmore Hall, London", date: "2026-03-24", time: "19:30", type: "Classical", description: "A deep dive into Bach's final masterpiece.", link: "#", image: "https://images.unsplash.com/photo-1507838153414-b4b713384a76?auto=format&fit=crop&w=800&q=80", isPast: false },
        { id: "e2", title: "Swan Lake", performer: "Royal Ballet", venue: "Royal Opera House, London", date: "2026-03-20", time: "19:00", type: "Ballet", description: "The classic Tchaikovsky ballet.", link: "#", image: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=800&q=80", isPast: false },
        { id: "e3", title: "Hamlet", performer: "National Theatre Company", venue: "National Theatre, London", date: "2026-03-15", time: "19:30", type: "Drama", description: "Shakespeare's tragedy reimagined.", link: "#", image: "https://images.unsplash.com/photo-1503095396549-807a89010049?auto=format&fit=crop&w=800&q=80", isPast: true },
        { id: "e4", title: "Blue Note Jazz Night", performer: "Various Artists", venue: "Blue Note, NYC", date: "2026-03-22", time: "21:00", type: "Jazz", description: "An evening of contemporary jazz.", link: "#", image: "https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?auto=format&fit=crop&w=800&q=80", isPast: false },
        { id: "e5", title: "Don Giovanni", performer: "Vienna State Opera", venue: "Vienna State Opera, Vienna", date: "2026-03-28", time: "18:30", type: "Classical", description: "Mozart's operatic masterpiece.", link: "#", image: "https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=800&q=80", isPast: false },
        { id: "e6", title: "The Nutcracker", performer: "New York City Ballet", venue: "Lincoln Center, NYC", date: "2025-12-24", time: "14:00", type: "Ballet", description: "Holiday tradition in New York.", link: "#", image: "https://images.unsplash.com/photo-1547153760-18fc86324498?auto=format&fit=crop&w=800&q=80", isPast: true },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const uniqueVenues: string[] = Array.from<string>(new Set(events.map(e => e.venue.split(',')[0].trim()))).sort();
  const genres: Event['type'][] = ['Classical', 'Ballet', 'Drama', 'Jazz'];

  const filteredEvents = events.filter(e => {
    const matchesTab = activeTab === 'Upcoming' ? !e.isPast : e.isPast;
    if (!matchesTab) return false;

    const matchesType = selectedTypes.length === 0 || selectedTypes.includes(e.type);
    const matchesVenue = selectedVenues.length === 0 || selectedVenues.some(v => e.venue.includes(v));
    
    const searchLower = globalSearchQuery.toLowerCase();
    const matchesSearch = globalSearchQuery === '' || 
      e.title.toLowerCase().includes(searchLower) ||
      e.venue.toLowerCase().includes(searchLower) ||
      e.type.toLowerCase().includes(searchLower) ||
      e.description.toLowerCase().includes(searchLower) ||
      e.date.toLowerCase().includes(searchLower);

    return matchesType && matchesVenue && matchesSearch;
  });

  const toggleType = (type: string) => {
    setSelectedTypes(prev => prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]);
  };

  const toggleVenue = (venue: string) => {
    setSelectedVenues(prev => prev.includes(venue) ? prev.filter(v => v !== venue) : [...prev, venue]);
  };

  const clearFilters = () => {
    setSelectedTypes([]);
    setSelectedVenues([]);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between border-b border-research-border pb-4">
        <div className="flex gap-8">
          {['Upcoming', 'Past'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`text-[10px] font-mono uppercase tracking-[0.3em] transition-all relative py-2 ${
                activeTab === tab ? 'text-research-accent' : 'text-research-ink/40 hover:text-research-ink'
              }`}
            >
              {tab} Events
              {activeTab === tab && (
                <motion.div
                  layoutId="tab-underline"
                  className="absolute bottom-0 left-0 right-0 h-px bg-research-accent"
                />
              )}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2 transition-colors flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest ${
              showFilters || selectedTypes.length > 0 || selectedVenues.length > 0
                ? 'text-research-accent' 
                : 'text-research-ink/40 hover:text-research-accent'
            }`}
          >
            <Filter size={16} />
            <span className="hidden sm:inline">Filters</span>
            {(selectedTypes.length > 0 || selectedVenues.length > 0) && (
              <span className="w-1.5 h-1.5 rounded-full bg-research-accent" />
            )}
          </button>
          <button 
            onClick={fetchEvents}
            disabled={loading}
            className="p-2 text-research-ink/40 hover:text-research-accent transition-colors disabled:opacity-50"
          >
            <Loader2 size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Filter Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-b border-research-border"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-8">
              {/* Type Filter */}
              <div className="space-y-4">
                <h4 className="text-[10px] font-mono uppercase tracking-widest text-research-ink/40">Genre</h4>
                <div className="flex flex-wrap gap-2">
                  {genres.map(type => (
                    <button
                      key={type}
                      onClick={() => toggleType(type)}
                      className={`px-3 py-1.5 rounded-full text-[10px] font-mono uppercase tracking-wider border transition-all ${
                        selectedTypes.includes(type)
                          ? 'bg-research-accent text-white border-research-accent'
                          : 'border-research-border text-research-ink/60 hover:border-research-accent/50'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Venue Filter */}
              <div className="space-y-4">
                <h4 className="text-[10px] font-mono uppercase tracking-widest text-research-ink/40">Venue</h4>
                <div className="max-h-32 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                  {uniqueVenues.map(venue => (
                    <button
                      key={venue}
                      onClick={() => toggleVenue(venue)}
                      className="flex items-center gap-2 w-full text-left group"
                    >
                      <div className={`w-3 h-3 rounded border flex items-center justify-center transition-colors ${
                        selectedVenues.includes(venue) ? 'bg-research-accent border-research-accent' : 'border-research-border group-hover:border-research-accent/50'
                      }`}>
                        {selectedVenues.includes(venue) && <Check size={8} className="text-white" />}
                      </div>
                      <span className={`text-[10px] font-mono uppercase tracking-wider transition-colors ${
                        selectedVenues.includes(venue) ? 'text-research-ink' : 'text-research-ink/60 group-hover:text-research-ink'
                      }`}>
                        {venue}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="pb-8 flex justify-end">
              <button 
                onClick={clearFilters}
                className="text-[9px] font-mono uppercase tracking-[0.2em] text-research-ink/40 hover:text-research-accent transition-colors"
              >
                Clear All Filters
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 space-y-4">
          <Loader2 size={32} className="animate-spin text-research-accent/20" />
          <p className="text-[10px] font-mono uppercase tracking-widest text-research-ink/40">Consulting global archives...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="space-y-6"
            >
              {filteredEvents.length > 0 ? (
                filteredEvents.map((event) => (
                  <div 
                    key={event.id} 
                    className="flex flex-col lg:flex-row bg-white border border-research-border rounded-3xl group hover:border-research-accent/50 transition-all shadow-sm hover:shadow-md relative overflow-hidden"
                  >
                    <div className="absolute top-0 left-0 w-1 h-full bg-research-accent/5 group-hover:bg-research-accent transition-colors z-10" />
                    
                    {/* Event Image */}
                    <div className="w-full lg:w-64 h-48 lg:h-auto relative overflow-hidden shrink-0">
                      <img 
                        src={event.image} 
                        alt={event.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 scale-105 group-hover:scale-100"
                      />
                      <div className="absolute inset-0 bg-research-ink/10 group-hover:bg-transparent transition-colors" />
                    </div>

                    <div className="flex-1 p-8 space-y-3">
                      <div className="flex items-center gap-3">
                        <span 
                          className="px-2 py-0.5 bg-research-accent/5 text-research-accent text-[9px] font-mono uppercase tracking-widest rounded cursor-pointer hover:bg-research-accent/10 transition-colors"
                          onClick={() => {
                            const genre = GENRES_DATA[event.type];
                            if (genre) {
                              setSelectedGenre(genre);
                              setActiveSection('GenreDetail');
                            }
                          }}
                        >
                          {event.type}
                        </span>
                        <span className="text-[9px] font-mono text-research-ink/40 uppercase tracking-widest flex items-center gap-1">
                          <Calendar size={10} /> {event.date}
                        </span>
                        <span className="text-[9px] font-mono text-research-ink/40 uppercase tracking-widest flex items-center gap-1">
                          <Clock size={10} /> {event.time}
                        </span>
                      </div>
                      
                      <h3 
                        className="text-2xl font-serif text-research-ink group-hover:text-research-accent transition-colors cursor-pointer hover:underline underline-offset-4"
                        onClick={() => {
                          const work = WORKS.find(w => w.title === event.title);
                          if (work) {
                            setSelectedWork(work);
                            setActiveSection('Music');
                          }
                        }}
                      >
                        {event.title}
                      </h3>

                      <p 
                        className="text-research-ink/60 font-serif italic text-sm flex items-center gap-2 cursor-pointer hover:text-research-accent transition-colors"
                        onClick={() => {
                          const artist = ARTISTS.find(a => a.name === event.performer);
                          if (artist) {
                            setSelectedArtist(artist);
                            setActiveSection('ArtistDetail');
                          }
                        }}
                      >
                        <ViolinistIcon size={12} className="text-research-accent/40" />
                        {event.performer}
                      </p>
                      
                      <p className="text-research-ink/60 font-serif italic text-sm flex items-center gap-2">
                        <MapPin size={12} className="text-research-accent/40" />
                        {event.venue}
                      </p>
                      
                      <p className="text-xs text-research-ink/50 leading-relaxed max-w-2xl">
                        {event.description}
                      </p>
                    </div>

                    <div className="p-8 lg:pl-0 flex items-center justify-end">
                      <a 
                        href={event.link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="p-4 border border-research-border rounded-full text-research-ink/40 hover:text-research-accent hover:border-research-accent transition-all hover:scale-110"
                      >
                        <ExternalLink size={20} />
                      </a>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-24 text-center border-2 border-dashed border-research-border rounded-3xl">
                  <p className="text-sm font-serif italic text-research-ink/40">No records found for this period.</p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};
const Y2KPlayer = ({ 
  status, 
  setStatus, 
  isPlaying, 
  setIsPlaying, 
  isMuted, 
  setIsMuted, 
  progress, 
  setProgress, 
  currentTime, 
  setCurrentTime,
  setActiveSection,
  setSelectedArtist,
  setSelectedComposer,
  setSelectedWork,
  COMPOSERS_DATA,
  totalTime = '06:42'
}: { 
  status: PlayerStatus, 
  setStatus: (s: PlayerStatus) => void,
  isPlaying: boolean,
  setIsPlaying: (p: boolean) => void,
  isMuted: boolean,
  setIsMuted: (m: boolean) => void,
  progress: number,
  setProgress: (p: number) => void,
  currentTime: string,
  setCurrentTime: (t: string) => void,
  setActiveSection: (s: Section) => void,
  setSelectedArtist: (a: Artist) => void,
  setSelectedComposer: (c: Composer) => void,
  setSelectedWork: (w: Work) => void,
  COMPOSERS_DATA: Record<string, Composer>,
  totalTime?: string
}) => {
  return (
    <div className="relative flex flex-col items-center justify-center px-6 pb-6 pt-12 bg-white rounded-[32px] border border-research-border shadow-xl w-full max-w-[560px] mx-auto">
      {/* Window Controls */}
      <div className="absolute top-5 left-8 flex items-center gap-2 opacity-30 hover:opacity-100 transition-opacity z-10">
        <button 
          onClick={() => setStatus('minimized')}
          className="p-1 hover:text-research-accent transition-colors"
        >
          <Minus size={10} />
        </button>
        <button 
          onClick={() => setStatus('fullscreen')}
          className="p-1 hover:text-research-accent transition-colors"
        >
          <Maximize2 size={10} />
        </button>
        <button 
          onClick={() => {
            setIsPlaying(false);
            setStatus('minimized');
          }}
          className="p-1 hover:text-research-accent transition-colors"
        >
          <X size={10} />
        </button>
      </div>

      {/* The 16x9 Screen */}
      <div className="w-full aspect-video bg-research-accent/5 border border-research-accent/20 rounded-xl relative overflow-hidden mb-6 flex items-center justify-center">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0)_50%,rgba(0,0,0,0.02)_50%),linear-gradient(90deg,rgba(0,0,0,0.01),rgba(0,0,0,0.01),rgba(0,0,0,0.01))] bg-[length:100%_2px,3px_100%] pointer-events-none" />
        <div className="absolute bottom-6 left-0 right-0 text-center text-research-accent font-mono text-[10px] tracking-[0.3em] uppercase animate-pulse bg-white/80 py-2 backdrop-blur-md border-y border-research-border">
          {isPlaying ? "Data Stream: Bach - Cello Suite No. 1" : "System Calibrated"}
        </div>
        {/* Visualizer bars (simulated) */}
        <div className="absolute bottom-2 left-6 right-6 flex items-end gap-1 h-4">
          {Array.from({ length: 40 }).map((_, i) => (
            <motion.div
              key={`viz-bar-small-${i}`}
              className="flex-1 bg-research-accent/30"
              animate={{
                height: isPlaying ? [1, Math.random() * 12 + 1, 1] : 1
              }}
              transition={{
                duration: 0.6,
                repeat: Infinity,
                delay: i * 0.02
              }}
            />
          ))}
        </div>
      </div>

      {/* Track Metadata */}
      <div className="w-full mb-6 text-center flex flex-col gap-1">
        <button 
          onClick={() => {
            const work = WORKS.find(w => w.title === "Cello Suite No. 1 in G Major");
            if (work) {
              setSelectedWork(work);
              setActiveSection('Music');
              setStatus('minimized');
            }
          }}
          className="text-lg font-serif text-research-ink tracking-tight hover:text-research-accent hover:underline underline-offset-4 transition-colors cursor-pointer"
        >
          Cello Suite No. 1 in G Major
        </button>
        <button 
          onClick={() => {
            const composer = COMPOSERS_DATA["J.S. Bach"];
            if (composer) {
              setSelectedComposer(composer);
              setActiveSection('ComposerDetail');
              setStatus('minimized');
            }
          }}
          className="text-[9px] font-mono uppercase tracking-[0.2em] text-research-ink/40 hover:text-research-accent hover:underline underline-offset-2 transition-colors cursor-pointer"
        >
          Johann Sebastian Bach
        </button>
        <button 
          onClick={() => {
            const artist = ARTISTS.find(a => a.name === "Yo-Yo Ma");
            if (artist) {
              setSelectedArtist(artist);
              setActiveSection('ArtistDetail');
              setStatus('minimized');
            }
          }}
          className="text-[9px] font-mono uppercase tracking-[0.2em] text-research-accent/60 hover:text-research-accent hover:underline underline-offset-2 transition-colors cursor-pointer"
        >
          Yo-Yo Ma
        </button>
      </div>

      {/* Controls */}
      <div className="w-full flex flex-col gap-6">
        {/* Progress Bar */}
        <div className="flex items-center gap-4 text-research-ink/40 font-mono text-[9px] tracking-widest">
          <span>{currentTime}</span>
          <div className="flex-1 h-px bg-research-border relative">
            <div 
              className="absolute top-0 left-0 h-full bg-research-accent" 
              style={{ width: `${progress}%` }} 
            />
          </div>
          <span>{totalTime}</span>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-center gap-8">
          <button 
            onClick={() => setIsMuted(!isMuted)}
            className="p-1.5 text-research-ink/40 hover:text-research-accent transition-colors"
          >
            {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>
          
          <button 
            onClick={() => setIsPlaying(!isPlaying)}
            className="w-10 h-10 rounded-full border border-research-border flex items-center justify-center hover:border-research-accent hover:text-research-accent transition-all group"
          >
            {isPlaying ? <Pause size={18} className="group-hover:fill-current" /> : <Play size={18} className="ml-0.5 group-hover:fill-current" />}
          </button>

          <button 
            onClick={() => { setIsPlaying(false); setProgress(0); setCurrentTime('00:00'); }}
            className="p-1.5 text-research-ink/40 hover:text-research-accent transition-colors"
          >
            <Square size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

const Dock = ({ 
  activeSection, 
  setActiveSection, 
  isPlaying, 
  playerStatus,
  setPlayerStatus,
  isMinimized,
  setIsMinimized
}: { 
  activeSection: Section, 
  setActiveSection: (s: Section) => void,
  isPlaying: boolean,
  playerStatus: PlayerStatus,
  setPlayerStatus: (s: PlayerStatus) => void,
  isMinimized: boolean,
  setIsMinimized: (m: boolean) => void
}) => {
  const rawItems: { id: Section, icon: React.ElementType, label: string }[] = [
    { id: 'Catalog', icon: Library, label: 'Catalog' },
    { id: 'Composers', icon: PenTool, label: 'Composers' },
    { id: 'Artists', icon: ViolinistIcon, label: 'Artists' },
    { id: 'Player', icon: isPlaying ? Volume2 : Play, label: 'Player' },
    { id: 'Events', icon: Calendar, label: 'Events' },
    { id: 'News', icon: Newspaper, label: 'News' },
    { id: 'Profile', icon: User, label: 'Profile' },
  ];
  const items = rawItems;

  return (
    <div className={`fixed z-50 transition-all duration-500 ease-in-out ${
      isMinimized 
        ? 'bottom-6 right-6' 
        : 'bottom-0 left-1/2 -translate-x-1/2'
    }`}>
      <motion.div 
        className={`relative flex items-center gap-2 p-2 bg-white/80 backdrop-blur-2xl border border-research-border shadow-xl ${
          isMinimized ? 'rounded-2xl' : 'rounded-t-3xl border-b-0'
        }`}
        layout
      >
        {isMinimized ? (
          <button
            onClick={() => setIsMinimized(false)}
            className="p-3 text-research-accent hover:bg-research-accent/10 rounded-xl transition-colors"
            title="Restore Dock"
          >
            <Maximize2 size={24} />
          </button>
        ) : (
          <>
            {items.map((item) => {
              const isActive = item.id === 'Player' ? playerStatus === 'normal' : activeSection === item.id;
              const Icon = item.icon;
              
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    if (item.id === 'Player') {
                      setPlayerStatus(playerStatus === 'normal' ? 'minimized' : 'normal');
                    } else {
                      setActiveSection(item.id);
                    }
                  }}
                  className="relative group p-3 rounded-xl transition-all duration-300"
                >
                  {isActive && (
                    <motion.div
                      layoutId="active-pill"
                      className="absolute inset-0 bg-research-accent/10 rounded-xl"
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  <div className="relative z-10">
                    <Icon 
                      size={24} 
                      className={`transition-colors ${isActive ? 'text-research-accent' : 'text-research-ink/40 group-hover:text-research-accent'}`} 
                    />
                    {item.id === 'Player' && isPlaying && (
                      <motion.div 
                        className="absolute -top-1 -right-1 w-2 h-2 bg-research-accent rounded-full"
                        animate={{ scale: [1, 1.5, 1] }}
                        transition={{ repeat: Infinity, duration: 1 }}
                      />
                    )}
                  </div>
                  
                  {/* Tooltip */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-research-ink text-white text-[10px] uppercase tracking-widest rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                    {item.id === 'Player' && isPlaying ? 'Now Playing' : item.label}
                  </div>
                </button>
              );
            })}
            
            {/* Minimize Button as a Dock Icon */}
            <div className="w-px h-6 bg-research-border mx-1" />
            <button 
              onClick={() => setIsMinimized(true)}
              className="relative group p-3 rounded-xl transition-all duration-300 bg-research-ink/5 hover:bg-research-ink/10 text-research-ink/40 hover:text-research-ink"
              title="Minimize Dock"
            >
              <Minus size={20} strokeWidth={3} />
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-research-ink text-white text-[10px] uppercase tracking-widest rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                Minimize
              </div>
            </button>
          </>
        )}
      </motion.div>
    </div>
  );
};

const ContentWrapper = ({ children }: { children: React.ReactNode }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    className="w-full max-w-6xl mx-auto pt-24 pb-32 px-6"
  >
    {children}
  </motion.div>
);

const CHAT_ROOMS: ChatRoom[] = [
  {
    id: 'bach-cello-1',
    name: 'Bach: Cello Suite No. 1',
    type: 'Piece',
    description: 'Discussion on interpretation, bowing, and historical context of the G Major Suite.',
    activeArtists: [
      { name: 'Yo-Yo Ma', status: 'past' },
      { name: 'Alisa Weilerstein', status: 'current' },
      { name: 'Pablo Casals', status: 'past' },
      { name: 'Julianne Pearl', status: 'future' }
    ]
  },
  {
    id: 'baroque-genre',
    name: 'Baroque Performance Practice',
    type: 'Genre',
    description: 'Exploring ornamentation, vibrato, and temperament in the 17th and 18th centuries.',
    activeArtists: [
      { name: 'Ton Koopman', status: 'current' },
      { name: 'Jordi Savall', status: 'past' }
    ]
  },
  {
    id: 'beethoven-composer',
    name: 'Beethoven: The Late Quartets',
    type: 'Composer',
    description: 'Analyzing the profound complexity of Beethoven\'s final string quartets.',
    activeArtists: [
      { name: 'Emerson String Quartet', status: 'past' },
      { name: 'Belcea Quartet', status: 'current' }
    ]
  }
];

const MOCK_MESSAGES: Record<string, ChatMessage[]> = {
  'bach-cello-1': [
    { id: '1', sender: 'Yo-Yo Ma', text: 'The prelude is all about the breath. Don\'t rush the initial G.', timestamp: '10:15 AM', isArtist: true },
    { id: '2', sender: 'Alisa Weilerstein', text: 'Agreed. I\'ve been experimenting with a slightly faster tempo for the Courante recently.', timestamp: '10:18 AM', isArtist: true },
    { id: '3', sender: 'Student_Cellist', text: 'How do you handle the string crossings in the Gigue?', timestamp: '10:20 AM', isArtist: false },
    { id: '4', sender: 'Julianne Pearl', text: 'I find keeping the elbow stable helps with the clarity there.', timestamp: '10:22 AM', isArtist: true }
  ]
};

export default function App() {
  const [activeSection, setActiveSection] = useState<Section>('Catalog');
  const [selectedWork, setSelectedWork] = useState<Work | null>(null);
  const [selectedSheetMusic, setSelectedSheetMusic] = useState<SheetMusicState | null>(null);
  const [selectedComposer, setSelectedComposer] = useState<Composer | null>(null);
  const [selectedArtist, setSelectedArtist] = useState<Artist | null>(null);
  const [selectedGenre, setSelectedGenre] = useState<Genre | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const [isAtTop, setIsAtTop] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      setIsAtTop(window.scrollY < 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Player State
  const [playerStatus, setPlayerStatus] = useState<PlayerStatus>('minimized');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(35);
  const [currentTime, setCurrentTime] = useState('02:14');

  const [isDockMinimized, setIsDockMinimized] = useState(false);

  const [profile, setProfile] = useState<UserProfile>({
    name: 'Julianne Pearl',
    role: 'Classical Musician',
    bio: 'A dedicated cellist exploring the irregular beauty of baroque and contemporary compositions. Student at the Royal Academy of Music, specializing in historical performance practice.',
    profilePicture: 'https://picsum.photos/seed/musician/400/400',
    instruments: ['Cello', 'Viola da Gamba'],
    genres: ['Baroque', 'Contemporary', 'Chamber Music'],
    discography: [
      { id: '1', title: 'The Irregular Suites', year: '2024', role: 'Soloist' },
      { id: '2', title: 'Echoes of the Pearl', year: '2023', role: 'Principal Cello' }
    ],
    performanceHistory: [
      { id: '1', event: 'Wigmore Hall Debut', venue: 'London', date: '2024-05-12' },
      { id: '2', event: 'Bach Marathon', venue: 'Berlin', date: '2023-11-20' }
    ]
  });
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  const playerProps = {
    status: playerStatus,
    setStatus: setPlayerStatus,
    isPlaying,
    setIsPlaying,
    isMuted,
    setIsMuted,
    progress,
    setProgress,
    currentTime,
    setCurrentTime,
    setActiveSection,
    setSelectedArtist,
    setSelectedComposer,
    setSelectedWork,
    COMPOSERS_DATA,
  };

  const [timelineMode, setTimelineMode] = useState<'highlight' | 'detailed'>('highlight');

  const renderContent = () => {
    switch (activeSection) {
      case 'Catalog':
        return (
          <ContentWrapper>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {WORKS.map((work, i) => {
                const colors = ["bg-amber-900/20", "bg-red-900/20", "bg-emerald-900/20", "bg-blue-900/20", "bg-purple-900/20", "bg-teal-900/20"];
                const color = colors[i % colors.length];
                return (
                  <div 
                    key={work.id} 
                    className={`p-8 rounded-3xl border border-research-border ${color} backdrop-blur-sm group cursor-pointer overflow-hidden relative shadow-sm`}
                    onClick={() => {
                      setSelectedWork(work);
                      setActiveSection('Music');
                    }}
                  >
                    <div className="relative z-10">
                      <h3 className="text-3xl font-serif text-research-ink mb-2 group-hover:text-research-accent transition-colors">{work.title}</h3>
                      <div className="flex items-center gap-2 mb-6">
                        <button 
                          className="text-xs font-mono text-research-accent uppercase tracking-[0.3em] hover:underline underline-offset-4 transition-colors cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            const composer = COMPOSERS_DATA[work.composer];
                            if (composer) {
                              setSelectedComposer(composer);
                              setActiveSection('ComposerDetail');
                            }
                          }}
                        >
                          {work.composer}
                        </button>
                        <span className="text-xs font-mono text-research-ink/20">•</span>
                        <button 
                          className="text-xs font-mono text-research-accent uppercase tracking-[0.3em] hover:underline underline-offset-4 transition-colors cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            const genre = GENRES_DATA[work.genre];
                            if (genre) {
                              setSelectedGenre(genre);
                              setActiveSection('GenreDetail');
                            }
                          }}
                        >
                          {work.genre}
                        </button>
                        <span className="text-xs font-mono text-research-ink/20">•</span>
                        <span className="text-xs font-mono text-research-ink/40 uppercase tracking-[0.3em]">{work.year}</span>
                      </div>
                      
                      <div className="space-y-4">
                        <div>
                          <p className="text-research-ink/80 font-serif italic line-clamp-2">{work.description}</p>
                        </div>

                        {/* Sheet Music Text Links */}
                        {work.sheetMusic && work.sheetMusic.length > 0 && (
                          <div className="pt-2 border-t border-research-border/30">
                            <div className="flex flex-wrap gap-x-4 gap-y-2">
                              {work.sheetMusic.slice(0, 3).map((sm, idx) => (
                                <div key={`${sm.title}-${idx}`} className="relative group/sm">
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedSheetMusic({ work, variationIndex: idx });
                                      setActiveSection('SheetMusic');
                                    }}
                                    className="text-[11px] font-mono text-research-accent hover:text-research-ink transition-colors flex items-center gap-1.5"
                                  >
                                    <LicenseDisplay license={sm.copyright} />
                                    <span className="underline underline-offset-2 decoration-research-accent/30 group-hover/sm:decoration-research-ink/50">{sm.title}</span>
                                  </button>
                                  
                                  {/* Hover Preview */}
                                  <div className="absolute bottom-full left-0 mb-4 opacity-0 invisible group-hover/sm:opacity-100 group-hover/sm:visible transition-all duration-300 z-50 pointer-events-none">
                                    <div className="bg-white p-2 rounded-lg shadow-xl border border-research-border w-48 overflow-hidden">
                                      <div className="text-[10px] font-mono text-research-ink/40 uppercase mb-1 truncate">{sm.title}</div>
                                      <div className="h-32 w-full bg-research-border rounded overflow-hidden">
                                        <img 
                                          src={sm.previewUrl} 
                                          alt="Score Preview" 
                                          className="w-full h-full object-cover object-top"
                                          referrerPolicy="no-referrer"
                                        />
                                      </div>
                                      <div className="mt-1 text-[9px] font-mono text-research-accent uppercase tracking-tighter">{sm.edition}</div>
                                    </div>
                                    <div className="w-2 h-2 bg-white border-l border-b border-research-border rotate-45 absolute -bottom-1 left-4"></div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    <TrebleClef className="absolute -bottom-4 -right-4 w-32 h-32 text-research-ink/5 group-hover:text-research-ink/10 transition-colors rotate-12" />
                  </div>
                );
              })}
            </div>
          </ContentWrapper>
        );
      case 'Music':
        if (!selectedWork) return null;
        return (
          <ContentWrapper>
            <div className="max-w-4xl mx-auto">
              {/* Header */}
              <div className="mb-12 border-b border-research-border pb-12">
                <button 
                  onClick={() => setActiveSection('Catalog')}
                  className="flex items-center gap-2 text-xs font-mono text-research-ink/40 hover:text-research-accent transition-colors uppercase tracking-widest mb-8"
                >
                  <ChevronLeft size={16} /> Back to Catalog
                </button>
                
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                  <div>
                    <h1 className="text-5xl md:text-7xl font-serif text-research-ink tracking-tighter mb-4">{selectedWork.title}</h1>
                    <div className="flex items-center gap-4 mb-2">
                      <p 
                        className="text-2xl font-serif text-research-ink/60 italic cursor-pointer hover:text-research-accent transition-colors"
                        onClick={() => {
                          const composer = COMPOSERS_DATA[selectedWork.composer];
                          if (composer) {
                            setSelectedComposer(composer);
                            setActiveSection('ComposerDetail');
                          }
                        }}
                      >
                        {selectedWork.composer}
                      </p>
                      <span className="text-research-ink/20 text-xl">•</span>
                      <button 
                        className="text-sm font-mono text-research-accent uppercase tracking-[0.3em] hover:underline underline-offset-4 transition-colors cursor-pointer"
                        onClick={() => {
                          const genre = GENRES_DATA[selectedWork.genre];
                          if (genre) {
                            setSelectedGenre(genre);
                            setActiveSection('GenreDetail');
                          }
                        }}
                      >
                        {selectedWork.genre}
                      </button>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-4xl font-mono text-research-ink/10">{selectedWork.year}</span>
                  </div>
                </div>
                
                <p className="mt-8 text-lg text-research-ink/70 leading-relaxed max-w-2xl">
                  {selectedWork.description}
                </p>
              </div>

              {/* Performances List */}
              <div className="space-y-8">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-xs font-mono text-research-ink/40 uppercase tracking-[0.4em]">Recorded Performances</h2>
                  <div className="h-px flex-1 bg-research-border mx-6" />
                  <span className="text-[10px] font-mono text-research-ink/40 uppercase">Sorted: Newest First</span>
                </div>

                {[
                  {
                    performer: "Alisa Weilerstein",
                    year: "2012",
                    artistPicture: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/Alisa_Weilerstein_2011.jpg/800px-Alisa_Weilerstein_2011.jpg",
                    location: "Berlin, Philharmonie",
                    duration: "28:30"
                  },
                  {
                    performer: "Yo-Yo Ma",
                    year: "1983",
                    artistPicture: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/Yo-Yo_Ma_2010.jpg/800px-Yo-Yo_Ma_2010.jpg",
                    location: "New York, Vanguard Studios",
                    duration: "27:50"
                  },
                  {
                    performer: "Jacqueline du Pré",
                    year: "1965",
                    artistPicture: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Jacqueline_du_Pr%C3%A9_1968.jpg/800px-Jacqueline_du_Pr%C3%A9_1968.jpg",
                    location: "London, Abbey Road Studios",
                    duration: "28:14"
                  },
                  {
                    performer: "Pablo Casals",
                    year: "1936",
                    artistPicture: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/Pablo_Casals_1950.jpg/800px-Pablo_Casals_1950.jpg",
                    location: "Paris, Salle Pleyel",
                    duration: "29:05"
                  }
                ].map((perf, i) => (
                  <motion.div 
                    key={`${perf.performer}-${perf.year}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="group flex flex-col md:flex-row gap-8 p-6 rounded-3xl border border-transparent hover:border-research-border hover:bg-white transition-all cursor-pointer"
                    onClick={() => {
                      const artist = ARTISTS.find(a => a.name === perf.performer);
                      if (artist) {
                        setSelectedArtist(artist);
                        setActiveSection('ArtistDetail');
                      }
                    }}
                  >
                    <div className="w-full md:w-48 aspect-square rounded-2xl overflow-hidden bg-research-accent/5 relative">
                      <img 
                        src={perf.artistPicture} 
                        alt={perf.performer}
                        className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-research-accent/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Play className="text-white fill-white" size={32} />
                      </div>
                    </div>
                    
                    <div className="flex-1 flex flex-col justify-center">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-2xl font-serif text-research-ink group-hover:text-research-accent transition-colors">{perf.performer}</h3>
                        <span className="font-mono text-sm text-research-ink/40">{perf.year}</span>
                      </div>
                      <p className="text-sm font-mono text-research-ink/40 uppercase tracking-widest mb-4">{perf.location}</p>
                      
                      <div className="flex items-center gap-6 mt-auto">
                        <div className="flex items-center gap-2 text-[10px] font-mono text-research-ink/40">
                          <Clock size={12} />
                          {perf.duration}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-mono text-research-ink/40">
                          <Volume2 size={12} />
                          High Fidelity Stream
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </ContentWrapper>
        );
      case 'ComposerDetail':
        if (!selectedComposer) return null;
        return (
          <ContentWrapper>
            <div className="max-w-4xl mx-auto">
              {/* Header */}
              <div className="mb-12 border-b border-research-border pb-12">
                <button 
                  onClick={() => setActiveSection('Catalog')}
                  className="flex items-center gap-2 text-xs font-mono text-research-ink/40 hover:text-research-accent transition-colors uppercase tracking-widest mb-8"
                >
                  <ChevronLeft size={16} /> Back to Catalog
                </button>
                
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                  <div>
                    <h1 className="text-5xl md:text-7xl font-serif text-research-ink tracking-tighter mb-4">{selectedComposer.name}</h1>
                    <div className="flex flex-wrap gap-4 items-center">
                      <span className="text-sm font-mono text-research-accent uppercase tracking-widest">{selectedComposer.nationality}</span>
                      <span className="h-1 w-1 rounded-full bg-research-border" />
                      <span className="text-sm font-mono text-research-ink/40">{selectedComposer.born} — {selectedComposer.died}</span>
                    </div>
                  </div>
                </div>

                {/* Roles */}
                <div className="flex flex-wrap gap-2 mt-8">
                  {selectedComposer.roles.map((role) => (
                    <span key={role} className="px-3 py-1 bg-research-accent/5 text-[10px] font-mono text-research-accent uppercase tracking-widest rounded-full border border-research-accent/10">
                      {role}
                    </span>
                  ))}
                </div>
                
                <p className="mt-10 text-xl font-serif text-research-ink/70 leading-relaxed italic">
                  {selectedComposer.shortBio}
                </p>
              </div>

              {/* Detailed Bio */}
              <div className="mb-16">
                <h2 className="text-xs font-mono text-research-ink/40 uppercase tracking-[0.4em] mb-8">Biography</h2>
                <p className="text-lg text-research-ink/70 leading-relaxed">
                  {selectedComposer.fullBio}
                </p>
              </div>

              {/* Unified Timeline */}
              <div className="mb-16">
                <div className="flex items-center gap-8 mb-12">
                  <h2 className="text-xs font-mono text-research-ink/40 uppercase tracking-[0.4em]">Life & Works Timeline</h2>
                  
                  {/* Subtle Toggle */}
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={() => setTimelineMode('highlight')}
                      className={`px-2 py-0.5 text-[9px] font-mono uppercase tracking-widest transition-all border-b ${timelineMode === 'highlight' ? 'border-research-accent text-research-accent' : 'border-transparent text-research-ink/30 hover:text-research-ink/50'}`}
                    >
                      Highlight
                    </button>
                    <span className="text-[9px] font-mono text-research-ink/10">/</span>
                    <button 
                      onClick={() => setTimelineMode('detailed')}
                      className={`px-2 py-0.5 text-[9px] font-mono uppercase tracking-widest transition-all border-b ${timelineMode === 'detailed' ? 'border-research-accent text-research-accent' : 'border-transparent text-research-ink/30 hover:text-research-ink/50'}`}
                    >
                      Detailed
                    </button>
                  </div>
                </div>

                <div className="space-y-12 relative">
                  {/* Vertical Line */}
                  <div className="absolute left-8 top-0 bottom-0 w-px bg-research-border" />
                  
                  {selectedComposer.timeline
                    .filter(item => timelineMode === 'detailed' || item.isHighlight)
                    .map((item, i) => (
                    <div key={`${item.year}-${item.event}-${i}`} className="relative pl-20">
                      {/* Year Label on the line */}
                      <div className="absolute left-0 top-1.5 -ml-8 w-16 flex justify-center">
                        <span className="text-[10px] font-mono bg-research-bg px-2 py-0.5 border border-research-border rounded-full z-10 text-research-ink/60">
                          {item.year}
                        </span>
                      </div>

                      {/* Content */}
                      <div className={`flex-1 pb-2 ${item.type === 'work' ? 'ml-8' : ''}`}>
                        {item.type === 'work' ? (
                          <div 
                            className="group cursor-pointer"
                            onClick={() => {
                              const work = WORKS.find(w => w.title === item.event);
                              if (work) {
                                setSelectedWork(work);
                                setActiveSection('Music');
                              }
                            }}
                          >
                            <h3 className="text-2xl font-serif text-research-ink group-hover:text-research-accent transition-colors">{item.event}</h3>
                          </div>
                        ) : (
                          <p className="text-lg text-research-ink/70 leading-relaxed font-serif italic">
                            {item.event}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </ContentWrapper>
        );
      case 'Artists':
        return (
          <ContentWrapper>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {ARTISTS.map((artist, i) => {
                const colors = ["bg-amber-900/20", "bg-red-900/20", "bg-emerald-900/20", "bg-blue-900/20", "bg-purple-900/20", "bg-teal-900/20"];
                const color = colors[i % colors.length];
                return (
                  <div 
                    key={artist.id} 
                    className={`p-8 rounded-3xl border border-research-border ${color} backdrop-blur-sm group cursor-pointer overflow-hidden relative shadow-sm`}
                    onClick={() => {
                      setSelectedArtist(artist);
                      setActiveSection('ArtistDetail');
                    }}
                  >
                    <div className="relative z-10">
                      <h3 className="text-3xl font-serif text-research-ink mb-2 group-hover:text-research-accent transition-colors">{artist.name}</h3>
                      <p className="text-xs font-mono text-research-accent uppercase tracking-[0.3em] mb-6">{artist.instrument} • {artist.period}</p>
                      <div className="space-y-2">
                        <p className="text-xs text-research-ink/40 uppercase tracking-widest">Notable Recordings</p>
                        <p className="text-research-ink/80 font-serif italic line-clamp-2">{artist.recordings.join(', ')}</p>
                      </div>
                    </div>
                    <ViolinistIcon className="absolute -bottom-4 -right-4 w-32 h-32 text-research-ink/5 group-hover:text-research-ink/10 transition-colors rotate-12" />
                  </div>
                );
              })}
            </div>
          </ContentWrapper>
        );
      case 'ArtistDetail':
        if (!selectedArtist) return null;
        return (
          <ContentWrapper>
            <div className="max-w-4xl mx-auto">
              {/* Header */}
              <div className="mb-12 border-b border-research-border pb-12">
                <button 
                  onClick={() => setActiveSection('Artists')}
                  className="flex items-center gap-2 text-xs font-mono text-research-ink/40 hover:text-research-accent transition-colors uppercase tracking-widest mb-8"
                >
                  <ChevronLeft size={16} /> Back to Artists
                </button>
                
                <div className="flex flex-col md:flex-row gap-12">
                  <div className="w-full md:w-64 h-64 shrink-0 rounded-3xl overflow-hidden border border-research-border shadow-sm">
                    <img 
                      src={selectedArtist.image} 
                      alt={selectedArtist.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700"
                    />
                  </div>
                  <div className="flex-1">
                    <span className="text-xs font-mono text-research-accent uppercase tracking-[0.3em] mb-4 block">Artist Profile</span>
                    <h1 className="text-5xl md:text-7xl font-serif text-research-ink tracking-tighter mb-4">{selectedArtist.name}</h1>
                    <div className="flex flex-wrap gap-4 items-center">
                      <span className="text-sm font-mono text-research-accent uppercase tracking-widest">{selectedArtist.instrument}</span>
                      <span className="h-1 w-1 rounded-full bg-research-border" />
                      <span className="text-sm font-mono text-research-ink/40">{selectedArtist.period}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bio */}
              <div className="mb-16">
                <h2 className="text-xs font-mono text-research-ink/40 uppercase tracking-[0.4em] mb-8">Biography</h2>
                <p className="text-xl font-serif text-research-ink/70 leading-relaxed italic">
                  {selectedArtist.bio}
                </p>
              </div>

              {/* Notable Recordings */}
              <div className="mb-16">
                <h2 className="text-xs font-mono text-research-ink/40 uppercase tracking-[0.4em] mb-8">Notable Recordings</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedArtist.recordings.map((rec) => (
                    <div key={rec} className="p-4 border border-research-border rounded-xl flex items-center gap-4 group hover:border-research-accent/50 transition-colors">
                      <div className="w-10 h-10 rounded bg-research-accent/5 flex items-center justify-center text-research-accent/40 group-hover:text-research-accent transition-colors">
                        <Library size={18} />
                      </div>
                      <span className="text-sm font-serif text-research-ink/80">{rec}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </ContentWrapper>
        );
      case 'Events':
        return (
          <ContentWrapper>
            <EventsView 
              globalSearchQuery={searchQuery} 
              setSelectedWork={setSelectedWork}
              setSelectedArtist={setSelectedArtist}
              setSelectedGenre={setSelectedGenre}
              setActiveSection={setActiveSection}
            />
          </ContentWrapper>
        );
      case 'GenreDetail':
        if (!selectedGenre) return null;
        return (
          <ContentWrapper>
            <GenreDetail 
              genre={selectedGenre}
              onBack={() => setActiveSection('Catalog')}
              setActiveSection={setActiveSection}
              setSelectedComposer={setSelectedComposer}
              setSelectedWork={setSelectedWork}
            />
          </ContentWrapper>
        );
      case 'Composers':
        return (
          <ContentWrapper>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {['J.S. Bach', 'L. van Beethoven', 'W.A. Mozart', 'I. Stravinsky'].map((key) => {
                  const composer = {
                    "J.S. Bach": { name: "Johann Sebastian Bach", era: "Baroque", contribution: "Counterpoint, Fugue, Harmony", color: "bg-amber-900/20" },
                    "L. van Beethoven": { name: "Ludwig van Beethoven", era: "Classical/Romantic", contribution: "Symphonic Form, Emotional Depth", color: "bg-red-900/20" },
                    "W.A. Mozart": { name: "Wolfgang Amadeus Mozart", era: "Classical", contribution: "Symphony, Opera, Chamber Music", color: "bg-emerald-900/20" },
                    "I. Stravinsky": { name: "Igor Stravinsky", era: "Modern", contribution: "Rhythm, Neoclassicism", color: "bg-blue-900/20" },
                  }[key as keyof typeof COMPOSERS_DATA];
                  
                  if (!composer) return null;

                  return (
                    <div 
                      key={key} 
                      className={`p-8 rounded-3xl border border-research-border ${composer.color} backdrop-blur-sm group cursor-pointer overflow-hidden relative shadow-sm`}
                      onClick={() => {
                        const data = COMPOSERS_DATA[key];
                        if (data) {
                          setSelectedComposer(data);
                          setActiveSection('ComposerDetail');
                        }
                      }}
                    >
                      <div className="relative z-10">
                        <h3 className="text-3xl font-serif text-research-ink mb-2 group-hover:text-research-accent transition-colors">{composer.name}</h3>
                        <p className="text-xs font-mono text-research-accent uppercase tracking-[0.3em] mb-6">{composer.era}</p>
                        <div className="space-y-2">
                          <p className="text-xs text-research-ink/40 uppercase tracking-widest">Key Traditions</p>
                          <p className="text-research-ink/80 font-serif italic">{composer.contribution}</p>
                        </div>
                      </div>
                      <PenTool className="absolute -bottom-4 -right-4 w-32 h-32 text-research-ink/5 group-hover:text-research-ink/10 transition-colors rotate-12" />
                    </div>
                  );
                })}
            </div>
          </ContentWrapper>
        );
      case 'News':
        return (
          <ContentWrapper>
            <div className="max-w-3xl space-y-12">
              {[
                { date: "March 12, 2026", title: "Irregular Pearl Awarded 501(c)(3) Status", excerpt: "We are proud to announce our official nonprofit status, enabling us to further our mission of preserving classical traditions." },
                { date: "February 28, 2026", title: "New Collaborative Tools for Musicology", excerpt: "Our latest update introduces real-time annotation for digital scores, allowing musicians to share insights across borders." },
                { date: "January 15, 2026", title: "The 'Pearl' Project: Digitizing the Baroque", excerpt: "A multi-year initiative to create high-fidelity digital twins of historical instruments and manuscripts." },
              ].map((news) => (
                <article key={news.title} className="group cursor-pointer">
                  <time className="text-[10px] font-mono text-research-accent uppercase tracking-widest mb-4 block">{news.date}</time>
                  <h3 className="text-3xl font-serif text-research-ink mb-4 group-hover:underline decoration-research-accent/20 underline-offset-8 transition-all">{news.title}</h3>
                  <p className="text-research-ink/60 leading-relaxed font-serif italic text-lg">{news.excerpt}</p>
                  <div className="mt-6 flex items-center gap-2 text-research-ink/40 group-hover:text-research-accent transition-colors">
                    <span className="text-xs font-mono uppercase tracking-widest">Read More</span>
                    <ChevronRight size={14} />
                  </div>
                </article>
              ))}
            </div>
          </ContentWrapper>
        );
      case 'Profile':
        return (
          <ContentWrapper>
            <div className="max-w-4xl mx-auto">
              {/* Profile Header */}
              <div className="mb-12 border-b border-research-border pb-12">
                <div className="flex flex-col md:flex-row gap-12 items-start">
                  <div className="relative group">
                    <div className="w-48 h-48 rounded-3xl overflow-hidden border border-research-border shadow-2xl bg-research-ink/5">
                      <img 
                        src={profile.profilePicture} 
                        alt={profile.name}
                        className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    {isEditingProfile && (
                      <button className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl">
                        <Camera className="text-white" size={24} />
                      </button>
                    )}
                  </div>
                  
                  <div className="flex-1 space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        {isEditingProfile ? (
                          <div className="space-y-4">
                            <input 
                              type="text" 
                              value={profile.name}
                              onChange={(e) => setProfile({...profile, name: e.target.value})}
                              className="text-5xl font-serif text-research-ink bg-transparent border-b border-research-accent focus:outline-none w-full"
                            />
                            <div className="flex flex-wrap gap-2">
                              {profile.instruments.map((inst, i) => (
                                <span key={`${inst}-${i}`} className="px-2 py-1 bg-research-accent/10 border border-research-accent/20 rounded text-[10px] font-mono text-research-accent uppercase flex items-center gap-1">
                                  {inst}
                                  <button 
                                    onClick={() => setProfile({...profile, instruments: profile.instruments.filter((_, idx) => idx !== i)})}
                                    className="hover:text-red-500"
                                  >
                                    <X size={10} />
                                  </button>
                                </span>
                              ))}
                              <button 
                                onClick={() => {
                                  const inst = prompt('Enter instrument:');
                                  if (inst) setProfile({...profile, instruments: [...profile.instruments, inst]});
                                }}
                                className="px-2 py-1 border border-dashed border-research-border rounded text-[10px] font-mono text-research-ink/30 uppercase hover:border-research-accent hover:text-research-accent transition-colors"
                              >
                                + Add Instrument
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <h1 className="text-5xl md:text-7xl font-serif text-research-ink tracking-tighter">{profile.name}</h1>
                            <p className="text-sm font-mono text-research-accent uppercase tracking-[0.3em] mt-4">{profile.instruments.join(', ')}</p>
                          </>
                        )}
                        
                        {isEditingProfile && (
                          <select 
                            value={profile.role}
                            onChange={(e) => setProfile({...profile, role: e.target.value})}
                            className="mt-4 text-sm font-mono text-research-accent uppercase tracking-widest bg-transparent border border-research-border p-2 focus:outline-none"
                          >
                            <option value="Classical Musician">Classical Musician</option>
                            <option value="Classical Student">Classical Student</option>
                            <option value="Classical Enthusiast">Classical Enthusiast</option>
                          </select>
                        )}
                      </div>
                      
                      <button 
                        onClick={() => setIsEditingProfile(!isEditingProfile)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all text-xs font-mono uppercase tracking-widest ${
                          isEditingProfile 
                            ? 'bg-research-accent text-white border-research-accent' 
                            : 'bg-white text-research-ink border-research-border hover:border-research-accent'
                        }`}
                      >
                        {isEditingProfile ? <><Save size={14} /> Save Profile</> : <><Edit2 size={14} /> Edit Profile</>}
                      </button>
                    </div>
                    
                    <div className="pt-4">
                      {isEditingProfile ? (
                        <textarea 
                          value={profile.bio}
                          onChange={(e) => setProfile({...profile, bio: e.target.value})}
                          className="w-full h-32 p-4 bg-research-ink/5 border border-research-border rounded-xl font-serif text-research-ink/70 italic focus:outline-none focus:border-research-accent transition-colors"
                        />
                      ) : (
                        <p className="text-xl font-serif text-research-ink/70 leading-relaxed italic">
                          {profile.bio}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                {/* Left Column: Genres */}
                <div className="md:col-span-1 space-y-12">
                  <div>
                    <h2 className="text-[10px] font-mono text-research-ink/40 uppercase tracking-[0.4em] mb-6 flex items-center gap-2">
                      <Globe size={12} /> Associated Genres
                    </h2>
                    <div className="flex flex-wrap gap-2">
                      {profile.genres.map((genre, i) => (
                        <span key={`${genre}-${i}`} className="px-3 py-1 bg-research-accent/5 border border-research-accent/20 rounded-full text-[10px] font-mono text-research-accent uppercase tracking-widest flex items-center gap-2">
                          {genre}
                          {isEditingProfile && (
                            <button 
                              onClick={() => setProfile({...profile, genres: profile.genres.filter((_, idx) => idx !== i)})}
                              className="text-research-accent hover:text-red-500"
                            >
                              <X size={10} />
                            </button>
                          )}
                        </span>
                      ))}
                      {isEditingProfile && (
                        <button 
                          onClick={() => {
                            const genre = prompt('Enter genre:');
                            if (genre) setProfile({...profile, genres: [...profile.genres, genre]});
                          }}
                          className="px-3 py-1 border border-dashed border-research-border rounded-full text-[10px] font-mono text-research-ink/30 uppercase tracking-widest hover:border-research-accent hover:text-research-accent transition-colors"
                        >
                          + Add
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Column: Discography & Performance History */}
                <div className="md:col-span-2 space-y-12">
                  <div>
                    <div className="flex justify-between items-center mb-8">
                      <h2 className="text-[10px] font-mono text-research-ink/40 uppercase tracking-[0.4em] flex items-center gap-2">
                        <Disc size={12} /> Discography
                      </h2>
                      {isEditingProfile && (
                        <button 
                          onClick={() => {
                            const title = prompt('Album Title:');
                            const year = prompt('Year:');
                            const role = prompt('Role:');
                            if (title && year && role) {
                              setProfile({
                                ...profile, 
                                discography: [...profile.discography, { id: Date.now().toString(), title, year, role }]
                              });
                            }
                          }}
                          className="text-[10px] font-mono text-research-accent uppercase tracking-widest hover:underline"
                        >
                          + Add Entry
                        </button>
                      )}
                    </div>
                    <div className="space-y-4">
                      {profile.discography.map((item) => (
                        <div key={item.id} className="p-6 bg-white border border-research-border rounded-2xl shadow-sm group hover:border-research-accent transition-all flex justify-between items-center">
                          <div>
                            <h3 className="text-xl font-serif text-research-ink">{item.title}</h3>
                            <p className="text-[10px] font-mono text-research-ink/40 uppercase tracking-widest mt-1">
                              {item.year} • {item.role}
                            </p>
                          </div>
                          {isEditingProfile && (
                            <button 
                              onClick={() => setProfile({...profile, discography: profile.discography.filter(d => d.id !== item.id)})}
                              className="p-2 text-research-ink/20 hover:text-red-500 transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-8">
                      <h2 className="text-[10px] font-mono text-research-ink/40 uppercase tracking-[0.4em] flex items-center gap-2">
                        <History size={12} /> Performance History
                      </h2>
                      {isEditingProfile && (
                        <button 
                          onClick={() => {
                            const event = prompt('Event Name:');
                            const venue = prompt('Venue:');
                            const date = prompt('Date (YYYY-MM-DD):');
                            if (event && venue && date) {
                              setProfile({
                                ...profile, 
                                performanceHistory: [...profile.performanceHistory, { id: Date.now().toString(), event, venue, date }]
                              });
                            }
                          }}
                          className="text-[10px] font-mono text-research-accent uppercase tracking-widest hover:underline"
                        >
                          + Add Entry
                        </button>
                      )}
                    </div>
                    <div className="space-y-4">
                      {profile.performanceHistory.map((perf) => (
                        <div key={perf.id} className="p-6 bg-research-ink/5 border border-research-border rounded-2xl group hover:bg-white hover:border-research-accent transition-all flex justify-between items-center">
                          <div className="flex gap-6 items-center">
                            <div className="text-center min-w-[60px]">
                              <p className="text-[10px] font-mono text-research-accent uppercase tracking-widest">{new Date(perf.date).getFullYear()}</p>
                              <p className="text-xs font-serif italic text-research-ink/40">{new Date(perf.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                            </div>
                            <div className="w-px h-8 bg-research-border" />
                            <div>
                              <h3 className="text-lg font-serif text-research-ink">{perf.event}</h3>
                              <p className="text-[10px] font-mono text-research-ink/40 uppercase tracking-widest">{perf.venue}</p>
                            </div>
                          </div>
                          {isEditingProfile && (
                            <button 
                              onClick={() => setProfile({...profile, performanceHistory: profile.performanceHistory.filter(p => p.id !== perf.id)})}
                              className="p-2 text-research-ink/20 hover:text-red-500 transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </ContentWrapper>
        );
      case 'SheetMusic':
        if (!selectedSheetMusic) return null;
        const { work: smWork, variationIndex } = selectedSheetMusic;
        const variation = smWork.sheetMusic?.[variationIndex];
        if (!variation) return null;
        
        return (
          <ContentWrapper>
            <div className="max-w-5xl mx-auto">
              <button 
                onClick={() => setActiveSection('Catalog')}
                className="flex items-center gap-2 text-xs font-mono text-research-ink/40 hover:text-research-accent transition-colors uppercase tracking-widest mb-8"
              >
                <ChevronLeft size={16} /> Back to Catalog
              </button>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                <div className="lg:col-span-1">
                  <div className="sticky top-24">
                    <span className="text-xs font-mono text-research-accent uppercase tracking-[0.3em] mb-4 block">Musical Score Archive</span>
                    <h1 className="text-4xl font-serif text-research-ink tracking-tighter mb-2">{smWork.title}</h1>
                    <p className="text-xl font-serif text-research-ink/60 italic mb-8">{smWork.composer}</p>
                    
                    <div className="space-y-6 p-6 bg-research-ink/5 rounded-2xl border border-research-border">
                      <div>
                        <p className="text-[10px] font-mono text-research-ink/40 uppercase tracking-widest mb-1">Edition</p>
                        <p className="font-serif text-research-ink">{variation.title}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-mono text-research-ink/40 uppercase tracking-widest mb-1">Copyright Status</p>
                        <div className="flex items-center gap-2">
                          <LicenseDisplay license={variation.copyright} />
                          <p className="font-serif text-research-ink text-research-accent">{variation.copyright || 'Public Domain'}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-[10px] font-mono text-research-ink/40 uppercase tracking-widest mb-1">Date of Publication</p>
                        <p className="font-serif text-research-ink">{variation.edition}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-mono text-research-ink/40 uppercase tracking-widest mb-1">Archive Notes</p>
                        <p className="text-sm text-research-ink/70 leading-relaxed italic">
                          This scan represents the top-level archival entry for this specific historical edition. 
                          High-resolution plates are available for academic research.
                        </p>
                      </div>
                    </div>
                    
                    <div className="mt-8 space-y-3">
                      <p className="text-[10px] font-mono text-research-ink/40 uppercase tracking-widest mb-4">Other Variations</p>
                      {smWork.sheetMusic?.map((v, i) => (
                        <button 
                          key={`${v.title}-${i}`}
                          onClick={() => setSelectedSheetMusic({ work: smWork, variationIndex: i })}
                          className={`w-full text-left p-4 rounded-xl border transition-all flex items-center justify-between group ${
                            i === variationIndex 
                              ? 'bg-research-accent text-white border-research-accent' 
                              : 'bg-white text-research-ink border-research-border hover:border-research-accent'
                          }`}
                        >
                          <span className="text-sm font-serif">
                            <LicenseDisplay 
                              license={v.copyright || 'Public Domain'} 
                              className={`mr-2 ${i === variationIndex ? 'text-white/60' : 'text-research-accent'}`} 
                            />
                            {v.title}
                          </span>
                          <FileText size={14} className={i === variationIndex ? 'text-white' : 'text-research-ink/20 group-hover:text-research-accent'} />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="lg:col-span-2">
                  <div className="bg-white p-8 rounded-3xl border border-research-border shadow-2xl min-h-[1000px] flex flex-col items-center">
                    <div className="w-full border-b border-research-border pb-8 mb-8 text-center">
                      <h2 className="text-2xl font-serif text-research-ink mb-1">{smWork.title}</h2>
                      <p className="text-sm font-mono text-research-ink/40 uppercase tracking-widest">{variation.edition}</p>
                    </div>
                    
                    <div className="w-full flex-1 bg-[#fdfaf1] rounded-lg overflow-hidden border border-research-border relative shadow-inner">
                      {/* Paper Texture Overlay */}
                      <div className="absolute inset-0 opacity-[0.05] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/paper-fibers.png')]" />
                      <img 
                        src={variation.previewUrl} 
                        alt="Full Sheet Music" 
                        className="w-full object-contain relative z-10"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    
                    <div className="mt-8 text-center">
                      <p className="text-[10px] font-mono text-research-ink/20 uppercase tracking-[0.5em]">End of Preview Segment</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </ContentWrapper>
        );
      case 'Community':
        return (
          <ContentWrapper>
            <div className="max-w-6xl mx-auto h-[70vh] flex gap-8">
              {/* Sidebar: Rooms List */}
              <div className="w-80 flex flex-col gap-6">
                <div className="space-y-2">
                  <h2 className="text-4xl font-serif italic text-research-ink">Community</h2>
                  <p className="text-xs font-mono text-research-ink/40 uppercase tracking-widest">Connect with artists & scholars</p>
                </div>
                
                <div className="flex-1 overflow-y-auto space-y-4 pr-4 custom-scrollbar">
                  {CHAT_ROOMS.map(room => (
                    <button
                      key={room.id}
                      onClick={() => setSelectedRoom(room)}
                      className={`w-full text-left p-6 rounded-3xl border transition-all ${
                        selectedRoom?.id === room.id 
                          ? 'bg-research-accent text-white border-research-accent shadow-lg scale-[1.02]' 
                          : 'bg-white border-research-border hover:border-research-accent/50'
                      }`}
                    >
                      <div className={`text-[10px] font-mono uppercase tracking-widest mb-2 ${
                        selectedRoom?.id === room.id ? 'text-white/60' : 'text-research-accent'
                      }`}>
                        {room.type}
                      </div>
                      <h3 className="text-xl font-serif mb-2">{room.name}</h3>
                      <p className={`text-xs line-clamp-2 ${
                        selectedRoom?.id === room.id ? 'text-white/80' : 'text-research-ink/60'
                      }`}>
                        {room.description}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Main: Chat Interface */}
              <div className="flex-1 bg-white border border-research-border rounded-[2.5rem] overflow-hidden flex flex-col shadow-sm">
                {selectedRoom ? (
                  <>
                    {/* Chat Header */}
                    <div className="p-8 border-bottom border-research-border flex justify-between items-center bg-research-bg/30">
                      <div>
                        <h3 className="text-2xl font-serif italic">{selectedRoom.name}</h3>
                        <div className="flex gap-4 mt-2">
                          <span className="text-[10px] font-mono text-research-ink/40 uppercase tracking-widest">
                            {selectedRoom.activeArtists.length} Artists Present
                          </span>
                        </div>
                      </div>
                      <div className="flex -space-x-3">
                        {selectedRoom.activeArtists.slice(0, 3).map((artist, i) => (
                          <div 
                            key={i} 
                            className="w-10 h-10 rounded-full border-2 border-white bg-research-accent flex items-center justify-center text-white text-xs font-serif italic"
                            title={artist.name}
                          >
                            {artist.name[0]}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar bg-[url('https://www.transparenttextures.com/patterns/paper-fibers.png')] bg-opacity-10">
                      {(MOCK_MESSAGES[selectedRoom.id] || []).map((msg) => (
                        <div key={msg.id} className={`flex flex-col ${msg.sender === profile.name ? 'items-end' : 'items-start'}`}>
                          <div className="flex items-center gap-3 mb-2">
                            <span className={`text-[10px] font-mono uppercase tracking-widest ${msg.isArtist ? 'text-research-accent font-bold' : 'text-research-ink/40'}`}>
                              {msg.sender} {msg.isArtist && '• Artist'}
                            </span>
                            <span className="text-[9px] font-mono text-research-ink/20">{msg.timestamp}</span>
                          </div>
                          <div className={`max-w-[80%] p-5 rounded-3xl text-sm leading-relaxed ${
                            msg.sender === profile.name 
                              ? 'bg-research-ink text-white rounded-tr-none' 
                              : 'bg-research-bg border border-research-border text-research-ink rounded-tl-none shadow-sm'
                          }`}>
                            {msg.text}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Input Area */}
                    <div className="p-6 border-t border-research-border bg-white">
                      <div className="relative flex items-center">
                        <input 
                          type="text" 
                          placeholder={`Message ${selectedRoom.name}...`}
                          className="w-full bg-research-bg border border-research-border rounded-full px-8 py-4 pr-16 text-sm focus:outline-none focus:border-research-accent transition-all"
                        />
                        <button className="absolute right-4 p-2 text-research-accent hover:scale-110 transition-transform">
                          <Send size={20} />
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-12 space-y-6">
                    <div className="w-24 h-24 rounded-full bg-research-accent/5 flex items-center justify-center text-research-accent/20">
                      <MessageSquare size={48} />
                    </div>
                    <div>
                      <h3 className="text-3xl font-serif italic text-research-ink">Select a Room</h3>
                      <p className="text-research-ink/40 font-serif italic mt-2">Join the conversation with artists and scholars around the world.</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Sidebar: Artists Info */}
              {selectedRoom && (
                <div className="w-64 space-y-8">
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-mono text-research-accent uppercase tracking-[0.3em]">Room Artists</h4>
                    <div className="space-y-3">
                      {selectedRoom.activeArtists.map((artist, i) => (
                        <div key={i} className="flex items-center gap-3 group cursor-pointer">
                          <div className="w-8 h-8 rounded-full bg-research-bg border border-research-border flex items-center justify-center text-research-ink/40 text-[10px] font-serif group-hover:border-research-accent group-hover:text-research-accent transition-all">
                            {artist.name[0]}
                          </div>
                          <div>
                            <div className="text-xs font-serif text-research-ink group-hover:text-research-accent transition-colors">{artist.name}</div>
                            <div className="text-[9px] font-mono text-research-ink/30 uppercase tracking-widest">
                              {artist.status === 'past' ? 'Performed' : artist.status === 'current' ? 'Performing' : 'Upcoming'}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-6 bg-research-ink text-white rounded-3xl space-y-4">
                    <h4 className="text-[10px] font-mono text-white/40 uppercase tracking-[0.3em]">Room Insight</h4>
                    <p className="text-xs font-serif italic leading-relaxed opacity-80">
                      "The G Major Suite is often seen as the most joyful of the six, yet it contains depths of solitude that only reveal themselves in the Sarabande."
                    </p>
                  </div>
                </div>
              )}
            </div>
          </ContentWrapper>
        );
      case 'Mission':
        return (
          <ContentWrapper>
            <div className="max-w-4xl mx-auto py-12">
              <h1 className="text-6xl font-serif italic mb-12">Our Mission</h1>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="space-y-6">
                  <p className="text-2xl font-serif text-research-ink/80 leading-relaxed italic">
                    "Preserving the irregular, the beautiful, and the profound in the digital age."
                  </p>
                  <p className="text-research-ink/60 leading-relaxed">
                    Irregular Pearl is a 501(c)(3) nonprofit organization dedicated to the preservation and accessibility of classical music traditions. Our name comes from the Portuguese 'barroco', meaning an irregular pearl—a fitting metaphor for the unique, human qualities of classical art.
                  </p>
                </div>
                <div className="space-y-12">
                  <div className="space-y-4">
                    <h3 className="text-xs font-mono text-research-accent uppercase tracking-[0.4em]">Digital Preservation</h3>
                    <p className="text-sm text-research-ink/60">We digitize rare manuscripts, historical scores, and high-fidelity recordings to ensure they are never lost to time.</p>
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-xs font-mono text-research-accent uppercase tracking-[0.4em]">Open Access</h3>
                    <p className="text-sm text-research-ink/60">We believe that the world's musical heritage belongs to everyone. Our archives are free to browse for students, researchers, and enthusiasts.</p>
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-xs font-mono text-research-accent uppercase tracking-[0.4em]">Community Support</h3>
                    <p className="text-sm text-research-ink/60">We provide tools and platforms for musicians to collaborate, share insights, and keep the tradition alive in modern contexts.</p>
                  </div>
                </div>
              </div>
              <div className="mt-24 aspect-[21/9] rounded-3xl overflow-hidden grayscale opacity-50 border border-research-border">
                <img 
                  src="https://images.unsplash.com/photo-1507838153414-b4b713384a76?auto=format&fit=crop&w=1920&q=80" 
                  alt="Archive"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>
          </ContentWrapper>
        );
      case 'Donate':
        return (
          <ContentWrapper>
            <div className="max-w-4xl mx-auto py-12">
              <div className="text-center mb-16">
                <h1 className="text-6xl font-serif italic mb-6">Support the Mission</h1>
                <p className="text-xl text-research-ink/60 font-serif italic max-w-2xl mx-auto">
                  Your tax-deductible contribution ensures that the world's musical heritage remains open and accessible to all.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
                {[
                  { amount: '$25', title: 'Friend' },
                  { amount: '$100', title: 'Patron' },
                  { amount: '$500', title: 'Benefactor' }
                ].map((tier) => (
                  <div key={tier.title} className="p-8 bg-white border border-research-border rounded-3xl hover:border-research-accent transition-all group">
                    <div className="text-4xl font-serif text-research-ink mb-2">{tier.amount}</div>
                    <div className="text-[10px] font-mono text-research-accent uppercase tracking-[0.3em] mb-6">{tier.title}</div>
                    <button className="w-full py-3 border border-research-border rounded-xl font-mono text-[10px] uppercase tracking-widest hover:bg-research-ink hover:text-white transition-all">
                      Select
                    </button>
                  </div>
                ))}
              </div>

              <div className="bg-research-accent/5 rounded-3xl border border-research-border p-12">
                <div className="max-w-xl mx-auto space-y-8">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-mono text-research-ink/40 uppercase tracking-widest">First Name</label>
                      <input type="text" className="w-full bg-white border border-research-border rounded-xl px-4 py-3 focus:outline-none focus:border-research-accent transition-colors" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-mono text-research-ink/40 uppercase tracking-widest">Last Name</label>
                      <input type="text" className="w-full bg-white border border-research-border rounded-xl px-4 py-3 focus:outline-none focus:border-research-accent transition-colors" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-mono text-research-ink/40 uppercase tracking-widest">Email Address</label>
                    <input type="email" className="w-full bg-white border border-research-border rounded-xl px-4 py-3 focus:outline-none focus:border-research-accent transition-colors" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-mono text-research-ink/40 uppercase tracking-widest">Custom Amount ($)</label>
                    <input type="number" placeholder="0.00" className="w-full bg-white border border-research-border rounded-xl px-4 py-3 focus:outline-none focus:border-research-accent transition-colors" />
                  </div>
                  <button className="w-full py-5 bg-research-ink text-white rounded-2xl font-mono text-xs uppercase tracking-widest hover:bg-research-accent transition-all shadow-xl">
                    Complete Contribution
                  </button>
                  <p className="text-[9px] font-mono text-research-ink/30 text-center uppercase tracking-[0.2em] leading-relaxed">
                    By contributing, you agree to our terms of service. Irregular Pearl is a registered 501(c)(3) nonprofit organization.
                  </p>
                </div>
              </div>
            </div>
          </ContentWrapper>
        );
      case 'Contribute':
        return (
          <ContentWrapper>
            <div className="max-w-4xl mx-auto py-12">
              <h1 className="text-6xl font-serif italic mb-12">Contribute</h1>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                <div className="md:col-span-2 space-y-12">
                  <section className="space-y-6">
                    <h2 className="text-3xl font-serif text-research-ink">Musical Collaboration</h2>
                    <p className="text-research-ink/60 leading-relaxed">
                      Are you a classical musician, musicologist, or enthusiast? We are always looking for new contributions to our digital hub. Whether it's a scan of a rare edition or a high-quality recording of a live performance, your contribution helps further classical music.
                    </p>
                    <button className="px-8 py-4 bg-research-ink text-white rounded-full font-mono text-xs uppercase tracking-widest hover:bg-research-accent transition-all">
                      Contribute Now
                    </button>
                  </section>
                  <section className="space-y-6">
                    <h2 className="text-3xl font-serif text-research-ink">Technical Collaboration</h2>
                    <p className="text-research-ink/60 leading-relaxed">
                      Our platform is open-source and built by a community of developers who love music. If you're a developer or designer interested in building tools for musicology, we'd love to have you.
                    </p>
                    <div className="flex gap-4">
                      <button className="px-6 py-3 border border-research-border rounded-full font-mono text-xs uppercase tracking-widest hover:border-research-accent hover:text-research-accent transition-all">
                        GitHub Repository
                      </button>
                      <button className="px-6 py-3 border border-research-border rounded-full font-mono text-xs uppercase tracking-widest hover:border-research-accent hover:text-research-accent transition-all">
                        Join Discord
                      </button>
                    </div>
                  </section>
                </div>
                <div className="space-y-8">
                  <div className="p-8 bg-research-accent/5 rounded-3xl border border-research-border space-y-6">
                    <h3 className="text-xl font-serif text-research-ink">Support Our Mission</h3>
                    <p className="text-sm text-research-ink/60 leading-relaxed">
                      As a nonprofit, we rely on the generosity of our community to keep the servers running and the archives growing.
                    </p>
                    <button 
                      onClick={() => setActiveSection('Donate')}
                      className="w-full py-4 bg-research-accent text-white rounded-2xl font-mono text-xs uppercase tracking-widest hover:shadow-lg transition-all"
                    >
                      Donate Now
                    </button>
                    <p className="text-[10px] font-mono text-research-ink/30 text-center uppercase tracking-widest">
                      Tax-deductible in the US
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </ContentWrapper>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-research-bg text-research-ink selection:bg-research-accent/30 selection:text-research-ink">
      {/* Background Texture */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03]">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
      </div>

      {/* Header */}
      <motion.header 
        initial={{ y: 0 }}
        animate={{ y: isAtTop ? 0 : -100 }}
        transition={{ duration: 0.4, ease: "easeInOut" }}
        className="fixed top-0 left-0 right-0 z-40 p-8 flex justify-between items-center bg-gradient-to-b from-research-bg to-transparent"
      >
        <div className="flex items-center gap-6">
          <h1 
            onClick={() => setActiveSection('Catalog')}
            className="text-xl font-serif italic leading-none tracking-tight text-research-ink cursor-pointer hover:text-research-accent transition-colors"
          >
            Irregular Pearl
          </h1>
        </div>
        
        <nav className="hidden md:flex items-center gap-8 text-[10px] font-mono uppercase tracking-[0.2em] text-research-ink/60">
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className={`p-2 transition-all rounded-full ${isSearchOpen ? 'bg-research-accent text-white' : 'text-research-ink/40 hover:text-research-accent hover:bg-research-accent/5'}`}
            >
              <Search size={18} />
            </button>
            <AnimatePresence>
              {isSearchOpen && (
                <motion.div
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: 240, opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <input
                    type="text"
                    autoFocus
                    placeholder="Search archives..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white/50 backdrop-blur-md border border-research-border rounded-full px-4 py-1.5 text-[10px] font-mono uppercase tracking-wider focus:outline-none focus:border-research-accent/50"
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <button onClick={() => setActiveSection('Mission')} className="hover:text-research-accent transition-colors">Mission</button>
          <button onClick={() => setActiveSection('Contribute')} className="hover:text-research-accent transition-colors">Contribute</button>
          <button onClick={() => setActiveSection('Community')} className="hover:text-research-accent transition-colors">Connect</button>
          <button 
            onClick={() => setActiveSection('Donate')}
            className="px-4 py-2 border border-research-border rounded-full hover:bg-research-accent hover:text-white transition-all"
          >
            Donate
          </button>
        </nav>
      </motion.header>

      {/* Main Content */}
      <main>
        <AnimatePresence mode="wait">
          {renderContent()}
        </AnimatePresence>
      </main>

      {/* Floating Player Overlay */}
      <AnimatePresence>
        {playerStatus === 'normal' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-2 pointer-events-none"
          >
            <div className="pointer-events-auto w-full max-w-[560px]">
              <Y2KPlayer {...playerProps} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fullscreen Player Overlay */}
      <AnimatePresence>
        {playerStatus === 'fullscreen' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-research-ink flex items-center justify-center p-8"
          >
            <button 
              onClick={() => setPlayerStatus('normal')}
              className="absolute top-8 right-8 text-white/40 hover:text-white transition-colors z-10"
            >
              <Minimize2 size={32} />
            </button>
            
            <div className="w-full max-w-6xl aspect-video bg-research-accent/5 border border-research-accent/20 rounded-3xl relative overflow-hidden flex items-center justify-center shadow-2xl">
              <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0)_50%,rgba(0,0,0,0.02)_50%),linear-gradient(90deg,rgba(0,0,0,0.01),rgba(0,0,0,0.01),rgba(0,0,0,0.01))] bg-[length:100%_2px,3px_100%] pointer-events-none" />
              
              {/* Large Visualizer */}
              <div className="absolute bottom-12 left-12 right-12 flex items-end gap-2 h-32">
                {Array.from({ length: 60 }).map((_, i) => (
                  <motion.div
                    key={`viz-bar-large-${i}`}
                    className="flex-1 bg-research-accent/40"
                    animate={{
                      height: isPlaying ? [4, Math.random() * 120 + 4, 4] : 4
                    }}
                    transition={{
                      duration: 0.6,
                      repeat: Infinity,
                      delay: i * 0.01
                    }}
                  />
                ))}
              </div>

              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center space-y-6">
                <motion.div
                  animate={{ scale: isPlaying ? [1, 1.05, 1] : 1 }}
                  transition={{ repeat: Infinity, duration: 2 }}
                >
                  <h2 className="text-6xl font-serif text-research-accent tracking-tighter">Bach: Cello Suite No. 1</h2>
                  <button 
                    onClick={() => {
                      const artist = ARTISTS.find(a => a.name === "Yo-Yo Ma");
                      if (artist) {
                        setSelectedArtist(artist);
                        setActiveSection('ArtistDetail');
                        setPlayerStatus('minimized');
                      }
                    }}
                    className="text-2xl font-mono text-research-accent/60 uppercase tracking-[0.5em] mt-4 hover:text-research-accent hover:underline underline-offset-8 transition-colors cursor-pointer"
                  >
                    Yo-Yo Ma
                  </button>
                  <p className="text-sm font-mono text-research-accent/20 uppercase tracking-[0.8em] mt-8">Streaming Data...</p>
                </motion.div>
              </div>

              <div className="absolute bottom-32 left-0 right-0 text-center text-research-accent font-mono text-xs tracking-[0.4em] uppercase animate-pulse">
                {isPlaying ? "Audio Stream Active" : "System Paused"}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dock */}
      <Dock 
        activeSection={activeSection} 
        setActiveSection={setActiveSection} 
        isPlaying={isPlaying}
        playerStatus={playerStatus}
        setPlayerStatus={setPlayerStatus}
        isMinimized={isDockMinimized}
        setIsMinimized={setIsDockMinimized}
      />

      {/* Footer Meta */}
      <footer className="fixed bottom-4 left-6 text-[8px] font-mono text-research-ink/20 uppercase tracking-widest pointer-events-none">
        © 2026 Irregular Pearl 501(c)(3) • Built for musicians
      </footer>
    </div>
  );
}

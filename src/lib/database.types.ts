export type Difficulty = 'beginner' | 'intermediate' | 'advanced' | 'professional';
export type UserLevel = 'student' | 'amateur' | 'professional' | 'teacher';
export type LinkType = 'imslp' | 'youtube' | 'wikipedia' | 'spotify' | 'soundcloud' | 'bandcamp' | 'internet_archive' | 'vimeo';

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          display_name: string;
          instrument: string | null;
          level: UserLevel | null;
          avatar_url: string | null;
          bio: string;
          website: string | null;
          social_links: Record<string, string>;
          genres: string[];
          location: string | null;
          ensembles: string[];
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['users']['Row'], 'created_at'>;
        Update: Partial<Database['public']['Tables']['users']['Insert']>;
      };
      discography: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          year: number | null;
          role: string | null;
          url: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['discography']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['discography']['Insert']>;
      };
      pieces: {
        Row: {
          id: string;
          title: string;
          composer_name: string;
          catalog_number: string | null;
          instruments: string[];
          era: string;
          form: string;
          duration_minutes: number | null;
          difficulty: Difficulty;
          description: string;
        };
        Insert: Database['public']['Tables']['pieces']['Row'];
        Update: Partial<Database['public']['Tables']['pieces']['Insert']>;
      };
      editions: {
        Row: {
          id: string;
          piece_id: string;
          publisher: string;
          editor: string;
          year: number | null;
          description: string;
        };
        Insert: Database['public']['Tables']['editions']['Row'];
        Update: Partial<Database['public']['Tables']['editions']['Insert']>;
      };
      edition_reviews: {
        Row: {
          id: string;
          edition_id: string;
          user_id: string;
          rating: number;
          text: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['edition_reviews']['Row'], 'created_at'>;
        Update: Partial<Database['public']['Tables']['edition_reviews']['Insert']>;
      };
      external_links: {
        Row: {
          id: string;
          piece_id: string;
          type: LinkType;
          url: string;
          label: string;
        };
        Insert: Database['public']['Tables']['external_links']['Row'];
        Update: Partial<Database['public']['Tables']['external_links']['Insert']>;
      };
    };
  };
}

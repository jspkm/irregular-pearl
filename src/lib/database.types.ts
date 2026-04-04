export type Difficulty = 'beginner' | 'intermediate' | 'advanced' | 'professional';
export type UserLevel = 'student' | 'amateur' | 'professional' | 'teacher';
export type LinkType = 'imslp' | 'youtube' | 'wikipedia' | 'spotify' | 'soundcloud' | 'bandcamp' | 'internet_archive' | 'vimeo';
export type ActivityType = 'working_on' | 'listened' | 'practiced' | 'sight_read' | 'took_lesson' | 'performed';
export type EventStatus = 'queued' | 'approved' | 'rejected';
export type EventSource = 'user' | 'bachtrack';
export type EventType = 'recital' | 'concert' | 'competition' | 'masterclass' | 'recording' | 'festival';

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
      performances: {
        Row: {
          id: string;
          user_id: string;
          event_name: string;
          venue: string | null;
          date: string | null;
          piece_id: string | null;
          is_upcoming: boolean;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['performances']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['performances']['Insert']>;
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
      discussions: {
        Row: {
          id: string;
          piece_id: string;
          user_id: string;
          text: string;
          created_at: string;
          parent_id: string | null;
        };
        Insert: Omit<Database['public']['Tables']['discussions']['Row'], 'created_at'>;
        Update: Partial<Database['public']['Tables']['discussions']['Insert']>;
      };
      activity_log: {
        Row: {
          id: string;
          piece_id: string;
          user_id: string;
          activity: ActivityType;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['activity_log']['Row'], 'id' | 'created_at'>;
        Update: never;
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
      reports: {
        Row: {
          id: string;
          discussion_id: string;
          reporter_user_id: string;
          reason: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['reports']['Row'], 'created_at'>;
        Update: never;
      };
      events: {
        Row: {
          id: string;
          title: string;
          venue: string | null;
          city: string | null;
          country: string | null;
          event_date: string;
          start_time: string | null;
          event_type: EventType;
          description: string | null;
          url: string | null;
          poster_url: string | null;
          ticket_price: string | null;
          ticket_url: string | null;
          status: EventStatus;
          source: EventSource;
          created_by: string | null;
          moderated_by: string | null;
          moderated_at: string | null;
          moderation_note: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['events']['Row'], 'id' | 'created_at' | 'status'> & { status?: EventStatus };
        Update: Partial<Database['public']['Tables']['events']['Row']>;
      };
      event_performances: {
        Row: {
          id: string;
          event_id: string;
          artist_id: string | null;
          piece_id: string | null;
          instrument_id: string | null;
        };
        Insert: Omit<Database['public']['Tables']['event_performances']['Row'], 'id'>;
        Update: Partial<Database['public']['Tables']['event_performances']['Insert']>;
      };
    };
  };
}


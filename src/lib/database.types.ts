Connecting to db 5432
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      app_config: {
        Row: {
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          updated_by?: string | null
          value: Json
        }
        Update: {
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: [
          {
            foreignKeyName: "app_config_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      canonical_piece_index: {
        Row: {
          canonical_title: string
          catalog_number: string | null
          composer_name: string
          created_at: string
          era: string | null
          form: string | null
          id: string
          imslp_work_id: string | null
          instruments: string[]
          movements: Json | null
          musicbrainz_work_id: string | null
          native_title: string | null
          source_agreement_count: number
          updated_at: string
          viaf_composer_id: string | null
          wikidata_qid: string | null
        }
        Insert: {
          canonical_title: string
          catalog_number?: string | null
          composer_name: string
          created_at?: string
          era?: string | null
          form?: string | null
          id?: string
          imslp_work_id?: string | null
          instruments?: string[]
          movements?: Json | null
          musicbrainz_work_id?: string | null
          native_title?: string | null
          source_agreement_count?: number
          updated_at?: string
          viaf_composer_id?: string | null
          wikidata_qid?: string | null
        }
        Update: {
          canonical_title?: string
          catalog_number?: string | null
          composer_name?: string
          created_at?: string
          era?: string | null
          form?: string | null
          id?: string
          imslp_work_id?: string | null
          instruments?: string[]
          movements?: Json | null
          musicbrainz_work_id?: string | null
          native_title?: string | null
          source_agreement_count?: number
          updated_at?: string
          viaf_composer_id?: string | null
          wikidata_qid?: string | null
        }
        Relationships: []
      }
      content_mutation_log: {
        Row: {
          action: string
          actor_id: string | null
          detail: Json
          id: number
          occurred_at: string
          piece_id: string
          subject_id: string | null
          subject_label: string | null
          subject_table: string
          subject_type: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          detail?: Json
          id?: number
          occurred_at?: string
          piece_id: string
          subject_id?: string | null
          subject_label?: string | null
          subject_table: string
          subject_type: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          detail?: Json
          id?: number
          occurred_at?: string
          piece_id?: string
          subject_id?: string | null
          subject_label?: string | null
          subject_table?: string
          subject_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_mutation_log_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_mutation_log_piece_id_fkey"
            columns: ["piece_id"]
            isOneToOne: false
            referencedRelation: "pieces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_mutation_log_piece_id_fkey"
            columns: ["piece_id"]
            isOneToOne: false
            referencedRelation: "v_pieces_with_content_state"
            referencedColumns: ["id"]
          },
        ]
      }
      contribution_requests: {
        Row: {
          cleared_at: string | null
          created_at: string
          fulfilled_at: string | null
          id: string
          note: string | null
          piece_id: string
          recipient_email: string | null
          recipient_id: string | null
          sender_id: string
        }
        Insert: {
          cleared_at?: string | null
          created_at?: string
          fulfilled_at?: string | null
          id?: string
          note?: string | null
          piece_id: string
          recipient_email?: string | null
          recipient_id?: string | null
          sender_id: string
        }
        Update: {
          cleared_at?: string | null
          created_at?: string
          fulfilled_at?: string | null
          id?: string
          note?: string | null
          piece_id?: string
          recipient_email?: string | null
          recipient_id?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contribution_requests_piece_id_fkey"
            columns: ["piece_id"]
            isOneToOne: false
            referencedRelation: "pieces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contribution_requests_piece_id_fkey"
            columns: ["piece_id"]
            isOneToOne: false
            referencedRelation: "v_pieces_with_content_state"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contribution_requests_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contribution_requests_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      discography: {
        Row: {
          created_at: string
          id: string
          role: string | null
          title: string
          url: string | null
          user_id: string
          year: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          role?: string | null
          title: string
          url?: string | null
          user_id: string
          year?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          role?: string | null
          title?: string
          url?: string | null
          user_id?: string
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "discography_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      edition_reviews: {
        Row: {
          created_at: string
          edition_id: string
          id: string
          rating: number
          text: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          edition_id: string
          id?: string
          rating: number
          text?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          edition_id?: string
          id?: string
          rating?: number
          text?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "edition_reviews_edition_id_fkey"
            columns: ["edition_id"]
            isOneToOne: false
            referencedRelation: "editions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "edition_reviews_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      editions: {
        Row: {
          created_by: string | null
          deleted_at: string | null
          description: string
          editor: string
          id: string
          ordinal: number
          piece_id: string
          publisher: string
          type: string | null
          url: string | null
          year: number | null
        }
        Insert: {
          created_by?: string | null
          deleted_at?: string | null
          description?: string
          editor: string
          id: string
          ordinal?: number
          piece_id: string
          publisher: string
          type?: string | null
          url?: string | null
          year?: number | null
        }
        Update: {
          created_by?: string | null
          deleted_at?: string | null
          description?: string
          editor?: string
          id?: string
          ordinal?: number
          piece_id?: string
          publisher?: string
          type?: string | null
          url?: string | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "editions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "editions_piece_id_fkey"
            columns: ["piece_id"]
            isOneToOne: false
            referencedRelation: "pieces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "editions_piece_id_fkey"
            columns: ["piece_id"]
            isOneToOne: false
            referencedRelation: "v_pieces_with_content_state"
            referencedColumns: ["id"]
          },
        ]
      }
      external_links: {
        Row: {
          created_by: string | null
          deleted_at: string | null
          id: string
          label: string
          ordinal: number
          piece_id: string
          source: string
          type: Database["public"]["Enums"]["link_type"]
          url: string
        }
        Insert: {
          created_by?: string | null
          deleted_at?: string | null
          id: string
          label: string
          ordinal?: number
          piece_id: string
          source?: string
          type: Database["public"]["Enums"]["link_type"]
          url: string
        }
        Update: {
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          label?: string
          ordinal?: number
          piece_id?: string
          source?: string
          type?: Database["public"]["Enums"]["link_type"]
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "external_links_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "external_links_piece_id_fkey"
            columns: ["piece_id"]
            isOneToOne: false
            referencedRelation: "pieces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "external_links_piece_id_fkey"
            columns: ["piece_id"]
            isOneToOne: false
            referencedRelation: "v_pieces_with_content_state"
            referencedColumns: ["id"]
          },
        ]
      }
      interpretive_school_versions: {
        Row: {
          approved_at: string | null
          authored_by: string
          body: string
          contributor_id: string
          created_at: string
          id: string
          piece_id: string
          rejection_note: string | null
          school_id: string
          version_number: number
        }
        Insert: {
          approved_at?: string | null
          authored_by: string
          body: string
          contributor_id: string
          created_at?: string
          id?: string
          piece_id: string
          rejection_note?: string | null
          school_id: string
          version_number: number
        }
        Update: {
          approved_at?: string | null
          authored_by?: string
          body?: string
          contributor_id?: string
          created_at?: string
          id?: string
          piece_id?: string
          rejection_note?: string | null
          school_id?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "interpretive_school_versions_authored_by_fkey"
            columns: ["authored_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interpretive_school_versions_contributor_id_fkey"
            columns: ["contributor_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interpretive_school_versions_piece_id_fkey"
            columns: ["piece_id"]
            isOneToOne: false
            referencedRelation: "pieces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interpretive_school_versions_piece_id_fkey"
            columns: ["piece_id"]
            isOneToOne: false
            referencedRelation: "v_pieces_with_content_state"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interpretive_school_versions_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "interpretive_schools"
            referencedColumns: ["id"]
          },
        ]
      }
      interpretive_schools: {
        Row: {
          approved_by: string | null
          approved_by_contributor_at: string | null
          contributor_id: string
          created_at: string
          current_version_id: string | null
          drafted_by: string | null
          id: string
          metadata_updated_at: string | null
          metadata_updated_by: string | null
          name: string
          piece_id: string
          rejected_by: string | null
          removed_at: string | null
          removed_by: string | null
          retracted_at: string | null
          retracted_by: string | null
          status: Database["public"]["Enums"]["draft_status"]
          submitted_by: string | null
          tempo_cues: Json | null
          updated_at: string
        }
        Insert: {
          approved_by?: string | null
          approved_by_contributor_at?: string | null
          contributor_id: string
          created_at?: string
          current_version_id?: string | null
          drafted_by?: string | null
          id?: string
          metadata_updated_at?: string | null
          metadata_updated_by?: string | null
          name: string
          piece_id: string
          rejected_by?: string | null
          removed_at?: string | null
          removed_by?: string | null
          retracted_at?: string | null
          retracted_by?: string | null
          status?: Database["public"]["Enums"]["draft_status"]
          submitted_by?: string | null
          tempo_cues?: Json | null
          updated_at?: string
        }
        Update: {
          approved_by?: string | null
          approved_by_contributor_at?: string | null
          contributor_id?: string
          created_at?: string
          current_version_id?: string | null
          drafted_by?: string | null
          id?: string
          metadata_updated_at?: string | null
          metadata_updated_by?: string | null
          name?: string
          piece_id?: string
          rejected_by?: string | null
          removed_at?: string | null
          removed_by?: string | null
          retracted_at?: string | null
          retracted_by?: string | null
          status?: Database["public"]["Enums"]["draft_status"]
          submitted_by?: string | null
          tempo_cues?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_is_current_version_matches_school"
            columns: ["id", "current_version_id"]
            isOneToOne: false
            referencedRelation: "interpretive_school_versions"
            referencedColumns: ["school_id", "id"]
          },
          {
            foreignKeyName: "fk_is_current_version_matches_school"
            columns: ["id", "current_version_id"]
            isOneToOne: false
            referencedRelation: "v_interpretive_school_versions_published"
            referencedColumns: ["school_id", "id"]
          },
          {
            foreignKeyName: "interpretive_schools_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interpretive_schools_contributor_id_fkey"
            columns: ["contributor_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interpretive_schools_drafted_by_fkey"
            columns: ["drafted_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interpretive_schools_metadata_updated_by_fkey"
            columns: ["metadata_updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interpretive_schools_piece_id_fkey"
            columns: ["piece_id"]
            isOneToOne: false
            referencedRelation: "pieces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interpretive_schools_piece_id_fkey"
            columns: ["piece_id"]
            isOneToOne: false
            referencedRelation: "v_pieces_with_content_state"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interpretive_schools_rejected_by_fkey"
            columns: ["rejected_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interpretive_schools_removed_by_fkey"
            columns: ["removed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interpretive_schools_retracted_by_fkey"
            columns: ["retracted_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interpretive_schools_submitted_by_fkey"
            columns: ["submitted_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      landmark_versions: {
        Row: {
          approved_at: string | null
          authored_by: string
          contributor_id: string
          created_at: string
          description: string | null
          flags: Json
          id: string
          label: string
          landmark_id: string
          measure_end: number | null
          measure_start: number
          movement_id: string
          ordinal: number
          piece_id: string
          practice_notes: Json
          rejection_note: string | null
          version_number: number
        }
        Insert: {
          approved_at?: string | null
          authored_by: string
          contributor_id: string
          created_at?: string
          description?: string | null
          flags?: Json
          id?: string
          label: string
          landmark_id: string
          measure_end?: number | null
          measure_start: number
          movement_id: string
          ordinal?: number
          piece_id: string
          practice_notes?: Json
          rejection_note?: string | null
          version_number: number
        }
        Update: {
          approved_at?: string | null
          authored_by?: string
          contributor_id?: string
          created_at?: string
          description?: string | null
          flags?: Json
          id?: string
          label?: string
          landmark_id?: string
          measure_end?: number | null
          measure_start?: number
          movement_id?: string
          ordinal?: number
          piece_id?: string
          practice_notes?: Json
          rejection_note?: string | null
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "landmark_versions_authored_by_fkey"
            columns: ["authored_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "landmark_versions_contributor_id_fkey"
            columns: ["contributor_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "landmark_versions_landmark_id_fkey"
            columns: ["landmark_id"]
            isOneToOne: false
            referencedRelation: "landmarks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "landmark_versions_movement_id_fkey"
            columns: ["movement_id"]
            isOneToOne: false
            referencedRelation: "movements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "landmark_versions_piece_id_fkey"
            columns: ["piece_id"]
            isOneToOne: false
            referencedRelation: "pieces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "landmark_versions_piece_id_fkey"
            columns: ["piece_id"]
            isOneToOne: false
            referencedRelation: "v_pieces_with_content_state"
            referencedColumns: ["id"]
          },
        ]
      }
      landmarks: {
        Row: {
          approved_by: string | null
          approved_by_contributor_at: string | null
          contributor_id: string
          created_at: string
          current_version_id: string | null
          drafted_by: string | null
          id: string
          movement_id: string
          piece_id: string
          rejected_by: string | null
          removed_at: string | null
          removed_by: string | null
          retracted_at: string | null
          retracted_by: string | null
          status: Database["public"]["Enums"]["draft_status"]
          submitted_by: string | null
          updated_at: string
        }
        Insert: {
          approved_by?: string | null
          approved_by_contributor_at?: string | null
          contributor_id: string
          created_at?: string
          current_version_id?: string | null
          drafted_by?: string | null
          id?: string
          movement_id: string
          piece_id: string
          rejected_by?: string | null
          removed_at?: string | null
          removed_by?: string | null
          retracted_at?: string | null
          retracted_by?: string | null
          status?: Database["public"]["Enums"]["draft_status"]
          submitted_by?: string | null
          updated_at?: string
        }
        Update: {
          approved_by?: string | null
          approved_by_contributor_at?: string | null
          contributor_id?: string
          created_at?: string
          current_version_id?: string | null
          drafted_by?: string | null
          id?: string
          movement_id?: string
          piece_id?: string
          rejected_by?: string | null
          removed_at?: string | null
          removed_by?: string | null
          retracted_at?: string | null
          retracted_by?: string | null
          status?: Database["public"]["Enums"]["draft_status"]
          submitted_by?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_landmarks_current_version_matches"
            columns: ["id", "current_version_id"]
            isOneToOne: false
            referencedRelation: "landmark_versions"
            referencedColumns: ["landmark_id", "id"]
          },
          {
            foreignKeyName: "fk_landmarks_current_version_matches"
            columns: ["id", "current_version_id"]
            isOneToOne: false
            referencedRelation: "v_landmark_versions_published"
            referencedColumns: ["landmark_id", "id"]
          },
          {
            foreignKeyName: "landmarks_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "landmarks_contributor_id_fkey"
            columns: ["contributor_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "landmarks_drafted_by_fkey"
            columns: ["drafted_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "landmarks_movement_id_fkey"
            columns: ["movement_id"]
            isOneToOne: false
            referencedRelation: "movements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "landmarks_piece_id_fkey"
            columns: ["piece_id"]
            isOneToOne: false
            referencedRelation: "pieces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "landmarks_piece_id_fkey"
            columns: ["piece_id"]
            isOneToOne: false
            referencedRelation: "v_pieces_with_content_state"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "landmarks_rejected_by_fkey"
            columns: ["rejected_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "landmarks_removed_by_fkey"
            columns: ["removed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "landmarks_retracted_by_fkey"
            columns: ["retracted_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "landmarks_submitted_by_fkey"
            columns: ["submitted_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      maestro_playlist: {
        Row: {
          added_at: string
          id: string
          piece_id: string
          position: number
        }
        Insert: {
          added_at?: string
          id?: string
          piece_id: string
          position: number
        }
        Update: {
          added_at?: string
          id?: string
          piece_id?: string
          position?: number
        }
        Relationships: [
          {
            foreignKeyName: "maestro_playlist_piece_id_fkey"
            columns: ["piece_id"]
            isOneToOne: true
            referencedRelation: "pieces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maestro_playlist_piece_id_fkey"
            columns: ["piece_id"]
            isOneToOne: true
            referencedRelation: "v_pieces_with_content_state"
            referencedColumns: ["id"]
          },
        ]
      }
      movement_versions: {
        Row: {
          authored_by: string | null
          created_at: string
          edit_summary: string | null
          id: string
          key_signature: string | null
          meter: string | null
          movement_id: string
          name: string
          ordinal: number
          piece_id: string
          reverted_from_version_id: string | null
          tempo_indication: string | null
          version_number: number
        }
        Insert: {
          authored_by?: string | null
          created_at?: string
          edit_summary?: string | null
          id?: string
          key_signature?: string | null
          meter?: string | null
          movement_id: string
          name: string
          ordinal: number
          piece_id: string
          reverted_from_version_id?: string | null
          tempo_indication?: string | null
          version_number: number
        }
        Update: {
          authored_by?: string | null
          created_at?: string
          edit_summary?: string | null
          id?: string
          key_signature?: string | null
          meter?: string | null
          movement_id?: string
          name?: string
          ordinal?: number
          piece_id?: string
          reverted_from_version_id?: string | null
          tempo_indication?: string | null
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "movement_versions_authored_by_fkey"
            columns: ["authored_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movement_versions_movement_id_fkey"
            columns: ["movement_id"]
            isOneToOne: false
            referencedRelation: "movements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movement_versions_reverted_from_version_id_fkey"
            columns: ["reverted_from_version_id"]
            isOneToOne: false
            referencedRelation: "movement_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      movements: {
        Row: {
          created_at: string
          current_version_id: string | null
          deleted_at: string | null
          id: string
          key_signature: string | null
          meter: string | null
          name: string
          ordinal: number
          piece_id: string
          tempo_indication: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_version_id?: string | null
          deleted_at?: string | null
          id?: string
          key_signature?: string | null
          meter?: string | null
          name: string
          ordinal: number
          piece_id: string
          tempo_indication?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_version_id?: string | null
          deleted_at?: string | null
          id?: string
          key_signature?: string | null
          meter?: string | null
          name?: string
          ordinal?: number
          piece_id?: string
          tempo_indication?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_movements_current_version_matches"
            columns: ["id", "current_version_id"]
            isOneToOne: false
            referencedRelation: "movement_versions"
            referencedColumns: ["movement_id", "id"]
          },
          {
            foreignKeyName: "movements_piece_id_fkey"
            columns: ["piece_id"]
            isOneToOne: false
            referencedRelation: "pieces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movements_piece_id_fkey"
            columns: ["piece_id"]
            isOneToOne: false
            referencedRelation: "v_pieces_with_content_state"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string
          cleared_at: string | null
          created_at: string
          id: string
          last_digest_sent_at: string | null
          link_path: string
          recipient_id: string
          subject_id: string
          subject_table: string
          type: Database["public"]["Enums"]["notification_type"]
        }
        Insert: {
          body: string
          cleared_at?: string | null
          created_at?: string
          id?: string
          last_digest_sent_at?: string | null
          link_path: string
          recipient_id: string
          subject_id: string
          subject_table: string
          type: Database["public"]["Enums"]["notification_type"]
        }
        Update: {
          body?: string
          cleared_at?: string | null
          created_at?: string
          id?: string
          last_digest_sent_at?: string | null
          link_path?: string
          recipient_id?: string
          subject_id?: string
          subject_table?: string
          type?: Database["public"]["Enums"]["notification_type"]
        }
        Relationships: [
          {
            foreignKeyName: "notifications_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      pedagogical_connections: {
        Row: {
          created_at: string
          created_by: string | null
          deleted_at: string | null
          id: string
          kind: string
          note: string | null
          ordinal: number
          piece_id: string
          related_piece_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          kind: string
          note?: string | null
          ordinal?: number
          piece_id: string
          related_piece_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          kind?: string
          note?: string | null
          ordinal?: number
          piece_id?: string
          related_piece_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pedagogical_connections_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pedagogical_connections_piece_id_fkey"
            columns: ["piece_id"]
            isOneToOne: false
            referencedRelation: "pieces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pedagogical_connections_piece_id_fkey"
            columns: ["piece_id"]
            isOneToOne: false
            referencedRelation: "v_pieces_with_content_state"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pedagogical_connections_related_piece_id_fkey"
            columns: ["related_piece_id"]
            isOneToOne: false
            referencedRelation: "pieces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pedagogical_connections_related_piece_id_fkey"
            columns: ["related_piece_id"]
            isOneToOne: false
            referencedRelation: "v_pieces_with_content_state"
            referencedColumns: ["id"]
          },
        ]
      }
      performers_note_versions: {
        Row: {
          approved_at: string | null
          authored_by: string
          body: string
          contributor_id: string
          created_at: string
          id: string
          note_id: string
          piece_id: string
          rejection_note: string | null
          version_number: number
        }
        Insert: {
          approved_at?: string | null
          authored_by: string
          body: string
          contributor_id: string
          created_at?: string
          id?: string
          note_id: string
          piece_id: string
          rejection_note?: string | null
          version_number: number
        }
        Update: {
          approved_at?: string | null
          authored_by?: string
          body?: string
          contributor_id?: string
          created_at?: string
          id?: string
          note_id?: string
          piece_id?: string
          rejection_note?: string | null
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "performers_note_versions_authored_by_fkey"
            columns: ["authored_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performers_note_versions_contributor_id_fkey"
            columns: ["contributor_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performers_note_versions_note_id_fkey"
            columns: ["note_id"]
            isOneToOne: false
            referencedRelation: "performers_notes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performers_note_versions_piece_id_fkey"
            columns: ["piece_id"]
            isOneToOne: false
            referencedRelation: "pieces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performers_note_versions_piece_id_fkey"
            columns: ["piece_id"]
            isOneToOne: false
            referencedRelation: "v_pieces_with_content_state"
            referencedColumns: ["id"]
          },
        ]
      }
      performers_notes: {
        Row: {
          approved_by: string | null
          approved_by_contributor_at: string | null
          contributor_id: string
          created_at: string
          current_version_id: string | null
          drafted_by: string | null
          id: string
          piece_id: string
          rejected_by: string | null
          removed_at: string | null
          removed_by: string | null
          retracted_at: string | null
          retracted_by: string | null
          status: Database["public"]["Enums"]["draft_status"]
          submitted_by: string | null
          updated_at: string
        }
        Insert: {
          approved_by?: string | null
          approved_by_contributor_at?: string | null
          contributor_id: string
          created_at?: string
          current_version_id?: string | null
          drafted_by?: string | null
          id?: string
          piece_id: string
          rejected_by?: string | null
          removed_at?: string | null
          removed_by?: string | null
          retracted_at?: string | null
          retracted_by?: string | null
          status?: Database["public"]["Enums"]["draft_status"]
          submitted_by?: string | null
          updated_at?: string
        }
        Update: {
          approved_by?: string | null
          approved_by_contributor_at?: string | null
          contributor_id?: string
          created_at?: string
          current_version_id?: string | null
          drafted_by?: string | null
          id?: string
          piece_id?: string
          rejected_by?: string | null
          removed_at?: string | null
          removed_by?: string | null
          retracted_at?: string | null
          retracted_by?: string | null
          status?: Database["public"]["Enums"]["draft_status"]
          submitted_by?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_current_version_matches_note"
            columns: ["id", "current_version_id"]
            isOneToOne: false
            referencedRelation: "performers_note_versions"
            referencedColumns: ["note_id", "id"]
          },
          {
            foreignKeyName: "fk_current_version_matches_note"
            columns: ["id", "current_version_id"]
            isOneToOne: false
            referencedRelation: "v_performers_note_versions_published"
            referencedColumns: ["note_id", "id"]
          },
          {
            foreignKeyName: "performers_notes_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performers_notes_contributor_id_fkey"
            columns: ["contributor_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performers_notes_drafted_by_fkey"
            columns: ["drafted_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performers_notes_piece_id_fkey"
            columns: ["piece_id"]
            isOneToOne: false
            referencedRelation: "pieces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performers_notes_piece_id_fkey"
            columns: ["piece_id"]
            isOneToOne: false
            referencedRelation: "v_pieces_with_content_state"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performers_notes_rejected_by_fkey"
            columns: ["rejected_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performers_notes_removed_by_fkey"
            columns: ["removed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performers_notes_retracted_by_fkey"
            columns: ["retracted_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performers_notes_submitted_by_fkey"
            columns: ["submitted_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      piece_description_versions: {
        Row: {
          approved_at: string | null
          authored_by: string
          body: string
          contributor_id: string
          created_at: string
          description_id: string
          id: string
          piece_id: string
          rejection_note: string | null
          version_number: number
        }
        Insert: {
          approved_at?: string | null
          authored_by: string
          body: string
          contributor_id: string
          created_at?: string
          description_id: string
          id?: string
          piece_id: string
          rejection_note?: string | null
          version_number: number
        }
        Update: {
          approved_at?: string | null
          authored_by?: string
          body?: string
          contributor_id?: string
          created_at?: string
          description_id?: string
          id?: string
          piece_id?: string
          rejection_note?: string | null
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "piece_description_versions_authored_by_fkey"
            columns: ["authored_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "piece_description_versions_contributor_id_fkey"
            columns: ["contributor_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "piece_description_versions_description_id_fkey"
            columns: ["description_id"]
            isOneToOne: false
            referencedRelation: "piece_descriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "piece_description_versions_piece_id_fkey"
            columns: ["piece_id"]
            isOneToOne: false
            referencedRelation: "pieces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "piece_description_versions_piece_id_fkey"
            columns: ["piece_id"]
            isOneToOne: false
            referencedRelation: "v_pieces_with_content_state"
            referencedColumns: ["id"]
          },
        ]
      }
      piece_descriptions: {
        Row: {
          approved_by: string | null
          approved_by_contributor_at: string | null
          contributor_id: string
          created_at: string
          current_version_id: string | null
          drafted_by: string | null
          id: string
          piece_id: string
          rejected_by: string | null
          removed_at: string | null
          removed_by: string | null
          retracted_at: string | null
          retracted_by: string | null
          status: Database["public"]["Enums"]["draft_status"]
          submitted_by: string | null
          updated_at: string
        }
        Insert: {
          approved_by?: string | null
          approved_by_contributor_at?: string | null
          contributor_id: string
          created_at?: string
          current_version_id?: string | null
          drafted_by?: string | null
          id?: string
          piece_id: string
          rejected_by?: string | null
          removed_at?: string | null
          removed_by?: string | null
          retracted_at?: string | null
          retracted_by?: string | null
          status?: Database["public"]["Enums"]["draft_status"]
          submitted_by?: string | null
          updated_at?: string
        }
        Update: {
          approved_by?: string | null
          approved_by_contributor_at?: string | null
          contributor_id?: string
          created_at?: string
          current_version_id?: string | null
          drafted_by?: string | null
          id?: string
          piece_id?: string
          rejected_by?: string | null
          removed_at?: string | null
          removed_by?: string | null
          retracted_at?: string | null
          retracted_by?: string | null
          status?: Database["public"]["Enums"]["draft_status"]
          submitted_by?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_pd_current_version_matches_description"
            columns: ["id", "current_version_id"]
            isOneToOne: false
            referencedRelation: "piece_description_versions"
            referencedColumns: ["description_id", "id"]
          },
          {
            foreignKeyName: "fk_pd_current_version_matches_description"
            columns: ["id", "current_version_id"]
            isOneToOne: false
            referencedRelation: "v_piece_description_versions_published"
            referencedColumns: ["description_id", "id"]
          },
          {
            foreignKeyName: "piece_descriptions_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "piece_descriptions_contributor_id_fkey"
            columns: ["contributor_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "piece_descriptions_drafted_by_fkey"
            columns: ["drafted_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "piece_descriptions_piece_id_fkey"
            columns: ["piece_id"]
            isOneToOne: false
            referencedRelation: "pieces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "piece_descriptions_piece_id_fkey"
            columns: ["piece_id"]
            isOneToOne: false
            referencedRelation: "v_pieces_with_content_state"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "piece_descriptions_rejected_by_fkey"
            columns: ["rejected_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "piece_descriptions_removed_by_fkey"
            columns: ["removed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "piece_descriptions_retracted_by_fkey"
            columns: ["retracted_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "piece_descriptions_submitted_by_fkey"
            columns: ["submitted_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      piece_difficulty_ratings: {
        Row: {
          contributor_id: string
          created_at: string
          ensemble_level: number
          ensemble_note: string | null
          id: string
          interpretive_level: number
          interpretive_note: string | null
          piece_id: string
          removed_at: string | null
          removed_by: string | null
          stamina_level: number
          stamina_note: string | null
          status: Database["public"]["Enums"]["draft_status"]
          technical_level: number
          technical_note: string | null
          updated_at: string
        }
        Insert: {
          contributor_id: string
          created_at?: string
          ensemble_level: number
          ensemble_note?: string | null
          id?: string
          interpretive_level: number
          interpretive_note?: string | null
          piece_id: string
          removed_at?: string | null
          removed_by?: string | null
          stamina_level: number
          stamina_note?: string | null
          status?: Database["public"]["Enums"]["draft_status"]
          technical_level: number
          technical_note?: string | null
          updated_at?: string
        }
        Update: {
          contributor_id?: string
          created_at?: string
          ensemble_level?: number
          ensemble_note?: string | null
          id?: string
          interpretive_level?: number
          interpretive_note?: string | null
          piece_id?: string
          removed_at?: string | null
          removed_by?: string | null
          stamina_level?: number
          stamina_note?: string | null
          status?: Database["public"]["Enums"]["draft_status"]
          technical_level?: number
          technical_note?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "piece_difficulty_ratings_contributor_id_fkey"
            columns: ["contributor_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "piece_difficulty_ratings_piece_id_fkey"
            columns: ["piece_id"]
            isOneToOne: false
            referencedRelation: "pieces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "piece_difficulty_ratings_piece_id_fkey"
            columns: ["piece_id"]
            isOneToOne: false
            referencedRelation: "v_pieces_with_content_state"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "piece_difficulty_ratings_removed_by_fkey"
            columns: ["removed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      piece_pills: {
        Row: {
          added_by: string | null
          category: string
          created_at: string
          id: string
          piece_id: string
          source: string
          value: string
        }
        Insert: {
          added_by?: string | null
          category: string
          created_at?: string
          id?: string
          piece_id: string
          source: string
          value: string
        }
        Update: {
          added_by?: string | null
          category?: string
          created_at?: string
          id?: string
          piece_id?: string
          source?: string
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "piece_pills_added_by_fkey"
            columns: ["added_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "piece_pills_piece_id_fkey"
            columns: ["piece_id"]
            isOneToOne: false
            referencedRelation: "pieces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "piece_pills_piece_id_fkey"
            columns: ["piece_id"]
            isOneToOne: false
            referencedRelation: "v_pieces_with_content_state"
            referencedColumns: ["id"]
          },
        ]
      }
      piece_redirects: {
        Row: {
          created_at: string
          created_by: string | null
          from_slug: string
          to_piece_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          from_slug: string
          to_piece_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          from_slug?: string
          to_piece_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "piece_redirects_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "piece_redirects_to_piece_id_fkey"
            columns: ["to_piece_id"]
            isOneToOne: false
            referencedRelation: "pieces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "piece_redirects_to_piece_id_fkey"
            columns: ["to_piece_id"]
            isOneToOne: false
            referencedRelation: "v_pieces_with_content_state"
            referencedColumns: ["id"]
          },
        ]
      }
      pieces: {
        Row: {
          canonical_index_id: string
          catalog_number: string | null
          composer_name: string
          created_at: string
          description: string
          difficulty: Database["public"]["Enums"]["difficulty"] | null
          duration_minutes: number | null
          era: string | null
          form: string | null
          fts: unknown
          id: string
          instruments: string[]
          musicbrainz_work_id: string | null
          seed_description_vote_id: string
          seed_difficulty_vote_id: string
          source: string
          title: string
        }
        Insert: {
          canonical_index_id: string
          catalog_number?: string | null
          composer_name: string
          created_at?: string
          description?: string
          difficulty?: Database["public"]["Enums"]["difficulty"] | null
          duration_minutes?: number | null
          era?: string | null
          form?: string | null
          fts?: unknown
          id: string
          instruments?: string[]
          musicbrainz_work_id?: string | null
          seed_description_vote_id?: string
          seed_difficulty_vote_id?: string
          source?: string
          title: string
        }
        Update: {
          canonical_index_id?: string
          catalog_number?: string | null
          composer_name?: string
          created_at?: string
          description?: string
          difficulty?: Database["public"]["Enums"]["difficulty"] | null
          duration_minutes?: number | null
          era?: string | null
          form?: string | null
          fts?: unknown
          id?: string
          instruments?: string[]
          musicbrainz_work_id?: string | null
          seed_description_vote_id?: string
          seed_difficulty_vote_id?: string
          source?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "pieces_canonical_index_id_fkey"
            columns: ["canonical_index_id"]
            isOneToOne: false
            referencedRelation: "canonical_piece_index"
            referencedColumns: ["id"]
          },
        ]
      }
      rate_limit_log: {
        Row: {
          action: string
          created_at: string
          id: number
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          id?: number
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          id?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rate_limit_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      search_misses: {
        Row: {
          created_at: string
          id: string
          query: string
          query_length: number
          result_count: number
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          query: string
          query_length?: number
          result_count?: number
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          query?: string
          query_length?: number
          result_count?: number
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "search_misses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      search_queries: {
        Row: {
          created_at: string
          id: string
          query: string
          result_count: number
        }
        Insert: {
          created_at?: string
          id?: string
          query: string
          result_count?: number
        }
        Update: {
          created_at?: string
          id?: string
          query?: string
          result_count?: number
        }
        Relationships: []
      }
      users: {
        Row: {
          avatar_url: string | null
          bio: string | null
          contributor_active: boolean
          contributor_agreement_signed_at: string | null
          contributor_bio_short: string | null
          created_at: string
          display_name: string
          email_weekly_digest: boolean
          email_welcome: boolean
          ensembles: string[] | null
          fts: unknown
          genres: string[] | null
          id: string
          instrument: string | null
          is_banned: boolean
          is_contributor: boolean
          is_maestro: boolean
          level: Database["public"]["Enums"]["user_level"] | null
          location: string | null
          managed_sections: Json
          role: string
          social_links: Json | null
          username: string | null
          website: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          contributor_active?: boolean
          contributor_agreement_signed_at?: string | null
          contributor_bio_short?: string | null
          created_at?: string
          display_name: string
          email_weekly_digest?: boolean
          email_welcome?: boolean
          ensembles?: string[] | null
          fts?: unknown
          genres?: string[] | null
          id: string
          instrument?: string | null
          is_banned?: boolean
          is_contributor?: boolean
          is_maestro?: boolean
          level?: Database["public"]["Enums"]["user_level"] | null
          location?: string | null
          managed_sections?: Json
          role?: string
          social_links?: Json | null
          username?: string | null
          website?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          contributor_active?: boolean
          contributor_agreement_signed_at?: string | null
          contributor_bio_short?: string | null
          created_at?: string
          display_name?: string
          email_weekly_digest?: boolean
          email_welcome?: boolean
          ensembles?: string[] | null
          fts?: unknown
          genres?: string[] | null
          id?: string
          instrument?: string | null
          is_banned?: boolean
          is_contributor?: boolean
          is_maestro?: boolean
          level?: Database["public"]["Enums"]["user_level"] | null
          location?: string | null
          managed_sections?: Json
          role?: string
          social_links?: Json | null
          username?: string | null
          website?: string | null
        }
        Relationships: []
      }
      vote_tallies: {
        Row: {
          down_count: number
          net_score: number
          subject_id: string
          subject_table: string
          up_count: number
          updated_at: string
        }
        Insert: {
          down_count?: number
          net_score?: number
          subject_id: string
          subject_table: string
          up_count?: number
          updated_at?: string
        }
        Update: {
          down_count?: number
          net_score?: number
          subject_id?: string
          subject_table?: string
          up_count?: number
          updated_at?: string
        }
        Relationships: []
      }
      votes: {
        Row: {
          created_at: string
          id: string
          subject_id: string
          subject_table: string
          updated_at: string
          user_id: string
          vote_value: number
        }
        Insert: {
          created_at?: string
          id?: string
          subject_id: string
          subject_table: string
          updated_at?: string
          user_id: string
          vote_value: number
        }
        Update: {
          created_at?: string
          id?: string
          subject_id?: string
          subject_table?: string
          updated_at?: string
          user_id?: string
          vote_value?: number
        }
        Relationships: [
          {
            foreignKeyName: "votes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      working_on: {
        Row: {
          created_at: string
          piece_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          piece_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          piece_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "working_on_piece_id_fkey"
            columns: ["piece_id"]
            isOneToOne: false
            referencedRelation: "pieces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "working_on_piece_id_fkey"
            columns: ["piece_id"]
            isOneToOne: false
            referencedRelation: "v_pieces_with_content_state"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "working_on_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      v_interpretive_school_versions_published: {
        Row: {
          approved_at: string | null
          authored_by: string | null
          body: string | null
          contributor_id: string | null
          created_at: string | null
          id: string | null
          piece_id: string | null
          rejection_note: string | null
          school_id: string | null
          version_number: number | null
        }
        Relationships: [
          {
            foreignKeyName: "interpretive_school_versions_authored_by_fkey"
            columns: ["authored_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interpretive_school_versions_contributor_id_fkey"
            columns: ["contributor_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interpretive_school_versions_piece_id_fkey"
            columns: ["piece_id"]
            isOneToOne: false
            referencedRelation: "pieces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interpretive_school_versions_piece_id_fkey"
            columns: ["piece_id"]
            isOneToOne: false
            referencedRelation: "v_pieces_with_content_state"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interpretive_school_versions_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "interpretive_schools"
            referencedColumns: ["id"]
          },
        ]
      }
      v_landmark_versions_published: {
        Row: {
          approved_at: string | null
          authored_by: string | null
          contributor_id: string | null
          created_at: string | null
          description: string | null
          flags: Json | null
          id: string | null
          label: string | null
          landmark_id: string | null
          measure_end: number | null
          measure_start: number | null
          movement_id: string | null
          ordinal: number | null
          piece_id: string | null
          practice_notes: Json | null
          rejection_note: string | null
          version_number: number | null
        }
        Relationships: [
          {
            foreignKeyName: "landmark_versions_authored_by_fkey"
            columns: ["authored_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "landmark_versions_contributor_id_fkey"
            columns: ["contributor_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "landmark_versions_landmark_id_fkey"
            columns: ["landmark_id"]
            isOneToOne: false
            referencedRelation: "landmarks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "landmark_versions_movement_id_fkey"
            columns: ["movement_id"]
            isOneToOne: false
            referencedRelation: "movements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "landmark_versions_piece_id_fkey"
            columns: ["piece_id"]
            isOneToOne: false
            referencedRelation: "pieces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "landmark_versions_piece_id_fkey"
            columns: ["piece_id"]
            isOneToOne: false
            referencedRelation: "v_pieces_with_content_state"
            referencedColumns: ["id"]
          },
        ]
      }
      v_performers_note_versions_published: {
        Row: {
          approved_at: string | null
          authored_by: string | null
          body: string | null
          contributor_id: string | null
          created_at: string | null
          id: string | null
          note_id: string | null
          piece_id: string | null
          rejection_note: string | null
          version_number: number | null
        }
        Relationships: [
          {
            foreignKeyName: "performers_note_versions_authored_by_fkey"
            columns: ["authored_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performers_note_versions_contributor_id_fkey"
            columns: ["contributor_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performers_note_versions_note_id_fkey"
            columns: ["note_id"]
            isOneToOne: false
            referencedRelation: "performers_notes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performers_note_versions_piece_id_fkey"
            columns: ["piece_id"]
            isOneToOne: false
            referencedRelation: "pieces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performers_note_versions_piece_id_fkey"
            columns: ["piece_id"]
            isOneToOne: false
            referencedRelation: "v_pieces_with_content_state"
            referencedColumns: ["id"]
          },
        ]
      }
      v_piece_description_versions_published: {
        Row: {
          approved_at: string | null
          authored_by: string | null
          body: string | null
          contributor_id: string | null
          created_at: string | null
          description_id: string | null
          id: string | null
          piece_id: string | null
          rejection_note: string | null
          version_number: number | null
        }
        Relationships: [
          {
            foreignKeyName: "piece_description_versions_authored_by_fkey"
            columns: ["authored_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "piece_description_versions_contributor_id_fkey"
            columns: ["contributor_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "piece_description_versions_description_id_fkey"
            columns: ["description_id"]
            isOneToOne: false
            referencedRelation: "piece_descriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "piece_description_versions_piece_id_fkey"
            columns: ["piece_id"]
            isOneToOne: false
            referencedRelation: "pieces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "piece_description_versions_piece_id_fkey"
            columns: ["piece_id"]
            isOneToOne: false
            referencedRelation: "v_pieces_with_content_state"
            referencedColumns: ["id"]
          },
        ]
      }
      v_pieces_with_content_state: {
        Row: {
          canonical_index_id: string | null
          catalog_number: string | null
          composer_name: string | null
          has_signed_content: boolean | null
          id: string | null
          title: string | null
        }
        Insert: {
          canonical_index_id?: string | null
          catalog_number?: string | null
          composer_name?: string | null
          has_signed_content?: never
          id?: string | null
          title?: string | null
        }
        Update: {
          canonical_index_id?: string | null
          catalog_number?: string | null
          composer_name?: string | null
          has_signed_content?: never
          id?: string | null
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pieces_canonical_index_id_fkey"
            columns: ["canonical_index_id"]
            isOneToOne: false
            referencedRelation: "canonical_piece_index"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      _check_rate_limit: {
        Args: { p_action: string; p_limit: number; p_window_seconds: number }
        Returns: undefined
      }
      _clear_notifications_for: {
        Args: { p_subject_id: string; p_subject_table: string }
        Returns: undefined
      }
      _clear_notifications_for_note: {
        Args: { p_note_id: string }
        Returns: undefined
      }
      _insert_interpretive_school_version: {
        Args: {
          p_approved: boolean
          p_authored_by: string
          p_body: string
          p_contributor_id: string
          p_piece_id: string
          p_rejection_note?: string
          p_school_id: string
        }
        Returns: string
      }
      _insert_landmark_version: {
        Args: {
          p_approved: boolean
          p_authored_by: string
          p_contributor_id: string
          p_description: string
          p_flags: Json
          p_label: string
          p_landmark_id: string
          p_measure_end: number
          p_measure_start: number
          p_movement_id: string
          p_ordinal: number
          p_piece_id: string
          p_practice_notes: Json
          p_rejection_note?: string
        }
        Returns: string
      }
      _insert_notification: {
        Args: {
          p_body: string
          p_link_path: string
          p_recipient_id: string
          p_subject_id: string
          p_subject_table: string
        }
        Returns: string
      }
      _insert_performers_note_version: {
        Args: {
          p_approved: boolean
          p_authored_by: string
          p_body: string
          p_contributor_id: string
          p_note_id: string
          p_piece_id: string
          p_rejection_note?: string
        }
        Returns: string
      }
      _insert_piece_description_version: {
        Args: {
          p_approved: boolean
          p_authored_by: string
          p_body: string
          p_contributor_id: string
          p_description_id: string
          p_piece_id: string
          p_rejection_note?: string
        }
        Returns: string
      }
      _require_active_contributor: { Args: never; Returns: undefined }
      _require_staff: { Args: never; Returns: undefined }
      _slugify: { Args: { p_input: string }; Returns: string }
      _validate_landmark_payload: {
        Args: {
          p_description: string
          p_flags: Json
          p_label: string
          p_practice_notes: Json
        }
        Returns: undefined
      }
      add_piece_pill: {
        Args: { p_category: string; p_piece_id: string; p_value: string }
        Returns: string
      }
      approve_and_edit_interpretive_school: {
        Args: { p_body: string; p_school_id: string }
        Returns: string
      }
      approve_and_edit_landmark: {
        Args: {
          p_description: string
          p_flags: Json
          p_label: string
          p_landmark_id: string
          p_measure_end: number
          p_measure_start: number
          p_practice_notes: Json
        }
        Returns: string
      }
      approve_and_edit_performers_note: {
        Args: { p_body: string; p_note_id: string }
        Returns: string
      }
      approve_and_edit_piece_description: {
        Args: { p_body: string; p_description_id: string }
        Returns: string
      }
      approve_interpretive_school: {
        Args: { p_school_id: string }
        Returns: string
      }
      approve_landmark: { Args: { p_landmark_id: string }; Returns: string }
      approve_performers_note: { Args: { p_note_id: string }; Returns: string }
      approve_piece_description: {
        Args: { p_description_id: string }
        Returns: string
      }
      cast_vote: {
        Args: {
          p_subject_id: string
          p_subject_table: string
          p_vote_value: number
        }
        Returns: undefined
      }
      clear_contrib_requests_on_publish: {
        Args: { p_contributor_id: string; p_piece_id: string }
        Returns: undefined
      }
      clear_vote: {
        Args: { p_subject_id: string; p_subject_table: string }
        Returns: undefined
      }
      create_edition: {
        Args: {
          p_description?: string
          p_editor: string
          p_piece_id: string
          p_publisher: string
          p_type?: string
          p_url?: string
          p_year?: number
        }
        Returns: string
      }
      create_external_link: {
        Args: {
          p_label: string
          p_piece_id: string
          p_type: string
          p_url: string
        }
        Returns: string
      }
      create_interpretive_school_draft: {
        Args: {
          p_body: string
          p_contributor_id: string
          p_name: string
          p_piece_id: string
          p_tempo_cues?: Json
        }
        Returns: string
      }
      create_landmark_draft: {
        Args: {
          p_contributor_id: string
          p_description: string
          p_flags: Json
          p_label: string
          p_measure_end: number
          p_measure_start: number
          p_movement_id: string
          p_piece_id: string
          p_practice_notes: Json
        }
        Returns: string
      }
      create_movement: {
        Args: {
          p_edit_summary?: string
          p_key_signature?: string
          p_meter?: string
          p_name: string
          p_piece_id: string
          p_tempo_indication?: string
        }
        Returns: string
      }
      create_pedagogical_connection: {
        Args: {
          p_kind: string
          p_note?: string
          p_piece_id: string
          p_related_piece_id: string
        }
        Returns: string
      }
      create_performers_note_draft: {
        Args: { p_body: string; p_contributor_id: string; p_piece_id: string }
        Returns: string
      }
      create_piece_description_draft: {
        Args: { p_body: string; p_contributor_id: string; p_piece_id: string }
        Returns: string
      }
      delete_edition: { Args: { p_id: string }; Returns: undefined }
      delete_external_link: { Args: { p_id: string }; Returns: undefined }
      delete_movement: {
        Args: { p_edit_summary?: string; p_movement_id: string }
        Returns: undefined
      }
      delete_pedagogical_connection: {
        Args: { p_id: string }
        Returns: undefined
      }
      fetch_movement_history: {
        Args: { p_movement_id: string }
        Returns: {
          authored_by: string
          authored_by_display_name: string
          created_at: string
          edit_summary: string
          id: string
          is_current: boolean
          key_signature: string
          meter: string
          movement_id: string
          name: string
          ordinal: number
          piece_id: string
          reverted_from_version_id: string
          tempo_indication: string
          version_number: number
        }[]
      }
      fetch_ordered_subjects: {
        Args: { p_subject_ids: string[]; p_subject_table: string }
        Returns: string[]
      }
      fetch_piece_changelog: {
        Args: { p_piece_id: string }
        Returns: {
          authored_by: string
          authored_by_display_name: string
          created_at: string
          edit_summary: string
          id: string
          subject_id: string
          subject_label: string
          subject_type: string
          version_number: number
        }[]
      }
      fuzzy_search: {
        Args: { search_query: string }
        Returns: {
          match_id: string
          match_subtitle: string
          match_title: string
          match_type: string
          similarity: number
        }[]
      }
      gc_unconfirmed_auth_users: { Args: never; Returns: number }
      is_admin: { Args: never; Returns: boolean }
      is_staff: { Args: never; Returns: boolean }
      materialize_piece_from_index: {
        Args: { p_index_id: string }
        Returns: string
      }
      publish_contributor_edit: {
        Args: { p_body: string; p_note_id: string }
        Returns: string
      }
      publish_contributor_interpretive_school: {
        Args: {
          p_body: string
          p_name: string
          p_piece_id: string
          p_tempo_cues?: Json
        }
        Returns: string
      }
      publish_contributor_interpretive_school_edit: {
        Args: { p_body: string; p_school_id: string }
        Returns: string
      }
      publish_contributor_landmark: {
        Args: {
          p_description: string
          p_flags: Json
          p_label: string
          p_measure_end: number
          p_measure_start: number
          p_movement_id: string
          p_piece_id: string
          p_practice_notes: Json
        }
        Returns: string
      }
      publish_contributor_landmark_edit: {
        Args: {
          p_description: string
          p_flags: Json
          p_label: string
          p_landmark_id: string
          p_measure_end: number
          p_measure_start: number
          p_practice_notes: Json
        }
        Returns: string
      }
      publish_contributor_note: {
        Args: { p_body: string; p_piece_id: string }
        Returns: string
      }
      publish_contributor_piece_description: {
        Args: { p_body: string; p_piece_id: string }
        Returns: string
      }
      publish_contributor_piece_description_edit: {
        Args: { p_body: string; p_description_id: string }
        Returns: string
      }
      publish_contributor_piece_difficulty: {
        Args: {
          p_ensemble_level: number
          p_ensemble_note: string
          p_interpretive_level: number
          p_interpretive_note: string
          p_piece_id: string
          p_stamina_level: number
          p_stamina_note: string
          p_technical_level: number
          p_technical_note: string
        }
        Returns: string
      }
      publish_contributor_piece_difficulty_edit: {
        Args: {
          p_ensemble_level: number
          p_ensemble_note: string
          p_interpretive_level: number
          p_interpretive_note: string
          p_rating_id: string
          p_stamina_level: number
          p_stamina_note: string
          p_technical_level: number
          p_technical_note: string
        }
        Returns: undefined
      }
      reject_interpretive_school: {
        Args: { p_reason?: string; p_school_id: string }
        Returns: undefined
      }
      reject_landmark: {
        Args: { p_landmark_id: string; p_reason?: string }
        Returns: undefined
      }
      reject_performers_note: {
        Args: { p_note_id: string; p_reason?: string }
        Returns: undefined
      }
      reject_piece_description: {
        Args: { p_description_id: string; p_reason?: string }
        Returns: undefined
      }
      remove_interpretive_school: {
        Args: { p_school_id: string }
        Returns: undefined
      }
      remove_landmark: { Args: { p_landmark_id: string }; Returns: undefined }
      remove_performers_note: {
        Args: { p_note_id: string }
        Returns: undefined
      }
      remove_piece_description: {
        Args: { p_description_id: string }
        Returns: undefined
      }
      remove_piece_difficulty: {
        Args: { p_rating_id: string }
        Returns: undefined
      }
      remove_piece_pill: { Args: { p_pill_id: string }; Returns: undefined }
      request_contribution: {
        Args: {
          p_note?: string
          p_piece_id: string
          p_recipient_email?: string
          p_recipient_username?: string
        }
        Returns: string
      }
      retract_interpretive_school: {
        Args: { p_school_id: string }
        Returns: undefined
      }
      retract_landmark: { Args: { p_landmark_id: string }; Returns: undefined }
      retract_performers_note: {
        Args: { p_note_id: string }
        Returns: undefined
      }
      retract_piece_description: {
        Args: { p_description_id: string }
        Returns: undefined
      }
      revert_movement: {
        Args: {
          p_edit_summary?: string
          p_movement_id: string
          p_target_version_id: string
        }
        Returns: string
      }
      search_pieces_typeahead: {
        Args: { p_query: string }
        Returns: {
          catalog_number: string
          composer_name: string
          id: string
          instruments: string[]
          result_type: string
          title: string
        }[]
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      submit_interpretive_school: {
        Args: { p_school_id: string }
        Returns: undefined
      }
      submit_landmark: { Args: { p_landmark_id: string }; Returns: undefined }
      submit_performers_note: {
        Args: { p_note_id: string }
        Returns: undefined
      }
      submit_piece_description: {
        Args: { p_description_id: string }
        Returns: undefined
      }
      swap_edition_ordinals: {
        Args: { p_id_a: string; p_id_b: string }
        Returns: undefined
      }
      swap_external_link_ordinals: {
        Args: { p_id_a: string; p_id_b: string }
        Returns: undefined
      }
      swap_movement_ordinals: {
        Args: { p_movement_id_a: string; p_movement_id_b: string }
        Returns: undefined
      }
      swap_pedagogical_ordinals: {
        Args: { p_id_a: string; p_id_b: string }
        Returns: undefined
      }
      update_edition: {
        Args: {
          p_description?: string
          p_editor: string
          p_id: string
          p_publisher: string
          p_type?: string
          p_url?: string
          p_year?: number
        }
        Returns: undefined
      }
      update_external_link: {
        Args: { p_id: string; p_label: string; p_type: string; p_url: string }
        Returns: undefined
      }
      update_interpretive_school_draft: {
        Args: {
          p_body?: string
          p_name?: string
          p_school_id: string
          p_tempo_cues?: Json
        }
        Returns: string
      }
      update_interpretive_school_metadata: {
        Args: { p_name?: string; p_school_id: string; p_tempo_cues?: Json }
        Returns: undefined
      }
      update_landmark_draft: {
        Args: {
          p_description: string
          p_flags: Json
          p_label: string
          p_landmark_id: string
          p_measure_end: number
          p_measure_start: number
          p_practice_notes: Json
        }
        Returns: string
      }
      update_movement: {
        Args: {
          p_edit_summary?: string
          p_key_signature: string
          p_meter: string
          p_movement_id: string
          p_name: string
          p_ordinal: number
          p_tempo_indication: string
        }
        Returns: string
      }
      update_pedagogical_connection: {
        Args: {
          p_id: string
          p_kind: string
          p_note?: string
          p_related_piece_id: string
        }
        Returns: undefined
      }
      update_performers_note_draft: {
        Args: { p_body: string; p_note_id: string }
        Returns: string
      }
      update_piece_description_draft: {
        Args: { p_body: string; p_description_id: string }
        Returns: string
      }
    }
    Enums: {
      difficulty: "beginner" | "intermediate" | "advanced" | "virtuoso"
      draft_status:
        | "draft"
        | "awaiting_contributor_approval"
        | "published"
        | "removed"
      flag_severity: "informational" | "notable" | "significant"
      flag_type:
        | "stamina"
        | "bow_control"
        | "stretch"
        | "voicing"
        | "double_stops"
        | "sustained_bowing"
        | "articulation"
        | "rhythmic_lift"
        | "intonation"
        | "ensemble_coordination"
      link_type:
        | "imslp"
        | "youtube"
        | "wikipedia"
        | "spotify"
        | "soundcloud"
        | "bandcamp"
        | "internet_archive"
        | "vimeo"
      notification_type:
        | "draft_awaiting_approval"
        | "contribution_requested"
        | "contribution_fulfilled"
      user_level:
        | "student"
        | "amateur"
        | "professional"
        | "teacher"
        | "enthusiast"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      difficulty: ["beginner", "intermediate", "advanced", "virtuoso"],
      draft_status: [
        "draft",
        "awaiting_contributor_approval",
        "published",
        "removed",
      ],
      flag_severity: ["informational", "notable", "significant"],
      flag_type: [
        "stamina",
        "bow_control",
        "stretch",
        "voicing",
        "double_stops",
        "sustained_bowing",
        "articulation",
        "rhythmic_lift",
        "intonation",
        "ensemble_coordination",
      ],
      link_type: [
        "imslp",
        "youtube",
        "wikipedia",
        "spotify",
        "soundcloud",
        "bandcamp",
        "internet_archive",
        "vimeo",
      ],
      notification_type: [
        "draft_awaiting_approval",
        "contribution_requested",
        "contribution_fulfilled",
      ],
      user_level: [
        "student",
        "amateur",
        "professional",
        "teacher",
        "enthusiast",
      ],
    },
  },
} as const

A new version of Supabase CLI is available: v2.90.0 (currently installed v2.84.2)
We recommend updating regularly for new features and bug fixes: https://supabase.com/docs/guides/cli/getting-started#updating-the-supabase-cli

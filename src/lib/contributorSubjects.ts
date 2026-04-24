// Shared configuration for the three signed content types that flow through
// the contribution-request drafts surface. Consumed by the Open items tab
// (RecipientDraftsTab) and cross-piece renderers needing label/anchor.
//
// The staff-draft RPC family (approve_*, reject_*, submit_*, retract_*,
// create_*_draft, update_*_draft) is retired as of PR 5b. Only
// label/anchor/shape metadata is kept here.
//
// Adding a new subject type in a future slice:
//   1. Add the table/versions pair in a migration.
//   2. Add a row here.
//   3. Add the draft_kind enum value in the drafts schema migration.

export const SUBJECT_TABLES = [
  'performers_notes',
  'interpretive_schools',
  'piece_descriptions',
] as const;

export type SubjectTable = (typeof SUBJECT_TABLES)[number];

export interface SubjectConfig {
  table: SubjectTable;
  versionsTable: string;
  versionForeignKey: string;
  label: string;
  pageContext: string;
  anchor: string;
  hasName: boolean;
  hasTempoCues: boolean;
}

export const SUBJECT_CONFIG: Record<SubjectTable, SubjectConfig> = {
  performers_notes: {
    table: 'performers_notes',
    versionsTable: 'performers_note_versions',
    versionForeignKey: 'note_id',
    label: "Performer's note",
    pageContext: 'on the piece page',
    anchor: '#performers-notes',
    hasName: false,
    hasTempoCues: false,
  },
  interpretive_schools: {
    table: 'interpretive_schools',
    versionsTable: 'interpretive_school_versions',
    versionForeignKey: 'school_id',
    label: 'Interpretive school',
    pageContext: 'on the piece page',
    anchor: '#interpretive-schools',
    hasName: true,
    hasTempoCues: true,
  },
  piece_descriptions: {
    table: 'piece_descriptions',
    versionsTable: 'piece_description_versions',
    versionForeignKey: 'description_id',
    label: 'Piece description',
    pageContext: 'on the piece page',
    anchor: '#signed-description',
    hasName: false,
    hasTempoCues: false,
  },
};

/** Type guard — avoids widening to string in exhaustive switch blocks. */
export function isSubjectTable(value: string): value is SubjectTable {
  return (SUBJECT_TABLES as readonly string[]).includes(value);
}

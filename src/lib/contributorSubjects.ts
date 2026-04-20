// Shared configuration for the three signed content types that flow through
// the contributor approval pipeline. Consumed by the notifications queue,
// the navbar bell, and the daily digest edge function.
//
// Adding a new subject type in a future slice:
//   1. Add the table/versions pair in a migration.
//   2. Add a row here.
//   3. Add the CHECK value for `notifications.subject_table` in the same migration.
// Everything downstream picks it up automatically.

export const SUBJECT_TABLES = [
  'performers_notes',
  'interpretive_schools',
  'piece_descriptions',
] as const;

export type SubjectTable = (typeof SUBJECT_TABLES)[number];

export interface SubjectConfig {
  /** The subject table name (matches notifications.subject_table values). */
  table: SubjectTable;
  /** The append-only version table for this subject. */
  versionsTable: string;
  /** The FK column on the version table pointing back to the subject. */
  versionForeignKey: string;
  /** Human label for queue cards + kicker copy. */
  label: string;
  /** Plural form for the "on the piece page" context strip. */
  pageContext: string;
  /** Anchor fragment on the piece page (link_path is authoritative; this is
   * a fallback for callers that need to compute deep links client-side). */
  anchor: string;
  /** True if the subject has a `name` column (schools). */
  hasName: boolean;
  /** True if the subject has a `tempo_cues` jsonb column (schools). */
  hasTempoCues: boolean;
  /** RPC names the queue dispatches to for each contributor action. */
  rpcs: {
    approve: string;
    approveAndEdit: string;
    reject: string;
    /** Staff: create a draft on behalf of a contributor. */
    createDraft: string;
    /** Staff: insert a new version body on an existing draft. */
    updateDraft: string;
    /** Staff: send a draft to the contributor's queue. */
    submit: string;
    /** Staff: pull a submitted draft back before the contributor acts. */
    retract: string;
  };
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
    rpcs: {
      approve: 'approve_performers_note',
      approveAndEdit: 'approve_and_edit_performers_note',
      reject: 'reject_performers_note',
      createDraft: 'create_performers_note_draft',
      updateDraft: 'update_performers_note_draft',
      submit: 'submit_performers_note',
      retract: 'retract_performers_note',
    },
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
    rpcs: {
      approve: 'approve_interpretive_school',
      approveAndEdit: 'approve_and_edit_interpretive_school',
      reject: 'reject_interpretive_school',
      createDraft: 'create_interpretive_school_draft',
      updateDraft: 'update_interpretive_school_draft',
      submit: 'submit_interpretive_school',
      retract: 'retract_interpretive_school',
    },
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
    rpcs: {
      approve: 'approve_piece_description',
      approveAndEdit: 'approve_and_edit_piece_description',
      reject: 'reject_piece_description',
      createDraft: 'create_piece_description_draft',
      updateDraft: 'update_piece_description_draft',
      submit: 'submit_piece_description',
      retract: 'retract_piece_description',
    },
  },
};

/** Stable param name for the RPCs — all contributor-action RPCs use the
 * subject's own id param. Callers pass `{ [idParam]: subjectId }` shaped
 * correctly per subject_table. */
export function rpcSubjectIdParam(table: SubjectTable): string {
  switch (table) {
    case 'performers_notes': return 'p_note_id';
    case 'interpretive_schools': return 'p_school_id';
    case 'piece_descriptions': return 'p_description_id';
  }
}

/** Type guard — avoids widening to string in exhaustive switch blocks. */
export function isSubjectTable(value: string): value is SubjectTable {
  return (SUBJECT_TABLES as readonly string[]).includes(value);
}

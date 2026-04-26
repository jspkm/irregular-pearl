-- Account deletion: cascade & redirect the FKs from public.users.
--
-- Backs the Profile -> Security -> Danger zone "Delete account" flow defined
-- in TODOS.md and PR #86. The full policy is documented in that PR; this
-- migration is the schema half.
--
-- Once applied, calling auth.admin.deleteUser(uid) alone produces the
-- correct end state via the existing public.users -> auth.users cascade
-- chain (see 20260327000000_initial_schema.sql:11). No companion RPC is
-- needed.
--
-- Three FK behaviors are reshaped here:
--
--   1. Bylined signed content (and its append-only version chain) hard-
--      deletes with the user. Right-to-erasure under GDPR Art. 17 / CCPA /
--      equivalent requires that personally identifiable data — including
--      the byline + contribution metadata — be erased on request, so we
--      flip RESTRICT -> CASCADE on every contributor_id column. Votes the
--      user cast also cascade (the row is personal data; the tally
--      decrement via _apply_vote_delta is the cost we accept).
--
--   2. Audit columns (drafted_by, approved_by, rejected_by, removed_by,
--      authored_by, metadata_updated_by, plus created_by / added_by /
--      actor_id on wiki-edited reference data and forensic logs) redirect
--      to a sentinel "former contributor" user when the actor deletes —
--      so the visible byline on a row that survives the deletion (because
--      it belongs to another contributor) reads "former contributor"
--      rather than blank. ON DELETE SET DEFAULT does the redirect; the
--      column default is the sentinel UUID. authored_by columns drop
--      their NOT NULL since SET DEFAULT writes a real UUID — but the
--      sentinel itself is non-null so the in-row invariant is preserved.
--
--   3. The sentinel is a real auth.users row (with an unrecoverable
--      random password) so the public.users -> auth.users FK holds. Email
--      uses the .invalid TLD (RFC 2606) to guarantee no real mail can
--      reach it. The on_auth_user_created trigger from
--      20260329100000_auto_create_user_profile.sql creates the matching
--      public.users row with display_name = 'former contributor' from
--      raw_user_meta_data.full_name.
--
-- Tables already correct (no change here): notifications.recipient_id
-- cascade; search_misses.user_id, piece_views.user_id,
-- contribution_requests.recipient_id, contribution_request_drafts.recipient_id,
-- contribution_request_draft_messages.user_id all set null;
-- artist_profiles.user_id, profiles.id, discussions.user_id,
-- reports.reporter_user_id, movements_wiki_contributions.user_id,
-- draft_note_requests.user_id, contribution_requests.sender_id,
-- contribution_request_drafts.sender_id, votes.user_id all cascade.

begin;

-- ============================================================================
-- 0. Sentinel "former contributor" user.
-- ============================================================================

create extension if not exists pgcrypto;

insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_anonymous,
  is_sso_user
) values (
  '00000000-0000-0000-0000-000000000000',
  '00000000-0000-0000-0000-000000000001',
  'authenticated',
  'authenticated',
  'former-contributor@irregularpearl.invalid',
  crypt(gen_random_uuid()::text, gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"full_name":"former contributor"}'::jsonb,
  false,
  false
) on conflict (id) do nothing;

-- Belt-and-suspenders: ensure display_name is correct even if a row with
-- this UUID already existed in some env from prior hand-creation.
update public.users
   set display_name = 'former contributor'
 where id = '00000000-0000-0000-0000-000000000001'
   and (display_name is null or display_name <> 'former contributor');

-- ============================================================================
-- 1. Bylined signed-content tables: contributor_id RESTRICT -> CASCADE.
-- ============================================================================

alter table public.performers_notes
  drop constraint if exists performers_notes_contributor_id_fkey,
  add constraint performers_notes_contributor_id_fkey
    foreign key (contributor_id) references public.users(id) on delete cascade;

alter table public.performers_note_versions
  drop constraint if exists performers_note_versions_contributor_id_fkey,
  add constraint performers_note_versions_contributor_id_fkey
    foreign key (contributor_id) references public.users(id) on delete cascade;

alter table public.interpretive_schools
  drop constraint if exists interpretive_schools_contributor_id_fkey,
  add constraint interpretive_schools_contributor_id_fkey
    foreign key (contributor_id) references public.users(id) on delete cascade;

alter table public.interpretive_school_versions
  drop constraint if exists interpretive_school_versions_contributor_id_fkey,
  add constraint interpretive_school_versions_contributor_id_fkey
    foreign key (contributor_id) references public.users(id) on delete cascade;

alter table public.piece_descriptions
  drop constraint if exists piece_descriptions_contributor_id_fkey,
  add constraint piece_descriptions_contributor_id_fkey
    foreign key (contributor_id) references public.users(id) on delete cascade;

alter table public.piece_description_versions
  drop constraint if exists piece_description_versions_contributor_id_fkey,
  add constraint piece_description_versions_contributor_id_fkey
    foreign key (contributor_id) references public.users(id) on delete cascade;

alter table public.landmarks
  drop constraint if exists landmarks_contributor_id_fkey,
  add constraint landmarks_contributor_id_fkey
    foreign key (contributor_id) references public.users(id) on delete cascade;

alter table public.landmark_versions
  drop constraint if exists landmark_versions_contributor_id_fkey,
  add constraint landmark_versions_contributor_id_fkey
    foreign key (contributor_id) references public.users(id) on delete cascade;

alter table public.piece_difficulty_ratings
  drop constraint if exists piece_difficulty_ratings_contributor_id_fkey,
  add constraint piece_difficulty_ratings_contributor_id_fkey
    foreign key (contributor_id) references public.users(id) on delete cascade;

-- ============================================================================
-- 2. Audit columns: NO ACTION -> SET DEFAULT (sentinel).
-- ============================================================================

-- 2a. authored_by on version tables — drop NOT NULL, set default, redirect.

alter table public.performers_note_versions
  alter column authored_by drop not null,
  alter column authored_by set default '00000000-0000-0000-0000-000000000001';
alter table public.performers_note_versions
  drop constraint if exists performers_note_versions_authored_by_fkey,
  add constraint performers_note_versions_authored_by_fkey
    foreign key (authored_by) references public.users(id) on delete set default;

alter table public.interpretive_school_versions
  alter column authored_by drop not null,
  alter column authored_by set default '00000000-0000-0000-0000-000000000001';
alter table public.interpretive_school_versions
  drop constraint if exists interpretive_school_versions_authored_by_fkey,
  add constraint interpretive_school_versions_authored_by_fkey
    foreign key (authored_by) references public.users(id) on delete set default;

alter table public.piece_description_versions
  alter column authored_by drop not null,
  alter column authored_by set default '00000000-0000-0000-0000-000000000001';
alter table public.piece_description_versions
  drop constraint if exists piece_description_versions_authored_by_fkey,
  add constraint piece_description_versions_authored_by_fkey
    foreign key (authored_by) references public.users(id) on delete set default;

alter table public.landmark_versions
  alter column authored_by drop not null,
  alter column authored_by set default '00000000-0000-0000-0000-000000000001';
alter table public.landmark_versions
  drop constraint if exists landmark_versions_authored_by_fkey,
  add constraint landmark_versions_authored_by_fkey
    foreign key (authored_by) references public.users(id) on delete set default;

-- movement_versions.authored_by is already nullable (initial seed = null).
-- Set the default so wiki-edit attribution drops to the sentinel rather
-- than NULL when the actor deletes.
alter table public.movement_versions
  alter column authored_by set default '00000000-0000-0000-0000-000000000001';
alter table public.movement_versions
  drop constraint if exists movement_versions_authored_by_fkey,
  add constraint movement_versions_authored_by_fkey
    foreign key (authored_by) references public.users(id) on delete set default;

-- 2b. Parent-row *_by columns. Schema check confirmed the actual columns
-- present (some early migration drafts referenced submitted_by /
-- retracted_by, but those did not survive into the final schema).

-- performers_notes: drafted_by, approved_by, rejected_by, removed_by.
alter table public.performers_notes
  alter column drafted_by set default '00000000-0000-0000-0000-000000000001',
  alter column approved_by set default '00000000-0000-0000-0000-000000000001',
  alter column rejected_by set default '00000000-0000-0000-0000-000000000001',
  alter column removed_by set default '00000000-0000-0000-0000-000000000001';
alter table public.performers_notes
  drop constraint if exists performers_notes_drafted_by_fkey,
  add constraint performers_notes_drafted_by_fkey
    foreign key (drafted_by) references public.users(id) on delete set default,
  drop constraint if exists performers_notes_approved_by_fkey,
  add constraint performers_notes_approved_by_fkey
    foreign key (approved_by) references public.users(id) on delete set default,
  drop constraint if exists performers_notes_rejected_by_fkey,
  add constraint performers_notes_rejected_by_fkey
    foreign key (rejected_by) references public.users(id) on delete set default,
  drop constraint if exists performers_notes_removed_by_fkey,
  add constraint performers_notes_removed_by_fkey
    foreign key (removed_by) references public.users(id) on delete set default;

-- interpretive_schools: drafted_by, approved_by, rejected_by, removed_by,
--                       metadata_updated_by.
alter table public.interpretive_schools
  alter column drafted_by set default '00000000-0000-0000-0000-000000000001',
  alter column approved_by set default '00000000-0000-0000-0000-000000000001',
  alter column rejected_by set default '00000000-0000-0000-0000-000000000001',
  alter column removed_by set default '00000000-0000-0000-0000-000000000001',
  alter column metadata_updated_by set default '00000000-0000-0000-0000-000000000001';
alter table public.interpretive_schools
  drop constraint if exists interpretive_schools_drafted_by_fkey,
  add constraint interpretive_schools_drafted_by_fkey
    foreign key (drafted_by) references public.users(id) on delete set default,
  drop constraint if exists interpretive_schools_approved_by_fkey,
  add constraint interpretive_schools_approved_by_fkey
    foreign key (approved_by) references public.users(id) on delete set default,
  drop constraint if exists interpretive_schools_rejected_by_fkey,
  add constraint interpretive_schools_rejected_by_fkey
    foreign key (rejected_by) references public.users(id) on delete set default,
  drop constraint if exists interpretive_schools_removed_by_fkey,
  add constraint interpretive_schools_removed_by_fkey
    foreign key (removed_by) references public.users(id) on delete set default,
  drop constraint if exists interpretive_schools_metadata_updated_by_fkey,
  add constraint interpretive_schools_metadata_updated_by_fkey
    foreign key (metadata_updated_by) references public.users(id) on delete set default;

-- piece_descriptions: drafted_by, approved_by, rejected_by, removed_by.
alter table public.piece_descriptions
  alter column drafted_by set default '00000000-0000-0000-0000-000000000001',
  alter column approved_by set default '00000000-0000-0000-0000-000000000001',
  alter column rejected_by set default '00000000-0000-0000-0000-000000000001',
  alter column removed_by set default '00000000-0000-0000-0000-000000000001';
alter table public.piece_descriptions
  drop constraint if exists piece_descriptions_drafted_by_fkey,
  add constraint piece_descriptions_drafted_by_fkey
    foreign key (drafted_by) references public.users(id) on delete set default,
  drop constraint if exists piece_descriptions_approved_by_fkey,
  add constraint piece_descriptions_approved_by_fkey
    foreign key (approved_by) references public.users(id) on delete set default,
  drop constraint if exists piece_descriptions_rejected_by_fkey,
  add constraint piece_descriptions_rejected_by_fkey
    foreign key (rejected_by) references public.users(id) on delete set default,
  drop constraint if exists piece_descriptions_removed_by_fkey,
  add constraint piece_descriptions_removed_by_fkey
    foreign key (removed_by) references public.users(id) on delete set default;

-- landmarks: drafted_by, approved_by, rejected_by, removed_by.
alter table public.landmarks
  alter column drafted_by set default '00000000-0000-0000-0000-000000000001',
  alter column approved_by set default '00000000-0000-0000-0000-000000000001',
  alter column rejected_by set default '00000000-0000-0000-0000-000000000001',
  alter column removed_by set default '00000000-0000-0000-0000-000000000001';
alter table public.landmarks
  drop constraint if exists landmarks_drafted_by_fkey,
  add constraint landmarks_drafted_by_fkey
    foreign key (drafted_by) references public.users(id) on delete set default,
  drop constraint if exists landmarks_approved_by_fkey,
  add constraint landmarks_approved_by_fkey
    foreign key (approved_by) references public.users(id) on delete set default,
  drop constraint if exists landmarks_rejected_by_fkey,
  add constraint landmarks_rejected_by_fkey
    foreign key (rejected_by) references public.users(id) on delete set default,
  drop constraint if exists landmarks_removed_by_fkey,
  add constraint landmarks_removed_by_fkey
    foreign key (removed_by) references public.users(id) on delete set default;

-- piece_difficulty_ratings: removed_by only.
alter table public.piece_difficulty_ratings
  alter column removed_by set default '00000000-0000-0000-0000-000000000001';
alter table public.piece_difficulty_ratings
  drop constraint if exists piece_difficulty_ratings_removed_by_fkey,
  add constraint piece_difficulty_ratings_removed_by_fkey
    foreign key (removed_by) references public.users(id) on delete set default;

-- 2c. Wiki-edit / reference-data attribution columns.

alter table public.editions
  alter column created_by set default '00000000-0000-0000-0000-000000000001';
alter table public.editions
  drop constraint if exists editions_created_by_fkey,
  add constraint editions_created_by_fkey
    foreign key (created_by) references public.users(id) on delete set default;

alter table public.external_links
  alter column created_by set default '00000000-0000-0000-0000-000000000001';
alter table public.external_links
  drop constraint if exists external_links_created_by_fkey,
  add constraint external_links_created_by_fkey
    foreign key (created_by) references public.users(id) on delete set default;

alter table public.pedagogical_connections
  alter column created_by set default '00000000-0000-0000-0000-000000000001';
alter table public.pedagogical_connections
  drop constraint if exists pedagogical_connections_created_by_fkey,
  add constraint pedagogical_connections_created_by_fkey
    foreign key (created_by) references public.users(id) on delete set default;

-- piece_pills.added_by — promote SET NULL to SET DEFAULT (sentinel).
alter table public.piece_pills
  alter column added_by set default '00000000-0000-0000-0000-000000000001';
alter table public.piece_pills
  drop constraint if exists piece_pills_added_by_fkey,
  add constraint piece_pills_added_by_fkey
    foreign key (added_by) references public.users(id) on delete set default;

-- 2d. content_mutation_log.actor_id — forensic trail.
alter table public.content_mutation_log
  alter column actor_id set default '00000000-0000-0000-0000-000000000001';
alter table public.content_mutation_log
  drop constraint if exists content_mutation_log_actor_id_fkey,
  add constraint content_mutation_log_actor_id_fkey
    foreign key (actor_id) references public.users(id) on delete set default;

commit;

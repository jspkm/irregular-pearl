-- Slice C Step 4: votes + trigger-maintained tallies.
--
-- Subject-agnostic votes. Users get up/down on any signed-content subject.
-- Step 4 lights up voting on Slice A/B surfaces:
--   - performers_notes
--   - interpretive_schools
--   - piece_descriptions
-- `landmarks` is listed in the CHECK vocabulary so the constraint doesn't
-- have to change when Step 6 lands, but no orphan trigger for it yet (the
-- table doesn't exist).
--
-- Rev 5 design (per plan §2.5): trigger-maintained tally table instead of
-- a materialized view. O(1) per vote, private by default (no public count
-- display, ever — per PRD invariant).
--
-- RLS:
--   - votes: authenticated users SELECT their own rows only (user_id =
--     auth.uid()). Writes flow through cast_vote / clear_vote RPCs
--     (SECURITY DEFINER). No anon read.
--   - vote_tallies: REVOKE all from anon + authenticated. Reads go through
--     a future `fetch_ordered_subjects` RPC (Step 5 stacking) or internal
--     admin audits. This PR does not land that RPC — Step 4 only needs
--     write path + per-user read for highlighting own thumb.

begin;

-- ============================================================================
-- votes
-- ============================================================================

create table public.votes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  subject_table text not null,
  subject_id uuid not null,
  vote_value smallint not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, subject_table, subject_id),
  check (vote_value in (-1, 1)),
  check (subject_table in (
    'performers_notes', 'interpretive_schools', 'piece_descriptions', 'landmarks'
  ))
);

create index ix_votes_subject on public.votes (subject_table, subject_id);
create index ix_votes_user on public.votes (user_id);

alter table public.votes enable row level security;

-- Users can read only their own votes. The UI uses this to highlight the
-- user's selected thumb. Other users' votes are invisible (no count leakage).
create policy votes_select_own
  on public.votes
  for select
  to authenticated
  using (user_id = auth.uid());

-- No direct insert/update/delete from the client — RPCs only.

-- ============================================================================
-- vote_tallies (trigger-maintained)
-- ============================================================================

create table public.vote_tallies (
  subject_table text not null,
  subject_id uuid not null,
  net_score integer not null default 0,
  up_count integer not null default 0,
  down_count integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (subject_table, subject_id)
);

alter table public.vote_tallies enable row level security;

-- REVOKE all — counts never reach the client. Reads happen server-side via
-- SECURITY DEFINER RPCs (stacking order in Step 5).
revoke all on public.vote_tallies from anon, authenticated;

-- ============================================================================
-- _apply_vote_delta — trigger that mutates vote_tallies on votes churn
-- ============================================================================

create or replace function public._apply_vote_delta() returns trigger
  language plpgsql
  security definer
  set search_path = public
as $$
declare
  d_net integer := 0;
  d_up integer := 0;
  d_down integer := 0;
begin
  if TG_OP = 'INSERT' then
    d_net := NEW.vote_value;
    d_up := case when NEW.vote_value = 1 then 1 else 0 end;
    d_down := case when NEW.vote_value = -1 then 1 else 0 end;
    insert into public.vote_tallies
      (subject_table, subject_id, net_score, up_count, down_count, updated_at)
    values (NEW.subject_table, NEW.subject_id, d_net, d_up, d_down, now())
    on conflict (subject_table, subject_id) do update
      set net_score = vote_tallies.net_score + excluded.net_score,
          up_count = vote_tallies.up_count + excluded.up_count,
          down_count = vote_tallies.down_count + excluded.down_count,
          updated_at = now();
  elsif TG_OP = 'UPDATE' and OLD.vote_value <> NEW.vote_value then
    d_net := NEW.vote_value - OLD.vote_value;
    d_up := (case when NEW.vote_value = 1 then 1 else 0 end)
          - (case when OLD.vote_value = 1 then 1 else 0 end);
    d_down := (case when NEW.vote_value = -1 then 1 else 0 end)
            - (case when OLD.vote_value = -1 then 1 else 0 end);
    update public.vote_tallies
      set net_score = net_score + d_net,
          up_count = up_count + d_up,
          down_count = down_count + d_down,
          updated_at = now()
      where subject_table = NEW.subject_table
        and subject_id = NEW.subject_id;
  elsif TG_OP = 'DELETE' then
    d_net := -OLD.vote_value;
    d_up := -(case when OLD.vote_value = 1 then 1 else 0 end);
    d_down := -(case when OLD.vote_value = -1 then 1 else 0 end);
    update public.vote_tallies
      set net_score = net_score + d_net,
          up_count = up_count + d_up,
          down_count = down_count + d_down,
          updated_at = now()
      where subject_table = OLD.subject_table
        and subject_id = OLD.subject_id;
  end if;
  return null;
end;
$$;

create trigger trg_votes_delta
  after insert or update or delete on public.votes
  for each row execute function public._apply_vote_delta();

-- ============================================================================
-- _clear_votes_on_subject_delete — parameterized orphan cleanup
-- ============================================================================
--
-- Votes are polymorphic and have no FK to the subject rows. When a subject
-- is hard-deleted (performers_notes / interpretive_schools / piece_
-- descriptions row goes away), its votes must be removed. The vote DELETE
-- fires trg_votes_delta which reconciles vote_tallies automatically.

create or replace function public._clear_votes_on_subject_delete() returns trigger
  language plpgsql
  security definer
  set search_path = public
as $$
begin
  delete from public.votes
    where subject_table = TG_ARGV[0]
      and subject_id = OLD.id;
  return OLD;
end;
$$;

create trigger trg_clear_votes_performers_notes
  after delete on public.performers_notes
  for each row execute function public._clear_votes_on_subject_delete('performers_notes');

create trigger trg_clear_votes_interpretive_schools
  after delete on public.interpretive_schools
  for each row execute function public._clear_votes_on_subject_delete('interpretive_schools');

create trigger trg_clear_votes_piece_descriptions
  after delete on public.piece_descriptions
  for each row execute function public._clear_votes_on_subject_delete('piece_descriptions');

-- (landmarks orphan trigger lands with Step 6 when the table exists.)

commit;

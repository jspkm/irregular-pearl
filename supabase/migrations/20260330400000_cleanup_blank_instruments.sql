-- Clean up blank instrument entries left by cancelled add operations.
-- Guarded so fresh environments (where the `instruments` table was dropped by
-- the legacy-features cleanup in #17) can still replay the full migration
-- history end-to-end.
do $$
begin
  if to_regclass('public.instruments') is not null then
    delete from public.instruments where type = '' or type is null;
  end if;
end;
$$;

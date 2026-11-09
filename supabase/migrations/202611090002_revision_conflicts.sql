-- Revision mismatches are application conflicts, not transient serialization errors.
-- PostgREST 14 retries 40001 indefinitely. Return HTTP 409 using PT409 instead.
begin;
do $$
declare target regprocedure;
begin
  foreach target in array array[
    'public.portfolio_save_draft(integer,jsonb)'::regprocedure,
    'public.portfolio_publish(integer)'::regprocedure
  ] loop
    execute replace(pg_get_functiondef(target), '''40001''', '''PT409''');
  end loop;
end;
$$;
commit;

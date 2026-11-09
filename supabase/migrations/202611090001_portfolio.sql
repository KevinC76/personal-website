begin;
create table public.portfolio_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  singleton boolean not null default true unique check (singleton)
);
alter table public.portfolio_admins enable row level security;
create policy admin_read_self on public.portfolio_admins for select to authenticated using (user_id = (select auth.uid()));
revoke all on public.portfolio_admins from anon, authenticated;
grant select on public.portfolio_admins to authenticated;
revoke all on public.portfolio_admins from anon;

create function public.is_portfolio_admin() returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.portfolio_admins where user_id = (select auth.uid()))
    and (select auth.jwt()->'app_metadata'->>'provider') = 'google';
$$;
revoke all on function public.is_portfolio_admin() from public;
grant execute on function public.is_portfolio_admin() to anon, authenticated;

create table public.portfolio_snapshots (
  slot text primary key check (slot in ('draft','published')),
  document jsonb not null check (jsonb_typeof(document) = 'object' and document->>'schemaVersion' = '1'),
  revision integer not null default 1 check (revision > 0),
  updated_at timestamptz not null default now()
);
alter table public.portfolio_snapshots enable row level security;
create policy snapshot_read on public.portfolio_snapshots for select to anon, authenticated
  using (slot = 'published' or (select public.is_portfolio_admin()));
revoke all on public.portfolio_snapshots from anon, authenticated;
grant select on public.portfolio_snapshots to anon, authenticated;
revoke insert, update, delete on public.portfolio_snapshots from anon, authenticated;

create table public.portfolio_media (
  id uuid primary key,
  path text not null unique check (path = id::text || '.webp'),
  width integer not null check (width between 1 and 1600),
  height integer not null check (height between 1 and 10000),
  state text not null default 'ready' check (state in ('ready','deleting')),
  created_at timestamptz not null default now()
);
alter table public.portfolio_media enable row level security;
create policy media_admin on public.portfolio_media for select to authenticated using ((select public.is_portfolio_admin()));
revoke all on public.portfolio_media from anon, authenticated;
grant select on public.portfolio_media to authenticated;
revoke all on public.portfolio_media from anon;
revoke insert, update, delete on public.portfolio_media from authenticated;

create function public.portfolio_save_draft(expected_revision integer, content jsonb)
returns integer language plpgsql security definer set search_path = '' as $$
declare next_revision integer;
begin
  if not public.is_portfolio_admin() then raise exception 'Forbidden' using errcode='42501'; end if;
  if pg_column_size(content) > 1000000 or content->>'schemaVersion' is distinct from '1' then raise exception 'Invalid content'; end if;
  -- Lock in the same order as publish/delete to prevent reference races.
  perform 1 from public.portfolio_snapshots order by slot for update;
  if exists (select 1 from jsonb_array_elements(content->'media') a where left(a->>'path',1) <> '/' and not exists (
    select 1 from public.portfolio_media m where m.path=a->>'path' and m.state='ready' and m.width=(a->>'width')::integer and m.height=(a->>'height')::integer
  )) then raise exception 'Media is missing or being deleted'; end if;
  update public.portfolio_snapshots set document=content, revision=revision+1, updated_at=now()
    where slot='draft' and revision=expected_revision returning revision into next_revision;
  if next_revision is null then raise exception 'Draft changed in another tab. Reload before saving.' using errcode='40001'; end if;
  return next_revision;
end;
$$;

create function public.portfolio_publish(expected_revision integer)
returns integer language plpgsql security definer set search_path = '' as $$
declare draft public.portfolio_snapshots; assets jsonb; next_revision integer;
begin
  if not public.is_portfolio_admin() then raise exception 'Forbidden' using errcode='42501'; end if;
  perform 1 from public.portfolio_snapshots order by slot for update;
  select * into draft from public.portfolio_snapshots where slot='draft';
  if draft.revision is distinct from expected_revision then raise exception 'Draft changed. Review the latest version.' using errcode='40001'; end if;
  select coalesce(jsonb_agg(a), '[]'::jsonb) into assets from jsonb_array_elements(draft.document->'media') a
    where a->>'id'=draft.document#>>'{profile,photo}' or exists(select 1 from jsonb_array_elements(draft.document->'projects') p where p->>'image'=a->>'id');
  if exists (select 1 from jsonb_array_elements(assets) a where left(a->>'path',1)<>'/' and (
    not exists(select 1 from public.portfolio_media m where m.path=a->>'path' and m.state='ready') or
    not exists(select 1 from storage.objects o where o.bucket_id='portfolio-public' and o.name=a->>'path')
  )) then raise exception 'Publish media first'; end if;
  update public.portfolio_snapshots set document=jsonb_set(draft.document,'{media}',assets),revision=revision+1,updated_at=now()
    where slot='published' returning revision into next_revision;
  if next_revision is null then raise exception 'Published snapshot has not been seeded'; end if;
  return next_revision;
end;
$$;

create function public.portfolio_register_media(asset_id uuid, asset_width integer, asset_height integer)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_portfolio_admin() then raise exception 'Forbidden' using errcode='42501'; end if;
  if not exists(select 1 from storage.objects where bucket_id='portfolio-drafts' and name=asset_id::text||'.webp') then raise exception 'File missing'; end if;
  insert into public.portfolio_media(id,path,width,height) values(asset_id,asset_id::text||'.webp',asset_width,asset_height);
end;
$$;

create function public.portfolio_mark_media_deleted(asset_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_portfolio_admin() then raise exception 'Forbidden' using errcode='42501'; end if;
  perform 1 from public.portfolio_snapshots order by slot for update;
  if exists(select 1 from public.portfolio_snapshots s, jsonb_array_elements(s.document->'media') a where a->>'path'=asset_id::text||'.webp') then
    raise exception 'Remove this media from both draft and published content before deleting it';
  end if;
  update public.portfolio_media set state='deleting' where id=asset_id;
end;
$$;

create function public.portfolio_can_delete_object(object_name text)
returns boolean language sql stable security definer set search_path = '' as $$
  select public.is_portfolio_admin() and (
    object_name ~ '^uploads/[0-9a-f-]{36}$' or exists(select 1 from public.portfolio_media m where m.path=object_name and m.state='deleting')
  );
$$;
revoke all on function public.portfolio_save_draft(integer,jsonb), public.portfolio_publish(integer), public.portfolio_register_media(uuid,integer,integer), public.portfolio_mark_media_deleted(uuid), public.portfolio_can_delete_object(text) from public;
grant execute on function public.portfolio_save_draft(integer,jsonb), public.portfolio_publish(integer), public.portfolio_register_media(uuid,integer,integer), public.portfolio_mark_media_deleted(uuid), public.portfolio_can_delete_object(text) to authenticated;

insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types) values
 ('portfolio-drafts','portfolio-drafts',false,5242880,array['image/jpeg','image/png','image/webp']),
 ('portfolio-public','portfolio-public',true,5242880,array['image/webp'])
on conflict(id) do nothing;
create policy portfolio_private_read on storage.objects for select to authenticated using (bucket_id in ('portfolio-drafts','portfolio-public') and (select public.is_portfolio_admin()));
create policy portfolio_media_insert on storage.objects for insert to authenticated with check (
 (select public.is_portfolio_admin()) and (
  (bucket_id='portfolio-drafts' and name ~ '^(uploads/[0-9a-f-]{36}|[0-9a-f-]{36}\.webp)$') or
  (bucket_id='portfolio-public' and name ~ '^[0-9a-f-]{36}\.webp$' and exists(select 1 from public.portfolio_media m where m.path=name and m.state='ready'))
 ));
-- Objects are immutable: no UPDATE policy; replacing an image creates a new UUID.
create policy portfolio_media_delete on storage.objects for delete to authenticated using (
 bucket_id in ('portfolio-drafts','portfolio-public') and public.portfolio_can_delete_object(name));
commit;

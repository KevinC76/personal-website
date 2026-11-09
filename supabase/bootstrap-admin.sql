-- Run manually in the SQL editor AFTER signing in with Google once.
-- Never grant access to the first visitor automatically.
insert into public.portfolio_admins (user_id)
select u.id from auth.users u
where lower(u.email) = 'chiputrakevin@gmail.com'
  and u.email_confirmed_at is not null
  and exists(select 1 from auth.identities i where i.user_id=u.id and i.provider='google')
on conflict do nothing;
-- Must return exactly one row before CMS access is available.
select user_id from public.portfolio_admins;

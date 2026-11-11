alter table public.profiles
  add column if not exists role text not null default 'user';

alter table public.profiles
  drop constraint if exists profiles_role_check,
  add constraint profiles_role_check check (role in ('user', 'admin'));

update public.profiles as profile
set role = 'admin'
from auth.users as auth_user
where profile.id = auth_user.id
  and lower(auth_user.email) = 'cargoboards@gmail.com'
  and auth_user.email_confirmed_at is not null
  and not exists (
    select 1
    from public.profiles as another_admin
    where another_admin.role = 'admin'
      and another_admin.id <> profile.id
  );

create or replace function public.set_admin_account_mode(requested_account_type text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if requested_account_type is null or requested_account_type not in ('carrier', 'shipper') then
    raise exception 'Invalid account mode';
  end if;

  if auth.uid() is null or not exists (
    select 1
    from public.profiles as profile
    join auth.users as auth_user on auth_user.id = profile.id
    where profile.id = auth.uid()
      and profile.role = 'admin'
      and lower(auth_user.email) = 'cargoboards@gmail.com'
      and auth_user.email_confirmed_at is not null
  ) then
    raise exception 'Only the verified CargoBoard administrator can change account mode';
  end if;

  if requested_account_type = 'carrier' and not exists (
    select 1
    from public.profiles as profile
    where profile.id = auth.uid()
      and profile.ico ~ '^[0-9]{8}$'
  ) then
    raise exception 'A valid 8-digit IČO is required for carrier mode';
  end if;

  update public.profiles
  set account_type = requested_account_type
  where id = auth.uid();
end;
$$;

revoke all on function public.set_admin_account_mode(text) from public, anon;
grant execute on function public.set_admin_account_mode(text) to authenticated;

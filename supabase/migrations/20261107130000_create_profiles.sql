create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  first_name text not null check (char_length(btrim(first_name)) between 1 and 80),
  last_name text not null check (char_length(btrim(last_name)) between 1 and 80),
  phone text not null check (char_length(btrim(phone)) between 1 and 32),
  account_type text not null check (account_type in ('driver', 'company')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

revoke all on public.profiles from anon;
grant select on public.profiles to authenticated;

create policy "Users can read their own profile"
  on public.profiles
  for select
  to authenticated
  using ((select auth.uid()) = id);

create or replace function public.create_profile_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  profile_first_name text := nullif(btrim(new.raw_user_meta_data ->> 'first_name'), '');
  profile_last_name text := nullif(btrim(new.raw_user_meta_data ->> 'last_name'), '');
  profile_phone text := nullif(btrim(new.raw_user_meta_data ->> 'phone'), '');
  profile_account_type text := new.raw_user_meta_data ->> 'account_type';
begin
  if profile_first_name is null or char_length(profile_first_name) > 80 then
    raise exception 'A valid first name is required to create a profile';
  end if;

  if profile_last_name is null or char_length(profile_last_name) > 80 then
    raise exception 'A valid last name is required to create a profile';
  end if;

  if profile_phone is null or char_length(profile_phone) > 32 then
    raise exception 'A valid phone number is required to create a profile';
  end if;

  if profile_account_type is null or profile_account_type not in ('driver', 'company') then
    raise exception 'A valid account type is required to create a profile';
  end if;

  insert into public.profiles (id, first_name, last_name, phone, account_type)
  values (
    new.id,
    profile_first_name,
    profile_last_name,
    profile_phone,
    profile_account_type
  );

  return new;
end;
$$;

create trigger on_auth_user_created_create_profile
  after insert on auth.users
  for each row
  execute function public.create_profile_for_new_user();

insert into public.profiles (id, first_name, last_name, phone, account_type)
select
  id,
  btrim(raw_user_meta_data ->> 'first_name'),
  btrim(raw_user_meta_data ->> 'last_name'),
  btrim(raw_user_meta_data ->> 'phone'),
  case
    when raw_user_meta_data ->> 'account_type' in ('driver', 'company')
      then raw_user_meta_data ->> 'account_type'
    else 'driver'
  end
from auth.users
where nullif(btrim(raw_user_meta_data ->> 'first_name'), '') is not null
  and char_length(btrim(raw_user_meta_data ->> 'first_name')) <= 80
  and nullif(btrim(raw_user_meta_data ->> 'last_name'), '') is not null
  and char_length(btrim(raw_user_meta_data ->> 'last_name')) <= 80
  and nullif(btrim(raw_user_meta_data ->> 'phone'), '') is not null
  and char_length(btrim(raw_user_meta_data ->> 'phone')) <= 32
on conflict (id) do nothing;

alter table public.profiles
  add column if not exists ico text;

alter table public.profiles
  drop constraint if exists profiles_account_type_check,
  add constraint profiles_account_type_check
    check (account_type in ('driver', 'company', 'carrier', 'shipper')),
  drop constraint if exists profiles_ico_format_check,
  add constraint profiles_ico_format_check
    check (ico is null or ico ~ '^[0-9]{8}$'),
  drop constraint if exists profiles_carrier_ico_check,
  add constraint profiles_carrier_ico_check
    check (account_type <> 'carrier' or ico is not null);

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
  profile_ico text := nullif(btrim(new.raw_user_meta_data ->> 'ico'), '');
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

  if profile_account_type is null
    or profile_account_type not in ('driver', 'company', 'carrier', 'shipper') then
    raise exception 'A valid account type is required to create a profile';
  end if;

  if profile_ico is not null and profile_ico !~ '^[0-9]{8}$' then
    raise exception 'A valid 8-digit IČO is required to create a profile';
  end if;

  if profile_account_type = 'carrier' and profile_ico is null then
    raise exception 'An IČO is required for carrier profiles';
  end if;

  insert into public.profiles (id, first_name, last_name, phone, account_type, ico)
  values (
    new.id,
    profile_first_name,
    profile_last_name,
    profile_phone,
    profile_account_type,
    profile_ico
  );

  return new;
end;
$$;

update public.profiles as profile
set ico = nullif(btrim(auth_user.raw_user_meta_data ->> 'ico'), '')
from auth.users as auth_user
where profile.id = auth_user.id
  and auth_user.raw_user_meta_data ->> 'ico' ~ '^[0-9]{8}$'
  and profile.ico is null;

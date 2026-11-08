alter table public.profiles
  add column if not exists role text not null default 'user'
    check (role in ('user', 'admin'));

update public.profiles as profile
set role = 'admin'
from auth.users as auth_user
where profile.id = auth_user.id
  and lower(auth_user.email) = 'cargoboards@gmail.com'
  and auth_user.email_confirmed_at is not null;

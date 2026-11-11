alter table public.profiles
  add column if not exists is_pro boolean not null default false,
  add column if not exists subscription_status text not null default 'free'
    check (subscription_status in ('free', 'active', 'past_due', 'canceled')),
  add column if not exists stripe_customer_id text unique,
  add column if not exists vehicle_type text,
  add column if not exists vehicle_length_cm integer check (vehicle_length_cm is null or vehicle_length_cm > 0),
  add column if not exists vehicle_width_cm integer check (vehicle_width_cm is null or vehicle_width_cm > 0),
  add column if not exists vehicle_height_cm integer check (vehicle_height_cm is null or vehicle_height_cm > 0),
  add column if not exists payload_kg integer check (payload_kg is null or payload_kg > 0);

alter table public.profiles
  drop constraint if exists profiles_carrier_ico_check,
  add constraint profiles_carrier_ico_check
    check (account_type <> 'carrier' or ico is not null) not valid;

revoke insert, update, delete on public.profiles from anon, authenticated;
grant update (first_name, last_name, phone, ico, vehicle_type, vehicle_length_cm, vehicle_width_cm, vehicle_height_cm, payload_kg)
  on public.profiles to authenticated;

drop policy if exists "Users can update their own editable profile" on public.profiles;
create policy "Users can update their own editable profile"
  on public.profiles for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 1 and 120),
  from_city text not null check (char_length(btrim(from_city)) between 1 and 100),
  to_city text not null check (char_length(btrim(to_city)) between 1 and 100),
  from_lat double precision not null check (from_lat between -90 and 90),
  from_lng double precision not null check (from_lng between -180 and 180),
  to_lat double precision not null check (to_lat between -90 and 90),
  to_lng double precision not null check (to_lng between -180 and 180),
  price_czk integer not null check (price_czk > 0),
  distance_km integer not null check (distance_km > 0),
  vehicle text not null check (vehicle in ('Combi', 'Van', 'Trailer')),
  description text not null default '' check (char_length(description) <= 2000),
  claimed_by uuid references public.profiles(id) on delete set null,
  status text not null default 'open' check (status in ('open', 'completed', 'cancelled')),
  created_at timestamptz not null default now()
);

create index if not exists orders_status_created_at_idx on public.orders(status, created_at desc);
create index if not exists orders_owner_created_at_idx on public.orders(owner_id, created_at desc);

create table if not exists public.order_contacts (
  order_id uuid primary key references public.orders(id) on delete cascade,
  phone text not null check (char_length(btrim(phone)) between 1 and 32),
  email text check (email is null or char_length(email) <= 254)
);

create table if not exists public.order_messages (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(btrim(body)) between 1 and 4000),
  created_at timestamptz not null default now(),
  constraint order_messages_distinct_participants check (sender_id <> recipient_id)
);

create index if not exists order_messages_order_created_idx on public.order_messages(order_id, created_at);
create index if not exists order_messages_recipient_created_idx on public.order_messages(recipient_id, created_at desc);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  order_id uuid references public.orders(id) on delete cascade,
  message_id uuid references public.order_messages(id) on delete cascade,
  kind text not null check (kind in ('new_message', 'new_review')),
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_created_idx on public.notifications(user_id, created_at desc);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  reviewer_id uuid not null references public.profiles(id) on delete cascade,
  reviewee_id uuid not null references public.profiles(id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  body text not null default '' check (char_length(body) <= 1000),
  created_at timestamptz not null default now(),
  constraint reviews_one_per_user_per_order unique (order_id, reviewer_id),
  constraint reviews_distinct_participants check (reviewer_id <> reviewee_id)
);

create index if not exists reviews_reviewee_created_idx on public.reviews(reviewee_id, created_at desc);

create table if not exists public.user_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  reported_user_id uuid references public.profiles(id) on delete cascade,
  order_id uuid references public.orders(id) on delete cascade,
  reason text not null check (char_length(btrim(reason)) between 5 and 2000),
  created_at timestamptz not null default now(),
  constraint user_reports_target_required check (reported_user_id is not null or order_id is not null)
);

create table if not exists public.stripe_webhook_events (
  event_id text primary key,
  received_at timestamptz not null default now()
);

alter table public.stripe_webhook_events enable row level security;
revoke all on public.stripe_webhook_events from public, anon, authenticated;
grant select, insert, delete on public.stripe_webhook_events to service_role;

alter table public.orders enable row level security;
alter table public.order_contacts enable row level security;
alter table public.order_messages enable row level security;
alter table public.notifications enable row level security;
alter table public.reviews enable row level security;
alter table public.user_reports enable row level security;

revoke all on public.orders, public.order_contacts, public.order_messages, public.notifications, public.reviews, public.user_reports from public, anon, authenticated;
grant select, insert on public.orders to authenticated;
grant select, insert on public.order_contacts to authenticated;
grant select, insert on public.order_messages to authenticated;
grant select on public.notifications to authenticated;
grant update (read_at) on public.notifications to authenticated;
grant select, insert on public.reviews to authenticated;
grant insert on public.user_reports to authenticated;

drop policy if exists "Authenticated users can view open orders" on public.orders;
create policy "Authenticated users can view open orders"
  on public.orders for select to authenticated
  using (status = 'open' or owner_id = (select auth.uid()) or claimed_by = (select auth.uid()));

drop policy if exists "Shippers can create orders" on public.orders;
create policy "Shippers can create orders"
  on public.orders for insert to authenticated
  with check (
    owner_id = (select auth.uid())
    and exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.account_type = 'shipper')
  );

drop policy if exists "Owners can update their orders" on public.orders;
create policy "Owners can update their orders"
  on public.orders for update to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

drop policy if exists "Owners can delete their orders" on public.orders;
create policy "Owners can delete their orders"
  on public.orders for delete to authenticated
  using (owner_id = (select auth.uid()));

drop policy if exists "Order owners can manage contacts" on public.order_contacts;
create policy "Order owners can manage contacts"
  on public.order_contacts for all to authenticated
  using (exists (select 1 from public.orders o where o.id = order_id and o.owner_id = (select auth.uid())))
  with check (exists (select 1 from public.orders o where o.id = order_id and o.owner_id = (select auth.uid())));

drop policy if exists "Message participants can read messages" on public.order_messages;
create policy "Message participants can read messages"
  on public.order_messages for select to authenticated
  using ((select auth.uid()) in (sender_id, recipient_id));

drop policy if exists "Order participants can send messages" on public.order_messages;
create policy "Order participants can send messages"
  on public.order_messages for insert to authenticated
  with check (
    sender_id = (select auth.uid())
    and exists (
      select 1
      from public.orders o
      join public.profiles sender on sender.id = (select auth.uid())
      where o.id = order_id
        and (
          (sender.account_type = 'shipper' and sender.id = o.owner_id and recipient_id = o.claimed_by)
          or (sender.account_type = 'carrier' and sender.id = o.claimed_by and recipient_id = o.owner_id)
        )
    )
  );

drop policy if exists "Users can read own notifications" on public.notifications;
create policy "Users can read own notifications"
  on public.notifications for select to authenticated using (user_id = (select auth.uid()));
drop policy if exists "Users can mark own notifications read" on public.notifications;
create policy "Users can mark own notifications read"
  on public.notifications for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

drop policy if exists "Users can read reviews" on public.reviews;
create policy "Users can read reviews"
  on public.reviews for select to authenticated using (true);
drop policy if exists "Participants can review completed orders" on public.reviews;
create policy "Participants can review completed orders"
  on public.reviews for insert to authenticated
  with check (
    reviewer_id = (select auth.uid())
    and exists (
      select 1 from public.orders o
      where o.id = order_id and o.status = 'completed'
        and (
          (reviewer_id = o.owner_id and reviewee_id = o.claimed_by)
          or (reviewer_id = o.claimed_by and reviewee_id = o.owner_id)
        )
    )
  );

drop policy if exists "Users can submit reports" on public.user_reports;
create policy "Users can submit reports"
  on public.user_reports for insert to authenticated
  with check (reporter_id = (select auth.uid()) and (reported_user_id is null or reported_user_id <> (select auth.uid())));

create or replace function public.get_order_contact(requested_order_id uuid)
returns table (phone text, email text)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  return query
  select contact.phone, contact.email
  from public.order_contacts contact
  join public.orders o on o.id = contact.order_id
  where o.id = requested_order_id
    and (
      o.owner_id = auth.uid()
      or exists (
        select 1 from public.profiles p
        where p.id = auth.uid()
          and p.account_type = 'carrier'
          and p.is_pro = true
          and p.subscription_status = 'active'
      )
    );
end;
$$;

revoke all on function public.get_order_contact(uuid) from public, anon;
grant execute on function public.get_order_contact(uuid) to authenticated;

create or replace function public.create_order_with_contact(
  order_title text,
  origin_city text,
  destination_city text,
  origin_lat double precision,
  origin_lng double precision,
  destination_lat double precision,
  destination_lng double precision,
  offered_price_czk integer,
  route_distance_km integer,
  required_vehicle text,
  order_description text,
  contact_phone text,
  contact_email text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_order_id uuid;
begin
  if auth.uid() is null or not exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.account_type = 'shipper'
  ) then
    raise exception 'Only authenticated shippers can publish orders';
  end if;

  insert into public.orders (
    owner_id, title, from_city, to_city, from_lat, from_lng, to_lat, to_lng,
    price_czk, distance_km, vehicle, description
  ) values (
    auth.uid(), order_title, origin_city, destination_city, origin_lat, origin_lng,
    destination_lat, destination_lng, offered_price_czk, route_distance_km,
    required_vehicle, coalesce(order_description, '')
  ) returning id into new_order_id;

  insert into public.order_contacts(order_id, phone, email)
  values (new_order_id, contact_phone, nullif(contact_email, ''));

  return new_order_id;
end;
$$;

revoke all on function public.create_order_with_contact(text, text, text, double precision, double precision, double precision, double precision, integer, integer, text, text, text, text) from public, anon;
grant execute on function public.create_order_with_contact(text, text, text, double precision, double precision, double precision, double precision, integer, integer, text, text, text, text) to authenticated;

create or replace function public.claim_order(requested_order_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null or not exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.account_type = 'carrier'
  ) then
    raise exception 'Only authenticated carriers can claim orders';
  end if;

  update public.orders
  set claimed_by = auth.uid()
  where id = requested_order_id and status = 'open' and claimed_by is null;

  if not found then
    raise exception 'Order is no longer available';
  end if;
end;
$$;

revoke all on function public.claim_order(uuid) from public, anon;
grant execute on function public.claim_order(uuid) to authenticated;

create or replace function public.complete_order(requested_order_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.orders
  set status = 'completed'
  where id = requested_order_id
    and owner_id = auth.uid()
    and claimed_by is not null
    and status = 'open';
  if not found then
    raise exception 'Only the order owner can complete an assigned open order';
  end if;
end;
$$;

revoke all on function public.complete_order(uuid) from public, anon;
grant execute on function public.complete_order(uuid) to authenticated;

create or replace function public.cancel_order(requested_order_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.orders
  set status = 'cancelled'
  where id = requested_order_id
    and owner_id = auth.uid()
    and claimed_by is null
    and status = 'open';
  if not found then
    raise exception 'Only an unassigned open order can be canceled by its owner';
  end if;
end;
$$;

revoke all on function public.cancel_order(uuid) from public, anon;
grant execute on function public.cancel_order(uuid) to authenticated;

create or replace function public.notify_order_message()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.notifications (user_id, order_id, message_id, kind)
  values (new.recipient_id, new.order_id, new.id, 'new_message');
  return new;
end;
$$;

drop trigger if exists on_order_message_notify on public.order_messages;
create trigger on_order_message_notify
  after insert on public.order_messages
  for each row execute function public.notify_order_message();

create or replace function public.notify_new_review()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.notifications (user_id, order_id, kind)
  values (new.reviewee_id, new.order_id, 'new_review');
  return new;
end;
$$;

drop trigger if exists on_review_notify on public.reviews;
create trigger on_review_notify
  after insert on public.reviews
  for each row execute function public.notify_new_review();

do $migration$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'profiles') then
    alter publication supabase_realtime add table public.profiles;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'orders') then
    alter publication supabase_realtime add table public.orders;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'order_messages') then
    alter publication supabase_realtime add table public.order_messages;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'notifications') then
    alter publication supabase_realtime add table public.notifications;
  end if;
end
$migration$;

-- The app requires a Supabase-authenticated session created through phone OTP.
create table if not exists public.freight_orders (
  id text primary key,
  title text not null,
  from_city text not null,
  to_city text not null,
  from_coords jsonb not null,
  to_coords jsonb not null,
  price numeric not null check (price > 0),
  distance numeric not null check (distance > 0),
  vehicle text not null check (vehicle in ('Combi', 'Van', 'Trailer')),
  user_name text not null,
  rating numeric not null default 5,
  reviews integer not null default 0,
  phone text not null,
  description text not null,
  created_at bigint not null
);

alter table public.freight_orders enable row level security;

revoke all on public.freight_orders from anon;
grant select, insert, update on public.freight_orders to authenticated;

drop policy if exists "Prototype orders are publicly readable" on public.freight_orders;
drop policy if exists "Authenticated users can read orders" on public.freight_orders;
create policy "Authenticated users can read orders"
  on public.freight_orders for select
  to authenticated
  using (auth.uid() is not null);

drop policy if exists "Prototype orders are publicly insertable" on public.freight_orders;
drop policy if exists "Authenticated users can create orders" on public.freight_orders;
create policy "Authenticated users can create orders"
  on public.freight_orders for insert
  to authenticated
  with check (auth.uid() is not null);

drop policy if exists "Prototype orders are publicly updateable" on public.freight_orders;
drop policy if exists "Authenticated users can update orders" on public.freight_orders;
create policy "Authenticated users can update orders"
  on public.freight_orders for update
  to authenticated
  using (auth.uid() is not null)
  with check (auth.uid() is not null);

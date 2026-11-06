-- Prototype only: this allows any visitor to read, create, and update orders.
-- Do not use these public policies with real customer data or phone numbers.
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

grant select, insert, update on public.freight_orders to anon, authenticated;

drop policy if exists "Prototype orders are publicly readable" on public.freight_orders;
create policy "Prototype orders are publicly readable"
  on public.freight_orders for select
  to anon, authenticated
  using (true);

drop policy if exists "Prototype orders are publicly insertable" on public.freight_orders;
create policy "Prototype orders are publicly insertable"
  on public.freight_orders for insert
  to anon, authenticated
  with check (true);

drop policy if exists "Prototype orders are publicly updateable" on public.freight_orders;
create policy "Prototype orders are publicly updateable"
  on public.freight_orders for update
  to anon, authenticated
  using (true)
  with check (true);

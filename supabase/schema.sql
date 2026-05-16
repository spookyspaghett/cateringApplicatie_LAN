-- ============================================================
-- LAN Party Catering — Supabase Schema
-- Run this in the Supabase SQL editor to set up your database.
-- ============================================================

-- ─── Tables ──────────────────────────────────────────────────

create table if not exists attendees (
  id                   uuid primary key default gen_random_uuid(),
  name                 text not null,
  email                text unique not null,
  dietary_restrictions text[] not null default '{}',
  payment_status       text not null default 'unpaid'
                         check (payment_status in ('unpaid', 'paid', 'comped')),
  created_at           timestamptz not null default now()
);

create table if not exists menu_items (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  description  text,
  price        numeric(8,2) not null check (price >= 0),
  category     text not null,
  dietary_tags text[] not null default '{}',
  available    boolean not null default true
);

create table if not exists orders (
  id          uuid primary key default gen_random_uuid(),
  attendee_id uuid not null references attendees(id) on delete cascade,
  notes       text,
  created_at  timestamptz not null default now()
);

create table if not exists order_items (
  id           uuid primary key default gen_random_uuid(),
  order_id     uuid not null references orders(id) on delete cascade,
  menu_item_id uuid not null references menu_items(id),
  quantity     int not null default 1 check (quantity > 0)
);

-- ─── Shopping list view ───────────────────────────────────────

create or replace view shopping_list as
  select
    mi.name,
    mi.category,
    sum(oi.quantity)::int as total_quantity
  from order_items oi
  join menu_items mi on oi.menu_item_id = mi.id
  group by mi.id, mi.name, mi.category
  order by mi.category, mi.name;

-- ─── Row Level Security ───────────────────────────────────────

alter table attendees  enable row level security;
alter table menu_items enable row level security;
alter table orders     enable row level security;
alter table order_items enable row level security;

-- menu_items: public read
create policy "public read menu"
  on menu_items for select
  using (true);

-- menu_items: admin write
create policy "admin write menu"
  on menu_items for all
  using (auth.role() = 'authenticated');

-- attendees: public insert (registration)
create policy "public register"
  on attendees for insert
  with check (true);

-- attendees: admin read/update
create policy "admin read attendees"
  on attendees for select
  using (auth.role() = 'authenticated');

create policy "admin update attendees"
  on attendees for update
  using (auth.role() = 'authenticated');

-- orders: public insert
create policy "public create order"
  on orders for insert
  with check (true);

-- orders: public read own order (by attendee_id in query — no auth context)
create policy "public read orders"
  on orders for select
  using (true);

-- order_items: public insert
create policy "public insert order items"
  on order_items for insert
  with check (true);

-- order_items: public read
create policy "public read order items"
  on order_items for select
  using (true);

-- ─── Seed: sample menu items ─────────────────────────────────

insert into menu_items (name, description, price, category, dietary_tags, available) values
  ('Margherita Pizza',   'Classic tomato and mozzarella',          12.00, 'food',  '{"vegetarian"}',              true),
  ('BBQ Chicken Pizza',  'Smoky BBQ sauce, chicken, red onion',    14.00, 'food',  '{}',                          true),
  ('Vegan Wrap',         'Falafel, hummus, salad in a tortilla',   11.00, 'food',  '{"vegan","gluten-free"}',     true),
  ('Chicken Wings (6)',  'Crispy wings with choice of sauce',       9.00, 'food',  '{"gluten-free"}',             true),
  ('Loaded Nachos',      'Cheese, jalapeños, sour cream, salsa',    8.00, 'snack', '{"vegetarian","gluten-free"}',true),
  ('Mixed Nuts',         'Salted cashews, almonds, peanuts',        4.00, 'snack', '{"vegan","gluten-free"}',     true),
  ('Energy Drink',       '500ml, assorted flavours',                3.50, 'drink', '{}',                          true),
  ('Water Bottle',       '750ml still water',                       2.00, 'drink', '{"vegan","gluten-free"}',     true),
  ('Craft Beer',         'Local pale ale 330ml',                    5.00, 'drink', '{"vegan","gluten-free"}',     true),
  ('Soft Drink',         'Cola, lemonade, or orange',               2.50, 'drink', '{"vegan","gluten-free"}',     true);

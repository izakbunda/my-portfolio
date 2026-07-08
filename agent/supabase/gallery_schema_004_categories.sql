-- Adds album grouping. Categories are lightweight organizational labels (not
-- content), so unlike albums/photos they're hard-deleted rather than soft
-- deleted; deleting a category just unassigns its albums (ON DELETE SET NULL)
-- rather than affecting the albums themselves.
create table categories (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  display_order int not null default 0,
  created_at    timestamptz not null default now()
);

alter table albums add column if not exists category_id uuid references categories(id) on delete set null;

alter table categories enable row level security;

-- Category names aren't sensitive on their own (only shown publicly once an
-- album under them is published), so allow public read unconditionally.
create policy "public read categories"
  on categories for select
  using (true);

create policy "authenticated full access categories"
  on categories for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

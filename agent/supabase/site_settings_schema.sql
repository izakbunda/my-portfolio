-- Site settings: small key/value store for site-wide config editable from
-- the dashboard (e.g. the Izak AI glow colors). Run this once in the
-- Supabase SQL Editor for the same project used by the other schemas.

create table site_settings (
  key        text primary key,
  value      jsonb not null,
  updated_at timestamptz not null default now()
);

-- Row Level Security: anyone can read settings (the public site needs
-- them); only the authenticated dashboard owner can write.
alter table site_settings enable row level security;

create policy "public read site_settings"
  on site_settings for select
  using (true);

create policy "authenticated full access site_settings"
  on site_settings for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

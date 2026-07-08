-- Photography gallery: albums, photos, storage bucket, RLS policies
-- Run this once in the Supabase SQL Editor for the same project already
-- used by the RAG chatbot (agent/supabase/schema.sql).

create extension if not exists pgcrypto;

-- Albums
create table albums (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,
  cover_photo_id uuid,
  display_order  int not null default 0,
  published      boolean not null default false,
  created_at     timestamptz not null default now()
);

-- Photos
create table photos (
  id            uuid primary key default gen_random_uuid(),
  album_id      uuid not null references albums(id),
  storage_path  text not null,
  thumb_path    text,
  caption       text,
  width         int,
  height        int,
  display_order int not null default 0,
  published     boolean not null default false,
  created_at    timestamptz not null default now()
);

alter table albums
  add constraint albums_cover_photo_id_fkey
  foreign key (cover_photo_id) references photos(id) on delete set null;

create index on photos (album_id, display_order);
create index on albums (display_order);

-- Row Level Security: visitors can only read published rows;
-- the single authenticated user (you) has full read/write access.
alter table albums enable row level security;
alter table photos enable row level security;

create policy "public read published albums"
  on albums for select
  using (published = true);

create policy "authenticated full access albums"
  on albums for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "public read published photos in published albums"
  on photos for select
  using (
    published = true
    and exists (
      select 1 from albums a
      where a.id = photos.album_id and a.published = true
    )
  );

create policy "authenticated full access photos"
  on photos for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- Storage bucket: public read, writes restricted to the authenticated user
insert into storage.buckets (id, name, public)
values ('photos', 'photos', true)
on conflict (id) do nothing;

create policy "public read photos bucket"
  on storage.objects for select
  using (bucket_id = 'photos');

create policy "authenticated insert photos bucket"
  on storage.objects for insert
  with check (bucket_id = 'photos' and auth.role() = 'authenticated');

create policy "authenticated update photos bucket"
  on storage.objects for update
  using (bucket_id = 'photos' and auth.role() = 'authenticated');

create policy "authenticated delete photos bucket"
  on storage.objects for delete
  using (bucket_id = 'photos' and auth.role() = 'authenticated');

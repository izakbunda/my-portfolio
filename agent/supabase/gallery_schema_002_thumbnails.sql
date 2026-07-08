-- Adds a separate thumbnail image path per photo, since Supabase's on-the-fly
-- image transform API requires a paid plan add-on. Thumbnails are instead
-- generated client-side at upload time and stored as their own object.
alter table photos add column if not exists thumb_path text;

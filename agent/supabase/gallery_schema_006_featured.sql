-- Lets specific albums be marked as "featured" — a cross-cutting curated
-- set independent of category, selectable in the dashboard and filterable
-- on the public gallery.
alter table albums add column if not exists featured boolean not null default false;

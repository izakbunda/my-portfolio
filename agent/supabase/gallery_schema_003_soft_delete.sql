-- Separates "deleted" from "published". Previously Delete just set
-- published=false, which is indistinguishable from a fresh draft awaiting
-- review, so deleted photos/albums never actually disappeared from the
-- dashboard. `deleted` now controls dashboard visibility; `published` still
-- controls public visibility.
alter table photos add column if not exists deleted boolean not null default false;
alter table albums add column if not exists deleted boolean not null default false;

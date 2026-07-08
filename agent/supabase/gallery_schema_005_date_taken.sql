-- Month/year the photos in an album were taken, shown as a subheading in the
-- public gallery. Stored as a date (always day 01) so it sorts naturally;
-- only month + year are ever surfaced in the UI.
alter table albums add column if not exists date_taken date;

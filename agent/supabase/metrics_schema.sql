-- Site metrics: anonymous visitor sessions, generic events (window opens,
-- link clicks, resume clicks), and chatbot question/response logging.
-- Run this once in the Supabase SQL Editor for the same project already
-- used by the RAG chatbot (agent/supabase/schema.sql) and gallery
-- (agent/supabase/gallery_schema.sql).

create extension if not exists pgcrypto;

-- Sessions: one row per browser session (anonymous, session-scoped id
-- generated client-side, not tied to any persistent visitor identity).
create table sessions (
  id               uuid primary key,
  created_at       timestamptz not null default now(),
  ended_at         timestamptz,
  duration_seconds int,
  country          text,
  region           text,
  referrer         text,
  device_type      text,
  entry_path       text
);

create index on sessions (created_at);

-- Events: generic stream for window opens (page-view analog in this
-- desktop-metaphor SPA), outbound link clicks, and resume downloads.
create table events (
  id         bigint generated always as identity primary key,
  session_id uuid references sessions(id) on delete set null,
  created_at timestamptz not null default now(),
  event_type text not null,
  label      text
);

create index on events (created_at);
create index on events (event_type);

-- Chat messages: every chatbot question + response, for review and for
-- deriving per-session engagement (messages per session, error rate).
create table chat_messages (
  id         bigint generated always as identity primary key,
  session_id uuid references sessions(id) on delete set null,
  created_at timestamptz not null default now(),
  question   text not null,
  response   text,
  is_error   boolean not null default false
);

create index on chat_messages (created_at);
create index on chat_messages (session_id);

-- Row Level Security: anonymous visitors can only write their own
-- tracking data, never read it back. Only the authenticated dashboard
-- owner can read metrics.
alter table sessions enable row level security;
alter table events enable row level security;
alter table chat_messages enable row level security;

create policy "anon insert sessions"
  on sessions for insert
  with check (true);

create policy "anon update sessions"
  on sessions for update
  using (true)
  with check (true);

create policy "authenticated read sessions"
  on sessions for select
  using (auth.role() = 'authenticated');

create policy "anon insert events"
  on events for insert
  with check (true);

create policy "authenticated read events"
  on events for select
  using (auth.role() = 'authenticated');

create policy "anon insert chat_messages"
  on chat_messages for insert
  with check (true);

create policy "authenticated read chat_messages"
  on chat_messages for select
  using (auth.role() = 'authenticated');

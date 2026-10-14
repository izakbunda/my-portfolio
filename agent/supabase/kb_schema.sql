-- Knowledge base managed from the dashboard (Knowledge tab).
--
-- kb_entries is the source of truth for Izak AI's knowledge: Q&A pairs and
-- freeform docs. kb_files tracks uploaded .md/.txt/.pdf files (originals in
-- the private kb-files bucket). documents keeps the embedded chunks; each
-- chunk belongs to exactly one entry or file and is deleted with it.
--
-- Reads and writes go through the agent backend (service key), which checks
-- the dashboard user's Supabase session. Run once in the Supabase SQL Editor.

create table kb_entries (
  id          uuid primary key default gen_random_uuid(),
  kind        text not null check (kind in ('qa', 'doc')),
  title       text not null,              -- the question, or the doc title
  body        text not null default '',   -- the answer, or the doc markdown
  category    text,
  sort        int not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  embedded_at timestamptz
);

create table kb_files (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  storage_path text not null,
  mime         text not null,
  size         int not null,
  chunk_count  int not null default 0,
  created_at   timestamptz not null default now()
);

alter table documents
  add column entry_id uuid references kb_entries(id) on delete cascade,
  add column file_id  uuid references kb_files(id)   on delete cascade;

create index documents_entry_id_idx on documents (entry_id);
create index documents_file_id_idx  on documents (file_id);

-- match_documents now also returns which entry/file a chunk came from (used to
-- flag overlaps when cleaning up a braindump). Return type changed, so drop first.
drop function if exists match_documents(vector, int, text);

create function match_documents (
  query_embedding vector(1536),
  match_count int default 4,
  source_filter text default null
)
returns table (
  id bigint,
  content text,
  source text,
  entry_id uuid,
  file_id uuid,
  similarity float
)
language sql stable as $$
  select
    d.id,
    d.content,
    d.source,
    d.entry_id,
    d.file_id,
    1 - (d.embedding <=> query_embedding) as similarity
  from documents d
  where source_filter is null or d.source = source_filter
  order by d.embedding <=> query_embedding
  limit match_count;
$$;

-- Backend-only: RLS on with no public policies. The dashboard owner may read
-- directly; all writes go through the backend so embeddings stay in sync.
alter table kb_entries enable row level security;
alter table kb_files   enable row level security;

create policy "authenticated read kb_entries"
  on kb_entries for select
  using (auth.role() = 'authenticated');

create policy "authenticated read kb_files"
  on kb_files for select
  using (auth.role() = 'authenticated');

-- Private bucket for uploaded originals.
insert into storage.buckets (id, name, public)
values ('kb-files', 'kb-files', false)
on conflict (id) do nothing;

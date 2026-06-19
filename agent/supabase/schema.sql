-- Enable pgvector
create extension if not exists vector;

-- Source chunks
create table documents (
  id         bigserial primary key,
  content    text not null,
  embedding  vector(1536) not null,
  source     text not null,
  metadata   jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

-- Approximate nearest-neighbor index
create index on documents using ivfflat (embedding vector_cosine_ops) with (lists = 100);

-- Similarity search RPC called by retriever.py
create or replace function match_documents (
  query_embedding vector(1536),
  match_count int default 4,
  source_filter text default null
)
returns table (
  id bigint,
  content text,
  source text,
  similarity float
)
language sql stable as $$
  select
    d.id,
    d.content,
    d.source,
    1 - (d.embedding <=> query_embedding) as similarity
  from documents d
  where source_filter is null or d.source = source_filter
  order by d.embedding <=> query_embedding
  limit match_count;
$$;

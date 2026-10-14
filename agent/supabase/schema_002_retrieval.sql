-- Retrieval fix: drop the ivfflat index on documents.embedding.
--
-- ivfflat with lists = 100 is built for tens of thousands of rows. On a
-- knowledge base of ~100 chunks most lists are empty and the default
-- probes = 1 skips the best matches. An exact scan over a few thousand rows
-- takes milliseconds, so no vector index is needed at this size. If the KB ever
-- grows past ~10k chunks, add an HNSW index instead:
--   create index on documents using hnsw (embedding vector_cosine_ops);
--
-- Run once in the Supabase SQL Editor.

do $$
declare idx text;
begin
  for idx in
    select indexname from pg_indexes
    where tablename = 'documents' and indexdef ilike '%ivfflat%'
  loop
    execute format('drop index if exists %I', idx);
  end loop;
end $$;

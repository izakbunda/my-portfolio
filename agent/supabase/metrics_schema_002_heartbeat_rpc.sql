-- Session heartbeats via RPC.
--
-- The original "anon update sessions" policy never worked: under RLS an
-- UPDATE's WHERE clause can only see rows that also pass a SELECT policy,
-- and sessions are only selectable by the authenticated dashboard owner.
-- So every anonymous heartbeat PATCH matched 0 rows and silently succeeded,
-- leaving ended_at / duration_seconds null on every session.
--
-- Instead of exposing sessions to anon reads, heartbeats go through a
-- security definer function that can only touch the one row whose id the
-- browser already holds. Duration is computed server-side from created_at,
-- and only ever grows.

create or replace function record_session_heartbeat(p_session_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update sessions
     set ended_at = now(),
         duration_seconds = greatest(
           coalesce(duration_seconds, 0),
           extract(epoch from (now() - created_at))::int
         )
   where id = p_session_id;
$$;

revoke all on function record_session_heartbeat(uuid) from public;
grant execute on function record_session_heartbeat(uuid) to anon, authenticated;

-- The direct-update policy is now unused (and was ineffective anyway).
drop policy if exists "anon update sessions" on sessions;

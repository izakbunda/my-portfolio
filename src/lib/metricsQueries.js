import { supabase } from "./supabase";

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

async function countRows(table, extraFilters) {
  let query = supabase.from(table).select("*", { count: "exact", head: true });
  if (extraFilters) query = extraFilters(query);
  const { count, error } = await query;
  if (error) throw error;
  return count ?? 0;
}

function countSince(table, since, extraFilters) {
  return countRows(table, (q) => {
    q = q.gte("created_at", since);
    return extraFilters ? extraFilters(q) : q;
  });
}

export async function fetchOverviewStats() {
  const [sessionsToday, sessionsWeek, sessionsMonth, resumeClicks, chatQuestions, durations] =
    await Promise.all([
      countSince("sessions", startOfToday()),
      countSince("sessions", daysAgo(7)),
      countSince("sessions", daysAgo(30)),
      countRows("events", (q) => q.eq("event_type", "resume_click")),
      countRows("chat_messages"),
      supabase.from("sessions").select("duration_seconds").not("duration_seconds", "is", null),
    ]);

  if (durations.error) throw durations.error;
  const durationValues = durations.data.map((row) => row.duration_seconds);
  const avgDurationSeconds = durationValues.length
    ? Math.round(durationValues.reduce((a, b) => a + b, 0) / durationValues.length)
    : 0;

  return {
    sessionsToday,
    sessionsWeek,
    sessionsMonth,
    resumeClicks,
    chatQuestions,
    avgDurationSeconds,
  };
}

const RECENT_SESSIONS_LIMIT = 50;

export async function fetchRecentSessions() {
  const { data: sessions, error } = await supabase
    .from("sessions")
    .select("id, created_at, duration_seconds, country, region, device_type, referrer, entry_path")
    .order("created_at", { ascending: false })
    .limit(RECENT_SESSIONS_LIMIT);
  if (error) throw error;
  if (!sessions.length) return [];

  const ids = sessions.map((s) => s.id);
  const [{ data: events, error: eventsError }, { data: chats, error: chatsError }] =
    await Promise.all([
      supabase.from("events").select("session_id, event_type").in("session_id", ids),
      supabase.from("chat_messages").select("session_id").in("session_id", ids),
    ]);
  if (eventsError) throw eventsError;
  if (chatsError) throw chatsError;

  const viewCounts = {};
  const resumeCounts = {};
  for (const e of events) {
    const bucket = e.event_type === "resume_click" ? resumeCounts : viewCounts;
    bucket[e.session_id] = (bucket[e.session_id] ?? 0) + 1;
  }
  const chatCounts = {};
  for (const c of chats) {
    chatCounts[c.session_id] = (chatCounts[c.session_id] ?? 0) + 1;
  }

  return sessions.map((s) => ({
    ...s,
    viewCount: viewCounts[s.id] ?? 0,
    resumeClicked: (resumeCounts[s.id] ?? 0) > 0,
    chatCount: chatCounts[s.id] ?? 0,
  }));
}

const CHAT_MESSAGES_LIMIT = 500;

export async function fetchChatSessions() {
  const { data, error } = await supabase
    .from("chat_messages")
    .select("id, session_id, created_at, question, response, is_error")
    .order("created_at", { ascending: false })
    .limit(CHAT_MESSAGES_LIMIT);
  if (error) throw error;

  const bySession = new Map();
  for (const msg of data) {
    if (!bySession.has(msg.session_id)) {
      bySession.set(msg.session_id, {
        sessionId: msg.session_id,
        lastActivity: msg.created_at,
        messages: [],
        errorCount: 0,
      });
    }
    const session = bySession.get(msg.session_id);
    session.messages.push(msg);
    if (msg.is_error) session.errorCount += 1;
  }

  return Array.from(bySession.values())
    .map((session) => ({
      ...session,
      messages: session.messages.reverse(),
      messageCount: session.messages.length,
    }))
    .sort((a, b) => new Date(b.lastActivity) - new Date(a.lastActivity));
}

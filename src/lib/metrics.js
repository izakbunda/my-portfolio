import { supabase } from "./supabase";

const SESSION_ID_KEY = "metrics-session-id";
const HEARTBEAT_INTERVAL_MS = 20_000;

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

let sessionStartedAt = null;

function getSessionId() {
  let id = sessionStorage.getItem(SESSION_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem(SESSION_ID_KEY, id);
  }
  return id;
}

function getGeoFromCookie() {
  const match = document.cookie.match(/(?:^|; )geo=([^;]*)/);
  if (!match) return { country: null, region: null };
  const [country, region] = decodeURIComponent(match[1]).split("-");
  return { country: country || null, region: region || null };
}

function getDeviceType() {
  return window.innerWidth <= 500 || /Mobi|Android/i.test(navigator.userAgent)
    ? "mobile"
    : "desktop";
}

// Sends a PATCH straight to the Supabase REST endpoint (bypassing the JS
// client) so we can pass `keepalive: true`, which is what lets this survive
// page unload — the supabase-js client doesn't expose that fetch option.
function patchSessionKeepalive(id, body) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return;
  fetch(`${SUPABASE_URL}/rest/v1/sessions?id=eq.${id}`, {
    method: "PATCH",
    keepalive: true,
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      Prefer: "return=minimum",
    },
    body: JSON.stringify(body),
  }).catch(() => {});
}

function currentDurationSeconds() {
  if (!sessionStartedAt) return 0;
  return Math.round((Date.now() - sessionStartedAt) / 1000);
}

function sendHeartbeat() {
  const id = getSessionId();
  patchSessionKeepalive(id, {
    ended_at: new Date().toISOString(),
    duration_seconds: currentDurationSeconds(),
  });
}

export async function startSession() {
  if (sessionStartedAt) return;
  sessionStartedAt = Date.now();
  const id = getSessionId();
  const { country, region } = getGeoFromCookie();

  const { error } = await supabase.from("sessions").insert({
    id,
    country,
    region,
    referrer: document.referrer || null,
    device_type: getDeviceType(),
    entry_path: window.location.pathname,
  });
  // Session row may already exist (e.g. re-mount in dev/StrictMode) — that's fine.
  if (error && error.code !== "23505") {
    console.error("metrics: failed to start session", error);
  }

  setInterval(sendHeartbeat, HEARTBEAT_INTERVAL_MS);
  const onHide = () => {
    if (document.visibilityState === "hidden") sendHeartbeat();
  };
  document.addEventListener("visibilitychange", onHide);
  window.addEventListener("pagehide", sendHeartbeat);
}

export async function trackEvent(eventType, label) {
  const { error } = await supabase.from("events").insert({
    session_id: getSessionId(),
    event_type: eventType,
    label,
  });
  if (error) console.error("metrics: failed to track event", error);
}

export async function logChatMessage(question, response, isError = false) {
  const { error } = await supabase.from("chat_messages").insert({
    session_id: getSessionId(),
    question,
    response: response || null,
    is_error: isError,
  });
  if (error) console.error("metrics: failed to log chat message", error);
}

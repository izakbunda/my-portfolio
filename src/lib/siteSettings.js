import { supabase } from "./supabase";

export const AI_GLOW_PRESETS = {
  cool: ["#8D9FFF", "#BC82F3", "#5AC8FA", "#C686FF", "#7B9CFF"],
  apple: ["#BC82F3", "#F5B9EA", "#8D9FFF", "#AA6EEE", "#FF6778", "#FFBA71", "#C686FF"],
  warm: ["#FF6778", "#FFBA71", "#F5B9EA", "#FF8FAB", "#FFD27A"],
};

export const AI_GLOW_MIN_COLORS = 2;
export const AI_GLOW_MAX_COLORS = 7;

export const DEFAULT_AI_GLOW = { preset: "cool", colors: AI_GLOW_PRESETS.cool };

const HEX = /^#[0-9a-f]{6}$/i;

export function sanitizeGlowColors(colors) {
  const valid = Array.isArray(colors) ? colors.filter((c) => HEX.test(c)).slice(0, AI_GLOW_MAX_COLORS) : [];
  return valid.length >= AI_GLOW_MIN_COLORS ? valid : DEFAULT_AI_GLOW.colors;
}

// Conic gradients need the first color repeated at the end to loop seamlessly.
export function glowGradientStops(colors) {
  const valid = sanitizeGlowColors(colors);
  return [...valid, valid[0]].join(", ");
}

export async function fetchAiGlow() {
  const { data, error } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", "ai_glow")
    .maybeSingle();
  if (error || !data?.value) return DEFAULT_AI_GLOW;
  return { preset: data.value.preset ?? "custom", colors: sanitizeGlowColors(data.value.colors) };
}

export async function saveAiGlow({ preset, colors }) {
  const { error } = await supabase
    .from("site_settings")
    .upsert({ key: "ai_glow", value: { preset, colors: sanitizeGlowColors(colors) }, updated_at: new Date().toISOString() });
  if (error) throw error;
}

export function applyAiGlowColors(colors) {
  document.documentElement.style.setProperty("--ai-glow-colors", glowGradientStops(colors));
}

// ---------- Izak AI starter prompts ----------

export const DEFAULT_CHAT_STARTERS = [
  "What does Izak do?",
  "Tell me about this site",
  "What's his best project?",
  "What's he looking for next?",
  "What does he write about?",
  "How can I reach him?",
];

export const CHAT_STARTERS_MAX = 8;
export const CHAT_STARTER_MAX_CHARS = 80;

export function sanitizeChatStarters(starters) {
  if (!Array.isArray(starters)) return [];
  const seen = new Set();
  return starters
    .filter((s) => typeof s === "string")
    .map((s) => s.trim().slice(0, CHAT_STARTER_MAX_CHARS))
    .filter((s) => s && !seen.has(s.toLowerCase()) && seen.add(s.toLowerCase()))
    .slice(0, CHAT_STARTERS_MAX);
}

// Falls back to the defaults when nothing is saved (or all saved prompts were removed).
export async function fetchChatStarters() {
  const { data, error } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", "chat_starters")
    .maybeSingle();
  const saved = error ? [] : sanitizeChatStarters(data?.value?.starters);
  return saved.length ? saved : DEFAULT_CHAT_STARTERS;
}

export async function saveChatStarters(starters) {
  const { error } = await supabase
    .from("site_settings")
    .upsert({ key: "chat_starters", value: { starters: sanitizeChatStarters(starters) }, updated_at: new Date().toISOString() });
  if (error) throw error;
}

// ---------- menu bar contact status ----------

export const DEFAULT_CONTACT_STATUS = { available: true, label: "Open to chat", calendarUrl: "" };

export function sanitizeContactStatus(value) {
  const label = typeof value?.label === "string" ? value.label.trim().slice(0, 40) : "";
  const url = typeof value?.calendarUrl === "string" ? value.calendarUrl.trim() : "";
  return {
    available: value?.available !== false,
    label: label || DEFAULT_CONTACT_STATUS.label,
    calendarUrl: /^https:\/\//i.test(url) ? url.slice(0, 300) : "",
  };
}

export async function fetchContactStatus() {
  const { data, error } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", "contact_status")
    .maybeSingle();
  if (error || !data?.value) return DEFAULT_CONTACT_STATUS;
  return sanitizeContactStatus(data.value);
}

export async function saveContactStatus(status) {
  const { error } = await supabase
    .from("site_settings")
    .upsert({ key: "contact_status", value: sanitizeContactStatus(status), updated_at: new Date().toISOString() });
  if (error) throw error;
}

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

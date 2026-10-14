import { useEffect, useState } from "react";

// One switch for every site sound (window clicks, the chat ping, the Izak AI
// hover hum). Toggled from the menu bar and remembered per browser.
const KEY = "sound-muted";
let muted = false;
try {
  muted = localStorage.getItem(KEY) === "1";
} catch {}
const listeners = new Set();

export const isMuted = () => muted;

export function setMuted(next) {
  muted = next;
  try {
    localStorage.setItem(KEY, next ? "1" : "0");
  } catch {}
  listeners.forEach((fn) => fn(next));
}

export function onMuteChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function playSound(src) {
  if (muted) return;
  new Audio(src).play().catch(() => {});
}

export function useMuted() {
  const [value, setValue] = useState(muted);
  useEffect(() => onMuteChange(setValue), []);
  return value;
}

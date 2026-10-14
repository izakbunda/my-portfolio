import { trackEvent } from "./metrics";

// Deep links: ?open=<app>&item=<item>, e.g. /?open=projects&item=libris.
// The same targets power Izak AI's link buttons (see Chat.jsx).

export const APPS = {
  "izak-bunda": "Izak Bunda",
  resume: "Resumé",
  projects: "Projects",
  internships: "Internships",
  "izak-ai": "Izak AI",
  photography: "Photography",
};

const APP_BY_NAME = Object.fromEntries(Object.entries(APPS).map(([slug, name]) => [name, slug]));

export const appSlug = (windowName) => APP_BY_NAME[windowName] ?? null;

export function slugify(text) {
  return text
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Short, shareable item slug: the part of the name before ":", "—" or "(".
// "Libris: AI-Powered Digital Library" -> "libris".
export const itemSlug = (name) => slugify(name.split(/[:—(]/)[0]) || slugify(name);

export const matchesItem = (name, slug) => !!slug && (slug === itemSlug(name) || slug === slugify(name));

export function parseDeepLink(search = window.location.search) {
  const params = new URLSearchParams(search);
  const app = params.get("open")?.toLowerCase();
  if (!app || !APPS[app]) return null;
  const item = params.get("item")?.toLowerCase() || null;
  return { app, item };
}

export function buildDeepLink({ app, item }) {
  const params = new URLSearchParams({ open: app });
  if (item) params.set("item", item);
  return `${window.location.origin}/?${params}`;
}

// Opens (or focuses) the target window via HomePage's "open-window" listener.
export function openTarget({ app, item }, source = "chat") {
  const name = APPS[app];
  if (!name) return;
  trackEvent(source === "url" ? "deeplink" : "chat_link", item ? `${app}/${item}` : app);
  window.dispatchEvent(new CustomEvent("open-window", { detail: { name, item: item || null } }));
}

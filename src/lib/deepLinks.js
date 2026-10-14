import { trackEvent } from "./metrics";

// Deep links: /<app>[/<item>], e.g. /photography or /projects/libris.
// The older query form (/?open=projects&item=libris) still works.
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

export function parseDeepLink({ pathname, search } = window.location) {
  const params = new URLSearchParams(search);
  let app = params.get("open");
  let item = params.get("item");
  if (!app) {
    [app, item] = pathname.split("/").filter(Boolean).map(decodeURIComponent);
  }
  app = app?.toLowerCase();
  if (!app || !APPS[app]) return null;
  return { app, item: item?.toLowerCase() || null };
}

export function buildDeepLink({ app, item }) {
  return `${window.location.origin}/${app}${item ? `/${item}` : ""}`;
}

// Opens (or focuses) the target window via HomePage's "open-window" listener.
export function openTarget({ app, item }, source = "chat") {
  const name = APPS[app];
  if (!name) return;
  trackEvent(source === "url" ? "deeplink" : "chat_link", item ? `${app}/${item}` : app);
  window.dispatchEvent(new CustomEvent("open-window", { detail: { name, item: item || null } }));
}

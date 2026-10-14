import experience from "../../assets/Experience.json";
import { APPS, itemSlug } from "../../lib/deepLinks";
import { askIzakAI, newChat } from "../../lib/chatBus";
import { isMuted, setMuted } from "../../lib/sound";

// Menu definitions for the desktop menu bar. Items:
//   { label, onSelect, shortcut?, checked?, disabled?, href? }
//   { divider: true }   { heading: "…" }   { askInput: true } (Help search)

export const RESUME_URL = "https://drive.google.com/file/d/1_c5Qknz4_6FVi1zxfPCIpmfupVsK-QYT/view?usp=sharing";
export const EMAIL = "izakbunda@gmail.com";
export const LINKS = {
  linkedin: "https://www.linkedin.com/in/izakbunda",
  github: "https://www.github.com/izakbunda",
  substack: "https://izakbunda.substack.com",
  source: "https://github.com/izakbunda/my-portfolio",
};

const APP_NAMES = Object.values(APPS);
const projectCategories = [...new Set(experience.projects.map((p) => p.category).filter(Boolean))];

const appleMenu = (d) => [
  { label: "About This Portfolio", onSelect: d.openAbout },
  { label: "Easter Eggs", onSelect: d.openEasterEggs },
  { divider: true },
  { label: "Change Wallpaper…", onSelect: d.changeWallpaper },
  { label: "Reset Wallpaper", onSelect: d.resetWallpaper },
  { divider: true },
  { label: "Snap to Grid", checked: d.icons.grid, onSelect: d.icons.toggleGrid },
  { label: "Clean Up Desktop", onSelect: d.icons.cleanUp },
  { label: "Sound Effects", checked: !isMuted(), onSelect: () => setMuted(!isMuted()) },
  { divider: true },
  { label: "Restart…", onSelect: d.restart },
];

const fileMenu = (d, front) => [
  { label: "Share Link", onSelect: d.shareLink },
  { label: "Download Resumé", href: RESUME_URL },
  { label: "Email Izak", href: `mailto:${EMAIL}` },
  { divider: true },
  { label: "Close Window", disabled: !front, onSelect: () => d.closeWindow(front.id) },
];

const windowMenu = (d, front) => {
  const visible = d.windows.filter((w) => !w.minimized);
  return [
    { label: "Minimize", disabled: !front, onSelect: () => d.minimizeWindow(front.id) },
    { label: "Expand", disabled: !front, onSelect: () => d.expandWindow(front.id) },
    { label: "Tile Side by Side", disabled: visible.length < 2, onSelect: d.tileWindows },
    { label: "Bring All to Front", disabled: d.windows.length === 0, onSelect: d.bringAllToFront },
    ...(d.windows.length ? [{ divider: true }] : []),
    ...d.windows.map((w) => ({
      label: w.minimized ? `${w.name} (minimized)` : w.name,
      checked: w.front,
      onSelect: () => d.focusWindow(w.id),
    })),
  ];
};

const goMenu = (d) => APP_NAMES.map((name) => ({ label: name, onSelect: () => d.openApp(name) }));

const helpMenu = (d) => [
  { askInput: true },
  { divider: true },
  { label: "Spotlight Search", shortcut: "⌘K", onSelect: d.openSpotlight },
  { label: "Easter Eggs", onSelect: d.openEasterEggs },
];

// The one extra menu each app gets (titled so it never repeats the app name).
function appMenu(app, d, data) {
  switch (app) {
    case "Izak Bunda":
      return {
        title: "Contact",
        items: [
          { label: "Email Izak", href: `mailto:${EMAIL}` },
          { label: "LinkedIn", href: LINKS.linkedin },
          { label: "GitHub", href: LINKS.github },
          { label: "Substack", href: LINKS.substack },
          { divider: true },
          { label: "Chat with Izak AI", onSelect: () => d.openApp("Izak AI") },
        ],
      };
    case "Resumé":
      return {
        title: "Actions",
        items: [
          { label: "Download Resumé", href: RESUME_URL },
          { divider: true },
          { label: "Ask Izak AI about his experience", onSelect: () => askIzakAI("Walk me through Izak's experience.") },
        ],
      };
    case "Projects":
      return {
        title: "Browse",
        items: [
          { heading: "Show" },
          { label: "All", onSelect: () => d.openApp("Projects", { filter: "All" }) },
          ...projectCategories.map((c) => ({ label: c, onSelect: () => d.openApp("Projects", { filter: c }) })),
          { divider: true },
          { heading: "Jump to" },
          ...experience.projects.map((p) => ({
            label: p.name.split(/[:—(]/)[0].trim(),
            onSelect: () => d.openApp("Projects", { item: itemSlug(p.name) }),
          })),
        ],
      };
    case "Internships":
      return {
        title: "Browse",
        items: experience.internships.map((p) => ({
          label: p.name,
          onSelect: () => d.openApp("Internships", { item: itemSlug(p.name) }),
        })),
      };
    case "Photography":
      return {
        title: "Albums",
        items: data.albums.length
          ? data.albums.map((a) => ({ label: a.name, onSelect: () => d.openApp("Photography", { item: a.slug }) }))
          : [{ label: "Loading albums…", disabled: true }],
      };
    case "Izak AI":
      return {
        title: "Chat",
        items: [
          { label: "New Chat", onSelect: newChat },
          { label: "Copy Transcript", onSelect: d.copyTranscript },
          { divider: true },
          { heading: "Ask" },
          ...data.starters.map((q) => ({ label: q, onSelect: () => askIzakAI(q) })),
        ],
      };
    default:
      return null;
  }
}

// The full menu bar for whichever app is in front ("Finder" for the desktop).
export function buildMenus(d, data) {
  const front = d.windows.find((w) => w.front) ?? null;
  const app = d.activeApp;
  const extra = appMenu(app, d, data);
  return {
    appName: app ?? "Finder",
    menus: [
      { id: "file", title: "File", items: fileMenu(d, front) },
      ...(extra ? [{ id: "app", title: extra.title, items: extra.items }] : []),
      { id: "window", title: "Window", items: windowMenu(d, front) },
      { id: "go", title: "Go", items: goMenu(d) },
      { id: "help", title: "Help", items: helpMenu(d) },
    ],
    apple: appleMenu(d),
  };
}

import { useEffect, useMemo, useRef, useState } from "react";
import experience from "../../assets/Experience.json";
import { APPS, itemSlug } from "../../lib/deepLinks";
import { askIzakAI, newChat } from "../../lib/chatBus";
import { isMuted, setMuted } from "../../lib/sound";

// ⌘K search across apps, projects, internships, photo albums and a few
// actions. If nothing fits, the last row asks Izak AI.

function score(text, q) {
  const t = text.toLowerCase();
  if (t.startsWith(q)) return 3;
  if (t.split(/[^a-z0-9]+/).some((w) => w.startsWith(q))) return 2;
  return t.includes(q) ? 1 : 0;
}

function buildIndex(d, albums) {
  return [
    ...Object.values(APPS).map((name) => ({ group: "Apps", label: name, run: () => d.openApp(name) })),
    ...experience.projects.map((p) => ({
      group: "Projects",
      label: p.name,
      keywords: [p.category, ...(p.tags ?? [])].filter(Boolean).join(" "),
      run: () => d.openApp("Projects", { item: itemSlug(p.name) }),
    })),
    ...experience.internships.map((p) => ({
      group: "Internships",
      label: p.name,
      keywords: (p.tags ?? []).join(" "),
      run: () => d.openApp("Internships", { item: itemSlug(p.name) }),
    })),
    ...albums.map((a) => ({ group: "Photo albums", label: a.name, run: () => d.openApp("Photography", { item: a.slug }) })),
    { group: "Actions", label: "Share link to this window", run: d.shareLink },
    { group: "Actions", label: "New chat with Izak AI", run: () => { d.openApp("Izak AI"); newChat(); } },
    { group: "Actions", label: "Change wallpaper", run: d.changeWallpaper },
    { group: "Actions", label: "Clean up desktop", run: d.icons.cleanUp },
    { group: "Actions", label: isMuted() ? "Turn sound on" : "Turn sound off", run: () => setMuted(!isMuted()) },
    { group: "Actions", label: "Easter eggs", run: d.openEasterEggs },
    { group: "Actions", label: "About this portfolio", run: d.openAbout },
  ];
}

const GROUP_ORDER = ["Apps", "Projects", "Internships", "Photo albums", "Actions"];

export default function Spotlight({ desktop, albums, onClose }) {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const listRef = useRef(null);
  const index = useMemo(() => buildIndex(desktop, albums), [desktop, albums]);

  const q = query.trim().toLowerCase();
  const results = useMemo(() => {
    const matches = q
      ? index
          .map((r) => ({ r, s: Math.max(score(r.label, q), r.keywords ? score(r.keywords, q) - 1 : 0) }))
          .filter((x) => x.s > 0)
          .sort((a, b) => GROUP_ORDER.indexOf(a.r.group) - GROUP_ORDER.indexOf(b.r.group) || b.s - a.s)
          .map((x) => x.r)
          .slice(0, 12)
      : index.filter((r) => r.group === "Apps");
    const ask = q ? [{ group: "Ask", label: `Ask Izak AI: “${query.trim()}”`, run: () => askIzakAI(query) }] : [];
    return [...matches, ...ask];
  }, [index, q, query]);

  useEffect(() => setActive(0), [q]);

  useEffect(() => {
    listRef.current?.querySelector(".spotlight-row.active")?.scrollIntoView({ block: "nearest" });
  }, [active]);

  const run = (r) => {
    onClose();
    r?.run();
  };

  const onKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      run(results[active]);
    } else if (e.key === "Escape") {
      onClose();
    }
  };

  let lastGroup = null;
  return (
    <div className="spotlight-scrim" onPointerDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="spotlight" role="dialog" aria-label="Spotlight search">
        <div className="spotlight-input">
          <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true">
            <circle cx="6.5" cy="6.5" r="5" fill="none" stroke="currentColor" strokeWidth="2" />
            <line x1="10.5" y1="10.5" x2="15" y2="15" stroke="currentColor" strokeWidth="2" />
          </svg>
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Search projects, photos, apps… or ask Izak AI"
            aria-label="Search"
          />
        </div>
        <div className="spotlight-results" ref={listRef}>
          {results.map((r, i) => {
            const header = r.group !== lastGroup ? <div className="spotlight-group">{r.group}</div> : null;
            lastGroup = r.group;
            return (
              <div key={`${r.group}-${r.label}`}>
                {header}
                <div
                  className={`spotlight-row${i === active ? " active" : ""}`}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => run(r)}
                >
                  {r.label}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

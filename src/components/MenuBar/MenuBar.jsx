import { useEffect, useRef, useState } from "react";
import "./MenuBar.css";
import ContextMenu from "./ContextMenu";
import Spotlight from "./Spotlight";
import { ClockStatus, ContactStatus, SoundStatus } from "./StatusItems";
import { buildMenus } from "./menus";
import { askIzakAI } from "../../lib/chatBus";
import { loadAlbums } from "../../lib/siteContext";
import { DEFAULT_CHAT_STARTERS, fetchChatStarters } from "../../lib/siteSettings";
import { playSound, useMuted } from "../../lib/sound";

function formatClock(date) {
  return date
    .toLocaleDateString("en-US", { weekday: "short", year: "numeric", month: "short", day: "numeric", hour: "numeric", minute: "numeric" })
    .replace(",", "");
}

function useNow() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

// Phones keep the original, minimal menu bar.
function MobileMenuBar({ onShowBanner }) {
  const now = useNow();
  const [aboutOpen, setAboutOpen] = useState(false);
  const toggle = () => {
    playSound("/click.mp3");
    setAboutOpen((o) => !o);
  };
  return (
    <div className="container">
      <div className="left-menu">
        <img src="/logo.png" alt="logo" className="menu-logo" onClick={toggle} />
        <div className="left-icons" onClick={toggle}>About</div>
        {onShowBanner && (
          <div className="left-icons" onClick={onShowBanner}>
            Desktop version
          </div>
        )}
      </div>
      {aboutOpen && <ContextMenu />}
      <div className="right-menu">{formatClock(now)}</div>
    </div>
  );
}

function MenuItems({ items, onDone }) {
  const [question, setQuestion] = useState("");
  return (
    <div className="menubar-dropdown" role="menu">
      {items.map((item, i) => {
        if (item.divider) return <div key={i} className="menubar-divider" />;
        if (item.heading) return <div key={i} className="menubar-heading">{item.heading}</div>;
        if (item.askInput) {
          return (
            <form
              key={i}
              className="menubar-ask"
              onSubmit={(e) => {
                e.preventDefault();
                askIzakAI(question);
                setQuestion("");
                onDone();
              }}
            >
              <input
                autoFocus
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Ask Izak AI anything…"
                aria-label="Ask Izak AI"
              />
            </form>
          );
        }
        const content = (
          <>
            <span className="menubar-check">{item.checked ? "✓" : ""}</span>
            <span className="menubar-label">{item.label}</span>
            {item.shortcut && <span className="menubar-shortcut">{item.shortcut}</span>}
          </>
        );
        const className = `menubar-item${item.disabled ? " disabled" : ""}`;
        if (item.href) {
          const external = !item.href.startsWith("mailto:");
          return (
            <a
              key={i}
              className={className}
              role="menuitem"
              href={item.href}
              target={external ? "_blank" : undefined}
              rel={external ? "noopener noreferrer" : undefined}
              onClick={onDone}
            >
              {content}
            </a>
          );
        }
        return (
          <div
            key={i}
            className={className}
            role="menuitem"
            aria-disabled={item.disabled || undefined}
            onClick={() => {
              if (item.disabled) return;
              onDone();
              item.onSelect?.();
            }}
          >
            {content}
          </div>
        );
      })}
    </div>
  );
}

// Desktop menu bar, Mac-style: the bold app name and the app's own menu follow
// whichever window is in front.
function DesktopMenuBar({ desktop }) {
  const now = useNow();
  useMuted(); // re-render the ✓ when sound is toggled
  const [open, setOpen] = useState(null); // menu id, or a status item id
  const [spotlight, setSpotlight] = useState(false);
  const [albums, setAlbums] = useState([]);
  const [starters, setStarters] = useState(DEFAULT_CHAT_STARTERS);
  const barRef = useRef(null);

  useEffect(() => {
    loadAlbums().then(setAlbums);
    fetchChatStarters().then(setStarters).catch(() => {});
  }, []);

  // ⌘K / Ctrl+K toggles Spotlight.
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(null);
        setSpotlight((s) => !s);
      } else if (e.key === "Escape") {
        setOpen(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Click outside closes any open menu.
  useEffect(() => {
    if (!open) return;
    const onDown = (e) => {
      if (!barRef.current?.contains(e.target)) setOpen(null);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open]);

  const copyTranscript = async () => {
    let messages = [];
    try {
      messages = JSON.parse(sessionStorage.getItem("izak-ai-chat")) ?? [];
    } catch {}
    const text = messages.map((m) => `${m.role === "user" ? "You" : "Izak AI"}: ${m.content}`).join("\n\n");
    try {
      await navigator.clipboard.writeText(text);
      desktop.toast("Transcript copied");
    } catch {
      desktop.toast("Couldn't copy the transcript");
    }
  };

  const d = { ...desktop, openSpotlight: () => setSpotlight(true), copyTranscript };
  // Rebuilt every render so menu actions always see the current windows.
  const { appName, menus, apple } = buildMenus(d, { albums, starters });

  const toggle = (id) => {
    playSound("/click.mp3");
    setOpen((cur) => (cur === id ? null : id));
  };
  // Like macOS: once a menu is open, hovering another title switches to it.
  const hover = (id) => setOpen((cur) => (cur && cur !== id ? id : cur));
  const close = () => setOpen(null);

  const title = (id, label, extraClass = "") => (
    <div
      className={`menubar-title${open === id ? " open" : ""} ${extraClass}`}
      onClick={() => toggle(id)}
      onMouseEnter={() => hover(id)}
    >
      {label}
    </div>
  );

  return (
    <>
      <div className="container menubar" ref={barRef}>
        <div className="left-menu">
          <div className="menubar-menu">
            <div
              className={`menubar-title menubar-apple${open === "apple" ? " open" : ""}`}
              onClick={() => toggle("apple")}
              onMouseEnter={() => hover("apple")}
              aria-label="Apple menu"
            >
              <img src="/logo.png" alt="" className="menu-logo" />
            </div>
            {open === "apple" && <MenuItems items={apple} onDone={close} />}
          </div>
          <div className="menubar-menu">
            {title("app-name", appName, "menubar-appname")}
            {open === "app-name" && (
              <MenuItems
                items={[
                  { label: `About ${appName === "Finder" ? "This Portfolio" : appName}`, onSelect: desktop.openAbout },
                  { divider: true },
                  { label: "Hide Others", disabled: desktop.windows.filter((w) => !w.minimized).length < 2, onSelect: () => desktop.windows.filter((w) => !w.front && !w.minimized).forEach((w) => desktop.minimizeWindow(w.id)) },
                  { label: `Quit ${appName}`, disabled: appName === "Finder", onSelect: () => desktop.closeWindow(desktop.windows.find((w) => w.front).id) },
                ]}
                onDone={close}
              />
            )}
          </div>
          {menus.map((m) => (
            <div key={m.id} className="menubar-menu">
              {title(m.id, m.title)}
              {open === m.id && <MenuItems items={m.items} onDone={close} />}
            </div>
          ))}
        </div>
        <div className="right-menu menubar-status">
          <ContactStatus open={open === "contact"} onToggle={() => toggle("contact")} onHover={() => hover("contact")} onDone={close} />
          <div className="menubar-title" onClick={() => setSpotlight(true)} aria-label="Spotlight search" title="Spotlight (⌘K)">
            <svg width="11" height="11" viewBox="0 0 16 16" aria-hidden="true">
              <circle cx="6.5" cy="6.5" r="5" fill="none" stroke="currentColor" strokeWidth="2" />
              <line x1="10.5" y1="10.5" x2="15" y2="15" stroke="currentColor" strokeWidth="2" />
            </svg>
          </div>
          <SoundStatus />
          <ClockStatus now={now} label={formatClock(now)} open={open === "clock"} onToggle={() => toggle("clock")} onHover={() => hover("clock")} />
        </div>
      </div>
      {spotlight && <Spotlight desktop={d} albums={albums} onClose={() => setSpotlight(false)} />}
    </>
  );
}

const MenuBar = ({ desktop, onShowBanner }) =>
  desktop ? <DesktopMenuBar desktop={desktop} /> : <MobileMenuBar onShowBanner={onShowBanner} />;

export default MenuBar;

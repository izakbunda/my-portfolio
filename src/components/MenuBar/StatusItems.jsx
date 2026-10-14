import { useEffect, useState } from "react";
import { EMAIL, LINKS } from "./menus";
import { askIzakAI } from "../../lib/chatBus";
import { DEFAULT_CONTACT_STATUS, fetchContactStatus } from "../../lib/siteSettings";
import { setMuted, useMuted } from "../../lib/sound";

const IZAK_TZ = "America/Denver";

const timeIn = (date, timeZone) =>
  date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone, timeZoneName: "short" });

// Clock; its drop-down puts Izak's local time (Denver) next to the visitor's.
export function ClockStatus({ now, label, open, onToggle, onHover }) {
  const visitorTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const sameZone = timeIn(now, visitorTz) === timeIn(now, IZAK_TZ);
  return (
    <div className="menubar-menu">
      <div className={`menubar-title${open ? " open" : ""}`} onClick={onToggle} onMouseEnter={onHover}>
        {label}
      </div>
      {open && (
        <div className="menubar-dropdown menubar-dropdown-right menubar-clock">
          <div className="menubar-clock-row">
            <span>You</span>
            <strong>{timeIn(now, visitorTz)}</strong>
          </div>
          <div className="menubar-clock-row">
            <span>Izak</span>
            <strong>{timeIn(now, IZAK_TZ)}</strong>
          </div>
          <div className="menubar-clock-note">{sameZone ? "Same time zone as Izak (Denver, CO)" : "Izak is in Denver, CO"}</div>
        </div>
      )}
    </div>
  );
}

export function SoundStatus() {
  const muted = useMuted();
  return (
    <div
      className="menubar-title"
      onClick={() => setMuted(!muted)}
      aria-label={muted ? "Unmute sound effects" : "Mute sound effects"}
      title={muted ? "Sound off" : "Sound on"}
    >
      <svg width="13" height="11" viewBox="0 0 18 14" aria-hidden="true">
        <path d="M1 5h3l4-4v12l-4-4H1z" fill="currentColor" />
        {muted ? (
          <path d="M11 4.5l5 5m0-5l-5 5" stroke="currentColor" strokeWidth="1.8" />
        ) : (
          <path d="M11 4c1.5 1.5 1.5 4.5 0 6M13.5 2c2.8 2.8 2.8 7.2 0 10" fill="none" stroke="currentColor" strokeWidth="1.5" />
        )}
      </svg>
    </div>
  );
}

// "Open to chat" style indicator, editable from the dashboard (Appearance).
export function ContactStatus({ open, onToggle, onHover, onDone }) {
  const [status, setStatus] = useState(DEFAULT_CONTACT_STATUS);
  useEffect(() => {
    fetchContactStatus().then(setStatus).catch(() => {});
  }, []);

  const link = (label, href) => {
    const external = !href.startsWith("mailto:");
    return (
      <a
        className="menubar-item"
        href={href}
        target={external ? "_blank" : undefined}
        rel={external ? "noopener noreferrer" : undefined}
        onClick={onDone}
      >
        <span className="menubar-check" />
        <span className="menubar-label">{label}</span>
      </a>
    );
  };

  return (
    <div className="menubar-menu">
      <div className={`menubar-title menubar-contact${open ? " open" : ""}`} onClick={onToggle} onMouseEnter={onHover}>
        <span className={`menubar-dot${status.available ? " available" : ""}`} />
        <span className="menubar-contact-label">{status.label}</span>
      </div>
      {open && (
        <div className="menubar-dropdown menubar-dropdown-right">
          <div className="menubar-heading">{status.available ? status.label : "Not looking right now"}</div>
          {link(`Email ${EMAIL}`, `mailto:${EMAIL}`)}
          {link("LinkedIn", LINKS.linkedin)}
          {status.calendarUrl && link("Book a call", status.calendarUrl)}
          <div className="menubar-divider" />
          <div
            className="menubar-item"
            onClick={() => {
              onDone();
              askIzakAI("How can I get in touch with Izak?");
            }}
          >
            <span className="menubar-check" />
            <span className="menubar-label">Ask Izak AI</span>
          </div>
        </div>
      )}
    </div>
  );
}

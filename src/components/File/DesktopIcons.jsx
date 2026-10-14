import { useEffect, useRef, useState } from "react";
import File from "./File";
import { ICON_W } from "../../lib/useDesktopIcons";

const DRAG_THRESHOLD = 4; // px before a press becomes a drag (otherwise it's a click)

// Draggable desktop icons. A click opens the app; a drag moves the icon and
// doesn't open anything. Moves are tracked on the window (not with pointer
// capture), so a fast flick that leaves the icon still drags, and a plain
// click still lands on the icon itself.
const DesktopIcons = ({ names, icons, onOpen }) => {
  const [drag, setDrag] = useState(null); // { name, x, y } while dragging
  const suppressClick = useRef(false);
  const stopTracking = useRef(null);

  useEffect(() => () => stopTracking.current?.(), []);

  const onPointerDown = (e, name) => {
    if (e.button !== 0) return;
    suppressClick.current = false;
    const origin = icons.positionOf(name);
    const startX = e.clientX;
    const startY = e.clientY;
    let current = null;

    const onMove = (ev) => {
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      if (!current && Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
      current = {
        name,
        x: Math.min(Math.max(origin.x + dx, 0), window.innerWidth - ICON_W),
        y: Math.min(Math.max(origin.y + dy, 30), window.innerHeight - 100),
      };
      setDrag(current);
    };

    const onUp = () => {
      stopTracking.current?.();
      if (!current) return;
      // Swallow the click that may follow this drag, but never a later one.
      suppressClick.current = true;
      setTimeout(() => (suppressClick.current = false), 0);
      icons.moveIcon(name, current.x, current.y);
      setDrag(null);
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    stopTracking.current = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      stopTracking.current = null;
    };
  };

  return (
    <div className="desktop-icons">
      {names.map((name) => {
        const pos = drag?.name === name ? drag : icons.positionOf(name);
        return (
          <div
            key={name}
            className={`desktop-icon-slot${drag?.name === name ? " dragging" : ""}`}
            style={{ left: pos.x, top: pos.y }}
            onPointerDown={(e) => onPointerDown(e, name)}
            onClickCapture={(e) => {
              if (suppressClick.current) {
                suppressClick.current = false;
                e.stopPropagation();
              }
            }}
          >
            <File name={name} onClick={onOpen} />
          </div>
        );
      })}
    </div>
  );
};

export default DesktopIcons;

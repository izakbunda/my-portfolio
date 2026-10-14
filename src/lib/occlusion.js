// True when something else is on top of `el` at (x, y): the cursor is over a
// window that isn't the one `el` lives in (or `el` sits on the desktop and a
// window covers that spot). Proximity effects use this so a button doesn't
// glow or play its sound through a window stacked above it.
const windowOf = (node) => node?.closest?.(".window-container") ?? null;

export function isCoveredAt(el, x, y) {
  const hit = document.elementFromPoint(x, y);
  if (!hit || el.contains(hit)) return false;
  const hitWindow = windowOf(hit);
  return !!hitWindow && hitWindow !== windowOf(el);
}

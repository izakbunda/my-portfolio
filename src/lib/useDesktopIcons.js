import { useCallback, useEffect, useState } from "react";

// Desktop icon layout, Mac-style: icons live in a column on the right by
// default, can be dragged anywhere, and optionally snap to a grid. Positions
// are stored as distance from the right edge (`r`) plus `y`, so icons stay
// anchored to the right when the window resizes.

const POSITIONS_KEY = "desktop-icons";
const GRID_KEY = "desktop-icons-grid";

export const ICON_W = 72;
export const ICON_H = 90;
const CELL_W = 88;
const CELL_H = 98;
const MARGIN_R = 16;
const TOP = 45;      // below the menu bar
const BOTTOM = 90;   // above the dock
const BASE_R = MARGIN_R + ICON_W; // `r` of the rightmost column

const readJSON = (key, fallback) => {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
};
const writeJSON = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
};

const rowsPerColumn = (vh) => Math.max(1, Math.floor((vh - TOP - BOTTOM) / CELL_H));

const cellToSpot = (col, row) => ({ r: BASE_R + col * CELL_W, y: TOP + row * CELL_H });

// Default arrangement: top-right, down the column, wrapping leftwards.
function defaultLayout(names, vh) {
  const rows = rowsPerColumn(vh);
  return Object.fromEntries(names.map((name, i) => [name, cellToSpot(Math.floor(i / rows), i % rows)]));
}

// Nearest free grid cell to a spot.
function snap(spot, taken, vh) {
  const maxRow = rowsPerColumn(vh) - 1;
  const col0 = Math.max(0, Math.round((spot.r - BASE_R) / CELL_W));
  const row0 = Math.min(maxRow, Math.max(0, Math.round((spot.y - TOP) / CELL_H)));
  for (let d = 0; d < 50; d++) {
    for (let dc = -d; dc <= d; dc++) {
      for (let dr = -d; dr <= d; dr++) {
        if (Math.max(Math.abs(dc), Math.abs(dr)) !== d) continue;
        const col = col0 + dc;
        const row = row0 + dr;
        if (col < 0 || row < 0 || row > maxRow || taken.has(`${col},${row}`)) continue;
        taken.add(`${col},${row}`);
        return cellToSpot(col, row);
      }
    }
  }
  return spot;
}

function snapAll(names, spots, vh) {
  const taken = new Set();
  return Object.fromEntries(names.map((name) => [name, snap(spots[name], taken, vh)]));
}

const cellKey = (spot) => `${Math.round((spot.r - BASE_R) / CELL_W)},${Math.round((spot.y - TOP) / CELL_H)}`;

export function useDesktopIcons(names) {
  const [viewport, setViewport] = useState(() => ({ w: window.innerWidth, h: window.innerHeight }));
  const [grid, setGrid] = useState(() => readJSON(GRID_KEY, false) === true);
  const [spots, setSpots] = useState(() => ({
    ...defaultLayout(names, window.innerHeight),
    ...readJSON(POSITIONS_KEY, {}),
  }));

  useEffect(() => {
    const onResize = () => setViewport({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const save = (next) => {
    setSpots(next);
    writeJSON(POSITIONS_KEY, next);
  };

  // Screen position for an icon, kept on-screen.
  const positionOf = useCallback(
    (name) => {
      const spot = spots[name];
      return {
        x: Math.min(Math.max(viewport.w - spot.r, 0), viewport.w - ICON_W),
        y: Math.min(Math.max(spot.y, 30), viewport.h - ICON_H - 10),
      };
    },
    [spots, viewport]
  );

  // Drop an icon at screen position (x, y).
  const moveIcon = (name, x, y) => {
    let spot = { r: Math.round(viewport.w - x), y: Math.round(y) };
    if (grid) {
      const taken = new Set(names.filter((n) => n !== name).map((n) => cellKey(spots[n])));
      spot = snap(spot, taken, viewport.h);
    }
    save({ ...spots, [name]: spot });
  };

  const toggleGrid = () => {
    const next = !grid;
    setGrid(next);
    writeJSON(GRID_KEY, next);
    if (next) save(snapAll(names, spots, viewport.h));
  };

  const cleanUp = () => save(defaultLayout(names, viewport.h));

  return { positionOf, moveIcon, grid, toggleGrid, cleanUp };
}

import { useEffect, useRef, useState } from "react";
import Window from "../../components/Window/Window";
import File from "../../components/File/File";
import MenuBar from "../../components/MenuBar/MenuBar";
import Dock from "../../components/Dock/Dock";
import MobileBanner from "../../components/MobileBanner/MobileBanner";
import WallpaperMenu from "../../components/WallpaperMenu/WallpaperMenu";
import { startSession, trackEvent } from "../../lib/metrics";
import "./HomePage.css";

const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 500);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth <= 500);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return isMobile;
};

function DraggableWindow({ id, position, name, initialSize, resizable = true, onRemove, onUpdatePosition, onUpdateSize, onSelect, onMinimize, zIndex, isMinimized, isMobile }) {
  const windowRef = useRef(null);
  const headerRef = useRef(null);
  const isClicked = useRef(false);
  const coords = useRef({ startX: 0, startY: 0, lastX: position.x, lastY: position.y });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const isFullscreenRef = useRef(false);

  const isResizing = useRef(false);
  const resizeEdge = useRef(null);
  const resizeStart = useRef({});
  const [size, setSize] = useState(() => initialSize ?? {
    width: Math.max(770, Math.floor(window.innerWidth * 0.5)),
    height: Math.floor(window.innerHeight * 0.8),
  });
  const sizeRef = useRef(size);
  sizeRef.current = size;

  const toggleFullscreen = () => {
    setIsFullscreen((prev) => {
      isFullscreenRef.current = !prev;
      return !prev;
    });
    onSelect(id);
  };

  useEffect(() => {
    if (isMobile) return;

    const headerEl = headerRef.current;
    const windowEl = windowRef.current;
    if (!headerEl || !windowEl) return;

    const onMouseDown = (e) => {
      if (isFullscreenRef.current) return;
      isClicked.current = true;
      coords.current.startX = e.clientX ?? e.touches?.[0].clientX;
      coords.current.startY = e.clientY ?? e.touches?.[0].clientY;
      onSelect(id);
    };

    const onMouseUp = () => {
      if (isClicked.current) {
        isClicked.current = false;
        coords.current.lastX = windowEl.offsetLeft;
        coords.current.lastY = windowEl.offsetTop;
        onUpdatePosition(id, { x: coords.current.lastX, y: coords.current.lastY });
      }
      if (isResizing.current) {
        isResizing.current = false;
        const edge = resizeEdge.current;
        resizeEdge.current = null;
        setSize({ ...sizeRef.current });
        onUpdateSize(id, { ...sizeRef.current });
        if (edge && edge.includes('w')) {
          coords.current.lastX = windowEl.offsetLeft;
          onUpdatePosition(id, { x: windowEl.offsetLeft, y: windowEl.offsetTop });
        }
      }
    };

    const onMouseMove = (e) => {
      if (isResizing.current && !isFullscreenRef.current) {
        const dx = e.clientX - resizeStart.current.x;
        const dy = e.clientY - resizeStart.current.y;
        const edge = resizeEdge.current;
        const MIN_W = 560;
        const MIN_H = Math.floor(window.innerHeight * 0.5);
        const DOCK_H = 72;

        let newW = resizeStart.current.width;
        let newH = resizeStart.current.height;

        if (edge.includes('e')) {
          newW = Math.max(MIN_W, Math.min(
            resizeStart.current.width + dx,
            window.innerWidth - resizeStart.current.left
          ));
        }
        if (edge.includes('s')) {
          newH = Math.max(MIN_H, Math.min(
            resizeStart.current.height + dy,
            window.innerHeight - DOCK_H - resizeStart.current.top
          ));
        }
        if (edge.includes('w')) {
          const maxShrink = resizeStart.current.width - MIN_W;
          const clampedDx = Math.max(-resizeStart.current.left, Math.min(dx, maxShrink));
          newW = resizeStart.current.width - clampedDx;
          const newX = resizeStart.current.left + clampedDx;
          windowEl.style.left = `${newX}px`;
          coords.current.lastX = newX;
        }

        windowEl.style.width = `${newW}px`;
        windowEl.style.height = `${newH}px`;
        sizeRef.current = { width: newW, height: newH };

      } else if (isClicked.current && !isFullscreenRef.current) {
        const rawX = (e.clientX ?? e.touches?.[0].clientX) - coords.current.startX + coords.current.lastX;
        const rawY = (e.clientY ?? e.touches?.[0].clientY) - coords.current.startY + coords.current.lastY;
        const MENU_BAR_H = 30;
        const HEADER_H = 32; // keep header reachable so user can always drag back up
        const maxX = window.innerWidth - windowEl.offsetWidth;
        const maxY = window.innerHeight - HEADER_H;
        const nextX = Math.max(0, Math.min(rawX, maxX));
        const nextY = Math.max(MENU_BAR_H, Math.min(rawY, maxY));
        windowEl.style.left = `${nextX}px`;
        windowEl.style.top = `${nextY}px`;
      }
    };

    headerEl.addEventListener("mousedown", onMouseDown);
    headerEl.addEventListener("touchstart", onMouseDown);
    document.addEventListener("mouseup", onMouseUp);
    document.addEventListener("touchend", onMouseUp);
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("touchmove", onMouseMove);

    return () => {
      headerEl.removeEventListener("mousedown", onMouseDown);
      headerEl.removeEventListener("touchstart", onMouseDown);
      document.removeEventListener("mouseup", onMouseUp);
      document.removeEventListener("touchend", onMouseUp);
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("touchmove", onMouseMove);
    };
  }, [id, isMobile, onUpdatePosition, onUpdateSize, onSelect]);

  const onResizeMouseDown = (e, edge) => {
    e.stopPropagation();
    e.preventDefault();
    if (isFullscreenRef.current) return;
    const windowEl = windowRef.current;
    isResizing.current = true;
    resizeEdge.current = edge;
    resizeStart.current = {
      x: e.clientX,
      y: e.clientY,
      width: sizeRef.current.width,
      height: sizeRef.current.height,
      left: windowEl.offsetLeft,
      top: windowEl.offsetTop,
    };
    onSelect(id);
  };

  if (isMinimized) return null;

  const wrapperStyle = isFullscreen
    ? { position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", zIndex: 99999 }
    : { position: "absolute", top: `${position.y}px`, left: `${position.x}px`, width: `${size.width}px`, height: `${size.height}px`, zIndex };

  return (
    <div ref={windowRef} onMouseDown={() => !isFullscreen && onSelect(id)} style={wrapperStyle}>
      {!isFullscreen && resizable && (
        <>
          <div className="resize-handle resize-e" onMouseDown={(e) => onResizeMouseDown(e, 'e')} />
          <div className="resize-handle resize-w" onMouseDown={(e) => onResizeMouseDown(e, 'w')} />
          <div className="resize-handle resize-s" onMouseDown={(e) => onResizeMouseDown(e, 's')} />
          <div className="resize-handle resize-se" onMouseDown={(e) => onResizeMouseDown(e, 'se')} />
          <div className="resize-handle resize-sw" onMouseDown={(e) => onResizeMouseDown(e, 'sw')} />
        </>
      )}
      <Window
        ref={headerRef}
        name={name}
        onClose={() => onRemove(id)}
        onMin={() => onMinimize(id)}
        onFullscreen={toggleFullscreen}
        isFullscreen={isFullscreen}
        isMobile={false}
      />
    </div>
  );
}


const STAGGER = 55;
const getInitialPosition = (index) => {
  const cx = 100;
  const cy = 50;
  return {
    x: Math.max(0, cx + index * STAGGER * 2),
    y: Math.max(30, cy + index * STAGGER),
  };
};

const CASCADE_STEP = 30;
const CASCADE_BASE_Y = 60;

const WINDOWS_STORAGE_KEY = "desktop-windows";

function loadSavedWindows() {
  try {
    const raw = localStorage.getItem(WINDOWS_STORAGE_KEY);
    if (!raw) return null;
    const saved = JSON.parse(raw);
    if (!Array.isArray(saved) || saved.length === 0) return null;
    const MENU_BAR_H = 30;
    const DOCK_H = 72;
    return saved.map((w) => ({
      ...w,
      id: crypto.randomUUID(),
      // Re-clamp in case the viewport is smaller than it was last session.
      position: {
        x: Math.max(0, Math.min(w.position.x, window.innerWidth - 100)),
        y: Math.max(MENU_BAR_H, Math.min(w.position.y, window.innerHeight - DOCK_H - 100)),
      },
    }));
  } catch {
    return null;
  }
}

function HomePage() {
  const isMobile = useIsMobile();
  const [activeApp, setActiveApp] = useState("Izak Bunda");
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [wallpaper, setWallpaper] = useState(() => localStorage.getItem("wallpaper") || null);
  const [contextMenu, setContextMenu] = useState(null);
  const [wallpaperLoading, setWallpaperLoading] = useState(false);
  const fileInputRef = useRef(null);
  const mobileWindowRef = useRef(null);

  useEffect(() => {
    startSession();
  }, []);

  useEffect(() => {
    if (wallpaper) {
      document.body.style.backgroundImage = `url(${wallpaper})`;
      document.body.style.backgroundSize = "cover";
      document.body.style.backgroundPosition = "center";
      document.body.style.backgroundRepeat = "no-repeat";
    } else {
      document.body.style.backgroundImage = "";
      document.body.style.backgroundSize = "";
      document.body.style.backgroundPosition = "";
      document.body.style.backgroundRepeat = "";
    }
  }, [wallpaper]);

  // Must be above the isMobile early return to satisfy Rules of Hooks
  useEffect(() => {
    if (isMobile) return;
    const closeMenu = () => setContextMenu(null);
    document.addEventListener("click", closeMenu);
    return () => document.removeEventListener("click", closeMenu);
  }, [isMobile]);

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setWallpaperLoading(true);
    setContextMenu(null);
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        localStorage.setItem("wallpaper", ev.target.result);
        setWallpaper(ev.target.result);
      } catch {
        alert("Image too large to save. Try a smaller file.");
      } finally {
        setWallpaperLoading(false);
        e.target.value = "";
      }
    };
    reader.readAsDataURL(file);
  };

  const [windows, setWindows] = useState(
    () =>
      loadSavedWindows() ?? [
        { id: crypto.randomUUID(), position: getInitialPosition(0), name: "Izak Bunda" },
      ]
  );
  const [minimizedWindows, setMinimizedWindows] = useState([]);
  const [zMap, setZMap] = useState({});
  const zCounter = useRef(10);
  const cascadeIndex = useRef(0);

  const files = ["Izak Bunda", "Resumé", "Projects", "Internships", "Izak AI", "Photography"];

  // Persist open windows + positions so they're restored on the next visit.
  useEffect(() => {
    if (isMobile) return;
    try {
      const toSave = windows.map(({ name, position, initialSize, resizable }) => ({
        name,
        position,
        initialSize,
        resizable,
      }));
      localStorage.setItem(WINDOWS_STORAGE_KEY, JSON.stringify(toSave));
    } catch {
      // Ignore storage failures (e.g. private browsing quota) — non-critical.
    }
  }, [windows, isMobile]);

  const addWindow = (name, initialSize, resizable = true) => {
    if (windows.some((w) => w.name === name)) return;

    trackEvent("view", name);

    const clickSound = new Audio("/click.mp3");
    clickSound.play();

    const cascadeBaseX = window.innerWidth * 0.15;
    const maxX = window.innerWidth * 0.5;
    const maxY = window.innerHeight - 200;
    const offset = cascadeIndex.current * CASCADE_STEP;
    if (cascadeBaseX + offset > maxX || CASCADE_BASE_Y + offset > maxY) {
      cascadeIndex.current = 0;
    }
    const finalOffset = cascadeIndex.current * CASCADE_STEP;
    cascadeIndex.current++;

    // Clamp spawn position so the window never starts off-screen
    const winW = initialSize?.width ?? Math.max(770, Math.floor(window.innerWidth * 0.5));
    const winH = initialSize?.height ?? Math.floor(window.innerHeight * 0.8);
    const MENU_BAR_H = 30;
    const DOCK_H = 72;
    const spawnX = Math.min(cascadeBaseX + finalOffset, Math.max(0, window.innerWidth - winW));
    const spawnY = Math.min(CASCADE_BASE_Y + finalOffset, Math.max(MENU_BAR_H, window.innerHeight - DOCK_H - winH));

    const newWindow = {
      id: crypto.randomUUID(),
      position: { x: spawnX, y: spawnY },
      name,
      initialSize,
      resizable,
    };
    setWindows((prev) => [...prev, newWindow]);
    setZMap((prev) => ({ ...prev, [newWindow.id]: ++zCounter.current }));
  };

  const removeWindow = (id) => {
    setWindows((prev) => prev.filter((w) => w.id !== id));
    setMinimizedWindows((prev) => prev.filter((wId) => wId !== id));
  };

  const updateWindowPosition = (id, position) => {
    setWindows((prev) => prev.map((w) => w.id === id ? { ...w, position } : w));
  };

  const updateWindowSize = (id, size) => {
    setWindows((prev) => prev.map((w) => w.id === id ? { ...w, initialSize: size } : w));
  };

  const selectWindow = (id) => {
    setZMap((prev) => ({ ...prev, [id]: ++zCounter.current }));
  };

  const addWindowRef = useRef(addWindow);
  useEffect(() => { addWindowRef.current = addWindow; });

  useEffect(() => {
    const handler = (e) => {
      if (isMobile) {
        trackEvent("view", e.detail);
        setActiveApp(e.detail);
      } else {
        addWindowRef.current(e.detail);
      }
    };
    window.addEventListener("open-window", handler);
    return () => window.removeEventListener("open-window", handler);
  }, [isMobile]);

  const minimizeWindow = (id) => {
    if (!minimizedWindows.includes(id)) {
      setMinimizedWindows((prev) => [...prev, id]);
    }
  };

  const restoreWindow = (id) => {
    setMinimizedWindows((prev) => prev.filter((wId) => wId !== id));
    setZMap((prev) => ({ ...prev, [id]: ++zCounter.current }));
  };

  const openMobileApp = (name) => {
    trackEvent("view", name);
    setActiveApp(name);
  };

  const mobileDock = [
    { name: "Izak Bunda", onClick: () => openMobileApp("Izak Bunda") },
    { name: "Resumé", onClick: () => openMobileApp("Resumé") },
    { name: "Projects", onClick: () => openMobileApp("Projects") },
    { name: "Internships", onClick: () => openMobileApp("Internships") },
    { name: "Izak AI", onClick: () => openMobileApp("Izak AI") },
    { name: "Photography", onClick: () => openMobileApp("Photography") },
    { name: "Github", link: "https://www.github.com/izakbunda" },
    { name: "Linkedin", link: "https://www.linkedin.com/in/izakbunda" },
  ];

  const [keyboardOpen, setKeyboardOpen] = useState(false);

  useEffect(() => {
    if (!isMobile) return;

    // Make the layout track the visual viewport on both axes. On iOS the
    // keyboard doesn't resize the layout viewport — it shrinks the *visual*
    // viewport and, when the page can't scroll, pans it (offsetTop > 0) to
    // keep the focused input visible. We mirror that pan with a translate and
    // size to the visible height so the window always fills the area above the
    // keyboard with no ghost gap and no apparent scroll. Keyboard open/close is
    // driven solely by the focus events below.
    const syncViewport = () => {
      const vv = window.visualViewport;
      const h = vv?.height ?? window.innerHeight;
      const top = vv?.offsetTop ?? 0;
      document.documentElement.style.setProperty("--vh", `${h}px`);
      document.documentElement.style.setProperty("--vv-top", `${top}px`);
    };
    syncViewport();
    window.visualViewport?.addEventListener("resize", syncViewport);
    window.visualViewport?.addEventListener("scroll", syncViewport);
    window.addEventListener("resize", syncViewport);

    const onFocusIn  = (e) => { if (e.target.matches("input, textarea")) setKeyboardOpen(true); };
    const onFocusOut = (e) => { if (e.target.matches("input, textarea")) setKeyboardOpen(false); };
    document.addEventListener("focusin",  onFocusIn);
    document.addEventListener("focusout", onFocusOut);

    return () => {
      window.visualViewport?.removeEventListener("resize", syncViewport);
      window.visualViewport?.removeEventListener("scroll", syncViewport);
      window.removeEventListener("resize", syncViewport);
      document.removeEventListener("focusin",  onFocusIn);
      document.removeEventListener("focusout", onFocusOut);
    };
  }, [isMobile]);

  if (isMobile) {
    return (
      <div className="mobile-layout">
        <MenuBar onShowBanner={() => setBannerDismissed(false)} />
        {!bannerDismissed && <MobileBanner onDismiss={() => setBannerDismissed(true)} />}
        <div className={`mobile-content${bannerDismissed ? " banner-dismissed" : ""}${keyboardOpen ? " keyboard-open" : ""}`}>
          {activeApp && (
            <Window
              ref={mobileWindowRef}
              name={activeApp}
              onClose={() => {}}
              onMin={() => {}}
              onFullscreen={() => {}}
              isFullscreen={true}
              isMobile={true}
            />
          )}
        </div>
        {!keyboardOpen && <Dock mobileDock={mobileDock} />}
      </div>
    );
  }

  const handleDesktopContextMenu = (e) => {
    if (e.target !== e.currentTarget) return;
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  return (
    <div className="desktop" onContextMenu={handleDesktopContextMenu}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={handleFile}
      />
      {wallpaperLoading && (
        <div className="wallpaper-loading-toast">
          <span className="wallpaper-loading-spinner" />
          Applying wallpaper…
        </div>
      )}
      <MenuBar onOpenEasterEggs={() => addWindow("Easter Eggs", { width: 380, height: 310 }, false)} />
      <div className="files-container">
        {files.map((file) => (
          <File key={file} name={file} onClick={addWindow} />
        ))}
      </div>
      <Dock windows={windows.filter((w) => w.name !== "Easter Eggs")} onClick={restoreWindow} />
      <div className="window-layer">
        {windows.map((w) => (
          <DraggableWindow
            key={w.id}
            id={w.id}
            name={w.name}
            position={w.position}
            initialSize={w.initialSize}
            resizable={w.resizable ?? true}
            onRemove={removeWindow}
            onUpdatePosition={updateWindowPosition}
            onUpdateSize={updateWindowSize}
            onSelect={selectWindow}
            onMinimize={minimizeWindow}
            zIndex={zMap[w.id] ?? 1}
            isMinimized={minimizedWindows.includes(w.id)}
            isMobile={false}
          />
        ))}
      </div>
      {contextMenu && (
        <WallpaperMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
          onChangeWallpaper={() => {
            setContextMenu(null);
            fileInputRef.current.click();
          }}
          onResetWallpaper={() => {
            localStorage.removeItem("wallpaper");
            setWallpaper(null);
            setContextMenu(null);
          }}
        />
      )}
    </div>
  );
}

export default HomePage;

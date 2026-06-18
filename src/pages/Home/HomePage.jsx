import { useEffect, useRef, useState } from "react";
import Window from "../../components/Window/Window";
import File from "../../components/File/File";
import MenuBar from "../../components/MenuBar/MenuBar";
import Dock from "../../components/Dock/Dock";

function DraggableWindow({ id, position, name, onRemove, onUpdatePosition, onSelect, onMinimize, zIndex, isMinimized }) {
  const windowRef = useRef(null);
  const headerRef = useRef(null);
  const isClicked = useRef(false);
  const coords = useRef({ startX: 0, startY: 0, lastX: position.x, lastY: position.y });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const isFullscreenRef = useRef(false);

  const toggleFullscreen = () => {
    setIsFullscreen((prev) => {
      isFullscreenRef.current = !prev;
      return !prev;
    });
    onSelect(id);
  };

  useEffect(() => {
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
      if (!isClicked.current) return;
      isClicked.current = false;
      coords.current.lastX = windowEl.offsetLeft;
      coords.current.lastY = windowEl.offsetTop;
      onUpdatePosition(id, { x: coords.current.lastX, y: coords.current.lastY });
    };

    const onMouseMove = (e) => {
      if (!isClicked.current) return;
      const rawX = (e.clientX ?? e.touches?.[0].clientX) - coords.current.startX + coords.current.lastX;
      const rawY = (e.clientY ?? e.touches?.[0].clientY) - coords.current.startY + coords.current.lastY;
      const MENU_BAR_H = 30;
      const DOCK_H = 72;
      const maxX = window.innerWidth - windowEl.offsetWidth;
      const maxY = window.innerHeight - DOCK_H - windowEl.offsetHeight;
      const nextX = Math.max(0, Math.min(rawX, maxX));
      const nextY = Math.max(MENU_BAR_H, Math.min(rawY, maxY));
      windowEl.style.left = `${nextX}px`;
      windowEl.style.top = `${nextY}px`;
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
  }, [id, onUpdatePosition, onSelect]);

  if (isMinimized) return null;

  const wrapperStyle = isFullscreen
    ? { position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", zIndex: 99999 }
    : { top: `${position.y}px`, left: `${position.x}px`, position: "absolute", zIndex };

  return (
    <div ref={windowRef} onMouseDown={() => !isFullscreen && onSelect(id)} style={wrapperStyle}>
      <Window
        ref={headerRef}
        name={name}
        onClose={() => onRemove(id)}
        onMin={() => onMinimize(id)}
        onFullscreen={toggleFullscreen}
        isFullscreen={isFullscreen}
      />
    </div>
  );
}

function HomePage() {
  const [windows, setWindows] = useState([
    { id: Date.now() + 1, position: { x: 150, y: 40 }, name: "Resumé" },
    { id: Date.now(), position: { x: 170, y: 80 }, name: "Izak Bunda" },
  ]);
  const [minimizedWindows, setMinimizedWindows] = useState([]);
  const [zMap, setZMap] = useState({});
  const zCounter = useRef(10);

  const addWindow = (name) => {
    if (windows.some((w) => w.name === name)) return;

    const clickSound = new Audio("/click.mp3");
    clickSound.play();

    const getRandomPosition = (minX, maxX, minY, maxY) => ({
      x: Math.floor(Math.random() * (maxX - minX + 1)) + minX,
      y: Math.floor(Math.random() * (maxY - minY + 1)) + minY,
    });

    const newPosition = window.innerWidth <= 500
      ? getRandomPosition(10, 100, 10, 100)
      : getRandomPosition(200, 400, 50, 100);

    const newWindow = { id: Date.now(), position: newPosition, name };
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

  const selectWindow = (id) => {
    setZMap((prev) => ({ ...prev, [id]: ++zCounter.current }));
  };

  const minimizeWindow = (id) => {
    if (!minimizedWindows.includes(id)) {
      setMinimizedWindows((prev) => [...prev, id]);
    }
  };

  const restoreWindow = (id) => {
    setMinimizedWindows((prev) => prev.filter((wId) => wId !== id));
    setZMap((prev) => ({ ...prev, [id]: ++zCounter.current }));
  };

  const files = ["Izak Bunda", "Resumé", "Projects", "Internships"];

  return (
    <div>
      <MenuBar />
      <div className="files-container">
        {files.map((file) => (
          <File key={file} name={file} onClick={addWindow} />
        ))}
      </div>
      <Dock windows={windows} onClick={restoreWindow} />
      <div className="window-layer">
        {windows.map((w) => (
          <DraggableWindow
            key={w.id}
            id={w.id}
            name={w.name}
            position={w.position}
            onRemove={removeWindow}
            onUpdatePosition={updateWindowPosition}
            onSelect={selectWindow}
            onMinimize={minimizeWindow}
            zIndex={zMap[w.id] ?? 1}
            isMinimized={minimizedWindows.includes(w.id)}
          />
        ))}
      </div>
    </div>
  );
}

export default HomePage;

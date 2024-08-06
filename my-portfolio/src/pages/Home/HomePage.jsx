import React, { useEffect, useRef, useState } from "react";
import Window from "../../components/Window/Window";
import File from "../../components/File/File";
import MenuBar from "../../components/MenuBar/MenuBar";
import Dock from "../../components/Dock/Dock";

function DraggableWindow({
  id,
  position,
  name,
  onRemove,
  onUpdatePosition,
  onSelect,
  onMinimize,
  isActive,
  isMinimized,
}) {
  const windowRef = useRef(null);
  const isClicked = useRef(false);
  const coords = useRef({
    startX: 0,
    startY: 0,
    lastX: position.x,
    lastY: position.y,
  });

  useEffect(() => {
    if (!windowRef.current) return;

    const windowElement = windowRef.current;

    const onMouseDown = (e) => {
      isClicked.current = true;
      coords.current.startX = e.clientX;
      coords.current.startY = e.clientY;
      onSelect(id); // Mark this window as active
    };

    const onMouseUp = (e) => {
      isClicked.current = false;
      coords.current.lastX = windowElement.offsetLeft;
      coords.current.lastY = windowElement.offsetTop;
      onUpdatePosition(id, {
        x: coords.current.lastX,
        y: coords.current.lastY,
      });
    };

    const onMouseMove = (e) => {
      if (!isClicked.current) return;

      const nextX = e.clientX - coords.current.startX + coords.current.lastX;
      const nextY = e.clientY - coords.current.startY + coords.current.lastY;

      windowElement.style.top = `${nextY}px`;
      windowElement.style.left = `${nextX}px`;
    };

    windowElement.addEventListener("mousedown", onMouseDown);
    windowElement.addEventListener("mouseup", onMouseUp);
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseleave", onMouseUp);

    return () => {
      windowElement.removeEventListener("mousedown", onMouseDown);
      windowElement.removeEventListener("mouseup", onMouseUp);
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseleave", onMouseUp);
    };
  }, [id, onUpdatePosition, onSelect]);

  if (isMinimized) {
    return null;
  }

  return (
    <div
      ref={windowRef}
      style={{
        top: `${position.y}px`,
        left: `${position.x}px`,
        position: "absolute",
        zIndex: isActive ? 1000 : 1,
      }}
    >
      <Window
        name={name}
        onClose={() => onRemove(id)}
        onMin={() => onMinimize(id)}
      />
    </div>
  );
}

function HomePage() {
  const [windows, setWindows] = useState([
    {
      id: Date.now() + 1,
      position: { x: 300, y: 30 },
      name: "Resumé",
    },
    {
      id: Date.now(),
      position: { x: 200, y: 70 },
      name: "Izak Bunda",
    },
    // {
    //   id: Date.now() + 1,
    //   position: { x: 300, y: 30 },
    //   name: "Projects",
    // },
    // {
    //   id: Date.now(),
    //   position: { x: 200, y: 70 },
    //   name: "Internships",
    // },
  ]);
  const [activeWindow, setActiveWindow] = useState(null);
  const [minimizedWindows, setMinimizedWindows] = useState([]);

  const containerRef = useRef(null);

  const addWindow = (name) => {
    if (windows.some((window) => window.name === name)) {
      console.log("A window with this name is already open.");
      // const clickSound = new Audio("/open.mov");
      // clickSound.play();
      return;
    }

    const clickSound = new Audio("/click.mp3");
    clickSound.play();

    const getRandomPosition = (minX, maxX, minY, maxY) => {
      const x = Math.floor(Math.random() * (maxX - minX + 1)) + minX;
      const y = Math.floor(Math.random() * (maxY - minY + 1)) + minY;
      return { x, y };
    };

    const newWindow = {
      id: Date.now(),
      position: getRandomPosition(200, 400, 50, 100),
      name,
    };
    setWindows((prevWindows) => [...prevWindows, newWindow]);
    setActiveWindow(newWindow.id);
  };

  const removeWindow = (id) => {
    setWindows((prevWindows) =>
      prevWindows.filter((window) => window.id !== id)
    );
    setMinimizedWindows((prevMinimized) =>
      prevMinimized.filter((window) => window.id !== id)
    );
  };

  const updateWindowPosition = (id, position) => {
    setWindows((prevWindows) =>
      prevWindows.map((window) =>
        window.id === id ? { ...window, position } : window
      )
    );
  };

  const selectWindow = (id) => {
    setActiveWindow(id);
  };

  const minimizeWindow = (id) => {
    if (!minimizedWindows.includes(id)) {
      setMinimizedWindows((prevMinimized) => [...prevMinimized, id]);
    }
  };

  const restoreWindow = (id) => {
    setMinimizedWindows((prevMinimized) =>
      prevMinimized.filter((windowId) => windowId !== id)
    );
    setActiveWindow(id);
  };

  const files = [
    "Izak Bunda",
    "Resumé",
    "Projects",
    "Internships",
    // "Club-Work",
  ];

  return (
    <div>
      <MenuBar style={{ zIndex: "1001" }} />
      <div style={{ position: "relative", zIndex: 1, left: "40px" }}>
        {files.map((file, index) => (
          <File
            key={file}
            name={file}
            style={{ top: `${40 + index * 140}px` }}
            onClick={addWindow}
          />
        ))}
      </div>
      <Dock windows={windows} onClick={restoreWindow} />
      <div
        ref={containerRef}
        style={{
          width: "1vw",
          height: "1vh",
          position: "relative",
        }}
      >
        {windows.map((window) => (
          <DraggableWindow
            name={window.name}
            key={window.id}
            id={window.id}
            position={window.position}
            onRemove={removeWindow}
            onUpdatePosition={updateWindowPosition}
            onSelect={selectWindow}
            onMinimize={minimizeWindow}
            isActive={activeWindow === window.id}
            isMinimized={minimizedWindows.includes(window.id)}
          />
        ))}
      </div>
    </div>
  );
}

export default HomePage;

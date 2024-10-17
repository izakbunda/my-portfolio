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
  /**
   * we need to set windowRef to null at first because it is not mounted to anything
   * after this component mounts - React will automatically set windowRef to the
   * DOM elements of the window
   *
   * This is why we can call windowRef.current later - to access the current DOM elements
   * of the window and add and remove event listeners to and from it
   */
  const windowRef = useRef(null);

  /**
   * isClicked and coords are not targetting DOM elements, but it is still good practice
   * to use them in this way since using useState or another hook to persist these variables
   * will cause them to re-render at every update.
   *
   * The nature of coords especially would be horrible if we use useState because the values
   * of this state could changes hundreds of times in just one dragging motion of the window.
   *
   * In terms of isClicked -- sure, we could store this in a useState, however, we are also constantly
   * changing the value of this variable with the onMouseDown and onMouseUp functions.
   * If isClicked is using useState - it would trigger a re-render and that would be bad
   * Imagine if the window re-rendered every time we clicked it. Bad.
   */
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
      // e.preventDefault();
      isClicked.current = true;
      coords.current.startX = e.clientX || e.touches[0].clientX;
      coords.current.startY = e.clientY || e.touches[0].clientY;
      onSelect(id); // Mark this window as active
    };

    const onMouseUp = (e) => {
      // e.preventDefault();
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

      // e.preventDefault();
      const nextX =
        (e.clientX || e.touches[0].clientX) -
        coords.current.startX +
        coords.current.lastX;
      const nextY =
        (e.clientY || e.touches[0].clientY) -
        coords.current.startY +
        coords.current.lastY;

      windowElement.style.top = `${nextY}px`;
      windowElement.style.left = `${nextX}px`;
    };

    // Add event listeners for both mouse and touch events
    windowElement.addEventListener("mousedown", onMouseDown);
    windowElement.addEventListener("touchstart", onMouseDown);

    windowElement.addEventListener("mouseup", onMouseUp);
    windowElement.addEventListener("touchend", onMouseUp);

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("touchmove", onMouseMove);

    document.addEventListener("mouseleave", onMouseUp);
    document.addEventListener("touchcancel", onMouseUp);

    return () => {
      // Remove event listeners for both mouse and touch events
      windowElement.removeEventListener("mousedown", onMouseDown);
      windowElement.removeEventListener("touchstart", onMouseDown);

      windowElement.removeEventListener("mouseup", onMouseUp);
      windowElement.removeEventListener("touchend", onMouseUp);

      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("touchmove", onMouseMove);

      document.removeEventListener("mouseleave", onMouseUp);
      document.removeEventListener("touchcancel", onMouseUp);
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
      position: { x: 150, y: 40 },
      name: "Resumé",
    },
    {
      id: Date.now(),
      position: { x: 170, y: 80 },
      name: "Izak Bunda",
    },
  ]);
  const [activeWindow, setActiveWindow] = useState(null);
  const [minimizedWindows, setMinimizedWindows] = useState([]);

  const containerRef = useRef(null);

  const addWindow = (name) => {
    if (windows.some((window) => window.name === name)) {
      console.log("A window with this name is already open.");
      return;
    }

    const clickSound = new Audio("/click.mp3");
    clickSound.play();

    const getRandomPosition = (minX, maxX, minY, maxY) => {
      const x = Math.floor(Math.random() * (maxX - minX + 1)) + minX;
      const y = Math.floor(Math.random() * (maxY - minY + 1)) + minY;
      return { x, y };
    };

    let newPosition;
    if (window.innerWidth <= 500) {
      // Smaller area for phone screens
      newPosition = getRandomPosition(10, 100, 10, 100);
    } else {
      // Default area for larger screens
      newPosition = getRandomPosition(200, 400, 50, 100);
    }

    const newWindow = {
      id: Date.now(),
      position: newPosition,
      name,
    };

    setWindows((prevWindows) => [...prevWindows, newWindow]); // this is just you append to a state that is an array
    setActiveWindow(newWindow.id);
  };

  const removeWindow = (id) => {
    setWindows(
      (prevWindows) => prevWindows.filter((window) => window.id !== id) // and this is how you remove an item from a state that is an arary
    );
    setMinimizedWindows((prevMinimized) =>
      prevMinimized.filter((window) => window.id !== id)
    );
  };

  const updateWindowPosition = (id, position) => {
    /**
     * this is how you update a state that is an array
     * the format might be making it more confusing but basically the inside returns an array
     * 
     * const newArray = prevWindows.map((window) =>
      window.id === id ? { ...window, position } : window)
     */
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
    setMinimizedWindows(
      (prevMinimized) => prevMinimized.filter((windowId) => windowId !== id) // keep everything but the matching id
    );
    setActiveWindow(id); // then set that one as the active
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

      <div className="files-container">
        {files.map((file, index) => (
          <File key={file} name={file} onClick={addWindow} />
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

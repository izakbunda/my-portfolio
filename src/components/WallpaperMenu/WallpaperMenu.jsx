import { useEffect } from "react";
import "./WallpaperMenu.css";

// Desktop right-click menu: icon arrangement + wallpaper.
const WallpaperMenu = ({ x, y, onClose, onChangeWallpaper, onResetWallpaper, snapToGrid, onToggleGrid, onCleanUp }) => {
  const clampedX = Math.min(x, window.innerWidth - 190);
  const clampedY = Math.min(y, window.innerHeight - 150);

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="wallpaper-menu" style={{ top: clampedY, left: clampedX }}>
      <div className="wallpaper-menu-item" onClick={onToggleGrid}>
        <span className="wallpaper-menu-check">{snapToGrid ? "✓" : ""}</span>
        Snap to Grid
      </div>
      <div className="wallpaper-menu-item" onClick={onCleanUp}>
        <span className="wallpaper-menu-check" />
        Clean Up
      </div>
      <div className="wallpaper-menu-divider" />
      <div className="wallpaper-menu-item" onClick={onChangeWallpaper}>
        <span className="wallpaper-menu-check" />
        Change Wallpaper
      </div>
      <div className="wallpaper-menu-divider" />
      <div className="wallpaper-menu-item" onClick={onResetWallpaper}>
        <span className="wallpaper-menu-check" />
        Reset to Default
      </div>
    </div>
  );
};

export default WallpaperMenu;

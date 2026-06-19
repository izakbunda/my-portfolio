import { useEffect } from "react";
import "./WallpaperMenu.css";

const WallpaperMenu = ({ x, y, onClose, onChangeWallpaper, onResetWallpaper }) => {
  const clampedX = Math.min(x, window.innerWidth - 190);
  const clampedY = Math.min(y, window.innerHeight - 90);

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="wallpaper-menu" style={{ top: clampedY, left: clampedX }}>
      <div className="wallpaper-menu-item" onClick={onChangeWallpaper}>
        Change Wallpaper
      </div>
      <div className="wallpaper-menu-divider" />
      <div className="wallpaper-menu-item" onClick={onResetWallpaper}>
        Reset to Default
      </div>
    </div>
  );
};

export default WallpaperMenu;

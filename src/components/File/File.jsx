import { useState, useEffect } from "react";
import "./File.css";

const ICON_MAP = {
  "Izak Bunda": "/icons/profile.png",
  "Resumé": "/icons/resume.png",
  "Projects": "/icons/projects.png",
  "Internships": "/icons/internships.png",
  "Photography": "/icons/photography.png",
};

const File = ({ name, style, onClick, isActive }) => {
  const [blinking, setBlinking] = useState(false);

  useEffect(() => {
    if (name !== "Izak AI") return;
    let timeout;
    const schedule = () => {
      timeout = setTimeout(() => {
        setBlinking(true);
        timeout = setTimeout(() => {
          setBlinking(false);
          schedule();
        }, 150);
      }, 3000);
    };
    schedule();
    return () => clearTimeout(timeout);
  }, [name]);

  const src = name === "Izak AI"
    ? (blinking ? "/icons/blink.png" : "/icons/smile.png")
    : (ICON_MAP[name] ?? "/file.png");

  return (
    <div className={`file-container${isActive ? " file-active" : ""}`} style={style} onClick={() => onClick(name)}>
      <img src={src} className="desktop-icon" alt={name} />
      <div className="filename">{name}</div>
    </div>
  );
};

export default File;

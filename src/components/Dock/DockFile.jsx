import { useState, useEffect } from "react";
import "./DockFile.css";
import { trackEvent } from "../../lib/metrics";

const ICON_MAP = {
  "Izak Bunda": "/icons/profile.png",
  "Resumé": "/icons/resume.png",
  "Projects": "/icons/projects.png",
  "Internships": "/icons/internships.png",
  "Photography": "/icons/photography.png",
  "Github": "/icons/github.png",
  "Linkedin": "/icons/linkedin.png",
};

const DockFile = ({ name, onClick, link }) => {
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

  const handleClick = () => {
    const clickSound = new Audio("/click.mp3");
    clickSound.play();
    if (link) trackEvent("link_click", name);
    onClick?.();
  };

  return (
    <div className="dockfile-container" onClick={handleClick}>
      <a target="_blank" rel="noopener noreferrer" href={link}>
        <img src={src} className="icon" alt={name} style={name === "Github" ? { height: "34px" } : undefined} />
      </a>
      <p className="dockfile-label">{name}</p>
    </div>
  );
};

export default DockFile;

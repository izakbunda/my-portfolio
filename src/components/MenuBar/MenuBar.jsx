import { useEffect, useState } from "react";
import "./MenuBar.css";
import ContextMenu from "./ContextMenu";

const MenuBar = () => {
  const [currentTime, setCurrentTime] = useState("");
  const [aboutContext, setAboutContext] = useState(false);

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const options = {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "numeric",
      };
      setCurrentTime(now.toLocaleDateString("en-US", options).replace(",", ""));
    };
    const timerId = setInterval(updateClock, 1000);
    updateClock();
    return () => clearInterval(timerId);
  }, []);

  const handleAbout = () => {
    const clickSound = new Audio("/click.mp3");
    clickSound.play();
    setAboutContext((prev) => !prev);
  };

  return (
    <div className="container">
      <div className="left-menu">
        <img
          src="/logo.png"
          alt="logo"
          className="menu-logo"
          onClick={handleAbout}
        />
        <div className="left-icons" onClick={handleAbout}>About</div>
      </div>
      {aboutContext && <ContextMenu />}
      <div className="right-menu">{currentTime}</div>
    </div>
  );
};

export default MenuBar;

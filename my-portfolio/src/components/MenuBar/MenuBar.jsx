import React, { useEffect, useState, useRef } from "react";
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
      const formattedTime = now
        .toLocaleDateString("en-US", options)
        .replace(",", "");
      setCurrentTime(formattedTime);
    };

    const timerId = setInterval(updateClock, 1000);
    updateClock();

    return () => clearInterval(timerId);
  }, []);

  const handleClick = (name) => {
    const clickSound = new Audio("/click.mp3");
    clickSound.play();

    if (name === "About") {
      setAboutContext((prev) => !prev);
    }
  };

  return (
    <div className="container">
      <div className="left-menu">
        <img
          src="/logo.png"
          alt="logo"
          style={{
            padding: "4px 7px 4px 7px",
            marginRight: "5px",
            cursor: "pointer",
          }}
          onClick={handleClick}
        />
        <div className="left-icons" onClick={() => handleClick("About")}>
          About
        </div>
        <div className="left-icons" onClick={() => handleClick("About")}>
          Settings
        </div>
      </div>

      {/* {aboutContext && <ContextMenu />} */}

      <div className="right-menu">{currentTime}</div>
    </div>
  );
};

export default MenuBar;

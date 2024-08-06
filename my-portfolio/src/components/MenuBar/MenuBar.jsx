import React, { useEffect, useState } from "react";
import "./MenuBar.css";

const MenuBar = () => {
  const [currentTime, setCurrentTime] = useState("");

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

  const handleClick = () => {
    const clickSound = new Audio("/click.mp3");
    clickSound.play();
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
        <div className="left-icons" onClick={handleClick}>
          File
        </div>
        <div className="left-icons" onClick={handleClick}>
          Edit
        </div>
        <div className="left-icons" onClick={handleClick}>
          View
        </div>
        <div className="left-icons" onClick={handleClick}>
          Go
        </div>
        <div className="left-icons" onClick={handleClick}>
          Help
        </div>
      </div>
      <div className="right-menu">{currentTime}</div>
    </div>
  );
};

export default MenuBar;

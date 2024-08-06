import React, { forwardRef } from "react";
import ListContent from "../ListContent/ListContent";
import Profile from "../Profile/Profile";
import Resume from "../Resume/Resume";
import Body from "../Body/Body";

import "./Window.css";

const Window = forwardRef(({ name, onClose, onMin }, ref) => {
  const handleClick = () => {
    // const clickSound = new Audio("/public/click.mp3");
    // clickSound.play();
    onClose();
  };

  const handleMinimize = () => {
    const clickSound = new Audio("/public/click.mp3");
    clickSound.play();
    onMin();
  };

  return (
    <div ref={ref} style={{ position: "absolute" }}>
      <div className="window-container">
        <div className="header">
          <div className="window-name">{name}</div>
          <div className="close-button-temp" onClick={handleClick}></div>
          <div className="minimize-button-temp" onClick={handleMinimize}></div>
        </div>
        <div className="sub-header">
          <div style={{ top: ".4rem", left: "10px", position: "absolute" }}>
            1 item
          </div>
          <div
            style={{
              top: ".4rem",
              left: "50%",
              transform: "translateX(-50%)",
              position: "absolute",
            }}
          >
            500 words
          </div>
          <div style={{ top: ".4rem", right: "10px", position: "absolute" }}>
            300 words left
          </div>
        </div>
        <div className="body">
          {name === "Izak Bunda" ? (
            <Profile />
          ) : name === "Resumé" ? (
            <Resume />
          ) : (
            <Body name={name} />
          )}
        </div>
      </div>
    </div>
  );
});

export default Window;

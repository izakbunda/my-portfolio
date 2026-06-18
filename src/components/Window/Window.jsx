import { forwardRef } from "react";
import Profile from "../Profile/Profile";
import Resume from "../Resume/Resume";
import Body from "../Body/Body";
import "./Window.css";

const Window = forwardRef(({ name, onClose, onMin, onFullscreen, isFullscreen, isMobile }, ref) => {
  const handleMinimize = () => {
    const clickSound = new Audio("/click.mp3");
    clickSound.play();
    onMin();
  };

  return (
    <div className={`window-container${isFullscreen ? " window-fullscreen" : ""}`}>
      <div className="header" ref={ref}>
        <div className="window-name">{name}</div>
        {!isMobile && (
          <>
            <div className="close-button-temp" onClick={onClose}></div>
            <div className={`minimize-button-temp${isFullscreen ? " button-disabled" : ""}`} onClick={isFullscreen ? undefined : handleMinimize}></div>
            <div className="fullscreen-button-temp" onClick={onFullscreen}></div>
          </>
        )}
      </div>
      <div className="sub-header"></div>
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
  );
});

export default Window;

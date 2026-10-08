import { forwardRef, useState } from "react";
import Profile from "../Profile/Profile";
import Resume from "../Resume/Resume";
import Body from "../Body/Body";
import EasterEggs from "../EasterEggs/EasterEggs";
import Chat from "../Chat/Chat";
import Gallery from "../Gallery/Gallery";
import "./Window.css";
import "../AiGlow/AiGlow.css";

const Window = forwardRef(({ name, onClose, onMin, onFullscreen, isFullscreen, isMobile }, ref) => {
  const [aiThinking, setAiThinking] = useState(false);
  const isAi = name === "Izak AI";

  const handleMinimize = () => {
    const clickSound = new Audio("/click.mp3");
    clickSound.play();
    onMin();
  };

  return (
    <div className={`window-container${isFullscreen ? " window-fullscreen" : ""}${isAi ? " ai-glow-window" : ""}${isAi && aiThinking ? " ai-thinking" : ""}`}>
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
        ) : name === "Izak AI" ? (
          <Chat onStreamingChange={setAiThinking} />
        ) : name === "Easter Eggs" ? (
          <EasterEggs />
        ) : name === "Photography" ? (
          <Gallery />
        ) : (
          <Body name={name} />
        )}
      </div>
    </div>
  );
});

export default Window;

import React from "react";
import "./DockFile.css";

const DockFile = ({ name, onClick, link }) => {
  const handleClick = () => {
    const clickSound = new Audio("../../src/assets/click.mp3");
    clickSound.play();

    onClick();
  };
  return (
    <div className="dockfile-container" onClick={handleClick}>
      <a target="_blank" rel="noopener noreferrer" href={link}>
        <img src="../../src/assets/file.png" className="icon" alt={name} />
      </a>
      <p style={{ fontSize: "0.5rem", marginTop: "5px" }}>{name}</p>
    </div>
  );
};

export default DockFile;

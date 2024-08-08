import React from "react";
import "./File.css";

const File = ({ name, style, onClick }) => {
  const handleClick = () => {
    onClick(name);
  };
  return (
    <div className="file-container" style={style} onClick={handleClick}>
      <img src="/file.png" className="desktop-icon" alt={name} />
      <div className="filename">{name}</div>
    </div>
  );
};

export default File;

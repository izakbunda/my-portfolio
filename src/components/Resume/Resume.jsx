import React from "react";
import "./Resume.css";

const Resume = () => {
  return (
    <div className="resume-container">
      <div className="download-link-container">
        <a
          href="https://drive.google.com/file/d/1mo-dBuWk_-9XBq3mPkFX6mn0h2dX0AOj/view?usp=sharing"
          className="download-link"
          target="_blank"
          rel="noopener noreferrer"
        >
          Download Resume
        </a>
      </div>

      <iframe
        src="https://drive.google.com/file/d/1mo-dBuWk_-9XBq3mPkFX6mn0h2dX0AOj/preview"
        className="resume-iframe"
        title="Resume"
      />
    </div>
  );
};

export default Resume;

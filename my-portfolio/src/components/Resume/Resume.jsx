import React from "react";
import "./Resume.css";

const Resume = () => {
  return (
    <div className="resume-container">
      <div className="download-link-container">
        <a
          href="https://drive.google.com/uc?export=download&id=1yUD54t4HnGwMsjMdNWnev3nZCsW8w3t4"
          className="download-link"
          download
        >
          Download Resume
        </a>
      </div>

      <iframe
        src="https://drive.google.com/file/d/1yUD54t4HnGwMsjMdNWnev3nZCsW8w3t4/preview?usp=sharing"
        className="resume-iframe"
        title="Resume"
      />
    </div>
  );
};

export default Resume;

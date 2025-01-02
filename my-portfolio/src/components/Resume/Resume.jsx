import React from "react";
import "./Resume.css";

const Resume = () => {
  return (
    <div className="resume-container">
      <div className="download-link-container">
        <a
          href="https://drive.google.com/file/d/110NCCYUz4tEqggGPKPVwG2oogLQVeb97/view?usp=sharing"
          className="download-link"
          download
        >
          Download Resume
        </a>
      </div>

      <iframe
        src="https://drive.google.com/file/d/110NCCYUz4tEqggGPKPVwG2oogLQVeb97/view?usp=sharing"
        className="resume-iframe"
        title="Resume"
      />
    </div>
  );
};

export default Resume;

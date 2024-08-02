import React from "react";
import "./Resume.css";

const Resume = () => {
  return (
    <div className="resume-container">
      <iframe
        src="../../src/assets/izak_bunda_resume.pdf"
        className="resume-iframe"
        title="Resume"
      />
    </div>
  );
};

export default Resume;

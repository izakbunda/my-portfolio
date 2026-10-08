import React from "react";
import "./Resume.css";
import { trackEvent } from "../../lib/metrics";

const Resume = () => {
  return (
    <div className="resume-container">
      <div className="download-link-container">
        <a
          href="https://drive.google.com/file/d/1_c5Qknz4_6FVi1zxfPCIpmfupVsK-QYT/view?usp=sharing"
          className="download-link"
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackEvent("resume_click", "resume")}
        >
          Download Resume
        </a>
      </div>

      <iframe
        src="https://drive.google.com/file/d/1_c5Qknz4_6FVi1zxfPCIpmfupVsK-QYT/preview"
        className="resume-iframe"
        title="Resume"
      />
    </div>
  );
};

export default Resume;

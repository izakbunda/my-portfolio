import "./File.css";

const ICON_MAP = {
  "Izak Bunda": "/icons/profile.png",
  "Resumé": "/icons/resume.png",
  "Projects": "/icons/projects.png",
  "Internships": "/icons/internships.png",
};

const File = ({ name, style, onClick, isActive }) => (
  <div className={`file-container${isActive ? " file-active" : ""}`} style={style} onClick={() => onClick(name)}>
    <img src={ICON_MAP[name] ?? "/file.png"} className="desktop-icon" alt={name} />
    <div className="filename">{name}</div>
  </div>
);

export default File;

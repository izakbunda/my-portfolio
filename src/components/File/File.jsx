import "./File.css";

const ICON_MAP = {
  "Izak Bunda": "/icons/person.svg",
  "Resumé": "/icons/resume.svg",
  "Projects": "/icons/projects.svg",
  "Internships": "/icons/internships.svg",
};

const File = ({ name, style, onClick }) => (
  <div className="file-container" style={style} onClick={() => onClick(name)}>
    <img src={ICON_MAP[name] ?? "/file.png"} className="desktop-icon" alt={name} />
    <div className="filename">{name}</div>
  </div>
);

export default File;

import "./DockFile.css";

const ICON_MAP = {
  "Izak Bunda": "/icons/profile.png",
  "Resumé": "/icons/resume.png",
  "Projects": "/icons/projects.png",
  "Internships": "/icons/internships.png",
  "Github": "/icons/github.png",
  "Linkedin": "/icons/linkedin.png",
};

const DockFile = ({ name, onClick, link }) => {
  const handleClick = () => {
    const clickSound = new Audio("/click.mp3");
    clickSound.play();
    onClick?.();
  };

  return (
    <div className="dockfile-container" onClick={handleClick}>
      <a target="_blank" rel="noopener noreferrer" href={link}>
        <img src={ICON_MAP[name] ?? "/file.png"} className="icon" alt={name} style={name === "Github" ? { height: "34px" } : undefined} />
      </a>
      <p className="dockfile-label">{name}</p>
    </div>
  );
};

export default DockFile;

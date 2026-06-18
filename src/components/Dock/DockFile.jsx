import "./DockFile.css";

const ICON_MAP = {
  "Izak Bunda": "/icons/person.svg",
  "Resumé": "/icons/resume.svg",
  "Projects": "/icons/projects.svg",
  "Internships": "/icons/internships.svg",
  "Github": "/icons/github.svg",
  "Linkedin": "/icons/linkedin.svg",
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
        <img src={ICON_MAP[name] ?? "/file.png"} className="icon" alt={name} />
      </a>
      <p className="dockfile-label">{name}</p>
    </div>
  );
};

export default DockFile;

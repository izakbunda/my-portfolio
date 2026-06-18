import "./Dock.css";
import DockFile from "./DockFile";

const Dock = ({ windows, onClick, mobileDock }) => (
  <div className="dock-container">
    {mobileDock ? (
      <div className="applications">
        {mobileDock.map((item) => (
          <DockFile key={item.name} name={item.name} link={item.link} onClick={item.onClick} />
        ))}
      </div>
    ) : (
      <>
        <div className="applications">
          <DockFile link="https://www.linkedin.com/in/izakbunda" name="Linkedin" />
          <DockFile link="https://www.github.com/izakbunda" name="Github" />
          {windows.length > 0 && <div className="dock-divider"></div>}
        </div>
        {windows.length > 0 && (
          <div className="open-windows">
            {windows.map((w) => (
              <DockFile key={w.id} name={w.name} onClick={() => onClick(w.id)} />
            ))}
          </div>
        )}
      </>
    )}
  </div>
);

export default Dock;

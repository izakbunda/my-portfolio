import "./Dock.css";
import DockFile from "./DockFile";

const Dock = ({ windows, onClick }) => {
  console.log(windows);

  return (
    <div className="dock-container">
      <div className="applications">
        {/* linkedin, github */}
        <DockFile
          link="https://www.linkedin.com/in/izakbunda"
          name={"Linkedin"}
        />
        <DockFile link="https://www.github.com/izakbunda" name={"Github"} />
        <div
          style={{
            height: "80%",
            borderRight: "1px solid black",
          }}
        ></div>
      </div>
      <div className="open-windows">
        {windows.map((window, index) => (
          <DockFile
            key={window.id}
            name={window.name}
            onClick={() => onClick(window.id)}
          />
        ))}
      </div>
    </div>
  );
};

export default Dock;

import "./EasterEggs.css";

const eggs = [
  { emoji: "🖼️", label: "Change the wallpaper", desc: "Right-click on the desktop background." },
  { emoji: "↔️", label: "Resize windows", desc: "Drag the edges or corners of any other window (not this one)." },
  { emoji: "✋", label: "Move windows", desc: "Drag any window by its title bar." },
  { emoji: "🟡", label: "Minimize", desc: "Click the yellow dot to send a window to the dock." },
  { emoji: "🟢", label: "Fullscreen", desc: "Click the green dot to maximize a window." },
  { emoji: "🔊", label: "Click sound", desc: "Every window you open plays a click." },
];

const EasterEggs = () => (
  <div className="easter-eggs">
    <p className="easter-eggs-intro">Hidden features you might have missed:</p>
    <ul className="easter-eggs-list">
      {eggs.map(({ emoji, label, desc }) => (
        <li key={label} className="easter-egg-item">
          <span className="easter-egg-emoji">{emoji}</span>
          <span>
            <strong>{label}</strong> — {desc}
          </span>
        </li>
      ))}
    </ul>
  </div>
);

export default EasterEggs;

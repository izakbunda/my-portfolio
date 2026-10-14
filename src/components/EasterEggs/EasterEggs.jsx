import "./EasterEggs.css";

const sections = [
  {
    title: "Desktop",
    eggs: [
      { emoji: "🗂️", label: "Rearrange the desktop", desc: "Drag the app icons anywhere. They stay where you leave them." },
      { emoji: "📐", label: "Snap to grid", desc: "Right-click the desktop to snap icons to a grid, or Clean Up to line them back up." },
      { emoji: "🖼️", label: "Change the wallpaper", desc: "Right-click the desktop background." },
    ],
  },
  {
    title: "Menu bar",
    eggs: [
      { emoji: "🔍", label: "Spotlight", desc: "Press ⌘K (Ctrl+K) to find any project, album or app, or to ask Izak AI." },
      { emoji: "🍎", label: "It follows the app", desc: "The menu bar changes with the window in front. Try Browse in Projects or Albums in Photography." },
      { emoji: "🔗", label: "Share any window", desc: "File > Share Link copies a link straight to what you're looking at." },
      { emoji: "🕐", label: "Izak's time", desc: "Click the clock to see what time it is for Izak in Denver." },
    ],
  },
  {
    title: "Windows",
    eggs: [
      { emoji: "✋", label: "Move & resize", desc: "Drag a title bar to move a window, or its edges and corners to resize (not this one)." },
      { emoji: "🪟", label: "Tile side by side", desc: "Window > Tile Side by Side puts your two front windows next to each other." },
      { emoji: "🟡", label: "Minimize & maximize", desc: "Yellow sends a window to the dock; green maximizes it." },
      { emoji: "💾", label: "Your desk is remembered", desc: "Open windows, sizes and positions come back on your next visit." },
      { emoji: "🔊", label: "Click sound", desc: "Every window you open plays a click." },
    ],
  },
  {
    title: "Izak AI",
    eggs: [
      { emoji: "😉", label: "It blinks", desc: "Watch the Izak AI icon for a few seconds." },
      { emoji: "✨", label: "Get close", desc: "Move your cursor near the Izak AI icon or the Chat with Izak AI button. It hums, and the glow follows you." },
      { emoji: "🌈", label: "It glows while it thinks", desc: "The chat window lights up while it writes an answer." },
      { emoji: "🪄", label: "It can open things", desc: "Ask about a project, an internship or the photos, then tap the buttons under its reply." },
      { emoji: "👀", label: "It sees your desk", desc: "Ask it what window you're looking at." },
    ],
  },
  {
    title: "Photos & links",
    eggs: [
      { emoji: "⌨️", label: "Flip through photos", desc: "Open a photo, then use ← and → (Esc closes it)." },
      { emoji: "🔗", label: "Every window has a link", desc: "The address bar follows the window in front. Share izakbunda.vercel.app/projects/libris and it opens right there." },
    ],
  },
];

const EasterEggs = () => (
  <div className="easter-eggs">
    <p className="easter-eggs-intro">Hidden features you might have missed:</p>
    {sections.map(({ title, eggs }) => (
      <section key={title} className="easter-eggs-section">
        <h3 className="easter-eggs-heading">{title}</h3>
        <ul className="easter-eggs-list">
          {eggs.map(({ emoji, label, desc }) => (
            <li key={label} className="easter-egg-item">
              <span className="easter-egg-emoji">{emoji}</span>
              <span>
                <strong>{label}</strong>: {desc}
              </span>
            </li>
          ))}
        </ul>
      </section>
    ))}
  </div>
);

export default EasterEggs;

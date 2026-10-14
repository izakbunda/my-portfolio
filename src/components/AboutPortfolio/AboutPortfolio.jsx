import "./AboutPortfolio.css";

// Apple menu > About This Portfolio: a retro "About This Mac".
/* global __BUILD_DATE__ */
const builtOn = (() => {
  try {
    return new Date(__BUILD_DATE__).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  } catch {
    return null;
  }
})();

const STACK = [
  ["Desktop", "React + Vite, hand-built window manager"],
  ["Izak AI", "FastAPI + LangGraph agent with RAG"],
  ["Data", "Supabase: Postgres, pgvector, Storage"],
  ["Hosting", "Vercel (site) + Railway (agent)"],
];

const AboutPortfolio = () => (
  <div className="about-portfolio">
    <img src="/logo.png" alt="" className="about-portfolio-logo" />
    <h2>Izak Bunda's Portfolio</h2>
    {builtOn && <p className="about-portfolio-version">Last updated {builtOn}</p>}
    <dl className="about-portfolio-specs">
      {STACK.map(([k, v]) => (
        <div key={k}>
          <dt>{k}</dt>
          <dd>{v}</dd>
        </div>
      ))}
    </dl>
    <div className="about-portfolio-actions">
      <a href="https://github.com/izakbunda/my-portfolio" target="_blank" rel="noopener noreferrer">
        View Source
      </a>
      <button onClick={() => window.dispatchEvent(new CustomEvent("open-window", { detail: "Easter Eggs" }))}>
        Easter Eggs
      </button>
    </div>
  </div>
);

export default AboutPortfolio;

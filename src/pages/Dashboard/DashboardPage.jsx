import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import UploadPanel from "./UploadPanel";
import ManagePanel from "./ManagePanel";
import MetricsPanel from "./MetricsPanel";
import ChatMetricsPanel from "./ChatMetricsPanel";
import AppearancePanel from "./AppearancePanel";
import KnowledgePanel from "./KnowledgePanel";
import "./DashboardPage.css";

function LoginForm({ onLoggedIn }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);
    if (signInError) {
      setError(signInError.message);
      return;
    }
    onLoggedIn(data.session);
  };

  return (
    <form className="dashboard-login-form" onSubmit={handleSubmit}>
      <h1>Dashboard Login</h1>
      <label>
        Email
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          required
        />
      </label>
      <label>
        Password
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
        />
      </label>
      {error && <div className="dashboard-login-error">{error}</div>}
      <button type="submit" disabled={loading}>
        {loading ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}

// Navigation: Usage is the home page; everything else lives in grouped menu
// sections. The page id is kept in the URL hash so a refresh stays put.
const NAV = [
  {
    group: "Overview",
    items: [{ id: "usage", label: "Usage", description: "Visitors, sessions and what people do on the site." }],
  },
  {
    group: "Izak AI",
    items: [
      { id: "knowledge", label: "Knowledge base", description: "What Izak AI knows: starter prompts, Q&A, documents and files." },
      { id: "chat", label: "Chat logs", description: "Conversations visitors have had with Izak AI." },
      { id: "appearance", label: "Appearance", description: "The Izak AI glow colors and the menu bar's contact status." },
    ],
  },
  {
    group: "Photography",
    items: [
      { id: "upload", label: "Upload photos", description: "Add photos to an album." },
      { id: "manage", label: "Albums & photos", description: "Organize, publish and edit albums." },
    ],
  },
];

const PAGES = Object.fromEntries(NAV.flatMap((g) => g.items.map((item) => [item.id, { ...item, group: g.group }])));
const pageFromHash = () => (PAGES[window.location.hash.slice(1)] ? window.location.hash.slice(1) : "usage");

function DashboardPage() {
  const [session, setSession] = useState(undefined); // undefined = loading
  const [page, setPage] = useState(pageFromHash);
  const [menuOpen, setMenuOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    document.body.classList.add("dashboard-mode");
    return () => document.body.classList.remove("dashboard-mode");
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });
    return () => subscription.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const onHash = () => setPage(pageFromHash());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const go = (id) => {
    setPage(id);
    setMenuOpen(false);
    window.history.replaceState(null, "", id === "usage" ? window.location.pathname : `#${id}`);
    window.scrollTo(0, 0);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  if (session === undefined) {
    return <div className="dashboard-page dashboard-loading">Loading...</div>;
  }

  if (!session) {
    return (
      <div className="dashboard-page">
        <LoginForm onLoggedIn={setSession} />
      </div>
    );
  }

  const current = PAGES[page];

  return (
    <div className="dashboard-app">
      <header className="dashboard-topbar">
        <button
          className="dashboard-menu-toggle"
          onClick={() => setMenuOpen((o) => !o)}
          aria-expanded={menuOpen}
          aria-controls="dashboard-nav"
        >
          ☰ <span>{current.label}</span>
        </button>
        <span className="dashboard-brand">Dashboard</span>
        <div className="dashboard-account">
          <span className="dashboard-email">{session.user.email}</span>
          <a href="/" className="dashboard-link">View site</a>
          <button onClick={handleSignOut}>Sign out</button>
        </div>
      </header>

      <div className="dashboard-body">
        <nav id="dashboard-nav" className={`dashboard-nav${menuOpen ? " open" : ""}`}>
          {NAV.map(({ group, items }) => (
            <div key={group} className="dashboard-nav-group">
              <div className="dashboard-nav-heading">{group}</div>
              {items.map((item) => (
                <button
                  key={item.id}
                  className={`dashboard-nav-item${page === item.id ? " active" : ""}`}
                  onClick={() => go(item.id)}
                >
                  {item.label}
                </button>
              ))}
            </div>
          ))}
        </nav>
        {menuOpen && <div className="dashboard-nav-scrim" onClick={() => setMenuOpen(false)} />}

        <main className="dashboard-main">
          <div className="dashboard-page-header">
            {current.group !== "Overview" && <div className="dashboard-page-eyebrow">{current.group}</div>}
            <h1>{current.label}</h1>
            <p>{current.description}</p>
          </div>
          {page === "usage" ? (
            <MetricsPanel />
          ) : page === "knowledge" ? (
            <KnowledgePanel />
          ) : page === "chat" ? (
            <ChatMetricsPanel />
          ) : page === "appearance" ? (
            <AppearancePanel />
          ) : page === "upload" ? (
            <UploadPanel
              onUploaded={() => {
                setRefreshKey((k) => k + 1);
              }}
            />
          ) : (
            <ManagePanel key={refreshKey} />
          )}
        </main>
      </div>
    </div>
  );
}

export default DashboardPage;

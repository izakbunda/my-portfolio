import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import UploadPanel from "./UploadPanel";
import ManagePanel from "./ManagePanel";
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

function DashboardPage() {
  const [session, setSession] = useState(undefined); // undefined = loading
  const [tab, setTab] = useState("upload");
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

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  if (session === undefined) {
    return <div className="dashboard-page dashboard-loading">Loading...</div>;
  }

  return (
    <div className="dashboard-page">
      {session ? (
        <div className="dashboard-shell">
          <div className="dashboard-header">
            <span>Signed in as {session.user.email}</span>
            <button onClick={handleSignOut}>Sign out</button>
          </div>
          <div className="dashboard-tabs">
            <button
              className={tab === "upload" ? "active" : ""}
              onClick={() => setTab("upload")}
            >
              Upload
            </button>
            <button
              className={tab === "manage" ? "active" : ""}
              onClick={() => setTab("manage")}
            >
              Manage
            </button>
          </div>
          <div className="dashboard-content">
            {tab === "upload" ? (
              <UploadPanel onUploaded={() => setRefreshKey((k) => k + 1)} />
            ) : (
              <ManagePanel key={refreshKey} />
            )}
          </div>
        </div>
      ) : (
        <LoginForm onLoggedIn={setSession} />
      )}
    </div>
  );
}

export default DashboardPage;

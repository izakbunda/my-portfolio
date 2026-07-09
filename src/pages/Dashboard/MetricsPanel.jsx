import { useEffect, useState } from "react";
import { fetchOverviewStats, fetchRecentSessions } from "../../lib/metricsQueries";
import "./MetricsPanel.css";

function formatDuration(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

function formatTimestamp(iso) {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatReferrer(referrer) {
  if (!referrer) return "Direct";
  try {
    return new URL(referrer).hostname.replace(/^www\./, "");
  } catch {
    return referrer;
  }
}

const CARDS = [
  { key: "sessionsToday", label: "Visitors today" },
  { key: "sessionsWeek", label: "Visitors this week" },
  { key: "sessionsMonth", label: "Visitors this month" },
  { key: "avgDurationSeconds", label: "Avg. session length", format: formatDuration },
  { key: "resumeClicks", label: "Resume downloads" },
  { key: "chatQuestions", label: "Chat questions asked" },
];

function MetricsPanel() {
  const [stats, setStats] = useState(null);
  const [sessions, setSessions] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([fetchOverviewStats(), fetchRecentSessions()])
      .then(([overview, recent]) => {
        setStats(overview);
        setSessions(recent);
      })
      .catch((err) => setError(err.message ?? "Failed to load metrics"));
  }, []);

  if (error) return <div className="metrics-error">{error}</div>;
  if (!stats) return <div className="metrics-loading">Loading metrics...</div>;

  return (
    <div className="metrics-panel">
      <div className="metrics-grid">
        {CARDS.map(({ key, label, format }) => (
          <div key={key} className="metrics-card">
            <div className="metrics-card-value">
              {format ? format(stats[key]) : stats[key]}
            </div>
            <div className="metrics-card-label">{label}</div>
          </div>
        ))}
      </div>

      <h3 className="metrics-section-title">Recent visitors</h3>
      {sessions.length === 0 ? (
        <div className="metrics-empty">No visitors yet.</div>
      ) : (
        <div className="metrics-table-wrap">
          <table className="metrics-table">
            <thead>
              <tr>
                <th>When</th>
                <th>Region</th>
                <th>Device</th>
                <th>Referrer</th>
                <th>Duration</th>
                <th>Windows opened</th>
                <th>Resume?</th>
                <th>Chat msgs</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((s) => (
                <tr key={s.id}>
                  <td>{formatTimestamp(s.created_at)}</td>
                  <td>{[s.region, s.country].filter(Boolean).join(", ") || "Unknown"}</td>
                  <td>{s.device_type ?? "Unknown"}</td>
                  <td>{formatReferrer(s.referrer)}</td>
                  <td>{s.duration_seconds != null ? formatDuration(s.duration_seconds) : "—"}</td>
                  <td>{s.viewCount}</td>
                  <td>{s.resumeClicked ? "Yes" : ""}</td>
                  <td>{s.chatCount || ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default MetricsPanel;

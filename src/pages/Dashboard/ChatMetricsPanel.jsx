import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import { fetchChatSessions } from "../../lib/metricsQueries";
import "./ChatMetricsPanel.css";

function formatTimestamp(iso) {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function ChatSessionRow({ session, expanded, onToggle }) {
  const preview = session.messages[0]?.question ?? "";

  return (
    <div className="chat-session">
      <button className="chat-session-summary" onClick={onToggle}>
        <span className="chat-session-caret">{expanded ? "▾" : "▸"}</span>
        <span className="chat-session-time">{formatTimestamp(session.lastActivity)}</span>
        <span className="chat-session-preview">{preview}</span>
        <span className="chat-session-count">
          {session.messageCount} message{session.messageCount === 1 ? "" : "s"}
          {session.errorCount > 0 ? ` · ${session.errorCount} error${session.errorCount === 1 ? "" : "s"}` : ""}
        </span>
      </button>
      {expanded && (
        <div className="chat-session-transcript">
          {session.messages.map((m) => (
            <div key={m.id} className={`chat-transcript-msg${m.is_error ? " chat-transcript-error" : ""}`}>
              <div className="chat-transcript-question">
                <span className="chat-transcript-label">Q</span>
                <span>{m.question}</span>
              </div>
              <div className="chat-transcript-response">
                <span className="chat-transcript-label">A</span>
                <div>
                  {m.response ? <ReactMarkdown>{m.response}</ReactMarkdown> : <em>No response (error)</em>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ChatMetricsPanel() {
  const [sessions, setSessions] = useState(null);
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    fetchChatSessions()
      .then(setSessions)
      .catch((err) => setError(err.message ?? "Failed to load chat metrics"));
  }, []);

  if (error) return <div className="metrics-error">{error}</div>;
  if (!sessions) return <div className="metrics-loading">Loading chat metrics...</div>;

  return (
    <div className="chat-metrics-panel">
      <div className="chat-metrics-summary">
        {sessions.length} session{sessions.length === 1 ? "" : "s"} ·{" "}
        {sessions.reduce((sum, s) => sum + s.messageCount, 0)} question
        {sessions.reduce((sum, s) => sum + s.messageCount, 0) === 1 ? "" : "s"} total
      </div>
      {sessions.length === 0 ? (
        <div className="metrics-empty">No chat activity yet.</div>
      ) : (
        <div className="chat-session-list">
          {sessions.map((session) => (
            <ChatSessionRow
              key={session.sessionId}
              session={session}
              expanded={expandedId === session.sessionId}
              onToggle={() =>
                setExpandedId((prev) => (prev === session.sessionId ? null : session.sessionId))
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default ChatMetricsPanel;

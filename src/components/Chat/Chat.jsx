import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import "./Chat.css";
import { logChatMessage } from "../../lib/metrics";
import pingSound from "../../assets/ping.m4a";
import { useProximity } from "../../lib/useProximity";
import { openTarget } from "../../lib/deepLinks";
import { buildSiteContext } from "../../lib/siteContext";
import { DEFAULT_CHAT_STARTERS, fetchChatStarters } from "../../lib/siteSettings";

const AGENT_URL = import.meta.env.VITE_AGENT_URL ?? "http://localhost:8000";
// Mirrors MAX_MESSAGES in agent/app/main.py; older turns are dropped from the request.
const MAX_HISTORY = 30;
const ERROR_REPLY = "Couldn't reach the server. Try again later.";
const HISTORY_KEY = "izak-ai-chat";
const GREETING = { role: "assistant", content: "Hey! Ask me anything about Izak." };

// The conversation survives the window closing (and, on mobile, switching apps
// after tapping a link button) for the rest of the browser session.
function loadHistory() {
  try {
    const saved = JSON.parse(sessionStorage.getItem(HISTORY_KEY));
    return Array.isArray(saved) && saved.length ? saved : [GREETING];
  } catch {
    return [GREETING];
  }
}

const Chat = ({ onStreamingChange }) => {
  const [messages, setMessages] = useState(loadHistory);
  const [input, setInput] = useState("");
  const [starters, setStarters] = useState(null); // null until loaded, so saved ones don't flash in
  const [streaming, setStreaming] = useState(false);
  const bottomRef = useRef(null);
  const sendRef = useRef(null);
  useProximity(sendRef);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    fetchChatStarters()
      .then(setStarters)
      .catch(() => setStarters(DEFAULT_CHAT_STARTERS));
  }, []);

  useEffect(() => {
    onStreamingChange?.(streaming);
  }, [streaming, onStreamingChange]);

  useEffect(() => {
    if (streaming) return;
    try {
      sessionStorage.setItem(HISTORY_KEY, JSON.stringify(messages));
    } catch {}
  }, [messages, streaming]);

  const hasStarted = messages.some((m) => m.role === "user");

  const send = async (text) => {
    if (typeof text !== "string") text = input.trim();
    if (!text || streaming) return;

    new Audio(pingSound).play().catch(() => {});

    const next = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setStreaming(true);

    try {
      const res = await fetch(`${AGENT_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: next.slice(-MAX_HISTORY).map(({ role, content }) => ({ role, content })),
          site_context: await buildSiteContext(),
        }),
      });

      if (!res.ok) throw new Error(`Server error ${res.status}`);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let assistant = "";
      let links = [];
      let buffer = "";
      let failed = false;
      setMessages([...next, { role: "assistant", content: "" }]);

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        // An SSE line can be split across reads; keep the trailing partial line.
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop();
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const payload = line.slice(6);
          if (payload === "[DONE]") continue;
          try {
            const evt = JSON.parse(payload);
            if (evt.type === "text") {
              assistant += evt.content;
              setMessages([...next, { role: "assistant", content: assistant, links }]);
            } else if (evt.type === "links") {
              links = [...links, ...evt.links].slice(0, 3);
              setMessages([...next, { role: "assistant", content: assistant, links }]);
            } else if (evt.type === "error") {
              failed = true;
            }
          } catch {}
        }
      }
      if (failed) throw new Error("Agent stream failed");
      logChatMessage(text, assistant, false);
    } catch {
      setMessages([...next, { role: "assistant", content: ERROR_REPLY }]);
      logChatMessage(text, null, true);
    } finally {
      setStreaming(false);
    }
  };

  return (
    <div className="chat-container">
      <div className="chat-disclaimer">
        ⚠ This is an AI and may make mistakes. For anything important, contact Izak directly at <a href="mailto:izakbunda@gmail.com">izakbunda@gmail.com</a>.
      </div>
      <div className="chat-messages">
        {messages.map((m, i) => (
          <div key={i} className={`chat-msg chat-msg-${m.role}`}>
            <span className="chat-msg-label">{m.role === "user" ? "you" : "Izak AI"}</span>
            {m.role === "assistant" && streaming && m.content === "" ? (
              <p className="chat-msg-content chat-thinking"><span>.</span><span>.</span><span>.</span></p>
            ) : (
              <div className="chat-msg-content">
                <ReactMarkdown>{m.content}</ReactMarkdown>
              </div>
            )}
            {m.links?.length > 0 && (
              <div className="chat-links">
                {m.links.map((l) => (
                  <button key={`${l.app}/${l.item}`} className="chat-link-btn" onClick={() => openTarget(l)}>
                    {l.label} <span aria-hidden="true">↗</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      {!hasStarted && starters && (
        <div className="chat-starters">
          {starters.map((s) => (
            <button key={s} className="chat-starter-chip" onClick={() => send(s)} disabled={streaming}>
              {s}
            </button>
          ))}
        </div>
      )}
      <div className="chat-composer">
        <input
          className="chat-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !streaming && send(input.trim())}
          placeholder="Ask me anything about Izak…"
          disabled={streaming}
        />
        <button className="chat-send ai-takeover" ref={sendRef} onClick={send} disabled={streaming || !input.trim()}>
          <span>Send</span>
        </button>
      </div>
    </div>
  );
};

export default Chat;

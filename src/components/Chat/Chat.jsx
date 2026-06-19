import { useState, useRef, useEffect } from "react";
import "./Chat.css";

const AGENT_URL = import.meta.env.VITE_AGENT_URL ?? "http://localhost:8000";

const Chat = () => {
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hey! Ask me anything about Izak." },
  ]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    const text = input.trim();
    if (!text || streaming) return;

    const next = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setStreaming(true);

    try {
      const res = await fetch(`${AGENT_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });

      if (!res.ok) throw new Error(`Server error ${res.status}`);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let assistant = "";
      setMessages([...next, { role: "assistant", content: "" }]);

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        for (const line of decoder.decode(value).split("\n")) {
          if (!line.startsWith("data: ")) continue;
          const payload = line.slice(6);
          if (payload === "[DONE]") continue;
          try {
            const evt = JSON.parse(payload);
            if (evt.type === "text") {
              assistant += evt.content;
              setMessages([...next, { role: "assistant", content: assistant }]);
            }
          } catch {}
        }
      }
    } catch {
      setMessages([...next, { role: "assistant", content: "Couldn't reach the server. Try again later." }]);
    } finally {
      setStreaming(false);
    }
  };

  return (
    <div className="chat-container">
      <div className="chat-messages">
        {messages.map((m, i) => (
          <div key={i} className={`chat-msg chat-msg-${m.role}`}>
            <span className="chat-msg-label">{m.role === "user" ? "you" : "izak.ai"}</span>
            <p className="chat-msg-content">{m.content}</p>
          </div>
        ))}
        {streaming && (
          <div className="chat-msg chat-msg-assistant">
            <span className="chat-msg-label">izak.ai</span>
            <p className="chat-msg-content chat-thinking">thinking…</p>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      <div className="chat-composer">
        <input
          className="chat-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !streaming && send()}
          placeholder="Ask me anything about Izak…"
          disabled={streaming}
        />
        <button className="chat-send" onClick={send} disabled={streaming}>
          Send
        </button>
      </div>
    </div>
  );
};

export default Chat;

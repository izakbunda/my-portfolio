import { useState } from "react";
import emailjs from "@emailjs/browser";
import "./MobileBanner.css";

const EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const EMAILJS_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;
const SITE_URL = import.meta.env.VITE_SITE_URL ?? "https://izakbunda.vercel.app";

const MobileBanner = ({ onDismiss }) => {
  const [showInput, setShowInput] = useState(false);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState(null);

  const handleSend = async () => {
    if (!email) return;
    setStatus("sending");
    try {
      await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        { 
          email: email, 
          site_url: SITE_URL, 
          title: "Portfolio Link",
          easter_egg_count: "6",
        },
        EMAILJS_PUBLIC_KEY
      );
      setStatus("sent");
    } catch {
      setStatus("error");
    }
  };

  return (
    <div className="mobile-banner">
      <button className="mobile-banner-close" onClick={onDismiss}>×</button>
      {status === "sent" ? (
        <p className="mobile-banner-text">Link sent! Check your inbox.</p>
      ) : (
        <>
          <p className="mobile-banner-text">Best experienced on desktop.</p>
          {!showInput ? (
            <button className="mobile-banner-btn" onClick={() => setShowInput(true)}>
              Email me the link
            </button>
          ) : (
            <div className="mobile-banner-form">
              <input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mobile-banner-input"
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                autoFocus
              />
              <button
                className="mobile-banner-btn"
                onClick={handleSend}
                disabled={status === "sending" || !email}
              >
                {status === "sending" ? "Sending…" : "Send"}
              </button>
            </div>
          )}
          {status === "error" && (
            <p className="mobile-banner-error">Failed to send. Try again.</p>
          )}
        </>
      )}
    </div>
  );
};

export default MobileBanner;

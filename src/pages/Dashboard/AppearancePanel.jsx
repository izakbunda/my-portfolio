import { useEffect, useState } from "react";
import {
  AI_GLOW_MAX_COLORS,
  AI_GLOW_MIN_COLORS,
  AI_GLOW_PRESETS,
  fetchAiGlow,
  glowGradientStops,
  saveAiGlow,
} from "../../lib/siteSettings";
import "../../components/AiGlow/AiGlow.css";
import "./AppearancePanel.css";

const PRESET_LABELS = {
  cool: "Cool",
  apple: "Apple Intelligence",
  warm: "Warm",
};

function Swatches({ colors }) {
  return (
    <span className="appearance-swatches">
      {colors.map((c, i) => (
        <span key={i} className="appearance-swatch" style={{ background: c }} />
      ))}
    </span>
  );
}

function AppearancePanel() {
  const [glow, setGlow] = useState(null);
  const [thinking, setThinking] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchAiGlow().then(setGlow);
  }, []);

  if (!glow) return <div className="metrics-loading">Loading...</div>;

  const update = (next) => {
    setGlow(next);
    setStatus("");
    setError("");
  };

  const choosePreset = (preset) => update({ preset, colors: [...AI_GLOW_PRESETS[preset]] });

  const setColor = (index, value) => {
    const colors = [...glow.colors];
    colors[index] = value;
    update({ preset: "custom", colors });
  };

  const addColor = () => update({ preset: "custom", colors: [...glow.colors, glow.colors[glow.colors.length - 1]] });

  const removeColor = (index) => update({ preset: "custom", colors: glow.colors.filter((_, i) => i !== index) });

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      await saveAiGlow(glow);
      setStatus("Saved. Visitors will see the new colors on their next page load.");
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="appearance-panel">
      <h2 className="metrics-section-title">Izak AI glow colors</h2>

      <div className="appearance-presets">
        {Object.entries(AI_GLOW_PRESETS).map(([key, colors]) => (
          <button
            key={key}
            className={glow.preset === key ? "active" : ""}
            onClick={() => choosePreset(key)}
          >
            <Swatches colors={colors} />
            {PRESET_LABELS[key]}
          </button>
        ))}
        <button className={glow.preset === "custom" ? "active" : ""} onClick={() => update({ ...glow, preset: "custom" })}>
          <Swatches colors={glow.preset === "custom" ? glow.colors : []} />
          Custom
        </button>
      </div>

      {glow.preset === "custom" && (
        <div className="appearance-custom">
          {glow.colors.map((c, i) => (
            <div key={i} className="appearance-color-row">
              <input type="color" value={c} onChange={(e) => setColor(i, e.target.value.toUpperCase())} />
              <code>{c}</code>
              <button onClick={() => removeColor(i)} disabled={glow.colors.length <= AI_GLOW_MIN_COLORS}>
                Remove
              </button>
            </div>
          ))}
          <button onClick={addColor} disabled={glow.colors.length >= AI_GLOW_MAX_COLORS}>
            + Add color
          </button>
        </div>
      )}

      <h2 className="metrics-section-title">Preview</h2>
      <div className="appearance-preview" style={{ "--ai-glow-colors": glowGradientStops(glow.colors) }}>
        <div className="appearance-preview-window-wrap">
          <div className={`appearance-preview-window ai-glow-window${thinking ? " ai-thinking" : ""}`}>
            <div className="appearance-preview-header">Izak AI</div>
            <div className="appearance-preview-body">Hey! Ask me anything about Izak.</div>
          </div>
        </div>
        <div className="ai-glow-preview-icon">
          <span className="ai-glow-icon">
            <img src="/icons/smile.png" alt="Izak AI" />
          </span>
          <span className="appearance-preview-hint">hover / press</span>
        </div>
      </div>

      <div className="appearance-actions">
        <button onClick={() => setThinking((t) => !t)}>
          {thinking ? "Show resting state" : "Preview thinking"}
        </button>
        <button className="appearance-save" onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save"}
        </button>
      </div>
      {status && <div className="appearance-status">{status}</div>}
      {error && <div className="metrics-error">{error}</div>}
    </div>
  );
}

export default AppearancePanel;

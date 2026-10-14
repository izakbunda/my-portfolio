import { useEffect, useMemo, useRef, useState } from "react";
import {
  KB_FILE_TYPES,
  cleanupBraindump,
  createEntry,
  deleteEntry,
  deleteFile,
  listEntries,
  listFiles,
  updateEntry,
  uploadFile,
} from "../../lib/knowledge";
import {
  CHAT_STARTERS_MAX,
  CHAT_STARTER_MAX_CHARS,
  DEFAULT_CHAT_STARTERS,
  fetchChatStarters,
  sanitizeChatStarters,
  saveChatStarters,
} from "../../lib/siteSettings";
import "./KnowledgePanel.css";

const BRAINDUMP_KEY = "kb-braindump";

function timeAgo(iso) {
  if (!iso) return "";
  const s = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return new Date(iso).toLocaleDateString();
}

function loadBraindump() {
  try {
    return JSON.parse(localStorage.getItem(BRAINDUMP_KEY)) ?? { question: "", text: "" };
  } catch {
    return { question: "", text: "" };
  }
}

// ---------- one Q&A or doc ----------

function EntryCard({ entry, prefill, onSaved, onDeleted, cardRef }) {
  const initial = { title: entry.title, body: entry.body, category: entry.category ?? "", ...prefill };
  const [form, setForm] = useState(initial);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const isQa = entry.kind === "qa";
  const isNew = !entry.created_at;
  const dirty =
    isNew ||
    form.title !== entry.title ||
    form.body !== entry.body ||
    form.category !== (entry.category ?? "");

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const save = async () => {
    if (!form.title.trim()) return setError(isQa ? "Add a question." : "Add a title.");
    setBusy("Saving & embedding…");
    setError("");
    const fields = { title: form.title.trim(), body: form.body, category: form.category.trim() || null };
    try {
      const saved = isNew ? await createEntry({ kind: entry.kind, ...fields }) : await updateEntry(entry.id, fields);
      onSaved(entry.id, saved);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy("");
    }
  };

  const remove = async () => {
    if (isNew) return onDeleted(entry.id);
    if (!window.confirm(`Delete "${entry.title}"? Izak AI will stop knowing this.`)) return;
    setBusy("Deleting…");
    try {
      await deleteEntry(entry.id);
      onDeleted(entry.id);
    } catch (e) {
      setError(e.message);
      setBusy("");
    }
  };

  return (
    <div ref={cardRef} className={`kb-card${dirty ? " kb-card-dirty" : ""}`}>
      <input
        className="kb-title-input"
        value={form.title}
        onChange={set("title")}
        placeholder={isQa ? "Question a visitor might ask" : "Document title"}
      />
      <textarea
        className={isQa ? "kb-body-input" : "kb-body-input kb-body-doc"}
        value={form.body}
        onChange={set("body")}
        placeholder={isQa ? "Answer, in third person" : "Markdown. ## headings become separate chunks."}
        rows={isQa ? 5 : 14}
      />
      <div className="kb-card-footer">
        <input
          className="kb-category-input"
          value={form.category}
          onChange={set("category")}
          placeholder="Category"
          list="kb-categories"
        />
        <span className={`kb-status${dirty ? " kb-status-dirty" : ""}`}>
          {busy || (dirty ? "Unsaved changes" : entry.embedded_at ? `Embedded ✓ ${timeAgo(entry.embedded_at)}` : "Not embedded")}
        </span>
        <button onClick={remove} disabled={!!busy}>Delete</button>
        <button className="kb-primary" onClick={save} disabled={!!busy || !dirty}>Save</button>
      </div>
      {error && <div className="metrics-error">{error}</div>}
    </div>
  );
}

// ---------- braindump + Fix with AI ----------

function Braindump({ onAdd, onMerge }) {
  const [dump, setDump] = useState(loadBraindump);
  const [drafts, setDrafts] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      localStorage.setItem(BRAINDUMP_KEY, JSON.stringify(dump));
    } catch {}
  }, [dump]);

  const fix = async () => {
    setBusy(true);
    setError("");
    try {
      const { drafts } = await cleanupBraindump(dump.text, dump.question.trim());
      setDrafts(drafts.map((d, i) => ({ ...d, key: i, category: d.category ?? "" })));
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const editDraft = (key, field, value) =>
    setDrafts((ds) => ds.map((d) => (d.key === key ? { ...d, [field]: value } : d)));

  const dropDraft = (key) =>
    setDrafts((ds) => {
      const rest = (ds ?? []).filter((d) => d.key !== key);
      if (rest.length > 0) return rest;
      // Every draft handled: the braindump is done.
      queueMicrotask(() => setDump({ question: "", text: "" }));
      return null;
    });

  const add = async (draft) => {
    editDraft(draft.key, "busy", true);
    try {
      await onAdd({ kind: "qa", title: draft.question.trim(), body: draft.answer, category: draft.category.trim() || null });
      dropDraft(draft.key);
    } catch (e) {
      editDraft(draft.key, "busy", false);
      editDraft(draft.key, "error", e.message);
    }
  };

  const merge = (draft) => {
    // Keep the existing question; the backend already merged the new facts into its answer.
    onMerge(draft.merge_into, { title: draft.merge_title, body: draft.merged_answer });
    dropDraft(draft.key);
  };

  return (
    <div className="kb-braindump">
      <h2 className="metrics-section-title">Plain text</h2>
      {!drafts ? (
        <div className="kb-card">
          <input
            className="kb-title-input"
            value={dump.question}
            onChange={(e) => setDump({ ...dump, question: e.target.value })}
            placeholder="Question (optional)"
          />
          <textarea
            className="kb-body-input"
            value={dump.text}
            onChange={(e) => setDump({ ...dump, text: e.target.value })}
            placeholder="Braindump anything you want Izak AI to know. Messy is fine; Fix with AI turns it into clean Q&As."
            rows={6}
          />
          <div className="kb-card-footer">
            <span className="kb-status">Nothing is saved until you add a draft.</span>
            <button className="kb-primary kb-ai" onClick={fix} disabled={busy || !dump.text.trim()}>
              {busy ? "Fixing…" : "✦ Fix with AI"}
            </button>
          </div>
          {error && <div className="metrics-error">{error}</div>}
        </div>
      ) : (
        <>
          <div className="kb-drafts-bar">
            <span>{drafts.length === 1 ? "1 draft" : `${drafts.length} drafts`}: edit, then add or discard.</span>
            <button onClick={() => setDrafts(null)}>↺ Back to braindump</button>
          </div>
          {drafts.map((d) => (
            <div key={d.key} className="kb-card kb-card-draft">
              {d.merge_into && (
                <div className="kb-overlap">
                  Overlaps with: <strong>{d.merge_title}</strong>
                  {d.merge_reason && <span> ({d.merge_reason})</span>}
                  <div className="kb-overlap-hint">
                    Merge folds these facts into that answer and opens it for review before saving.
                  </div>
                </div>
              )}
              <input className="kb-title-input" value={d.question} onChange={(e) => editDraft(d.key, "question", e.target.value)} />
              <textarea className="kb-body-input" value={d.answer} onChange={(e) => editDraft(d.key, "answer", e.target.value)} rows={5} />
              <div className="kb-card-footer">
                <input
                  className="kb-category-input"
                  value={d.category}
                  onChange={(e) => editDraft(d.key, "category", e.target.value)}
                  placeholder="Category"
                  list="kb-categories"
                />
                <span className="kb-status" />
                <button onClick={() => dropDraft(d.key)} disabled={d.busy}>Discard</button>
                {d.merge_into && (
                  <button onClick={() => merge(d)} disabled={d.busy}>Merge into existing</button>
                )}
                <button className="kb-primary" onClick={() => add(d)} disabled={d.busy || !d.question.trim()}>
                  {d.busy ? "Adding…" : d.merge_into ? "Add as new" : "Add to knowledge base"}
                </button>
              </div>
              {d.error && <div className="metrics-error">{d.error}</div>}
            </div>
          ))}
        </>
      )}
    </div>
  );
}

// ---------- files ----------

function Files() {
  const [files, setFiles] = useState(null);
  const [uploading, setUploading] = useState([]);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    listFiles().then(setFiles).catch((e) => setError(e.message));
  }, []);

  const handle = async (fileList) => {
    setError("");
    for (const file of Array.from(fileList)) {
      const ext = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
      if (!KB_FILE_TYPES.includes(ext)) {
        setError(`${file.name}: only ${KB_FILE_TYPES.join(", ")} files are supported.`);
        continue;
      }
      setUploading((u) => [...u, file.name]);
      try {
        const saved = await uploadFile(file);
        setFiles((fs) => [saved, ...(fs ?? [])]);
      } catch (e) {
        setError(`${file.name}: ${e.message}`);
      } finally {
        setUploading((u) => u.filter((n) => n !== file.name));
      }
    }
  };

  const remove = async (f) => {
    if (!window.confirm(`Delete ${f.name}? Its content is removed from Izak AI.`)) return;
    try {
      await deleteFile(f.id);
      setFiles((fs) => fs.filter((x) => x.id !== f.id));
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div>
      <h2 className="metrics-section-title">Files</h2>
      <div
        className={`kb-dropzone${dragging ? " dragging" : ""}`}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          handle(e.dataTransfer.files);
        }}
      >
        Drop .md, .txt or .pdf files here, or click to choose
        <input
          ref={inputRef}
          type="file"
          accept={KB_FILE_TYPES.join(",")}
          multiple
          hidden
          onChange={(e) => {
            handle(e.target.files);
            e.target.value = "";
          }}
        />
      </div>
      {error && <div className="metrics-error">{error}</div>}
      <div className="kb-file-list">
        {uploading.map((name) => (
          <div key={name} className="kb-file-row">
            <span className="kb-file-name">{name}</span>
            <span className="kb-status">Reading & embedding…</span>
          </div>
        ))}
        {files?.map((f) => (
          <div key={f.id} className="kb-file-row">
            <span className="kb-file-name">{f.name}</span>
            <span className="kb-status">
              {f.chunk_count} chunks · {(f.size / 1024).toFixed(0)} KB · {timeAgo(f.created_at)}
            </span>
            <button onClick={() => remove(f)}>Delete</button>
          </div>
        ))}
        {files?.length === 0 && uploading.length === 0 && <div className="metrics-empty">No files yet.</div>}
      </div>
    </div>
  );
}

// ---------- starter prompts ----------

function StarterPrompts() {
  const [saved, setSaved] = useState(null);
  const [list, setList] = useState(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetchChatStarters()
      .catch(() => DEFAULT_CHAT_STARTERS)
      .then((starters) => {
        setSaved(starters);
        setList(starters);
      });
  }, []);

  if (!list) return null;

  const dirty = JSON.stringify(sanitizeChatStarters(list)) !== JSON.stringify(saved);
  const update = (next) => {
    setList(next);
    setStatus("");
    setError("");
  };
  const move = (i, delta) => {
    const next = [...list];
    [next[i], next[i + delta]] = [next[i + delta], next[i]];
    update(next);
  };

  const save = async () => {
    const clean = sanitizeChatStarters(list);
    if (!clean.length) return setError("Keep at least one prompt (or reset to defaults).");
    setBusy(true);
    try {
      await saveChatStarters(clean);
      setSaved(clean);
      setList(clean);
      setStatus("Saved. Visitors see these next time they open Izak AI.");
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <h2 className="metrics-section-title">Starter prompts</h2>
      <div className="kb-card">
        <span className="kb-status">Chips shown in Izak AI before a visitor asks anything.</span>
        {list.map((s, i) => (
          <div key={i} className="kb-starter-row">
            <input
              className="kb-title-input"
              value={s}
              maxLength={CHAT_STARTER_MAX_CHARS}
              onChange={(e) => update(list.map((x, j) => (j === i ? e.target.value : x)))}
              placeholder="e.g. What's his best project?"
            />
            <button onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move up">↑</button>
            <button onClick={() => move(i, 1)} disabled={i === list.length - 1} aria-label="Move down">↓</button>
            <button onClick={() => update(list.filter((_, j) => j !== i))} aria-label="Remove">✕</button>
          </div>
        ))}
        <div className="kb-card-footer">
          <button onClick={() => update([...list, ""])} disabled={list.length >= CHAT_STARTERS_MAX}>
            + Add prompt
          </button>
          <button onClick={() => update([...DEFAULT_CHAT_STARTERS])}>Reset to defaults</button>
          <span className={`kb-status${dirty ? " kb-status-dirty" : ""}`}>
            {status || (dirty ? "Unsaved changes" : "")}
          </span>
          <button className="kb-primary" onClick={save} disabled={busy || !dirty}>
            {busy ? "Saving…" : "Save"}
          </button>
        </div>
        {error && <div className="metrics-error">{error}</div>}
      </div>
    </div>
  );
}

// ---------- panel ----------

let newId = 0;

function KnowledgePanel() {
  const [entries, setEntries] = useState(null);
  const [error, setError] = useState("");
  const [qaFilter, setQaFilter] = useState("All");
  const [section, setSection] = useState("qa");
  const [prefills, setPrefills] = useState({}); // entry id -> {title, body, category, v}
  const cardRefs = useRef({});

  useEffect(() => {
    listEntries().then(setEntries).catch((e) => setError(e.message));
  }, []);

  const categories = useMemo(
    () => [...new Set((entries ?? []).map((e) => e.category).filter(Boolean))].sort(),
    [entries]
  );

  if (error) return <div className="metrics-error">{error}</div>;
  if (!entries) return <div className="metrics-loading">Loading…</div>;

  const qa = entries.filter((e) => e.kind === "qa");
  const docs = entries.filter((e) => e.kind === "doc");
  const qaCategories = ["All", ...new Set(qa.map((e) => e.category).filter(Boolean))];
  const visibleQa = qaFilter === "All" ? qa : qa.filter((e) => e.category === qaFilter || !e.created_at);
  const docGroups = docs.reduce((groups, d) => {
    const key = d.category || "Other";
    (groups[key] ??= []).push(d);
    return groups;
  }, {});

  const addBlank = (kind) =>
    setEntries((es) => [
      { id: `new-${++newId}`, kind, title: "", body: "", category: kind === "qa" && qaFilter !== "All" ? qaFilter : null },
      ...es,
    ]);

  const onSaved = (oldId, saved) => {
    setEntries((es) => es.map((e) => (e.id === oldId ? saved : e)));
    setPrefills(({ [oldId]: _, ...rest }) => rest);
  };
  const onDeleted = (id) => setEntries((es) => es.filter((e) => e.id !== id));

  const addFromDraft = async (fields) => {
    const saved = await createEntry(fields);
    setEntries((es) => [saved, ...es]);
  };

  const mergeInto = (id, fields) => {
    setQaFilter("All");
    setPrefills((p) => ({ ...p, [id]: { ...fields, v: (p[id]?.v ?? 0) + 1 } }));
    setTimeout(() => cardRefs.current[id]?.scrollIntoView({ behavior: "smooth", block: "center" }), 50);
  };

  const card = (e) => {
    const { v = 0, ...prefill } = prefills[e.id] ?? {};
    return (
      <EntryCard
        key={`${e.id}-${v}`}
        entry={e}
        prefill={prefills[e.id] ? prefill : undefined}
        onSaved={onSaved}
        onDeleted={onDeleted}
        cardRef={(el) => (cardRefs.current[e.id] = el)}
      />
    );
  };

  const sections = [
    { id: "qa", label: `Q&A (${qa.length})` },
    { id: "docs", label: `Documents (${docs.length})` },
    { id: "files", label: "Files" },
    { id: "starters", label: "Starter prompts" },
  ];

  // Inactive sections stay mounted (just hidden) so unsaved edits and
  // braindump drafts survive switching between them.
  return (
    <div className="knowledge-panel">
      <datalist id="kb-categories">
        {categories.map((c) => <option key={c} value={c} />)}
      </datalist>

      <div className="kb-sections" role="tablist">
        {sections.map((sec) => (
          <button
            key={sec.id}
            role="tab"
            aria-selected={section === sec.id}
            className={section === sec.id ? "active" : ""}
            onClick={() => setSection(sec.id)}
          >
            {sec.label}
          </button>
        ))}
      </div>

      <section hidden={section !== "qa"}>
        <Braindump onAdd={addFromDraft} onMerge={mergeInto} />

        <div className="kb-section-head">
          <h2 className="metrics-section-title">Q&amp;A ({qa.length})</h2>
          <button onClick={() => addBlank("qa")}>+ Add Q&amp;A</button>
        </div>
        <div className="kb-filter-bar">
          {qaCategories.map((c) => (
            <button key={c} className={qaFilter === c ? "active" : ""} onClick={() => setQaFilter(c)}>
              {c}
            </button>
          ))}
        </div>
        {visibleQa.map(card)}
      </section>

      <section hidden={section !== "docs"}>
        <div className="kb-section-head">
          <h2 className="metrics-section-title">Documents ({docs.length})</h2>
          <button onClick={() => addBlank("doc")}>+ Add document</button>
        </div>
        {Object.entries(docGroups).map(([group, items]) => (
          <details key={group} className="kb-doc-group" open={items.some((d) => !d.created_at || prefills[d.id])}>
            <summary>
              {group} <span className="kb-status">({items.length})</span>
            </summary>
            {items.map(card)}
          </details>
        ))}
      </section>

      <section hidden={section !== "files"}>
        <Files />
      </section>

      <section hidden={section !== "starters"}>
        <StarterPrompts />
      </section>
    </div>
  );
}

export default KnowledgePanel;

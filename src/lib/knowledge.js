import { supabase } from "./supabase";

// Knowledge base admin API (agent/app/admin.py). Every call carries the
// dashboard user's Supabase access token; the backend re-embeds on each write.
const AGENT_URL = import.meta.env.VITE_AGENT_URL ?? "http://localhost:8000";

async function request(path, { method = "GET", json, body } = {}) {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("Not signed in.");

  const headers = { Authorization: `Bearer ${token}` };
  if (json !== undefined) headers["Content-Type"] = "application/json";

  const res = await fetch(`${AGENT_URL}/admin/kb${path}`, {
    method,
    headers,
    body: json !== undefined ? JSON.stringify(json) : body,
  });
  if (!res.ok) {
    let detail = `Request failed (${res.status})`;
    try {
      const err = await res.json();
      if (typeof err.detail === "string") detail = err.detail;
    } catch {}
    throw new Error(detail);
  }
  return res.json();
}

export const listEntries = () => request("/entries");
export const createEntry = (entry) => request("/entries", { method: "POST", json: entry });
export const updateEntry = (id, patch) => request(`/entries/${id}`, { method: "PUT", json: patch });
export const deleteEntry = (id) => request(`/entries/${id}`, { method: "DELETE" });

export const listFiles = () => request("/files");
export const deleteFile = (id) => request(`/files/${id}`, { method: "DELETE" });
export function uploadFile(file) {
  const form = new FormData();
  form.append("file", file);
  return request("/files", { method: "POST", body: form });
}

export const cleanupBraindump = (text, question) =>
  request("/cleanup", { method: "POST", json: { text, question: question || null } });

export const KB_FILE_TYPES = [".md", ".txt", ".pdf"];

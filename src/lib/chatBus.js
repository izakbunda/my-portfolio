// Lets the menu bar, Spotlight and app menus talk to Izak AI: open the chat
// and ask a question, or start a new conversation. A question asked before
// the chat window exists waits here until Chat mounts and picks it up.
let pending = null;

export function askIzakAI(question) {
  const text = question?.trim();
  if (!text) return;
  pending = text;
  window.dispatchEvent(new CustomEvent("open-window", { detail: { name: "Izak AI", item: null } }));
  window.dispatchEvent(new CustomEvent("izak-ai:ask"));
}

export function takePendingQuestion() {
  const text = pending;
  pending = null;
  return text;
}

export const hasPendingQuestion = () => pending !== null;

export function newChat() {
  window.dispatchEvent(new CustomEvent("izak-ai:new-chat"));
}

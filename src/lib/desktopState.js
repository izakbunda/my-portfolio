// Which windows the visitor has open, written by HomePage and read by Izak AI
// so it can refer to what's on screen. Plain module state: it only needs to be
// current when a chat message is sent, so nothing re-renders on change.
let state = { open: [], focused: null };

export const setDesktopState = (next) => {
  state = next;
};

export const getDesktopState = () => state;

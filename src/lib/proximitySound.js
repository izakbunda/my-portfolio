import { useEffect } from "react";

// Plays a sound as the cursor approaches any registered element. One shared
// <audio> serves every element, its volume follows the cursor's distance, and
// leaving fades it out and pauses in place, so coming back quickly resumes
// instead of restarting. It loops for as long as the cursor stays near.

const RADIUS = 110;       // px from the element's edge where the sound starts
const MAX_VOLUME = 1;     // element volume at the icon (the browser's 100% cap)
const BOOST = 1.25;       // extra gain via Web Audio, past that cap
const FADE_MS = 140;      // time constant for easing toward the target volume
const TICK_MS = 30;
const RESUME_WINDOW = 2500; // ms; paused longer than this → start fresh

const players = new Map(); // src -> controller

function createController(src) {
  const audio = new Audio(src);
  audio.preload = "auto";
  audio.loop = true;
  audio.volume = 0;

  // <audio>.volume can't exceed 1, so route the element through a GainNode
  // for the boost. Created lazily: an AudioContext starts suspended until the
  // visitor's first click/keypress, same as the element's own autoplay block.
  let ctx = null;
  const startPlayback = () => {
    if (!ctx && window.AudioContext) {
      ctx = new AudioContext();
      const gain = ctx.createGain();
      gain.gain.value = BOOST;
      ctx.createMediaElementSource(audio).connect(gain).connect(ctx.destination);
    }
    if (ctx?.state === "suspended") ctx.resume().catch(() => {});
    if (audio.paused) audio.play().catch(() => {});
  };

  const elements = new Set();
  let volume = 0;
  let target = 0;
  let timer = null;
  let lastTick = 0;
  let pausedAt = 0;

  // Keep looping while the cursor is near, even if the browser stops the
  // element on its own (a missed loop, a media interruption, etc.).
  const keepAlive = () => {
    if (target === 0) return; // we paused it on purpose
    if (audio.ended) audio.currentTime = 0;
    startPlayback();
  };
  audio.addEventListener("ended", keepAlive);
  audio.addEventListener("pause", keepAlive);

  const distanceTo = (el, x, y) => {
    const r = el.getBoundingClientRect();
    if (!r.width && !r.height) return Infinity;
    const dx = Math.max(r.left - x, 0, x - r.right);
    const dy = Math.max(r.top - y, 0, y - r.bottom);
    return Math.hypot(dx, dy);
  };

  const tick = () => {
    const now = performance.now();
    volume += (target - volume) * (1 - Math.exp(-(now - lastTick) / FADE_MS));
    lastTick = now;
    if (Math.abs(target - volume) < 0.005) volume = target;
    audio.volume = Math.min(Math.max(volume, 0), 1);

    if (target > 0 && audio.paused) {
      if (pausedAt && now - pausedAt > RESUME_WINDOW) audio.currentTime = 0;
      startPlayback(); // blocked until the visitor's first click/keypress
    }
    if (target === 0 && volume === 0 && !audio.paused) {
      audio.pause();
      pausedAt = now;
    }

    timer = volume === target ? null : setTimeout(tick, TICK_MS);
  };

  const setTarget = (next) => {
    target = next;
    if (timer === null) {
      lastTick = performance.now();
      timer = setTimeout(tick, 0);
    }
  };

  const onMove = (e) => {
    let nearest = Infinity;
    for (const el of elements) nearest = Math.min(nearest, distanceTo(el, e.clientX, e.clientY));
    const closeness = Math.max(0, 1 - nearest / RADIUS);
    // smoothstep so the fade-in starts gently at the edge of the radius
    setTarget(MAX_VOLUME * closeness * closeness * (3 - 2 * closeness));
  };

  // Only a real exit from the page counts; mouseout with a null
  // relatedTarget can also fire while the cursor sits still (e.g. when the
  // icon swaps images for its blink), which used to cut the sound off.
  const onLeaveWindow = () => setTarget(0);

  // Browsers block audio until the first click/tap/keypress on the page, and
  // hovering doesn't count. Retry right on that first interaction so the
  // sound starts immediately if the cursor is already near.
  const onFirstInteraction = () => {
    if (target > 0) startPlayback();
  };

  return {
    add(el) {
      elements.add(el);
      if (elements.size === 1) {
        window.addEventListener("mousemove", onMove, { passive: true });
        document.documentElement.addEventListener("mouseleave", onLeaveWindow);
        for (const type of ["pointerdown", "keydown"]) window.addEventListener(type, onFirstInteraction, true);
      }
    },
    remove(el) {
      elements.delete(el);
      if (elements.size === 0) {
        window.removeEventListener("mousemove", onMove);
        document.documentElement.removeEventListener("mouseleave", onLeaveWindow);
        for (const type of ["pointerdown", "keydown"]) window.removeEventListener(type, onFirstInteraction, true);
        setTarget(0);
      }
    },
  };
}

export function useProximitySound(ref, src, enabled = true) {
  useEffect(() => {
    const el = ref.current;
    if (!enabled || !el || !window.matchMedia("(hover: hover)").matches) return;
    if (!players.has(src)) players.set(src, createController(src));
    const player = players.get(src);
    player.add(el);
    return () => player.remove(el);
  }, [ref, src, enabled]);
}

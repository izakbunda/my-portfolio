import { useEffect } from "react";

// Writes the cursor's closeness to an element as CSS variables on it, eased
// over time so styles can respond smoothly as the cursor approaches:
//   --ai-near  0 (outside radius) → 1 (on the element)
//   --ai-mx / --ai-my  cursor position relative to the element, in px
export function useProximity(ref, { radius = 160, fadeMs = 260 } = {}) {
  useEffect(() => {
    const el = ref.current;
    if (!el || !window.matchMedia("(hover: hover)").matches) return;

    let near = 0;
    let target = 0;
    let timer = null;
    let lastTick = 0;

    const tick = () => {
      const now = performance.now();
      near += (target - near) * (1 - Math.exp(-(now - lastTick) / fadeMs));
      lastTick = now;
      if (Math.abs(target - near) < 0.002) near = target;
      el.style.setProperty("--ai-near", near.toFixed(3));
      timer = near === target ? null : setTimeout(tick, 30);
    };

    const setTarget = (next) => {
      target = next;
      if (timer === null) {
        lastTick = performance.now();
        timer = setTimeout(tick, 0);
      }
    };

    const onMove = (e) => {
      const r = el.getBoundingClientRect();
      if (!r.width && !r.height) return;
      const dx = Math.max(r.left - e.clientX, 0, e.clientX - r.right);
      const dy = Math.max(r.top - e.clientY, 0, e.clientY - r.bottom);
      const closeness = Math.max(0, 1 - Math.hypot(dx, dy) / radius);
      el.style.setProperty("--ai-mx", `${e.clientX - r.left}px`);
      el.style.setProperty("--ai-my", `${e.clientY - r.top}px`);
      setTarget(closeness * closeness * (3 - 2 * closeness));
    };

    const onLeave = () => setTarget(0);

    window.addEventListener("mousemove", onMove, { passive: true });
    document.documentElement.addEventListener("mouseleave", onLeave);
    return () => {
      window.removeEventListener("mousemove", onMove);
      document.documentElement.removeEventListener("mouseleave", onLeave);
      clearTimeout(timer);
    };
  }, [ref, radius, fadeMs]);
}

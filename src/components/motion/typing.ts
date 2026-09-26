/**
 * Shared by the typed pieces (the hero greeting, TypeOn). Characters are
 * [data-ch] spans laid out from the first paint, so revealing them never
 * moves anything; the caret is an absolutely placed .caret-block.
 */

/** Where a caret parked after character i (before the first when i < 0) sits, relative to root. */
export function caretSpot(
  root: HTMLElement,
  chars: HTMLElement[],
  i: number,
): { x: number; y: number; h: number } {
  const c = chars[Math.max(0, i)]?.getBoundingClientRect();
  if (!c) return { x: 0, y: 0, h: 0 };
  const r = root.getBoundingClientRect();
  return { x: (i < 0 ? c.left : c.right) - r.left, y: c.top - r.top, h: c.height };
}

/** Shows the characters whose time has come; returns how many are showing. */
export function showChars(chars: HTMLElement[], times: number[], t: number): number {
  let shown = 0;
  chars.forEach((c, i) => {
    const on = times[i] <= t;
    c.style.visibility = on ? "visible" : "hidden";
    if (on) shown = i + 1;
  });
  return shown;
}

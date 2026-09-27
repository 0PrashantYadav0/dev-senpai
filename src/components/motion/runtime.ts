/* The motion kit's runtime: the boot script, the motion mode, and once-per-session keys. */

/** sessionStorage keys for moves that play once per tab session. */
export const HELLO_KEY = "pky:hello";
export const GRID_KEY = "pky:grid";

export function playedThisSession(key: string): boolean {
  try {
    return sessionStorage.getItem(key) !== null;
  } catch {
    return false;
  }
}

export function markPlayed(key: string): void {
  try {
    sessionStorage.setItem(key, "1");
  } catch {}
}

export function unmarkPlayed(key: string): void {
  try {
    sessionStorage.removeItem(key);
  } catch {}
}

/**
 * Runs at the top of <body>, before the first paint (see layout.tsx). When
 * the visitor has not asked for reduced motion it marks <html> with
 * data-motion="on", so the CSS "before" states can hold back what is about
 * to animate; on the first visit to home in a tab session it also sets
 * data-hello, which holds the greeting back for the intro. If the kit has
 * not started 3s later it flips the marker to "static" and drops data-hello,
 * and everything shows as it is. Without scripts, or with reduced motion,
 * no marker appears and the finished page shows from the first paint.
 */
export const MOTION_BOOT = [
  "(function(){try{",
  "var d=document.documentElement;",
  'if(matchMedia("(prefers-reduced-motion: reduce)").matches)return;',
  'd.setAttribute("data-motion","on");',
  "setTimeout(function(){",
  'if(d.getAttribute("data-motion")==="on"){d.setAttribute("data-motion","static");d.removeAttribute("data-hello")}',
  "},3000);",
  "var played=false;",
  `try{played=sessionStorage.getItem("${HELLO_KEY}")!==null}catch(e){}`,
  'if(location.pathname==="/"&&!played)d.setAttribute("data-hello","play");',
  "}catch(e){}})();",
].join("");

export type MotionMode = "animate" | "static";

/**
 * Whether the kit animates right now. The first call after hydration turns
 * the boot script's "on" into "ready"; a "static" marker (the 3s failsafe
 * fired, or no marker at all) keeps the page static for this page load.
 * Reduced motion is checked live on every call.
 */
export function motionMode(): MotionMode {
  if (typeof window === "undefined") return "static";
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return "static";
  const html = document.documentElement;
  if (html.dataset.motion === "on") html.dataset.motion = "ready";
  return html.dataset.motion === "ready" ? "animate" : "static";
}

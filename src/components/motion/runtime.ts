/**
 * The motion kit's runtime. MOTION_BOOT runs at the top of <body>, before
 * the first paint (see layout.tsx): when the visitor has not asked for
 * reduced motion it marks <html> with data-motion="on", so the CSS "before"
 * states can hold back what is about to animate. If the kit has not started
 * 3s later it flips the marker to "static" and everything shows as it is.
 * Without scripts, or with reduced motion, the marker never appears and the
 * finished page shows from the first paint.
 */
export const MOTION_BOOT = [
  "(function(){try{",
  "var d=document.documentElement;",
  'if(matchMedia("(prefers-reduced-motion: reduce)").matches)return;',
  'd.setAttribute("data-motion","on");',
  "setTimeout(function(){",
  'if(d.getAttribute("data-motion")==="on")d.setAttribute("data-motion","static")',
  "},3000);",
  "}catch(e){}})();",
].join("");

export type MotionMode = "animate" | "static";

/**
 * Whether the kit animates right now. The first call after hydration turns
 * the head script's "on" into "ready"; a "static" marker (the 3s failsafe
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

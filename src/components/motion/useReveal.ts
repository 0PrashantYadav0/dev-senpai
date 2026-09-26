import { useEffect, useRef, type RefObject } from "react";
import { motionMode } from "./runtime";

/** Draws a move's first frame, starts it, and returns stop(), which snaps it to the finished state. */
export type Play = (el: HTMLElement) => () => void;

export interface RevealOptions {
  /** "view" (default): when about a third of the element is on screen. "mount": on the first frame. */
  on?: "view" | "mount";
}

/**
 * Plays a move once. The element renders its finished state and carries
 * data-reveal; CSS holds its "before" look under html[data-motion] until
 * data-revealed appears. When it is time, `play` draws the first frame and
 * starts the move, and data-revealed is set in the same task, so the first
 * frame and the reveal land in one paint.
 *
 * In static mode the element is revealed as it is. A page that cannot
 * scroll any further plays whatever is showing, so short pages and tall
 * screens never strand a piece. Turning on reduced motion mid-move runs
 * stop() and reveals.
 */
export function useReveal(
  ref: RefObject<HTMLElement>,
  play: Play,
  { on = "view" }: RevealOptions = {},
): void {
  const playRef = useRef(play);

  // Keep play current without resyncing the effect below: the reveal can
  // fire long after mount, once the caller has re-rendered with newer props.
  useEffect(() => {
    playRef.current = play;
  });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reveal = () => el.setAttribute("data-revealed", "");
    if (motionMode() === "static") {
      reveal();
      return;
    }

    let stop: (() => void) | null = null;
    let visible = false;
    let frame = 0;
    const observers: IntersectionObserver[] = [];
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");

    function detach() {
      cancelAnimationFrame(frame);
      observers.forEach((o) => o.disconnect());
      window.removeEventListener("scroll", atBottom);
    }
    function start() {
      if (stop) return;
      detach();
      stop = playRef.current(el!);
      reveal();
    }
    function atBottom() {
      const doc = document.documentElement;
      if (visible && window.scrollY + window.innerHeight >= doc.scrollHeight - 2) start();
    }
    function onReduce() {
      if (!reduce.matches) return;
      detach();
      if (stop) stop();
      reveal();
    }
    reduce.addEventListener("change", onReduce);

    if (on === "mount") {
      // On the first frame, not at mount: a tab opened in the background gets
      // no frames until it is shown, so the move waits for someone to see it.
      frame = requestAnimationFrame(() => start());
    } else {
      observers.push(
        // About a third of it on screen, above the bottom sliver of the viewport.
        new IntersectionObserver(
          (entries) => {
            for (const e of entries) {
              const room = e.rootBounds?.height ?? window.innerHeight;
              if (e.intersectionRatio >= 0.33 || e.intersectionRect.height >= room / 3) start();
            }
          },
          { rootMargin: "0px 0px -12% 0px", threshold: [0, 0.1, 0.2, 0.33, 0.5, 1] },
        ),
        // Any of it on screen, for the at-bottom check.
        new IntersectionObserver((entries) => {
          visible = entries.some((e) => e.isIntersecting);
          atBottom();
        }),
      );
      observers.forEach((o) => o.observe(el));
      window.addEventListener("scroll", atBottom, { passive: true });
    }

    return () => {
      reduce.removeEventListener("change", onReduce);
      detach();
      if (stop) stop();
    };
  }, [ref, on]);
}

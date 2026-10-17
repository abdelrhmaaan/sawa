import { useEffect, type RefObject } from "react";

/**
 * Progressive-enhancement scroll reveal: observes `.reveal` elements under the
 * root and adds `.is-visible` the first time each enters the viewport. Sets
 * `data-reveal="on"` on the root *after* observing, so the hiding CSS only
 * applies when animation is actually running — no IntersectionObserver or
 * reduced-motion preference means content is simply always visible.
 */
export function useReveal(rootRef: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    if (typeof IntersectionObserver === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -10% 0px" }
    );

    for (const el of root.querySelectorAll(".reveal")) {
      observer.observe(el);
    }
    root.dataset.reveal = "on";

    return () => {
      observer.disconnect();
      delete root.dataset.reveal;
    };
  }, [rootRef]);
}

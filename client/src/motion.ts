import { gsap } from "gsap";

export const prefersReducedMotion = (): boolean =>
  matchMedia("(prefers-reduced-motion: reduce)").matches;

export const ease = {
  out: "expo.out",
  soft: "power3.out",
} as const;

/** Fade+rise stagger for a list of elements (cards, table rows) on mount or filter change. */
export function reveal(els: Element[] | NodeListOf<Element>): void {
  const list = Array.from(els);
  if (list.length === 0) return;
  if (prefersReducedMotion()) {
    gsap.set(list, { opacity: 1, y: 0 });
    return;
  }
  gsap.fromTo(
    list,
    { opacity: 0, y: 8 },
    { opacity: 1, y: 0, duration: 0.5, ease: ease.out, stagger: 0.04 },
  );
}

/** Count up a number element from 0 to its target value. */
export function countUp(el: Element, value: number): void {
  if (prefersReducedMotion()) {
    el.textContent = String(value);
    return;
  }
  gsap.fromTo(
    el,
    { textContent: 0 },
    {
      textContent: value,
      duration: 0.8,
      ease: ease.soft,
      snap: { textContent: 1 },
    },
  );
}

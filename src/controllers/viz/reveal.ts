import { Controller } from "@hotwired/stimulus";

// Draws `stroke` targets (paths with pathLength="1") in when the figure first
// scrolls into view.
export default class VizRevealController extends Controller<HTMLElement> {
  static override targets = ["stroke"];
  declare readonly strokeTargets: SVGPathElement[];

  private observer: IntersectionObserver | null = null;

  override connect() {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    this.strokeTargets.forEach((path) => {
      path.style.strokeDasharray = "1";
      path.style.strokeDashoffset = "1";
    });

    this.observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        this.strokeTargets.forEach((path) => {
          path.style.transition = "stroke-dashoffset 1.6s ease-in-out";
          path.style.strokeDashoffset = "0";
        });
        this.observer?.disconnect();
      },
      { threshold: 0.4 }
    );
    this.observer.observe(this.element);
  }

  override disconnect() {
    this.observer?.disconnect();
  }
}

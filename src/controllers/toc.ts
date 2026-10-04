import { Controller } from "@hotwired/stimulus";

// How far down the viewport a heading must scroll before its section counts
// as the one being read.
const ACTIVATION_OFFSET = 0.25;

// Highlights the table of contents entry for the section the reader is in.
export default class TocController extends Controller {
  static override targets = ["link"];
  declare readonly linkTargets: HTMLAnchorElement[];

  private headings: HTMLElement[] = [];
  private frame: number | null = null;

  override connect() {
    this.headings = this.linkTargets
      .map((link) => document.getElementById(decodeURIComponent(link.hash.slice(1))))
      .filter((heading): heading is HTMLElement => heading !== null);

    window.addEventListener("scroll", this.scheduleUpdate, { passive: true });
    window.addEventListener("resize", this.scheduleUpdate, { passive: true });
    this.update();
  }

  override disconnect() {
    window.removeEventListener("scroll", this.scheduleUpdate);
    window.removeEventListener("resize", this.scheduleUpdate);
    if (this.frame) cancelAnimationFrame(this.frame);
  }

  private scheduleUpdate = () => {
    if (this.frame) return;

    this.frame = requestAnimationFrame(() => {
      this.frame = null;
      this.update();
    });
  };

  private update() {
    const threshold = window.innerHeight * ACTIVATION_OFFSET;
    const current = this.headings.findLast((heading) => heading.getBoundingClientRect().top <= threshold);

    for (const link of this.linkTargets) {
      const active = current !== undefined && link.hash === `#${current.id}`;

      if (active) {
        link.setAttribute("aria-current", "location");
        this.reveal(link);
      } else {
        link.removeAttribute("aria-current");
      }
    }
  }

  // Keeps the active entry visible when the sidebar holding the table of
  // contents scrolls on its own (desktop only; on mobile it isn't a scroller).
  private reveal(link: HTMLElement) {
    const container = link.closest<HTMLElement>("[data-sidebar-scroll]");
    if (!container || container.scrollHeight <= container.clientHeight) return;

    const linkRect = link.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();

    if (linkRect.top < containerRect.top) {
      container.scrollTop -= containerRect.top - linkRect.top;
    } else if (linkRect.bottom > containerRect.bottom) {
      container.scrollTop += linkRect.bottom - containerRect.bottom;
    }
  }
}

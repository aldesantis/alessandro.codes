import { Controller } from "@hotwired/stimulus";

const OFFSET = 8;
const VIEWPORT_MARGIN = 16;
const HIDE_DELAY = 150;

// Shows a footnote's content in a popover when hovering or focusing its
// reference, so readers don't have to jump to the bottom of the page.
export default class FootnotesController extends Controller {
  private popover: HTMLElement | null = null;
  private hideTimeout: ReturnType<typeof setTimeout> | null = null;

  override connect() {
    this.markSequences();

    if (!window.matchMedia("(hover: hover)").matches) return;

    for (const ref of this.refs()) {
      ref.addEventListener("mouseenter", this.show);
      ref.addEventListener("focus", this.show);
      ref.addEventListener("mouseleave", this.scheduleHide);
      ref.addEventListener("blur", this.scheduleHide);
    }
  }

  override disconnect() {
    for (const ref of this.refs()) {
      ref.removeEventListener("mouseenter", this.show);
      ref.removeEventListener("focus", this.show);
      ref.removeEventListener("mouseleave", this.scheduleHide);
      ref.removeEventListener("blur", this.scheduleHide);
    }

    this.hide();
  }

  // CSS sibling selectors ignore text nodes, so flag references that directly
  // follow another reference here, letting the stylesheet separate them.
  private markSequences() {
    for (const ref of this.refs()) {
      const sup = ref.parentElement;
      const previous = sup?.previousSibling;

      if (sup?.tagName === "SUP" && previous instanceof HTMLElement && previous.querySelector("a[data-footnote-ref]")) {
        sup.classList.add("footnote-ref-sequence");
      }
    }
  }

  private refs() {
    return this.element.querySelectorAll<HTMLAnchorElement>("a[data-footnote-ref]");
  }

  private show = (event: Event) => {
    const ref = event.currentTarget as HTMLAnchorElement;
    const id = decodeURIComponent(ref.hash.slice(1));
    const footnote = id && document.getElementById(id);
    if (!footnote) return;

    this.hide();

    const popover = document.createElement("div");
    popover.className = "footnote-popover";
    popover.setAttribute("role", "tooltip");
    popover.innerHTML = footnote.innerHTML;
    popover.querySelectorAll("[data-footnote-backref]").forEach((backref) => backref.remove());
    popover.addEventListener("mouseenter", this.cancelHide);
    popover.addEventListener("mouseleave", this.scheduleHide);

    document.body.appendChild(popover);
    this.popover = popover;
    this.position(ref, popover);
  };

  private position(ref: HTMLElement, popover: HTMLElement) {
    const refRect = ref.getBoundingClientRect();
    const popoverRect = popover.getBoundingClientRect();

    const maxLeft = document.documentElement.clientWidth - popoverRect.width - VIEWPORT_MARGIN;
    const left = Math.max(VIEWPORT_MARGIN, Math.min(refRect.left + refRect.width / 2 - popoverRect.width / 2, maxLeft));

    // Prefer below the reference, but flip above when there isn't room.
    const fitsBelow = refRect.bottom + OFFSET + popoverRect.height <= window.innerHeight;
    const top = fitsBelow ? refRect.bottom + OFFSET : refRect.top - OFFSET - popoverRect.height;

    popover.style.left = `${left + window.scrollX}px`;
    popover.style.top = `${top + window.scrollY}px`;
  }

  private scheduleHide = () => {
    this.cancelHide();
    this.hideTimeout = setTimeout(() => this.hide(), HIDE_DELAY);
  };

  private cancelHide = () => {
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
      this.hideTimeout = null;
    }
  };

  private hide() {
    this.cancelHide();
    this.popover?.remove();
    this.popover = null;
  }
}

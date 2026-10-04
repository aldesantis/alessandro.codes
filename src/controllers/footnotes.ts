import { Controller } from "@hotwired/stimulus";

const OFFSET = 8;
const VIEWPORT_MARGIN = 16;
const OPEN_DELAY = 300;
const HIDE_DELAY = 150;
// Moving to another reference within this window skips the delay and entrance.
const REENTRY_WINDOW = 300;
const POPOVER_ID = "footnote-popover";

// Shows a footnote's content in a popover when hovering or keyboard-focusing
// its reference, so readers don't have to jump to the bottom of the page.
// The popover is inserted right after the reference so links inside it are
// next in the tab order. Taps on touch screens still follow the link.
export default class FootnotesController extends Controller {
  private popover: HTMLElement | null = null;
  private activeRef: HTMLAnchorElement | null = null;
  private openTimeout: ReturnType<typeof setTimeout> | null = null;
  private hideTimeout: ReturnType<typeof setTimeout> | null = null;
  private hiddenAt = 0;
  private restoringFocus = false;

  override connect() {
    this.markSequences();
    const canHover = window.matchMedia("(hover: hover)").matches;

    for (const ref of this.refs()) {
      if (canHover) {
        ref.addEventListener("mouseenter", this.hoverRef);
        ref.addEventListener("mouseleave", this.leaveRef);
      }
      ref.addEventListener("focus", this.focusRef);
      ref.addEventListener("focusout", this.focusOut);
    }

    document.addEventListener("keydown", this.dismissOnEscape);
  }

  override disconnect() {
    for (const ref of this.refs()) {
      ref.removeEventListener("mouseenter", this.hoverRef);
      ref.removeEventListener("mouseleave", this.leaveRef);
      ref.removeEventListener("focus", this.focusRef);
      ref.removeEventListener("focusout", this.focusOut);
    }

    document.removeEventListener("keydown", this.dismissOnEscape);
    this.hide();
    this.popover?.remove();
    this.popover = null;
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

  private hoverRef = (event: Event) => {
    const ref = event.currentTarget as HTMLAnchorElement;
    this.cancelHide();
    this.cancelOpen();

    if (this.isOpen() || this.recentlyHidden()) {
      this.show(ref);
    } else {
      this.openTimeout = setTimeout(() => this.show(ref), OPEN_DELAY);
    }
  };

  private leaveRef = () => {
    this.cancelOpen();
    this.scheduleHide();
  };

  // Only keyboard focus opens the popover; a tap focuses the link too, and
  // should just navigate to the footnote.
  private focusRef = (event: Event) => {
    const ref = event.currentTarget as HTMLAnchorElement;
    if (this.restoringFocus || !ref.matches(":focus-visible")) return;

    this.cancelOpen();
    this.cancelHide();
    this.show(ref);
  };

  // Keep the popover while focus moves between the reference and its links.
  private focusOut = (event: FocusEvent) => {
    const next = event.relatedTarget as Node | null;
    if (next && (this.activeRef?.contains(next) || this.popover?.contains(next))) return;
    this.hide();
  };

  private show(ref: HTMLAnchorElement) {
    const id = decodeURIComponent(ref.hash.slice(1));
    const footnote = id && document.getElementById(id);
    if (!footnote) return;

    const popover = this.ensurePopover();
    const skipEntrance = this.isOpen() || this.recentlyHidden();

    if (ref !== this.activeRef) {
      this.activeRef?.removeAttribute("aria-describedby");
      popover.innerHTML = footnote.innerHTML;
      popover.querySelectorAll("[data-footnote-backref]").forEach((backref) => backref.remove());
      (ref.parentElement?.tagName === "SUP" ? ref.parentElement : ref).after(popover);
      this.activeRef = ref;
    }

    ref.setAttribute("aria-describedby", POPOVER_ID);
    popover.classList.toggle("no-enter", skipEntrance);
    popover.hidden = false;
    this.position(ref, popover);
  }

  private ensurePopover() {
    if (!this.popover) {
      const popover = document.createElement("div");
      popover.id = POPOVER_ID;
      popover.className = "footnote-popover not-prose";
      popover.hidden = true;
      popover.addEventListener("mouseenter", this.cancelHide);
      popover.addEventListener("mouseleave", this.scheduleHide);
      popover.addEventListener("focusout", this.focusOut);
      this.popover = popover;
    }
    return this.popover;
  }

  private position(ref: HTMLElement, popover: HTMLElement) {
    const refRect = ref.getBoundingClientRect();
    // offset* sizes ignore the entrance scale, unlike getBoundingClientRect.
    const width = popover.offsetWidth;
    const height = popover.offsetHeight;

    const maxLeft = document.documentElement.clientWidth - width - VIEWPORT_MARGIN;
    const refCenter = refRect.left + refRect.width / 2;
    const left = Math.max(VIEWPORT_MARGIN, Math.min(refCenter - width / 2, maxLeft));

    // Prefer below the reference, but flip above when there isn't room.
    const fitsBelow = refRect.bottom + OFFSET + height <= window.innerHeight;
    const top = fitsBelow ? refRect.bottom + OFFSET : refRect.top - OFFSET - height;

    // Grow out of the reference.
    popover.style.transformOrigin = `${refCenter - left}px ${fitsBelow ? "top" : "bottom"}`;

    const origin = this.containingBlockOrigin(popover);
    popover.style.left = `${left - origin.left}px`;
    popover.style.top = `${top - origin.top}px`;
  }

  // Viewport position of the box the popover's left/top are relative to:
  // its nearest positioned ancestor, or the document.
  private containingBlockOrigin(popover: HTMLElement) {
    for (let el = popover.parentElement; el && el !== document.body; el = el.parentElement) {
      if (getComputedStyle(el).position !== "static") {
        const rect = el.getBoundingClientRect();
        return { left: rect.left + el.clientLeft, top: rect.top + el.clientTop };
      }
    }
    return { left: -window.scrollX, top: -window.scrollY };
  }

  private isOpen() {
    return !!this.popover && !this.popover.hidden;
  }

  private recentlyHidden() {
    return performance.now() - this.hiddenAt < REENTRY_WINDOW;
  }

  // Pointer leaving shouldn't close a popover the keyboard is using.
  private scheduleHide = () => {
    this.cancelHide();
    this.hideTimeout = setTimeout(() => {
      if (this.popover?.contains(document.activeElement) || this.activeRef?.matches(":focus-visible")) return;
      this.hide();
    }, HIDE_DELAY);
  };

  private cancelHide = () => {
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
      this.hideTimeout = null;
    }
  };

  private cancelOpen() {
    if (this.openTimeout) {
      clearTimeout(this.openTimeout);
      this.openTimeout = null;
    }
  }

  private dismissOnEscape = (event: KeyboardEvent) => {
    if (event.key !== "Escape" || !this.isOpen()) return;

    const ref = this.activeRef;
    const focusInside = this.popover?.contains(document.activeElement);
    this.hide();
    if (focusInside && ref) {
      this.restoringFocus = true;
      ref.focus();
      this.restoringFocus = false;
    }
  };

  // Exit is instant: the popover is hidden in place, ready to be reused.
  private hide() {
    this.cancelHide();
    this.cancelOpen();
    if (!this.isOpen()) return;

    this.popover!.hidden = true;
    this.activeRef?.removeAttribute("aria-describedby");
    this.hiddenAt = performance.now();
  }
}

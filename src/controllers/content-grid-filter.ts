import { Controller } from "@hotwired/stimulus";

const TRANSITION_MS = 150; // matches duration-150 on the menu
const HIDDEN_STATE_CLASSES = ["opacity-0", "scale-95"];
// Keep the menu this far from the viewport edge before anchoring it to the right.
const VIEWPORT_MARGIN = 12;

/**
 * Disclosure-style dropdown for a ContentGrid filter. The panel holds
 * checkboxes (not menu items), so the button exposes aria-expanded and
 * aria-controls rather than a menu role.
 */
export default class ContentGridFilterController extends Controller {
  static override targets = ["button", "menu"];
  declare readonly buttonTarget: HTMLButtonElement;
  declare readonly menuTarget: HTMLElement;

  private closeTimeout: ReturnType<typeof setTimeout> | null = null;
  private openFrame: number | null = null;
  private isOpen = false;

  private readonly handleClickOutside = (event: MouseEvent): void => {
    if (this.isOpen && !this.element.contains(event.target as Node)) {
      this.close();
    }
  };

  private readonly handleFocusOut = (event: FocusEvent): void => {
    const next = event.relatedTarget as Node | null;
    // Pressing a non-focusable part of the menu (a label's padding) moves focus
    // to a focusable ancestor such as <main tabindex="-1">; that isn't leaving.
    if (this.isOpen && next && !this.element.contains(next) && !next.contains(this.element)) {
      this.close();
    }
  };

  override connect(): void {
    this.hideImmediately();
    document.addEventListener("click", this.handleClickOutside);
    this.element.addEventListener("focusout", this.handleFocusOut as EventListener);
  }

  override disconnect(): void {
    this.cancelPending();
    document.removeEventListener("click", this.handleClickOutside);
    this.element.removeEventListener("focusout", this.handleFocusOut as EventListener);
  }

  toggle(): void {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  open(): void {
    this.cancelPending();
    this.isOpen = true;
    this.buttonTarget.setAttribute("aria-expanded", "true");

    this.menuTarget.classList.remove("hidden");
    this.alignToViewport();
    // Flush styles so the enter transition starts from the hidden state.
    void this.menuTarget.offsetWidth;
    this.openFrame = requestAnimationFrame(() => {
      this.openFrame = null;
      this.menuTarget.classList.remove(...HIDDEN_STATE_CLASSES);
    });
  }

  close(): void {
    if (!this.isOpen) return;

    this.cancelPending();
    this.isOpen = false;
    this.buttonTarget.setAttribute("aria-expanded", "false");

    // Start the exit transition immediately, then hide once it has finished.
    this.menuTarget.classList.add(...HIDDEN_STATE_CLASSES);
    this.closeTimeout = setTimeout(() => {
      this.closeTimeout = null;
      this.menuTarget.classList.add("hidden");
    }, TRANSITION_MS);
  }

  /** Bound to Escape: close the panel and hand focus back to the button. */
  closeAndFocus(): void {
    if (!this.isOpen) return;

    this.close();
    this.buttonTarget.focus();
  }

  /**
   * Anchors the menu to the button's left edge, or to its right edge when it
   * would otherwise run off the viewport (e.g. the last filter in a row).
   * Uses offsetWidth, which ignores the scale-95 starting transform.
   */
  private alignToViewport(): void {
    const left = this.element.getBoundingClientRect().left;
    const overflows = left + this.menuTarget.offsetWidth > window.innerWidth - VIEWPORT_MARGIN;

    this.menuTarget.classList.toggle("left-0", !overflows);
    this.menuTarget.classList.toggle("origin-top-left", !overflows);
    this.menuTarget.classList.toggle("right-0", overflows);
    this.menuTarget.classList.toggle("origin-top-right", overflows);
  }

  private hideImmediately(): void {
    this.isOpen = false;
    this.buttonTarget.setAttribute("aria-expanded", "false");
    this.menuTarget.classList.add("hidden", ...HIDDEN_STATE_CLASSES);
  }

  private cancelPending(): void {
    if (this.closeTimeout !== null) {
      clearTimeout(this.closeTimeout);
      this.closeTimeout = null;
    }
    if (this.openFrame !== null) {
      cancelAnimationFrame(this.openFrame);
      this.openFrame = null;
    }
  }
}

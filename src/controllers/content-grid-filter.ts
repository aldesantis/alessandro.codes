import { Controller } from "@hotwired/stimulus";

const TRANSITION_MS = 150;

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
  private isOpen = false;

  private readonly handleClickOutside = (event: MouseEvent): void => {
    if (this.isOpen && !this.element.contains(event.target as Node)) {
      this.close();
    }
  };

  private readonly handleFocusOut = (event: FocusEvent): void => {
    const next = event.relatedTarget as Node | null;
    if (this.isOpen && next && !this.element.contains(next)) {
      this.close();
    }
  };

  override connect(): void {
    this.hideImmediately();
    document.addEventListener("click", this.handleClickOutside);
    this.element.addEventListener("focusout", this.handleFocusOut as EventListener);
  }

  override disconnect(): void {
    this.clearCloseTimeout();
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
    this.clearCloseTimeout();
    this.isOpen = true;
    this.buttonTarget.setAttribute("aria-expanded", "true");
    this.menuTarget.classList.remove("hidden");
    requestAnimationFrame(() => {
      this.menuTarget.classList.remove("opacity-0", "scale-95");
      this.menuTarget.classList.add("opacity-100", "scale-100");
    });
  }

  close(): void {
    if (!this.isOpen) return;

    this.isOpen = false;
    this.buttonTarget.setAttribute("aria-expanded", "false");
    this.menuTarget.classList.remove("opacity-100", "scale-100");
    this.menuTarget.classList.add("opacity-0", "scale-95");

    this.clearCloseTimeout();
    this.closeTimeout = setTimeout(() => {
      this.menuTarget.classList.add("hidden");
      this.closeTimeout = null;
    }, TRANSITION_MS);
  }

  /** Bound to Escape: close the panel and hand focus back to the button. */
  closeAndFocus(): void {
    if (!this.isOpen) return;

    this.close();
    this.buttonTarget.focus();
  }

  private hideImmediately(): void {
    this.isOpen = false;
    this.buttonTarget.setAttribute("aria-expanded", "false");
    this.menuTarget.classList.add("hidden", "opacity-0", "scale-95");
    this.menuTarget.classList.remove("opacity-100", "scale-100");
  }

  private clearCloseTimeout(): void {
    if (this.closeTimeout) {
      clearTimeout(this.closeTimeout);
      this.closeTimeout = null;
    }
  }
}

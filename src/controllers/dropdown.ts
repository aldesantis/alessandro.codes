import { Controller } from "@hotwired/stimulus";

const HIDDEN_STATE_CLASSES = ["opacity-0", "scale-95"];
const ANIMATION_DURATION = 150; // ms, matches duration-150 on the menu

export default class DropdownController extends Controller {
  static override targets = ["button", "menu"];
  declare readonly buttonTarget: HTMLButtonElement;
  declare readonly menuTarget: HTMLElement;

  private closeTimeout: ReturnType<typeof setTimeout> | null = null;
  private openFrame: number | null = null;
  private isOpen = false;

  override connect() {
    document.addEventListener("keydown", this.handleKeyDown);
    document.addEventListener("click", this.handleClickOutside);
  }

  override disconnect() {
    this.cancelPending();
    document.removeEventListener("keydown", this.handleKeyDown);
    document.removeEventListener("click", this.handleClickOutside);
  }

  toggle() {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  open() {
    this.cancelPending();
    this.isOpen = true;
    this.buttonTarget.setAttribute("aria-expanded", "true");

    this.menuTarget.classList.remove("hidden");
    // Flush styles so the enter transition starts from the hidden state.
    void this.menuTarget.offsetWidth;
    this.openFrame = requestAnimationFrame(() => {
      this.openFrame = null;
      this.menuTarget.classList.remove(...HIDDEN_STATE_CLASSES);
    });
  }

  close({ restoreFocus = false }: { restoreFocus?: boolean } = {}) {
    if (!this.isOpen) return;

    this.cancelPending();
    this.isOpen = false;
    this.buttonTarget.setAttribute("aria-expanded", "false");

    // Start the exit transition immediately, then hide once it has finished.
    this.menuTarget.classList.add(...HIDDEN_STATE_CLASSES);
    this.closeTimeout = setTimeout(() => {
      this.closeTimeout = null;
      this.menuTarget.classList.add("hidden");
    }, ANIMATION_DURATION);

    if (restoreFocus) {
      this.buttonTarget.focus();
    }
  }

  private cancelPending() {
    if (this.closeTimeout !== null) {
      clearTimeout(this.closeTimeout);
      this.closeTimeout = null;
    }
    if (this.openFrame !== null) {
      cancelAnimationFrame(this.openFrame);
      this.openFrame = null;
    }
  }

  private handleClickOutside = (event: MouseEvent) => {
    if (this.isOpen && event.target instanceof Node && !this.element.contains(event.target)) {
      this.close();
    }
  };

  private handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Escape" && this.isOpen) {
      this.close({ restoreFocus: true });
    }
  };
}

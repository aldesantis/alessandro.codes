import { Controller } from "@hotwired/stimulus";

export default class DropdownController extends Controller {
  static targets = ["button", "menu"];

  connect() {
    this.closeTimeout = null;
    document.addEventListener("keydown", this.handleKeyDown.bind(this));
  }

  disconnect() {
    if (this.closeTimeout) {
      clearTimeout(this.closeTimeout);
    }
    document.removeEventListener("keydown", this.handleKeyDown.bind(this));
  }

  toggle() {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  open() {
    if (this.closeTimeout) {
      clearTimeout(this.closeTimeout);
    }
    this.menuTarget.classList.remove("hidden", "opacity-0", "scale-95");
    this.menuTarget.classList.add("opacity-100", "scale-100");
    this.buttonTarget.setAttribute("aria-expanded", "true");
    this.isOpen = true;
  }

  close() {
    this.closeTimeout = setTimeout(() => {
      if (!this.element.contains(document.activeElement)) {
        this.menuTarget.classList.remove("opacity-100", "scale-100");
        this.menuTarget.classList.add("opacity-0", "scale-95");

        // Wait for transition to complete before hiding
        setTimeout(() => {
          if (!this.isOpen) {
            this.menuTarget.classList.add("hidden");
          }
        }, 100);

        this.buttonTarget.setAttribute("aria-expanded", "false");
        this.isOpen = false;
      }
    }, 100);
  }

  handleKeyDown(event) {
    if (event.key === "Escape" && this.isOpen) {
      this.close();
    }
  }
} 

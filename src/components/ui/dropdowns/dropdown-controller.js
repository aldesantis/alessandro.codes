import { Controller } from "@hotwired/stimulus";

export default class DropdownController extends Controller {
  static targets = ["button", "menu"];

  connect() {
    // Set up event listeners
    document.addEventListener("mouseleave", this.handleMouseLeave.bind(this));
    document.addEventListener("keydown", this.handleKeyDown.bind(this));
  }

  disconnect() {
    document.removeEventListener("mouseleave", this.handleMouseLeave.bind(this));
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
    this.menuTarget.classList.remove("hidden", "opacity-0", "scale-95");
    this.menuTarget.classList.add("opacity-100", "scale-100");
    this.buttonTarget.setAttribute("aria-expanded", "true");
    this.isOpen = true;
  }

  close() {
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

  handleMouseLeave(event) {
    // Only close if we're leaving the entire dropdown area
    if (!this.element.contains(event.relatedTarget) && this.isOpen) {
      this.close();
    }
  }

  handleKeyDown(event) {
    if (event.key === "Escape" && this.isOpen) {
      this.close();
    }
  }
} 

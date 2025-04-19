import { Controller } from "@hotwired/stimulus";

export default class NavbarController extends Controller {
  static targets = ["mobileMenu", "mobileToggle", "mobileClose"];

  connect() {
    // Set up event listeners
    document.addEventListener("click", this.handleClickOutside.bind(this));
    document.addEventListener("keydown", this.handleKeyDown.bind(this));
  }

  disconnect() {
    document.removeEventListener("click", this.handleClickOutside.bind(this));
    document.removeEventListener("keydown", this.handleKeyDown.bind(this));
  }

  openMenu() {
    this.mobileMenuTarget.classList.remove("translate-x-full");
    document.body.style.overflow = "hidden";
  }

  closeMenu() {
    this.mobileMenuTarget.classList.add("translate-x-full");
    document.body.style.overflow = "";
  }

  handleClickOutside(event) {
    if (
      event.target instanceof Node &&
      !this.element.contains(event.target) &&
      !this.mobileMenuTarget.contains(event.target)
    ) {
      this.closeMenu();
    }
  }

  handleKeyDown(event) {
    if (event.key === "Escape") {
      this.closeMenu();
    }
  }
}

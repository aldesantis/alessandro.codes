import { Controller } from "@hotwired/stimulus";

export default class NavbarController extends Controller {
  static override targets = ["mobileMenu", "mobileToggle", "mobileClose"];
  declare readonly mobileMenuTarget: HTMLElement;
  declare readonly mobileToggleTarget: HTMLElement;
  declare readonly mobileCloseTarget: HTMLElement;

  private isOpen = false;

  override connect() {
    document.addEventListener("click", this.handleClickOutside);
    document.addEventListener("keydown", this.handleKeyDown);
  }

  override disconnect() {
    document.removeEventListener("click", this.handleClickOutside);
    document.removeEventListener("keydown", this.handleKeyDown);
    if (this.isOpen) {
      document.body.style.overflow = "";
    }
  }

  openMenu() {
    if (this.isOpen) return;
    this.isOpen = true;

    this.mobileMenuTarget.inert = false;
    this.mobileMenuTarget.dataset.open = "";
    this.mobileToggleTarget.setAttribute("aria-expanded", "true");
    document.body.style.overflow = "hidden";
    this.mobileCloseTarget.focus();
  }

  closeMenu() {
    if (!this.isOpen) return;
    this.isOpen = false;

    // Move focus back before the drawer becomes inert so it isn't lost to <body>.
    const focusWasInside = this.mobileMenuTarget.contains(document.activeElement);
    if (focusWasInside) {
      this.mobileToggleTarget.focus();
    }

    delete this.mobileMenuTarget.dataset.open;
    this.mobileMenuTarget.inert = true;
    this.mobileToggleTarget.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
  }

  private handleClickOutside = (event: MouseEvent) => {
    if (
      this.isOpen &&
      event.target instanceof Node &&
      !this.element.contains(event.target) &&
      !this.mobileMenuTarget.contains(event.target)
    ) {
      this.closeMenu();
    }
  };

  private handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Escape" && this.isOpen) {
      this.closeMenu();
    }
  };
}

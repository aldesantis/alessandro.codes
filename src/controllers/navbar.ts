import { Controller } from "@hotwired/stimulus";

// Matches Tailwind's `md` breakpoint, where the drawer is hidden.
const DESKTOP_QUERY = "(min-width: 48rem)";

export default class NavbarController extends Controller {
  static override targets = ["bar", "scrim", "mobileMenu", "mobileToggle", "mobileClose"];
  declare readonly barTarget: HTMLElement;
  declare readonly scrimTarget: HTMLElement;
  declare readonly mobileMenuTarget: HTMLElement;
  declare readonly mobileToggleTarget: HTMLElement;
  declare readonly mobileCloseTarget: HTMLElement;

  private isOpen = false;
  // Elements we made inert while the drawer is open, so we only undo our own changes.
  private inertedElements: HTMLElement[] = [];
  private desktopQuery: MediaQueryList | null = null;

  override connect() {
    document.addEventListener("keydown", this.handleKeyDown);
    this.desktopQuery = window.matchMedia(DESKTOP_QUERY);
    this.desktopQuery.addEventListener("change", this.handleBreakpointChange);
  }

  override disconnect() {
    document.removeEventListener("keydown", this.handleKeyDown);
    this.desktopQuery?.removeEventListener("change", this.handleBreakpointChange);
    if (this.isOpen) {
      this.releasePage();
      document.body.style.overflow = "";
    }
  }

  openMenu() {
    if (this.isOpen) return;
    this.isOpen = true;

    this.mobileMenuTarget.inert = false;
    this.mobileMenuTarget.dataset.open = "";
    this.scrimTarget.dataset.open = "";
    this.mobileToggleTarget.setAttribute("aria-expanded", "true");
    document.body.style.overflow = "hidden";
    this.inertPage();
    this.mobileCloseTarget.focus();
  }

  closeMenu() {
    if (!this.isOpen) return;
    this.isOpen = false;

    // Un-inert the page first so focus can return to the menu button.
    this.releasePage();
    const active = document.activeElement;
    if (this.mobileMenuTarget.contains(active) || active === document.body || active === null) {
      this.mobileToggleTarget.focus();
    }

    delete this.mobileMenuTarget.dataset.open;
    delete this.scrimTarget.dataset.open;
    this.mobileMenuTarget.inert = true;
    this.mobileToggleTarget.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
  }

  // Make everything outside the drawer inert, which also keeps Tab inside it.
  private inertPage() {
    const candidates = [this.barTarget, ...Array.from(document.body.children)];
    this.inertedElements = candidates.filter(
      (el): el is HTMLElement =>
        el instanceof HTMLElement &&
        el !== this.element &&
        !el.inert &&
        !["SCRIPT", "STYLE", "TEMPLATE"].includes(el.tagName)
    );
    this.inertedElements.forEach((el) => (el.inert = true));
  }

  private releasePage() {
    this.inertedElements.forEach((el) => (el.inert = false));
    this.inertedElements = [];
  }

  private handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Escape" && this.isOpen) {
      this.closeMenu();
    }
  };

  private handleBreakpointChange = (event: MediaQueryListEvent) => {
    if (event.matches) this.closeMenu();
  };
}

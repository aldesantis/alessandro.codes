import { Controller } from "@hotwired/stimulus";

const COPIED_DURATION = 1500;

const LINK_ICON = `<svg aria-hidden="true" viewBox="0 0 16 16" width="0.75em" height="0.75em" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M6.5 9.5a3 3 0 0 0 4.24 0l2.12-2.12a3 3 0 0 0-4.24-4.24l-.7.7"/><path d="M9.5 6.5a3 3 0 0 0-4.24 0L3.14 8.62a3 3 0 0 0 4.24 4.24l.7-.7"/></svg>`;
const CHECK_ICON = `<svg aria-hidden="true" viewBox="0 0 16 16" width="0.75em" height="0.75em" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 8.5l3 3 7-7"/></svg>`;

// Adds a link after each prose heading that copies the URL to that section,
// so readers can share a specific part of a page.
export default class HeadingLinksController extends Controller {
  private status: HTMLElement | null = null;
  private resetTimeouts = new Map<HTMLAnchorElement, ReturnType<typeof setTimeout>>();

  override connect() {
    this.status = document.createElement("span");
    this.status.className = "sr-only";
    this.status.setAttribute("role", "status");
    this.element.appendChild(this.status);

    for (const heading of this.headings()) {
      const link = document.createElement("a");
      link.href = `#${encodeURIComponent(heading.id)}`;
      link.className = "heading-link";
      link.setAttribute("aria-label", `Copy link to “${heading.textContent?.trim()}”`);
      link.innerHTML = `<span class="heading-link-icon" data-icon="link">${LINK_ICON}</span><span class="heading-link-icon" data-icon="check">${CHECK_ICON}</span>`;
      link.addEventListener("click", this.copy);

      heading.append(link);
    }
  }

  override disconnect() {
    for (const link of this.element.querySelectorAll<HTMLAnchorElement>("a.heading-link")) {
      link.removeEventListener("click", this.copy);
      link.remove();
    }

    this.resetTimeouts.forEach((timeout) => clearTimeout(timeout));
    this.resetTimeouts.clear();
    this.status?.remove();
  }

  private headings() {
    return this.element.querySelectorAll<HTMLElement>(":scope > :is(h1, h2, h3, h4)[id]");
  }

  // Falls through to plain in-page navigation when the clipboard is unavailable.
  private copy = async (event: MouseEvent) => {
    if (!navigator.clipboard || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

    event.preventDefault();
    const link = event.currentTarget as HTMLAnchorElement;
    const url = new URL(link.hash, window.location.href).href;

    try {
      await navigator.clipboard.writeText(url);
    } catch {
      window.location.hash = link.hash;
      return;
    }

    history.replaceState(history.state, "", link.hash);
    this.showCopied(link);
  };

  private showCopied(link: HTMLAnchorElement) {
    link.dataset.copied = "";
    if (this.status) this.status.textContent = "Link copied";

    clearTimeout(this.resetTimeouts.get(link));
    this.resetTimeouts.set(
      link,
      setTimeout(() => {
        delete link.dataset.copied;
        if (this.status) this.status.textContent = "";
        this.resetTimeouts.delete(link);
      }, COPIED_DURATION)
    );
  }
}

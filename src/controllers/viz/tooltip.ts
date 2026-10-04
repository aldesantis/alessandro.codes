import { Controller } from "@hotwired/stimulus";

// Shows a tooltip for any descendant with `data-tip` (the value) and an
// optional `data-tip-label` (what the value is). Works on hover and focus;
// Escape dismisses it.

// Moving between marks within this window skips the entrance animation.
const REENTRY_WINDOW = 300;

export default class VizTooltipController extends Controller<HTMLElement> {
  private tooltip: HTMLDivElement | null = null;
  private hiddenAt = 0;

  override connect() {
    this.element.addEventListener("pointerover", this.show);
    this.element.addEventListener("pointerout", this.hide);
    this.element.addEventListener("focusin", this.show);
    this.element.addEventListener("focusout", this.hide);
    document.addEventListener("keydown", this.dismissOnEscape);
  }

  override disconnect() {
    this.element.removeEventListener("pointerover", this.show);
    this.element.removeEventListener("pointerout", this.hide);
    this.element.removeEventListener("focusin", this.show);
    this.element.removeEventListener("focusout", this.hide);
    document.removeEventListener("keydown", this.dismissOnEscape);
    this.tooltip?.remove();
  }

  private show = (event: Event) => {
    const target = (event.target as Element).closest<Element>("[data-tip]");
    if (!target || !this.element.contains(target)) return;

    const tooltip = this.ensureTooltip();
    const value = document.createElement("strong");
    value.textContent = target.getAttribute("data-tip");
    tooltip.replaceChildren(value);

    const label = target.getAttribute("data-tip-label");
    if (label) tooltip.append(document.createTextNode(label));

    if (tooltip.hidden) {
      tooltip.toggleAttribute("data-entering", performance.now() - this.hiddenAt > REENTRY_WINDOW);
    }
    tooltip.hidden = false;
    const host = this.element.getBoundingClientRect();
    const mark = target.getBoundingClientRect();
    const left = mark.left - host.left + mark.width / 2 - tooltip.offsetWidth / 2;
    const maxLeft = host.width - tooltip.offsetWidth - 4;
    tooltip.style.left = `${Math.max(4, Math.min(left, maxLeft))}px`;
    tooltip.style.top = `${mark.top - host.top - tooltip.offsetHeight - 8}px`;
  };

  private hide = (event: Event) => {
    const related = (event as PointerEvent | FocusEvent).relatedTarget as Element | null;
    const target = (event.target as Element).closest("[data-tip]");
    if (target && related && target.contains(related)) return;
    this.dismiss();
  };

  private dismissOnEscape = (event: KeyboardEvent) => {
    if (event.key === "Escape" && this.tooltip && !this.tooltip.hidden) this.dismiss();
  };

  private dismiss() {
    if (!this.tooltip || this.tooltip.hidden) return;
    this.tooltip.hidden = true;
    this.hiddenAt = performance.now();
  }

  private ensureTooltip() {
    if (!this.tooltip) {
      this.tooltip = document.createElement("div");
      this.tooltip.className = "viz-tooltip";
      this.tooltip.setAttribute("role", "tooltip");
      this.element.append(this.tooltip);
    }
    return this.tooltip;
  }
}

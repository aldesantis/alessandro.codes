import { Controller } from "@hotwired/stimulus";

// Shows a tooltip for any descendant with `data-tip` (the value) and an
// optional `data-tip-label` (what the value is). Works on hover, keyboard
// focus and tap; Escape, or a tap outside the figure, dismisses it.
//
// The tooltip points at the mark itself, not the whole hit area: a descendant
// with `data-tip-anchor` if there is one, else the visible circle of a
// `DataPoint`, else the pointer's height for a hover over a wide band.
// While shown, the trigger gets `data-tip-active` (for styling, e.g. a guide
// line) and `aria-describedby` pointing at the tooltip.

// Moving between marks within this window skips the entrance animation.
const REENTRY_WINDOW = 300;
const GAP = 8;

let nextId = 0;

export default class VizTooltipController extends Controller<HTMLElement> {
  private tooltip: HTMLDivElement | null = null;
  private trigger: Element | null = null;
  private hiddenAt = 0;

  override connect() {
    this.element.addEventListener("pointerover", this.onPointerOver);
    this.element.addEventListener("pointerout", this.onPointerOut);
    this.element.addEventListener("pointerup", this.onPointerUp);
    this.element.addEventListener("focusin", this.onFocusIn);
    this.element.addEventListener("focusout", this.onFocusOut);
    document.addEventListener("keydown", this.dismissOnEscape);
    document.addEventListener("pointerdown", this.dismissOnOutsideTap);
  }

  override disconnect() {
    this.element.removeEventListener("pointerover", this.onPointerOver);
    this.element.removeEventListener("pointerout", this.onPointerOut);
    this.element.removeEventListener("pointerup", this.onPointerUp);
    this.element.removeEventListener("focusin", this.onFocusIn);
    this.element.removeEventListener("focusout", this.onFocusOut);
    document.removeEventListener("keydown", this.dismissOnEscape);
    document.removeEventListener("pointerdown", this.dismissOnOutsideTap);
    this.dismiss();
    this.tooltip?.remove();
  }

  // Touch fires pointerover and pointerout around every tap, so taps are
  // handled in `onPointerUp` instead.
  private onPointerOver = (event: PointerEvent) => {
    if (event.pointerType === "touch") return;
    const target = this.tipTarget(event);
    if (target) this.show(target, event.clientY);
  };

  private onPointerOut = (event: PointerEvent) => {
    if (event.pointerType === "touch") return;
    const related = event.relatedTarget as Element | null;
    const target = (event.target as Element).closest("[data-tip]");
    if (target && related && target.contains(related)) return;
    this.dismiss();
  };

  // A tap toggles the tooltip for that mark; a tap elsewhere in the figure
  // dismisses it.
  private onPointerUp = (event: PointerEvent) => {
    if (event.pointerType !== "touch") return;
    const target = this.tipTarget(event);
    if (!target || (target === this.trigger && !this.tooltip?.hidden)) this.dismiss();
    else this.show(target, event.clientY);
  };

  // Only keyboard focus shows the tooltip: a click or tap also focuses the
  // mark, and the pointer handlers already deal with those.
  private onFocusIn = (event: FocusEvent) => {
    const target = this.tipTarget(event);
    if (target && target.matches(":focus-visible")) this.show(target);
  };

  private onFocusOut = (event: FocusEvent) => {
    const related = event.relatedTarget as Element | null;
    if (this.trigger && related && this.trigger.contains(related)) return;
    if (this.trigger && this.trigger.contains(event.target as Element)) this.dismiss();
  };

  private dismissOnEscape = (event: KeyboardEvent) => {
    if (event.key === "Escape") this.dismiss();
  };

  private dismissOnOutsideTap = (event: PointerEvent) => {
    if (!this.element.contains(event.target as Node)) this.dismiss();
  };

  private tipTarget(event: Event) {
    const target = (event.target as Element).closest<Element>("[data-tip]");
    return target && this.element.contains(target) ? target : null;
  }

  private show(target: Element, pointerY?: number) {
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
    this.setTrigger(target);

    const host = this.element.getBoundingClientRect();
    const mark = this.anchorRect(target, pointerY);
    const left = mark.left - host.left + mark.width / 2 - tooltip.offsetWidth / 2;
    const maxLeft = host.width - tooltip.offsetWidth - 4;
    tooltip.style.left = `${Math.max(4, Math.min(left, maxLeft))}px`;

    // Above the mark, unless that would run off the figure or the viewport.
    const above = mark.top - tooltip.offsetHeight - GAP;
    const below = above < 0 || above < host.top;
    tooltip.toggleAttribute("data-below", below);
    tooltip.style.top = below ? `${mark.bottom - host.top + GAP}px` : `${above - host.top}px`;
  }

  private anchorRect(target: Element, pointerY?: number) {
    const mark = target.querySelector("[data-tip-anchor]") ?? target.querySelector("circle:not([fill='transparent'])");
    if (mark) return mark.getBoundingClientRect();

    const rect = target.getBoundingClientRect();
    // A tall band (e.g. a chart column): point at where the pointer is.
    if (pointerY !== undefined && rect.height > 48) {
      return new DOMRect(rect.left, pointerY, rect.width, 0);
    }
    return rect;
  }

  private setTrigger(target: Element | null) {
    if (this.trigger === target) return;
    if (this.trigger) {
      this.trigger.removeAttribute("data-tip-active");
      this.trigger.removeAttribute("aria-describedby");
    }
    this.trigger = target;
    if (target && this.tooltip) {
      target.setAttribute("data-tip-active", "");
      target.setAttribute("aria-describedby", this.tooltip.id);
    }
  }

  private dismiss() {
    this.setTrigger(null);
    if (!this.tooltip || this.tooltip.hidden) return;
    this.tooltip.hidden = true;
    this.hiddenAt = performance.now();
  }

  private ensureTooltip() {
    if (!this.tooltip) {
      this.tooltip = document.createElement("div");
      this.tooltip.id = `viz-tooltip-${nextId++}`;
      this.tooltip.className = "viz-tooltip";
      this.tooltip.setAttribute("role", "tooltip");
      this.tooltip.hidden = true;
      this.element.append(this.tooltip);
    }
    return this.tooltip;
  }
}

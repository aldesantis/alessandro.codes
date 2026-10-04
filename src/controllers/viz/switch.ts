import { Controller } from "@hotwired/stimulus";
import { setPressed } from "./helpers";

// Switches between pre-rendered panels (e.g. log and linear scales). Pair a
// `SegmentedControl` (target "button") with panels whose `data-value` matches
// each option's value.
export default class VizSwitchController extends Controller {
  static override targets = ["button", "panel"];
  declare readonly buttonTargets: HTMLButtonElement[];
  declare readonly panelTargets: (HTMLElement | SVGElement)[];

  select(event: Event) {
    const button = event.currentTarget as HTMLElement;
    setPressed(this.buttonTargets, this.buttonTargets.indexOf(button as HTMLButtonElement));
    this.panelTargets.forEach((panel) => {
      panel.style.display = panel.dataset.value === button.dataset.value ? "" : "none";
    });
  }
}

import { Controller } from "@hotwired/stimulus";

// Switches between pre-rendered chart layers (e.g. log and linear scales).
export default class VizScaleController extends Controller {
  static override targets = ["button", "layer"];
  declare readonly buttonTargets: HTMLButtonElement[];
  declare readonly layerTargets: SVGGElement[];

  select(event: Event) {
    const scale = (event.currentTarget as HTMLElement).dataset.scale;
    this.buttonTargets.forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.scale === scale)));
    this.layerTargets.forEach((layer) =>
      layer.setAttribute("display", layer.dataset.scale === scale ? "inline" : "none")
    );
  }
}

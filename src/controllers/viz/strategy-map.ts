import { Controller } from "@hotwired/stimulus";
import { frontierEdge, frontierLevel, frontierPath, toX, toY } from "../../lib/viz/strategy-map";
import { setAttributes } from "./helpers";

// Places the reader on the advantage/strategy map and lets them move AI's
// frontier forward to see when their work gets absorbed.
export default class StrategyMapController extends Controller {
  static override targets = ["advantage", "openness", "capability", "frontierArea", "frontierEdge", "dot", "dotLabel"];

  declare readonly advantageTarget: HTMLInputElement;
  declare readonly opennessTarget: HTMLInputElement;
  declare readonly capabilityTarget: HTMLInputElement;
  declare readonly frontierAreaTarget: SVGPathElement;
  declare readonly frontierEdgeTarget: SVGPathElement;
  declare readonly dotTarget: SVGCircleElement;
  declare readonly dotLabelTarget: SVGTextElement;

  override connect() {
    this.update();
  }

  update() {
    const x = Number(this.opennessTarget.value) / 100;
    const y = Number(this.advantageTarget.value) / 100;
    const level = frontierLevel(Number(this.capabilityTarget.value));

    this.frontierAreaTarget.setAttribute("d", frontierPath(level));
    this.frontierEdgeTarget.setAttribute("d", frontierEdge(level));

    setAttributes(this.dotTarget, { cx: toX(x), cy: toY(y) });
    // Flip the label to the left of the dot near the right edge.
    const flip = x > 0.85;
    setAttributes(this.dotLabelTarget, {
      x: toX(x) + (flip ? -14 : 14),
      y: toY(y) + 4,
      "text-anchor": flip ? "end" : "start",
    });
  }
}

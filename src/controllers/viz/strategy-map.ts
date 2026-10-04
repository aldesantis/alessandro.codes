import { Controller } from "@hotwired/stimulus";
import { TODAY, exposure, frontierEdge, frontierLevel, frontierPath, toX, toY } from "../../lib/viz/strategy-map";
import { describeScale, syncSlider } from "./helpers";

// Places the reader on the advantage/strategy map and lets them move AI's
// frontier forward to see when their work gets absorbed.
export default class StrategyMapController extends Controller {
  static override targets = ["advantage", "openness", "capability", "frontierArea", "frontierEdge", "you", "youLabel"];

  declare readonly advantageTarget: HTMLInputElement;
  declare readonly opennessTarget: HTMLInputElement;
  declare readonly capabilityTarget: HTMLInputElement;
  declare readonly frontierAreaTarget: SVGPathElement;
  declare readonly frontierEdgeTarget: SVGPathElement;
  declare readonly youTarget: SVGGElement;
  declare readonly youLabelTarget: SVGTextElement;

  override connect() {
    this.update();
  }

  update() {
    const x = Number(this.opennessTarget.value) / 100;
    const y = Number(this.advantageTarget.value) / 100;
    const capability = Number(this.capabilityTarget.value);
    const level = frontierLevel(capability);

    this.frontierAreaTarget.setAttribute("d", frontierPath(level));
    this.frontierEdgeTarget.setAttribute("d", frontierEdge(level));

    // The dot and its label move together as one group, so they tween as one.
    this.youTarget.style.transform = `translate(${toX(x)}px, ${toY(y)}px)`;
    // Flip the label to the left of the dot near the right edge.
    const flip = x > 0.85;
    this.youLabelTarget.setAttribute("x", String(flip ? -14 : 14));
    this.youLabelTarget.setAttribute("text-anchor", flip ? "end" : "start");

    const where = `Your work is ${exposure(x, y) < level ? "inside" : "outside"} AI’s frontier.`;
    const era =
      Math.abs(capability - TODAY) <= 3 ? "Today" : capability < TODAY ? "Earlier than today" : "Later than today";
    syncSlider(this.advantageTarget, `${describeScale(this.advantageTarget)}. ${where}`);
    syncSlider(this.opennessTarget, `${describeScale(this.opennessTarget)}. ${where}`);
    syncSlider(this.capabilityTarget, `${era}. ${where}`);
  }
}

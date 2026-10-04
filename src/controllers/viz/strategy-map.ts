import { Controller } from "@hotwired/stimulus";
import {
  TODAY,
  exposure,
  frontierEdge,
  frontierLevel,
  frontierPath,
  nextMove,
  quadrantFor,
  toX,
  toY,
} from "../../lib/viz/strategy-map";
import { setAttributes } from "./helpers";

// Places the reader on the advantage/strategy map and lets them move AI's
// frontier forward to see when their work gets absorbed.
export default class StrategyMapController extends Controller {
  static override targets = [
    "advantage",
    "openness",
    "capability",
    "frontierArea",
    "frontierEdge",
    "dot",
    "dotLabel",
    "quadrant",
    "description",
    "status",
    "move",
  ];

  declare readonly advantageTarget: HTMLInputElement;
  declare readonly opennessTarget: HTMLInputElement;
  declare readonly capabilityTarget: HTMLInputElement;
  declare readonly frontierAreaTarget: SVGPathElement;
  declare readonly frontierEdgeTarget: SVGPathElement;
  declare readonly dotTarget: SVGCircleElement;
  declare readonly dotLabelTarget: SVGTextElement;
  declare readonly quadrantTarget: HTMLElement;
  declare readonly descriptionTarget: HTMLElement;
  declare readonly statusTarget: HTMLElement;
  declare readonly moveTarget: HTMLElement;

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

    setAttributes(this.dotTarget, { cx: toX(x), cy: toY(y) });
    // Flip the label to the left of the dot near the right edge.
    const flip = x > 0.85;
    setAttributes(this.dotLabelTarget, {
      x: toX(x) + (flip ? -14 : 14),
      y: toY(y) + 4,
      "text-anchor": flip ? "end" : "start",
    });

    const quadrant = quadrantFor(x, y);
    this.quadrantTarget.textContent = quadrant.name;
    this.descriptionTarget.textContent = quadrant.text;
    this.moveTarget.textContent = nextMove(x, y);

    const absorbed = exposure(x, y) < level;
    const when = capability < TODAY ? "already" : capability === TODAY ? "today" : "at this point";
    this.statusTarget.replaceChildren(
      this.marker(absorbed),
      document.createTextNode(
        absorbed ? `Inside the frontier: AI absorbs this work ${when}.` : "Outside the frontier, for now."
      )
    );
    this.statusTarget.style.color = absorbed ? "#b8441a" : "var(--viz-ink)";
  }

  private marker(absorbed: boolean) {
    const marker = document.createElement("span");
    marker.setAttribute("aria-hidden", "true");
    marker.className = "mt-1.5 inline-block h-2 w-2 shrink-0 rounded-full";
    marker.style.background = absorbed ? "var(--viz-ai)" : "var(--viz-human)";
    return marker;
  }
}

import type { Application } from "@hotwired/stimulus";
import VizTooltipController from "./tooltip";
import VizRevealController from "./reveal";
import VizSwitchController from "./switch";
import StrategyMapController from "./strategy-map";
import ProfessionMapController from "./profession-map";
import ExecutionLadderController from "./execution-ladder";

// Controllers for the essay figures (src/components/viz). Shared behaviors are
// prefixed with `viz-`; the rest belong to a single figure.
export function registerVizControllers(application: Application) {
  application.register("viz-tooltip", VizTooltipController);
  application.register("viz-reveal", VizRevealController);
  application.register("viz-switch", VizSwitchController);
  application.register("strategy-map", StrategyMapController);
  application.register("profession-map", ProfessionMapController);
  application.register("execution-ladder", ExecutionLadderController);
}

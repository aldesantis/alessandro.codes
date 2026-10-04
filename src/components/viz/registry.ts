import ExecutionLadder from "./figures/ExecutionLadder.astro";
import FactoryPower from "./figures/FactoryPower.astro";
import IdeationGap from "./figures/IdeationGap.astro";
import StrategyMap from "./figures/StrategyMap.astro";
import TimeHorizon from "./figures/TimeHorizon.astro";

// Figures that garden content can embed with a `> [!figure] <name>` callout
// (see `embedFigures()` in zendo.config.ts).
export const figures: Record<string, (props: Record<string, never>) => unknown> = {
  "execution-ladder": ExecutionLadder,
  "factory-power": FactoryPower,
  "ideation-gap": IdeationGap,
  "strategy-map": StrategyMap,
  "time-horizon": TimeHorizon,
};

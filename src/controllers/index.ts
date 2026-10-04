import { Application } from "@hotwired/stimulus";

import RelativeDateController from "./relative-date";
import ContentGridFilterController from "./content-grid-filter";
import ContentCardController from "./content-card";
import CommandPaletteController from "./command-palette";
import DropdownController from "./dropdown";
import NavbarController from "./navbar";
import ContentGridController from "./content-grid";
import ServingsController from "./servings";
import FootnotesController from "./footnotes";
import TocController from "./toc";
import VizTooltipController from "./viz/tooltip";
import VizRevealController from "./viz/reveal";
import VizScaleController from "./viz/scale";
import StrategyMapController from "./viz/strategy-map";
import ProfessionMapController from "./viz/profession-map";
import ExecutionLadderController from "./viz/execution-ladder";

const application = Application.start();

application.register("relative-date", RelativeDateController);
application.register("content-grid", ContentGridController);
application.register("content-filter", ContentGridFilterController);
application.register("content-card", ContentCardController);
application.register("command-palette", CommandPaletteController);
application.register("dropdown", DropdownController);
application.register("navbar", NavbarController);
application.register("servings", ServingsController);
application.register("footnotes", FootnotesController);
application.register("toc", TocController);
application.register("viz-tooltip", VizTooltipController);
application.register("viz-reveal", VizRevealController);
application.register("viz-scale", VizScaleController);
application.register("strategy-map", StrategyMapController);
application.register("profession-map", ProfessionMapController);
application.register("execution-ladder", ExecutionLadderController);

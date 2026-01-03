import { Application } from "@hotwired/stimulus";

import RelativeDateController from "./relative-date";
import GardenEntriesGridController from "./garden-entries-grid";
import GardenFiltersController from "./garden-filters";
import GardenFilterDropdownController from "./garden-filter-dropdown";
import GardenLazyCardController from "./garden-lazy-card";
import CommandPaletteController from "./command-palette";
import DropdownController from "./dropdown";
import NavbarController from "./navbar";

const application = Application.start();

application.register("relative-date", RelativeDateController);
application.register("garden-entries-grid", GardenEntriesGridController);
application.register("garden-filters", GardenFiltersController);
application.register("garden-filter-dropdown", GardenFilterDropdownController);
application.register("garden-lazy-card", GardenLazyCardController);
application.register("command-palette", CommandPaletteController);
application.register("dropdown", DropdownController);
application.register("navbar", NavbarController);

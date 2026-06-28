import { createSearchAction } from "zendo/astro/actions";

import config from "../../zendo.config";
import { garden } from "../garden";

export const server = {
  search: createSearchAction(config, garden),
};

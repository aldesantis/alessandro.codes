// @ts-check
import { defineConfig } from "astro/config";

import tailwind from "@astrojs/tailwind";

import icon from "astro-icon";
import { remarkReadingTime } from "./src/lib/plugins/remarkReadingTime.mjs";
import { remarkWikiLink } from "./src/lib/plugins/remarkWikiLink.mjs";

import mdx from "@astrojs/mdx";

import react from "@astrojs/react";

// https://astro.build/config
export default defineConfig({
  integrations: [tailwind(), icon(), mdx(), react()],
  markdown: {
    remarkPlugins: [
      remarkReadingTime,
      remarkWikiLink,
    ],
  },
});
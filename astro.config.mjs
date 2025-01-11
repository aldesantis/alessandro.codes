// @ts-check
import { defineConfig } from "astro/config";

import tailwind from "@astrojs/tailwind";

import icon from "astro-icon";
import { remarkReadingTime } from "./src/lib/plugins/remarkReadingTime.mjs";
import { remarkWikiLink } from "./src/lib/plugins/remarkWikiLink.mjs";

import mdx from "@astrojs/mdx";

// https://astro.build/config
export default defineConfig({
  integrations: [tailwind(), icon(), mdx()],
  markdown: {
    remarkPlugins: [
      remarkReadingTime,
      remarkWikiLink,
    ],
  },
  image: {
    domains: ["m.media-amazon.com", "covers.openlibrary.org"],
  }
});

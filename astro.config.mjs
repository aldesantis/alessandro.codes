// @ts-check
import { defineConfig, fontProviders } from "astro/config";

import tailwind from "@astrojs/tailwind";

import icon from "astro-icon";
import { remarkReadingTime } from "./src/lib/plugins/remarkReadingTime.mjs";
import { remarkWikiLink } from "./src/lib/plugins/remarkWikiLink.mjs";

import mdx from "@astrojs/mdx";

import vercel from "@astrojs/vercel";

// https://astro.build/config
export default defineConfig({
  integrations: [tailwind(), icon(), mdx()],

  markdown: {
    remarkPlugins: [remarkReadingTime, remarkWikiLink],
  },

  image: {
    domains: ["m.media-amazon.com", "covers.openlibrary.org"],
  },

  server: {
    host: true,
  },

  experimental: {
    fonts: [
      {
        provider: fontProviders.google(),
        name: "Domine",
        cssVariable: "--font-domine",
        weights: [400, 500, 600, 700],
      },
      {
        provider: fontProviders.google(),
        name: "Source Sans 3",
        cssVariable: "--font-source-sans",
        weights: [400, 500, 600, 700],
        styles: ["normal"],
      },
    ],
  },

  adapter: vercel(),
});

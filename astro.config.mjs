// @ts-check
import { defineConfig, fontProviders } from "astro/config";
import icon from "astro-icon";

import { remarkReadingTime } from "./src/lib/plugins/remarkReadingTime.mjs";
import { remarkWikiLink } from "./src/lib/plugins/remarkWikiLink.mjs";
import { remarkWikiImage } from "./src/lib/plugins/remarkWikiImage.mjs";

import mdx from "@astrojs/mdx";

import vercel from "@astrojs/vercel";

import tailwindcss from "@tailwindcss/vite";

// https://astro.build/config
export default defineConfig({
  integrations: [icon(), mdx()],

  markdown: {
    remarkPlugins: [remarkReadingTime, remarkWikiLink, [remarkWikiImage, { assetsPath: "../assets" }]],
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

  vite: {
    plugins: [tailwindcss()],
  },
});

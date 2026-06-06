// @ts-check
import { defineConfig, fontProviders } from "astro/config";
import { unified } from "@astrojs/markdown-remark";
import icon from "astro-icon";

import { remarkReadingTime } from "./src/lib/zendo/plugins/remarkReadingTime.mjs";
import { remarkWikiLink } from "./src/lib/zendo/plugins/remarkWikiLink.mjs";
import { remarkWikiImage } from "./src/lib/zendo/plugins/remarkWikiImage.mjs";

import mdx from "@astrojs/mdx";

import vercel from "@astrojs/vercel";

import tailwindcss from "@tailwindcss/vite";

// https://astro.build/config
export default defineConfig({
  output: "server",

  integrations: [icon(), mdx()],

  markdown: {
    processor: unified({
      remarkPlugins: [remarkReadingTime, remarkWikiLink, [remarkWikiImage, { assetsPath: "../assets" }]],
    }),
  },

  server: {
    host: true,
  },

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

  adapter: vercel(),

  vite: {
    plugins: [tailwindcss()],
    build: {
      rollupOptions: {
        // Workaround for https://github.com/withastro/astro/issues/16954:
        // importing getContainerRenderer from @astrojs/mdx pulls the optional
        // satteri processor into the bundle graph even when unused. Remove
        // once the upstream fix ships.
        external: ["satteri", "@astrojs/markdown-satteri"],
      },
    },
  },
});

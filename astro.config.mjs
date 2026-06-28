// @ts-check
import { defineConfig, fontProviders } from "astro/config";
import { unified } from "@astrojs/markdown-remark";
import icon from "astro-icon";

import { remarkReadingTime, remarkWikiLink, remarkWikiImage } from "zendo/remark";
import index from "./src/data/index.json" with { type: "json" };

// Owns this site's routing for resolved wikilinks (e.g. `nows` → `/now`).
/** @param {{ type: string, slug: string }} link */
const buildUrl = ({ type, slug }) => `/${type === "nows" ? "now" : type}/${slug}`;

import mdx from "@astrojs/mdx";

import vercel from "@astrojs/vercel";

import tailwindcss from "@tailwindcss/vite";

// https://astro.build/config
export default defineConfig({
  output: "server",

  integrations: [icon(), mdx()],

  markdown: {
    processor: unified({
      remarkPlugins: [
        remarkReadingTime,
        [remarkWikiLink, { index, buildUrl }],
        [remarkWikiImage, { assetsPath: "../assets" }],
      ],
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
    // Zendo ships as TypeScript source; let Vite transpile it for the SSR bundle.
    ssr: {
      noExternal: ["zendo"],
    },
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

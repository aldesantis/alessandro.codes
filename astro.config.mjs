// @ts-check
import { defineConfig, fontProviders } from "astro/config";
import { satteri } from "@astrojs/markdown-satteri";
import icon from "astro-icon";

import { satteriReadingTime, satteriWikiLink, satteriWikiImage } from "zendo/satteri";
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

  // Astro 7 changed the `compressHTML` default from `true` to `'jsx'`, which
  // strips whitespace around elements using JSX rules and glued together text
  // across line breaks. Restore the pre-upgrade (Astro 6) behavior.
  compressHTML: true,

  integrations: [icon(), mdx()],

  markdown: {
    processor: satteri({
      mdastPlugins: [
        satteriReadingTime(),
        satteriWikiLink({ index, buildUrl }),
        satteriWikiImage({ assetsPath: "../assets" }),
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
  },
});

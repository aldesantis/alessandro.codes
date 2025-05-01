import path from "path";
import type { DigitalGardenConfig } from "./src/garden/config";
import { gitSource } from "src/garden/sources";
import {
  normalizeFilename,
  escapeMdx,
  addBasenameToAliases,
  removeFirstH1,
  removeSection,
  renameMdToMdx,
  moveToDirectory,
} from "src/garden/transformers";

const transformers = [
  renameMdToMdx(),
  addBasenameToAliases(),
  normalizeFilename(),
  removeFirstH1(),
  removeSection({ headingLevel: 2, title: "Metadata" }),
  escapeMdx(),
];

const config: DigitalGardenConfig = {
  // Where do we fetch the content from?
  source: gitSource({
    repositoryUrl: "git@github.com:aldesantis/digital-garden.git",
  }),

  // Where do we store the processed content?
  contentDir: path.join(process.cwd(), "src", "content"),

  // What transformations do we want to apply to the content?
  contentTypes: [
    {
      id: "essays",
      pattern: "essays/*.{md,mdx}",
      transformers: [...transformers, moveToDirectory("src/content/essays")],
    },
    {
      id: "notes",
      pattern: "notes/*.{md,mdx}",
      transformers: [...transformers, moveToDirectory("src/content/notes")],
    },
    {
      id: "nows",
      pattern: "nows/*.{md,mdx}",
      transformers: [...transformers, moveToDirectory("src/content/nows")],
    },
    {
      id: "topics",
      pattern: "topics/*.{md,mdx}",
      transformers: [...transformers, moveToDirectory("src/content/topics")],
    },
    {
      id: "books",
      pattern: "readwise/books/*.{md,mdx}",
      transformers: [...transformers, moveToDirectory("src/content/books")],
    },
    {
      id: "articles",
      pattern: "readwise/articles/*.{md,mdx}",
      transformers: [...transformers, moveToDirectory("src/content/articles")],
    },
    {
      id: "recipes",
      pattern: "recipes/*.{md,mdx}",
      transformers: [...transformers, moveToDirectory("src/content/recipes")],
    },
    {
      id: "pages",
      pattern: "{about,colophon}.{md,mdx}",
      transformers: [...transformers, moveToDirectory("src/content")],
    },
  ],
};

export default config;

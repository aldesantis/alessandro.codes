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
  addContentTypeToMetadata,
} from "src/garden/transformers";

const transformers = [
  renameMdToMdx(),
  addBasenameToAliases(),
  normalizeFilename(),
  removeFirstH1(),
  removeSection({ headingLevel: 2, title: "Metadata" }),
  escapeMdx(),
  addContentTypeToMetadata(),
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
      destinationPath: "essays",
      transformers,
    },
    {
      id: "notes",
      pattern: "notes/*.{md,mdx}",
      destinationPath: "notes",
      transformers,
    },
    {
      id: "nows",
      pattern: "nows/*.{md,mdx}",
      destinationPath: "nows",
      transformers,
    },
    {
      id: "topics",
      pattern: "topics/*.{md,mdx}",
      destinationPath: "topics",
      transformers,
    },
    {
      id: "books",
      pattern: "readwise/books/*.{md,mdx}",
      destinationPath: "books",
      transformers,
    },
    {
      id: "articles",
      pattern: "readwise/articles/*.{md,mdx}",
      destinationPath: "articles",
      transformers,
    },
    {
      id: "recipes",
      pattern: "recipes/*.{md,mdx}",
      destinationPath: "recipes",
      transformers,
    },
    {
      id: "pages",
      pattern: "{about,colophon}.{md,mdx}",
      destinationPath: ".",
      transformers,
    },
  ],
};

export default config;

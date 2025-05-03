import path from "path";
import matter from "gray-matter";
import type { DigitalGardenConfig } from "./src/lib/garden/config";
import type { TransformerResult } from "./src/lib/garden/transformers";
import { gitSource } from "src/lib/garden/sources";
import {
  normalizeFilename,
  escapeMdx,
  addBasenameToAliases,
  removeFirstH1,
  removeSection,
  renameMdToMdx,
  addContentTypeToMetadata,
} from "src/lib/garden/transformers";

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
      id: "assets",
      pattern: "assets/**/*",
      destinationPath: "assets",
      transformers: [],
    },
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
      transformers: [
        ...transformers,

        // Extract date from slug and set it as updatedAt for proper sorting
        async (originalPath: string, originalContent: string): Promise<TransformerResult> => {
          const { data, content } = matter(originalContent);

          const dateMatch = originalPath.match(/(\d{4}-\d{2})/);
          if (!dateMatch?.[1]) {
            throw new Error(`No date found in path for nows entry: ${originalPath}`);
          }

          const [year, month] = dateMatch[1].split("-").map(Number);
          const date = new Date(year!, month!, 0);

          const updatedContent = matter.stringify(content, { ...data, updatedAt: date.toISOString() });

          return { path: originalPath, content: updatedContent };
        },
      ],
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
      transformers: [
        ...transformers,

        // Copy the lastHighlightedOn date to the updatedAt date for proper sorting
        async (originalPath: string, originalContent: string): Promise<TransformerResult> => {
          const { data, content } = matter(originalContent);

          const date = new Date(data.lastHighlightedOn);

          const updatedContent = matter.stringify(content, { ...data, updatedAt: date.toISOString() });

          return { path: originalPath, content: updatedContent };
        },
      ],
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
      id: "talks",
      pattern: "talks/*.{md,mdx}",
      destinationPath: "talks",
      transformers: [
        ...transformers,

        // Copy the createdAt date to the updatedAt date for proper sorting
        async (originalPath: string, originalContent: string): Promise<TransformerResult> => {
          const { data, content } = matter(originalContent);

          const date = new Date(data.createdAt);

          const updatedContent = matter.stringify(content, { ...data, updatedAt: date.toISOString() });

          return { path: originalPath, content: updatedContent };
        },
      ],
    },
    {
      id: "pages",
      pattern: "{about,colophon}.{md,mdx}",
      destinationPath: ".",
      transformers,
    },
  ],
};

export const GARDEN_CONTENT_TYPE_IDS = [
  "essays",
  "notes",
  "nows",
  "topics",
  "books",
  "articles",
  "recipes",
  "talks",
] as const;
export type GardenContentTypeId = (typeof GARDEN_CONTENT_TYPE_IDS)[number];

export default config;

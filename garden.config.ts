import path from "path";
import matter from "gray-matter";

import { gitSource, notionSource } from "src/lib/garden/sources";
import {
  normalizeFilename,
  escapeMdx,
  addBasenameToAliases,
  removeFirstH1,
  removeSection,
  renameMdToMdx,
  addContentTypeToMetadata,
  removeDrafts,
  demoteHeadings,
  normalizeMetadata,
  convertNotionLinksToWikilinks,
} from "src/lib/garden/transformers";
import type { Configuration } from "src/lib/garden/config";

const baseTransformers = [
  renameMdToMdx(),
  removeDrafts(),
  addBasenameToAliases(),
  normalizeFilename(),
  escapeMdx(),
  addContentTypeToMetadata(),
];

const digitalGardenTransformers = [
  removeFirstH1(),
  removeSection({ headingLevel: 2, title: "Metadata" }),
  ...baseTransformers,
];

const config: Configuration = {
  // Where do we store the content?
  contentDir: path.join(process.cwd(), "src", "content"),

  // Where do we fetch the content from and what transformations do we want to apply?
  sources: [
    {
      id: "digital-garden",
      source: gitSource({
        repositoryUrl: "git@github.com:aldesantis/digital-garden.git",
      }),
      entryTypes: [
        {
          id: "assets",
          basePath: "assets",
          pattern: "**/*.{jpg,png,gif,svg,webp}",
          destinationPath: "assets",
          transformers: [],
        },
        {
          id: "essays",
          basePath: "essays",
          pattern: "*.{md,mdx}",
          destinationPath: "essays",
          transformers: digitalGardenTransformers,
          urlBuilder: (slug) => `/essays/${slug}`,
        },
        {
          id: "notes",
          basePath: "notes",
          pattern: "*.{md,mdx}",
          destinationPath: "notes",
          transformers: digitalGardenTransformers,
          urlBuilder: (slug) => `/notes/${slug}`,
        },
        {
          id: "nows",
          basePath: "nows",
          pattern: "*.{md,mdx}",
          destinationPath: "nows",
          urlBuilder: (slug) => `/now/${slug}`,
          transformers: [
            ...digitalGardenTransformers,

            // Extract date from slug and set it as updatedAt for proper sorting
            async (originalPath, originalContent) => {
              // Skip binary files
              if (Buffer.isBuffer(originalContent)) {
                return { path: originalPath, content: originalContent };
              }

              const { data, content } = matter(originalContent);

              const dateMatch = originalPath.match(/(\d{4}-\d{2})/);
              if (!dateMatch?.[1]) {
                throw new Error(`No date found in path for nows entry: ${originalPath}`);
              }

              const [year, month] = dateMatch[1].split("-").map(Number) as [number, number];
              const date = new Date(year, month, 0);

              const updatedContent = matter.stringify(content, { ...data, updatedAt: date.toISOString() });

              return { path: originalPath, content: updatedContent };
            },
          ],
        },
        {
          id: "topics",
          basePath: "topics",
          pattern: "*.{md,mdx}",
          destinationPath: "topics",
          transformers: digitalGardenTransformers,
          urlBuilder: (slug) => `/topics/${slug}`,
        },
        {
          id: "books",
          basePath: "readwise/books",
          pattern: "*.{md,mdx}",
          destinationPath: "books",
          urlBuilder: (slug) => `/books/${slug}`,
          transformers: [
            ...digitalGardenTransformers,

            // Copy the lastHighlightedOn date to the updatedAt date for proper sorting
            async (originalPath, originalContent) => {
              // Skip binary files
              if (Buffer.isBuffer(originalContent)) {
                return { path: originalPath, content: originalContent };
              }

              const { data, content } = matter(originalContent);

              const date = new Date(data.lastHighlightedOn);

              const updatedContent = matter.stringify(content, { ...data, updatedAt: date.toISOString() });

              return { path: originalPath, content: updatedContent };
            },
          ],
        },
        {
          id: "articles",
          basePath: "readwise/articles",
          pattern: "*.{md,mdx}",
          destinationPath: "articles",
          transformers: digitalGardenTransformers,
          urlBuilder: (slug) => `/articles/${slug}`,
        },
        {
          id: "talks",
          basePath: "talks",
          pattern: "*.{md,mdx}",
          destinationPath: "talks",
          transformers: [
            ...digitalGardenTransformers,

            // Copy the createdAt date to the updatedAt date for proper sorting
            async (originalPath, originalContent) => {
              // Skip binary files
              if (Buffer.isBuffer(originalContent)) {
                return { path: originalPath, content: originalContent };
              }

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
          transformers: digitalGardenTransformers,
        },
      ],
    },

    {
      id: "recipes",
      source: notionSource({
        dataSourceId: "fbf8923a-215b-4db0-8bab-051358d67347",
        apiToken: process.env.NOTION_API_TOKEN!,
        filter: {
          and: [
            {
              property: "Illustration",
              files: {
                is_not_empty: true,
              },
            },
            {
              property: "Status",
              status: {
                equals: "Perfected",
              },
            },
          ],
        },
      }),
      entryTypes: [
        {
          id: "recipes",
          pattern: "*.{md,mdx}",
          destinationPath: "recipes",
          transformers: [
            demoteHeadings(),
            normalizeMetadata({
              normalizeKeysFor: ["Type", "Cuisine", "Diets", "Status", "Name", "Illustration", "Serves"],
              normalizeValuesFor: ["Type", "Cuisine", "Diets", "Status"],
              keyMappings: {
                Name: "title",
              },
              valueMappings: {
                Status: {
                  Idea: "seedling",
                  "Next Up": "seedling",
                  "In Progress": "budding",
                  Perfected: "evergreen",
                },
              },
            }),
            convertNotionLinksToWikilinks(),
            ...baseTransformers,
          ],
        },
        {
          id: "recipe-illustrations",
          pattern: "files/**/*.{jpg,png,gif,svg,webp}",
          destinationPath: "assets/recipes",
          transformers: [
            async (originalPath, originalContent) => {
              const match = originalPath.match(/^files\/([^/]+)\/illustration\/0\.(jpg|png|gif|svg|webp)$/);
              if (match) {
                const [, recipeSlug, extension] = match;
                return {
                  path: `${recipeSlug}.${extension}`,
                  content: originalContent,
                };
              }

              return { path: originalPath, content: originalContent };
            },
          ],
        },
      ],
    },
  ],
};

export const entryTypeIds = ["essays", "notes", "nows", "topics", "books", "articles", "recipes", "talks"] as const;

export default config;

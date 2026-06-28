import path from "path";
import matter from "gray-matter";

import { gitSource } from "zendo/sources";
import {
  normalizeFilename,
  escapeMdx,
  addBasenameToAliases,
  removeFirstH1,
  removeSection,
  renameMdToMdx,
  addContentTypeToMetadata,
  removeDrafts,
} from "zendo/transformers";
import type { CollectionEntry } from "astro:content";
import type { Configuration, EntryLink } from "zendo";
import {
  collectionFilter,
  nameFilter,
  statusFilter,
  topicFilter,
  cuisineFilter,
  dietFilter,
  recipeTypeFilter,
  relatedToFilter,
} from "src/lib/filters";

export const collectionIds = ["essays", "notes", "nows", "topics", "books", "articles", "recipes", "talks"] as const;

type ZendoCollectionEntry = CollectionEntry<(typeof collectionIds)[number]>;

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

const config: Configuration<ZendoCollectionEntry> = {
  // Where do we store the content?
  contentDir: path.join(process.cwd(), "src", "content"),

  // Builds the public URL for an entry. Owns this site's routing (e.g. `nows` → `/now`).
  buildUrl: ({ type, slug }: EntryLink) => `/${type === "nows" ? "now" : type}/${slug}`,

  // Available filters for search
  filters: await Promise.all([
    collectionFilter(),
    nameFilter(),
    statusFilter(),
    topicFilter(),
    cuisineFilter(),
    dietFilter(),
    recipeTypeFilter(),
    relatedToFilter(),
  ]),

  // Sorting function for entries
  sortEntriesFn: (a: ZendoCollectionEntry, b: ZendoCollectionEntry): number => {
    const statusPriorities = {
      seedling: 0,
      budding: 1,
      evergreen: 2,
    };

    if (a.data.updatedAt! > b.data.updatedAt!) {
      return -1;
    }

    if (a.data.updatedAt! < b.data.updatedAt!) {
      return 1;
    }

    const statusPriorityA = statusPriorities[a.data.status];
    const statusPriorityB = statusPriorities[b.data.status];

    return statusPriorityA > statusPriorityB ? -1 : 1;
  },

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
          search: {
            label: "Essay",
            buildUrlFn: (slug: string) => `/essays/${slug}`,
            buildSearchResultFn: (entry: ZendoCollectionEntry) => ({
              id: entry.id,
              name: entry.data.title,
              type: "essays",
              date: entry.data.createdAt ? new Date(entry.data.createdAt).toISOString() : undefined,
            }),
          },
        },
        {
          id: "notes",
          basePath: "notes",
          pattern: "*.{md,mdx}",
          destinationPath: "notes",
          transformers: digitalGardenTransformers,
          search: {
            label: "Note",
            buildUrlFn: (slug: string) => `/notes/${slug}`,
            buildSearchResultFn: (entry: ZendoCollectionEntry) => ({
              id: entry.id,
              name: entry.data.title,
              type: "notes" as const,
              status: entry.data.status,
            }),
          },
        },
        {
          id: "nows" as const,
          basePath: "nows",
          pattern: "*.{md,mdx}",
          destinationPath: "nows",
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
          search: {
            label: "Now",
            buildUrlFn: (slug: string) => `/nows/${slug}`,
            buildSearchResultFn: (entry: ZendoCollectionEntry) => ({
              id: entry.id,
              name: entry.data.title,
              type: "nows" as const,
              date: entry.data.updatedAt ? new Date(entry.data.updatedAt).toISOString() : undefined,
            }),
          },
        },
        {
          id: "topics",
          basePath: "topics",
          pattern: "*.{md,mdx}",
          destinationPath: "topics",
          transformers: digitalGardenTransformers,
          search: {
            label: "Topic",
            buildUrlFn: (slug: string) => `/topics/${slug}`,
            buildSearchResultFn: (entry: ZendoCollectionEntry) => ({
              id: entry.id,
              name: entry.data.title,
              type: "topics" as const,
            }),
          },
        },
        {
          id: "books" as const,
          basePath: "readwise/books",
          pattern: "*.{md,mdx}",
          destinationPath: "books",
          transformers: [
            ...digitalGardenTransformers,

            // updatedAt is not updated when lastHighlightedOn is updated,
            // so we need to copy lastHighlightedOn into updatetAt for proper
            // sorting (assuming the former is greater than the latter)
            async (originalPath, originalContent) => {
              if (Buffer.isBuffer(originalContent)) {
                return { path: originalPath, content: originalContent };
              }

              const { data, content } = matter(originalContent);

              const lastHighlightedOn = new Date(data.lastHighlightedOn);
              const updatedAt = new Date(data.updatedAt);

              if (lastHighlightedOn > updatedAt) {
                data.updatedAt = lastHighlightedOn.toISOString();
              }

              return { path: originalPath, content: matter.stringify(content, data) };
            },
          ],
          search: {
            label: "Book",
            buildUrlFn: (slug: string) => `/books/${slug}`,
            buildSearchResultFn: (entry: ZendoCollectionEntry) => ({
              id: entry.id,
              name: entry.data.title,
              url: `/books/${entry.id}`,
              type: "books",
              date: entry.data.updatedAt ? new Date(entry.data.updatedAt).toISOString() : undefined,
            }),
          },
        },
        {
          id: "articles",
          basePath: "readwise/articles",
          pattern: "*.{md,mdx}",
          destinationPath: "articles",
          transformers: digitalGardenTransformers,
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
          search: {
            label: "Talk",
            buildUrlFn: () => `/talks`,
            buildSearchResultFn: (entry: ZendoCollectionEntry) => ({
              id: entry.id,
              name: entry.data.title,
              type: "talks",
              date: entry.data.createdAt ? new Date(entry.data.createdAt).toISOString() : undefined,
            }),
          },
        },
        {
          id: "pages",
          pattern: "{about,colophon}.{md,mdx}",
          destinationPath: ".",
          transformers: digitalGardenTransformers,
        },
        {
          id: "ingredients" as const,
          basePath: "ingredients",
          pattern: "*.{md,mdx}",
          destinationPath: "ingredients",
          transformers: digitalGardenTransformers,
          // No `search` block: ingredients are a glossary for derivation, not pages.
        },
        {
          id: "recipes" as const,
          basePath: "recipes",
          pattern: "*.{md,mdx}",
          destinationPath: "recipes",
          transformers: digitalGardenTransformers,
          search: {
            label: "Recipe",
            buildUrlFn: (slug: string) => `/recipes/${slug}`,
            buildSearchResultFn: (entry: ZendoCollectionEntry) => ({
              id: entry.id,
              name: entry.data.title,
              type: "recipes",
            }),
          },
        },
      ],
    },
  ],
};

export default config;

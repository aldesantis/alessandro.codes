import { z, defineCollection } from "astro:content";
import { file, glob } from "astro/loaders";

export const collections = {
  projects: defineCollection({
    schema: z.object({
      name: z.string(),
      url: z.string().url(),
      description: z.string(),
      featured: z.boolean().optional().default(false),
    }),
    loader: file("src/data/projects.json"),
  }),

  socials: defineCollection({
    schema: z.object({
      name: z.string(),
      icon: z.string(),
      url: z.string().url(),
    }),
    loader: file("src/data/socials.json"),
  }),

  essays: defineCollection({
    schema: z.object({
      title: z.string(),
      publishedOn: z.coerce.date(),
      canonical: z.string().url().optional(),
      excerpt: z.string(),
    }),
    loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/essays" }),
  }),

  notes: defineCollection({
    schema: z.object({
      title: z.string(),
    }),
    loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/notes" }),
  }),

  nows: defineCollection({
    schema: z.object({
      title: z.string(),
    }),
    loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/nows" }),
  }),

  books: defineCollection({
    schema: z.object({
      title: z.string(),
      author: z.string(),
      coverUrl: z.string().optional(),
    }),
    loader: glob({
      pattern: "**/*.{md,mdx}",
      base: "./src/content/readwise/books",
    }),
  }),
};

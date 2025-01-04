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
      url: z.string().url(),
    }),
    loader: file("src/data/socials.json"),
  }),

  essays: defineCollection({
    schema: z.object({
      title: z.string(),
      published_on: z.coerce.date(),
      canonical: z.string().url().optional(),
      excerpt: z.string(),
    }),
    loader: glob({ pattern: "**/*.mdx", base: "./src/content/essays" }),
  }),
};

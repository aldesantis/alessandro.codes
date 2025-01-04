import { z, defineCollection } from "astro:content";
import { file } from "astro/loaders";

export const collections = {
  projects: defineCollection({
    schema: z.object({
      name: z.string(),
      url: z.string().url(),
      description: z.string(),
      featured: z.boolean().optional().default(false),
    }),
    loader: file("src/content/projects.json"),
  }),

  socials: defineCollection({
    schema: z.object({
      name: z.string(),
      url: z.string().url(),
    }),
    loader: file("src/content/socials.json"),
  }),
};

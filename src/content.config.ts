import { z, defineCollection } from "astro:content";
import { file } from "astro/loaders";

const projects = defineCollection({
  schema: z.object({
    name: z.string(),
    url: z.string().url(),
    description: z.string(),
    featured: z.boolean().optional().default(false),
  }),
  loader: file("src/content/projects.json"),
});

export const collections = {
  projects,
};

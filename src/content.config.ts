import { z, defineCollection, reference } from "astro:content";
import { file, glob } from "astro/loaders";

const baseSchema = z.object({
  title: z.string(),
  status: z.enum(["seedling", "budding", "evergreen"]),
  createdAt: z.coerce.date().optional().default(new Date()),
  updatedAt: z.coerce.date().optional().default(new Date()),
});

const obsidianSchema = baseSchema.extend(
  z.object({
    topics: z.array(reference("topics")).optional(),
    draft: z
      .preprocess((val) => {
        if (typeof val === "string") {
          if (val.toLowerCase() === "true") return true;
          if (val.toLowerCase() === "false") return false;
        }
        return val;
      }, z.boolean())
      .optional()
      .default(false),
  }).shape
);

const readwiseSchema = obsidianSchema.extend(
  z.object({
    author: z.string(),
    publishedOn: z.coerce.date(),
    lastHighlightedOn: z.coerce.date(),
    url: z.string().nullable(),
  }).shape
);

export const collections = {
  socials: defineCollection({
    schema: z.object({
      name: z.string(),
      icon: z.string(),
      url: z.string().url(),
    }),
    loader: file("src/data/socials.json"),
  }),

  talks: defineCollection({
    schema: obsidianSchema.extend(
      z.object({
        description: z.string(),
        url: z.string().url(),
        language: z.enum(["en", "it"]),
      }).shape
    ),
    loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/talks" }),
  }),

  topics: defineCollection({
    schema: obsidianSchema,
    loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/topics" }),
  }),

  essays: defineCollection({
    schema: obsidianSchema,
    loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/essays" }),
  }),

  notes: defineCollection({
    schema: obsidianSchema,
    loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/notes" }),
  }),

  books: defineCollection({
    schema: readwiseSchema,
    loader: glob({
      pattern: "**/*.{md,mdx}",
      base: "./src/content/books",
    }),
  }),

  articles: defineCollection({
    schema: readwiseSchema,
    loader: glob({
      pattern: "**/*.{md,mdx}",
      base: "./src/content/articles",
    }),
  }),

  nows: defineCollection({
    schema: obsidianSchema,
    loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/nows" }),
  }),

  recipes: defineCollection({
    schema: baseSchema.extend(
      z.object({
        cuisine: z.enum(["tex-mex", "mediterranean", "bbq", "asian", "indian", "american"]),
        diets: z.array(z.enum(["omnivore", "vegetarian", "vegan", "pescatarian"])),
        type: z.enum(["starter", "first-course", "main-course", "single-dish", "sauce", "side", "dessert", "other"]),
        serves: z.preprocess((val) => (val === null ? undefined : val), z.number().optional()),
      }).shape
    ),
    loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/recipes" }),
  }),
};

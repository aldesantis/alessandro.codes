import { z, defineCollection, reference } from "astro:content";
import { file, glob } from "astro/loaders";

const baseSchema = z.object({
  title: z.string(),
  status: z.enum(["seedling", "budding", "evergreen"]),
  topics: z.array(reference("topics")).optional(),
  createdAt: z.coerce.date().optional().default(new Date()),
  updatedAt: z.coerce.date().optional().default(new Date()),
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
});

const readwiseSchema = z.object({
  author: z.string(),
  publishedOn: z.coerce.date(),
  lastHighlightedOn: z.coerce.date(),
  url: z.string().nullable(),
});

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
    schema: baseSchema.extend(
      z.object({
        title: z.string(),
        description: z.string(),
        url: z.string().url(),
        language: z.enum(["en", "it"]),
      }).shape
    ),
    loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/talks" }),
  }),

  topics: defineCollection({
    schema: baseSchema.extend(
      z.object({
        title: z.string(),
      }).shape
    ),
    loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/topics" }),
  }),

  essays: defineCollection({
    schema: baseSchema.extend(
      z.object({
        title: z.string(),
      }).shape
    ),
    loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/essays" }),
  }),

  notes: defineCollection({
    schema: baseSchema.extend(
      z.object({
        title: z.string(),
      }).shape
    ),
    loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/notes" }),
  }),

  books: defineCollection({
    schema: baseSchema.extend(readwiseSchema.shape),
    loader: glob({
      pattern: "**/*.{md,mdx}",
      base: "./src/content/books",
    }),
  }),

  articles: defineCollection({
    schema: baseSchema.extend(readwiseSchema.shape),
    loader: glob({
      pattern: "**/*.{md,mdx}",
      base: "./src/content/articles",
    }),
  }),

  nows: defineCollection({
    schema: baseSchema,
    loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/nows" }),
  }),

  recipes: defineCollection({
    schema: baseSchema.extend(
      z.object({
        cuisine: z.enum(["tex-mex", "mediterranean", "bbq", "japanese", "indian", "american"]).optional(),
        diet: z.enum(["omnivore", "vegetarian", "vegan", "pescetarian"]),
        type: z.enum(["starter", "first-course", "main-course", "single-dish", "sauce", "side", "dessert", "other"]),
      }).shape
    ),
    loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/recipes" }),
  }),
};

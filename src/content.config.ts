import { z, defineCollection, reference } from "astro:content";
import { file, glob } from "astro/loaders";

const baseSchema = z.object({
  title: z.string(),
  status: z.enum(["seedling", "budding", "evergreen"]),
  topics: z.array(reference("topics")).optional(),
  createdAt: z.coerce.date().optional().default(new Date()),
  updatedAt: z.coerce.date().optional().default(new Date()),
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
        slug: z.string(),
        title: z.string(),
        description: z.string(),
        url: z.string().url(),
        language: z.enum(["en", "it"]),
      }).shape
    ),
    loader: file("src/data/talks.json"),
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
};

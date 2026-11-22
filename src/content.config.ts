import { defineCollection, reference } from "astro:content";
import { z } from "astro/zod";
import { file, glob } from "astro/loaders";

const growthStatus = z.enum(["seedling", "budding", "evergreen"]);
const readingStatus = z.enum(["to-read", "reading", "read", "abandoned", "distilled"]);
const recipeStatus = z.enum(["untested", "tweaking", "staple"]);

const baseSchema = z.object({
  title: z.string(),
  // No default: an entry without a date renders no date and sorts last, rather
  // than borrowing the build time as if it were real data.
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
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

const growthSchema = obsidianSchema.extend(z.object({ status: growthStatus }).shape);

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
      url: z.url(),
    }),
    loader: file("src/data/socials.json"),
  }),

  talks: defineCollection({
    schema: obsidianSchema.extend(
      z.object({
        description: z.string(),
        url: z.url(),
        language: z.enum(["en", "it"]),
      }).shape
    ),
    loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/talks" }),
  }),

  topics: defineCollection({
    schema: growthSchema,
    loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/topics" }),
  }),

  essays: defineCollection({
    schema: growthSchema,
    loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/essays" }),
  }),

  notes: defineCollection({
    schema: growthSchema,
    loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/notes" }),
  }),

  books: defineCollection({
    schema: obsidianSchema.extend(
      z.object({
        author: z.string(),
        status: readingStatus,
        lastHighlightedOn: z.coerce.date().optional(),
        finishedOn: z.coerce.date().optional(),
      }).shape
    ),
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

  ingredients: defineCollection({
    schema: obsidianSchema.extend(
      z.object({
        aliases: z.array(z.string()).optional(),
        category: z.enum([
          "produce",
          "herb-spice",
          "condiment",
          "grain",
          "fruit",
          "nut-seed",
          "fat-oil",
          "meat",
          "poultry",
          "seafood",
          "dairy",
          "egg",
          "legume",
          "sweetener",
          "beverage",
          "other",
        ]),
        allergens: z.array(
          z.enum([
            "celery",
            "dairy",
            "egg",
            "fish",
            "gluten",
            "mustard",
            "nuts",
            "peanuts",
            "sesame",
            "shellfish",
            "soy",
            "sulphites",
            "tree-nuts",
          ])
        ),
        diets: z.array(z.enum(["vegetarian", "vegan"])),
      }).shape
    ),
    loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/ingredients" }),
  }),

  recipes: defineCollection({
    schema: obsidianSchema.extend(
      z.object({
        status: recipeStatus,
        cuisine: z
          .enum([
            "italian",
            "spanish",
            "french",
            "central-european",
            "greek",
            "middle-eastern",
            "british",
            "american",
            "tex-mex",
            "indian",
            "japanese",
            "chinese",
            "southeast-asian",
            "international",
          ])
          .optional(),
        type: z
          .enum(["starter", "first-course", "main-course", "single-dish", "sauce", "side", "dessert", "other"])
          .optional(),
        serves: z.number().int().min(1).optional(),
        cover: z
          .string()
          .regex(/^assets\/recipes\//)
          .optional(),
        depends_on: z.array(reference("recipes")).optional().default([]),
        ingredient_groups: z
          .array(
            z.object({
              group: z.string().min(1).optional(),
              ingredients: z
                .array(
                  z.object({
                    id: reference("ingredients"),
                    quantity: z.number().positive().optional(),
                    unit: z.string().min(1).optional(),
                    note: z.string().min(1).optional(),
                  })
                )
                .min(1),
            })
          )
          .optional()
          .default([]),
      }).shape
    ),
    loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/recipes" }),
  }),
};

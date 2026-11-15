import { defineCollection, reference } from "astro:content";
import { z } from "astro/zod";
import { file, glob } from "astro/loaders";

// How far along an idea is. Only collections whose entries mature over time
// carry it; a talk, an article or a now page has no such lifecycle.
const growthStatus = z.enum(["seedling", "budding", "evergreen"]);

// Where a book stands. Books used to share the growth values with notes, and
// the vault still carries those: until they are replaced there, they read as
// "read". "distilled" (its ideas have become notes) is only ever set by hand.
const readingStatus = z.preprocess(
  (val) => (growthStatus.safeParse(val).success ? "read" : val),
  z.enum(["reading", "read", "abandoned", "distilled"])
);

// How much a recipe can be trusted: not cooked yet, still being adjusted, or
// dialed in. Recipes used to share the growth values too, and the vault still
// carries those, so they map one to one until they are replaced there.
const LEGACY_RECIPE_STATUS: Record<string, string> = {
  seedling: "untested",
  budding: "tweaking",
  evergreen: "staple",
};

const recipeStatus = z.preprocess(
  (val) => (typeof val === "string" ? (LEGACY_RECIPE_STATUS[val] ?? val) : val),
  z.enum(["untested", "tweaking", "staple"])
);

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
    schema: readwiseSchema.extend(z.object({ status: readingStatus }).shape),
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
        category: z.string().optional(),
        allergens: z.array(z.string()).optional().default([]),
        diets: z.array(z.enum(["omnivore", "vegetarian", "vegan", "pescatarian"])),
      }).shape
    ),
    loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/ingredients" }),
  }),

  recipes: defineCollection({
    schema: obsidianSchema.extend(
      z.object({
        status: recipeStatus,
        cuisine: z.enum([
          "tex-mex",
          "mediterranean",
          "bbq",
          "asian",
          "indian",
          "american",
          "italian",
          "greek",
          "british",
        ]),
        type: z.enum(["starter", "first-course", "main-course", "single-dish", "sauce", "side", "dessert", "other"]),
        depends_on: z.array(reference("recipes")).optional().default([]),
        serves: z.preprocess((val) => (val === null ? undefined : val), z.number().optional()),
        ingredient_groups: z
          .array(
            z.object({
              group: z.string().optional(),
              ingredients: z.array(
                z.preprocess(
                  // Some recipes reference another recipe's ingredients via a
                  // note-only line that the vault serializes as a bare string,
                  // e.g. "note: 'Ingredients for [[bbq-sauce|BBQ Sauce]]'".
                  (val) => {
                    if (typeof val === "string") {
                      const note = val
                        .replace(/^note:\s*/, "")
                        .replace(/^'([\s\S]*)'$/, "$1")
                        .replace(/^"([\s\S]*)"$/, "$1");
                      return { note };
                    }
                    return val;
                  },
                  z.object({
                    id: reference("ingredients").optional(),
                    quantity: z.number().optional(),
                    unit: z.string().optional(),
                    note: z.string().optional(),
                  })
                )
              ),
            })
          )
          .optional()
          .default([]),
      }).shape
    ),
    loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/recipes" }),
  }),
};

import type { CollectionEntry } from "astro:content";

export const DIETS = ["omnivore", "vegetarian", "vegan", "pescatarian"] as const;

export type Diet = (typeof DIETS)[number];

export type IngredientGroup = CollectionEntry<"recipes">["data"]["ingredient_groups"][number];

/**
 * Builds a lookup of ingredient id → the diets that ingredient is compatible
 * with, sourced from the `ingredients` glossary collection.
 */
export async function getIngredientDietMap(): Promise<Map<string, Diet[]>> {
  // Imported lazily so this module can be loaded outside the Astro runtime
  // (e.g. by the zendo CLI, which evaluates garden.config and its filters).
  const { getCollection } = await import("astro:content");
  const ingredients = await getCollection("ingredients");

  return new Map(ingredients.map((ingredient) => [ingredient.id, ingredient.data.diets as Diet[]]));
}

/**
 * Builds a lookup of recipe id → its ingredient groups, used to resolve
 * cross-references (e.g. "Ingredients for [[bbq-sauce|BBQ Sauce]]").
 */
export async function getRecipeIngredientGroupsMap(): Promise<Map<string, IngredientGroup[]>> {
  const { getCollection } = await import("astro:content");
  const recipes = await getCollection("recipes");

  return new Map(recipes.map((recipe) => [recipe.id, recipe.data.ingredient_groups]));
}

/**
 * Collects every ingredient id used by a recipe, following note-only
 * cross-references to other recipes (e.g. "Ingredients for [[bbq-sauce]]") so
 * the borrowed ingredients are counted too. Cycles are guarded via `seen`.
 */
function collectIngredientIds(
  ingredientGroups: IngredientGroup[],
  recipeMap: Map<string, IngredientGroup[]>,
  seen: Set<string>,
  ids: Set<string>
): void {
  for (const group of ingredientGroups) {
    for (const ingredient of group.ingredients) {
      if (ingredient.id) {
        ids.add(ingredient.id.id);
        continue;
      }

      // Note-only entry: if it references another recipe, fold in its ingredients.
      const match = ingredient.note?.match(/\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/);
      const slug = match?.[1]?.trim();

      if (slug && !seen.has(slug)) {
        seen.add(slug);
        const referenced = recipeMap.get(slug);
        if (referenced) {
          collectIngredientIds(referenced, recipeMap, seen, ids);
        }
      }
    }
  }
}

/**
 * Derives a recipe's diets as the intersection of its ingredients' diets:
 * a recipe is compatible with a diet only if every (known) ingredient is.
 * Ingredients missing from the glossary impose no constraint, and a recipe
 * with no known ingredients yields no diets. When `recipeMap` is provided,
 * cross-referenced recipes' ingredients are included in the derivation.
 */
export function deriveDiets(
  ingredientGroups: IngredientGroup[],
  dietMap: Map<string, Diet[]>,
  recipeMap: Map<string, IngredientGroup[]> = new Map()
): Diet[] {
  const ids = new Set<string>();
  collectIngredientIds(ingredientGroups, recipeMap, new Set(), ids);

  let allowed: Set<Diet> | null = null;

  for (const id of ids) {
    const diets = dietMap.get(id);

    if (!diets) {
      continue;
    }

    if (allowed === null) {
      allowed = new Set(diets);
    } else {
      allowed = new Set(diets.filter((diet) => allowed!.has(diet)));
    }
  }

  if (allowed === null) {
    return [];
  }

  return DIETS.filter((diet) => allowed!.has(diet));
}

/**
 * Convenience wrapper that loads the glossary and recipe map and derives a
 * single recipe's diets.
 */
export async function getRecipeDiets(recipe: CollectionEntry<"recipes">): Promise<Diet[]> {
  const [dietMap, recipeMap] = await Promise.all([getIngredientDietMap(), getRecipeIngredientGroupsMap()]);
  return deriveDiets(recipe.data.ingredient_groups, dietMap, recipeMap);
}

import type { CollectionEntry } from "astro:content";

export const DIETS = ["vegetarian", "vegan"] as const;

export type Diet = (typeof DIETS)[number];

export type IngredientGroup = CollectionEntry<"recipes">["data"]["ingredient_groups"][number];

/** A `depends_on` entry: a resolved collection reference or a bare recipe id. */
type RecipeDependency = string | { id: string };

/** The parts of a recipe that determine its diets. */
export interface RecipeDietSource {
  ingredient_groups: IngredientGroup[];
  depends_on?: RecipeDependency[];
}

/**
 * Builds a lookup of ingredient id → the dietary restrictions that ingredient
 * satisfies (`[]` for meat, fish and the like), sourced from the `ingredients`
 * glossary collection.
 */
export async function getIngredientDietMap(): Promise<Map<string, Diet[]>> {
  // Imported lazily so this module can be loaded outside the Astro runtime
  // (e.g. by the zendo CLI, which evaluates zendo.config and its filters).
  const { getCollection } = await import("astro:content");
  const ingredients = await getCollection("ingredients");

  return new Map(ingredients.map((ingredient) => [ingredient.id, ingredient.data.diets as Diet[]]));
}

/**
 * Builds a lookup of recipe id → its ingredient groups and sub-recipes, used to
 * resolve `depends_on` and note cross-references (e.g. "Ingredients for
 * [[bbq-sauce|BBQ Sauce]]").
 */
export async function getRecipeIngredientGroupsMap(): Promise<Map<string, RecipeDietSource>> {
  const { getCollection } = await import("astro:content");
  const recipes = await getCollection("recipes");

  return new Map(
    recipes.map((recipe) => [
      recipe.id,
      { ingredient_groups: recipe.data.ingredient_groups, depends_on: recipe.data.depends_on },
    ])
  );
}

/**
 * Collects every ingredient id used by a recipe, recursively following its
 * `depends_on` sub-recipes and note-only cross-references to other recipes
 * (e.g. "Ingredients for [[bbq-sauce]]") so the borrowed ingredients are
 * counted too. Cycles are guarded via `seen`.
 */
function collectIngredientIds(
  recipe: RecipeDietSource,
  recipeMap: Map<string, RecipeDietSource>,
  seen: Set<string>,
  ids: Set<string>
): void {
  const visit = (slug: string | undefined) => {
    if (!slug || seen.has(slug)) {
      return;
    }

    seen.add(slug);
    const referenced = recipeMap.get(slug);
    if (referenced) {
      collectIngredientIds(referenced, recipeMap, seen, ids);
    }
  };

  // A sub-recipe can bring in ingredients the dish doesn't list itself (e.g.
  // pecorino from spaghetti-cacio-e-pepe), so it must constrain the diets too.
  for (const dependency of recipe.depends_on ?? []) {
    visit(typeof dependency === "string" ? dependency : dependency.id);
  }

  for (const group of recipe.ingredient_groups) {
    for (const ingredient of group.ingredients) {
      if (ingredient.id) {
        ids.add(ingredient.id.id);
        continue;
      }

      // Note-only entry: if it references another recipe, fold in its ingredients.
      const match = ingredient.note?.match(/\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/);
      visit(match?.[1]?.trim());
    }
  }
}

/**
 * Derives a recipe's diets as the intersection of its ingredients' diets:
 * a recipe satisfies a restriction only if every (known) ingredient does.
 * Ingredients missing from the glossary impose no constraint, and a recipe
 * with no known ingredients yields no diets. When `recipeMap` is provided,
 * the ingredients of `depends_on` sub-recipes and cross-referenced recipes are
 * included in the derivation, recursively.
 */
export function deriveDiets(
  recipe: RecipeDietSource,
  dietMap: Map<string, Diet[]>,
  recipeMap: Map<string, RecipeDietSource> = new Map()
): Diet[] {
  const ids = new Set<string>();
  collectIngredientIds(recipe, recipeMap, new Set(), ids);

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
  return deriveDiets(recipe.data, dietMap, recipeMap);
}

// Diets from most to least restrictive. Each implies every diet after it: a
// vegan dish is also vegetarian.
const DIETS_BY_RESTRICTIVENESS: Diet[] = ["vegan", "vegetarian"];

/**
 * Reduces a recipe's compatible diets to the most restrictive one, since it
 * implies the rest ("Vegan" rather than "Vegetarian, Vegan"). Returns an array so callers can render it like `deriveDiets`.
 */
export function mostRestrictiveDiets(diets: readonly Diet[]): Diet[] {
  const strictest = DIETS_BY_RESTRICTIVENESS.find((diet) => diets.includes(diet));
  return strictest ? [strictest] : [];
}

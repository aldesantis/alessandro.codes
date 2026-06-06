import { getCollection } from "astro:content";

/**
 * Builds a lookup of ingredient id → display name from the glossary, falling
 * back to a prettified id for anything not (yet) in the glossary.
 */
export async function getIngredientNameMap(): Promise<Map<string, string>> {
  const ingredients = await getCollection("ingredients");
  return new Map(ingredients.map((ingredient) => [ingredient.id, ingredient.data.title]));
}

export function prettifyId(id: string): string {
  return id
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

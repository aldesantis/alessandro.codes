import { getCollection, type CollectionEntry } from "astro:content";

type IngredientItem = CollectionEntry<"recipes">["data"]["ingredient_groups"][number]["ingredients"][number];

// Units rendered as abbreviations and never pluralized.
const UNIT_ABBREVIATIONS: Record<string, string> = {
  grams: "g",
  milliliters: "ml",
};

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

function pluralize(word: string): string {
  if (word.endsWith("s")) {
    return word; // assume already plural (e.g. "sprigs", "leaves", "fillets")
  }
  if (/(x|z|ch|sh)$/.test(word)) {
    return `${word}es`; // pinch → pinches, glass handled below, bunch → bunches
  }
  if (word.endsWith("ss")) {
    return `${word}es`; // glass → glasses
  }
  return `${word}s`;
}

/**
 * Renders a unit for display: abbreviations stay singular, "count" is dropped,
 * everything else is pluralized when the quantity isn't exactly 1.
 */
export function formatUnit(unit: string, quantity?: number): string {
  const abbreviation = UNIT_ABBREVIATIONS[unit];
  if (abbreviation) {
    return abbreviation;
  }

  if (unit === "count") {
    return "";
  }

  return quantity !== undefined && quantity !== 1 ? pluralize(unit) : unit;
}

/**
 * Formats a single ingredient as `Name (quantity unit, note)`, omitting any
 * empty parts. Matches the format the recipe pages used before the migration.
 */
export function formatIngredientLine(item: IngredientItem, name: string): string {
  const parts: string[] = [];

  if (item.quantity !== undefined) {
    const unit = item.unit ? formatUnit(item.unit, item.quantity) : "";
    parts.push(unit ? `${item.quantity} ${unit}` : `${item.quantity}`);
  }

  if (item.note) {
    parts.push(item.note);
  }

  return parts.length > 0 ? `${name} (${parts.join(", ")})` : name;
}

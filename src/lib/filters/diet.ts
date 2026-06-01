import type { ZendoCollectionEntry } from "../zendo/content";
import type { FilterConfig } from "../zendo/config";
import { deriveDiets, getIngredientDietMap, getRecipeIngredientGroupsMap } from "../recipes/diets";

export default async function dietFilter(): Promise<FilterConfig> {
  return {
    id: "diet",
    ui: {
      label: "Diet",
      getItems: async () => [
        { id: "omnivore", label: "🥩 Omnivore" },
        { id: "vegetarian", label: "🥬 Vegetarian" },
        { id: "vegan", label: "🌱 Vegan" },
        { id: "pescatarian", label: "🐟 Pescatarian" },
      ],
    },
    entryFilterFn: async (entries: ZendoCollectionEntry[], value: unknown): Promise<ZendoCollectionEntry[]> => {
      const selectedValues = value as string[] | undefined;

      if (!selectedValues || selectedValues.includes("all") || selectedValues.length === 0) {
        return entries;
      }

      const [dietMap, recipeMap] = await Promise.all([getIngredientDietMap(), getRecipeIngredientGroupsMap()]);

      return entries.filter((entry) => {
        if (entry.collection === "recipes" && "ingredient_groups" in entry.data) {
          const entryDiets = deriveDiets(entry.data.ingredient_groups, dietMap, recipeMap);
          return entryDiets.length > 0 && entryDiets.some((diet) => selectedValues.includes(diet));
        }

        return true;
      });
    },
  };
}

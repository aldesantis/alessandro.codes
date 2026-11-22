import type { ZendoCollectionEntry } from "src/garden";
import type { FilterConfig } from "zendo";
import diets from "../../components/content/recipes/diets.json";
import {
  deriveDiets,
  getIngredientDietMap,
  getRecipeIngredientGroupsMap,
  type RecipeDietSource,
} from "../recipes/diets";

export default async function dietFilter(): Promise<FilterConfig<ZendoCollectionEntry>> {
  return {
    id: "diet",
    ui: {
      label: "Diet",
      // Same emoji and labels as the diets shown on recipe pages.
      getItems: async () => Object.entries(diets).map(([id, { emoji, label }]) => ({ id, label: `${emoji} ${label}` })),
    },
    entryFilterFn: async (entries: ZendoCollectionEntry[], value: unknown): Promise<ZendoCollectionEntry[]> => {
      const selectedValues = value as string[] | undefined;

      if (!selectedValues || selectedValues.includes("all") || selectedValues.length === 0) {
        return entries;
      }

      const [dietMap, recipeMap] = await Promise.all([getIngredientDietMap(), getRecipeIngredientGroupsMap()]);

      return entries.filter((entry) => {
        if (entry.collection === "recipes" && "ingredient_groups" in entry.data) {
          const entryDiets = deriveDiets(entry.data as RecipeDietSource, dietMap, recipeMap);
          return entryDiets.length > 0 && entryDiets.some((diet) => selectedValues.includes(diet));
        }

        return true;
      });
    },
  };
}

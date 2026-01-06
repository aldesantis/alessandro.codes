import type { ZendoCollectionEntry } from "../zendo/content";
import type { FilterConfig } from "../zendo/config";

export default async function recipeTypeFilter(): Promise<FilterConfig> {
  return {
    id: "recipeType",
    ui: {
      label: "Course",
      getItems: async () => [
        { id: "starter", label: "🥗 Starter" },
        { id: "first-course", label: "🍝 First Course" },
        { id: "main-course", label: "🍽️ Main Course" },
        { id: "single-dish", label: "🍲 Single Dish" },
        { id: "sauce", label: "🍯 Sauce" },
        { id: "side", label: "🥔 Side" },
        { id: "dessert", label: "🍰 Dessert" },
        { id: "other", label: "🍴 Other" },
      ],
    },
    entryFilterFn: async (entries: ZendoCollectionEntry[], value: unknown): Promise<ZendoCollectionEntry[]> => {
      const selectedValues = value as string[] | undefined;

      if (!selectedValues || selectedValues.includes("all") || selectedValues.length === 0) {
        return entries;
      }

      return entries.filter((entry) => {
        if (entry.collection === "recipes" && "type" in entry.data) {
          const entryType = entry.data.type as string;
          return selectedValues.includes(entryType);
        }

        return true;
      });
    },
  };
}

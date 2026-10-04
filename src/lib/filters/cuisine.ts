import type { ZendoCollectionEntry } from "src/garden";
import type { FilterConfig } from "zendo";
import cuisines from "../../components/content/recipes/cuisines.json";

export default async function cuisineFilter(): Promise<FilterConfig<ZendoCollectionEntry>> {
  return {
    id: "cuisine",
    ui: {
      label: "Cuisine",
      // Same emoji and labels as the cuisine shown on recipe cards.
      getItems: async () =>
        Object.entries(cuisines).map(([id, { emoji, label }]) => ({ id, label: `${emoji} ${label}` })),
    },
    entryFilterFn: async (entries: ZendoCollectionEntry[], value: unknown): Promise<ZendoCollectionEntry[]> => {
      const selectedValues = value as string[] | undefined;

      if (!selectedValues || selectedValues.includes("all") || selectedValues.length === 0) {
        return entries;
      }

      return entries.filter((entry) => {
        if (entry.collection === "recipes" && "cuisine" in entry.data) {
          const entryCuisine = entry.data.cuisine as string;
          return selectedValues.includes(entryCuisine);
        }

        return true;
      });
    },
  };
}

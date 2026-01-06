import type { GardenEntry } from "../zendo/entries";
import type { FilterConfig } from "../zendo/config";

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
    contentFilterFn: async (entries: GardenEntry[], value: unknown): Promise<GardenEntry[]> => {
      const selectedValues = value as string[] | undefined;

      if (!selectedValues || selectedValues.includes("all") || selectedValues.length === 0) {
        return entries;
      }

      return entries.filter((entry) => {
        if (entry.collection === "recipes" && "diets" in entry.data) {
          const entryDiets = (entry.data.diets ?? []) as string[];
          return entryDiets.length > 0 && entryDiets.some((diet: string) => selectedValues.includes(diet));
        }

        return true;
      });
    },
  };
}

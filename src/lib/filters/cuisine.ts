import type { ZendoCollectionEntry } from "src/garden";
import type { FilterConfig } from "zendo";

export default async function cuisineFilter(): Promise<FilterConfig<ZendoCollectionEntry>> {
  return {
    id: "cuisine",
    ui: {
      label: "Cuisine",
      getItems: async () => [
        { id: "tex-mex", label: "🌮 Tex-Mex" },
        { id: "mediterranean", label: "🫒 Mediterranean" },
        { id: "bbq", label: "🍖 BBQ" },
        { id: "asian", label: "🍜 Asian" },
        { id: "indian", label: "🍛 Indian" },
        { id: "american", label: "🍔 American" },
      ],
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

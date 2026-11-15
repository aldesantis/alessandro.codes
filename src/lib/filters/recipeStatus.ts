import type { ZendoCollectionEntry } from "src/garden";
import type { FilterConfig } from "zendo";
import statuses from "@components/content/recipes/statuses.json";

export default async function recipeStatusFilter(): Promise<FilterConfig<ZendoCollectionEntry>> {
  return {
    id: "recipeStatus",
    ui: {
      label: "Status",
      getItems: async () =>
        Object.entries(statuses).map(([id, { emoji, label }]) => ({ id, label: `${emoji} ${label}` })),
    },
    entryFilterFn: async (entries: ZendoCollectionEntry[], value: unknown): Promise<ZendoCollectionEntry[]> => {
      const selectedValues = value as string[] | undefined;

      if (!selectedValues || selectedValues.includes("all") || selectedValues.length === 0) {
        return entries;
      }

      return entries.filter((entry) => entry.collection === "recipes" && selectedValues.includes(entry.data.status));
    },
  };
}
